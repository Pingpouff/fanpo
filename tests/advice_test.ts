import { Store } from "../src/data/store.ts";
import { advise } from "../src/operations/advice.ts";
import { assert, equal } from "./helpers.ts";
import { response, sheetResponse } from "./fixtures.ts";
import { renderAnalysis } from "../src/cli/context/output.ts";
import { runCli } from "../src/cli.ts";
import { stripAnsi } from "../src/cli/shared/colors.ts";
Deno.test("offline player advice includes scenarios, evidence and stale warnings without authentication", async () => {
  const db = new Store(":memory:", {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  try {
    for (
      const [endpoint, value] of [
        ["/api/journees/cible", { ...response.journee, numero: 6 }],
        ["/api/top14/matchs", { matchs: [] }],
        ["/api/top14/classement", { classement: [] }],
        ["/api/feuilles", {
          journee: 6,
          clubs_annonces: [],
          joueurs: {},
          notes_provisoires: false,
        }],
        ["/api/joueurs", {
          ...response,
          joueurs: [{ ...response.joueurs[0], id: sheetResponse.joueur.id }],
        }],
        [`/api/joueurs/${sheetResponse.joueur.id}/fiche`, sheetResponse],
      ] as const
    ) await db.save(endpoint, value, 6, "2020-01-01T00:00:00Z");
    const result = await advise(db, () => {
      throw new Error("Must not request credentials offline");
    }, { kind: "player", ids: [sheetResponse.joueur.id], offline: true });
    equal(result.fullyCurrent, false);
    assert(result.evidence.length > 0);
    assert(JSON.stringify(result).includes("substitute"));
    assert(result.warnings.length > 0);
  } finally {
    db.close();
  }
});
Deno.test("lineup comparison applies one impact and bench half-score, preserves provisional status for unknown teamsheets", async () => {
  const path = await Deno.makeTempFile({ suffix: ".sqlite" });
  const db = new Store(path, {
    origin: "https://example.com",
    season: "2026-27",
    profile: "test",
  });
  const positions = [
    "PIL",
    "TAL",
    "PIL",
    "DL",
    "DL",
    "TL",
    "TL",
    "N8",
    "DM",
    "OUV",
    "AIL",
    "CEN",
    "CEN",
    "AIL",
    "ARR",
    "PIL",
    "TAL",
  ];
  const pool = positions.map((poste, i) => ({
    ...response.joueurs[0],
    id: i + 1,
    poste,
    club: `C${Math.floor(i / 3)}`,
    valeur: "0.65",
  }));
  const slots = pool.map((p, i) => ({ slot: i + 1, playerId: p.id }));
  pool.push({ ...pool[0], id: 18, club: "NEW", valeur: "0.50" });
  const lineup = { slots, captainSlot: 8, impactSlot: 16 };
  const notes = { notes: {}, forfaits: [] };
  try {
    const inputs: [string, unknown][] = [
      ["/api/journees/cible", { ...response.journee, numero: 6 }],
      ["/api/top14/matchs", { matchs: [] }],
      ["/api/top14/classement", { classement: [] }],
      ["/api/joueurs", {
        journee: { ...response.journee, numero: 6 },
        joueurs: pool,
      }],
      ["/api/feuilles", {
        journee: 6,
        clubs_annonces: [],
        joueurs: {},
        notes_provisoires: false,
      }],
      ["/api/notes-journee?journee=6", notes],
      ["/api/compos/etat-verrou", {
        journee: { ...response.journee, numero: 6 },
        verrou: {
          en_cours: false,
          demarres: [],
          liberes: [],
          coups_envoi: {},
          prochain: null,
        },
      }],
      ["/api/compos/1", {
        journee: { ...response.journee, numero: 6 },
        equipe: { budget: "11.15" },
        club_limit: 3,
        format: "normal",
        compo: {
          slots: slots.map((s) => ({ slot: s.slot, joueur_id: s.playerId })),
          capitaine_slot: 8,
          impact_slot: 16,
        },
      }],
    ];
    for (const p of pool) {
      inputs.push([`/api/joueurs/${p.id}/fiche`, {
        ...sheetResponse,
        joueur: { ...sheetResponse.joueur, id: p.id, club: p.club },
        perfs: [{
          ...sheetResponse.perfs[0],
          numero: 5,
          consolidee: true,
          titulaire: true,
          minutes_jouees: 80,
          note: "80",
        }],
      }]);
    }
    for (const [endpoint, input] of inputs) await db.save(endpoint, input, 6);
    const reply = await advise(db, () => {
      throw new Error("offline");
    }, {
      kind: "compare",
      offline: true,
      lineup,
      alternative: { ...lineup, captainSlot: 10 },
    });
    const r = reply.result as {
      before: {
        expected: null;
        conditionalAllStarters: number;
        validation: { status: string };
      };
      expectedDelta: null;
    };
    equal(r.before.validation.status, "PROVISIONAL");
    equal(r.before.expected, null);
    equal(r.expectedDelta, null);
    // 15 starters * 80, captain adds 80; bench scores 40 + designated impact 80.
    equal(r.before.conditionalAllStarters, 1400);
    const batch = await advise(db, () => {
      throw new Error("offline");
    }, {
      kind: "compare",
      offline: true,
      candidates: [
        {
          name: "Swap",
          swaps: [{ slot: 1, playerId: 3 }, { slot: 3, playerId: 1 }],
        },
        {
          name: "Wrong position",
          swaps: [{ slot: 1, playerId: 2 }, { slot: 2, playerId: 1 }],
        },
        { name: "New player", swaps: [{ slot: 1, playerId: 18 }] },
      ],
    });
    const b = batch.result as {
      before: { expected: null };
      alternatives: {
        name: string;
        lineup: typeof lineup;
        after: { validation: { status: string }; expected: null };
        expectedDelta: null;
        changes: unknown[];
      }[];
    };
    equal(b.alternatives.map((a) => a.name), [
      "Swap",
      "Wrong position",
      "New player",
    ]);
    equal(b.alternatives[0].lineup.slots[0].playerId, 3);
    equal(b.alternatives[1].lineup.slots[2].playerId, 3); // Independent baseline.
    equal(b.alternatives[0].lineup.captainSlot, 8);
    equal(b.alternatives[0].lineup.impactSlot, 16);
    equal(b.alternatives[0].after.validation.status, "PROVISIONAL");
    equal(b.alternatives[1].after.validation.status, "INVALID");
    equal(b.alternatives[0].expectedDelta, null);
    assert(batch.evidence.some((e) => e.endpoint === "/api/joueurs/18/fiche"));
    equal(
      new Set(batch.evidence.map((e) => e.endpoint)).size,
      batch.evidence.length,
    );
    const human = renderAnalysis("compare", batch);
    assert(
      human.includes("Wrong position") && human.includes("Swap") &&
        human.includes("Unresolved"),
    );
    assert(human.includes("Wrong position in slot 1"));
    const final = await advise(db, () => {
      throw new Error("offline");
    }, {
      kind: "lineup",
      offline: true,
      candidates: [{
        name: "Swap",
        swaps: [{ slot: 1, playerId: 3 }, { slot: 3, playerId: 1 }],
      }],
    });
    equal(
      (final.result as { slots: { playerId: number }[] }).slots[0].playerId,
      3,
    );
    const args = [
      "compare",
      "--offline",
      "--db",
      path,
      "--origin",
      "https://example.com",
      "--season",
      "2026-27",
      "--profile",
      "test",
      "--candidate",
      "New:1=18",
      "--candidate",
      "Swap:1=3,3=1",
    ];
    const colored = await runCli(args);
    assert(colored.includes("New") && colored.includes("Swap"));
    equal(await runCli([...args, "--no-color"]), stripAnsi(colored));
    const json = JSON.parse(await runCli([...args, "--json", "--debug"]));
    equal(json.data.result.alternatives.length, 2);
    equal(json.data.result.alternatives[0].after.validation.remaining, 250000);
    equal(json.metadata.requestCount, 0);
    equal(json.data.result.alternatives[0].expectedDelta, null);
    assert(!JSON.stringify(json).includes("\x1b"));
  } finally {
    db.close();
    await Deno.remove(path);
  }
});
