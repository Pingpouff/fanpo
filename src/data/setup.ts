/** Provision a compatible native library for @db/sqlite, without API credentials. */
const directory = ".data";
const target = `${directory}/sqlite3`;
function verify() {
  const library = Deno.dlopen(target, {
    sqlite3_libversion: { parameters: [], result: "pointer" },
  });
  library.close();
}
let ready = false;
try {
  verify();
  ready = true;
} catch { /* Missing library or incompatible platform build. */ }
if (!ready) {
  await Deno.mkdir(directory, { recursive: true });
  const temporary = await Deno.makeTempFile({
    dir: directory,
    prefix: "sqlite3-",
  });
  try {
    let copied = false;
    // The release binary may require a newer glibc than the host. Prefer its system SQLite.
    if (Deno.build.os === "linux") {
      const triplet = Deno.build.arch === "aarch64"
        ? "aarch64-linux-gnu"
        : "x86_64-linux-gnu";
      for (
        const source of [
          `/lib/${triplet}/libsqlite3.so.0`,
          "/usr/lib/libsqlite3.so.0",
        ]
      ) {
        try {
          await Deno.copyFile(source, temporary);
          copied = true;
          break;
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) throw e;
        }
      }
    }
    if (!copied) {
      const suffix = Deno.build.arch === "aarch64" ? "_aarch64" : "";
      const file = Deno.build.os === "windows"
        ? `sqlite3${suffix}.dll`
        : Deno.build.os === "darwin"
        ? `libsqlite3${suffix}.dylib`
        : `libsqlite3${suffix}.so`;
      const response = await fetch(
        `https://github.com/denodrivers/sqlite3/releases/download/0.13.0/${file}`,
      );
      if (!response.ok) {
        throw new Error(
          `SQLite native library download failed: ${response.status}`,
        );
      }
      await Deno.writeFile(
        temporary,
        new Uint8Array(await response.arrayBuffer()),
      );
    }
    await Deno.rename(temporary, target);
    verify();
  } catch (e) {
    await Deno.remove(temporary).catch(() => {});
    throw e;
  }
}
