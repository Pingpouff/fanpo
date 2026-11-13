import { VERSION } from "./version.ts";

const verify = (path: string) => {
  Deno.dlopen(path, {
    sqlite3_libversion: { parameters: [], result: "pointer" },
  }).close();
};

/** Verify before publishing; a concurrent process may have installed it first. */
export async function extractLibrary(
  target: string,
  bytes: Uint8Array,
  validate: (path: string) => void = verify,
): Promise<void> {
  try {
    validate(target);
    return;
  } catch { /* Missing or damaged cache. */ }
  const parent = target.replace(/[/\\][^/\\]+$/, "");
  await Deno.mkdir(parent, { recursive: true });
  const temporary = await Deno.makeTempFile({
    dir: parent,
    prefix: "sqlite-",
    suffix: Deno.build.os === "windows" ? ".dll" : ".so",
  });
  try {
    await Deno.writeFile(temporary, bytes, { mode: 0o600 });
    validate(temporary);
    try {
      await Deno.rename(temporary, target);
    } catch (error) {
      // Windows cannot replace an open DLL. Accept only a valid winner.
      try {
        validate(target);
      } catch {
        throw error;
      }
    }
  } finally {
    await Deno.remove(temporary).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

export async function prepareSqlite(cache: string): Promise<void> {
  // LOCAL is the upstream wrapper’s development-only build directory and wins
  // over PATH unless removed. Preserve the source CLI’s behavior separately.
  Deno.env.delete("DENO_SQLITE_LOCAL");
  if (Deno.env.get("DENO_SQLITE_PATH")) return;
  const target = `${cache}/sqlite-${VERSION}-${Deno.build.target}/sqlite3${
    Deno.build.os === "windows" ? ".dll" : ""
  }`;
  // Avoid reading embedded assets when a usable library is already cached.
  try {
    verify(target);
  } catch {
    const asset = new URL(
      `../../tmp/release/native/${Deno.build.target}/sqlite3`,
      import.meta.url,
    );
    await extractLibrary(target, await Deno.readFile(asset));
  }
  Deno.env.set("DENO_SQLITE_PATH", target);
}
