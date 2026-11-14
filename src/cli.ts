import { VERSION } from "./release/version.ts";
import { humanColors } from "./cli/shared/colors.ts";
import { type CommandMetadata, renderMetadata } from "./cli/shared/metadata.ts";
import type { RequestMetadata } from "./api/http.ts";
import type { DataAccessMetadata } from "./operations/metadata.ts";
import { groupRootHelp } from "./cli/shared/help.ts";
import { analysisCommands } from "./cli/context/analysis.ts";
import { contextCommands } from "./cli/context/command.ts";
import { FantasyClient } from "./client.ts";
import { loadConfig } from "./config.ts";
import { type Competition, competitionName } from "./api/competition.ts";
import {
  type CommandContext,
  createCommand,
  groupCommand,
} from "./cli/shared/command.ts";
import { playersCommand } from "./cli/joueurs/command.ts";
import { playerSheetCommand } from "./cli/joueurs/fiche/command.ts";
import { compositionCommand } from "./cli/composition/command.ts";

export interface CliRuntime {
  name?: string;
  defaultDatabase?: string;
  prepareSqlite?: () => Promise<void>;
}

/** Build a fresh command tree per invocation; only the entry point writes output. */
export async function runCli(
  args: readonly string[],
  client?: FantasyClient,
  onMetadata?: (metadata: CommandMetadata) => void,
  runtime: CliRuntime = {},
): Promise<string> {
  const formatHelp = (text: string) =>
    runtime.name
      ? text.replaceAll("deno task cli", runtime.name)
        .replaceAll("First run: deno task sqlite:setup.", "SQLite is included.")
        .replaceAll("First run deno task sqlite:setup;", "SQLite is included;")
      : text;
  let output = "";
  let debug = false;
  let noColor = false;
  let competition: Competition = "top14";
  const startedAt = new Date().toISOString(), started = performance.now();
  const requests: RequestMetadata[] = [], dataAccess: DataAccessMetadata[] = [];
  let unsubscribe: (() => void) | undefined;
  const getClient = () => {
    client ??= new FantasyClient(loadConfig());
    client = client.forCompetition(competition);
    if (debug && !unsubscribe) {
      unsubscribe = client.observeRequests((event) => requests.push(event));
    }
    return client;
  };
  const context: CommandContext = {
    defaultDatabase: runtime.defaultDatabase,
    prepareSqlite: runtime.prepareSqlite,
    getClient,
    getCompetition: () => competition,
    get recordDataAccess() {
      return debug
        ? (event: DataAccessMetadata) => {
          dataAccess.push(event);
        }
        : undefined;
    },
    setHelpOutput: (value) => {
      output = formatHelp(value);
    },
    setOutput: (value) => {
      output = value;
    },
  };
  const root = createCommand();
  contextCommands(root, context);
  analysisCommands(root, context);
  root.command(
    "skills",
    groupCommand("Export the version-matched, offline agent kit.", context)
      .command(
        "export",
        createCommand()
          .description(
            "Export Fantasy Rugby skills, rules and references to a new directory.",
          )
          .option(
            "--output <directory:string>",
            "New destination directory (parent must exist).",
            { required: true },
          )
          .option("--json", "Structured export result.")
          .action(async (options) => {
            const { collectKit, exportKit } = await import("./release/kit.ts");
            await exportKit(options.output, await collectKit());
            output = options.json
              ? JSON.stringify(
                { version: VERSION, directory: options.output },
                null,
                2,
              )
              : `Exported Fanpo ${VERSION} agent kit to ${options.output}. Read AGENTS.md to start.`;
          }),
      ),
  );
  root.reset();
  const command = root
    .name(runtime.name ?? "deno task cli")
    .version(VERSION)
    .versionOption("-V, --version", "Show the Fanpo version.", () => {
      output = VERSION;
    })
    .globalOption(
      "--nationchampionship",
      "Use Nations Championship instead of Top 14 (including its separate cache).",
      (value) => {
        competition = value ? "nationchampionship" : "top14";
        return value;
      },
    )
    .globalOption(
      "--no-color",
      "Disable ANSI colors in readable output.",
    )
    .globalOption(
      "--debug",
      "Request timings, bytes and storage; --json wraps results as {data,metadata}.",
      (value) => {
        debug = !!value;
        return value;
      },
    )
    .description(
      "Inspect live Fantasy Rugby data, cache it and compare projected lineups.\n" +
        "Colored tables by default; use --no-color for plain text or --json for structured output.\n" +
        (runtime.name === "fanpo"
          ? "Online requests need FANTASY_TOKEN (environment or user configuration). SQLite is included.\n"
          : "Online requests need FANTASY_TOKEN (.env). Cached analysis also needs deno task sqlite:setup.\n") +
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
      output = formatHelp(
        this.getName() === root.getName()
          ? groupRootHelp(this.getHelp({ colors: false }))
          : this.getHelp({ colors: false }),
      );
    })
    .action(function () {
      output = formatHelp(
        this.getName() === root.getName()
          ? groupRootHelp(this.getHelp({ colors: false }))
          : this.getHelp({ colors: false }),
      );
    })
    .command("players", playersCommand(context))
    .command("player", playerSheetCommand(context))
    .command("composition", compositionCommand(context));

  let metadata: CommandMetadata | undefined;
  let json = false;
  try {
    // Cliffy treats --help as standalone. Consume this presentation-only flag
    // first so --no-color --help remains usable without relaxing help validation.
    const separator = args.indexOf("--");
    const parseArgs = args.filter((arg, index) => {
      if (
        arg === "--nationchampionship" && args.includes("--help") &&
        (separator < 0 || index < separator)
      ) {
        competition = "nationchampionship";
        return false;
      }
      if (arg === "--no-color" && (separator < 0 || index < separator)) {
        noColor = true;
        return false;
      }
      return true;
    });
    const parsed = await command.parse(parseArgs);
    json = !!parsed.options.json;
  } finally {
    unsubscribe?.();
    if (debug && (requests.length || dataAccess.length)) {
      metadata = {
        startedAt,
        durationMs: performance.now() - started,
        requestCount: requests.length,
        totalResponseBytes: requests.reduce(
          (sum, r) => sum + (r.responseBytes ?? 0),
          0,
        ),
        unknownResponseSizes: requests.filter((r) =>
          r.responseBytes === null
        ).length,
        storedPayloadBytes: dataAccess.reduce(
          (sum, d) => sum + d.storedBytes,
          0,
        ),
        requests: requests.map((request) => {
          const access = dataAccess.find((d) =>
            d.endpoint === request.endpoint
          );
          return {
            ...request,
            storage: access?.storage ?? "not-stored",
            storedBytes: access?.storedBytes ?? 0,
            snapshotId: access?.snapshotId,
          };
        }),
        dataAccess,
      };
      onMetadata?.(metadata);
    }
  }
  if (metadata) {
    return json
      ? JSON.stringify({ data: JSON.parse(output), metadata }, null, 2)
      : humanColors(
        `${
          competition === "top14" ? "" : `${competitionName(competition)}\n\n`
        }${output}\n\n${renderMetadata(metadata)}`,
        noColor,
      );
  }
  return json ? output : humanColors(
    `${
      competition === "top14" ? "" : `${competitionName(competition)}\n\n`
    }${output}`,
    noColor,
  );
}

export async function cliMain(
  args: readonly string[] = Deno.args,
  runtime: CliRuntime = {},
): Promise<void> {
  let metadata: CommandMetadata | undefined;
  try {
    console.log(
      await runCli(args, undefined, (value) => {
        metadata = value;
      }, runtime),
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unexpected failure.";
    console.error(
      metadata
        ? (args.some((arg) => arg === "--json" || arg === "--json=true")
          ? JSON.stringify({ error: message, metadata }, null, 2)
          : humanColors(
            `Error: ${message}\n\n${renderMetadata(metadata)}`,
            args.includes("--no-color"),
          ))
        : humanColors(`Error: ${message}`, args.includes("--no-color")),
    );
    Deno.exitCode = 1;
  }
}

if (import.meta.main) await cliMain();
