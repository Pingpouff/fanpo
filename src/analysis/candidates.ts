import type { Lineup } from "./lineup.ts";

export interface LineupCandidate {
  name: string;
  swaps: Lineup["slots"];
}

export function parseCandidate(input: string): LineupCandidate {
  const separator = input.indexOf(":");
  const name = input.slice(0, separator).trim();
  const entries = input.slice(separator + 1).split(",");
  const invalid = () =>
    new Error(
      "Invalid candidate; use NAME:SLOT=PLAYER_ID[,SLOT=PLAYER_ID] with unique slots 1-17 and positive safe player IDs.",
    );
  if (separator < 1 || !name) throw invalid();
  const seen = new Set<number>();
  const swaps = entries.map((entry) => {
    const match = /^(\d+)=(\d+)$/.exec(entry.trim());
    if (!match) throw invalid();
    const slot = Number(match[1]), playerId = Number(match[2]);
    if (
      slot < 1 || slot > 17 || seen.has(slot) ||
      !Number.isSafeInteger(playerId) || playerId < 1
    ) throw invalid();
    seen.add(slot);
    return { slot, playerId };
  });
  return { name, swaps };
}

export function candidateLineup(
  base: Lineup,
  candidate: LineupCandidate,
): Lineup {
  for (const swap of candidate.swaps) {
    if (!base.slots.some((s) => s.slot === swap.slot)) {
      throw new Error(
        `Candidate ${candidate.name}: missing baseline slot ${swap.slot}`,
      );
    }
  }
  return {
    ...base,
    slots: base.slots.map((s) => ({
      ...s,
      playerId:
        candidate.swaps.find((swap) => swap.slot === s.slot)?.playerId ??
          s.playerId,
    })),
  };
}
