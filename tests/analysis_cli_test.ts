import { runCli } from "../src/cli.ts";
import { assert, rejects } from "./helpers.ts";
Deno.test("analysis help needs no environment or native permissions", async () => {
  assert((await runCli(["analyze", "--help"])).includes("lineup"));
  assert((await runCli(["sync", "--help"])).includes("offline"));
  await rejects(
    () => runCli(["analyze", "player", "bad"]),
    "positive safe integer",
  );
});
