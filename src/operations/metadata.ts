/** Logical JSON payload sizes, not SQLite file growth or index overhead. */
export interface DataAccessMetadata {
  endpoint: string;
  source: "network" | "cache" | "missing";
  cacheStatus: "fresh" | "stale" | "missing";
  fetchedAt?: string;
  snapshotId?: number;
  storage: "stored" | "reused" | "failed" | "not-stored";
  storedBytes: number;
  cacheBytes: number;
}
export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
