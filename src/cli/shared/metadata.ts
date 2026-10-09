import type { RequestMetadata } from "../../api/http.ts";
import type { DataAccessMetadata } from "../../operations/metadata.ts";
import { renderTable } from "./output.ts";
export interface CommandRequestMetadata extends RequestMetadata {
  storage: DataAccessMetadata["storage"];
  storedBytes: number;
  snapshotId?: number;
}
export interface CommandMetadata {
  startedAt: string;
  durationMs: number;
  requestCount: number;
  totalResponseBytes: number;
  unknownResponseSizes: number;
  storedPayloadBytes: number;
  requests: CommandRequestMetadata[];
  dataAccess: DataAccessMetadata[];
}
function bytes(value: number | null) {
  return value === null ? "Unknown" : `${value} B`;
}
function storage(value: DataAccessMetadata["storage"] | undefined) {
  return value === "stored"
    ? "Stored"
    : value === "reused"
    ? "Reused"
    : value === "failed"
    ? "Store failed"
    : "Not stored";
}
export function renderMetadata(value: CommandMetadata): string {
  const lines = [
    "Request metadata",
    `Started: ${value.startedAt} | Command time: ${
      value.durationMs.toFixed(2)
    } ms`,
    `HTTP requests: ${value.requestCount} | Response bodies: ${
      bytes(value.totalResponseBytes)
    }${
      value.unknownResponseSizes
        ? ` (+ ${value.unknownResponseSizes} unknown)`
        : ""
    } | Stored JSON payloads: ${bytes(value.storedPayloadBytes)}`,
  ];
  if (value.requests.length) {
    lines.push(
      renderTable([
        [
          "Endpoint",
          "Started (UTC)",
          "Time",
          "HTTP",
          "Response",
          "Outcome",
          "Storage",
        ],
        ...value.requests.map(
          (r) => [
            r.endpoint,
            r.startedAt,
            `${r.durationMs.toFixed(2)} ms`,
            r.status === null ? "-" : String(r.status),
            bytes(r.responseBytes),
            r.outcome,
            storage(
              value.dataAccess.find((d) => d.endpoint === r.endpoint)?.storage,
            ),
          ],
        ),
      ]),
    );
  }
  if (value.dataAccess.length) {
    lines.push(
      "Data access:",
      renderTable([
        [
          "Endpoint",
          "Source",
          "Cache",
          "Snapshot",
          "Fetched (UTC)",
          "Storage",
          "Stored payload",
          "Cached payload",
        ],
        ...value.dataAccess.map(
          (d) => [
            d.endpoint,
            d.source,
            d.cacheStatus,
            d.snapshotId === undefined ? "-" : `#${d.snapshotId}`,
            d.fetchedAt ?? "-",
            storage(d.storage),
            bytes(d.storedBytes),
            bytes(d.cacheBytes),
          ],
        ),
      ]),
    );
  }
  return lines.join("\n");
}
