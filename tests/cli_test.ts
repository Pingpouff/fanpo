import { stripAnsi } from "../src/cli/shared/colors.ts";
import { runCli } from "../src/cli.ts";
import { ValidationError } from "@cliffy/command";
import { FantasyClient } from "../src/client.ts";
import type { PlayerSheetResponse, PlayersResponse } from "../src/types.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { response, sheetResponse } from "./fixtures.ts";

function client(
  payload: PlayersResponse | PlayerSheetResponse = response,
): FantasyClient {
  return new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(Response.json(payload)),
  });
}

Deno.test("CLI JSON preserves the response envelope and filters only players", async () => {
  const output: PlayersResponse = JSON.parse(
    await runCli(
      ["players", "--json", "--club", "ubb", "--available"],
      client(),
    ),
  );
  equal(output.joueurs.map((p) => p.id), [1]);
  equal(output.journee, response.journee);
  equal(output.additional_response_field, "preserved");
  equal(output.joueurs[0].additional_player_field, { score: 5 });
});

Deno.test("CLI table displays players, values and unavailable status", async () => {
  const output = await runCli(["players"], client());
  for (
    const text of [
      "NAME",
      "CLUB",
      "POSITION",
      "VALUE",
      "AVERAGE",
      "AVAILABLE",
      "Demba Bamba",
      "Alex Martin",
      "12.50",
      "yes",
      "no",
    ]
  ) {
    assert(stripAnsi(output).includes(text), `Missing ${text}`);
  }
});

Deno.test("CLI applies name and position filters together", async () => {
  const output = await runCli([
    "players",
    "--position",
    "pil",
    "--name",
    "bamba",
  ], client());
  assert(output.includes("Demba Bamba"));
  assert(!output.includes("Alex Martin"));
});

Deno.test("CLI handles empty results in both output modes", async () => {
  equal(
    stripAnsi(await runCli(["players", "--name", "unknown"], client())),
    "No players found.",
  );
  const output = JSON.parse(
    await runCli(["players", "--json", "--name", "unknown"], client()),
  );
  equal(output.joueurs, []);
});

Deno.test("CLI help works without environment or network permissions", async () => {
  for (const args of [[], ["--help"], ["-h"], ["players", "--help"]]) {
    assert((await runCli(args)).includes("players"));
  }
});

Deno.test("CLI rejects unknown commands, options and missing filter values before fetching", async () => {
  for (
    const args of [
      ["teams"],
      ["players", "--unknown"],
      ["players", "extra"],
      ["players", "--club"],
      ["players", "--name", "--json"],
      ["players", "--position", "  "],
    ]
  ) {
    const error = await rejects(() => runCli(args), "");
    assert(
      error instanceof ValidationError,
      `${JSON.stringify(args)}: ${error.name} ${error.message}`,
    );
  }
});

Deno.test("CLI propagates HTTP errors instead of producing JSON", async () => {
  const failingClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(new Response(null, { status: 401 })),
  });
  await rejects(() => runCli(["players", "--json"], failingClient), "HTTP 401");
});

Deno.test("player CLI JSON emits the full sheet including evolving statistics", async () => {
  const output: PlayerSheetResponse = JSON.parse(
    await runCli(
      ["player", "825", "--json", "--detailed"],
      client(sheetResponse),
    ),
  );
  equal(output, sheetResponse);
  equal(output.perfs[0].stats.future_numeric_stat, 12.5);
});

Deno.test("player quick JSON omits only aggregate and match stats", async () => {
  const output = JSON.parse(
    await runCli(["player", "825", "--json"], client(sheetResponse)),
  );
  assert(!("stats" in output));
  assert(
    output.perfs.every((perf: Record<string, unknown>) => !("stats" in perf)),
  );
  equal(output.joueur, sheetResponse.joueur);
  equal(output.selection, sheetResponse.selection);
  equal(output.perfs[0].note, "83.76");
  equal(output.perfs[0].extra_performance_field, "preserved");
  equal(output.extra_sheet_field, "preserved");
  equal(sheetResponse.perfs[0].stats.tackles, 17);
  equal(sheetResponse.stats.moyenne, 73.915);
});

Deno.test("player stats alias emits the complete JSON response", async () => {
  equal(
    JSON.parse(
      await runCli(
        ["player", "825", "--stats", "--json"],
        client(sheetResponse),
      ),
    ),
    sheetResponse,
  );
});

Deno.test("player detailed terminal view includes aggregate and each round's match stats", async () => {
  for (const flag of ["--detailed", "--stats"]) {
    const output = await runCli(["player", "825", flag], client(sheetResponse));
    for (
      const text of [
        "Beka Gorgadze",
        "Aggregate stats",
        "points_marques",
        "Round 1 stats",
        "Round 2 stats",
        "tackles",
        "17",
        "future_numeric_stat",
        "12.5",
      ]
    ) {
      assert(stripAnsi(output).includes(text), `Missing ${text}`);
    }
  }
});

