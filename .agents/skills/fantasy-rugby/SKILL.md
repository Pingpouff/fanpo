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

## Required CLI workflow

For full team advice, follow [the CLI advice workflow](../../../docs/fantasy-advice-workflow.md) in the project root. Use data status/sync, analyze lineup, analyze matchups, data players, analyze player and compare. SQLite stores facts; do not export API responses as a parallel cache or use direct SQL/scratch scripts to reproduce scores. Report a precise capability gap before introducing a bounded fallback.
