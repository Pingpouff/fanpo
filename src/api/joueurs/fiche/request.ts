import type { FantasyHttpClient } from "../../http.ts";
import type { PlayerSheetResponse } from "./types.ts";
import { requirePositiveInteger } from "../../shared/validation.ts";

export function getPlayerSheet(
  http: FantasyHttpClient,
  playerId: number,
): Promise<PlayerSheetResponse> {
  requirePositiveInteger(playerId, "player ID");
  return http.get<PlayerSheetResponse>(`/api/joueurs/${playerId}/fiche`);
}

/** Fetch fiches in input order, with no more than five requests in flight. */
export async function getPlayerSheets(
  http: FantasyHttpClient,
  playerIds: readonly number[],
): Promise<PlayerSheetResponse[]> {
  const ids = [...playerIds];
  for (const id of ids) requirePositiveInteger(id, "player ID");
  const sheets: PlayerSheetResponse[] = new Array(ids.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < ids.length) {
      const index = next++;
      try {
        sheets[index] = await getPlayerSheet(http, ids[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }
  // Drain in-flight requests before reporting an error; no partial output.
  const results = await Promise.allSettled(
    Array.from({ length: Math.min(5, ids.length) }, () => worker()),
  );
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
  }
  return sheets;
}
