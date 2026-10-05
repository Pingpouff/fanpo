import type {
  CompositionResponse,
  HistoricalCompositionResponse,
} from "../src/types.ts";

/** Synthetic current selection using the observed API field names. */
export const currentComposition: CompositionResponse = {
  journee: {
    id: 5,
    numero: 5,
    type: "reguliere",
    deadline_at: "2026-10-03T12:30:00.000Z",
    statut: "a_venir",
  },
  equipe: { id: 123, nom: "Test team", budget: "11.15" },
  cap: "11.00",
  verrou: { en_cours: true, coups_envoi: { RCT: "2026-10-03T12:30:00.000Z" } },
  compo: {
    statut: "validee",
    capitaine_slot: 8,
    impact_slot: 17,
    slots: Array.from({ length: 17 }, (_, index) => ({
      slot: index + 1,
      joueur_id: 115 + index,
      prix_paye: "0.42",
      prenom: "Test",
      nom: `Player ${index + 1}`,
      poste: "PIL",
      club: "RCT",
      extra_slot_field: "preserved",
    })),
  },
  extra_response_field: "preserved",
};

/** Synthetic response: API totals and multipliers are inputs, never calculated. */
export const historicalComposition: HistoricalCompositionResponse = {
  journee: 4,
  deadline_at: "2026-09-26T12:30:00.000Z",
  compo: {
    statut: "validee",
    capitaine_slot: 13,
    capitaine_auto: true,
    impact_slot: 17,
    points: "1322.47",
    slots: Array.from({ length: 17 }, (_, index) => ({
      slot: index + 1,
      joueur_id: 115 + index,
      prix_paye: "0.42",
      jnom: `Player ${index + 1}`,
      jprenom: "Test",
      jclub: "RCT",
      jcouleur: "#e6001b",
      jcouleur2: "#000000",
      note: 10,
      delta_valeur: 0,
      minutes: 80,
      titulaire: true,
      forfait: false,
      points: 10,
      extra_slot_field: "preserved",
    })),
    extra_composition_field: true,
  },
  extra_response_field: "preserved",
};

Object.assign(historicalComposition.compo.slots[0], {
  jprenom: "Leo",
  jnom: "Ametlla",
  note: 70.19,
  points: 70.19,
  minutes: 47,
});
Object.assign(historicalComposition.compo.slots[1], {
  titulaire: false,
  minutes: 15,
  note: 24.5,
  points: 24.5,
  delta_valeur: -0.03,
});
Object.assign(historicalComposition.compo.slots[2], {
  forfait: true,
  minutes: 0,
  note: 0,
  points: 0,
});
Object.assign(historicalComposition.compo.slots[3], {
  note: null,
  minutes: null,
  points: null,
  titulaire: null,
  delta_valeur: null,
});
Object.assign(historicalComposition.compo.slots[12], {
  jprenom: "Santiago",
  jnom: "Chocobares",
  jclub: "ST",
  note: 70.15,
  points: 140.3,
  minutes: 66,
  delta_valeur: 0.02,
});
Object.assign(historicalComposition.compo.slots[16], {
  jprenom: "Jiuta",
  jnom: "Wainiqolo",
  jclub: "LOU",
  note: 61.89,
  points: 123.78,
  minutes: 15,
  titulaire: false,
});
