# Analysis and local data

All commands default to human-readable summaries and tables. Add `--json` to get
structured results for scripts or agents. Analysis tables show projected points,
conditional scenarios, budget, validation and warnings; unavailable projections
are shown as `Unresolved`. Player names appear in lineup tables when stored
player data is available. Snapshot references and timestamps remain visible for
auditing.

```sh
deno task cli analyze lineup --offline
deno task cli analyze player 825 990
deno task cli analyze matchups
deno task cli data status
deno task cli analyze lineup --offline --json
```

The API client remains independently importable. `src/data` stores API facts in
SQLite using `@db/sqlite`; `src/analysis` contains pure scoring and validation
functions; `src/operations` coordinates refresh and analysis. The CLI exposes
these operations as structured evidence for an external AI agent. No LLM or
automatic lineup optimizer is embedded.

Provision the native SQLite library once:

```sh
deno task sqlite:setup
```

On Linux this prefers the installed system SQLite, avoiding glibc
incompatibility with the package's prebuilt release. Other platforms download
the pinned release. The library is stored at `.data/sqlite3`. `@db/sqlite`
requires unrestricted FFI permission for pointer operations; the CLI grants it
while restricting ordinary filesystem access to `.data` and API network access
to the existing host. FFI itself is privileged native code. To use a different
library or filesystem paths, run `src/cli.ts` directly with `DENO_SQLITE_PATH`
and suitable permissions.

```sh
deno task cli top14 standings --json
deno task cli top14 matches --round 6 --json
deno task cli round --json
deno task cli teamsheets --json
deno task cli locks --json
deno task cli ratings --round 6 --json
deno task cli sync 825 990 --json
deno task cli data status --json
deno task cli analyze player 825 990 --json
deno task cli analyze matchups --json
deno task cli analyze lineup --offline --json
deno task cli compare --alternative .data/proposed.json --json
```

`sync` fetches context, the current composition, its fiches and any requested
candidate fiches, with at most five simultaneous requests. Analysis
automatically refreshes missing/stale sources. `--force` refreshes requested
sources; `--offline` uses SQLite without loading credentials. Help also needs no
credentials or native permissions. Existing player/composition commands continue
to fetch raw API data.

The default database is `.data/fanpo.sqlite`, scoped by API origin, season and
local profile and competition. Use `--season 2026-27 --profile my-team`
consistently across operations. The default season is inferred from an August
season boundary; `--season` labels local storage, and does not request a
different season from the upstream API. Use a separate profile for each account.
Online `--origin` must match `FANTASY_API_URL`. Tokens are never stored. Raw
response snapshots retain their fetch timestamp and SHA-256 hash alongside
indexed entities; a source refresh commits snapshot and normalized rows
together. Failed refreshes retain prior data and report warnings while
successful sources still persist.

Freshness limits: locks 60 seconds; composition, prices, teamsheets, ratings and
round 5 minutes; fixtures and standings 6 hours; fiches 24 hours. A target-round
change invalidates round-sensitive cached inputs. `fullyCurrent` describes the
requested source freshness, **not certainty of a projection**. Inspect nested
warnings and `PROVISIONAL` lineup status. Unannounced clubs have unknown player
roles; they are not confirmed absent.

### Lineup files

Lineup files use the API's **1-based** slots. This abbreviated example shows the
schema; it is not a valid complete lineup:

```json
{
  "slots": [
    { "slot": 1, "playerId": 479 },
    { "slot": 2, "playerId": 1133 }
  ],
  "captainSlot": 8,
  "impactSlot": 16
}
```

Supply all 17 slots for a legal normal lineup:

```sh
deno task cli analyze lineup --lineup .data/proposed.json
deno task cli compare --alternative .data/proposed.json
deno task cli compare --lineup .data/before.json --alternative .data/after.json
```

Compare named swap packages directly, without creating lineup files or using
external scripts:

```sh
deno task cli compare --candidate 'Manu:11=883' --candidate 'Manu+Brau:11=883,12=834'
deno task cli analyze lineup --candidate 'Manu:11=883'
```

Each `--candidate` uses `NAME:SLOT=PLAYER_ID[,SLOT=PLAYER_ID]`. Names must be
unique, slots are 1–17, and player IDs must be positive integers. Each package
independently starts from your current roster (or `--lineup FILE`), retaining
captain and impact slots. Use a complete `--alternative FILE` to change these
roles; it cannot be combined with `--candidate`. No live roster is modified.

Candidates share one context refresh and fetch each required player sheet once.
Readable output compares costs, remaining budget, validation and the forecasts
for changed players. Invalid packages remain visible with their errors.
Unresolved team totals and gains remain unresolved. `--json` returns
`result.before` and `result.alternatives`, including each complete proposed
`lineup`, its analysis and changes; `--debug --json` adds the usual metadata.
Validate one package with `analyze lineup --candidate`; use `--offline` on
either command for stored evidence with freshness warnings.

Budget and club constraints come from the selected API composition
(`--composition`, defaults to 1 for Top 14 and your normal league for NC).
Effective salary cap is `equipe.budget`; `cap` is the reference cap. v1 reports
unsupported formats rather than applying normal-lineup rules silently.

### Scoring v1

Every advice response includes the model version/parameters and snapshot
references. Club ratings use earlier completed match margins, opponent strength,
a five-point home advantage, recent-round decay of 0.9 and a five-match neutral
prior. Four iterations estimate opponent-adjusted ratings. Historical round
replay trains only on earlier rounds; at least 20 errors are required for
empirical win/draw/loss and ±20-point domination probabilities. Replay reports
model and constant-home-advantage baseline errors. These probabilities are
exploratory, not a validated betting model. Current standings explain context
and do not enter historical forecasts.

Player projections use up to five consolidated appearances in the relevant real
role, weighted `0.8^age`. The baseline averages ratings when the player
qualified for scoring; a separate probability estimates reaching ten minutes,
counting short appearances. The conditional rating is
`clamp(baseline × (1 + 0.10 × domination), 0, 100)`, where domination is the
probability of winning by at least 20 minus losing by at least 20. Missing
matchup evidence uses factor 1 with a warning. Missing scored role history
leaves the projection unresolved. Detailed stats explain ratings without extra
score bonuses.

Unknown future roles produce conditional starter/substitute scenarios. The
lineup applies captain ×2, one designated impact ×2, and half rating for real
starters on the Fantasy bench. Confirmed absences score zero; official
designated withdrawals receive 30 before multipliers, without the bench half
penalty. Historical API points stay untouched. Compare reports a point delta
only when both expected totals resolve; conditional totals are not guaranteed
improvements.

Run checks after native setup:

```sh
deno task check
deno task test
```

## International limitations

Add `--nationchampionship` consistently to acquisition, catalogue reads,
comparisons and validation. Snapshots and normalized facts are isolated from Top
14, including offline reads. Budgets and nation limits come from the selected
international composition. The season option is a local storage label, not a
competition switch.

The same model is available for NC, with a warning that it has not been
validated for international rugby. A resolved projection can be based on a
single appearance. Review the role-specific sample and minutes; a numerical
result is not evidence of predictive accuracy. Missing matchup probabilities
leave the adjustment neutral rather than inventing probabilities.

Use [the agent workflow](fantasy-advice-workflow.md) to interpret these outputs.
