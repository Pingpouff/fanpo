---
name: analyzing-rugby-matchups
description: Use when Fantasy Rugby analysis depends on fixtures, opponent strength, home or away context, expected match dynamics, or identifying clubs with favorable conditions
---

# Analyzing Rugby Matchups for Fantasy

## Overview

Translate match context into Fantasy-relevant implications without assuming that every player from a favored club is automatically a strong Fantasy pick.

## Evidence to consider

When available, consider:

- home / away;
- relative team strength;
- current form;
- lineup strength and rotation;
- expected possession;
- expected territory;
- attacking opportunity;
- defensive workload;
- likely match script;
- positional implications;
- uncertainty in forecasts.

Use current sources when the analysis depends on upcoming fixtures or late team news.

## Output contract

For each relevant fixture, provide:

- favorable club context;
- unfavorable club context;
- likely Fantasy-relevant match script;
- positions or roles most likely to benefit;
- positions where the matchup matters less;
- uncertainty or conditions that could reverse the view.

## Positional translation

Do not stop at "Team A should win."

Translate the expected match shape into opportunities such as:

- attacking volume;
- carries and dominant carries;
- defensive tackle volume;
- line-break or kick-return opportunities;
- set-piece opportunity;
- territorial kicking;
- bench impact potential.

Only use implications supported by the project scoring model and available data.

## Common mistakes

- Equating favorite with automatic Fantasy value.
- Ignoring defensive-volume upside for the weaker side.
- Ignoring rotation and real team sheets.
- Treating betting odds as certainty.
- Recommending more players from a club than the game rules allow.


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
