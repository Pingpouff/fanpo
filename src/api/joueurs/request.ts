import type { FantasyHttpClient } from "../http.ts";
import type { PlayersResponse } from "./types.ts";

export function getPlayers(http: FantasyHttpClient): Promise<PlayersResponse> {
  return http.get<PlayersResponse>("/api/joueurs");
}
