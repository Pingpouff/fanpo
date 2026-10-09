import { FantasyClient } from "../src/client.ts";
import { runCli } from "../src/cli.ts";
import { assert, equal } from "./helpers.ts";
import { player, response } from "./fixtures.ts";
Deno.test("context endpoints preserve extra fields and filter fixture rounds locally", async () => {
  const seen: string[] = [];
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (input) => {
      const path = new URL(String(input)).pathname;
      seen.push(path);
      return Promise.resolve(Response.json(
        path.endsWith("matchs")
          ? { matchs: [{ journee: 1 }, { journee: 2 }], extra: true }
          : { extra: true },
      ));
    },
  });
  equal(await client.getMatches(2), { matchs: [{ journee: 2 }], extra: true });
  await client.getStandings();
  await client.getRound();
  await client.getTeamsheets();
  await client.getLocks();
  equal(seen, [
    "/api/top14/matchs",
    "/api/top14/classement",
    "/api/journees/cible",
    "/api/feuilles",
    "/api/compos/etat-verrou",
  ]);
  equal(
    JSON.parse(
      await runCli(["top14", "matches", "--round", "2", "--json"], client),
    ),
    { matchs: [{ journee: 2 }], extra: true },
  );
});
Deno.test("round notes preserve official ratings and withdrawal IDs and reject invalid rounds before fetching", async () => {
  const c = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (input) => {
      equal(new URL(String(input)).search, "?journee=6");
      return Promise.resolve(
        Response.json({
          notes: {
            "1": { note: 76.97, minutes: 44, titulaire: false, verifiee: true },
          },
          forfaits: [2],
          extra: true,
        }),
      );
    },
  });
  equal((await c.getRoundNotes(6)).forfaits, [2]);
  let failed = false;
  try {
    await c.getRoundNotes(-1);
  } catch {
    failed = true;
  }
  equal(failed, true);
});
Deno.test("competition terminal output renders useful standing and fixture columns", async () => {
  const c = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (input) =>
      Promise.resolve(
        Response.json(
          new URL(String(input)).pathname.endsWith("classement")
            ? {
              classement: [{
                position: 1,
                abrev: "ST",
                points: 19,
                joues: 5,
                victoires: 4,
                nuls: 0,
                defaites: 1,
                diff: 62,
              }],
            }
            : {
              matchs: [{
                journee: 6,
                date: "2026-10-10",
                statut: "Fixture",
                dom: { abrev: "ST", score: null },
                ext: { abrev: "UBB", score: null },
              }],
            },
        ),
      ),
  });
  const standings = await runCli(["top14", "standings"], c);
  const matches = await runCli(["top14", "matches"], c);
  equal(standings.includes("Played"), true);
  equal(matches.includes("Away"), true);
  equal(
    JSON.parse(
      await runCli(
        ["ratings", "--round", "6", "--json"],
        new FantasyClient({
          baseUrl: "https://example.com",
          token: "test",
          fetch: () =>
            Promise.resolve(Response.json({ notes: {}, forfaits: [1] })),
        }),
      ),
    ).forfaits,
    [1],
  );
});

Deno.test("ratings output joins player info by ID, including withdrawals and unknown players", async () => {
  const notes = {
    notes: {
      "1": { note: 76.97, minutes: 44, titulaire: false, verifiee: true },
      "999": { note: null, minutes: null, titulaire: null, verifiee: false },
    },
    forfaits: [2],
  };
  const client = new FantasyClient({
    baseUrl: "https://example.com",
    token: "test",
    fetch: (url) =>
      Promise.resolve(Response.json(
        url.pathname === "/api/joueurs"
          ? {
            ...response,
            joueurs: [
              player({
                id: 2,
                prenom: "Beka",
                nom: "Gorgadze",
                poste: "N8",
                poste_secondaire: "TL",
                club: "SP",
              }),
              player(),
            ],
          }
          : notes,
      )),
  });
  const output = await runCli(
    ["ratings", "--round", "6", "--no-color"],
    client,
  );
  const bamba = output.split("\n").find((line) => line.includes("Demba Bamba"));
  assert(
    bamba?.includes("PIL") && bamba.includes("UBB") && bamba.includes("76.97"),
  );
  const withdrawal = output.split("\n").find((line) =>
    line.includes("Beka Gorgadze")
  );
  assert(
    withdrawal?.includes("N8 / TL") && withdrawal.includes("SP") &&
      withdrawal.includes("30 points"),
  );
  const missing = output.split("\n").find((line) =>
    line.trimStart().startsWith("999 ")
  );
  assert(missing?.includes("Unknown"));
});
