import type { FantasyHttpClient } from "../../http.ts";
import type { HistoricalCompositionResponse } from "./types.ts";
import { requirePositiveInteger } from "../../shared/validation.ts";

export function getCompositionForRound(
  http: FantasyHttpClient,
  id: number,
  round: number,
): Promise<HistoricalCompositionResponse> {
  requirePositiveInteger(id, "composition ID");
  requirePositiveInteger(round, "round");
  return http.get<HistoricalCompositionResponse>(
    `/api/compos/${id}/journee/${round}`,
  );
}
