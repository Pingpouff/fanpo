---
name: fantasy-rugby
description: Use when the user asks about a lineup, player choice, matchup, captain, impact player, optimization, validation, or strategy for the fantasy.poneeey.fr Fantasy Rugby game
---

# Fantasy Rugby

## Overview

This is the routing skill for the Fantasy Rugby project.

Treat the project's `regles_fantasy_rugby.md` as the authoritative source for game rules and constraints. Do not recreate or override a rule from memory when that project reference is available.

## Routing

Use the smallest relevant specialist skill.

| User need | Required skill |
|---|---|
| Check whether a lineup is legal | `auditing-fantasy-lineup` |
| Evaluate or compare players | `analyzing-fantasy-player` |
| Evaluate fixtures, clubs, or match context | `analyzing-rugby-matchups` |
| Improve or rebuild a lineup | `optimizing-fantasy-lineup` |
| Choose or reconsider a captain | `selecting-fantasy-captain` |
| Choose or reconsider impact players | `selecting-impact-players` |
| Certify a final proposed lineup | `validating-fantasy-lineup` |

For a full lineup analysis, combine only the specialist skills required by the request.

## Priority

Apply decisions in this order:

1. Project rules
2. Lineup legality
3. Verified player availability and real-match role
4. Expected Fantasy value
5. Tactical preference

Any proposed change must remain legal under the project rules.

## Missing information

Do not silently assume missing prices, club affiliations, team-sheet status, or player roles.

Mark missing information as unresolved and continue only as far as the available evidence supports.

## Common mistakes

- Duplicating permanent game rules inside this skill.
- Loading every specialist skill for every question.
- Optimizing before checking hard constraints.
- Treating a favorable club matchup as sufficient evidence to recommend every player from that club.
