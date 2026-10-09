import { type FantasyClientOptions, FantasyHttpClient } from "./http.ts";
import { getPlayers } from "./joueurs/request.ts";
import { getPlayerSheet, getPlayerSheets } from "./joueurs/fiche/request.ts";
import { getComposition } from "./composition/request.ts";
import { getCompositionForRound } from "./composition/journee/request.ts";
export { FantasyHttpError } from "./http.ts";
export type { FantasyClientOptions } from "./http.ts";

/** Reusable facade; endpoint implementations live in their feature folders. */
export class FantasyClient {
  readonly #http: FantasyHttpClient;

  constructor(options: FantasyClientOptions) {
    this.#http = new FantasyHttpClient(options);
  }

  getPlayers() {
    return getPlayers(this.#http);
  }

  getPlayerSheet(playerId: number) {
    return getPlayerSheet(this.#http, playerId);
  }

  getPlayerSheets(playerIds: readonly number[]) {
    return getPlayerSheets(this.#http, playerIds);
  }

  getComposition(id: number) {
    return getComposition(this.#http, id);
  }

  getCompositionForRound(id: number, round: number) {
    return getCompositionForRound(this.#http, id, round);
  }
}
