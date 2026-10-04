import { Command, ValidationError } from "@cliffy/command";
import { FantasyClient } from "./client.ts";
import { renderPlayers, renderPlayerSheet } from "./cli_output.ts";
import { loadConfig } from "./config.ts";
import { filterPlayers } from "./filters.ts";

/** Build a fresh command tree per invocation; only the entry point writes output. */
export async function runCli(
  args: readonly string[],
  client?: FantasyClient,
): Promise<string> {
  let output = "";
  const getClient = () => client ??= new FantasyClient(loadConfig());
  const command = new Command()
    .name("deno task cli")
    .description(
      "Inspect Fantasy Rugby players. Requires FANTASY_TOKEN for API requests.",
    )
    .noExit()
    .helpOption("-h, --help", "Show this help.", function () {
      output = this.getHelp({ colors: false });
    })
    .action(function () {
      output = this.getHelp({ colors: false });
    })
    .globalType("playerId", ({ value }) => {
      const id = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError(
          "The player ID must be a positive safe integer.",
        );
      }
      return id;
    })
    .globalType("filter", ({ value, name }) => {
      const trimmed = value.trim();
      if (!trimmed || trimmed.startsWith("-")) {
        throw new ValidationError(`--${name} requires a nonblank value.`);
      }
      return trimmed;
    })
    .command(
      "players",
      "List players with optional local filters (combined with AND).",
    )
    .option("--json", "Output JSON.")
    .option("--club <code:filter>", "Match a club code (case insensitive).")
    .option(
      "--position <code:filter>",
      "Match any listed position (case insensitive).",
    )
    .option(
      "--name <text:filter>",
      "Match a full-name substring (case insensitive).",
    )
    .option("--available", "Exclude unavailable players.")
    .action(async (options) => {
      const response = await getClient().getPlayers();
      const joueurs = filterPlayers(response.joueurs, options);
      output = renderPlayers({ ...response, joueurs }, options);
    })
    .command(
      "player <id:playerId>",
      "Show a player sheet; quick JSON omits stats by default.",
    )
    .option("--json", "Output JSON.")
    .option(
      "--detailed, --stats [enabled:boolean]",
      "Include aggregate and per-round statistics.",
    )
    .action(async (options, id) => {
      const sheet = await getClient().getPlayerSheet(id);
      output = renderPlayerSheet(sheet, options);
    });

  await command.parse([...args]);
  return output;
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
