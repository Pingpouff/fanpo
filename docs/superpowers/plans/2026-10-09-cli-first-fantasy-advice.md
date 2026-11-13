# CLI-first Fantasy Advice Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this
> plan task by task. Steps use checkbox syntax for tracking. Implementation
> completed on 9 October 2026; see the execution notes below.

**Goal:** Make Fantasy advice consistently use the existing persistence, scoring
and comparison features, with evidence that the prescribed workflow was
followed.

**Architecture:** Retain the existing API → acquisition/SQLite →
analysis/operations → CLI architecture. Skills define when to call the existing
commands; `advise()` and the pure analysis modules remain responsible for
calculations and validation. Add only one narrowly scoped read operation for
discovering players already in SQLite.

**Tech Stack:** Deno, TypeScript, Cliffy, SQLite through `@db/sqlite`, Markdown
skills and reports. No new dependencies.

**Spec:** The [design and scope](#design-and-scope) in this document, based on
the user's feedback about bypassing the scoring CLI and exporting data already
persisted in SQLite.

## Design and scope

The last analysis used `sync`, `analyze lineup` and `analyze matchups`, but used
direct database queries and a scratch script for player comparisons and transfer
packages. The script reused production functions, yet bypassed `analyze player`
and `compare`. The subsequent recommendation to build a structured advice
operation overlooked the existing `advise()` implementation.

Correct the workflow first. Do not replace the analysis layer, add a second
scoring engine, build an agent framework, or introduce an optimiser in this
increment.

The canonical advice sequence is:

1. Read the relevant Fantasy skills and authoritative rules.
2. Inspect `data status`; run `sync` to acquire missing/stale required facts.
3. Audit the current team with `analyze lineup`.
4. Evaluate fixture context with `analyze matchups`.
5. Discover candidates from the cached catalogue, respecting positions, costs
   and club constraints.
6. Use `analyze player <current IDs and alternative IDs>` for player scoring and
   role scenarios. Online acquisition automatically refreshes missing/stale
   inputs; do not fetch the same fiches separately by default.
7. Express each serious proposal as a complete lineup input under `.data/`, then
   run `compare --alternative ...`.
8. Evaluate captain and impact variants through those same commands.
9. Refresh stale teamsheets and locks before final validation; rerun affected
   comparisons if the evidence changes.
10. Write the Markdown report from command results and their evidence
    references.

Readable output is the default. `--json` is permitted for structured consumption
in memory; do not export command responses to temporary JSON files as a
replacement for SQLite. Proposal JSON files are deliberate `Lineup` inputs
required by the current CLI, not API-response dumps.

SQL is an implementation detail of the store. An advice session must not use
scratch scripts or direct SQL to reproduce player projections, matchups,
legality checks or package scoring. If a command lacks a required capability,
identify the precise missing input/output, document a bounded fallback if
necessary, and propose the smallest extension.

One actual discovery gap is already verified: `players` always requests the API,
whereas `data status` lists sources but cannot filter cached players. Add
`data players` to close that gap. It must remain an inspection command, not a
new candidate scoring system.

## Global constraints

- Preserve `advise()`, `projectPlayer()`, `forecastMatchups()` and
  `validateLineup()` as the existing calculation path.
- SQLite remains the source of persisted facts; prefer fresh cached data and
  refresh missing/stale inputs.
- Keep origin, season, profile, database and composition scope consistent
  throughout each analysis.
- Use `equipe.budget` for the effective salary cap and API `club_limit` for the
  club constraint.
- Unannounced roles remain unknown; missing projections remain unresolved, never
  zero.
- An overall `PROVISIONAL` status cannot be described as a fully validated
  recommendation.
- A conditional comparison is not an expected or guaranteed gain.
- Preserve default readable colors, `--no-color`, JSON without ANSI, and
  metadata only under `--debug`.
- Do not change model coefficients, introduce confidence penalties or apply
  extra stat bonuses in this increment.
- Do not change the user's live team; proposals are local artifacts.

## Review focus

- Fresh cache: supported analysis commands reuse it rather than duplicate API
  calls or JSON exports.
- Scope mismatch: advice never mixes player prices or team constraints from
  different accounts/seasons/origins.
- Unknown roles: conditional scenarios stay explicitly labelled and unresolved
  totals stay unresolved.
- Interacting transfers: every recommended package is checked together for
  budget, club limits and multipliers.
- Missing cached catalogue: discovery reports a clear next action without
  silently fetching live data.

## Task 1: Encode the existing workflow in documentation and skills

**Files:**

- Create: `docs/fantasy-advice-workflow.md` — canonical command sequence,
  artifact conventions and fallback policy.
- Modify: `README.md` — link the workflow and distinguish raw API commands from
  cached analysis commands.
- Modify: `.agents/skills/fantasy-rugby/SKILL.md` — require the workflow for
  full team advice.
- Modify: `.agents/skills/optimizing-fantasy-lineup/SKILL.md` — require
  `analyze player` and `compare` before recommending replacements/packages.
- Modify: `.agents/skills/analyzing-fantasy-player/SKILL.md` — use the existing
  player analysis command for projections.
- Modify: `.agents/skills/validating-fantasy-lineup/SKILL.md` — final validation
  must come from the production command path.

**Interfaces:** Consume the existing CLI without changing command signatures.
Skill instructions link to one canonical workflow rather than repeating it in
every skill.

- [x] Write the workflow, showing current commands first and identifying
      `data players` as pending until Task 2 ships.
- [x] Document this executable sequence, using the same scope options
      throughout:

  ```sh
  deno task cli data status
  deno task cli sync
  deno task cli analyze lineup --offline
  deno task cli analyze matchups --offline
  deno task cli analyze player 834 1247 612 116 664 755
  deno task cli compare --alternative .data/round-6-proposal.json --offline
  ```

- [x] Explain that `analyze player` performs freshness-aware acquisition itself;
      avoid a redundant `sync <candidate IDs>` followed by identical online
      analysis.
- [x] Define report evidence: command and scope, model version, snapshot
      IDs/timestamps, blocking errors, missing/stale inputs, role dependencies,
      budget/quota effects and compatible alternatives.
- [x] State that raw `player --detailed` is for inspecting detailed evidence
      absent from the readable analysis view, not for recomputing scores.
      Structured analysis output may already contain the necessary statistics.
- [x] Update the specialist skills with the command obligations and the bounded
      fallback policy.
- [x] Review by tracing one real transfer recommendation through the
      instructions. This is a workflow check; do not write tests that merely
      search Markdown for phrases.

## Task 2: Expose cached player discovery

**Files:**

- Create: `src/operations/catalogue.ts` — scope-specific, read-only cached
  player lookup.
- Create: `src/operations/player-filters.ts` — move the existing `PlayerFilters`
  type and `filterPlayers()` here unchanged so operations do not import CLI
  code.
- Modify: `src/cli/joueurs/filters.ts` — compatibility re-export of the moved
  filter function and type; preserve existing imports and behavior.
- Modify: `src/cli/context/analysis.ts` — register `data players` alongside
  `data status` using existing database/scope setup.
- Reuse: `src/cli/joueurs/filters.ts`, `src/cli/joueurs/output.ts`,
  `src/data/store.ts` and `src/operations/data.ts`.
- Test: `tests/catalogue_test.ts`, `tests/analysis_cli_test.ts`,
  `tests/help_test.ts` and relevant color/metadata tests.
- Modify: `README.md` and `docs/fantasy-advice-workflow.md` — document cached
  discovery and live inspection separately.

**Interfaces:**

- Add `readCatalogue(store: Store, filters: PlayerFilters, now?: Date)` in
  `src/operations/catalogue.ts`.
- Return
  `{ round: number; players: Player[]; evidence: { snapshotId: number; endpoint: string; fetchedAt: string; stale: boolean }; warnings: string[] }`.
- Read the latest `/api/joueurs` snapshot and cached target round through
  `Store.read()`. Reuse `filterPlayers()` and `stale()`; do not query raw SQL or
  duplicate their logic.
- If the catalogue is absent, fail with
  `Cached player catalogue unavailable. Run sync online.` If the target round is
  absent, use the catalogue round and warn that target-round freshness is
  unresolved.
- Add `data players` with `--club`, `--position`, `--name`, `--available` and
  the existing scope/presentation flags. Reuse `renderPlayers()` for human
  tables and return the above envelope with `--json`.
- This command never requests network access. `--available` only excludes
  flagged-unavailable players; it does not confirm selection. Inherited
  acquisition options have no effect and help must say so, matching
  `data status`.

- [x] Write failing tests for combined filters, secondary/tertiary positions,
      empty results, stale/round-mismatched catalogue, missing catalogue,
      missing target round and isolation between two profiles in the same
      database.
- [x] Run those tests and confirm failures describe the absent capability.
- [x] Implement `readCatalogue()` and register the command with the existing
      scoped store lifecycle.
- [x] Move the shared filters without changing their contract; run the existing
      filter tests to verify live and cached discovery use the same behavior.
- [x] Record cached catalogue access through the existing metadata hook;
      `--debug` must report reuse and zero HTTP requests.
- [x] Add CLI tests with a client factory that throws if invoked: cached
      discovery must work without credentials or network access.
- [x] Verify human colors, plain text, JSON without ANSI, help, and debug
      metadata; run `deno task check` and `deno task test`.
- [x] Replace the pending discovery step in the workflow with an example such as
      `deno task cli data players --position TL --available`.

## Task 3: Replay the team analysis using the supported commands

**Files:**

- Create: `.data/round-6-proposal.json` and separately named candidate variant
  inputs; each contains all 17 slots, captainSlot and impactSlot.
- Modify: `docs/fantasy-team-advice-round-6-2026-10-09.md` — add a dated
  command-backed reassessment, preserving the original report as historical
  context.
- Update: `docs/fantasy-advice-workflow.md` only if replay reveals a concrete
  missing capability.

**Interfaces:** Use `Lineup` inputs and the current `analyze player`,
`analyze lineup` and `compare` commands. Do not extend `advise()` for this task.

- [x] Check scope and freshness; use the existing commands to acquire only
      missing/stale facts.
- [x] Check the target round before using the round-six examples. If it has
      advanced, analyse the current team in a new dated report with matching
      proposal filenames. Preserve the round-six report and do not mix its
      historical budget or projections with the new round.
- [x] Run current-lineup and matchup analysis, then cached discovery and
      multi-player analysis for current picks and alternatives.
- [x] Create full lineup inputs for the main Rabut/Ludlam/Dupont package and the
      distinct Gray/Ludlam, Serin and Gorgadze options. Do not combine
      incompatible options.
- [x] Run `compare` for every package presented as mutually compatible. Run
      captain/impact variants through `compare` as well.
- [x] Recheck stale teamsheets and locks and repeat affected comparisons after
      any new evidence. Keep all results on the same target round; disclose
      changed snapshots.
- [x] When `expectedDelta` is unresolved, say so. If comparing available
      conditional totals, name the identical role assumption and source fields;
      never replace missing values with zero. Do not reuse the earlier
      scratch-script gain as a verified CLI result.
- [x] Record any correction to the original report, including changed
      recommendations, costs, roles or unsupported gain claims.
- [x] Verify that every recommended transfer has player-analysis evidence and
      every recommended package has a comparison result. Confirm no direct SQL
      scoring, scratch projections or API-response exports were needed.

## Acceptance criteria

The work is complete when a full team-advice session can use supported commands
for acquisition, cached discovery, player scoring, matchup evaluation and
package validation; each recommendation is traceable to model/evidence outputs;
unknown roles and missing totals remain explicit; and the resulting Markdown
report contains no unsupported numerical improvement claims.

The workflow replay is a manual acceptance exercise, not a permanent test
against a changing authenticated account. Automated tests use fixtures and
temporary databases.

## Deferred improvements

Only revisit these after the command-based replay demonstrates the need:

- Additional readable player evidence such as sample counts and observed ranges,
  using existing history rather than a second scorer.
- Named scenario deltas in `compare`, if existing before/after totals prove
  difficult to consume. Mixed-role assumptions need an explicit design first.
- Confidence modelling, calibrated matchup probabilities and automatic transfer
  search. These require their own evaluated design; they do not fix the original
  failure to use existing tools.

## Delivery order

Complete Task 1 first, then the narrow discovery gap in Task 2, then prove the
workflow in Task 3. Review each task independently. Keep unrelated existing
changes out of task commits; do not commit or publish the user's report
automatically.

## Execution notes — 9 October 2026

All three tasks completed on the existing `feat/persistent-analysis` branch. The
four skill instructions passed a read-only scenario check, and the cached
discovery implementation passed review. Catalogue and CLI tests were observed
failing before implementation; the complete suite now contains 109 tests.

The CLI no-auth regression runs without a client factory or permission to read
`FANTASY_TOKEN`; any attempt to create the authenticated client would fail. This
provides the planned guard without introducing a separate throwing factory.

Task 3 required correcting the old advice after new teamsheets marked Marta,
Attissogbe, Rayasi and Baret absent. Every package and captain/impact variant in
the reassessment went through `compare`; the final 10.86 M proposal went through
`analyze lineup`. Overall status remains PROVISIONAL and expectedDelta remains
unresolved. Final evidence uses snapshots #97–102. The original report is
preserved, with a superseding dated reassessment.

A small input-construction helper consumed a CLI result in memory and wrote
complete proposal files under `.data/`. It performs no scoring or SQL queries.
No API-response exports, second scoring path or live team changes were needed.
Proposal inputs are local ignored artifacts; the Markdown report records their
composition and commands. No commits or publishing were performed.
