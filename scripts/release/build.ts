import { KIT_SOURCES } from "../../src/release/kit.ts";
import native from "./native.json" with { type: "json" };

if (Deno.version.deno !== "2.9.7") {
  throw new Error(
    "Release builds require Deno 2.9.7 to match the pinned runtime and notices",
  );
}

// A native build is intentional: every published target is executed in CI.
const target = Deno.build.target;
const output = `tmp/release/bin/${target}`;
const nativeDirectory = `tmp/release/native/${target}`;
await Deno.mkdir(output, { recursive: true });
await Deno.mkdir(nativeDirectory, { recursive: true });

async function run(command: string, args: string[]) {
  const result = await new Deno.Command(command, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  if (!result.success) throw new Error(`${command} failed (${result.code})`);
}
async function download(url: string, sha256: string, path: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = [
    ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  ].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (digest !== sha256) throw new Error(`Checksum mismatch: ${url}`);
  await Deno.writeFile(path, bytes);
}
if (Deno.build.os === "linux") {
  const archive = "tmp/release/sqlite-source.zip";
  await download(native.linuxSource.url, native.linuxSource.sha256, archive);
  await run("unzip", ["-qo", archive, "-d", "tmp/release"]);
  await run("cc", [
    "-shared",
    "-fPIC",
    "-O2",
    "-DSQLITE_THREADSAFE=1",
    "-DSQLITE_ENABLE_COLUMN_METADATA",
    "-DSQLITE_ENABLE_FTS5",
    `tmp/release/${native.linuxSource.directory}/sqlite3.c`,
    "-o",
    `${nativeDirectory}/sqlite3`,
    "-lm",
    "-ldl",
    "-lpthread",
  ]);
} else {
  const asset = native[target as keyof typeof native];
  if (!asset || !("file" in asset)) {
    throw new Error(`Unsupported target: ${target}`);
  }
  await download(
    `https://github.com/denodrivers/sqlite3/releases/download/0.13.0/${asset.file}`,
    asset.sha256,
    `${nativeDirectory}/sqlite3`,
  );
}
const binary = `${output}/fanpo${Deno.build.os === "windows" ? ".exe" : ""}`;
await run(Deno.execPath(), [
  "compile",
  "--frozen",
  "--no-prompt",
  // Arbitrary proposal/database/export paths are supported. No subprocesses.
  "--allow-read",
  "--allow-write",
  "--allow-ffi",
  "--allow-env=FANTASY_TOKEN,FANTASY_API_URL,DENO_SQLITE_PATH,DENO_SQLITE_LOCAL,HOME,LOCALAPPDATA,XDG_CONFIG_HOME,XDG_DATA_HOME,XDG_CACHE_HOME",
  // Custom API hosts remain a source-run development feature.
  "--allow-net=fantasy.poneeey.fr:443",
  ...KIT_SOURCES.map((path) => `--include=${path}`),
  `--include=${nativeDirectory}/sqlite3`,
  "--output",
  binary,
  "src/release/main.ts",
]);
console.log(`Built ${binary}`);
