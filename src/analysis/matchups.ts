import type { Match } from "../api/context/types.ts";
import { MODEL } from "./model.ts";
function completed(m: Match): boolean {
  return m.statut === "Result" && typeof m.dom.score === "number" &&
    typeof m.ext.score === "number";
}
function ratings(history: Match[], round: number): Record<string, number> {
  const clubs = [...new Set(history.flatMap((m) => [m.dom.abrev, m.ext.abrev]))]
    .sort();
  let values: Record<string, number> = Object.fromEntries(
    clubs.map((c) => [c, 0]),
  );
  for (let i = 0; i < MODEL.ratingIterations; i++) {
    const next: Record<string, number> = {};
    for (const c of clubs) {
      let sum = 0, weight = MODEL.priorMatches;
      for (const m of history) {
        if (m.dom.abrev !== c && m.ext.abrev !== c) continue;
        const home = m.dom.abrev === c;
        const w = MODEL.clubDecay ** (round - 1 - m.journee);
        const margin = (m.dom.score! - m.ext.score! - MODEL.homeAdvantage) *
          (home ? 1 : -1);
        sum += w * (margin + (values[home ? m.ext.abrev : m.dom.abrev] ?? 0));
        weight += w;
      }
      next[c] = sum / weight;
    }
    values = next;
  }
  return values;
}
function margin(m: Match, rs: Record<string, number>) {
  return MODEL.homeAdvantage + (rs[m.dom.abrev] ?? 0) - (rs[m.ext.abrev] ?? 0);
}
export function forecastMatchups(all: readonly Match[], round: number) {
  const history = all.filter((m) => m.journee < round && completed(m)).sort((
    a,
    b,
  ) => a.journee - b.journee || a.dom.abrev.localeCompare(b.dom.abrev));
  const errors: number[] = [], naive: number[] = [];
  for (const r of [...new Set(history.map((m) => m.journee))]) {
    const earlier = history.filter((m) => m.journee < r);
    if (!earlier.length) continue;
    const rs = ratings(earlier, r);
    for (const m of history.filter((m) => m.journee === r)) {
      const actual = m.dom.score! - m.ext.score!;
      errors.push(actual - margin(m, rs));
      naive.push(actual - MODEL.homeAdvantage);
    }
  }
  const rs = ratings(history, round);
  const enough = errors.length >= MODEL.minReplayErrors;
  const mae = (a: number[]) =>
    a.length ? a.reduce((s, n) => s + Math.abs(n), 0) / a.length : null;
  const matches = all.filter((m) => m.journee === round).map((m) => {
    const expectedMargin = margin(m, rs);
    const samples = errors.map((e) => Math.round(expectedMargin + e));
    const probability = (fn: (n: number) => boolean) =>
      enough ? samples.filter(fn).length / samples.length : null;
    const overwhelm = probability((n) => n >= MODEL.dominationMargin),
      overwhelmed = probability((n) => n <= -MODEL.dominationMargin);
    return {
      home: m.dom.abrev,
      away: m.ext.abrev,
      date: m.date,
      expectedMargin,
      winProbability: probability((n) => n > 0),
      drawProbability: probability((n) => n === 0),
      lossProbability: probability((n) => n < 0),
      overwhelmProbability: overwhelm,
      overwhelmedProbability: overwhelmed,
      domination: enough ? overwhelm! - overwhelmed! : null,
      warnings: enough
        ? []
        : ["Insufficient historical forecast errors; neutral matchup factor."],
    };
  });
  return {
    model: MODEL,
    round,
    ratings: rs,
    calibration: {
      samples: errors.length,
      mae: mae(errors),
      homeBaselineMae: mae(naive),
      errors,
      method:
        "Round replay; earlier completed rounds only. Empirical errors; probabilities are exploratory, not externally calibrated.",
    },
    matches,
  };
}
