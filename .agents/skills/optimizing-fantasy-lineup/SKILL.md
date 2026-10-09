---
name: optimizing-fantasy-lineup
description: Use when the user wants to improve, rebuild, optimize, or find weak points and replacements in an existing Fantasy Rugby lineup
---

# Optimizing a Fantasy Rugby Lineup

## Overview

Improve expected Fantasy output without violating hard game constraints.

**REQUIRED SUB-SKILL:** Use `auditing-fantasy-lineup` before optimizing an existing lineup.

Use `analyzing-fantasy-player` for player comparisons.

Use `analyzing-rugby-matchups` when fixture context materially affects the decision.

Use captain or impact-player skills only when those roles are in scope.

Use `validating-fantasy-lineup` before presenting a final lineup as valid.

## Optimization process

1. Audit the current lineup.
2. Identify the highest-leverage weaknesses.
3. Generate plausible replacements.
4. Compare candidates using player and matchup context.
5. Recalculate affected constraints after each proposed change.
6. Remove illegal or mutually incompatible changes.
7. Reassess captain and impact players if the changes affect them.
8. Validate the final proposed lineup.

## Highest-leverage weaknesses

Prioritize choices where a change can materially improve expected output.

Typical signals include:

- weak recent or role-adjusted production;
- uncertain minutes;
- poor matchup;
- poor price-to-upside tradeoff;
- weak captaincy multiplier usage;
- low-impact bench slot;
- club allocation preventing access to a stronger option.

Do not label a player weak merely because another player has a higher average.

## Alternative contract

For each priority weakness, provide multiple useful alternatives when the player pool allows it.

For every alternative state:

- expected advantage;
- main downside;
- budget effect;
- club-quota effect;
- role / team-sheet dependency;
- whether another change is required.

## Final output

### Diagnostic
Main strengths and exposures.

### Priority weaknesses
The few highest-leverage choices.

### Alternatives
Compatible replacements with tradeoffs.

### Captain
Only if relevant.

### Impact players
Only if relevant.

### Final proposal
Only mutually compatible changes.

### Remaining risks
Unresolved team news, injury, role, or lock-time issues.

## Common mistakes

- Optimizing one player without checking the resulting club count.
- Proposing individually good changes that cannot coexist.
- Using all three slots from a favorable club by default.
- Treating salary left unused as inherently bad.
- Calling a lineup final before validation.


## Persisted analysis evidence

Use the CLI workflows in README.md: `sync`, `data status`, `analyze player`,
`analyze matchups`, `analyze lineup`, and `compare`. Prefer stored fresh data;
refresh missing or stale inputs. Include snapshot timestamps and warnings in
advice. `--offline` permits stale facts with explicit uncertainty.

Use `equipe.budget` for the effective salary cap and API `club_limit` for club
constraints. Exactly one Fantasy bench player is impact x2; a real starter on
the Fantasy bench is legal and receives half points before that multiplier.
Unannounced clubs mean unknown role, not absence. See the corrected root rules.

The v1 forecast applies `1 + 0.10 * domination` once. Detailed statistics explain
the rating; do not add extra bonuses. Missing role history leaves projections
unresolved. Current standings describe context; historical replay uses earlier
results only. Do not certify projections as measured outcomes or infer a
guaranteed improvement from conditional scenarios.
