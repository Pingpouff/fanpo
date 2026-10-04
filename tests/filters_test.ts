import { filterPlayers } from "../src/filters.ts";
import { equal } from "./helpers.ts";
import { player, response } from "./fixtures.ts";

Deno.test("club matching is exact and case insensitive", () => {
  equal(filterPlayers(response.joueurs, { club: "ubb" }).map((p) => p.id), [1]);
  equal(filterPlayers(response.joueurs, { club: "UB" }), []);
});

Deno.test("position matches primary, secondary and tertiary positions", () => {
  const players = [
    player({ id: 1 }),
    player({ id: 2, poste: "TAL", poste_secondaire: "PIL" }),
    player({ id: 3, poste: "TAL", poste_tertiaire: "PIL" }),
    player({ id: 4, poste: "TAL" }),
  ];
  equal(filterPlayers(players, { position: "pil" }).map((p) => p.id), [
    1,
    2,
    3,
  ]);
});

Deno.test("name matching is a case insensitive full-name substring", () => {
  equal(filterPlayers(response.joueurs, { name: "BA bAM" }).map((p) => p.id), [
    1,
  ]);
  equal(filterPlayers(response.joueurs, { name: "martin" }).map((p) => p.id), [
    2,
  ]);
});

Deno.test("availability excludes unavailable players and filters combine", () => {
  equal(filterPlayers(response.joueurs, { available: true }).map((p) => p.id), [
    1,
  ]);
  equal(filterPlayers(response.joueurs, { club: "ST", available: true }), []);
  equal(
    filterPlayers(response.joueurs, {
      club: "UBB",
      position: "PIL",
      name: "Bamba",
      available: true,
    }).map((p) => p.id),
    [1],
  );
});

Deno.test("no filters preserves all players without changing the input", () => {
  const before = JSON.stringify(response.joueurs);
  equal(filterPlayers(response.joueurs), response.joueurs);
  filterPlayers(response.joueurs, { club: "ST" });
  equal(JSON.stringify(response.joueurs), before);
});
