# Fantasy Rugby connector

A Deno/TypeScript client and CLI for <https://fantasy.poneeey.fr>. Inspect live
teams and players, cache data locally, and compare explainable Fantasy Rugby
projections. Commands show readable tables by default; add `--json` for scripts.
No build step.

## Setup

Use Deno 2.9 or later.

Install dependencies once:

```bash
deno install
```

Set your Bearer token in the environment. In Bash, you can enter it without
echoing it or recording it in shell history:

```bash
read -r -s -p 'Fantasy token: ' FANTASY_TOKEN
echo
export FANTASY_TOKEN
```

`FANTASY_TOKEN` is required; missing or blank tokens fail clearly. Never put a
real token in source or commit it. `.env` and `.env.*` are ignored as a
precaution. `deno task cli` automatically loads `.env` from the project root.
Variables already exported in your terminal take precedence over `.env` values.

You can keep your configuration in `.env`:

```dotenv
FANTASY_TOKEN=your_token_here
FANTASY_API_URL=https://fantasy.poneeey.fr
```

Paste the token without the `Bearer` prefix. The URL is optional.

`FANTASY_API_URL` is optional and defaults to `https://fantasy.poneeey.fr`. Use
an absolute HTTP(S) base URL without embedded credentials. Endpoint paths
resolve from the origin: `getPlayers()` always requests `/api/joueurs`.

## Quick start

After configuring your token above:

```sh
deno task cli composition             # Current team and effective salary cap
deno task cli round                   # Target round and deadline
deno task sqlite:setup                # Once, before cached commands
deno task cli sync                    # Cache current squad and match context
deno task cli analyze lineup          # Budget, legality and projected points
deno task cli analyze lineup --offline # Reuse cache without network access
```

Find your **current salary cap** in `composition` as **Budget (effective salary
cap)**. `Cap` is the initial/reference cap and can differ. For just the numeric
value in millions (requires `jq`):

```sh
deno task cli composition --json | jq -r '.equipe.budget'
```

### Command reference

Top-level `--help` groups commands into **API** (live requests), **Data** (local
cache) and **Analysis** (projections). These are help sections; command syntax
stays the same, e.g. `composition`, `data status` and `analyze lineup`.

Prefix every command below with `deno task cli`. `<value>` is required;
`[value]` is optional; `...` accepts several values. IDs and round numbers must
be positive safe integers. Add `--help` at any level for local options and
copyable examples, e.g. `deno task cli analyze lineup --help`.

| Command                      | What it answers                                     | Main options                                    |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| `players`                    | Find player IDs, prices and positions               | `--name`, `--club`, `--position`, `--available` |
| `player <id> [ids...]`       | Inspect identity and performance history            | `--detailed` (alias `--stats`)                  |
| `composition [id]`           | Current team and salary cap; resource defaults to 1 | `--round N` for official history; `--detailed`  |
| `round`                      | Target Fantasy round, deadline and scoring status   | —                                               |
| `teamsheets`                 | Announced clubs and real starter/substitute roles   | —                                               |
| `locks`                      | Server locks and club kickoff times                 | —                                               |
| `ratings --round N`          | Official ratings, minutes and withdrawal credits    | `--round` is required                           |
| `top14 standings`            | Current league ranking and points                   | —                                               |
| `top14 matches`              | Season fixtures and results, home team first        | `--round N` filters one round                   |
| `sync [ids...]`              | Cache squad/context plus optional candidate fiches  | `--force`, `--composition`                      |
| `data status`                | Stored sources, timestamps and Fresh/Stale state    | Scope options below; never fetches              |
| `analyze player <ids...>`    | Compare player projections with matchup influence   | `--offline`, `--force`                          |
| `analyze matchups`           | Target-round margins and win/domination chances     | `--offline`, `--force`                          |
| `analyze lineup`             | Team legality, budget and projected points          | `--lineup FILE`, `--composition`                |
| `compare --alternative FILE` | Proposed vs current team, or two saved teams        | `--lineup FILE` supplies the before team        |

