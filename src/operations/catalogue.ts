import type { PlayersResponse } from "../api/joueurs/types.ts";
import type { Matchday } from "../api/shared/types.ts";
import type { Store } from "../data/store.ts";
import { stale } from "./data.ts";
import { filterPlayers, type PlayerFilters } from "./player-filters.ts";

/** Read-only discovery. Acquisition and scoring remain separate operations. */
export function readCatalogue(
  store: Store,
  filters: PlayerFilters,
  now = new Date(),
) {
  const snapshot = store.read<PlayersResponse>("/api/joueurs");
  if (!snapshot) {
    throw new Error("Cached player catalogue unavailable. Run sync online.");
  }
  const target = store.read<Matchday>("/api/journees/cible");
  const round = target?.data.numero ?? snapshot.data.journee.numero;
  const warnings: string[] = [];
  if (!target) {
    warnings.push(
      "Cached target round unavailable; target-round freshness is unresolved. Run sync online.",
    );
  } else if (stale(target, round, now)) {
    warnings.push("Cached target round is stale. Run sync online.");
  }
  const outdated = stale(snapshot, round, now) ||
    snapshot.data.journee.numero !== round;
  if (outdated) {
    warnings.push(
      "Cached player catalogue is stale or belongs to a different round. Run sync online.",
    );
  }
  return {
    round,
    players: filterPlayers(snapshot.data.joueurs, filters),
    evidence: {
      snapshotId: snapshot.id,
      endpoint: snapshot.endpoint,
      fetchedAt: snapshot.fetchedAt,
      stale: outdated,
    },
    warnings,
  };
}
