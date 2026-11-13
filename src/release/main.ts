import { cliMain } from "../cli.ts";
import { applicationPaths, loadUserEnvironment } from "./config.ts";
import { prepareSqlite } from "./sqlite.ts";

try {
  // Help and kit export work even without HOME, credentials or writable storage.
  const informational = !Deno.args.length ||
    Deno.args.some((arg) =>
      ["--help", "-h", "--version", "-V"].includes(arg)
    ) ||
    Deno.args[0] === "skills";
  const paths = informational ? undefined : applicationPaths(Deno.build.os, {
    HOME: Deno.env.get("HOME"),
    LOCALAPPDATA: Deno.env.get("LOCALAPPDATA"),
    XDG_CONFIG_HOME: Deno.env.get("XDG_CONFIG_HOME"),
    XDG_DATA_HOME: Deno.env.get("XDG_DATA_HOME"),
    XDG_CACHE_HOME: Deno.env.get("XDG_CACHE_HOME"),
  });
  if (paths) await loadUserEnvironment(paths.config);
  await cliMain(Deno.args, {
    name: "fanpo",
    defaultDatabase: paths?.database,
    prepareSqlite: paths ? () => prepareSqlite(paths.cache) : undefined,
  });
} catch (error) {
  console.error(
    `Error: ${error instanceof Error ? error.message : "Unexpected failure"}`,
  );
  Deno.exitCode = 1;
}
