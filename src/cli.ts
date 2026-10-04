import { FantasyClient } from "./client.ts";
import { loadConfig } from "./config.ts";
import { filterPlayers, type PlayerFilters } from "./filters.ts";
import type { Player, PlayerSheetResponse } from "./types.ts";

const HELP = `Usage: deno task cli players [options]
       deno task cli player <id> [--json] [--detailed]

Options:
  --json             Output the API response as JSON
  --detailed         Player: include aggregate and per-round stats (alias: --stats)
  --club CODE        Players: match a club code (case insensitive)
  --position CODE    Players: match any listed position (case insensitive)
  --name TEXT        Players: match a full-name substring (case insensitive)
  --available        Players: exclude unavailable players
  --help, -h         Show this help

Filters run locally and can be combined.
Player defaults to a quick view; quick JSON omits aggregate and per-round stats.
Requires FANTASY_TOKEN; FANTASY_API_URL defaults to https://fantasy.poneeey.fr.`;

function parseArgs(args: readonly string[]) {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { help: true, json: false, filters: {} };
  }
  if (args[0] !== "players") {
    throw new Error(`Unknown command: ${args[0]}. Use --help.`);
  }
  const filters: PlayerFilters = {};
  let json = false;
  let help = false;
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--json":
        json = true;
        break;
      case "--available":
        filters.available = true;
        break;
      case "--help":
      case "-h":
        help = true;
        break;
      case "--club":
      case "--position":
      case "--name": {
        const value = args[++i]?.trim();
        if (!value || value.startsWith("-")) {
          throw new Error(`${arg} requires a value.`);
        }
        const key = arg.slice(2) as "club" | "position" | "name";
        filters[key] = value;
        break;
      }
      default:
        throw new Error(`Unknown option: ${arg}. Use --help.`);
    }
  }
  return { help, json, filters };
}

function table(players: Player[]): string {
  if (players.length === 0) return "No players found.";
  return renderTable([
    ["ID", "NAME", "CLUB", "POSITION", "VALUE", "AVERAGE", "AVAILABLE"],
    ...players.map((p) => [
      String(p.id),
      `${p.prenom} ${p.nom}`,
      p.club,
      p.poste,
      p.valeur,
      String(p.moyenne ?? "-"),
      p.indisponible ? "no" : "yes",
    ]),
  ]);
}

function renderTable(input: string[][]): string {
  const rows = input.map((row) => row.map((cell) => cell.replace(/\s+/g, " ")));
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => row[i].length))
  );
  return rows.map((row) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd()
  )
    .join("\n");
}

function parsePlayerArgs(args: readonly string[]) {
  if (args[1] === "--help" || args[1] === "-h") {
    return { help: true, json: false, detailed: false, playerId: 0 };
  }
  const playerId = Number(args[1]);
  if (
    !/^\d+$/.test(args[1] ?? "") || !Number.isSafeInteger(playerId) ||
    playerId <= 0
  ) {
    throw new Error(
      "A player ID is required and must be a positive safe integer.",
    );
  }
  let json = false;
  let help = false;
  let detailed = false;
  for (const arg of args.slice(2)) {
    if (arg === "--json") json = true;
    else if (arg === "--detailed" || arg === "--stats") detailed = true;
    else if (arg === "--help" || arg === "-h") help = true;
    else throw new Error(`Unknown option: ${arg}. Use --help.`);
  }
  return { help, json, detailed, playerId };
}

function quickSheet(sheet: PlayerSheetResponse) {
  const { stats: _stats, perfs, ...rest } = sheet;
  return {
    ...rest,
    perfs: perfs.map(({ stats: _stats, ...performance }) => performance),
  };
}

function sheetDetails(sheet: PlayerSheetResponse): string {
  return [
    sheetSummary(sheet),
    "Aggregate stats:",
    renderTable(
      Object.entries(sheet.stats).map((
        [key, value],
      ) => [key, String(value ?? "-")]),
    ),
    ...sheet.perfs.map((perf) =>
      `Round ${perf.numero} stats:\n` +
      (Object.keys(perf.stats).length === 0 ? "No match stats." : renderTable(
        Object.entries(perf.stats).map((
          [key, value],
        ) => [key, String(value)]),
      ))
    ),
  ].join("\n\n");
}

function sheetSummary(sheet: PlayerSheetResponse): string {
  const { joueur: player, perfs, stats } = sheet;
  const positions = [
    player.poste_principal,
    player.poste_secondaire,
    player.poste_tertiaire,
  ]
    .filter((position) => position != null).join(" / ");
  const performances = perfs.length === 0
    ? "No performances yet."
    : renderTable([
      ["Round", "Opp", "H/A", "Starter", "Min", "Score"],
      ...perfs.map((perf) => [
        String(perf.numero),
        perf.adversaire ?? "-",
        perf.domicile == null ? "-" : perf.domicile ? "Home" : "Away",
        perf.titulaire == null ? "-" : perf.titulaire ? "yes" : "no",
        String(perf.minutes_jouees ?? "-"),
        perf.note ?? "-",
      ]),
    ]);
  return [
    `${player.prenom} ${player.nom} — ${player.club_nom}`,
    positions,
    `Value: ${player.valeur}`,
    "",
    performances,
    "",
    `Average: ${stats.moyenne?.toFixed(2) ?? "-"}`,
    `Best: ${stats.meilleure?.toFixed(2) ?? "-"}`,
    `Worst: ${stats.pire?.toFixed(2) ?? "-"}`,
    `Tries: ${stats.essais}`,
  ].join("\n");
}

/** Thin CLI adapter. Returning output keeps formatting separate from terminal I/O. */
export async function runCli(
  args: readonly string[],
  client?: FantasyClient,
): Promise<string> {
  if (args[0] === "player") {
    const options = parsePlayerArgs(args);
    if (options.help) return HELP;
    client ??= new FantasyClient(loadConfig());
    const sheet = await client.getPlayerSheet(options.playerId);
    if (options.json) {
      return JSON.stringify(
        options.detailed ? sheet : quickSheet(sheet),
        null,
        2,
      );
    }
    return options.detailed ? sheetDetails(sheet) : sheetSummary(sheet);
  }
  const options = parseArgs(args);
  if (options.help) return HELP;
  client ??= new FantasyClient(loadConfig());
  const response = await client.getPlayers();
  const joueurs = filterPlayers(response.joueurs, options.filters);
  return options.json
    ? JSON.stringify({ ...response, joueurs }, null, 2)
    : table(joueurs);
}

if (import.meta.main) {
  try {
    console.log(await runCli(Deno.args));
  } catch (error) {
    console.error(
      `Error: ${
        error instanceof Error ? error.message : "Unexpected failure."
      }`,
    );
    Deno.exitCode = 1;
  }
}
