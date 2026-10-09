import { renderPlayerSheet, renderPlayerSheets } from "./output.ts";
import { type CommandContext, createCommand } from "../../shared/command.ts";

export function playerSheetCommand(context: CommandContext) {
  return createCommand()
    .description(
      "Inspect live identity, price and performance history for one or more player IDs.\n" +
        "Find IDs with players --name. Multiple IDs preserve order (up to five concurrent requests).\n" +
        "Quick JSON omits detailed stats; combine --detailed --json for complete sheets.",
    )
    .example("One player", "deno task cli player 825")
    .example(
      "Several players with stats",
      "deno task cli player 479 825 990 --detailed",
    )
    .example("Complete JSON", "deno task cli player 825 --detailed --json")
    .arguments("<id:playerId> [ids...:playerId]")
    .option("--json", "JSON object for one ID; array for several IDs.")
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
