import type { FantasyHttpClient } from "../http.ts";
import type { CompositionResponse } from "./types.ts";
import { requirePositiveInteger } from "../shared/validation.ts";

export function getComposition(
  http: FantasyHttpClient,
  id: number,
): Promise<CompositionResponse> {
  requirePositiveInteger(id, "composition ID");
  return http.get<CompositionResponse>(`/api/compos/${id}`);
}
