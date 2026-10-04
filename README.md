# Fantasy Rugby connector

A small Deno/TypeScript client for the API at <https://fantasy.poneeey.fr>, with
a CLI for inspecting players and their detailed sheets. No external dependencies
or build step.

## Setup

Use Deno 2.9 or later, as recommended by `deno.com-agents.md`. Development
checks also pass on the available Deno 2.6.10 runtime; upgrading in this
environment failed because the download host could not be resolved.

Set your Bearer token in the environment. In Bash, you can enter it without
echoing it or recording it in shell history:

```bash
read -r -s -p 'Fantasy token: ' FANTASY_TOKEN
echo
export FANTASY_TOKEN
```

`FANTASY_TOKEN` is required; missing or blank tokens fail clearly. Never put a
real token in source or commit it. `.env` and `.env.*` are ignored as a
precaution; the CLI reads the process environment and does not load these files
automatically.

`FANTASY_API_URL` is optional and defaults to `https://fantasy.poneeey.fr`. Use
an absolute HTTP(S) base URL without embedded credentials. Endpoint paths
resolve from the origin: `getPlayers()` always requests `/api/joueurs`.

## CLI

```bash
deno task cli --help
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
```

Club codes match exactly, ignoring case. Position codes match the primary,
secondary or tertiary position, ignoring case. Names match a substring of
`prenom nom`, ignoring case. `--available` excludes players whose `indisponible`
field is true. Combined filters use AND and run locally on the fetched response.
String options take a separate argument, for example `--name 'Demba Bamba'`.

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

If you keep your token in the ignored `.env` file, load it with Deno's native
flag:

```bash
deno run --env-file=.env --no-prompt \
  --allow-env=FANTASY_TOKEN,FANTASY_API_URL \
  --allow-net=fantasy.poneeey.fr:443 src/cli.ts player 825 --detailed --json
```

The default task grants access only to the two environment variables and
`fantasy.poneeey.fr:443`. To use a different API origin, grant its host and port
explicitly:

```bash
export FANTASY_API_URL=http://localhost:8000
deno run --no-prompt --allow-env=FANTASY_TOKEN,FANTASY_API_URL \
  --allow-net=localhost:8000 src/cli.ts players --json
```

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
```

Public connector API:

- `new FantasyClient({ baseUrl, token, fetch? })`: `fetch` defaults to native
  fetch and may be supplied for offline tests.
- `client.getPlayers(): Promise<PlayersResponse>`: authenticated
  `GET /api/joueurs` with `Accept: application/json`.
- `client.getPlayerSheet(playerId): Promise<PlayerSheetResponse>`: authenticated
  `GET /api/joueurs/<id>/fiche` using the same HTTP handling. Invalid IDs throw
  before requesting the API.
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
- `filterPlayers(players, filters?)`: optional, nonmutating local filters.

Network and malformed JSON failures have contextual errors. Redirects are
rejected to keep authenticated requests on the configured endpoint. No retries
or caching are performed.

## Development

```bash
deno task fmt
deno task check
deno task test
```

`check` runs formatting verification, linting and type checking for source and
tests. Tests run without runtime permissions or production API access; they use
fake fetch responses to exercise the client and CLI. Test fixtures are
synthetic, not a captured production payload.

The API models follow the supplied response example. Additional API fields are
allowed and preserved, but the known fields are trusted rather than validated at
runtime. Production schema compatibility has not been verified with a live
token.

For sheets, measurements and secondary/tertiary positions can be null.
Performance scores, minutes, starter status, played position, opponent, result,
home/away status and `pm` are typed as nullable to accommodate unplayed or
unknown performance values. Aggregate average/best/worst scores may be null when
no matches have been played. These nullability choices are assumptions; fixtures
follow the supplied example rather than a captured live sheet. Selection and
aggregate objects are assumed to be present, and detailed match stat values are
assumed to be numeric.
