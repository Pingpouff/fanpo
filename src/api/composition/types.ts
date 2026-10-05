import type { Matchday } from "../shared/types.ts";

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
