import { Command, ValidationError } from "@cliffy/command";
import type { FantasyClient } from "../../api/client.ts";

export interface CommandContext {
  getClient: () => FantasyClient;
  setOutput: (output: string) => void;
}

export function createCommand() {
  return new Command()
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
    .globalType("positiveInteger", ({ value, name }) => {
      const number = Number(value);
      if (
        !/^\d+$/.test(value) || !Number.isSafeInteger(number) || number <= 0
      ) {
        throw new ValidationError(`${name} must be a positive safe integer.`);
      }
      return number;
    });
}

/** Command groups return the same help as --help, without direct console I/O. */
export function groupCommand(description: string, context: CommandContext) {
  return createCommand().description(description).action(function () {
    context.setOutput(this.getHelp({ colors: false }));
  });
}
