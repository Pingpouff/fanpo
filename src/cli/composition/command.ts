import { renderComposition } from "./output.ts";
import { renderHistoricalComposition } from "./journee/output.ts";
import { type CommandContext, createCommand } from "../shared/command.ts";

export function compositionCommand(context: CommandContext) {
  return createCommand()
    .description(
      "Show your current team and salary cap, or official historical round results.\n" +
        "Budget (equipe.budget) is your effective salary cap in millions; Cap is the initial/reference cap.\n" +
        "Resource ID defaults to 1 for Top 14; NC discovers your normal league. Omit --round for current selections; use --round N for historical points.\n" +
        "[C] captain, [C-auto] automatic captain, [I] impact, SUB real substitute, FORFAIT official withdrawal. '-' means unavailable data.",
    )
    .example("Current salary cap and team", "deno task cli composition")
    .example(
      "Salary cap only (requires jq)",
      "deno task cli composition --json | jq -r '.equipe.budget'",
    )
    .example("Historical points", "deno task cli composition --round 4")
    .arguments("[id:positiveInteger]")
    .option(
      "--round <round:positiveInteger>",
      "Historical Fantasy round; omit for the current composition.",
    )
    .option("--json", "Output the complete API response as JSON.")
    .option("--detailed", "Include additional columns in the readable table.")
    .action(async (options, id) => {
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
