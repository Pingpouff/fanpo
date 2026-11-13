import { type Competition, validateCompetition } from "./competition.ts";
import * as context from "./context/request.ts";
import { getGames } from "./jeux/request.ts";
import { getLeagues } from "./ligues/request.ts";
import type { League } from "./ligues/types.ts";
import { selectCompositionId } from "./ligues/selection.ts";
import { requirePositiveInteger } from "./shared/validation.ts";
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
  readonly #options: FantasyClientOptions;
  readonly competition: Competition;
  #leagues: Promise<League[]> | undefined;
  #playerIds: Promise<Set<number>> | undefined;

  constructor(options: FantasyClientOptions) {
    this.competition = validateCompetition(options.competition ?? "top14");
    this.#options = { ...options };
    this.#http = new FantasyHttpClient(this.#options);
  }

  /** Subscribe to completed requests; call the returned function to detach. */
  observeRequests(observer: RequestObserver) {
    return this.#http.observeRequests(observer);
  }

  /** Return an independent context while preserving credentials and injected transport. */
  forCompetition(competition: Competition): FantasyClient {
    validateCompetition(competition);
    return competition === this.competition
      ? this
      : new FantasyClient({ ...this.#options, competition });
  }

  getGames() {
    return getGames(this.#http);
  }
  getLeagues() {
    const pending = getLeagues(this.#http).catch((error) => {
      if (this.#leagues === pending) this.#leagues = undefined;
      throw error;
    });
    this.#leagues = pending;
    return pending;
  }

  async #compositionId(id?: number): Promise<number> {
    if (id !== undefined) requirePositiveInteger(id, "composition ID");
    return this.competition === "top14"
      ? id ?? 1
      : selectCompositionId(await (this.#leagues ?? this.getLeagues()), id);
  }

  async #checkPlayers(ids: readonly number[]) {
    for (const id of ids) requirePositiveInteger(id, "player ID");
    if (this.competition === "top14" || !ids.length) return;
    this.#playerIds ??= this.getPlayers().then((data) =>
      new Set(data.joueurs.map((p) => p.id))
    ).catch((error) => {
      this.#playerIds = undefined;
      throw error;
    });
    const catalogue = await this.#playerIds;
    for (const id of ids) {
      if (!catalogue.has(id)) {
        throw new Error(
          `Player ${id} does not belong to Nations Championship.`,
        );
      }
    }
  }
  getRoundNotes(round: number) {
    return context.getRoundNotes(this.#http, round);
  }
  getStandings() {
    return context.getStandings(this.#http);
  }
  getMatches(round?: number) {
    return context.getMatches(this.#http, round);
  }
  getRound() {
    return context.getRound(this.#http);
  }
  getTeamsheets() {
    return context.getTeamsheets(this.#http);
  }
  getLocks() {
    return context.getLocks(this.#http);
  }
  getPlayers() {
    return getPlayers(this.#http);
  }

  getPlayerSheet(playerId: number) {
    requirePositiveInteger(playerId, "player ID");
    return this.competition === "top14"
      ? getPlayerSheet(this.#http, playerId)
      : this.#checkPlayers([playerId]).then(() =>
        getPlayerSheet(this.#http, playerId)
      );
  }

  getPlayerSheets(playerIds: readonly number[]) {
    for (const id of playerIds) requirePositiveInteger(id, "player ID");
    return this.competition === "top14" || !playerIds.length
      ? getPlayerSheets(this.#http, playerIds)
      : this.#checkPlayers(playerIds).then(() =>
        getPlayerSheets(this.#http, playerIds)
      );
  }

  getComposition(id?: number) {
    if (id !== undefined) requirePositiveInteger(id, "composition ID");
    return this.competition === "top14"
      ? getComposition(this.#http, id ?? 1)
      : this.#compositionId(id).then((selected) =>
        getComposition(this.#http, selected)
      );
  }

  getCompositionForRound(id: number | undefined, round: number) {
    if (id !== undefined) requirePositiveInteger(id, "composition ID");
    requirePositiveInteger(round, "round");
    return this.competition === "top14"
      ? getCompositionForRound(this.#http, id ?? 1, round)
      : this.#compositionId(id).then((selected) =>
        getCompositionForRound(this.#http, selected, round)
      );
  }
}
