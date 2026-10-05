import { renderComposition } from "./output.ts";
import { renderHistoricalComposition } from "./journee/output.ts";
import { type CommandContext, createCommand } from "../shared/command.ts";

export function compositionCommand(context: CommandContext) {
  return createCommand()
    .description(
      "Show the current composition (ID defaults to 1), or a specific round with --round.",
    )
    .arguments("[id:positiveInteger]")
    .option(
      "--round <round:positiveInteger>",
      "Historical Fantasy round; omit for the current composition.",
    )
    .option("--json", "Output the complete API response as JSON.")
    .option("--detailed", "Display the complete raw API response.")
    .action(async (options, id = 1) => {
      if (options.round === undefined) {
        const composition = await context.getClient().getComposition(id);
        context.setOutput(renderComposition(composition, options));
        return;
      }
      const composition = await context.getClient().getCompositionForRound(
        id,
        options.round,
      );
      context.setOutput(renderHistoricalComposition(composition, options));
    });
}
