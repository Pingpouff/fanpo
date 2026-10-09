import { forecastMatchups } from "../src/analysis/matchups.ts";
import {
  fantasyPoints,
  projectPlayer,
  selectionStatus,
} from "../src/analysis/player.ts";
import { validateLineup } from "../src/analysis/lineup.ts";
import { assert, equal } from "./helpers.ts";
import { player, sheetResponse } from "./fixtures.ts";
import type { Match } from "../src/api/context/types.ts";
Deno.test("player forecast applies domination once, keeps roles separate and accounts for minutes", () => {
  const sheet = {
    ...sheetResponse,
    perfs: [{
      ...sheetResponse.perfs[0],
      numero: 1,
      note: "80",
      minutes_jouees: 80,
      titulaire: true,
    }, {
      ...sheetResponse.perfs[0],
      numero: 2,
      note: null,
      minutes_jouees: 5,
      titulaire: true,
    }],
  };
  const p = projectPlayer(sheet, "starter", 3, 0.5);
  equal(p.baseline, 80);
  equal(p.matchupFactor, 1.05);
  equal(p.scoringProbability, 0.8 / 1.8);
  assert(Math.abs(p.expected! - 84 * 0.8 / 1.8) < 1e-8);
  equal(projectPlayer(sheet, "substitute", 3, 0).expected, null);
  equal(
    fantasyPoints(80, {
      bench: true,
      captain: false,
      impact: true,
      role: "starter",
      minutes: 80,
    }),
    80,
  );
  equal(
    fantasyPoints(80, {
      bench: true,
      captain: false,
      impact: true,
      role: "substitute",
      minutes: 9,
    }),
    0,
  );
  equal(
    fantasyPoints(80, {
      bench: true,
      captain: false,
      impact: true,
      role: "starter",
      minutes: 0,
      withdrawal: true,
    }),
    60,
  );
  equal(
    selectionStatus(player(), {
      journee: 3,
      clubs_annonces: [],
      joueurs: {},
      notes_provisoires: false,
    }),
    "unknown",
  );
});
Deno.test("match forecasts exclude target and later results and require enough replay errors", () => {
  const matches: Match[] = Array.from(
    { length: 30 },
    (_, i) => ({
      journee: i + 1,
      date: "2026-01-01",
      heure: "",
      stade: "",
      statut: "Result",
      dom: { nom: "A", abrev: "A", score: 30 },
      ext: { nom: "B", abrev: "B", score: 10 },
    }),
  );
  const fixture = {
    ...matches[29],
    journee: 31,
    statut: "Fixture",
    dom: { ...matches[0].dom, score: null },
    ext: { ...matches[0].ext, score: null },
  };
  const a = forecastMatchups([...matches, fixture], 31);
  const b = forecastMatchups([...matches, fixture, {
    ...matches[0],
    journee: 32,
  }], 31);
  equal(a, b);
  assert(a.matches[0].winProbability !== null);
  assert(a.calibration.samples >= 20);
  equal(forecastMatchups([fixture], 31).matches[0].domination, null);
});
Deno.test("lineup validator uses effective budget and secondary positions", () => {
  const pool = [
    player({ id: 1, valeur: "0.75", poste: "TAL", poste_secondaire: "PIL" }),
  ];
  const report = validateLineup(
    { slots: [{ slot: 1, playerId: 1 }], captainSlot: 1, impactSlot: 16 },
    pool,
    { budget: "11.15", clubLimit: 3 },
  );
  equal(report.cost, 750000);
  assert(!report.errors.some((e) => e.includes("position")));
  assert(report.errors.some((e) => e.includes("17")));
});

