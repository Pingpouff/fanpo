import { FantasyClient } from "../src/client.ts";
import { runCli } from "../src/cli.ts";
import { Store } from "../src/data/store.ts";
import { acquire } from "../src/operations/data.ts";
import { advise } from "../src/operations/advice.ts";
import { Database } from "@db/sqlite";
import { currentComposition } from "./composition_fixtures.ts";
import { player, response } from "./fixtures.ts";
import { assert, equal, rejects } from "./helpers.ts";

const games = {
  multi: true,
  jeux: [
    { id: 1, code: "TOP14", nom: "Top 14", principal: true },
    { id: 17, code: "NC", nom: "Nations Championship", principal: false },
  ],
};

Deno.test("named global CLI flag scopes raw and nested API commands, including debug", async () => {
  const headers: (string | null)[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (url, init) => {
      if (url.pathname === "/api/jeux") {
        return Promise.resolve(Response.json(games));
      }
      headers.push(new Headers(init.headers).get("X-PB-Jeu"));
      return Promise.resolve(
        Response.json({
          journee: 5,
          clubs_annonces: [],
          matchs: [],
          joueurs: {},
        }),
      );
    },
  });
  for (
    const args of [
      ["teamsheets", "--nationchampionship", "--json"],
      ["--nationchampionship", "competition", "matches", "--json"],
      ["top14", "matches", "--nationchampionship", "--json"],
    ]
  ) {
    const value = JSON.parse(await runCli(args, client));
    equal(value.journee, 5);
  }
  const debug = JSON.parse(
    await runCli(
      ["teamsheets", "--nationchampionship", "--debug", "--json"],
      client,
    ),
  );
  equal(debug.metadata.requests.map((r: { endpoint: string }) => r.endpoint), [
    "/api/jeux",
    "/api/feuilles",
  ]);
  await runCli(["teamsheets", "--json"], client);
  equal(headers, ["17", "17", "17", "17", null]);
  equal(JSON.parse(await runCli(["games", "--json"], client)), games);
  const human = await runCli([
    "teamsheets",
    "--nationchampionship",
    "--no-color",
  ], client);
  assert(human.includes("Nations Championship"));
  assert(
    (await runCli(["teamsheets", "--nationchampionship", "--help"])).includes(
      "--nationchampionship",
    ),
  );
});

Deno.test("competition cache scopes are canonical and retain legacy Top 14 data", async () => {
  const path = await Deno.makeTempFile();
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  };
  try {
    const legacy = new Store(path, scope);
    await legacy.save("/api/joueurs", response, 10);
    legacy.close();
    // Seed the exact serialization of an old caller using a different property order.
    const oldKey = JSON.stringify({
      season: scope.season,
      profile: scope.profile,
      origin: scope.origin,
    });
    const oldDatabase = new Database(path);
    oldDatabase.exec("UPDATE snapshots SET scope=?", oldKey);
    oldDatabase.exec("UPDATE entities SET scope=?", oldKey);
    oldDatabase.close();
    const nc = new Store(path, { ...scope, competition: "nationchampionship" });
    equal(nc.status(), []);
    await nc.save("/api/joueurs", {
      ...response,
      joueurs: [player({ nom: "International" })],
    }, 5);
    nc.close();
    const top = new Store(path, {
      profile: scope.profile,
      competition: "top14",
      season: scope.season,
      origin: scope.origin,
    });
    equal(top.read("/api/joueurs")?.round, 10);
    equal(
      top.entities<{ nom: string }>("players")[0].nom,
      response.joueurs[0].nom,
    );
    top.close();
    const reopened = new Store(path, {
      competition: "nationchampionship",
      profile: scope.profile,
      origin: scope.origin,
      season: scope.season,
    });
    equal(reopened.read("/api/joueurs")?.round, 5);
    equal(
      reopened.entities<{ nom: string }>("players")[0].nom,
      "International",
    );
    reopened.close();
  } finally {
    await Deno.remove(path);
  }
});

Deno.test("legacy scope merge preserves the newest catalogue and removed entities", async () => {
  const path = await Deno.makeTempFile();
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  };
  try {
    const original = new Store(path, scope);
    const old = await original.save(
      "/api/joueurs",
      response,
      9,
      "2026-11-01T00:00:00Z",
    );
    await original.save(
      "/api/joueurs",
      { ...response, joueurs: [response.joueurs[0]] },
      10,
      "2026-11-02T00:00:00Z",
    );
    original.close();
    const alias = JSON.stringify({
      season: scope.season,
      origin: scope.origin,
      profile: scope.profile,
    });
    const raw = new Database(path);
    raw.exec("UPDATE snapshots SET scope=? WHERE id=?", alias, old.id);
    raw.exec(
      "INSERT INTO entities VALUES(?,?,?,?,?,?,?,?,?)",
      alias,
      "/api/joueurs",
      "players",
      "2",
      "ST",
      9,
      1,
      JSON.stringify(response.joueurs[1]),
      old.id,
    );
    raw.close();
    const migrated = new Store(path, scope);
    try {
      equal(migrated.read("/api/joueurs")?.round, 10);
      equal(migrated.entities<{ id: number }>("players").map((p) => p.id), [1]);
      equal(migrated.status().length, 1);
    } finally {
      migrated.close();
    }
  } finally {
    await Deno.remove(path);
  }
});

