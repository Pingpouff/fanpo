import type { Matchday } from "../shared/types.ts";

export interface Player {
  id: number;
  prenom: string;
  nom: string;
  nationalite: string;
  poste: string;
  poste_secondaire: string | null;
  poste_tertiaire: string | null;
  indisponible: boolean;
  taille_cm: number | null;
  poids_kg: number | null;
  pilier_cote: string | null;
  dl_cote: string | null;
  club: string;
  club_nom: string;
  valeur: string;
  moyenne: number | null;
  [field: string]: unknown;
}

export interface PlayersResponse {
  journee: Matchday;
  joueurs: Player[];
  [field: string]: unknown;
}
