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
- impact-player eligibility against the real team sheet;
- any lock or timing constraint relevant to the current state.

## Unknown is not valid

Missing information must not be treated as a pass.

Examples:

- Unknown price → budget status is `UNKNOWN`.
- Unknown team-sheet status → impact-player eligibility is `UNKNOWN`.
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
