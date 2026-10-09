# Persisted fantasy analysis v1

Approved implementation scope: extend the existing API facade and CLI with Top
14 context, persist facts with `@db/sqlite`, implement explainable pure
club/player and lineup analysis, expose sync/status/analyze/compare operations
to agents.

## Boundaries

- API: authenticated GETs and observed extensible response types.
- Data: origin/season/profile scope, immutable raw snapshots, queryable
  entities, integer monetary units, schema version, transactional normalization.
- Analysis: pure deterministic forecast, role projections, lineup constraints.
- Operations: source selection, bounded refresh, freshness, evidence and
  warnings.
- CLI: argument parsing, JSON/file input and readable output.

No embedded model provider, full optimizer, historical matchup normalization or
position-specific matchup multiplier in v1.

## Implementation ledger

1. API context and CLI commands implemented and tested; existing raw envelopes
   and historical points preserved. Verified notes endpoint and withdrawal IDs
   against a read-only response before adding support.
2. SQLite snapshots/entities implemented. Cross-connection persistence,
   idempotency, corrections, scope separation and malformed-update rollback
   tested. TTL acquisition supports offline, force, round changes and partial
   failure, bounded at five requests.
3. Pure club forecasts and role-specific player projections implemented with
   versioned parameters. Replay excludes target/future results; empirical
   probabilities require 20 historical errors. Lineup validation uses effective
   budget, secondary positions, dynamic club limit and server locks.
4. Sync/status/analyze/compare CLI and file-based proposed lineups implemented.
   Live sync followed by an offline lineup analysis verified 11.15 M cap, 11.07
   M cost, 0.08 M available; teamsheets unknown gives provisional advice.
5. README and domain rules updated. Imported skills corrected for one impact
   multiplier and legal half-score bench starters, with persisted evidence use.

## Explicit implementation decisions

- Work stays on `feat/persistent-analysis`, leaving master unchanged.
- The plan did not specify club-rating constants: use home advantage 5, decay
  0.9, neutral prior 5 matches, four opponent-adjustment iterations. These are
  disclosed assumptions, not fitted claims.
- No probability claim is made when historical replay has fewer than 20 errors.
- Unknown future roles do not receive an invented mixture probability. Compare
  expected delta remains null until both totals resolve.
- Normal 17-player format only; other formats return an explicit error.
- Queryable facts share a scoped entity table with kind/key/club/round/price
  indexes. Raw API models remain the canonical payloads rather than introducing
  duplicate domain DTOs or a generic adapter interface.
- The driver release binary requires newer glibc on this host. Provisioning
  prefers installed system SQLite on Linux and uses the pinned binary otherwise.
  Deno pointer access requires unrestricted FFI; documented separately from
  ordinary scoped filesystem/network permissions.
- Application formatting excludes imported skill packs and historical advice
  documents, avoiding unrelated formatting changes.

## Completion checks

Run full format/lint/type check and tests, perform final independent review,
resolve material findings, and retain a concise verification report.

Final verification: `deno task check` passed; `deno task test` passed with 78
tests. Independent review found and confirmed fixes for unrelated multiplier
locks and old-snapshot replay rolling normalized facts backward. Both fixes have
regression tests. Skill consistency review confirmed bench/impact/unknown-role
corrections. End-to-end live sync and separate-process offline analysis passed;
offline analysis also ran with network explicitly denied and without token
permission. Working changes remain on the feature branch for user review.
