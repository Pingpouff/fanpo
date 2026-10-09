import { money, Store } from "../src/data/store.ts";
import { assert, equal, rejects } from "./helpers.ts";
import { response } from "./fixtures.ts";
Deno.test("snapshot normalization persists corrections and rolls back malformed updates", async () => {
  const path = await Deno.makeTempFile();
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  };
  try {
    let db = new Store(path, scope);
    const a = await db.save(
      "/api/joueurs",
      response,
      3,
      "2026-10-09T10:00:00Z",
    );
    equal(db.entities("players").length, 2);
    equal(db.read("/api/joueurs")?.id, a.id);
    await rejects(
      () => db.save("/api/joueurs", { joueurs: [{ id: 1, valeur: "bad" }] }, 3),
      "money",
    );
    equal(db.read("/api/joueurs")?.id, a.id);
    db.close();
    db = new Store(path, scope);
    equal(db.entities("players").length, 2);
    await db.save("/api/joueurs", {
      ...response,
      joueurs: [{ ...response.joueurs[0], valeur: "0.75" }],
    }, 3);
    equal(db.entities("players").length, 1);
    assert(db.status().length === 1);
    db.close();
    const other = new Store(path, { ...scope, season: "2027-28" });
    equal(other.status(), []);
    other.close();
  } finally {
    await Deno.remove(path);
  }
  equal(money("11.15"), 11150000);
});
Deno.test("same observation is idempotent, fresh observations retain immutable snapshots and normalized performances", async () => {
  const db = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  try {
    const data = {
      joueur: { id: 1, club: "A", valeur: "0.50" },
      perfs: [{ numero: 1, note: "30" }],
    };
    const a = await db.save(
      "/api/joueurs/1/fiche",
      data,
      2,
      "2026-10-09T10:00:00Z",
    );
    const b = await db.save(
      "/api/joueurs/1/fiche",
      data,
      2,
      "2026-10-09T10:00:00Z",
    );
    equal(a.id, b.id);
    await db.save(
      "/api/joueurs/1/fiche",
      { ...data, perfs: [{ numero: 1, note: "40" }] },
      2,
      "2026-10-09T10:01:00Z",
    );
    equal(db.entities<{ note: string }>("performances")[0].note, "40");
    equal(db.entities("sheets").length, 1);
  } finally {
    db.close();
  }
});
Deno.test("replaying an older observation preserves the latest normalized correction", async () => {
  const db = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  try {
    const a = {
      joueur: { id: 1, club: "A", valeur: "0.50" },
      perfs: [{ numero: 1, note: "30" }],
    };
    const b = { ...a, perfs: [{ numero: 1, note: "40" }] };
    await db.save("/api/joueurs/1/fiche", a, 2, "2026-10-09T10:00:00Z");
    await db.save("/api/joueurs/1/fiche", b, 2, "2026-10-09T10:01:00Z");
    await db.save("/api/joueurs/1/fiche", a, 2, "2026-10-09T10:00:00Z");
    equal(db.entities<{ note: string }>("performances")[0].note, "40");
    equal(
      db.read<{ perfs: { note: string }[] }>("/api/joueurs/1/fiche")!.data
        .perfs[0].note,
      "40",
    );
  } finally {
    db.close();
  }
});