Deno.test("full lineup validates bench starters legally while rejecting duplicate, budget, club and captain violations", () => {
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
  const pool = positions.map((poste, i) =>
    player({ id: i + 1, poste, club: `C${Math.floor(i / 3)}`, valeur: "0.65" })
  );
  const lineup = {
    slots: pool.map((p, i) => ({ slot: i + 1, playerId: p.id })),
    captainSlot: 8,
    impactSlot: 16,
  };
  const valid = validateLineup(lineup, pool, { budget: "11.15", clubLimit: 3 });
  equal(valid.status, "VALID");
  equal(valid.cost, 11050000);
  assert(
    validateLineup({ ...lineup, captainSlot: 16 }, pool, {
      budget: "11.15",
      clubLimit: 3,
    }).errors.length > 0,
  );
  assert(
    validateLineup(lineup, pool, { budget: "11.00", clubLimit: 3 }).errors.some(
      (e) => e.includes("salary cap"),
    ),
  );
  assert(
    validateLineup(lineup, pool, { budget: "11.15", clubLimit: 2 }).errors.some(
      (e) => e.includes("Club limit"),
    ),
  );
  const duplicate = {
    ...lineup,
    slots: lineup.slots.map((s, i) => i === 1 ? { ...s, playerId: 1 } : s),
  };
  assert(
    validateLineup(duplicate, pool, { budget: "11.15", clubLimit: 3 }).errors
      .some((e) => e.includes("Duplicate player")),
  );
  const changed = {
    ...lineup,
    slots: lineup.slots.map((s) => s.slot === 1 ? { ...s, playerId: 18 } : s),
  };
  const locked = validateLineup(changed, [
    ...pool,
    player({ id: 18, club: "NEW", valeur: "0.65" }),
  ], {
    budget: "11.15",
    clubLimit: 3,
    current: lineup,
    locks: {
      en_cours: true,
      demarres: ["C0"],
      liberes: [],
      coups_envoi: {},
      prochain: null,
    },
  });
  assert(locked.errors.some((e) => e.includes("Server lock")));
});

Deno.test("role evidence excludes future and unconsolidated performances, clamps scores and recognizes absence only after announcement", () => {
  const p = {
    ...sheetResponse.perfs[0],
    consolidee: true,
    titulaire: true,
    note: "100",
    minutes_jouees: 80,
    numero: 1,
  };
  const sheet = {
    ...sheetResponse,
    perfs: [p, { ...p, numero: 4, note: "0" }, {
      ...p,
      numero: 2,
      consolidee: false,
      note: "0",
    }],
  };
  equal(projectPlayer(sheet, "starter", 3, 1).conditionalScore, 100);
  equal(projectPlayer(sheet, "starter", 3, -1).conditionalScore, 90);
  const sheets = {
    journee: 3,
    clubs_annonces: ["UBB"],
    joueurs: { "1": 16 },
    notes_provisoires: false,
  };
  equal(selectionStatus(player(), sheets), "substitute");
  equal(selectionStatus(player({ id: 2 }), sheets), "absent");
  equal(
    fantasyPoints(70, {
      bench: false,
      captain: true,
      impact: false,
      role: "starter",
      minutes: 80,
    }),
    140,
  );
  equal(
    fantasyPoints(70, {
      bench: true,
      captain: false,
      impact: false,
      role: "starter",
      minutes: 80,
    }),
    35,
  );
});
Deno.test("unchanged locked impact permits unlocked captain change and unchanged locked captain permits impact change", () => {
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
  const pool = positions.map((poste, i) =>
    player({ id: i + 1, poste, club: `C${i}`, valeur: "0.50" })
  );
  const current = {
    slots: pool.map((p, i) => ({ slot: i + 1, playerId: p.id })),
    captainSlot: 8,
    impactSlot: 16,
  };
  for (
    const [candidate, locked] of [[{ ...current, captainSlot: 10 }, "C15"], [{
      ...current,
      impactSlot: 17,
    }, "C7"]] as const
  ) {
    const report = validateLineup(candidate, pool, {
      budget: "11.15",
      clubLimit: 3,
      current,
      locks: {
        en_cours: true,
        demarres: [locked],
        liberes: [],
        coups_envoi: {},
        prochain: null,
      },
    });
    equal(report.errors, []);
  }
});
