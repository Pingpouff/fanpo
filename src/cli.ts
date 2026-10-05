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
  const command = createCommand()
    .name("deno task cli")
    .description(
      "Inspect Fantasy Rugby players and compositions. Requires FANTASY_TOKEN for API requests.",
    )
    .noExit()
    .helpOption("-h, --help", "Show this help.", function () {
      output = this.getHelp({ colors: false });
    })
    .action(function () {
      output = this.getHelp({ colors: false });
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
