import type { Player } from "../api/joueurs/types.ts";
import type { LockState } from "../api/context/types.ts";
import { money } from "../data/money.ts";
export interface Lineup {
  slots: { slot: number; playerId: number }[];
  captainSlot: number;
  impactSlot: number;
}
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
];
export function validateLineup(
  lineup: Lineup,
  players: readonly Player[],
  rules: {
    budget: string;
    clubLimit: number;
    locks?: LockState;
    current?: Lineup;
    format?: string;
  },
) {
  const errors: string[] = [], warnings: string[] = [];
  const ids = new Set<number>(),
    slots = new Set<number>(),
    clubs: Record<string, number> = {};
  let cost = 0;
  if (rules.format && rules.format !== "normal") {
    errors.push("Unsupported lineup format; v1 supports normal only.");
  }
  if (lineup.slots.length !== 17) {
    errors.push("Exactly 17 selections required.");
  }
  for (const selection of lineup.slots) {
    if (
      !Number.isInteger(selection.slot) || selection.slot < 1 ||
      selection.slot > 17 || slots.has(selection.slot)
    ) errors.push(`Invalid or duplicate slot ${selection.slot}`);
    slots.add(selection.slot);
    if (ids.has(selection.playerId)) {
      errors.push(`Duplicate player ${selection.playerId}`);
    }
    ids.add(selection.playerId);
    const player = players.find((p) => p.id === selection.playerId);
    if (!player) {
      errors.push(`Missing player ${selection.playerId}`);
      continue;
    }
    cost += money(player.valeur);
    clubs[player.club] = (clubs[player.club] ?? 0) + 1;
    const allowed = [
      player.poste,
      player.poste_secondaire,
      player.poste_tertiaire,
    ];
    if (
      selection.slot <= 15 && !allowed.includes(positions[selection.slot - 1])
    ) errors.push(`Wrong position in slot ${selection.slot}`);
    if (player.indisponible) {
      warnings.push(
        `Player ${player.id} is flagged unavailable; verify teamsheet.`,
      );
    }
  }
  if (cost > money(rules.budget)) errors.push("Effective salary cap exceeded.");
  for (const [club, count] of Object.entries(clubs)) {
    if (count > rules.clubLimit) errors.push(`Club limit exceeded: ${club}`);
  }
  if (
    !slots.has(lineup.captainSlot) || lineup.captainSlot > 15 ||
    lineup.captainSlot < 1
  ) errors.push("Captain must be a selected starter.");
  if (
    !slots.has(lineup.impactSlot) || lineup.impactSlot < 16 ||
    lineup.impactSlot > 17
  ) errors.push("Impact must be one selected bench player.");
  if (rules.locks && rules.current) {
    const locked = new Set(
      rules.locks.demarres.filter((c) => !rules.locks!.liberes.includes(c)),
    );
    for (const old of rules.current.slots) {
      const p = players.find((p) => p.id === old.playerId);
      if (
        p && locked.has(p.club) &&
        !lineup.slots.some((s) =>
          s.slot === old.slot && s.playerId === old.playerId
        )
      ) errors.push(`Server lock prevents changing slot ${old.slot}`);
    }
    for (const s of lineup.slots) {
      const p = players.find((p) => p.id === s.playerId);
      if (
        p && locked.has(p.club) &&
        !rules.current.slots.some((o) =>
          o.slot === s.slot && o.playerId === s.playerId
        )
      ) errors.push(`Server lock prevents adding player ${s.playerId}`);
    }
    for (
      const [before, after] of [
        [rules.current.captainSlot, lineup.captainSlot],
        [rules.current.impactSlot, lineup.impactSlot],
      ]
    ) {
      if (before === after) continue;
      for (
        const [selected, slot] of [[rules.current, before], [
          lineup,
          after,
        ]] as const
      ) {
        const p = players.find((p) =>
          p.id === selected.slots.find((s) => s.slot === slot)?.playerId
        );
        if (p && locked.has(p.club)) {
          errors.push("Server lock prevents multiplier change");
        }
      }
    }
  }
  return {
    status: errors.length
      ? "INVALID"
      : warnings.length
      ? "PROVISIONAL"
      : "VALID",
    cost,
    budget: money(rules.budget),
    remaining: money(rules.budget) - cost,
    errors,
    warnings,
  };
}
