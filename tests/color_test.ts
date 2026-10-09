import {
  colorRating,
  humanColors,
  ratingColor,
  signed,
  stripAnsi,
} from "../src/cli/shared/colors.ts";
import { renderTable } from "../src/cli/shared/output.ts";
import { runCli } from "../src/cli.ts";
import { FantasyClient } from "../src/client.ts";
import { response, sheetResponse } from "./fixtures.ts";
import { historicalComposition } from "./composition_fixtures.ts";
import { currentComposition } from "./composition_fixtures.ts";
import { renderHistoricalComposition } from "../src/cli/composition/journee/output.ts";
import { renderPlayerSheet } from "../src/cli/joueurs/fiche/output.ts";
import { renderRound, renderTeamsheets } from "../src/cli/context/output.ts";
import { assert, equal } from "./helpers.ts";
Deno.test("rating colors match the Fantasy site including exact boundaries and missing ratings", () => {
  for (
    const [score, color] of [
      [0, "#D9432F"],
      [49.99, "#D9432F"],
      [50, "#E08A2E"],
      [69.99, "#E08A2E"],
      [70, "#2E7CD9"],
      [79.99, "#2E7CD9"],
      [80, "#2F9E58"],
      [89.99, "#2F9E58"],
      [90, "#8B4FD9"],
      [100, "#8B4FD9"],
      [null, "#5a5f58"],
      [NaN, "#5a5f58"],
    ] as const
  ) equal(ratingColor(score), color);
  assert(colorRating(83.76).includes("\x1b[38;2;47;158;88m"));
  equal(stripAnsi(colorRating(null)), "-");
});
Deno.test("colored table cells preserve alignment after ANSI escapes are removed", () => {
  const plain = stripAnsi(
    renderTable([["Rating", "Name"], [colorRating(9), "One"], [
      colorRating(100),
      "Two",
    ]]),
  );
  const rows = plain.split("\n");
  equal(rows[1].indexOf("One"), rows[2].indexOf("Two"));
  equal(rows[0].indexOf("Name"), rows[1].indexOf("One"));
});
Deno.test("CLI colors ratings by default, no-color removes all ANSI, JSON stays uncolored with debug too", async () => {
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (url) =>
      Promise.resolve(
        Response.json(
          url.pathname.endsWith("/fiche") ? sheetResponse : response,
        ),
      ),
  });
  const color = await runCli(["player", "825"], client);
  assert(color.includes("\x1b[38;2;47;158;88m83.76"));
  equal(
    await runCli(["player", "825", "--no-color"], client),
    stripAnsi(color),
  );
  const help = await runCli(["--help"]);
  assert(help.includes("--no-color"));
  assert(help.includes("\x1b["));
  assert(!(await runCli(["--no-color", "--help"])).includes("\x1b["));
  const debug = await runCli(
    ["player", "825", "--debug", "--no-color"],
    client,
  );
  assert(debug.includes("Request metadata"));
  assert(!debug.includes("\x1b["));
  for (
    const args of [["players", "--json"], ["players", "--debug", "--json"], [
      "players",
      "--no-color",
      "--json",
    ]]
  ) {
    const text = await runCli(args, client);
    assert(!text.includes("\x1b["));
    JSON.parse(text);
  }
});

Deno.test("historical fantasy points retain the raw rating color after captain multipliers", () => {
  const output = renderHistoricalComposition(historicalComposition);
  const captainLine = output.split("\n").find((line) =>
    line.includes("[C-auto]")
  );
  assert(captainLine?.includes("\x1b[38;2;46;124;217m70.15"));
  assert(captainLine?.includes("\x1b[38;2;46;124;217m140.30"));
});

Deno.test("detailed aggregate ratings use the same bands as summary ratings", () => {
  const text = renderPlayerSheet({
    ...sheetResponse,
    stats: { ...sheetResponse.stats, moyenne: 75, meilleure: 95, pire: 45 },
  }, { detailed: true });
  const aggregate = text.slice(text.indexOf("Aggregate stats:"));
  assert(aggregate.includes("\x1b[38;2;46;124;217m75"));
  assert(aggregate.includes("\x1b[38;2;139;79;217m95"));
  assert(aggregate.includes("\x1b[38;2;217;67;47m45"));
});

Deno.test("round summaries and teamsheet roles have semantic foreground colors", () => {
  const round = renderRound(response.journee);
  assert(round.includes("\x1b[38;2;"));
  const teamsheets = renderTeamsheets({
    journee: 6,
    clubs_annonces: ["ST"],
    joueurs: { "1": 1, "2": 16 },
    notes_provisoires: false,
  });
  assert(teamsheets.includes("\x1b[38;2;47;158;88mStarter"));
  assert(teamsheets.includes("\x1b[38;2;224;138;46mSubstitute"));
});

Deno.test("presentation does not recolor status words inside player names or warnings", () => {
  const text =
    "Fresh Smith | Released Jones\nWarning: Fresh does not mean VALID";
  const output = humanColors(text);
  assert(output.startsWith("Fresh Smith | Released Jones\n"));
  equal(stripAnsi(output), text);
});

Deno.test("advantage colors reverse for costs and stay neutral for zero or unresolved", () => {
  assert(signed(1, "+1").includes("\x1b[38;2;47;158;88m"));
  assert(signed(-1, "-1").includes("\x1b[38;2;217;67;47m"));
  assert(signed(-1, "-1", true).includes("\x1b[38;2;47;158;88m"));
  assert(signed(1, "+1", true).includes("\x1b[38;2;217;67;47m"));
  for (const value of [0, null, NaN]) {
    assert(signed(value, "value").includes("\x1b[38;2;138;145;136m"));
  }
});

Deno.test("API tables keep identical visible content in color and plain modes and JSON has no ANSI", async () => {
  const cases: [string[], unknown][] = [
    [["players"], response],
    [["player", "825", "--detailed"], sheetResponse],
    [["composition"], currentComposition],
    [["composition", "--round", "4", "--detailed"], historicalComposition],
    [["top14", "standings"], {
      classement: [{
        position: 1,
        abrev: "ST",
        joues: 5,
        points: 20,
        victoires: 4,
        nuls: 0,
        defaites: 1,
        diff: 70,
      }],
    }],
    [["top14", "matches"], {
      matchs: [{
        journee: 6,
        date: "2026-10-10",
        dom: { abrev: "ST", score: 40 },
        ext: { abrev: "UBB", score: 12 },
        statut: "termine",
      }],
    }],
  ];
  for (const [args, payload] of cases) {
    const client = new FantasyClient({
      baseUrl: "https://example.com",
      token: "test",
      fetch: () => Promise.resolve(Response.json(payload)),
    });
    const colored = await runCli(args, client);
    assert(colored.includes("\x1b[38;2;"), args.join(" "));
    equal(await runCli([...args, "--no-color"], client), stripAnsi(colored));
    const json = await runCli([...args, "--json"], client);
    assert(!json.includes("\x1b"));
    equal(JSON.parse(json), payload);
  }
});
