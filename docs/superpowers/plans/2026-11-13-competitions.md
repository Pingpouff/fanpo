# Competition context implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task.

**Goal:** Add --nationchampionship across Fanpo while keeping Top 14 the default.
**Architecture:** Named competition context shared by HTTP, client, CLI and SQLite.
NC's upstream ID is discovered from /api/jeux, never hardcoded. Default storage
keys remain compatible with existing data.
**Tech Stack:** Deno, TypeScript, Cliffy, SQLite; no new dependencies.
**Spec:** docs/superpowers/specs/2026-11-13-competitions-design.md

## Global constraints

- Exact user-facing flag: --nationchampionship. No numeric CLI IDs or environment override.
- Preserve workspace edits and existing public methods. No automatic commits.
- Read-only production checks; no team changes.
- Work inline in existing feature branch; baseline: 110 tests pass.

## Review focus

- Concurrent requests must share discovery; inaccessible NC must fail, not fall back.
- An injected test client must inherit CLI selection without losing its fetch.
- Offline CLI must not access token or discover games.
- Explicit/default Top 14 must read the original cache; property order cannot change scope.
- All commands, including nested ones and metadata, must use the same competition.

### Task 1: API context

Files: src/api/competition.ts, src/api/jeux/{types,request}.ts,
src/api/context/request.ts, src/api/{client,http}.ts, src/types.ts,
tests/competition_test.ts.
Interfaces: Competition = 'top14' | 'nationchampionship'; getGames();
FantasyClient.competition and forCompetition(competition).

- [x] Add failing tests for default header, NC discovery across endpoint families,
  concurrent discovery, retry, discovery errors and context-preserving clones.
- [x] Run targeted tests and observe failure.
- [x] Centralize competition context in transport, add feature request modules,
  preserve methods and request observability.
- [x] Run API and metadata tests.

### Task 2: CLI and storage

Files: src/cli.ts, src/cli/shared/{command,help}.ts,
src/cli/context/{command,analysis,output}.ts, src/data/store.ts,
src/operations/advice.ts, tests/competition_cli_test.ts, tests/storage_test.ts.
Consumes Competition and client context from task 1.

- [x] Add failing tests for exact global flag, games/competition commands,
  nested commands, NC offline status/catalogue, and same-ID data isolation.
- [x] Observe failures, then implement shared CLI selection and canonical cache scope.
- [x] Add competition identity to analysis and status, warn that NC predictions
  are exploratory. Existing raw API envelopes remain unchanged.
- [x] Run CLI, storage and operation tests.

### Task 3: Documentation and verification

Files: README.md, docs/fantasy-advice-workflow.md.

- [x] Document named API context, games discovery, exact CLI flag, cache separation,
  offline usage and compatibility aliases.
- [x] Run deno task check, deno task test and git diff --check.
- [x] Review modifications and verify live games and both competitions' teamsheets.
- [x] Record outcomes and deliver usage examples.

## Execution record

- Implemented inline in the existing feature branch; unrelated working changes preserved.
- API context and CLI/storage tests were observed failing before implementation.
- Live API finding: composition IDs select leagues independently of X-PB-Jeu.
  Added scoped league discovery/selection and catalogue checks for NC player IDs.
- Independent code review found order-dependent legacy cache compatibility.
  Added a true legacy-key regression, observed RED, then migrated equivalent
  Top 14 scopes transactionally; a second RED→GREEN test covers deleted entities.
- Explicit league refresh now updates membership checks on reused clients;
  verified RED→GREEN. International model warnings do not imply stale data.
- Final verification: deno task check PASS; deno task test 123 passed, 0 failed;
  git diff --check PASS.
- Live read-only checks: default Top 14 J10; NC J5, 10 announced nations,
  230 players; default NC composition resolves the account’s international league, budget 11 M,
  nation limit 4. No live team writes.
- Reverted only 18 incorrect NC observations created during the initial smoke
  test before the league guard. Original Top 14 observations and correct NC
  snapshots retained; final NC scope has 23 sources and only the correct international composition.
- No automatic commit or branch integration.
