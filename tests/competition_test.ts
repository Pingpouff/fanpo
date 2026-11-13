import { FantasyClient } from "../src/client.ts";
import { assert, equal, rejects } from "./helpers.ts";

const games = {
  multi: true,
  jeux: [
    { id: 1, code: "TOP14", nom: "Championnat de France", principal: true },
    { id: 42, code: "NC", nom: "Nations Championship", principal: false },
  ],
};

Deno.test("NC context discovers its ID once and scopes every endpoint family", async () => {
  const seen: string[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    competition: "nationchampionship",
    fetch: (url, init) => {
      const headers = new Headers(init.headers);
      equal(headers.get("Authorization"), "Bearer test");
      seen.push(url.pathname);
      if (url.pathname === "/api/jeux") {
        equal(headers.get("X-PB-Jeu"), null);
        return Promise.resolve(Response.json(games));
      }
      equal(headers.get("X-PB-Jeu"), "42");
      if (url.pathname === "/api/ligues/mes-ligues") {
        return Promise.resolve(
          Response.json([{ id: 1, format: "normal", mode: "trading" }]),
        );
      }
      if (url.pathname === "/api/joueurs") {
        return Promise.resolve(
          Response.json({ joueurs: [{ id: 1278 }, { id: 1279 }] }),
        );
      }
      return Promise.resolve(Response.json({ matchs: [], source: "NC" }));
    },
  });
  await Promise.all([
    client.getPlayers(),
    client.getTeamsheets(),
    client.getMatches(),
    client.getStandings(),
    client.getRound(),
    client.getLocks(),
    client.getRoundNotes(5),
    client.getPlayerSheets([1278, 1279]),
    client.getComposition(1),
    client.getCompositionForRound(1, 4),
  ]);
  equal(seen.filter((p) => p === "/api/jeux").length, 1);
  equal(client.competition, "nationchampionship");
  assert(seen.includes("/api/compos/1/journee/4"));
});

Deno.test("NC rejects player IDs outside its catalogue before requesting their fiche", async () => {
  const seen: string[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    competition: "nationchampionship",
    fetch: (url) => {
      seen.push(url.pathname);
      return Promise.resolve(
        Response.json(
          url.pathname === "/api/jeux"
            ? games
            : url.pathname === "/api/joueurs"
            ? { joueurs: [{ id: 1278 }] }
            : {},
        ),
      );
    },
  });
  await rejects(() => client.getPlayerSheets([1278, 293]), "does not belong");
  assert(!seen.some((p) => p.endsWith("/fiche")));
  await client.getPlayerSheet(1278);
  assert(seen.includes("/api/joueurs/1278/fiche"));
});

Deno.test("NC discovers its own default league and rejects a Top 14 league ID", async () => {
  const seen: string[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    competition: "nationchampionship",
    fetch: (url) => {
      seen.push(url.pathname);
      return Promise.resolve(
        Response.json(
          url.pathname === "/api/jeux"
            ? games
            : url.pathname === "/api/ligues/mes-ligues"
            ? [{
              id: 1331,
              format: "normal",
              mode: "trading",
              est_globale: true,
            }]
            : { source: "NC" },
        ),
      );
    },
  });
  await client.getComposition();
  assert(seen.includes("/api/compos/1331"));
  await rejects(() => client.getComposition(1), "does not belong");
  assert(!seen.includes("/api/compos/1"));
  await client.getCompositionForRound(undefined, 4);
  assert(seen.includes("/api/compos/1331/journee/4"));
});

Deno.test("default API remains Top 14 and named clones preserve transport", async () => {
  const headers: (string | null)[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (url, init) => {
      if (url.pathname === "/api/jeux") {
        return Promise.resolve(Response.json(games));
      }
      headers.push(new Headers(init.headers).get("X-PB-Jeu"));
      return Promise.resolve(Response.json({}));
    },
  });
  equal(client.competition, "top14");
  equal(await client.getGames(), games);
  await client.getTeamsheets();
  const nc = client.forCompetition("nationchampionship");
  await nc.getTeamsheets();
  await client.getTeamsheets();
  equal(headers, [null, "42", null]);
  equal(client.forCompetition("top14"), client);
});

Deno.test("unavailable NC fails without requesting principal-game data", async () => {
  for (
    const value of [
      { multi: false, jeux: games.jeux },
      { multi: true, jeux: [games.jeux[0]] },
      { multi: true, jeux: [games.jeux[0], { ...games.jeux[1], id: 0 }] },
    ]
  ) {
    let calls = 0;
    const client = new FantasyClient({
      baseUrl: "https://example.com",
      token: "test",
      competition: "nationchampionship",
      fetch: (url) => {
        calls++;
        equal(url.pathname, "/api/jeux");
        return Promise.resolve(Response.json(value));
      },
    });
    await rejects(() => client.getTeamsheets(), "Nations Championship");
    equal(calls, 1);
  }
});

Deno.test("failed discovery can retry and remains observable", async () => {
  let calls = 0;
  const events: string[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    competition: "nationchampionship",
    fetch: (url) => {
      if (url.pathname !== "/api/jeux") {
        return Promise.resolve(Response.json({}));
      }
      calls++;
      return Promise.resolve(
        calls === 1
          ? new Response("no", { status: 503 })
          : Response.json(games),
      );
    },
  });
  client.observeRequests((event) => events.push(event.endpoint));
  await rejects(() => client.getTeamsheets(), "503");
  await client.getTeamsheets();
  equal(events, ["/api/jeux", "/api/jeux", "/api/feuilles"]);
});

Deno.test("explicit league refresh updates membership checks on a reused client", async () => {
  let leagues = [{ id: 1331, format: "normal", mode: "trading" }];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    competition: "nationchampionship",
    fetch: (url) =>
      Promise.resolve(
        Response.json(
          url.pathname === "/api/jeux"
            ? games
            : url.pathname === "/api/ligues/mes-ligues"
            ? leagues
            : {},
        ),
      ),
  });
  await client.getComposition(1331);
  leagues = [{ id: 1332, format: "normal", mode: "trading" }];
  equal((await client.getLeagues())[0].id, 1332);
  await rejects(() => client.getComposition(1331), "does not belong");
  await client.getComposition(1332);
});
