import type { FantasyHttpClient } from "../http.ts";
import type { League } from "./types.ts";

export function getLeagues(http: FantasyHttpClient): Promise<League[]> {
  return http.get<League[]>("/api/ligues/mes-ligues");
}
