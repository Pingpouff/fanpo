---
name: auditing-fantasy-lineup
description: Use when a Fantasy Rugby lineup must be checked for legality, structural errors, budget constraints, club limits, positions, starters, or impact-player eligibility
---

# Auditing a Fantasy Rugby Lineup

## Overview

Determine whether a submitted lineup is structurally valid before evaluating its sporting quality.

The project rules are the source of truth.

## Required inputs

Use, when available:

- current Fantasy lineup;
- project Fantasy Rugby rules;
- player club;
- player Fantasy position;
- player price;
- real-match starter or substitute status.

## Audit contract

Return four sections:

1. **Blocking violations**
2. **Warnings / unresolved information**
3. **Validated constraints**
4. **Audit status**: `VALID`, `INVALID`, or `PROVISIONAL`

Do not optimize player choices in this skill.

## Checks

Apply every hard constraint defined in the project rules.

At minimum, verify all constraints for which the required data is available:

- roster size and starter/impact-player structure;
- positional legality;
- budget / salary cap;
- maximum players per club;
- captain eligibility if a captain is designated;
- one designated impact slot on the Fantasy bench; apply half-score penalty to real starters;
- any lock or timing constraint relevant to the current state.

## Unknown is not valid

Missing information must not be treated as a pass.

Examples:

- Unknown price → budget status is `UNKNOWN`.
- Unknown team-sheet status → projected points are conditional; structural bench eligibility is unchanged.
- Unknown club → club quota cannot be certified.

## Output example

```text
Blocking violations
- None

Warnings
- Impact-player status for Player X is not yet confirmed.

Validated constraints
- 17 players: PASS
- Club quota: PASS
- Budget: PASS

Audit status
PROVISIONAL
```

## Common mistakes

- Quietly fixing an invalid lineup instead of reporting the issue.
- Mixing sporting recommendations into the audit.
- Assuming a player is a substitute because the user placed them on the Fantasy bench.
- Certifying a budget without all prices.


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
