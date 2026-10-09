---
name: selecting-fantasy-captain
description: Use when choosing, comparing, validating, or reconsidering the captain of a Fantasy Rugby lineup
---

# Selecting a Fantasy Rugby Captain

## Overview

Optimize the value of the captain multiplier while controlling avoidable playing-time and volatility risk.

The project rules define captain eligibility and multiplier behavior.

## Candidate criteria

For eligible candidates consider:

- expected score;
- floor;
- ceiling;
- expected minutes;
- role stability;
- recent form;
- matchup;
- opportunity volume;
- probability of a high-end performance;
- downside that becomes more costly under the multiplier.

## Decision pattern

Prefer a player whose multiplier exposure is justified by both:

1. strong central expectation; and
2. meaningful upside.

A volatile ceiling alone is not sufficient when minutes or role are fragile.

## Output contract

Provide:

- primary captain candidate;
- one or more meaningful alternatives when available;
- reason the multiplier is attractive;
- main risk;
- floor / central / ceiling profile.

Do not use captaincy to compensate for an otherwise poor player selection.

## Common mistakes

- Picking by reputation.
- Picking the highest single recent score.
- Ignoring minutes or substitution risk.
- Ignoring matchup and team role.
- Comparing captain candidates without accounting for volatility.


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