All leaf commands support `--json`; all commands support `-h` / `--help`. Live
inspection commands (`players`, `player`, `composition`, `round`, `teamsheets`,
`locks`, `ratings`, `top14 ...`) request the API each time and require
`FANTASY_TOKEN`. They do not populate the analysis cache.

### Cached command options

These options apply to `sync`, `data status`, `analyze ...` and `compare`:

| Option             | Meaning / default                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `--db PATH`        | SQLite file; `.data/fanpo.sqlite`. Default task permissions cover `.data/`.                                   |
| `--season LABEL`   | Local scope, e.g. `2026-27`; inferred from an August season boundary. Does not select an upstream API season. |
| `--profile LABEL`  | Local account label; `default`. Use the same label across commands and a separate one per account.            |
| `--origin URL`     | Scope by API origin; defaults to `FANTASY_API_URL` or the production host. Must match configuration online.   |
| `--offline`        | Use stored facts without requests or a token; missing/stale data is reported.                                 |
| `--force`          | Refresh every requested source rather than reusing fresh data. Offline mode still makes no requests.          |
| `--composition ID` | Team resource for `sync`, `analyze lineup` and `compare`; `1`. Unused for player/matchup analysis.            |
| `--json`           | Structured results with complete evidence and warnings.                                                       |

`data status` is always local: `--offline`, `--force` and `--composition` have
no effect there. `sync` refreshes missing/stale sources by default, not
necessarily every source; use `--force` for a full requested refresh. Run
`deno task
sqlite:setup` before any cached command. Custom paths outside
`.data/` require a direct `deno run` invocation with suitable permissions; see
native setup below.

### Read the results

- **Money:** prices/caps shown in M (millions); JSON analysis monetary totals
  are whole units, e.g. `11150000` means `11.15 M`. Raw API prices/caps stay
  decimal strings in millions.
- **Roles:** a Fantasy slot does not establish the player's real rugby role. An
  unannounced club means unknown, not absent. Shirt numbers 1–15 are starters;
  16–23 are substitutes.
- **Validation:** `INVALID` reports known violations; `PROVISIONAL` reports
  unresolved data/roles; `VALID` means the checks passed with available
  evidence.
- **Projections:** `Unresolved` means insufficient evidence, not zero.
  Conditional starter/substitute totals are scenarios, not guaranteed outcomes.
  Matchup probabilities refer to the home team; a positive margin favors the
  home team.
- **Freshness:** “Requested data is current” concerns source freshness, not the
  certainty of player selection or a forecast. Read warnings and timestamps.
- **Comparison:** point changes remain unresolved if either expected total is
  unresolved. Positive cost change means the proposed team is more expensive.

