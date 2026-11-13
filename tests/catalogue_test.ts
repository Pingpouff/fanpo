import { Store } from "../src/data/store.ts";
import { readCatalogue } from "../src/operations/catalogue.ts";
import { player, response } from "./fixtures.ts";
import { assert, equal } from "./helpers.ts";

const scope = {
  origin: "https://example.com",
  season: "2026-27",
  profile: "test",
};
const now = new Date("2026-10-09T16:00:00Z");
const pool = [
  player({ id: 1, poste: "DL", poste_secondaire: "TL", poste_tertiaire: "N8" }),
  player({
    id: 2,
    prenom: "Alex",
    nom: "Martin",
    club: "ST",
    indisponible: true,
  }),
];

Deno.test("cached catalogue combines filters and includes secondary and tertiary positions", async () => {
  const store = new Store(":memory:", scope);
  try {
    await store.save(
      "/api/journees/cible",
      { numero: 6 },
      6,
      now.toISOString(),
    );
    const snapshot = await store.save(
      "/api/joueurs",
      {
        ...response,
        journee: { ...response.journee, numero: 6 },
        joueurs: pool,
      },
      6,
      now.toISOString(),
    );
    for (const position of ["tl", "N8"]) {
      const value = readCatalogue(store, {
        position,
        club: "ubb",
        name: "bamba",
        available: true,
      }, now);
      equal(value.players.map((p) => p.id), [1]);
      equal(value.evidence.snapshotId, snapshot.id);
      equal(value.evidence.stale, false);
      equal(value.round, 6);
      equal(value.warnings, []);
    }
    equal(readCatalogue(store, { available: true }, now).players.length, 1);
    equal(readCatalogue(store, { name: "missing" }, now).players, []);
    equal(readCatalogue(store, {}, now).players.length, 2);
  } finally {
    store.close();
  }
});

Deno.test("cached catalogue reports missing inputs, stale age and round mismatch", async () => {
  const store = new Store(":memory:", scope);
  try {
    let error: unknown;
    try {
      readCatalogue(store, {}, now);
    } catch (e) {
      error = e;
    }
    assert(
      error instanceof Error &&
        error.message ===
          "Cached player catalogue unavailable. Run sync online.",
    );
    await store.save(
      "/api/joueurs",
      { ...response, journee: { ...response.journee, numero: 6 } },
      6,
      now.toISOString(),
    );
    const unknownRound = readCatalogue(store, {}, now);
    equal(unknownRound.round, 6);
    assert(unknownRound.warnings.some((w) => w.includes("target round")));
    await store.save(
      "/api/journees/cible",
      { numero: 7 },
      7,
      now.toISOString(),
    );
    const mismatch = readCatalogue(store, {}, now);
    equal(mismatch.round, 7);
    equal(mismatch.evidence.stale, true);
    assert(mismatch.warnings.length > 0);
    await store.save(
      "/api/journees/cible",
      { numero: 6 },
      6,
      now.toISOString(),
    );
    const old = readCatalogue(store, {}, new Date(now.getTime() + 300_001));
    equal(old.evidence.stale, true);
    assert(old.warnings.length > 0);
  } finally {
    store.close();
  }
});

Deno.test("cached catalogue is isolated by profile, season and origin", async () => {
  const path = await Deno.makeTempFile({ suffix: ".sqlite" });
  const first = new Store(path, scope);
  try {
    await first.save(
      "/api/joueurs",
      { ...response, joueurs: [pool[0]] },
      3,
      now.toISOString(),
    );
    for (
      const changed of [{ profile: "other" }, { season: "2025-26" }, {
        origin: "https://other.test",
      }]
    ) {
      const second = new Store(path, { ...scope, ...changed });
      try {
        await second.save(
          "/api/joueurs",
          { ...response, joueurs: [pool[1]] },
          3,
          now.toISOString(),
        );
        equal(readCatalogue(second, {}, now).players.map((p) => p.id), [2]);
        equal(readCatalogue(first, {}, now).players.map((p) => p.id), [1]);
      } finally {
        second.close();
      }
    }
  } finally {
    first.close();
    await Deno.remove(path);
  }
});
