import { renderPlayerSheet } from "./output.ts";
import { type CommandContext, createCommand } from "../../shared/command.ts";

export function playerSheetCommand(context: CommandContext) {
  return createCommand()
    .description("Show a player sheet; quick JSON omits stats by default.")
    .arguments("<id:playerId>")
    .option("--json", "Output JSON.")
    .option(
      "--detailed, --stats [enabled:boolean]",
      "Include aggregate and per-round statistics.",
    )
    .action(async (options, id) => {
      const sheet = await context.getClient().getPlayerSheet(id);
      context.setOutput(renderPlayerSheet(sheet, options));
    });
}
