/** The sheet uses poste_principal, unlike the players list's poste field. */
export interface PlayerSheetPlayer {
  id: number;
  nom: string;
  prenom: string;
  nationalite: string;
  taille_cm: number | null;
  poids_kg: number | null;
  indisponible: boolean;
  poste_principal: string;
  poste_secondaire: string | null;
  poste_tertiaire: string | null;
  club: string;
  club_nom: string;
  valeur: string;
  valeur_initiale: string;
  [field: string]: unknown;
}

/** Detailed numeric stat keys are supplied by the API and can evolve. */
export type PlayerMatchStats = Record<string, number>;

export interface PlayerPerformance {
  numero: number;
  note: string | null;
  minutes_jouees: number | null;
  titulaire: boolean | null;
  poste_joue: string | null;
  consolidee: boolean;
  stats: PlayerMatchStats;
  pm: number | null;
  adversaire: string | null;
  resultat: string | null;
  domicile: boolean | null;
  [field: string]: unknown;
}

export interface PlayerSelection {
  journee: number;
  source: string;
  total: number;
  pct: number;
  rare: number;
  populaire: number;
  [field: string]: unknown;
}

export interface PlayerAggregateStats {
  matchs: number;
  matchs_total: number;
  moyenne: number | null;
  meilleure: number | null;
  pire: number | null;
  essais: number;
  points_marques: number;
  [field: string]: unknown;
}

export interface PlayerSheetResponse {
  joueur: PlayerSheetPlayer;
  perfs: PlayerPerformance[];
  selection: PlayerSelection;
  stats: PlayerAggregateStats;
  [field: string]: unknown;
}
