import type { League } from "./types.ts";
import { requirePositiveInteger } from "../shared/validation.ts";

/** Like the site, prefer the official/global normal trading composition. */
export function selectCompositionId(
  leagues: readonly League[],
  id?: number,
): number {
  if (id !== undefined) {
    requirePositiveInteger(id, "composition ID");
    if (!leagues.some((league) => league.id === id)) {
      throw new Error(
        `Composition ${id} does not belong to your Nations Championship leagues.`,
      );
    }
    return id;
  }
  const candidates = leagues.filter((league) =>
    league.format === "normal" && league.mode !== "fixe"
  );
  const league = candidates.find((l) => l.est_globale) ??
    candidates.find((l) => l.est_officielle) ?? candidates[0];
  if (!league) {
    throw new Error(
      "No normal Nations Championship league found; join a league or specify a composition ID.",
    );
  }
  requirePositiveInteger(league.id, "composition ID");
  return league.id;
}
