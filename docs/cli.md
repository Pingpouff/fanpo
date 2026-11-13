# CLI reference

The [standalone executable](releases.md) uses `fanpo` in place of
`deno task cli`. `fanpo --version` reports its version.
`fanpo skills export --output NEW_DIRECTORY` exports a complete offline agent
kit; add `--json` for version and destination metadata. The parent directory
must exist; an existing destination is never overwritten.

[Start here](../README.md#quick-start-from-source) · [Agent guide](agents.md) ·
[Configuration](getting-started.md)

## Commands

Top-level `--help` groups commands into **API** (live requests), **Data** (local
cache) and **Analysis** (projections). These are help sections; command syntax
stays the same, e.g. `composition`, `data status` and `analyze lineup`.

Prefix every command below with `deno task cli`. `<value>` is required;
`[value]` is optional; `...` accepts several values. IDs and round numbers must
be positive safe integers. Add `--help` at any level for local options and
copyable examples, e.g. `deno task cli analyze lineup --help`.

| Command                            | What it answers                                        | Main options                                            |
| ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `players`                          | Find player IDs, prices and positions                  | `--name`, `--club`, `--position`, `--available`         |
| `player <id> [ids...]`             | Inspect identity and performance history               | `--detailed` (alias `--stats`)                          |
| `composition [id]`                 | Current team and salary cap; competition-aware default | `--round N` for official history; `--detailed`          |
| `games`                            | Discover available competitions                        | —                                                       |
| `competition standings`            | Standings for the selected competition                 | —                                                       |
| `competition matches`              | Fixtures and results for the selected competition      | `--round N`                                             |
| `round`                            | Target Fantasy round, deadline and scoring status      | —                                                       |
| `teamsheets`                       | Announced clubs and real starter/substitute roles      | —                                                       |
| `locks`                            | Server locks and club kickoff times                    | —                                                       |
| `ratings --round N`                | Player names, positions, clubs and official ratings    | `--round` is required                                   |
| `top14 standings`                  | Current league ranking and points                      | —                                                       |
| `top14 matches`                    | Season fixtures and results, home team first           | `--round N` filters one round                           |
| `sync [ids...]`                    | Cache squad/context plus optional candidate fiches     | `--force`, `--composition`                              |
| `data status`                      | Stored sources, timestamps and Fresh/Stale state       | Scope options below; never fetches                      |
| `data players`                     | Filter cached players with snapshot/freshness info     | `--club`, `--position`, `--name`, `--available`         |
| `analyze player <ids...>`          | Compare player projections with matchup influence      | `--offline`, `--force`                                  |
| `analyze matchups`                 | Target-round margins and win/domination chances        | `--offline`, `--force`                                  |
| `analyze lineup`                   | Team legality, budget and projected points             | `--lineup FILE`, `--composition`                        |
| `compare --alternative FILE`       | Proposed vs current team, or two saved teams           | `--lineup FILE` supplies the before team                |
| `compare --candidate NAME:SLOT=ID` | Compare independent named swap packages                | Repeat `--candidate`; captain/impact slots are retained |

All leaf commands support `--json`; all commands support `--nationchampionship`,
`--no-color`, `--debug` and `-h` / `--help`. Live inspection commands
(`players`, `player`, `composition`, `round`, `teamsheets`, `locks`, `ratings`,
`games`, `competition ...`, `top14 ...`) request the API each time and require
`FANTASY_TOKEN`. They do not populate the analysis cache.

Position codes used by player filters and lineup checks:

| Code  | Position     | Code  | Position   |
| ----- | ------------ | ----- | ---------- |
| `PIL` | Prop         | `TAL` | Hooker     |
| `DL`  | Lock         | `TL`  | Back row   |
| `N8`  | Number eight | `DM`  | Scrum-half |
| `OUV` | Fly-half     | `CEN` | Centre     |
| `AIL` | Wing         | `ARR` | Fullback   |

Filters include secondary and tertiary positions. `--available` means not
flagged unavailable; confirm the player's role with the teamsheets.

`ratings --round N` joins official ratings with the current player catalogue in
readable output, including players with withdrawal credits. Names, positions and
clubs reflect the current catalogue even for an earlier round. Players absent
from the catalogue retain their ID and rating with `Unknown` details. This adds
one catalogue request when results are nonempty; `--debug` reports both
requests. `--json` preserves the raw ratings response without the catalogue
request.

### Output colors

Readable output uses ANSI colors by default, including when redirected. Use
`--no-color` for plain text. JSON output never contains color codes.

```bash
deno task cli player 825
deno task cli player 825 --no-color
deno task cli --no-color --help
```

Player ratings and averages use the same color map as the
[Fantasy team display](https://fantasy.poneeey.fr/equipe):

| Rating         | Color  | Hex       |
| -------------- | ------ | --------- |
| Below 50       | Red    | `#D9432F` |
| 50 to below 70 | Orange | `#E08A2E` |
| 70 to below 80 | Blue   | `#2E7CD9` |
| 80 to below 90 | Green  | `#2F9E58` |
| 90 and above   | Purple | `#8B4FD9` |
| Missing        | Grey   | `#5a5f58` |

Historical fantasy points use the underlying player rating's color before
captain or impact multipliers. The same rating bands apply to detailed aggregate
ratings, analysis baselines and historical player ratings. Team totals, match
scores, probabilities and costs do not use the player rating bands.

Across API, data and analysis commands, headings and table headers are bold
cyan. Green indicates valid selections, starters, fresh data and successful
requests; orange indicates provisional data, substitutes and cautions; red
indicates invalid selections, locked clubs, withdrawals and errors. Missing data
and empty results are grey. Captain and impact markers are cyan. Positive
performance or budget changes are green and negative changes red; cost decreases
are green. Match scores highlight the winner in green and loser in red. Debug
output colors HTTP outcomes, cache freshness and storage status with the same
conventions.

### Cached command options

These options apply to `sync`, `data status`, `data players`, `analyze ...` and
`compare`:

| Option             | Meaning / default                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--db PATH`        | SQLite file; per-user data directory for the executable, `.data/fanpo.sqlite` for source runs.                                                         |
| `--season LABEL`   | Local scope, e.g. `2026-27`; inferred from an August season boundary. Does not select an upstream API season.                                          |
| `--profile LABEL`  | Local account label; `default`. Use the same label across commands and a separate one per account.                                                     |
| `--origin URL`     | Scope by API origin; defaults to `FANTASY_API_URL` or the production host. Must match configuration online.                                            |
| `--offline`        | Use stored facts without requests or a token; missing/stale data is reported.                                                                          |
| `--force`          | Refresh every requested source rather than reusing fresh data. Offline mode still makes no requests.                                                   |
| `--composition ID` | Team resource for `sync`, `analyze lineup` and `compare`; Top 14 defaults to `1`, NC discovers your normal league. Unused for player/matchup analysis. |
| `--json`           | Structured results with complete evidence and warnings.                                                                                                |

`data status` and `data players` are always local: `--offline`, `--force` and
`--composition` have no effect there. `data players` uses the selected SQLite
scope and never requests credentials or the API. It combines filters with AND,
including secondary/tertiary positions. `--available` excludes flagged
unavailable players; it does not confirm selection. Missing catalogue data asks
you to run `sync`; stale or unknown target-round evidence is reported with
warnings. Its `--json` result contains `round`, `players`, `evidence` and
`warnings` (with the usual `{data,metadata}` wrapper under `--debug`). Human
output includes the snapshot ID and fetch time, followed by the colored player
table.

```sh
deno task cli data players --position TL --available
deno task cli data players --name Rabut --no-color
deno task cli data players --club USAP --json --debug
```

`sync` refreshes missing/stale sources by default, not necessarily every source;
use `--force` for a full requested refresh. The executable includes SQLite and
supports custom database/proposal paths directly. For source checkouts only, run
`deno task sqlite:setup` before cached commands; paths outside `.data/` require
a direct `deno run` invocation with suitable permissions.

### Request metadata (`--debug`)

Metadata is hidden by default. Add `--debug` to an API, data or analysis
command:

```sh
deno task cli composition --debug
deno task cli sync --force --debug
deno task cli analyze lineup --offline --debug
deno task cli composition --debug --json | jq '.metadata'
deno task cli composition --debug --json | jq -r '.data.equipe.budget'
```

Human output adds a **Request metadata** section. With `--debug --json`, stdout
is one JSON object with **`data`** (the usual result) and **`metadata`**.
Without `--debug`, existing JSON shapes stay unchanged, including multi-player
arrays. Help has no request metadata because it does not access data.

| Metadata                                     | Meaning                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `startedAt`, `durationMs`                    | UTC command start and total elapsed milliseconds.                                                                               |
| `requestCount`                               | HTTP requests actually made; zero for fully cached/offline reads.                                                               |
| `requests[]`                                 | Each endpoint's start, duration, HTTP status, response bytes, outcome and storage result. Batch commands include every request. |
| `totalResponseBytes`, `unknownResponseSizes` | Sum of measured body bytes, plus count of unmeasured responses.                                                                 |
| `storedPayloadBytes`                         | Logical JSON payload bytes newly persisted during this command.                                                                 |
| `dataAccess[]`                               | Per-source network/cache/missing state, freshness, fetch time, snapshot ID, stored payload size and cached payload size.        |

Request duration covers fetching, reading the body and parsing JSON. Response
sizes are **uncompressed body bytes**, before local filters/quick views; they do
not measure HTTP headers or compressed wire traffic. Failed requests can have an
unknown size (`null`), rather than a misleading zero. Stored/cache sizes
describe compact UTF-8 JSON payloads, **not SQLite file growth**, indexes or
duplicated normalized rows. Cache reuse writes zero bytes. Live inspection
commands do not store data; `sync` and analysis refreshes do.

Failed writes are marked `failed`; failed refreshes retain any previous cached
snapshot. Fatal command errors still exit with status 1 and write diagnostics to
stderr; with both debug/JSON flags, those diagnostics contain `error` and
`metadata`. Tokens, headers and response bodies are excluded from metadata.

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
[Lineup files](analysis.md#lineup-files) for the schema and examples. In the
normal format, slots 1–15 form the XV, 16–17 are the bench, captain is one XV
slot and exactly one bench slot is designated impact. Fantasy bench real
starters receive half rating; only the designated impact gets ×2.

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

The executable reads process variables and its per-user configuration file, with
SQLite included. The source CLI task additionally loads local `.env` and sets
its Deno permissions; no extra flags are needed for normal use:

```bash
deno task cli player 825 --detailed --json
```

The source task grants the configuration variables, API network access to
`fantasy.poneeey.fr:443`, `.data/` filesystem access and the native FFI required
by SQLite. Inspection commands load no native library. To use a different API
origin, run from source and grant its host and port explicitly:

```bash
export FANTASY_API_URL=http://localhost:8000
deno run --no-prompt --allow-env=FANTASY_TOKEN,FANTASY_API_URL \
  --allow-net=localhost:8000 src/cli.ts players --json
```

### Compositions

Top 14 defaults to resource ID `1`; Nations Championship discovers your normal
international league. With no `--round`, the client requests `/api/compos/<id>`;
`--round N` requests `/api/compos/<id>/journee/N`. Supply an ID explicitly with
`composition 2`, or `--composition 2` on analysis commands. IDs and rounds must
be positive safe integers. In NC, explicit IDs must belong to your NC leagues.

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
