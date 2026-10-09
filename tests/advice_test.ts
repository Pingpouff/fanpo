import { Store } from "../src/data/store.ts";
import { advise } from "../src/operations/advice.ts";
import { assert, equal } from "./helpers.ts";
import { response, sheetResponse } from "./fixtures.ts";
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
  const db = new Store(":memory:", {
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
  } finally {
    db.close();
  }
});