Deno.test("player CLI displays a compact identity, performance and aggregate summary", async () => {
  const output = await runCli(["player", "825"], client(sheetResponse));
  for (
    const text of [
      "Beka Gorgadze",
      "Section Paloise",
      "N8 / TL",
      "Value: 0.94",
      "Round",
      "Opp",
      "H/A",
      "Starter",
      "Min",
      "Score",
      "MHR",
      "Away",
      "yes",
      "65",
      "83.76",
      "AB",
      "Home",
      "no",
      "28",
      "64.07",
      "Average: 73.92",
      "Best: 83.76",
      "Worst: 64.07",
      "Tries: 0",
    ]
  ) {
    assert(stripAnsi(output).includes(text), `Missing ${text}`);
  }
  assert(!output.includes("tackles"));
  assert(!output.includes("future_numeric_stat"));
});

Deno.test("player CLI handles no performances and nullable scores and positions", async () => {
  const sheet: PlayerSheetResponse = {
    ...sheetResponse,
    joueur: {
      ...sheetResponse.joueur,
      taille_cm: null,
      poids_kg: null,
      poste_secondaire: null,
    },
    perfs: [],
    stats: {
      ...sheetResponse.stats,
      moyenne: null,
      meilleure: null,
      pire: null,
    },
  };
  const output = await runCli(["player", "825"], client(sheet));
  assert(output.includes("No performances yet."));
  assert(stripAnsi(output).includes("Average: -"));
  assert(stripAnsi(output).includes("Best: -"));
  assert(!output.includes("null"));
  assert(!output.includes("N8 /"));
});

Deno.test("player CLI distinguishes unknown status from substitute and away", async () => {
  const sheet: PlayerSheetResponse = {
    ...sheetResponse,
    perfs: [{
      ...sheetResponse.perfs[0],
      note: null,
      minutes_jouees: null,
      titulaire: null,
      poste_joue: null,
      domicile: null,
    }],
  };
  const output = await runCli(["player", "825"], client(sheet));
  assert(!output.includes("Away"));
  assert(!output.includes("yes"));
  assert(!output.includes("no"));
  assert(!output.includes("null"));
});

Deno.test("player CLI rejects missing, malformed and unsafe IDs and unsupported options", async () => {
  for (
    const args of [
      ["player"],
      ["player", "0"],
      ["player", "-1"],
      ["player", "1.5"],
      ["player", "825/fiche"],
      ["player", "NaN"],
      ["player", "1e3"],
      ["player", "9007199254740992"],
    ]
  ) {
    const error = await rejects(() => runCli(args), "");
    assert(error instanceof ValidationError);
  }
  for (
    const args of [["player", "825", "--club", "SP"], ["player", "825", "bad"]]
  ) {
    const error = await rejects(() => runCli(args), "");
    assert(error instanceof ValidationError);
  }
});

Deno.test("multi-player CLI preserves order and quick/detailed views", async () => {
  const multiClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: (url) => {
      const id = Number(url.pathname.split("/")[3]);
      return Promise.resolve(Response.json({
        ...sheetResponse,
        joueur: { ...sheetResponse.joueur, id, prenom: `Player${id}` },
      }));
    },
  });
  for (const flag of ["--detailed", "--stats"]) {
    const sheets = JSON.parse(
      await runCli(
        ["player", "826", "825", flag, "--json"],
        multiClient,
      ),
    );
    equal(sheets.map((s: PlayerSheetResponse) => s.joueur.id), [826, 825]);
    equal(sheets[0].stats, sheetResponse.stats);
    equal(sheets[1].perfs, sheetResponse.perfs);
  }
  const quick = JSON.parse(
    await runCli(["player", "826", "825", "--json"], multiClient),
  );
  assert(quick.every((s: Record<string, unknown>) => !("stats" in s)));
  assert(
    quick.every((s: PlayerSheetResponse) =>
      s.perfs.every((p) => !("stats" in p))
    ),
  );
  for (const flags of [[], ["--detailed"]]) {
    const text = await runCli(["player", "826", "825", ...flags], multiClient);
    assert(text.indexOf("Player826") < text.indexOf("Player825"));
    equal(text.includes("Aggregate stats"), flags.length > 0);
  }
});

Deno.test("CLI accepts equals syntax for string filters", async () => {
  const output = JSON.parse(
    await runCli(["players", "--club=UBB", "--name=Bamba", "--json"], client()),
  );
  equal(output.joueurs.map((player: { id: number }) => player.id), [1]);
});

Deno.test("generated help shows only options belonging to the selected command", async () => {
  const playersHelp = await runCli(["players", "--help"]);
  assert(playersHelp.includes("--club"));
  assert(!playersHelp.includes("--detailed"));
  const playerHelp = await runCli(["player", "--help"]);
  assert(playerHelp.includes("--detailed"));
  assert(playerHelp.includes("--stats"));
  assert(!playerHelp.includes("--club"));
});

Deno.test("player CLI help needs no configuration or network", async () => {
  for (
    const args of [["player", "--help"], ["player", "-h"], [
      "player",
      "825",
      "--help",
    ]]
  ) {
    assert((await runCli(args)).includes("player <id>"));
  }
});

Deno.test("player CLI propagates missing-player HTTP errors", async () => {
  const failingClient = new FantasyClient({
    baseUrl: "https://example.test",
    token: "test-token",
    fetch: () => Promise.resolve(new Response(null, { status: 404 })),
  });
  await rejects(
    () => runCli(["player", "825", "--json"], failingClient),
    "HTTP 404",
  );
});
