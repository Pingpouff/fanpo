/** Stable application context; upstream numeric IDs are discovered per account. */
export type Competition = "top14" | "nationchampionship";

export function competitionName(competition: Competition): string {
  return competition === "nationchampionship"
    ? "Nations Championship"
    : "Top 14";
}

export function validateCompetition(value: Competition): Competition {
  if (value !== "top14" && value !== "nationchampionship") {
    throw new Error("Unknown competition; use top14 or nationchampionship.");
  }
  return value;
}
