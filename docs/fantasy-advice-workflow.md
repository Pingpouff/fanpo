# Fantasy advice workflow

Use the existing CLI for acquisition, player scoring and lineup comparisons.
SQLite owns persisted facts; the operations and analysis modules own scores and
validation. The agent interprets those results and explains tradeoffs.

## Scope and acquisition

Read the relevant Fantasy skills and `regles_fantasy_rugby.md`. Keep `--db`,
`--season`, `--profile`, `--origin` and `--composition` consistent throughout
the session. Inspect the target round before reusing old reports or proposals.
Top 14 is the default. For Nations Championship, add `--nationchampionship`
consistently to every command, including offline reads. Each competition has its
own cache; the international default composition is discovered from your normal
leagues. An explicit `--composition` must belong to that competition. Use
`games` to inspect available competitions, and `competition matches` or
`competition standings` for neutral command names. International forecasts
remain exploratory and must retain their validation warning.

```sh
deno task cli data status
deno task cli sync
deno task cli analyze lineup --offline
deno task cli analyze matchups --offline
```

`sync` reuses fresh inputs and refreshes missing/stale sources. Do not use
`--force` by default. Unknown teamsheet roles remain unknown; stale evidence is
disclosed, not silently accepted as current. Audit the existing squad before
optimising it.

## Candidate discovery and player analysis

Compare packages directly with the Deno CLI, without Python wrappers or
generated lineup files:

```sh
deno task cli compare --candidate 'Manu:11=883' --candidate 'Manu+Brau:11=883,12=834'
deno task cli analyze lineup --candidate 'Manu:11=883'
```

Each package starts independently from the current composition (or `--lineup`
file), retaining captain and impact slots. Shared facts and player sheets are
acquired once. Use `--json` for full structured results and proposed lineups;
use `--debug` for access metadata. Default output is readable. Unknown roles
keep full-team expected gains unresolved. Final validation accepts one
candidate.

Find alternatives in the stored catalogue:

```sh
deno task cli data players --position TL --available
deno task cli data players --name Rabut
deno task cli analyze player 834 1247 612 116 664 755
```

Discovery filters include secondary/tertiary positions. `--available` excludes
flagged-unavailable players; it does not confirm selection. Discovery is always
local and reports catalogue freshness. If it reports a missing catalogue, run
`sync` online. Check prices and club quotas while shortlisting; an attractive
average alone is insufficient.

`analyze player` refreshes its own missing/stale inputs. Do not routinely run a
separate `sync <candidate IDs>` immediately before the same online analysis. Use
`--offline` when the needed evidence is already fresh, or disclose stale inputs
if working without network access. Compare current players and their
alternatives in the same invocation.

Use its starter/substitute scenarios, matchup factor, history and warnings for
scores. Inspect `--json` in memory when evidence is absent from the readable
view. Raw `player --detailed` is a fallback for additional detailed statistics,
not a replacement scorer. Those statistics explain existing ratings; do not add
bonuses again.

## Complete proposals and comparisons

Create a complete `Lineup` input under `.data/` for each serious proposal:

```text
slots: all 17 entries, each with slot and playerId
captainSlot: one of slots 1–15
impactSlot: one of slots 16–17
```

Then compare through the production operation:

```sh
deno task cli compare --alternative .data/round-6-proposal.json --offline
deno task cli analyze lineup --lineup .data/round-6-proposal.json --offline
```

The filename is an example; use the actual target round. Keep incompatible
packages separate. Compare captain and impact variants as complete lineups,
including real-starter bench penalties. Use the API's effective budget
(`equipe.budget`) and club limit, not assumptions from a previous report.

Run `compare` for every package recommended as mutually compatible. If
`expectedDelta` is unresolved, report it as unresolved. Available conditional
totals may be subtracted only under the same explicitly named role assumption;
cite both source fields. Never replace a missing value with zero, or present a
conditional gain as an expected or guaranteed improvement.

Discard earlier scratch-script gain claims until reproduced by the supported
`compare` command under the same stated assumptions.

## Final validation and report

Refresh stale teamsheets and locks before finalising. Rerun affected player
analyses and comparisons when selection, price, club, role or lock evidence
changes. Ensure all results concern the same target round and disclose changes
to snapshot references.

The Markdown report must include:

- Scope, target round, analysis time and model version.
- Current-squad audit, blocking errors, unresolved roles and freshness warnings.
- Player evidence for each transfer: role history, sample limitations, matchup,
  price, upside and downside.
- A `compare` result for each complete recommended package: cost, remaining
  budget, club-quota effects, captain/impact choices and required companion
  moves.
- Expected versus conditional projections clearly distinguished.
- Final invariant checks, remaining selection risks and snapshot IDs/timestamps.
- Commands used, so a subsequent session can reproduce the process.

Overall status remains `PROVISIONAL` when required evidence is unresolved, even
if roster structure, positions and budget pass. Do not change the live team
while producing advice.

## Storage and capability gaps

Human output is the default; `--no-color` produces plain text. `--json` is
allowed for structured consumption in memory. Do not save API-response exports
as a parallel data cache. SQLite stores the facts, proposal JSON files supply
CLI inputs, and Markdown files preserve reports.

Do not use direct SQL or scratch scripts to reproduce scoring, matchup
forecasts, validation or package comparisons. If a required capability is
missing, name the exact missing input/output and document any bounded fallback.
Propose the smallest extension to the existing workflow; do not introduce a
second scoring path or claim an existing operation needs to be rebuilt.
