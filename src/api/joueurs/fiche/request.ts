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
