import { stripAnsi } from "../src/cli/shared/colors.ts";
import { renderAnalysis } from "../src/cli/context/output.ts";
import { runCli } from "../src/cli.ts";
import { FantasyClient } from "../src/client.ts";
import { assert } from "./helpers.ts";
const envelope = {
  round: 6,
  fullyCurrent: false,
  model: { version: "fanpo-v1" },
  evidence: [{
    id: 4,
    endpoint: "/api/joueurs",
    fetchedAt: "2026-10-09T10:00:00Z",
  }],
  warnings: ["Prices are stale."],
};
const lineup = {
  validation: {
    status: "PROVISIONAL",
    cost: 11070000,
    budget: 11150000,
    remaining: 80000,
    errors: [],
    warnings: [],
  },
  expected: null,
  conditionalAllStarters: 1400,
  conditionalAllSubstitutes: null,
  slots: [{
    slot: 1,
    playerId: 479,
    status: "unknown",
    starter: 80,
    substitute: null,
    expected: null,
    multiplier: 1,
    warnings: ["Teamsheet not announced."],
  }],
  warnings: ["Conditional scenarios are not guaranteed."],
};
Deno.test("human lineup shows budget, conditional projections, validation, evidence and warnings without JSON", () => {
  const text = renderAnalysis("lineup", { ...envelope, result: lineup });
  for (
    const s of [
      "PROVISIONAL",
      "11.15 M",
      "11.07 M",
      "0.08 M",
      "Unresolved",
      "1400.00",
      "Teamsheet not announced.",
      "Prices are stale.",
      "snapshot #4",
    ]
  ) assert(text.includes(s), `Missing ${s}`);
  assert(!text.includes('"validation"'));
  assert(!text.includes("{"));
});
Deno.test("human sync, status, players, matchups and compare have command-specific readable summaries", () => {
  const cases: [Parameters<typeof renderAnalysis>[0], unknown, string[]][] = [
    ["sync", { ...envelope, result: { synced: 3, players: [479, 825] } }, [
      "3 sources",
      "479, 825",
    ]],
    ["status", {
      scope: {
        origin: "https://example.com",
        season: "2026-27",
        profile: "beto",
      },
      round: 6,
      snapshots: [{
        endpoint: "/api/joueurs",
        id: 4,
        fetchedAt: "2026-10-09",
        stale: true,
      }],
    }, ["beto", "Stale", "/api/joueurs"]],
    ["player", {
      ...envelope,
      result: [{
        playerId: 479,
        name: "Demba Bamba",
        club: "LOU",
        price: "0.65",
        status: "unknown",
        expected: null,
        scenarios: {
          starter: {
            baseline: 80,
            scoringProbability: 0.9,
            matchupFactor: 1.05,
            expected: 75.6,
            evidence: [{ round: 5, minutes: 80, score: 80, weight: 1 }],
          },
          substitute: {
            baseline: null,
            scoringProbability: null,
            matchupFactor: 1.05,
            expected: null,
            evidence: [],
          },
        },
        warnings: ["Unannounced."],
      }],
    }, ["Demba Bamba", "Starter", "Substitute", "1.050", "Unannounced."]],
    ["matchups", {
      ...envelope,
      result: {
        calibration: { samples: 28, mae: 12.3, homeBaselineMae: 15.2 },
        matches: [{
          home: "ST",
          away: "UBB",
          date: "2026-10-10",
          expectedMargin: 12,
          winProbability: 0.7,
          drawProbability: 0,
          lossProbability: 0.3,
          overwhelmProbability: 0.4,
          overwhelmedProbability: 0.1,
          domination: 0.3,
          warnings: [],
        }],
      },
    }, ["ST", "UBB", "70.0%", "28", "12.30"]],
    ["compare", {
      ...envelope,
      result: {
        before: lineup,
        after: lineup,
        expectedDelta: null,
        costDelta: 0,
        changes: [{ slot: 2, playerId: 825 }],
      },
    }, ["Before", "After", "Expected points change: Unresolved", "825"]],
  ];
  for (const [kind, value, expected] of cases) {
    const text = renderAnalysis(kind, value);
    assert(text.includes("\x1b[38;2;"), `${kind}: no foreground styling`);
    for (const part of expected) {
      assert(stripAnsi(text).includes(part), `${kind}: missing ${part}`);
    }
    assert(!text.includes("{"), kind);
  }
});
Deno.test("context defaults use readable lists and tables; json preserves the complete response", async () => {
  const payloads = {
    round: {
      id: 6,
      numero: 6,
      deadline_at: "2026-10-10",
      statut: "a_venir",
      type: "reguliere",
      extra: { nested: true },
    },
    teamsheets: {
      journee: 6,
      clubs_annonces: ["LOU"],
      joueurs: { "479": 16 },
      notes_provisoires: false,
    },
    locks: {
      journee: { numero: 6 },
      verrou: {
        en_cours: true,
        demarres: ["LOU"],
        liberes: [],
        coups_envoi: { LOU: "2026-10-10" },
        prochain: null,
      },
    },
    ratings: {
      notes: {
        "479": { note: 80, minutes: 45, titulaire: false, verifiee: true },
      },
      forfaits: [825],
    },
  };
  const endpoints = [
    "/api/journees/cible",
    "/api/feuilles",
    "/api/compos/etat-verrou",
    "/api/notes-journee",
  ];
  for (const [i, [name, payload]] of Object.entries(payloads).entries()) {
    const client = new FantasyClient({
      baseUrl: "https://example.com",
      token: "test",
      fetch: (input) => {
        if (new URL(String(input)).pathname === "/api/joueurs") {
          return Promise.resolve(Response.json({ joueurs: [] }));
        }
        assert(new URL(String(input)).pathname === endpoints[i]);
        return Promise.resolve(Response.json(payload));
      },
    });
    const args = name === "ratings" ? [name, "--round", "6"] : [name];
    const text = await runCli(args, client);
    assert(text.includes("\x1b[38;2;"), `${name}: no foreground styling`);
    assert(await runCli([...args, "--no-color"], client) === stripAnsi(text));
    assert(!text.includes("{"), `${name} emits JSON`);
    assert(
      JSON.stringify(JSON.parse(await runCli([...args, "--json"], client))) ===
        JSON.stringify(payload),
    );
  }
});
