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
