import type { FantasyClient } from "../api/client.ts";
import type { Store } from "../data/store.ts";
import type { Matchday } from "../api/shared/types.ts";
import type {
  LocksResponse,
  MatchesResponse,
  RoundNotesResponse,
  StandingsResponse,
  TeamsheetsResponse,
} from "../api/context/types.ts";
import type { PlayersResponse } from "../api/joueurs/types.ts";
import type { PlayerSheetResponse } from "../api/joueurs/fiche/types.ts";
import type { CompositionResponse } from "../api/composition/types.ts";
import { forecastMatchups } from "../analysis/matchups.ts";
import {
  projectPlayer,
  type Role,
  selectionStatus,
} from "../analysis/player.ts";
import { type Lineup, validateLineup } from "../analysis/lineup.ts";
import { MODEL } from "../analysis/model.ts";
import {
  candidateLineup,
  type LineupCandidate,
} from "../analysis/candidates.ts";
import { acquire, type RefreshOptions } from "./data.ts";
export interface AdviceRequest extends RefreshOptions {
  kind: "sync" | "player" | "matchups" | "lineup" | "compare";
  ids?: number[];
  compositionId?: number;
  lineup?: Lineup;
  alternative?: Lineup;
  candidates?: LineupCandidate[];
}
export function currentLineup(c: CompositionResponse): Lineup {
  if (!c.compo) {
    throw new Error("No composition available. Supply a lineup file.");
  }
  return {
    slots: c.compo.slots.map((s) => ({ slot: s.slot, playerId: s.joueur_id })),
    captainSlot: c.compo.capitaine_slot ?? 0,
    impactSlot: c.compo.impact_slot ?? 0,
  };
}
/** Coordinates facts and pure analysis. It owns no HTTP implementation or SQL. */
export async function advise(
  store: Store,
  getClient: () => FantasyClient,
  request: AdviceRequest,
) {
  const candidates = request.candidates ?? [];
  if (request.alternative && candidates.length) {
    throw new Error("Use either --alternative or --candidate.");
  }
  if (new Set(candidates.map((c) => c.name)).size !== candidates.length) {
    throw new Error("Duplicate candidate name.");
  }
  if (request.kind === "lineup" && candidates.length > 1) {
    throw new Error(
      "Lineup validation accepts one candidate; use compare for multiple candidates.",
    );
  }
  const roundEndpoint = "/api/journees/cible";
  const preflight = await acquire(
    store,
    getClient,
    [roundEndpoint],
    store.read(roundEndpoint)?.round ?? 0,
    request,
  );
  const round = store.read<Matchday>(roundEndpoint)?.data.numero;
  if (!round) {
    throw new Error(
      `Target round unavailable. Run sync online. ${
        preflight.warnings.join("; ")
      }`,
    );
  }
  const compEndpoint = `/api/compos/${request.compositionId ?? 1}`;
  const needsTeam = ["sync", "lineup", "compare"].includes(request.kind);
  const endpoints = ["/api/top14/matchs", "/api/top14/classement"];
  if (request.kind !== "matchups") {
    endpoints.push(
      "/api/joueurs",
      "/api/feuilles",
      `/api/notes-journee?journee=${round}`,
    );
  }
  if (needsTeam) endpoints.push(compEndpoint, "/api/compos/etat-verrou");
  const fetched = await acquire(store, getClient, endpoints, round, request);
  const composition = store.read<CompositionResponse>(compEndpoint)?.data;
  let lineup: Lineup | undefined = request.lineup;
  if (needsTeam && !lineup && composition?.compo) {
    lineup = currentLineup(composition);
  }
  if (candidates.length && !lineup) {
    throw new Error("No baseline lineup available.");
  }
  const alternatives = candidates.map((candidate) => ({
    name: candidate.name,
    lineup: candidateLineup(lineup!, candidate),
  }));
  const ids = [
    ...new Set([
      ...(request.ids ?? []),
      ...(lineup?.slots.map((s) => s.playerId) ?? []),
      ...(request.alternative?.slots.map((s) => s.playerId) ?? []),
      ...alternatives.flatMap((a) => a.lineup.slots.map((s) => s.playerId)),
    ]),
  ];
  if (request.kind === "player" && !ids.length) {
    throw new Error("Supply at least one player ID");
  }
  const sheets = await acquire(
    store,
    getClient,
    ids.map((id) => `/api/joueurs/${id}/fiche`),
    round,
    request,
  );
  const warnings = [
    ...preflight.warnings,
    ...fetched.warnings,
    ...sheets.warnings,
  ];
  const evidence = [
    ...preflight.evidence,
    ...fetched.evidence,
    ...sheets.evidence,
  ];
  const matchData = store.read<MatchesResponse>("/api/top14/matchs");
  const matchups = forecastMatchups(matchData?.data.matchs ?? [], round);
  if (!matchups.matches.length) {
    warnings.push("No fixtures available for target round.");
  }
  const standings =
    store.read<StandingsResponse>("/api/top14/classement")?.data.classement ??
      [];
  const pool = store.read<PlayersResponse>("/api/joueurs")?.data;
  if (pool && pool.journee.numero !== round) {
    warnings.push("Player prices belong to a different round.");
  }
  const teamSheet = store.read<TeamsheetsResponse>("/api/feuilles")?.data;
  const notes = store.read<RoundNotesResponse>(
    `/api/notes-journee?journee=${round}`,
  )?.data;
  const players = ids.map((id) => {
    const sheet = store.read<PlayerSheetResponse>(`/api/joueurs/${id}/fiche`)
      ?.data;
    if (!sheet) {
      return {
        playerId: id,
        status: "unknown" as const,
        scenarios: null,
        expected: null,
        warnings: ["Missing player sheet."],
      };
    }
    const player = pool?.joueurs.find((p) => p.id === id);
    const status = teamSheet && teamSheet.journee === round
      ? selectionStatus(sheet.joueur, teamSheet)
      : "unknown";
    const matchup = matchups.matches.find((m) =>
      m.home === sheet.joueur.club || m.away === sheet.joueur.club
    );
    const domination = matchup?.domination === null || !matchup
      ? null
      : matchup.domination * (matchup.home === sheet.joueur.club ? 1 : -1);
    const scenarios = {
      starter: projectPlayer(sheet, "starter", round, domination),
      substitute: projectPlayer(sheet, "substitute", round, domination),
    };
    const withdrawal = !!notes?.forfaits.includes(id);
    const expected = withdrawal
      ? 30
      : status === "absent"
      ? 0
      : status === "unknown"
      ? null
      : scenarios[status].expected;
    const details = [
      ...new Set([
        ...scenarios.starter.warnings,
        ...scenarios.substitute.warnings,
      ]),
    ];
    if (status === "unknown") {
      details.push(
        "Teamsheet unannounced or unavailable; starter and substitute projections are conditional.",
      );
    }
    if (player?.indisponible) {
      details.push("Availability flag requires verification.");
    }
    return {
      playerId: id,
      name: `${sheet.joueur.prenom} ${sheet.joueur.nom}`,
      club: sheet.joueur.club,
      price: player?.valeur ?? sheet.joueur.valeur,
      status,
      withdrawal,
      scenarios,
      expected,
      matchup,
      standing: standings.find((s) => s.abrev === sheet.joueur.club) ?? null,
      statistics: sheet.stats,
      warnings: details,
    };
  });
  const analyzeLineup = (candidate: Lineup) => {
    if (!composition) {
      throw new Error(
        "Composition metadata unavailable: effective salary cap and club limit are required.",
      );
    }
    const locks = store.read<LocksResponse>("/api/compos/etat-verrou")?.data;
    const clubLimit = composition.club_limit;
    if (
      typeof clubLimit !== "number" || !Number.isInteger(clubLimit) ||
      clubLimit < 1
    ) throw new Error("Missing or invalid API club limit.");
    const validation = validateLineup(candidate, pool?.joueurs ?? [], {
      budget: composition.equipe.budget,
      clubLimit,
      format: String(composition.format ?? "normal"),
      locks: locks?.journee.numero === round ? locks.verrou : undefined,
      current: composition.compo ? currentLineup(composition) : undefined,
    });
    const slots = candidate.slots.map((slot) => {
      const p = players.find((p) => p.playerId === slot.playerId);
      const multiplier = (slot.slot === candidate.captainSlot ? 2 : 1) *
        (slot.slot === candidate.impactSlot ? 2 : 1);
      const score = (role: Role) =>
        p?.withdrawal
          ? 30 * multiplier
          : p?.status === "absent"
          ? 0
          : p?.scenarios?.[role].expected === null || !p?.scenarios
          ? null
          : p.scenarios[role].expected! * multiplier *
            (slot.slot >= 16 && role === "starter" ? 0.5 : 1);
      const starter = score("starter"), substitute = score("substitute");
      return {
        ...slot,
        status: p?.status ?? "unknown",
        starter,
        substitute,
        expected: p?.withdrawal
          ? 30 * multiplier
          : p?.status === "absent"
          ? 0
          : p?.status === "starter"
          ? starter
          : p?.status === "substitute"
          ? substitute
          : null,
        multiplier,
        warnings: p?.warnings ?? ["Missing player evidence"],
      };
    });
    const sum = (key: "starter" | "substitute" | "expected") =>
      slots.every((s) => s[key] !== null)
        ? slots.reduce((total, s) => total + s[key]!, 0)
        : null;
    const uncertain = warnings.length > 0 ||
      slots.some((s) => s.expected === null || s.warnings.length > 0) ||
      !locks || locks.journee.numero !== round ||
      composition.journee.numero !== round;
    return {
      validation: {
        ...validation,
        status: validation.status === "INVALID"
          ? "INVALID"
          : uncertain
          ? "PROVISIONAL"
          : validation.status,
      },
      expected: sum("expected"),
      conditionalAllStarters: sum("starter"),
      conditionalAllSubstitutes: sum("substitute"),
      slots,
      warnings: uncertain
        ? [
          "Data or selection uncertainty; conditional scenarios are not guaranteed outcomes.",
        ]
        : [],
    };
  };
  let result: unknown;
  if (request.kind === "sync") {
    result = { synced: evidence.length, players: ids };
  }
  if (request.kind === "matchups") {
    result = { ...matchups, currentStandings: standings };
  }
  if (request.kind === "player") result = players;
  if (request.kind === "lineup") {
    if (!lineup) throw new Error("No lineup available");
    result = analyzeLineup(alternatives[0]?.lineup ?? lineup);
  }
  if (request.kind === "compare") {
    if (!lineup || (!request.alternative && !alternatives.length)) {
      throw new Error("Compare requires two lineups");
    }
    const before = analyzeLineup(lineup);
    const comparison = (proposal: Lineup) => {
      const after = analyzeLineup(proposal);
      return {
        after,
        expectedDelta: before.expected === null || after.expected === null
          ? null
          : after.expected - before.expected,
        costDelta: after.validation.cost - before.validation.cost,
        changes: proposal.slots.filter((s) =>
          !lineup!.slots.some((o) =>
            o.slot === s.slot && o.playerId === s.playerId
          )
        ),
      };
    };
    result = alternatives.length
      ? {
        before,
        alternatives: alternatives.map((a) => ({
          ...a,
          ...comparison(a.lineup),
        })),
      }
      : { before, ...comparison(request.alternative!) };
  }
  return {
    model: MODEL,
    round,
    fullyCurrent: warnings.length === 0,
    evidence,
    warnings,
    result,
  };
}
