import type { Player, PlayersResponse } from "../src/types.ts";

export function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    prenom: "Demba",
    nom: "Bamba",
    nationalite: "France",
    poste: "PIL",
    poste_secondaire: null,
    poste_tertiaire: null,
    indisponible: false,
    taille_cm: null,
    poids_kg: null,
    pilier_cote: null,
    dl_cote: null,
    club: "UBB",
    club_nom: "Union Bordeaux Bègles",
    valeur: "12.50",
    moyenne: null,
    ...overrides,
  };
}

export const response: PlayersResponse = {
  journee: {
    id: 1,
    numero: 3,
    type: "test",
    deadline_at: "2026-10-10T12:00:00Z",
    statut: "test",
    additional_matchday_field: true,
  },
  joueurs: [
    player({ additional_player_field: { score: 5 } }),
    player({
      id: 2,
      prenom: "Alex",
      nom: "Martin",
      club: "ST",
      indisponible: true,
    }),
  ],
  additional_response_field: "preserved",
};
