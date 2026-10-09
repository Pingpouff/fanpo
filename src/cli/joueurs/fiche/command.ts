import { renderPlayerSheet, renderPlayerSheets } from "./output.ts";
import { type CommandContext, createCommand } from "../../shared/command.ts";

export function playerSheetCommand(context: CommandContext) {
  return createCommand()
    .description(
      "Show one or more player sheets; quick JSON omits stats by default.",
    )
    .arguments("<id:playerId> [ids...:playerId]")
    .option("--json", "Output JSON.")
    .option(
      "--detailed, --stats [enabled:boolean]",
      "Include aggregate and per-round statistics.",
    )
    .action(async (options, id, ...ids) => {
      if (ids.length === 0) {
        const sheet = await context.getClient().getPlayerSheet(id);
        context.setOutput(renderPlayerSheet(sheet, options));
      } else {
        const sheets = await context.getClient().getPlayerSheets([id, ...ids]);
        context.setOutput(renderPlayerSheets(sheets, options));
      }
    });
}
