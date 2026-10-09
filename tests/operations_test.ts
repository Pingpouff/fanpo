import { Store } from "../src/data/store.ts";
import { acquire } from "../src/operations/data.ts";
import { FantasyClient } from "../src/client.ts";
import { assert, equal } from "./helpers.ts";
Deno.test("acquisition reuses fresh data, refreshes stale data and reports offline or failed refresh", async () => {
  const db = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  let calls = 0;
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: () => {
      calls++;
      return Promise.resolve(Response.json({ matchs: [] }));
    },
  });
  try {
    let result = await acquire(db, () => client, ["/api/top14/matchs"], 6, {});
    equal(calls, 1);
    equal(result.warnings, []);
    await acquire(db, () => client, ["/api/top14/matchs"], 6, {});
    equal(calls, 1);
    result = await acquire(db, () => client, ["/api/top14/matchs"], 7, {
      offline: true,
    });
    equal(calls, 1);
    assert(result.warnings.length > 0);
    const failed = new FantasyClient({
      baseUrl: "https://example.com",
      token: "test",
      fetch: () => Promise.reject(new Error("offline")),
    });
    result = await acquire(db, () => failed, ["/api/top14/matchs"], 7, {});
    assert(result.warnings.length > 0);
    assert(db.read("/api/top14/matchs"));
  } finally {
    db.close();
  }
});
Deno.test("partial acquisition keeps successful sources and bounds concurrent HTTP calls at five", async () => {
  const db = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  let active = 0, max = 0;
  const c = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: async (input) => {
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 2));
      active--;
      const id = Number(new URL(String(input)).pathname.split("/")[3]);
      if (id === 3) return new Response("", { status: 503 });
      return Response.json({
        joueur: { id, club: "A", valeur: "0.50" },
        perfs: [],
      });
    },
  });
  try {
    const result = await acquire(
      db,
      () => c,
      Array.from({ length: 12 }, (_, i) => `/api/joueurs/${i + 1}/fiche`),
      6,
      {},
    );
    equal(result.failures.length, 1);
    equal(result.evidence.length, 11);
    assert(max <= 5);
    equal(db.entities("sheets").length, 11);
  } finally {
    db.close();
  }
});
