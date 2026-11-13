# Getting started

For installation without Deno, use the [standalone executable](releases.md).

[README](../README.md) · [CLI reference](cli.md) · [Agent guide](agents.md)

## Requirements

- Deno 2.9 or later:
  [official installation guide](https://docs.deno.com/runtime/getting_started/installation/).
- An account at [fantasy.poneeey.fr](https://fantasy.poneeey.fr) for live data.
- A local checkout of this repository. Commands below run from its root.

No Node.js installation, build step or LLM API key is required by Fanpo. `jq` is
optional and only used in some advanced JSON examples.

## Install

```sh
deno --version
deno install --frozen-lockfile
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` for the last command. Edit
`.env` in your editor and fill in `FANTASY_TOKEN`.

## Get your token

1. Sign in to [the Fantasy website](https://fantasy.poneeey.fr).
2. Open browser developer tools, usually with **F12**.
3. Select **Network**, reload the page, and open an authenticated `/api/`
   request, such as the request for your composition.
4. Under **Request Headers**, find `Authorization: Bearer …`.
5. Copy only the value after `Bearer` into `FANTASY_TOKEN` in `.env`.

Your token grants access to your account. Keep it local; do not paste it into
issues, agent prompts, screenshots or shared command output. Renew it using the
same procedure if the API returns HTTP 401.

The optional `FANTASY_API_URL` defaults to `https://fantasy.poneeey.fr`.
`deno task cli` loads `.env` automatically; exported environment variables take
precedence. An old exported token can therefore override a newly edited file.

## First live commands

```sh
deno task cli --help
deno task cli games
deno task cli composition
deno task cli teamsheets
```

Top 14 is selected unless you add `--nationchampionship`. To inspect your
international team:

```sh
deno task cli composition --nationchampionship
deno task cli teamsheets --nationchampionship
```

Top 14 defaults to composition resource `1`. To inspect another one, use
`composition ID`; cached team operations accept `--composition ID`. Nations
Championship automatically selects your global/official normal trading league.
Join an appropriate league on the website if none is available.

## Prepare local analysis

```sh
deno task sqlite:setup
deno task cli sync
deno task cli analyze lineup
```

`sqlite:setup` provisions the native library used by SQLite, once per checkout.
On Linux it prefers a compatible system library; otherwise it downloads the
pinned release. Library and database files live under ignored `.data/`. Live
inspection and help commands do not need SQLite setup.

For internationals, use the flag on every step:

```sh
deno task cli sync --nationchampionship
deno task cli analyze lineup --nationchampionship
```

Each competition has separate data. `--profile my-team` selects another local
account profile; use the same profile consistently and separate profiles for
separate accounts. Profiles do not switch login credentials automatically.

## Offline and automation

```sh
deno task cli data status --nationchampionship
deno task cli analyze lineup --nationchampionship --offline --json
```

Offline mode uses existing data without loading credentials or calling the API.
Missing or stale inputs are reported. Help works without a token too, even if
`.env` is absent; Deno may print an env-file diagnostic to stderr.

JSON is written to stdout, diagnostics to stderr. Add `--no-color` when
consuming human-readable output in a plain-text log. `--debug --json` wraps the
usual result as `{ "data": ..., "metadata": ... }`.

## Troubleshooting

| Message / symptom                        | What to check                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `FANTASY_TOKEN is required`              | Fill in `.env` or export the variable. A blank token is rejected.                           |
| HTTP 401                                 | Renew the token; omit `Bearer`; check for an exported value overriding `.env`.              |
| `Nations Championship is not available`  | Run `games --json` and check that the competition is accessible to this account.            |
| No normal NC league                      | Join a normal league on the website or specify an accessible composition ID.                |
| Player/composition does not belong to NC | Find IDs in the selected competition; IDs from Top 14 cannot be reused blindly.             |
| Missing catalogue or target round        | Run `sync` with the same competition, profile and season options.                           |
| Native SQLite / FFI error                | Run `sqlite:setup`; use the provided tasks so the library path and permissions are set.     |
| `PROVISIONAL`                            | Read nested warnings, roles and sample sizes; refresh alone may not resolve uncertainty.    |
| `Unresolved`                             | Required evidence is missing; do not interpret it as zero.                                  |
| Custom origin rejected                   | `--origin` must match `FANTASY_API_URL` online; grant that host when running Deno directly. |

For custom API hosts and permission flags, see
[the CLI reference](cli.md#cli-examples).
