---
name: validating-fantasy-lineup
description: Use immediately before presenting a final Fantasy Rugby lineup, final set of changes, or a claim that a proposed composition is valid
---

# Validating a Fantasy Rugby Lineup

## Overview

Perform the final invariant check after all proposed changes.

This skill is a release gate, not an optimization step.

## Validation contract

Return a status for every applicable hard constraint:

| Check | Status |
|---|---|
| Roster structure | PASS / FAIL / UNKNOWN |
| Positions | PASS / FAIL / UNKNOWN |
| Budget | PASS / FAIL / UNKNOWN |
| Club limits | PASS / FAIL / UNKNOWN |
| Captain eligibility | PASS / FAIL / UNKNOWN |
| Impact-player eligibility | PASS / FAIL / UNKNOWN |
| Lock / timing constraints | PASS / FAIL / NOT APPLICABLE / UNKNOWN |

Also list unresolved late-team-news risks.

## Final status

Use exactly one of:

- `VALID` — all required constraints pass.
- `INVALID` — at least one hard constraint fails.
- `PROVISIONAL` — no known failure, but at least one required check is unresolved.

Do not describe a provisional lineup as fully validated.

## Revalidation triggers

Run validation again if any of the following changes:

- player;
- price;
- club;
- position;
- captain;
- impact player;
- real-match starter/substitute status;
- lock status.

## Common mistakes

- Assuming a lineup remains legal after one late swap.
- Ignoring a quota change caused by an unrelated replacement.
- Calling `UNKNOWN` a pass.
- Re-optimizing during validation instead of reporting the failure.


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
