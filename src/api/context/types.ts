import type { Matchday } from "../shared/types.ts";
export interface ClubSide {
  nom: string;
  abrev: string;
  score: number | null;
  [field: string]: unknown;
}
export interface Match {
  journee: number;
  date: string;
  heure: string;
  stade: string;
  statut: string;
  dom: ClubSide;
  ext: ClubSide;
  [field: string]: unknown;
}
export interface MatchesResponse {
  matchs: Match[];
  [field: string]: unknown;
}
export interface Standing {
  equipe: string;
  abrev: string;
  position: number;
  joues: number;
  points: number;
  victoires: number;
  nuls: number;
  defaites: number;
  diff: number;
  pts_pour: number;
  pts_contre: number;
  [field: string]: unknown;
}
export interface StandingsResponse {
  classement: Standing[];
  [field: string]: unknown;
}
export interface TeamsheetsResponse {
  journee: number;
  clubs_annonces: string[];
  joueurs: Record<string, number>;
  notes_provisoires: boolean;
  [field: string]: unknown;
}
export interface LockState {
  en_cours: boolean;
  demarres: string[];
  liberes: string[];
  coups_envoi: Record<string, string>;
  prochain: string | null;
  [field: string]: unknown;
}
export interface LocksResponse {
  verrou: LockState;
  journee: Matchday;
  [field: string]: unknown;
}

export interface RoundNotesResponse {
  notes: Record<
    string,
    {
      note: number | null;
      minutes: number | null;
      titulaire: boolean | null;
      verifiee: boolean;
      [field: string]: unknown;
    }
  >;
  forfaits: number[];
  [field: string]: unknown;
}
