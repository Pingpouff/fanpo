import type { Player } from "../api/joueurs/types.ts";

export interface PlayerFilters {
  club?: string;
  position?: string;
  name?: string;
  available?: boolean;
}

/** Local filters, combined with AND; never mutates the API response. */
export function filterPlayers(
  players: readonly Player[],
  filters: PlayerFilters = {},
): Player[] {
  const club = filters.club?.toLowerCase();
  const position = filters.position?.toLowerCase();
  const name = filters.name?.toLowerCase();
  return players.filter((player) =>
    (club === undefined || player.club.toLowerCase() === club) &&
    (position === undefined ||
      [player.poste, player.poste_secondaire, player.poste_tertiaire].some((
        value,
      ) => value?.toLowerCase() === position)) &&
    (name === undefined ||
      `${player.prenom} ${player.nom}`.toLowerCase().includes(name)) &&
    (!filters.available || !player.indisponible)
  );
}
