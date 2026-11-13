import type { FantasyHttpClient } from "../http.ts";
import type { Matchday } from "../shared/types.ts";
import { requirePositiveInteger as positiveId } from "../shared/validation.ts";
import type {
  LocksResponse,
  MatchesResponse,
  RoundNotesResponse,
  StandingsResponse,
  TeamsheetsResponse,
} from "./types.ts";

export function getRoundNotes(http: FantasyHttpClient, round: number) {
  positiveId(round, "Round");
  return http.get<RoundNotesResponse>(`/api/notes-journee?journee=${round}`);
}

export function getStandings(http: FantasyHttpClient) {
  return http.get<StandingsResponse>("/api/top14/classement");
}

export async function getMatches(http: FantasyHttpClient, round?: number) {
  if (round !== undefined) positiveId(round, "Round");
  const result = await http.get<MatchesResponse>("/api/top14/matchs");
  return round === undefined
    ? result
    : { ...result, matchs: result.matchs.filter((m) => m.journee === round) };
}

export function getRound(http: FantasyHttpClient) {
  return http.get<Matchday>("/api/journees/cible");
}

export function getTeamsheets(http: FantasyHttpClient) {
  return http.get<TeamsheetsResponse>("/api/feuilles");
}

export function getLocks(http: FantasyHttpClient) {
  return http.get<LocksResponse>("/api/compos/etat-verrou");
}
