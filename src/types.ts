/** Known fields; additional fields returned by the API are preserved. */
export interface Matchday {
  id: number;
  numero: number;
  type: string;
  deadline_at: string;
  statut: string;
  [field: string]: unknown;
}

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

/** Current selections, distinct from historical match outcomes. */
export interface CompositionResponse {
  journee: Matchday;
  equipe: {
    id: number;
    nom: string;
    budget: string;
    [field: string]: unknown;
  };
  cap: string;
  compo: CurrentComposition | null;
  [field: string]: unknown;
}

export interface CurrentComposition {
  statut: string;
  capitaine_slot: number | null;
  impact_slot: number | null;
  slots: CurrentCompositionSlot[];
  [field: string]: unknown;
}

export interface CurrentCompositionSlot {
  slot: number;
  joueur_id: number;
  prix_paye: string;
  prenom: string;
  nom: string;
  poste: string;
  club: string;
  [field: string]: unknown;
}

/** Round outcomes, distinct from the current composition's selection metadata. */
export interface HistoricalCompositionResponse {
  journee: number;
  deadline_at: string;
  compo: HistoricalComposition;
  [field: string]: unknown;
}

export interface HistoricalComposition {
  statut: string;
  capitaine_slot: number | null;
  capitaine_auto: boolean;
  impact_slot: number | null;
  points: string | null;
  slots: HistoricalCompositionSlot[];
  [field: string]: unknown;
}

export interface HistoricalCompositionSlot {
  slot: number;
  joueur_id: number;
  prix_paye: string;
  jnom: string;
  jprenom: string;
  jclub: string;
  jcouleur: string;
  jcouleur2: string;
  note: number | null;
  delta_valeur: number | null;
  minutes: number | null;
  /** Actual rugby match status, independent of the Fantasy slot. */
  titulaire: boolean | null;
  forfait: boolean;
  /** API-provided points already include any multipliers. */
  points: number | null;
  [field: string]: unknown;
}