Deno.test("NC offline status, catalogue and analysis never read Top 14 cache or credentials", async () => {
  const path = await Deno.makeTempFile();
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  };
  try {
    for (const competition of ["top14", "nationchampionship"] as const) {
      const store = new Store(path, { ...scope, competition });
      const round = competition === "top14" ? 10 : 5;
      await store.save("/api/journees/cible", { numero: round }, round);
      await store.save("/api/joueurs", {
        ...response,
        journee: { ...response.journee, numero: round },
        joueurs: [player({ nom: competition })],
      }, round);
      store.close();
    }
    const flags = [
      "--db",
      path,
      "--origin",
      scope.origin,
      "--season",
      scope.season,
      "--profile",
      scope.profile,
      "--offline",
      "--json",
    ];
    const status = JSON.parse(
      await runCli(["data", "status", ...flags, "--nationchampionship"]),
    );
    equal(status.round, 5);
    equal(status.scope.competition, "nationchampionship");
    const catalogue = JSON.parse(
      await runCli(["data", "players", ...flags, "--nationchampionship"]),
    );
    equal(catalogue.players[0].nom, "nationchampionship");
    const top = JSON.parse(await runCli(["data", "status", ...flags]));
    equal(top.round, 10);
    const analysis = JSON.parse(
      await runCli(["analyze", "matchups", ...flags, "--nationchampionship"]),
    );
    equal(analysis.competition, "nationchampionship");
    assert(analysis.warnings.some((w: string) => w.includes("international")));
  } finally {
    await Deno.remove(path);
  }
});

Deno.test("operations reject mismatched client and store before acquiring facts", async () => {
  const store = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026",
    profile: "test",
    competition: "nationchampionship",
  });
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: () => {
      throw new Error("must not fetch");
    },
  });
  try {
    await rejects(
      () => acquire(store, () => client, ["/api/joueurs"], 5, {}),
      "competition",
    );
  } finally {
    store.close();
  }
});

Deno.test("NC sync resolves its league and offline replay uses the same composition", async () => {
  const path = await Deno.makeTempFile();
  const scope = {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
    competition: "nationchampionship" as const,
  };
  const calls: string[] = [];
  const facts: Record<string, unknown> = {
    "/api/jeux": games,
    "/api/journees/cible": { numero: 5 },
    "/api/ligues/mes-ligues": [{
      id: 1331,
      format: "normal",
      mode: "trading",
      est_globale: true,
    }],
    "/api/top14/matchs": {
      matchs: [{
        journee: 5,
        date: "2026-11-13",
        statut: "Fixture",
        dom: { abrev: "FRA", score: null },
        ext: { abrev: "RSA", score: null },
      }],
    },
    "/api/top14/classement": { classement: [] },
    "/api/joueurs": {
      ...response,
      journee: { ...response.journee, numero: 5 },
      joueurs: [],
    },
    "/api/feuilles": { journee: 5, clubs_annonces: [], joueurs: {} },
    "/api/notes-journee?journee=5": { notes: {}, forfaits: [] },
    "/api/compos/1331": {
      ...currentComposition,
      equipe: { budget: "11.00" },
      club_limit: 4,
      compo: { slots: [], capitaine_slot: null, impact_slot: null },
    },
    "/api/compos/etat-verrou": {
      journee: { numero: 5 },
      verrou: { demarres: [], liberes: [] },
    },
  };
  const client = new FantasyClient({
    ...scope,
    baseUrl: scope.origin,
    token: "test",
    fetch: (url) => {
      const key = url.pathname + url.search;
      calls.push(key);
      assert(key in facts, `Unexpected endpoint ${key}`);
      return Promise.resolve(Response.json(facts[key]));
    },
  });
  try {
    const store = new Store(path, scope);
    try {
      const synced = await advise(store, () => client, { kind: "sync" });
      equal(synced.fullyCurrent, true);
      equal(synced.warnings, []);
      equal(store.read("/api/compos/1"), undefined);
      assert(store.read("/api/compos/1331"));
      const replay = await advise(store, () => {
        throw new Error("Offline must not acquire client");
      }, { kind: "lineup", offline: true });
      equal(replay.competition, "nationchampionship");
      assert(replay.warnings.some((w) => w.includes("international")));
      await rejects(
        () => advise(store, () => client, { kind: "sync", compositionId: 1 }),
        "does not belong",
      );
    } finally {
      store.close();
    }
    assert(!calls.includes("/api/compos/1"));
  } finally {
    await Deno.remove(path);
  }
});
