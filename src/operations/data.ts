import { type DataAccessMetadata, jsonBytes } from "./metadata.ts";
import type { FantasyClient } from "../api/client.ts";
import type { Snapshot, Store } from "../data/store.ts";
export interface RefreshOptions {
  onDataAccess?: (event: DataAccessMetadata) => void;
  offline?: boolean;
  force?: boolean;
  now?: Date;
}
export function ttl(endpoint: string): number {
  if (endpoint.includes("etat-verrou")) return 60_000;
  if (endpoint.includes("fiche")) return 86_400_000;
  if (endpoint.includes("top14")) return 21_600_000;
  return 300_000;
}
export function stale(
  snapshot: Omit<Snapshot, "data">,
  round: number,
  now = new Date(),
): boolean {
  return (snapshot.endpoint !== "/api/journees/cible" &&
    snapshot.round !== round) ||
    now.getTime() - Date.parse(snapshot.fetchedAt) > ttl(snapshot.endpoint) ||
    Date.parse(snapshot.fetchedAt) > now.getTime();
}
export function fetchEndpoint(
  client: FantasyClient,
  endpoint: string,
): Promise<unknown> {
  switch (endpoint) {
    case "/api/joueurs":
      return client.getPlayers();
    case "/api/ligues/mes-ligues":
      return client.getLeagues();
    case "/api/journees/cible":
      return client.getRound();
    case "/api/top14/matchs":
      return client.getMatches();
    case "/api/top14/classement":
      return client.getStandings();
    case "/api/feuilles":
      return client.getTeamsheets();
    case "/api/compos/etat-verrou":
      return client.getLocks();
  }
  const sheet = endpoint.match(/^\/api\/joueurs\/(\d+)\/fiche$/);
  if (sheet) return client.getPlayerSheet(Number(sheet[1]));
  const comp = endpoint.match(/^\/api\/compos\/(\d+)$/);
  if (comp) return client.getComposition(Number(comp[1]));
  const notes = endpoint.match(/^\/api\/notes-journee\?journee=(\d+)$/);
  if (notes) return client.getRoundNotes(Number(notes[1]));
  throw new Error(`Unsupported data endpoint ${endpoint}`);
}
/** Successful endpoints commit independently; a failed endpoint retains its previous snapshot. */
export async function acquire(
  store: Store,
  getClient: () => FantasyClient,
  endpoints: readonly string[],
  round: number,
  options: RefreshOptions,
) {
  const now = options.now ?? new Date();
  const unique = [...new Set(endpoints)];
  const warnings: string[] = [],
    failures: { endpoint: string; error: string }[] = [];
  const pending = unique.filter((e) => {
    const previous = store.read(e);
    return options.force || !previous || stale(previous, round, now);
  });
  const writes = new Map<
    string,
    { storage: DataAccessMetadata["storage"]; storedBytes: number }
  >();
  let index = 0;
  if (!options.offline) {
    const client = pending.length ? getClient() : undefined;
    if (client && client.competition !== store.competition) {
      throw new Error("API client and cache competition must match.");
    }
    await Promise.all(
      Array.from({ length: Math.min(5, pending.length) }, async () => {
        while (index < pending.length) {
          const endpoint = pending[index++];
          try {
            const data = await fetchEndpoint(client!, endpoint);
            writes.set(endpoint, { storage: "failed", storedBytes: 0 });
            const previous = store.read(endpoint);
            const saved = await store.save(
              endpoint,
              data,
              endpoint === "/api/journees/cible"
                ? (data as { numero: number }).numero
                : round,
              now.toISOString(),
            );
            writes.set(endpoint, {
              storage: "stored",
              storedBytes: saved.id === previous?.id ? 0 : jsonBytes(data),
            });
          } catch (error) {
            failures.push({
              endpoint,
              error: error instanceof Error ? error.message : "Refresh failed",
            });
          }
        }
      }),
    );
  }
  const evidence = unique.flatMap((endpoint) => {
    const snapshot = store.read(endpoint);
    const write = writes.get(endpoint);
    options.onDataAccess?.({
      endpoint,
      source: write?.storage === "stored"
        ? "network"
        : snapshot
        ? "cache"
        : "missing",
      cacheStatus: snapshot
        ? (stale(snapshot, round, now) ? "stale" : "fresh")
        : "missing",
      fetchedAt: snapshot?.fetchedAt,
      snapshotId: snapshot?.id,
      storage: write?.storage ??
        (pending.includes(endpoint) && !options.offline
          ? "not-stored"
          : snapshot
          ? "reused"
          : "not-stored"),
      storedBytes: write?.storedBytes ?? 0,
      cacheBytes: snapshot ? jsonBytes(snapshot.data) : 0,
    });
    if (!snapshot) {
      warnings.push(`Missing data: ${endpoint}`);
      return [];
    }
    if (stale(snapshot, round, now)) warnings.push(`Stale data: ${endpoint}`);
    const { data: _, ...reference } = snapshot;
    return [reference];
  });
  for (const f of failures) {
    warnings.push(`Refresh failed: ${f.endpoint}: ${f.error}`);
  }
  return {
    evidence,
    warnings,
    failures,
    offline: !!options.offline,
    fullyCurrent: warnings.length === 0,
  };
}
