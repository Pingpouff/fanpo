import { filterPlayers } from "./filters.ts";
import { renderPlayers } from "./output.ts";
import { type CommandContext, createCommand } from "../shared/command.ts";

export function playersCommand(context: CommandContext) {
  return createCommand()
    .description(
      "Find live players by club, position, name or availability.\n" +
        "Filters combine with AND. Positions include secondary/tertiary roles. --available excludes flagged unavailable players; it does not confirm selection.",
    )
    .example("Find a player ID", "deno task cli players --name Bamba")
    .example(
      "Filter candidates",
      "deno task cli players --club UBB --position PIL --available",
    )
    .example("JSON for scripts", "deno task cli players --json")
    .option("--json", "JSON response with the filtered player list.")
    .option(
      "--club <code:filter>",
      "Exact club code, e.g. UBB or ST (case insensitive).",
    )
    .option(
      "--position <code:filter>",
      "Position code, e.g. PIL, TAL, DL, TL, N8, DM, OUV, AIL, CEN, ARR.",
    )
    .option(
      "--name <text:filter>",
      "Match a full-name substring (case insensitive).",
    )
    .option("--available", "Exclude unavailable players.")
    .action(async (options) => {
      const response = await context.getClient().getPlayers();
      const joueurs = filterPlayers(response.joueurs, options);
      context.setOutput(renderPlayers({ ...response, joueurs }, options));
    });
}
