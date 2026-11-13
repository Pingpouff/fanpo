import {
  colorRating,
  heading,
  signed,
  status,
  tone,
} from "../shared/colors.ts";
import { renderTable } from "../shared/output.ts";
import type { Matchday } from "../../api/shared/types.ts";
import type { Player } from "../../api/joueurs/types.ts";
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
  value == null ? tone("Unresolved", "muted") : `${(100 * value).toFixed(1)}%`;
const money = (units: number) => `${(units / 1_000_000).toFixed(2)} M`;
const role = (
  value: string,
) =>
  status(
    {
      starter: "Starter",
      substitute: "Substitute",
      unknown: "Unknown",
      absent: "Absent",
    }[value] ?? value,
  );
const warnings = (items: readonly string[] | undefined, prefix = "Warning") =>
  [...new Set(items ?? [])].map((w) =>
    `${tone(prefix + ":", prefix === "Error" ? "bad" : "caution")} ${w}`
  );

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
    `Validation: ${status(v.status)}`,
    `Salary cap: ${money(v.budget)} | Cost: ${money(v.cost)} | Remaining: ${
      signed(v.remaining, money(v.remaining))
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
      heading(
        `Stored data | Season ${value.scope.season} | Profile ${value.scope.profile}`,
      ),
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
              status(s.stale ? "Stale" : "Fresh"),
            ],
          ),
        ])
        : tone("No stored data. Run sync online.", "muted"),
    ].join("\n");
  }
  const value = input as Envelope;
  const lines = [
    heading(`Round ${value.round} | Model ${value.model.version}`),
    value.fullyCurrent
      ? tone("Requested data is current.", "good")
      : tone("Data is incomplete or stale.", "caution"),
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
        heading(
          `${p.name ?? `Player ${p.playerId}`} (#${p.playerId})${
            p.club ? ` | ${p.club}` : ""
          }${p.price ? ` | ${p.price} M` : ""}`,
        ),
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
                colorRating(s.baseline, number(s.baseline)),
                percent(s.scoringProbability),
                signed(
                  s.matchupFactor == null ? null : s.matchupFactor - 1,
                  `x${number(s.matchupFactor, 3)}`,
                ),
                number(s.expected),
              ];
            }),
          ]),
        );
        for (const r of ["starter", "substitute"] as const) {
          const evidence = p.scenarios[r].evidence;
          if (evidence.length) {
            lines.push(
              heading(
                `${
                  r === "starter" ? "Starter" : "Substitute"
                } history (newest first):`,
              ),
              renderTable([
                ["Round", "Minutes", "Rating", "Weight"],
                ...evidence.map(
                  (e) => [
                    String(e.round),
                    String(e.minutes),
                    colorRating(e.score, number(e.score)),
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
              signed(m.expectedMargin, number(m.expectedMargin)),
              percent(m.winProbability),
              percent(m.drawProbability),
              percent(m.lossProbability),
              percent(m.overwhelmProbability),
              percent(m.overwhelmedProbability),
              signed(m.domination, number(m.domination, 3)),
            ],
          ),
        ])
        : tone("No fixtures available.", "muted"),
      ...result.matches.flatMap((m) =>
        warnings(m.warnings, `${m.home} vs ${m.away}`)
      ),
    );
  }
  if (kind === "lineup") {
    lines.push(...lineup(value.result as LineupView, labels));
  }
  if (kind === "compare") {
    const batch = value.result as {
      before: LineupView;
      alternatives?: {
        name: string;
        after: LineupView;
        expectedDelta: number | null;
        costDelta: number;
        changes: { slot: number; playerId: number }[];
      }[];
    };
    if (batch.alternatives) {
      lines.push(
        `Current cost: ${money(batch.before.validation.cost)} | Remaining: ${
          money(batch.before.validation.remaining)
        }`,
        "Forecasts include real roles and matchup influence. Unresolved totals remain unresolved; alternatives are independent.",
        renderTable([
          [
            "Candidate",
            "Validation",
            "Cost",
            "Remaining",
            "Cost change",
            "Expected change",
          ],
          ...batch.alternatives.map((a) => [
            a.name,
            status(a.after.validation.status),
            money(a.after.validation.cost),
            signed(
              a.after.validation.remaining,
              money(a.after.validation.remaining),
            ),
            signed(a.costDelta, money(a.costDelta), true),
            signed(a.expectedDelta, number(a.expectedDelta)),
          ]),
        ]),
      );
      for (const a of batch.alternatives) {
        lines.push(
          "",
          heading(a.name),
          renderTable([
            [
              "Slot",
              "Before",
              "After",
              "Real role",
              "Before forecast",
              "After forecast",
            ],
            ...a.changes.map((change) => {
              const old = batch.before.slots.find((s) =>
                s.slot === change.slot
              );
              const next = a.after.slots.find((s) => s.slot === change.slot)!;
              return [
                String(change.slot),
                old
                  ? labels?.get(old.playerId) ?? `#${old.playerId}`
                  : "Missing",
                labels?.get(change.playerId) ?? `#${change.playerId}`,
                role(next.status),
                colorRating(old?.expected, number(old?.expected)),
                colorRating(next.expected, number(next.expected)),
              ];
            }),
          ]),
          ...warnings(a.after.validation.errors, "Error"),
          ...warnings([...a.after.validation.warnings, ...a.after.warnings]),
          ...a.after.slots.flatMap((s) =>
            warnings(s.warnings, `Slot ${s.slot} / player ${s.playerId}`)
          ),
        );
      }
    } else {
      const result = value.result as {
        before: LineupView;
        after: LineupView;
        expectedDelta: number | null;
        costDelta: number;
        changes: { slot: number; playerId: number }[];
      };
      lines.push(
        `Expected points change: ${
          signed(result.expectedDelta, number(result.expectedDelta))
        }`,
        `Cost change: ${
          signed(
            result.costDelta,
            `${result.costDelta > 0 ? "+" : ""}${money(result.costDelta)}`,
            true,
          )
        }`,
        "",
        heading("Before"),
        ...lineup(result.before, labels),
        "",
        heading("After"),
        ...lineup(result.after, labels),
        "",
        result.changes.length
          ? renderTable([
            ["Changed slot", "New player"],
            ...result.changes.map(
              (
                s,
              ) => [
                String(s.slot),
                labels?.get(s.playerId) ?? `#${s.playerId}`,
              ],
            ),
          ])
          : tone("No player changes.", "muted"),
      );
    }
  }
  if (value.evidence.length) {
    lines.push(
      "",
      heading(`Evidence: ${value.evidence.length} stored sources`),
      ...value.evidence.map((e) =>
        `  ${e.endpoint} — snapshot #${e.id}, fetched ${e.fetchedAt}`
      ),
    );
  }
  return lines.join("\n").trimEnd();
}
export function renderRound(value: Matchday): string {
  return [
    heading(`Round ${value.numero} | ${value.type}`),
    `Status: ${status(value.statut)}`,
    `Deadline: ${value.deadline_at}`,
    `Deadline passed: ${
      value.deadline_passee === undefined
        ? tone("Unknown", "muted")
        : value.deadline_passee
        ? tone("Yes", "bad")
        : tone("No", "good")
    }`,
    `Scored: ${
      value.notee === undefined
        ? tone("Unknown", "muted")
        : value.notee
        ? tone("Yes", "good")
        : tone("No", "caution")
    }`,
  ].join("\n");
}
export function renderTeamsheets(value: TeamsheetsResponse): string {
  return [
    heading(`Round ${value.journee}`),
    `Announced clubs: ${value.clubs_annonces.join(", ") || "None"}`,
    `Provisional ratings: ${
      tone(
        value.notes_provisoires ? "Yes" : "No",
        value.notes_provisoires ? "caution" : "good",
      )
    }`,
    "Unannounced clubs have unknown roles.",
    Object.keys(value.joueurs).length
      ? renderTable([
        ["Player ID", "Shirt", "Real role"],
        ...Object.entries(value.joueurs).map((
          [id, shirt],
        ) => [id, String(shirt), role(shirt <= 15 ? "starter" : "substitute")]),
      ])
      : tone("No announced players.", "muted"),
  ].join("\n");
}
export function renderLocks(value: LocksResponse): string {
  const v = value.verrou;
  const clubs = [
    ...new Set([...Object.keys(v.coups_envoi), ...v.demarres, ...v.liberes]),
  ];
  return [
    heading(`Round ${value.journee.numero}`),
    `Matches in progress: ${
      tone(v.en_cours ? "Yes" : "No", v.en_cours ? "caution" : "muted")
    }`,
    `Next kickoff: ${v.prochain ?? "None"}`,
    clubs.length
      ? renderTable([
        ["Club", "Kickoff", "Server lock"],
        ...clubs.map(
          (c) => [
            c,
            v.coups_envoi[c] ?? "Unknown",
            status(
              v.liberes.includes(c)
                ? "Released"
                : v.demarres.includes(c)
                ? "Locked"
                : "Not started",
            ),
          ],
        ),
      ])
      : tone("No club locks reported.", "muted"),
  ].join("\n");
}
export function renderRatings(
  value: RoundNotesResponse,
  round: number,
  players: readonly Player[] = [],
): string {
  const byId = new Map(players.map((p) => [String(p.id), p]));
  const ids = [
    ...new Set([...Object.keys(value.notes), ...value.forfaits.map(String)]),
  ];
  return [
    heading(`Round ${round} | Official ratings`),
    ids.length
      ? renderTable([
        [
          "Player ID",
          "Name",
          "Position",
          "Club",
          "Rating",
          "Minutes",
          "Real role",
          "Verified",
          "Withdrawal credit",
        ],
        ...ids.map((id) => {
          const n = value.notes[id];
          const p = byId.get(id);
          return [
            id,
            p ? `${p.prenom} ${p.nom}` : "Unknown",
            p
              ? [p.poste, p.poste_secondaire, p.poste_tertiaire].filter(Boolean)
                .join(" / ")
              : "Unknown",
            p?.club ?? "Unknown",
            colorRating(n?.note, number(n?.note)),
            n?.minutes == null ? "Unknown" : String(n.minutes),
            role(
              n?.titulaire == null
                ? "unknown"
                : n.titulaire
                ? "starter"
                : "substitute",
            ),
            n
              ? tone(n.verifiee ? "Yes" : "No", n.verifiee ? "good" : "caution")
              : tone("Unknown", "muted"),
            value.forfaits.includes(Number(id))
              ? tone("30 points before multipliers", "caution")
              : "-",
          ];
        }),
      ])
      : tone("No ratings or designated withdrawals.", "muted"),
  ].join("\n");
}
