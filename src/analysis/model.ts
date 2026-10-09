/** Explicit, versioned v1 assumptions. No position-specific matchup bonuses. */
export const MODEL = Object.freeze({
  version: "fanpo-v1",
  performanceWindow: 5,
  performanceDecay: 0.8,
  matchupCoefficient: 0.10,
  homeAdvantage: 5,
  clubDecay: 0.9,
  priorMatches: 5,
  ratingIterations: 4,
  minReplayErrors: 20,
  dominationMargin: 20,
});
