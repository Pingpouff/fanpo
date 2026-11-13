import { VERSION } from "../../src/release/version.ts";
import { applicationPaths } from "../../src/release/config.ts";
import { collectKit } from "../../src/release/kit.ts";

const executable = await Deno.realPath(
  Deno.args[0] ??
    `tmp/release/bin/${Deno.build.target}/fanpo${
      Deno.build.os === "windows" ? ".exe" : ""
    }`,
);
const directory = await Deno.makeTempDir({ prefix: "fanpo-smoke-" });
const env = {
  HOME: directory,
  LOCALAPPDATA: directory,
  XDG_CONFIG_HOME: `${directory}/config`,
  XDG_DATA_HOME: `${directory}/data`,
  XDG_CACHE_HOME: `${directory}/cache`,
  ...(Deno.env.get("SystemRoot")
    ? { SystemRoot: Deno.env.get("SystemRoot")! }
    : {}),
};
async function run(
  args: string[],
  success = true,
  additional: Record<string, string> = {},
) {
  const result = await new Deno.Command(executable, {
    args,
    cwd: directory,
    clearEnv: true,
    env: { ...env, ...additional },
    stdout: "piped",
    stderr: "piped",
  }).output();
  const stdout = new TextDecoder().decode(result.stdout),
    stderr = new TextDecoder().decode(result.stderr);
  if (result.success !== success) {
    throw new Error(`${args.join(" ")} (${result.code}): ${stderr}`);
  }
  if (success && stderr) throw new Error(`Unexpected stderr: ${stderr}`);
  return { stdout, stderr };
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
try {
  const help = (await run(["--help"])).stdout;
  assert(
    help.includes("fanpo") && !help.includes("deno task"),
    "Standalone help",
  );
  assert(
    (await run(["--version"])).stdout.trim() === VERSION,
    "Version mismatch",
  );
  const kit = `${directory}/agent-kit`;
  const exported = JSON.parse(
    (await run(["skills", "export", "--output", kit, "--json"])).stdout,
  );
  assert(exported.version === VERSION, "Export metadata");
  const expected = await collectKit();
  for (const [path, content] of Object.entries(expected)) {
    assert(
      await Deno.readTextFile(`${kit}/${path}`) === content,
      `Kit mismatch: ${path}`,
    );
  }
  assert(
    (await run(["skills", "export", "--output", kit], false)).stderr.includes(
      "already exists",
    ),
    "Overwrite protection",
  );
  // Empty local persistence requires SQLite, but no network or credentials.
  await run(["data", "status", "--json"], true, { DENO_SQLITE_LOCAL: "1" });
  const first = JSON.parse((await run(["data", "status", "--json"])).stdout);
  assert(first && typeof first === "object", "Status JSON");
  const paths = applicationPaths(Deno.build.os, env);
  assert(
    (await Deno.stat(paths.database)).size > 0,
    "Default database not created",
  );
  const explicit = `${directory}/custom.sqlite`;
  await run([
    "data",
    "status",
    "--db",
    explicit,
    "--nationchampionship",
    "--json",
  ]);
  assert((await Deno.stat(explicit)).size > 0, "Explicit database not created");
  // Seed a synthetic raw snapshot using the exact schema created by Fanpo,
  // then confirm a fresh executable process sees it through production CLI.
  const library =
    `${paths.cache}/sqlite-${VERSION}-${Deno.build.target}/sqlite3${
      Deno.build.os === "windows" ? ".dll" : ""
    }`;
  Deno.env.set("DENO_SQLITE_PATH", library);
  const { Store } = await import("../../src/data/store.ts");
  const scope = {
    origin: "https://fantasy.poneeey.fr",
    season: "smoke",
    profile: "release",
  };
  const store = new Store(explicit, scope);
  try {
    await store.save("/api/journees/cible", { numero: 6 }, 6);
    await store.save(
      "/api/joueurs",
      { joueurs: [], journee: { numero: 6 } },
      6,
    );
  } finally {
    store.close();
  }
  const status = (await run([
    "data",
    "status",
    "--db",
    explicit,
    "--season",
    "smoke",
    "--profile",
    "release",
    "--json",
  ])).stdout;
  assert(
    status.includes("/api/joueurs"),
    "Persisted synthetic snapshot missing",
  );
  // Environment-only authentication failure must be clean and nonzero.
  assert(
    (await run(["composition"], false)).stderr.includes("FANTASY_TOKEN"),
    "Missing token diagnostic",
  );
  // A damaged cache is repaired entirely from the executable.
  // Windows cannot replace a library loaded into this smoke-test process;
  // exercise extraction failure/recovery in unit tests there instead.
  if (Deno.build.os !== "windows") {
    await Deno.remove(library);
    await Deno.writeFile(library, new Uint8Array([0]));
    await run(["data", "status", "--json"]);
  }
  // A real user configuration is loaded, process overrides win, and working
  // directory .env files are never read by the standalone executable.
  await Deno.mkdir(paths.config.replace(/[/\\][^/\\]+$/, ""), {
    recursive: true,
  });
  await Deno.writeTextFile(
    paths.config,
    "FANTASY_API_URL=https://configured.invalid\n",
  );
  const configured = JSON.parse(
    (await run(["data", "status", "--json"])).stdout,
  );
  assert(
    configured.scope.origin === "https://configured.invalid",
    "User configuration ignored",
  );
  const overridden = JSON.parse(
    (await run(["data", "status", "--json"], true, {
      FANTASY_API_URL: "https://override.invalid",
    })).stdout,
  );
  assert(
    overridden.scope.origin === "https://override.invalid",
    "Process override ignored",
  );
  await Deno.remove(paths.config);
  await Deno.writeTextFile(
    `${directory}/.env`,
    "FANTASY_TOKEN=must-not-load\n",
  );
  assert(
    (await run(["composition"], false)).stderr.includes("FANTASY_TOKEN"),
    "Working directory token was loaded",
  );
  console.log(`Standalone smoke passed: ${Deno.build.target}`);
} finally {
  // SQLite's FFI DLL remains loaded into this test process on Windows.
  if (Deno.build.os !== "windows") {
    await Deno.remove(directory, { recursive: true });
  }
}
