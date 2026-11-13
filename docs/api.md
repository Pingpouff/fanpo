# TypeScript API

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

- `new FantasyClient({ baseUrl, token, competition?, fetch? })`: `fetch`
  defaults to native fetch and may be supplied for offline tests.
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
- `client.getComposition(id?): Promise<CompositionResponse>`: authenticated
  `GET /api/compos/<id>` using the shared HTTP handler. `CompositionResponse`,
  `CurrentComposition` and `CurrentCompositionSlot` model observed current
  selection fields while preserving additional fields.
- `client.competition`: `"top14"` or `"nationchampionship"`; Top 14 is the
  default.
- `client.forCompetition(name)`: returns an independent client context while
  preserving credentials and injected fetch; does not mutate the original.
- `client.getGames()`: `GET /api/jeux`, always independent of the selected
  context.
- `client.getLeagues()`: `GET /api/ligues/mes-ligues` in the selected context;
  explicitly refreshes the in-memory league lookup.
- `client.getStandings()`: `GET /api/top14/classement` (current league table).
- `client.getMatches(round?)`: `GET /api/top14/matchs`; optional local round
  filter.
- `client.getRound()`: `GET /api/journees/cible` (target Fantasy round).
- `client.getTeamsheets()`: `GET /api/feuilles` (announced clubs and shirt
  numbers).
- `client.getLocks()`: `GET /api/compos/etat-verrou` (server lock state).
- `client.getRoundNotes(round)`: `GET /api/notes-journee?journee=N`; official
  ratings and designated withdrawal IDs. Requires a positive safe round number.
- `client.observeRequests(observer)`: receive per-request timing, status, byte
  count and outcome without changing response models. Returns an unsubscribe
  function. The CLI subscribes only in debug mode.
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
client performs no automatic retries. Competition discovery, league selection
and international player-membership checks share in-memory lookups within one
client; `getLeagues()` explicitly refreshes its lookup. API resource reads
remain live, and cached CLI operations handle SQLite persistence separately.

## Competition context

```ts
const nations = client.forCompetition("nationchampionship");
const available = await client.getGames();
const leagues = await nations.getLeagues();
const team = await nations.getComposition();
```

NC is discovered by its code through `/api/jeux`; its numeric ID is sent as
`X-PB-Jeu` by the shared HTTP transport. Discovery is shared across concurrent
requests. An unavailable competition fails explicitly. Default Top 14 requests
retain the original behavior without this header.

NC composition reads select the global/official normal trading league by
default. Pass `undefined` as the first argument of
`getCompositionForRound(undefined, round)` to use that default for historical
results. Explicit league IDs are checked against the selected NC memberships.
Player-sheet IDs are checked against its catalogue. These guards matter because
some upstream resource-by-ID endpoints can otherwise return Top 14 resources
even with an international header.

In-memory context and membership lookups are scoped to a client. For a new
account or analysis session, create a fresh client. Register request observers
on the returned context; they include any discovery and validation requests.

API models are exported from `src/types.ts`, including `Competition`, `Game`,
`GamesResponse` and `League`. Public entry points remain `src/client.ts`,
`src/config.ts`, `src/types.ts` and `src/filters.ts`.
