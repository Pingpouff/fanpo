import { runCli } from "../src/cli.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { Store } from "../src/data/store.ts";
import { player, response } from "./fixtures.ts";
import { stripAnsi } from "../src/cli/shared/colors.ts";
Deno.test("analysis help needs no environment or native permissions", async () => {
  assert((await runCli(["analyze", "--help"])).includes("lineup"));
  assert((await runCli(["sync", "--help"])).includes("offline"));
  await rejects(
    () => runCli(["analyze", "player", "bad"]),
    "positive safe integer",
  );
});

Deno.test("candidate CLI validates proposal syntax before accessing data", async () => {
  assert((await runCli(["compare", "--help"])).includes("--candidate"));
  for (
    const candidate of ["Manu", "Manu:0=883", "Manu:11=0", "Manu:11=883,11=834"]
  ) {
    await rejects(
      () => runCli(["compare", "--candidate", candidate]),
      "Invalid candidate",
    );
  }
  await rejects(
    () => runCli(["compare"]),
    "Supply --alternative or --candidate",
  );
  await rejects(
    () =>
      runCli([
        "compare",
        "--alternative",
        ".data/missing.json",
        "--candidate",
        "Manu:11=883",
      ]),
    "Use either",
  );
  await rejects(
    () =>
      runCli([
        "compare",
        "--candidate",
        "Same:11=883",
        "--candidate",
        "Same:12=834",
      ]),
    "Duplicate candidate name",
  );
});

Deno.test("cached player CLI never requests credentials or HTTP and preserves presentation and metadata", async () => {
  const path = await Deno.makeTempFile({ suffix: ".sqlite" });
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "catalogue-test",
  };
  const store = new Store(path, scope);
  try {
    await store.save("/api/journees/cible", { numero: 6 }, 6);
    await store.save("/api/joueurs", {
      ...response,
      journee: { ...response.journee, numero: 6 },
      joueurs: [player({ poste_secondaire: "TL", moyenne: 80 })],
    }, 6);
  } finally {
    store.close();
  }
  const args = [
    "data",
    "players",
    "--db",
    path,
    "--origin",
    scope.origin,
    "--season",
    scope.season,
    "--profile",
    scope.profile,
    "--position",
    "TL",
    "--name",
    "Bamba",
    "--available",
  ];
  try {
    // No client or FANTASY_TOKEN permission: attempting authentication fails this test.
    const colored = await runCli(args);
    assert(colored.includes("Demba Bamba"));
    assert(colored.includes("\x1b[38;2;47;158;88m80"));
    assert(!colored.includes("Request metadata"));
    equal(await runCli([...args, "--no-color"]), stripAnsi(colored));
    const plainJson = await runCli([...args, "--json"]);
    assert(!plainJson.includes("\x1b"));
    const value = JSON.parse(plainJson);
    equal(value.players.map((p: { id: number }) => p.id), [1]);
    equal(value.evidence.stale, false);
    equal(value.round, 6);
    const debug = JSON.parse(
      await runCli([...args, "--json", "--debug", "--force"]),
    );
    equal(debug.data, value);
    equal(debug.metadata.requestCount, 0);
    equal(debug.metadata.dataAccess[0].storage, "reused");
    equal(debug.metadata.dataAccess[0].cacheStatus, "fresh");
    assert(debug.metadata.dataAccess[0].cacheBytes > 0);
    const humanDebug = await runCli([...args, "--debug", "--no-color"]);
    assert(humanDebug.includes("Request metadata"));
    assert(!humanDebug.includes("\x1b"));
    const empty = await runCli([...args, "--club", "missing", "--no-color"]);
    assert(empty.includes("No players found."));
    await rejects(
      () => runCli(args.map((arg) => arg === scope.profile ? "missing" : arg)),
      "Cached player catalogue unavailable. Run sync online.",
    );
  } finally {
    await Deno.remove(path);
  }
});
