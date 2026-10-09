import type { Player } from "../api/joueurs/types.ts";
import type { PlayerSheetResponse } from "../api/joueurs/fiche/types.ts";
import type { TeamsheetsResponse } from "../api/context/types.ts";
import { MODEL } from "./model.ts";
export type Role = "starter" | "substitute";
export type SelectionStatus = Role | "absent" | "unknown";
export function selectionStatus(
  player: Pick<Player, "id" | "club">,
  sheets: TeamsheetsResponse,
): SelectionStatus {
  if (!sheets.clubs_annonces.includes(player.club)) return "unknown";
  const shirt = sheets.joueurs[String(player.id)];
  return shirt >= 1 && shirt <= 15
    ? "starter"
    : shirt >= 16 && shirt <= 23
    ? "substitute"
    : "absent";
}
export function projectPlayer(
  sheet: PlayerSheetResponse,
  role: Role,
  round: number,
  domination: number | null,
) {
  const warnings: string[] = [];
  const history = sheet.perfs.filter((p) =>
    p.numero < round && p.consolidee && p.titulaire === (role === "starter") &&
    p.minutes_jouees !== null
  ).sort((a, b) => b.numero - a.numero).slice(0, MODEL.performanceWindow);
  let weight = 0, scoringWeight = 0, total = 0, scoreWeight = 0;
  const evidence = history.map((p, i) => {
    const w = MODEL.performanceDecay ** i;
    weight += w;
    const scores = p.minutes_jouees! >= 10;
    if (scores) scoringWeight += w;
    const note = p.note === null ? null : Number(p.note);
    if (scores && note !== null && Number.isFinite(note)) {
      total += w * note;
      scoreWeight += w;
    }
    return {
      round: p.numero,
      minutes: p.minutes_jouees,
      score: note,
      weight: w,
    };
  });
  const baseline = scoreWeight ? total / scoreWeight : null;
  const scoringProbability = weight ? scoringWeight / weight : null;
  if (domination === null) {
    warnings.push("Missing reliable matchup evidence; neutral factor.");
  }
  if (baseline === null) {
    warnings.push("No comparable scored role history; projection unresolved.");
  }
  if (history.some((p) => p.minutes_jouees! >= 10 && p.note === null)) {
    warnings.push("Some eligible appearances have no rating.");
  }
  const matchupFactor = 1 + MODEL.matchupCoefficient * (domination ?? 0);
  const conditionalScore = baseline === null
    ? null
    : Math.max(0, Math.min(100, baseline * matchupFactor));
  return {
    playerId: sheet.joueur.id,
    role,
    baseline,
    scoringProbability,
    matchupFactor,
    conditionalScore,
    expected: conditionalScore === null
      ? null
      : conditionalScore * scoringProbability!,
    evidence,
    warnings,
  };
}
export function fantasyPoints(
  score: number,
  options: {
    bench: boolean;
    captain: boolean;
    impact: boolean;
    role: Role;
    minutes: number;
    withdrawal?: boolean;
    absent?: boolean;
  },
): number {
  const multiplier = (options.captain ? 2 : 1) * (options.impact ? 2 : 1);
  if (options.withdrawal) return 30 * multiplier;
  if (options.absent || options.minutes < 10) return 0;
  return score * multiplier *
    (options.bench && options.role === "starter" ? 0.5 : 1);
}
