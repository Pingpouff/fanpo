import type { FantasyHttpClient } from "../http.ts";
import type { GamesResponse } from "./types.ts";

export function getGames(http: FantasyHttpClient): Promise<GamesResponse> {
  return http.get<GamesResponse>("/api/jeux");
}
