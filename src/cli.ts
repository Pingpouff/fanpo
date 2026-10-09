import { groupRootHelp } from "./cli/shared/help.ts";
import { analysisCommands } from "./cli/context/analysis.ts";
import { contextCommands } from "./cli/context/command.ts";
import { FantasyClient } from "./client.ts";
import { loadConfig } from "./config.ts";
import { type CommandContext, createCommand } from "./cli/shared/command.ts";
import { playersCommand } from "./cli/joueurs/command.ts";
import { playerSheetCommand } from "./cli/joueurs/fiche/command.ts";
import { compositionCommand } from "./cli/composition/command.ts";

/** Build a fresh command tree per invocation; only the entry point writes output. */
export async function runCli(
  args: readonly string[],
  client?: FantasyClient,
): Promise<string> {
  let output = "";
  const getClient = () => client ??= new FantasyClient(loadConfig());
  const context: CommandContext = {
    getClient,
    setOutput: (value) => {
      output = value;
    },
  };
  const root = createCommand();
  contextCommands(root, context);
  analysisCommands(root, context);
  const command = root
    .name("deno task cli")
    .description(
      "Inspect live Fantasy Rugby data, cache it and compare projected lineups.\n" +
        "Readable tables by default; add --json to a command for structured output.\n" +
        "Online requests need FANTASY_TOKEN (.env). Cached analysis also needs deno task sqlite:setup.\n" +
        "Run any command with --help for its options and examples.",
    )
    .example("Current team and salary cap", "deno task cli composition")
    .example(
      "Prepare advice",
      "deno task cli sync\ndeno task cli analyze lineup",
    )
    .example("Detailed help", "deno task cli analyze lineup --help")
    .noExit()
    .helpOption("-h, --help", "Show this help.", function () {
      output = this === root
        ? groupRootHelp(this.getHelp({ colors: false }))
        : this.getHelp({ colors: false });
    })
    .action(function () {
      output = this === root
        ? groupRootHelp(this.getHelp({ colors: false }))
        : this.getHelp({ colors: false });
    })
    .command("players", playersCommand(context))
    .command("player", playerSheetCommand(context))
    .command("composition", compositionCommand(context));

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
