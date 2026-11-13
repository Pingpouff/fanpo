import { jsonBytes } from "../../operations/metadata.ts";
import type { Player } from "../../api/joueurs/types.ts";
import { renderAnalysis } from "./output.ts";
import { renderPlayers } from "../joueurs/output.ts";
import type { PlayerFilters } from "../../operations/player-filters.ts";
import { heading, status, tone } from "../shared/colors.ts";
import {
  type CommandContext,
  createCommand,
  groupCommand,
} from "../shared/command.ts";
import type { Lineup } from "../../analysis/lineup.ts";
import type { AdviceRequest } from "../../operations/advice.ts";
import { parseCandidate } from "../../analysis/candidates.ts";
interface Options extends PlayerFilters {
  db?: string;
  season?: string;
  profile?: string;
  origin?: string;
  offline?: boolean;
  force?: boolean;
  json?: boolean;
  composition?: number;
  lineup?: string;
  alternative?: string;
  candidate?: string[];
}
function season() {
  const now = new Date();
  const start = now.getUTCMonth() >= 7
    ? now.getUTCFullYear()
    : now.getUTCFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}
function options() {
  return createCommand().option(
    "--db <path:string>",
    "Local database path; task permissions cover .data/.",
    {
      default: ".data/fanpo.sqlite",
    },
  ).option(
    "--season <season:string>",
    "Local season label (e.g. 2026-27); does not change API season.",
    { default: season() },
  )
    .option(
      "--profile <profile:string>",
      "Local account label; use the same profile across commands.",
      {
        default: "default",
      },
    ).option(
      "--origin <url:string>",
      "API origin scope; must match FANTASY_API_URL online",
    ).option(
      "--offline",
      "No network/token; missing or stale cache is reported.",
    ).option(
      "--force",
      "Refresh all requested sources; ignored by data status.",
    ).option("--json", "Structured JSON evidence").option(
      "--composition <id:positiveInteger>",
      "Team resource ID for sync, lineup and compare.",
    );
}
async function readLineup(path: string): Promise<Lineup> {
  const value = JSON.parse(await Deno.readTextFile(path));
  if (
    !value || !Array.isArray(value.slots) ||
    !Number.isInteger(value.captainSlot) ||
    !Number.isInteger(value.impactSlot) ||
    value.slots.some((s: { slot: number; playerId: number }) =>
      !s || !Number.isSafeInteger(s.slot) ||
      !Number.isSafeInteger(s.playerId) || s.playerId < 1
    )
  ) {
    throw new Error(
      "Invalid lineup file; expected slots [{slot,playerId}], captainSlot and impactSlot.",
    );
  }
  return value;
}
export function analysisCommands(
  root: ReturnType<typeof createCommand>,
  context: CommandContext,
) {
  const execute = async (
    kind: AdviceRequest["kind"] | "status" | "catalogue",
    o: Options,
    ids: number[] = [],
  ) => {
    const candidates = (o.candidate ?? []).map(parseCandidate);
    if (o.alternative && candidates.length) {
      throw new Error("Use either --alternative or --candidate.");
    }
    if (new Set(candidates.map((c) => c.name)).size !== candidates.length) {
      throw new Error("Duplicate candidate name.");
    }
    if (kind === "compare" && !o.alternative && !candidates.length) {
      throw new Error("Supply --alternative or --candidate.");
    }
    if (kind === "lineup" && candidates.length > 1) {
      throw new Error(
        "Lineup validation accepts one candidate; use compare for multiple candidates.",
      );
    }
    // Lazy native loading keeps ordinary API commands and all help permission-free.
    if (!Deno.env.get("DENO_SQLITE_PATH")) {
      throw new Error(
        "Set DENO_SQLITE_PATH to your SQLite library, or use deno task cli after deno task sqlite:setup.",
      );
    }
    const configuredOrigin = Deno.env.get("FANTASY_API_URL") ??
      "https://fantasy.poneeey.fr";
    const origin = new URL(o.origin ?? configuredOrigin).origin;
    if (
      !o.offline && kind !== "status" && kind !== "catalogue" &&
      origin !== new URL(configuredOrigin).origin
    ) {
      throw new Error(
        "--origin must match FANTASY_API_URL for online requests",
      );
    }
    const path = o.db ?? ".data/fanpo.sqlite";
    const parent = path.replace(/[/\\][^/\\]*$/, "");
    if (parent !== path) await Deno.mkdir(parent, { recursive: true });
    const { Store } = await import("../../data/store.ts");
    const store = new Store(path, {
      origin,
      season: o.season ?? season(),
      profile: o.profile ?? "default",
      competition: context.getCompetition(),
    });
    try {
      let value: unknown;
      if (kind === "catalogue") {
        const { readCatalogue } = await import("../../operations/catalogue.ts");
        const catalogue = readCatalogue(store, o);
        const snapshot = store.read("/api/joueurs")!;
        context.recordDataAccess?.({
          endpoint: snapshot.endpoint,
          source: "cache",
          cacheStatus: catalogue.evidence.stale ? "stale" : "fresh",
          fetchedAt: snapshot.fetchedAt,
          snapshotId: snapshot.id,
          storage: "reused",
          storedBytes: 0,
          cacheBytes: jsonBytes(snapshot.data),
        });
        context.setOutput(
          o.json ? JSON.stringify(catalogue, null, 2) : [
            heading(`Cached players | Round ${catalogue.round}`),
            `Catalogue: ${
              status(catalogue.evidence.stale ? "Stale" : "Fresh")
            } | Snapshot #${snapshot.id} | Fetched: ${snapshot.fetchedAt}`,
            ...catalogue.warnings.map((w) =>
              `${tone("Warning:", "caution")} ${w}`
            ),
            renderPlayers({
              ...(snapshot
                .data as import("../../api/joueurs/types.ts").PlayersResponse),
              joueurs: catalogue.players,
            }),
          ].join("\n"),
        );
        return;
      } else if (kind === "status") {
        const { stale } = await import("../../operations/data.ts");
        const round =
          store.read<{ numero: number }>("/api/journees/cible")?.data.numero ??
            0;
        for (const s of store.status()) {
          context.recordDataAccess?.({
            endpoint: s.endpoint,
            source: "cache",
            cacheStatus: stale(s, round) ? "stale" : "fresh",
            fetchedAt: s.fetchedAt,
            snapshotId: s.id,
            storage: "reused",
            storedBytes: 0,
            cacheBytes: jsonBytes(store.read(s.endpoint)!.data),
          });
        }
        value = {
          scope: {
            origin,
            season: o.season ?? season(),
            profile: o.profile ?? "default",
            competition: context.getCompetition(),
          },
          round,
          snapshots: store.status().map((s) => ({
            ...s,
            stale: stale(s, round),
          })),
        };
      } else {
        const { advise } = await import("../../operations/advice.ts");
        value = await advise(store, context.getClient, {
          ...o,
          onDataAccess: context.recordDataAccess,
          kind,
          ids,
          compositionId: o.composition,
          candidates,
          lineup: o.lineup ? await readLineup(o.lineup) : undefined,
          alternative: o.alternative
            ? await readLineup(o.alternative)
            : undefined,
        });
      }
      context.setOutput(
        o.json ? JSON.stringify(value, null, 2) : renderAnalysis(
          kind,
          value,
          kind === "lineup" || kind === "compare"
            ? new Map(
              store.entities<Player>("players").map(
                (p) => [p.id, `${p.prenom} ${p.nom} (#${p.id}, ${p.club})`],
              ),
            )
            : undefined,
        ),
      );
    } finally {
      store.close();
    }
  };
  root.command(
    "sync",
    options().description(
      "Cache context, your current squad and any extra candidate player IDs.\n" +
        "Reuses fresh data; --force refreshes it. Failures keep previous data and report warnings.\n" +
        "First run: deno task sqlite:setup. Online refresh requires FANTASY_TOKEN.",
    ).example("Cache the current squad", "deno task cli sync")
      .example(
        "Add candidates and refresh",
        "deno task cli sync 825 990 --force",
      )
      .arguments("[ids...:playerId]").action((o, ...ids) =>
        execute("sync", o, ids)
      ),
  );
  root.command(
    "data",
    groupCommand("Inspect locally stored sources and their freshness.", context)
      .command(
        "players",
        options().description(
          "Find players in the cached catalogue; never requests the API or credentials.\nFilters combine with AND and include secondary/tertiary positions. --available excludes flagged unavailable players; it does not confirm selection.\nFreshness and snapshot evidence are reported. Run sync online if data is missing/stale. --offline, --force and --composition have no effect.",
        )
          .example(
            "Cached candidates",
            "deno task cli data players --position TL --available",
          )
          .example(
            "Find a cached player",
            "deno task cli data players --name Rabut",
          )
          .option("--club <code:filter>", "Exact club code (case insensitive).")
          .option(
            "--position <code:filter>",
            "Primary, secondary or tertiary position, e.g. PIL or TL.",
          )
          .option(
            "--name <text:filter>",
            "Full-name substring (case insensitive).",
          )
          .option(
            "--available",
            "Exclude flagged unavailable players; selection remains unconfirmed.",
          )
          .action((o) => execute("catalogue", o)),
      )
      .command(
        "status",
        options().description(
          "List cached sources, fetch times and Fresh/Stale status; never requests the API.\nUse sync to refresh. --force, --offline and --composition do not affect this read-only command.",
        )
          .example("Cache freshness", "deno task cli data status")
          .example(
            "Another local profile",
            "deno task cli data status --profile beto",
          )
          .action((o) => execute("status", o)),
      ),
  );
  root.command(
    "analyze",
    groupCommand(
      "Project player, matchup and lineup performance using stored facts.\nMissing/stale inputs refresh automatically unless --offline. Unresolved means insufficient evidence, not zero.",
      context,
    )
      .command(
        "player",
        options().description(
          "Compare projected ratings for player IDs, with price, real role and matchup influence.\nStarter/substitute scenarios are conditional until teamsheets are known. Unresolved means missing evidence.\nFirst run deno task sqlite:setup; find IDs with players --name. --composition is unused here.",
        )
          .example("Compare candidates", "deno task cli analyze player 825 990")
          .example(
            "Stored evidence only",
            "deno task cli analyze player 825 --offline",
          )
          .arguments("<ids...:playerId>").action((o, ...ids) =>
            execute("player", o, ids)
          ),
      )
      .command(
        "matchups",
        options().description(
          "Forecast target-round match margins and home-team win/draw/loss chances.\nDomination = P(win by 20+) - P(lose by 20+); at least 20 replay errors are needed.\nUnresolved probabilities use a neutral player multiplier. --composition is unused here.",
        )
          .example("Upcoming matchups", "deno task cli analyze matchups")
          .action((o) => execute("matchups", o)),
      )
      .command(
        "lineup",
        options().description(
          "Check lineup legality, effective budget and projected Fantasy points.\nDefaults to your current team. VALID/INVALID checks structure; PROVISIONAL signals unresolved evidence.\nLineup files use 1-based slots [{slot,playerId}], captainSlot (1-15), impactSlot (16-17); include all 17 slots.\nStore files under .data/ for the default task permissions. Only normal format is supported.",
        )
          .example("Current team advice", "deno task cli analyze lineup")
          .example(
            "Proposed team offline",
            "deno task cli analyze lineup --lineup .data/proposed.json --offline",
          )
          .option(
            "--lineup <path:string>",
            "Lineup JSON file; defaults to current API composition",
          ).option(
            "--candidate <proposal:string>",
            "Validate swaps against the baseline: NAME:SLOT=PLAYER_ID[,SLOT=PLAYER_ID]. Retains captain/impact slots.",
            { collect: true },
          ).action((o) => execute("lineup", o)),
      ),
  );
  root.command(
    "compare",
    options().description(
      "Compare proposed lineups to your current team or a --lineup baseline file.\n" +
        "Use --alternative FILE or repeat --candidate 'NAME:SLOT=PLAYER_ID[,SLOT=PLAYER_ID]'.\n" +
        "Candidates independently apply swaps to the baseline, retaining captain/impact slots; data refreshes once for all candidates.\n" +
        "Shows legality, budget and projected points changes. Unresolved totals do not imply a guaranteed improvement.\n" +
        "Files use 1-based slots [{slot,playerId}], captainSlot (1-15), impactSlot (16-17), with all 17 selections.\n" +
        "Put files under .data/. The selected API composition supplies salary cap, club limit and locks.",
    ).example(
      "Proposed vs current team",
      "deno task cli compare --alternative .data/proposed.json",
    )
      .example(
        "Compare swap packages without files",
        "deno task cli compare --candidate 'Manu:11=883' --candidate 'Manu+Brau:11=883,12=834'",
      )
      .example(
        "Two saved teams",
        "deno task cli compare --lineup .data/before.json --alternative .data/after.json --offline",
      )
      .option(
        "--lineup <path:string>",
        "Before lineup JSON; omit to use current team.",
      ).option(
        "--alternative <path:string>",
        "Complete proposed lineup JSON file; exclusive with --candidate.",
      ).option(
        "--candidate <proposal:string>",
        "Named swaps: NAME:SLOT=PLAYER_ID[,SLOT=PLAYER_ID]. Repeat for independent alternatives. Slots 1-17; names unique.",
        { collect: true },
      ).action((o) => execute("compare", o)),
  );
  root.reset();
}
