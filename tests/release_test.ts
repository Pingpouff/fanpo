import { assert, equal, rejects, throws } from "./helpers.ts";
import { applicationPaths, parseEnvironment } from "../src/release/config.ts";
import { extractLibrary } from "../src/release/sqlite.ts";
import { exportKit } from "../src/release/kit.ts";
import { runCli } from "../src/cli.ts";

Deno.test("release paths respect platform conventions and XDG overrides", () => {
  equal(applicationPaths("linux", { HOME: "/users/test" }), {
    config: "/users/test/.config/fanpo/env",
    database: "/users/test/.local/share/fanpo/fanpo.sqlite",
    cache: "/users/test/.cache/fanpo",
  });
  equal(
    applicationPaths("linux", {
      XDG_CONFIG_HOME: "/c",
      XDG_DATA_HOME: "/d",
      XDG_CACHE_HOME: "/k",
    }),
    {
      config: "/c/fanpo/env",
      database: "/d/fanpo/fanpo.sqlite",
      cache: "/k/fanpo",
    },
  );
  assert(
    applicationPaths("darwin", { HOME: "/u" }).database.includes(
      "Library/Application Support/Fanpo/",
    ),
  );
  equal(
    applicationPaths("windows", {
      LOCALAPPDATA: "C:\\Users\\me\\AppData\\Local",
    }).config,
    "C:\\Users\\me\\AppData\\Local\\Fanpo\\env",
  );
  throws(() => applicationPaths("linux", {}), "HOME");
});

Deno.test("release env parser preserves process values and rejects unsupported settings without leaking secrets", () => {
  equal(
    parseEnvironment(
      '# comment\nFANTASY_TOKEN="file-token"\nFANTASY_API_URL=https://example.test\n',
      { FANTASY_TOKEN: "process-token" },
    ),
    { FANTASY_TOKEN: "process-token", FANTASY_API_URL: "https://example.test" },
  );
  throws(
    () => parseEnvironment("SECRET=do-not-print", {}),
    "Unsupported configuration key",
  );
  throws(
    () => parseEnvironment("FANTASY_TOKEN='unterminated", {}),
    "Invalid configuration",
  );
});

Deno.test("native extraction reuses verified content and recovers from corruption or failed validation", async () => {
  const dir = await Deno.makeTempDir();
  const path = `${dir}/native/sqlite3`;
  const bytes = new Uint8Array([1, 2, 3]);
  const verify = (file: string) => {
    equal([...Deno.readFileSync(file)], [...bytes]);
  };
  try {
    await extractLibrary(path, bytes, verify);
    await Deno.writeFile(path, new Uint8Array([9]));
    await extractLibrary(path, bytes, verify);
    equal([...await Deno.readFile(path)], [1, 2, 3]);
    await rejects(() =>
      extractLibrary(`${dir}/bad/sqlite3`, bytes, () => {
        throw new Error("incompatible");
      }), "incompatible");
    equal([...Deno.readDirSync(`${dir}/bad`)].length, 0);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("agent kit export refuses overwrite, traversal and has matching version metadata", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const files = {
      "AGENTS.md": "Start here",
      "manifest.json": '{"version":"0.1.0"}',
    };
    await exportKit(`${dir}/kit`, files);
    equal(await Deno.readTextFile(`${dir}/kit/AGENTS.md`), "Start here");
    await rejects(() => exportKit(`${dir}/kit`, files), "already exists");
    await rejects(
      () => exportKit(`${dir}/escape`, { "../secret": "bad" }),
      "Unsafe",
    );
    assert(
      !(await Array.fromAsync(Deno.readDir(dir))).some((f) =>
        f.name === "secret"
      ),
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("CLI version and skill help require no token or native initialization", async () => {
  assert((await runCli(["--version"])).includes("0.1.0"));
  assert((await runCli(["skills", "export", "--help"])).includes("--output"));
});

Deno.test("standalone command help describes embedded SQLite", async () => {
  const text = await runCli(["sync", "--help"], undefined, undefined, {
    name: "fanpo",
  });
  assert(
    !text.includes("deno task"),
    "Standalone help must not require source tasks",
  );
  assert(text.includes("SQLite is included"));
});

Deno.test("standalone CLI preserves literal API strings in JSON", async () => {
  const { FantasyClient } = await import("../src/client.ts");
  const { response } = await import("./fixtures.ts");
  const client = new FantasyClient({
    baseUrl: "https://example.test",
    token: "synthetic",
    fetch: () =>
      Promise.resolve(
        Response.json({
          ...response,
          additional_response_field: "deno task cli",
        }),
      ),
  });
  const result = JSON.parse(
    await runCli(["players", "--json"], client, undefined, { name: "fanpo" }),
  );
  equal(result.additional_response_field, "deno task cli");
});

Deno.test("standalone native override takes precedence over development LOCAL mode", async () => {
  const { prepareSqlite } = await import("../src/release/sqlite.ts");
  const previous = Deno.env.get("DENO_SQLITE_LOCAL");
  try {
    Deno.env.set("DENO_SQLITE_LOCAL", "1");
    await prepareSqlite("/tmp/unused-fanpo-cache");
    equal(Deno.env.get("DENO_SQLITE_LOCAL"), undefined);
  } finally {
    if (previous === undefined) Deno.env.delete("DENO_SQLITE_LOCAL");
    else Deno.env.set("DENO_SQLITE_LOCAL", previous);
  }
});

Deno.test("agent kit accepts Windows checkout line endings", async () => {
  const { collectKit } = await import("../src/release/kit.ts");
  const files = await collectKit((path: string) =>
    Promise.resolve(
      path === "docs/getting-started.md"
        ? "# Setup\r\n\r\n## Get your token\r\n\r\nToken instructions\r\n\r\n## Next\r\n"
        : "# Reference\r\n",
    )
  );
  assert(files["docs/getting-started.md"].includes("Token instructions"));
  assert(Object.values(files).every((text) => !text.includes("\r")));
});
