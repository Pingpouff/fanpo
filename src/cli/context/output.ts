import { renderTable } from "../shared/output.ts";
import type { Matchday } from "../../api/shared/types.ts";
import type {
  LocksResponse,
  RoundNotesResponse,
  TeamsheetsResponse,
} from "../../api/context/types.ts";
import type { AdviceRequest } from "../../operations/advice.ts";
import type { projectPlayer } from "../../analysis/player.ts";
import type { forecastMatchups } from "../../analysis/matchups.ts";

const number = (value: number | null | undefined, digits = 2) =>
  value == null ? "Unresolved" : value.toFixed(digits);
const percent = (value: number | null | undefined) =>
  value == null ? "Unresolved" : `${(100 * value).toFixed(1)}%`;
const money = (units: number) => `${(units / 1_000_000).toFixed(2)} M`;
const role = (
  value: string,
) => ({
  starter: "Starter",
  substitute: "Substitute",
  unknown: "Unknown",
  absent: "Absent",
}[value] ?? value);
const warnings = (items: readonly string[] | undefined, prefix = "Warning") =>
  [...new Set(items ?? [])].map((w) => `${prefix}: ${w}`);

interface Envelope {
  round: number;
  fullyCurrent: boolean;
  model: { version: string };
  warnings: string[];
  evidence: { id: number; endpoint: string; fetchedAt: string }[];
  result: unknown;
}
interface StatusView {
  scope: { origin: string; season: string; profile: string };
  round: number;
  snapshots: {
    id: number;
    endpoint: string;
    fetchedAt: string;
    stale: boolean;
  }[];
}
interface LineupView {
  validation: {
    status: string;
    cost: number;
    budget: number;
    remaining: number;
    errors: string[];
    warnings: string[];
  };
  expected: number | null;
  conditionalAllStarters: number | null;
  conditionalAllSubstitutes: number | null;
  slots: {
    slot: number;
    playerId: number;
    status: string;
    starter: number | null;
    substitute: number | null;
    expected: number | null;
    multiplier: number;
    warnings: string[];
  }[];
  warnings: string[];
}
type Scenario = ReturnType<typeof projectPlayer>;
interface PlayerView {
  playerId: number;
  name?: string;
  club?: string;
  price?: string;
  status: string;
  withdrawal?: boolean;
  expected: number | null;
  scenarios: { starter: Scenario; substitute: Scenario } | null;
  warnings: string[];
  matchup?: { home: string; away: string };
  standing?: { position: number; points: number } | null;
}
function lineup(value: LineupView, labels?: Map<number, string>): string[] {
  const v = value.validation;
  return [
    `Validation: ${v.status}`,
    `Salary cap: ${money(v.budget)} | Cost: ${money(v.cost)} | Remaining: ${
      money(v.remaining)
    }`,
    `Expected points: ${number(value.expected)}`,
    `Conditional total if all players start: ${
      number(value.conditionalAllStarters)
    }`,
    `Conditional total if all players are substitutes: ${
      number(value.conditionalAllSubstitutes)
    }`,
    "Conditional scenarios are not guaranteed outcomes.",
    ...warnings(v.errors, "Error"),
    ...warnings([...v.warnings, ...value.warnings]),
    renderTable([
      [
        "Slot",
        "Player",
        "Real role",
        "Multiplier",
        "Expected",
        "If starter",
        "If substitute",
      ],
      ...value.slots.map(
        (s) => [
          String(s.slot),
          labels?.get(s.playerId) ?? `#${s.playerId}`,
          role(s.status),
          `x${s.multiplier}`,
          number(s.expected),
          number(s.starter),
          number(s.substitute),
        ],
      ),
    ]),
    ...value.slots.flatMap((s) =>
      warnings(s.warnings, `Slot ${s.slot} / player ${s.playerId}`)
    ),
  ];
}
/** CLI presentation only: calculations and raw evidence stay in operations. */
export function renderAnalysis(
  kind: AdviceRequest["kind"] | "status",
  input: unknown,
  labels?: Map<number, string>,
): string {
  if (kind === "status") {
    const value = input as StatusView;
    return [
      `Stored data | Season ${value.scope.season} | Profile ${value.scope.profile}`,
      `API: ${value.scope.origin}`,
      `Round: ${value.round || "Unknown"}`,
      value.snapshots.length
        ? renderTable([
          ["Source", "Snapshot", "Fetched (UTC)", "Freshness"],
          ...value.snapshots.map(
            (s) => [
              s.endpoint,
              `#${s.id}`,
              s.fetchedAt,
              s.stale ? "Stale" : "Fresh",
            ],
          ),
        ])
        : "No stored data. Run sync online.",
    ].join("\n");
  }
  const value = input as Envelope;
  const lines = [
    `Round ${value.round} | Model ${value.model.version}`,
    value.fullyCurrent
      ? "Requested data is current."
      : "Data is incomplete or stale.",
    ...warnings(value.warnings),
    "",
  ];
  if (kind === "sync") {
    const result = value.result as { synced: number; players: number[] };
    lines.push(
      `Available data: ${result.synced} sources.`,
      `Player fiches requested: ${
        result.players.length ? result.players.join(", ") : "None"
      }.`,
    );
  }
  if (kind === "player") {
    for (const p of value.result as PlayerView[]) {
      lines.push(
        `${p.name ?? `Player ${p.playerId}`} (#${p.playerId})${
          p.club ? ` | ${p.club}` : ""
        }${p.price ? ` | ${p.price} M` : ""}`,
        `Real role: ${role(p.status)}${
          p.withdrawal ? " | Official withdrawal credit: 30 points" : ""
        }`,
        `Expected points: ${number(p.expected)}`,
      );
      if (p.matchup) {
        lines.push(
          `Fixture: ${p.matchup.home} vs ${p.matchup.away} (home vs away)`,
        );
      }
      if (p.standing) {
        lines.push(
          `Club ranking: ${p.standing.position} | League points: ${p.standing.points}`,
        );
      }
      if (p.scenarios) {
        lines.push(
          renderTable([
            [
              "Scenario",
              "Baseline",
              "10+ min chance",
              "Matchup factor",
              "Expected points",
            ],
            ...(["starter", "substitute"] as const).map((r) => {
              const s = p.scenarios![r];
              return [
                role(r),
                number(s.baseline),
                percent(s.scoringProbability),
                `x${number(s.matchupFactor, 3)}`,
                number(s.expected),
              ];
            }),
          ]),
        );
        for (const r of ["starter", "substitute"] as const) {
          const evidence = p.scenarios[r].evidence;
          if (evidence.length) {
            lines.push(
              `${role(r)} history (newest first):`,
              renderTable([
                ["Round", "Minutes", "Rating", "Weight"],
                ...evidence.map(
                  (e) => [
                    String(e.round),
                    String(e.minutes),
                    number(e.score),
                    number(e.weight, 3),
                  ],
                ),
              ]),
            );
          }
        }
      }
      lines.push(...warnings(p.warnings), "");
    }
  }
  if (kind === "matchups") {
    const result = value.result as ReturnType<typeof forecastMatchups>;
    lines.push(
      `Historical replay: ${result.calibration.samples} forecast errors.`,
      `Mean absolute error: ${
        number(result.calibration.mae)
      } | Home-advantage baseline: ${
        number(result.calibration.homeBaselineMae)
      }`,
      "Probabilities describe the home team. Domination = chance of winning by 20+ minus losing by 20+.",
      result.matches.length
        ? renderTable([
          [
            "Home",
            "Away",
            "Date",
            "Margin",
            "Win",
            "Draw",
            "Loss",
            "Win 20+",
            "Lose 20+",
            "Domination",
          ],
          ...result.matches.map(
            (m) => [
              m.home,
              m.away,
              m.date,
              number(m.expectedMargin),
              percent(m.winProbability),
              percent(m.drawProbability),
              percent(m.lossProbability),
              percent(m.overwhelmProbability),
              percent(m.overwhelmedProbability),
              number(m.domination, 3),
            ],
          ),
        ])
        : "No fixtures available.",
      ...result.matches.flatMap((m) =>
        warnings(m.warnings, `${m.home} vs ${m.away}`)
      ),
    );
  }
  if (kind === "lineup") {
    lines.push(...lineup(value.result as LineupView, labels));
  }
  if (kind === "compare") {
    const result = value.result as {
      before: LineupView;
      after: LineupView;
      expectedDelta: number | null;
      costDelta: number;
      changes: { slot: number; playerId: number }[];
    };
    lines.push(
      `Expected points change: ${number(result.expectedDelta)}`,
      `Cost change: ${result.costDelta > 0 ? "+" : ""}${
        money(result.costDelta)
      }`,
      "",
      "Before",
      ...lineup(result.before, labels),
      "",
      "After",
      ...lineup(result.after, labels),
      "",
      result.changes.length
        ? renderTable([
          ["Changed slot", "New player"],
          ...result.changes.map(
            (
              s,
            ) => [String(s.slot), labels?.get(s.playerId) ?? `#${s.playerId}`],
          ),
        ])
        : "No player changes.",
    );
  }
  if (value.evidence.length) {
    lines.push(
      "",
      `Evidence: ${value.evidence.length} stored sources`,
      ...value.evidence.map((e) =>
        `  ${e.endpoint} — snapshot #${e.id}, fetched ${e.fetchedAt}`
      ),
    );
  }
  return lines.join("\n").trimEnd();
}
export function renderRound(value: Matchday): string {
  return [
    `Round ${value.numero} | ${value.type}`,
    `Status: ${value.statut}`,
    `Deadline: ${value.deadline_at}`,
    `Deadline passed: ${
      value.deadline_passee === undefined
        ? "Unknown"
        : value.deadline_passee
        ? "Yes"
        : "No"
    }`,
    `Scored: ${
      value.notee === undefined ? "Unknown" : value.notee ? "Yes" : "No"
    }`,
  ].join("\n");
}
export function renderTeamsheets(value: TeamsheetsResponse): string {
  return [
    `Round ${value.journee}`,
    `Announced clubs: ${value.clubs_annonces.join(", ") || "None"}`,
    `Provisional ratings: ${value.notes_provisoires ? "Yes" : "No"}`,
    "Unannounced clubs have unknown roles.",
    Object.keys(value.joueurs).length
      ? renderTable([
        ["Player ID", "Shirt", "Real role"],
        ...Object.entries(value.joueurs).map((
          [id, shirt],
        ) => [id, String(shirt), shirt <= 15 ? "Starter" : "Substitute"]),
      ])
      : "No announced players.",
  ].join("\n");
}
export function renderLocks(value: LocksResponse): string {
  const v = value.verrou;
  const clubs = [
    ...new Set([...Object.keys(v.coups_envoi), ...v.demarres, ...v.liberes]),
  ];
  return [
    `Round ${value.journee.numero}`,
    `Matches in progress: ${v.en_cours ? "Yes" : "No"}`,
    `Next kickoff: ${v.prochain ?? "None"}`,
    clubs.length
      ? renderTable([
        ["Club", "Kickoff", "Server lock"],
        ...clubs.map(
          (c) => [
            c,
            v.coups_envoi[c] ?? "Unknown",
            v.liberes.includes(c)
              ? "Released"
              : v.demarres.includes(c)
              ? "Locked"
              : "Not started",
          ],
        ),
      ])
      : "No club locks reported.",
  ].join("\n");
}
export function renderRatings(
  value: RoundNotesResponse,
  round: number,
): string {
  const ids = [
    ...new Set([...Object.keys(value.notes), ...value.forfaits.map(String)]),
  ];
  return [
    `Round ${round} | Official ratings`,
    ids.length
      ? renderTable([
        [
          "Player ID",
          "Rating",
          "Minutes",
          "Real role",
          "Verified",
          "Withdrawal credit",
        ],
        ...ids.map((id) => {
          const n = value.notes[id];
          return [
            id,
            number(n?.note),
            n?.minutes == null ? "Unknown" : String(n.minutes),
            n?.titulaire == null
              ? "Unknown"
              : n.titulaire
              ? "Starter"
              : "Substitute",
            n ? n.verifiee ? "Yes" : "No" : "Unknown",
            value.forfaits.includes(Number(id))
              ? "30 points before multipliers"
              : "-",
          ];
        }),
      ])
      : "No ratings or designated withdrawals.",
  ].join("\n");
}