For proposed teams, save a complete 17-slot file under `.data/`. See
[Lineup files](#lineup-files) for the schema and examples. In the normal format,
slots 1–15 form the XV, 16–17 are the bench, captain is one XV slot and exactly
one bench slot is designated impact. Fantasy bench real starters receive half
rating; only the designated impact gets ×2.

## CLI examples

```bash
deno task cli --help
deno task cli players --help
deno task cli player --help
deno task cli composition --help
deno task cli players
deno task cli players --json
deno task cli players --json | jq '.joueurs[]'
deno task cli players --club UBB
deno task cli players --position PIL
deno task cli players --name Bamba
deno task cli players --available
deno task cli players --club UBB --position PIL --available --json
deno task cli player 825
deno task cli player 825 --json
deno task cli player 825 --detailed
deno task cli player 825 --detailed --json | jq '.perfs[].stats.tackles'
deno task cli player 479 1133 1160
deno task cli player 479 1133 1160 --detailed --json
deno task cli composition
deno task cli composition --json
deno task cli composition --detailed
deno task cli composition --round 4
deno task cli composition --round 4 --detailed
deno task cli composition --round 4 --json | jq '.compo.slots'
deno task cli composition --round 4 --json | jq '.compo.points'
```

Club codes match exactly, ignoring case. Position codes match the primary,
secondary or tertiary position, ignoring case. Names match a substring of
`prenom nom`, ignoring case. `--available` excludes players whose `indisponible`
field is true. Combined filters use AND and run locally on the fetched response.
String options take a separate argument, for example `--name 'Demba Bamba'`. The
`--name='Demba Bamba'` form also works. Cliffy generates help from the command
definitions and rejects unknown options, missing values and extra arguments.

Normal output is a table. JSON output retains the complete API envelope,
including `journee` and extra fields, with a filtered `joueurs` array. There is
no extra text on stdout; errors go to stderr and exit with status 1. Deno task
diagnostics also go to stderr, so stdout remains suitable for `jq`.

`player <id>` retrieves `/api/joueurs/<id>/fiche`. IDs must be positive safe
integers. Human output shows identity, club, positions, current value, a compact
performance table and aggregate scores. Unknown performance values display as
`-`. The default is a quick view: quick JSON omits the top-level `stats` object
and each performance's `stats`, retaining all other fields.

Use `--detailed` (alias `--stats`) for the detailed view. Detailed terminal
output adds aggregate and per-round stat fields; `--detailed --json` preserves
the complete API response, including all detailed match stats and extra fields.
The client always returns the complete sheet; these views affect only CLI
output. The list filters apply only to `players`.

`player <id> [ids...]` also accepts multiple player IDs. Each ID uses the
existing `/api/joueurs/<id>/fiche` endpoint, with at most five concurrent
requests. Results retain input order, including repeated IDs. Terminal output
shows consecutive player sheets; JSON output is an array when multiple IDs are
supplied and remains a single object for one ID. `--detailed` and `--stats`
apply to every sheet; quick JSON omits aggregate and per-round stats from every
sheet.

All IDs are validated before any requests start. If a fiche request fails, the
command exits with an error identifying its endpoint and produces no partial
output. Already-running requests finish before the error is reported; further
requests stop being scheduled after a failure is detected.

The CLI task includes `.env` loading and the required permissions, so no extra
flags are needed:

```bash
deno task cli player 825 --detailed --json
```

The default task grants the configuration variables, API network access to
`fantasy.poneeey.fr:443`, `.data/` filesystem access and the native FFI required
by SQLite. Inspection commands load no native library. To use a different API
origin, grant its host and port explicitly:

```bash
export FANTASY_API_URL=http://localhost:8000
deno run --no-prompt --allow-env=FANTASY_TOKEN,FANTASY_API_URL \
  --allow-net=localhost:8000 src/cli.ts players --json
```

### Compositions

`composition` defaults to resource ID `1`. Without `--round`, it retrieves the
current composition from `/api/compos/1`. With `--round 4`, it retrieves
`/api/compos/1/journee/4`. An explicit ID is also supported, for example
`composition 2` or `composition 2 --round 4`. IDs and round numbers must be
positive safe integers. The resource ID is passed through without assigning it a
team, manager or other meaning.

Current compositions use the same compact table as historical rounds, with
round, deadline, status, player names, clubs, paid prices and captain/impact
markers. The summary also shows team, budget and cap. The current endpoint does
not return match minutes, scores or resulting points; these columns and the
total display `-`.

`--detailed` keeps the readable table and adds positions for current
compositions or value changes for historical ones. `--json` displays the
complete raw response, including selection and lock metadata.

Historical human output shows the round, deadline, status, API total and each
selected player's club, paid price, minutes, rating and resulting points. `[C]`
marks the captain; `[C-auto]` marks an automatic captain; `[I]` marks the impact
player. `SUB` means `titulaire === false` in the actual rugby match, and
`FORFAIT` means the API returned `forfait: true`. Null performance values
display as `-`.

JSON output preserves the complete response and every slot, including
`delta_valeur`, `titulaire`, `minutes`, `forfait`, and additional API fields.
For example, select the captain using the returned slot number:

```bash
deno task cli composition --round 4 --json \
  | jq '.compo as $c | $c.slots[] | select(.slot == $c.capitaine_slot)'
```

Historical results have a dedicated response type. They contain actual round
outcomes; current compositions describe selection, budget, lock and kickoff
metadata. These schemas are not interchangeable. The API client preserves
historical points without recomputing multipliers or withdrawal scoring. The
analysis layer separately projects future points.

## Client

The client takes configuration explicitly; it does not read environment
variables or import CLI code:

```ts
import { FantasyClient } from "./src/client.ts";
import { loadConfig } from "./src/config.ts";

const client = new FantasyClient(loadConfig());
const response = await client.getPlayers();
console.log(response.joueurs.length);

const sheet = await client.getPlayerSheet(825);
console.log(sheet.perfs[0]?.stats.tackles);

const sheets = await client.getPlayerSheets([479, 1133, 1160]);
console.log(sheets.map((sheet) => sheet.joueur));

const composition = await client.getCompositionForRound(1, 4);
console.log(composition.compo.points);

const currentComposition = await client.getComposition(1);
console.log(currentComposition);
```

Public connector API:

- `new FantasyClient({ baseUrl, token, fetch? })`: `fetch` defaults to native
  fetch and may be supplied for offline tests.
- `client.getPlayers(): Promise<PlayersResponse>`: authenticated
  `GET /api/joueurs` with `Accept: application/json`.
- `client.getPlayerSheet(playerId): Promise<PlayerSheetResponse>`: authenticated
  `GET /api/joueurs/<id>/fiche` using the same HTTP handling. Invalid IDs throw
  before requesting the API.
- `client.getPlayerSheets(playerIds): Promise<PlayerSheetResponse[]>`: retrieves
  full fiches with at most five concurrent requests, preserving input order and
  duplicates. Validates the complete ID array before fetching; an empty array
  returns an empty array without requests. A failed request rejects with the
  existing endpoint-specific error after in-flight requests settle.
- `client.getCompositionForRound(id, round): Promise<HistoricalCompositionResponse>`:
  authenticated `GET /api/compos/<id>/journee/<round>` using the shared HTTP
  handler. Invalid IDs or round numbers throw before requesting the API.
- `client.getComposition(id): Promise<CompositionResponse>`: authenticated
  `GET /api/compos/<id>` using the shared HTTP handler. `CompositionResponse`,
  `CurrentComposition` and `CurrentCompositionSlot` model observed current
  selection fields while preserving additional fields.
- `client.getStandings()`: `GET /api/top14/classement` (current league table).
- `client.getMatches(round?)`: `GET /api/top14/matchs`; optional local round
  filter.
- `client.getRound()`: `GET /api/journees/cible` (target Fantasy round).
- `client.getTeamsheets()`: `GET /api/feuilles` (announced clubs and shirt
  numbers).
- `client.getLocks()`: `GET /api/compos/etat-verrou` (server lock state).
- `client.getRoundNotes(round)`: `GET /api/notes-journee?journee=N`; official
  ratings and designated withdrawal IDs. Requires a positive safe round number.
- `FantasyHttpError`: non-2xx failures include the numeric `status` and
  endpoint. Response bodies are omitted from error messages.
- `loadConfig()`: reads `FANTASY_TOKEN` and `FANTASY_API_URL`; returns
  `{ baseUrl, token }`.
- `Player`, `Matchday`, `PlayersResponse`: TypeScript interfaces in
  `src/types.ts`.
- `PlayerSheetResponse`, `PlayerSheetPlayer`, `PlayerPerformance`,
  `PlayerSelection`, `PlayerAggregateStats`: sheet interfaces in `src/types.ts`.
  `PlayerMatchStats` is `Record<string, number>` so stat keys can evolve without
  enumerating them in the connector.
- `HistoricalCompositionResponse`, `HistoricalComposition`,
  `HistoricalCompositionSlot`: interfaces for round outcomes. Total points and
  paid prices retain their API string representation; per-slot points and
  ratings retain their numeric representation, with null allowed for incomplete
  data.
- `filterPlayers(players, filters?)`: optional, nonmutating local filters.

Network and malformed JSON failures have contextual errors. Redirects are
rejected to keep authenticated requests on the configured endpoint. The API
client performs no retries or caching; cached CLI operations handle persistence
separately.

## Development

```bash
deno task fmt
deno task check
deno task test
```

`check` runs formatting verification, linting and type checking for source and
tests. Run `deno task sqlite:setup` first. Tests use native SQLite and scoped
local filesystem/environment permissions, without production API access. Fake
fetch responses exercise the client and CLI; fixtures are synthetic. Help also
has permission-free tests.

### Source layout

Code is grouped by API feature:

```text
src/
  api/
    client.ts                 # Public FantasyClient facade
    http.ts                   # Shared authenticated HTTP transport
    context/                  # Standings, fixtures, teamsheets, locks and ratings types
    shared/                   # Shared round model and ID validation
    joueurs/
      request.ts              # /api/joueurs
      types.ts
      fiche/                  # /api/joueurs/:id/fiche
        request.ts
        types.ts
    composition/              # /api/compos/:id
      request.ts
      types.ts
      journee/                # /api/compos/:id/journee/:round
        request.ts
        types.ts
  data/                       # SQLite snapshots, normalized facts and native setup
  analysis/                   # Pure projections and lineup validation
  operations/                 # Freshness, source acquisition and advice coordination
  cli/
    context/                  # Context/analysis commands and readable views
    shared/                   # Cliffy setup and terminal table formatting
    joueurs/
      command.ts
      filters.ts
      output.ts
      fiche/
        command.ts
        output.ts
    composition/
      command.ts
      output.ts
      journee/
        output.ts
  cli.ts                      # CLI assembly and terminal I/O
  config.ts                   # Environment configuration
  client.ts                   # Compatibility re-export
  types.ts                    # Public model re-exports
  filters.ts                  # Compatibility re-export
```

Both API and CLI folders are grouped by feature. API modules own requests and
models and return the parsed API response without filtering or formatting. CLI
modules own command parsing, local filtering and output rendering. The
composition folder uses the feature name; its HTTP routes remain `/api/compos`.
The public client stays independent of Cliffy and terminal output. Existing
imports from `src/client.ts`, `src/types.ts` and `src/filters.ts` remain
supported. `runCli()` returns output without printing or exiting.

Models preserve additional API fields and trust known fields without runtime
validation. Current composition field names follow an inspected response sample;
fixtures contain synthetic data. Player sheet and historical composition models
follow the supplied examples.

For sheets, measurements and secondary/tertiary positions can be null.
Performance scores, minutes, starter status, played position, opponent, result,
home/away status and `pm` are typed as nullable to accommodate unplayed or
unknown performance values. Aggregate average/best/worst scores may be null when
no matches have been played. These nullability choices are assumptions; fixtures
follow the supplied example rather than a captured live sheet. Selection and
aggregate objects are assumed to be present, and detailed match stat values are
assumed to be numeric.

Historical composition types follow the supplied example, including null captain
and impact slots and nullable performance fields. Known fields are assumed to be
present, with null used for missing performance data. The client preserves the
API's slot order and does not enforce a fixed slot count. Tests use a synthetic
17-slot fixture and do not contact production.

## Persisted analysis and agent integration

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
local profile. Use `--season 2026-27 --profile beto` consistently across
operations. The default season is inferred from an August season boundary;
`--season` labels local storage, and does not request a different season from
the upstream API. Use a separate profile for each account. Online `--origin`
must match `FANTASY_API_URL`. Tokens are never stored. Raw response snapshots
retain their fetch timestamp and SHA-256 hash alongside indexed entities; a
source refresh commits snapshot and normalized rows together. Failed refreshes
retain prior data and report warnings while successful sources still persist.

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

Budget and club constraints come from the selected API composition
(`--composition`, defaults to 1). Effective salary cap is `equipe.budget`; `cap`
is the reference cap. v1 reports unsupported formats rather than applying
normal-lineup rules silently.

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
