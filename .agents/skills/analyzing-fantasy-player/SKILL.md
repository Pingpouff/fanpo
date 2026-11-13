---
name: analyzing-fantasy-player
description: Use when comparing Fantasy Rugby players, judging a player choice, investigating a weak pick, or estimating the relative Fantasy value of alternatives
---

# Analyzing a Fantasy Rugby Player

## Overview

Evaluate players in context rather than from average score alone.

Use position-relevant indicators from the project rules.

## Evaluation dimensions

For each relevant player, use the available evidence for:

- Fantasy / performance-index average;
- recent form;
- score distribution;
- floor;
- central expectation;
- ceiling;
- expected playing time;
- real-match starter or substitute status;
- tactical role;
- position-specific production;
- opponent;
- team context;
- price;
- value relative to alternatives.

Do not invent unavailable metrics.

## Comparing players

When alternatives are compared, distinguish:

| Dimension | Question |
|---|---|
| Floor | Who is least likely to produce a poor score? |
| Central expectation | Who has the strongest normal-case outlook? |
| Ceiling | Who can produce the highest score in a favorable scenario? |
| Role certainty | Whose minutes and responsibilities are most secure? |
| Value | Who produces the strongest expected return for the Fantasy cost? |
| Risk | What can invalidate the projection? |

## Matchup use

A matchup modifies player value; it does not replace player analysis.

A favorable team context may increase opportunity while still leaving a specific player as a weak selection because of role, minutes, price, or positional alternatives.

## Output contract

For each compared player provide:

- evidence supporting the choice;
- main downside;
- floor / central / ceiling profile;
- price or lineup implications when relevant.

Do not certify lineup legality here. Use `auditing-fantasy-lineup` or `validating-fantasy-lineup`.

## Common mistakes

- Ranking solely by historical average.
- Comparing players at different positions without accounting for positional scoring drivers.
- Treating one exceptional score as normal form.
- Ignoring expected minutes.
- Presenting an exact projection unsupported by the available data.


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

Use analyze player <current IDs and alternative IDs> for projections and role comparisons, following [the CLI advice workflow](../../../docs/fantasy-advice-workflow.md). This command acquires missing/stale inputs itself. Use data players for cached discovery. Inspect structured analysis evidence in memory before requesting raw player --detailed for missing statistics. Do not recompute projections from SQL or add stat bonuses to an existing rating.
