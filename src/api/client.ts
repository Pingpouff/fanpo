import type { Matchday } from "./shared/types.ts";
import type {
  LocksResponse,
  MatchesResponse,
  RoundNotesResponse,
  StandingsResponse,
  TeamsheetsResponse,
} from "./context/types.ts";
import {
  type FantasyClientOptions,
  FantasyHttpClient,
  type RequestObserver,
} from "./http.ts";
import { getPlayers } from "./joueurs/request.ts";
import { getPlayerSheet, getPlayerSheets } from "./joueurs/fiche/request.ts";
import { getComposition } from "./composition/request.ts";
import { getCompositionForRound } from "./composition/journee/request.ts";
export { FantasyHttpError } from "./http.ts";
export type {
  FantasyClientOptions,
  RequestMetadata,
  RequestObserver,
} from "./http.ts";

/** Reusable facade; endpoint implementations live in their feature folders. */
export class FantasyClient {
  readonly #http: FantasyHttpClient;

  constructor(options: FantasyClientOptions) {
    this.#http = new FantasyHttpClient(options);
  }

  /** Subscribe to completed requests; call the returned function to detach. */
  observeRequests(observer: RequestObserver) {
    return this.#http.observeRequests(observer);
  }

  getRoundNotes(round: number) {
    if (!Number.isSafeInteger(round) || round <= 0) {
      throw new Error("Round must be a positive integer");
    }
    return this.#http.get<RoundNotesResponse>(
      `/api/notes-journee?journee=${round}`,
    );
  }
  getStandings() {
    return this.#http.get<StandingsResponse>("/api/top14/classement");
  }
  async getMatches(round?: number) {
    if (round !== undefined && (!Number.isSafeInteger(round) || round <= 0)) {
      throw new Error("Round must be a positive integer");
    }
    const result = await this.#http.get<MatchesResponse>("/api/top14/matchs");
    return round === undefined
      ? result
      : { ...result, matchs: result.matchs.filter((m) => m.journee === round) };
  }
  getRound() {
    return this.#http.get<Matchday>("/api/journees/cible");
  }
  getTeamsheets() {
    return this.#http.get<TeamsheetsResponse>("/api/feuilles");
  }
  getLocks() {
    return this.#http.get<LocksResponse>("/api/compos/etat-verrou");
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
