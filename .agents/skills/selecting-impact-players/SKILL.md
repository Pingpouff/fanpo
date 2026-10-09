---
name: selecting-impact-players
description: Use when choosing, comparing, checking, or replacing Fantasy Rugby impact players or bench selections
---

# Selecting Fantasy Rugby Impact Players

## Overview

Select impact players only from the set of players eligible under the project rules.

Eligibility is a hard prerequisite; expected upside is considered only after eligibility.

## Verify real role and scoring

The two Fantasy bench slots are legal for real starters and substitutes. Only
one designated impact slot gets x2. Real starters on the Fantasy bench receive
half their rating before the impact multiplier. Compare the penalized starter
projection with the substitute projection; do not exclude starters as illegal.

- Announced starter: apply the half-score penalty on the Fantasy bench.
- Announced substitute: use substitute-role history and the probability of ten minutes.
- Unannounced club: role is unknown; present conditional scenarios.
- Announced club with player omitted: absent, unless official withdrawal credit applies.

Do not infer real-match role from the Fantasy slot.

## Evaluation dimensions

Among eligible players consider:

- probability of entering;
- expected entry time;
- expected minutes;
- production per minute;
- tactical role after entry;
- match script;
- position-specific scoring opportunities;
- upside under the Fantasy multiplier;
- risk of playing too few minutes to score.

## Output contract

For each serious candidate, separate:

- eligibility;
- expected opportunity;
- Fantasy upside;
- main risk.

Check both bench selections against budget and club constraints, then select exactly one impact multiplier.

## Common mistakes

- Calling a real starter on the Fantasy bench illegal instead of applying the half-score penalty.
- Ignoring the minimum-minutes rule.
- Using total average instead of bench-role opportunity.
- Assuming all substitutes have similar entry times.
- Failing to recheck eligibility after late team-sheet changes.


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
