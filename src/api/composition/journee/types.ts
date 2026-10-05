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
