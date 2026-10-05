import { filterPlayers } from "./filters.ts";
import { renderPlayers } from "./output.ts";
import { type CommandContext, createCommand } from "../shared/command.ts";

export function playersCommand(context: CommandContext) {
  return createCommand()
    .description(
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
      const response = await context.getClient().getPlayers();
      const joueurs = filterPlayers(response.joueurs, options);
      context.setOutput(renderPlayers({ ...response, joueurs }, options));
    });
}
