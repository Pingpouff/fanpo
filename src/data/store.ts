import { Database } from "@db/sqlite";
import { type Competition, validateCompetition } from "../api/competition.ts";
export interface Scope {
  origin: string;
  season: string;
  profile: string;
  competition?: Competition;
}
export interface Snapshot<T = unknown> {
  id: number;
  endpoint: string;
  fetchedAt: string;
  hash: string;
  round: number;
  data: T;
}
interface Row {
  id: number;
  endpoint: string;
  fetched_at: string;
  hash: string;
  round: number;
  payload: string;
}
import { money } from "./money.ts";
export { money } from "./money.ts";
export class Store {
  readonly competition: Competition;
  readonly #db: Database;
  readonly #scope: string;
  constructor(path: string, scope: Scope) {
    this.competition = validateCompetition(scope.competition ?? "top14");
    const origin = new URL(scope.origin);
    if (origin.username || origin.password || origin.search) {
      throw new Error("Origin must not contain credentials");
    }
    if (!scope.season.trim() || !scope.profile.trim()) {
      throw new Error("Season and profile required");
    }
    // Preserve the original principal-game key, independent of input property order.
    this.#scope = JSON.stringify({
      origin: origin.origin,
      season: scope.season,
      profile: scope.profile,
      ...(this.competition === "top14"
        ? {}
        : { competition: this.competition }),
    });
    this.#db = new Database(path);
    this.#db.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
    const version =
      this.#db.prepare<{ user_version: number }>("PRAGMA user_version").get()!
        .user_version;
    if (version > 1) {
      throw new Error("Database schema is newer than this application");
    }
    this.#db.exec(
      `CREATE TABLE IF NOT EXISTS snapshots(id INTEGER PRIMARY KEY,scope TEXT NOT NULL,endpoint TEXT NOT NULL,fetched_at TEXT NOT NULL,hash TEXT NOT NULL,round INTEGER NOT NULL,payload TEXT NOT NULL,UNIQUE(scope,endpoint,fetched_at,hash));
 CREATE INDEX IF NOT EXISTS snapshot_lookup ON snapshots(scope,endpoint,id DESC);
 CREATE TABLE IF NOT EXISTS entities(scope TEXT NOT NULL,endpoint TEXT NOT NULL,kind TEXT NOT NULL,key TEXT NOT NULL,club TEXT,round INTEGER,price INTEGER,payload TEXT NOT NULL,snapshot_id INTEGER REFERENCES snapshots(id),PRIMARY KEY(scope,kind,key));
 CREATE INDEX IF NOT EXISTS entity_query ON entities(scope,kind,club,round);
 PRAGMA user_version=1;`,
    );
    if (this.competition === "top14") this.#migrateLegacyScopes(scope);
  }

  /** Old clients serialized configuration property order into the cache identity. */
  #migrateLegacyScopes(scope: Scope) {
    const aliases = this.#db.prepare<{ scope: string }>(
      "SELECT DISTINCT scope FROM snapshots UNION SELECT DISTINCT scope FROM entities",
    ).all().map((row) => row.scope).filter((key) => {
      if (key === this.#scope) return false;
      try {
        const previous = JSON.parse(key) as Scope;
        return (previous.competition === undefined ||
          previous.competition === "top14") &&
          new URL(previous.origin).origin === new URL(scope.origin).origin &&
          previous.season === scope.season &&
          previous.profile === scope.profile;
      } catch {
        return false;
      }
    });
    if (!aliases.length) return;
    this.#db.transaction(() => {
      for (const alias of aliases) {
        const rows = this.#db.prepare<Row>(
          "SELECT * FROM snapshots WHERE scope=?",
        ).all(alias);
        for (const row of rows) {
          const duplicate = this.#db.prepare<{ id: number }>(
            "SELECT id FROM snapshots WHERE scope=? AND endpoint=? AND fetched_at=? AND hash=?",
          ).get(this.#scope, row.endpoint, row.fetched_at, row.hash);
          if (duplicate) {
            // Keep immutable duplicate observations; normalized rows reference the canonical copy.
            this.#db.exec(
              "UPDATE entities SET snapshot_id=? WHERE scope=? AND snapshot_id=?",
              duplicate.id,
              alias,
              row.id,
            );
          } else {
            this.#db.exec(
              "UPDATE snapshots SET scope=? WHERE id=?",
              this.#scope,
              row.id,
            );
          }
        }
        this.#db.exec(
          `INSERT INTO entities(scope,endpoint,kind,key,club,round,price,payload,snapshot_id)
           SELECT ?,endpoint,kind,key,club,round,price,payload,snapshot_id FROM entities WHERE scope=?
           ON CONFLICT(scope,kind,key) DO UPDATE SET
             endpoint=excluded.endpoint,club=excluded.club,round=excluded.round,
             price=excluded.price,payload=excluded.payload,snapshot_id=excluded.snapshot_id
           WHERE excluded.snapshot_id > entities.snapshot_id`,
          this.#scope,
          alias,
        );
        this.#db.exec("DELETE FROM entities WHERE scope=?", alias);
      }
      // A newer catalogue may have removed keys still present in an older alias.
      this.#db.exec(
        `DELETE FROM entities WHERE scope=? AND snapshot_id !=
          (SELECT MAX(id) FROM snapshots WHERE scope=? AND endpoint=entities.endpoint)`,
        this.#scope,
        this.#scope,
      );
    })();
  }
  close() {
    this.#db.close();
  }
  read<T = unknown>(endpoint: string): Snapshot<T> | undefined {
    const row = this.#db.prepare<Row>(
      "SELECT * FROM snapshots WHERE scope=? AND endpoint=? ORDER BY id DESC LIMIT 1",
    ).get(this.#scope, endpoint);
    return row
      ? {
        id: row.id,
        endpoint: row.endpoint,
        fetchedAt: row.fetched_at,
        hash: row.hash,
        round: row.round,
        data: JSON.parse(row.payload),
      }
      : undefined;
  }
  status(): Omit<Snapshot, "data">[] {
    const rows = this.#db.prepare<Row>(
      "SELECT * FROM snapshots WHERE scope=? AND id IN (SELECT MAX(id) FROM snapshots WHERE scope=? GROUP BY endpoint) ORDER BY endpoint",
    ).all(this.#scope, this.#scope);
    return rows.map((r) => ({
      id: r.id,
      endpoint: r.endpoint,
      fetchedAt: r.fetched_at,
      hash: r.hash,
      round: r.round,
    }));
  }
  entities<T = unknown>(kind: string): T[] {
    return this.#db.prepare<{ payload: string }>(
      "SELECT payload FROM entities WHERE scope=? AND kind=? ORDER BY key",
    ).all(this.#scope, kind).map((r) => JSON.parse(r.payload));
  }
  async save(
    endpoint: string,
    data: unknown,
    round: number,
    fetchedAt = new Date().toISOString(),
  ): Promise<Snapshot> {
    if (!Number.isFinite(Date.parse(fetchedAt))) {
      throw new Error("Invalid fetch timestamp");
    }
    const payload = JSON.stringify(data);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(payload),
    );
    const hash = Array.from(
      new Uint8Array(digest),
      (v) => v.toString(16).padStart(2, "0"),
    ).join("");
    this.#db.transaction(() => {
      this.#db.exec(
        "INSERT OR IGNORE INTO snapshots(scope,endpoint,fetched_at,hash,round,payload) VALUES(?,?,?,?,?,?)",
        this.#scope,
        endpoint,
        fetchedAt,
        hash,
        round,
        payload,
      );
      const snapshot = this.#db.prepare<{ id: number }>(
        "SELECT id FROM snapshots WHERE scope=? AND endpoint=? AND fetched_at=? AND hash=?",
      ).get(this.#scope, endpoint, fetchedAt, hash)!;
      // Replaying an immutable old observation must not roll indexed facts back.
      const latest = this.#db.prepare<{ id: number }>(
        "SELECT MAX(id) AS id FROM snapshots WHERE scope=? AND endpoint=?",
      ).get(this.#scope, endpoint)!;
      if (snapshot.id !== latest.id) return;
      this.#db.exec(
        "DELETE FROM entities WHERE scope=? AND endpoint=?",
        this.#scope,
        endpoint,
      );
      const put = (
        kind: string,
        key: string | number,
        item: unknown,
        club: string | null = null,
        price: number | null = null,
        day = round,
      ) =>
        this.#db.exec(
          "INSERT OR REPLACE INTO entities VALUES(?,?,?,?,?,?,?,?,?)",
          this.#scope,
          endpoint,
          kind,
          String(key),
          club,
          day,
          price,
          JSON.stringify(item),
          snapshot.id,
        );
      // Raw responses stay intact; these rows provide indexed access to domain facts.
      const d = data as Record<string, unknown>;
      if (endpoint === "/api/joueurs") {
        for (
          const p of d.joueurs as { id: number; club: string; valeur: string }[]
        ) put("players", p.id, p, p.club, money(p.valeur));
      }
      if (endpoint.includes("/fiche")) {
        const p = d.joueur as { id: number; club: string; valeur: string };
        put("sheets", p.id, data, p.club, money(p.valeur));
        for (const perf of d.perfs as { numero: number }[]) {
          put(
            "performances",
            `${p.id}:${perf.numero}`,
            { playerId: p.id, ...perf },
            p.club,
            null,
            perf.numero,
          );
        }
      }
      if (endpoint === "/api/top14/matchs") {
        for (
          const [i, m] of (d.matchs as {
            journee: number;
            dom: { abrev: string };
            ext: { abrev: string };
          }[]).entries()
        ) {
          put(
            "fixtures",
            `${m.journee}:${m.dom.abrev}:${m.ext.abrev}:${i}`,
            m,
            m.dom.abrev,
            null,
            m.journee,
          );
        }
      }
      if (endpoint === "/api/top14/classement") {
        for (const s of d.classement as { abrev: string }[]) {
          put("standings", s.abrev, s, s.abrev);
        }
      }
      if (endpoint === "/api/feuilles") {
        for (const [id, shirt] of Object.entries(d.joueurs as object)) {
          put("teamsheets", id, { playerId: Number(id), shirt });
        }
      }
      if (/^\/api\/compos\/\d+$/.test(endpoint)) {
        put(
          "compositions",
          endpoint,
          data,
          null,
          money((d.equipe as { budget: string }).budget),
        );
      }
    })();
    return this.read(endpoint)!;
  }
}
