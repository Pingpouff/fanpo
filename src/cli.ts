import { FantasyClient } from "./client.ts";
import { loadConfig } from "./config.ts";
import { filterPlayers, type PlayerFilters } from "./filters.ts";
import type { Player } from "./types.ts";

const HELP = `Usage: deno task cli players [options]

Options:
  --json             Output the API response as JSON
  --club CODE        Match a club code (case insensitive)
  --position CODE    Match any listed position (case insensitive)
  --name TEXT        Match a full-name substring (case insensitive)
  --available        Exclude unavailable players
  --help, -h         Show this help

Filters run locally and can be combined.
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
  const rows = [
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
  ].map((row) => row.map((cell) => cell.replace(/\s+/g, " ")));
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => row[i].length))
  );
  return rows.map((row) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd()
  )
    .join("\n");
}

/** Thin CLI adapter. Returning output keeps formatting separate from terminal I/O. */
export async function runCli(
  args: readonly string[],
  client?: FantasyClient,
): Promise<string> {
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
