# 🏉 Fanpo

**Fantasy Rugby from your terminal. Evidence for your agents.**

![Deno 2.9+](https://img.shields.io/badge/Deno-2.9%2B-000000?logo=deno)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![CLI first](https://img.shields.io/badge/CLI-first-16803C)
![Agent ready](https://img.shields.io/badge/Agent-ready-6D28D9)

Fanpo is a **CLI-first toolkit for
[Fantasy Rugby](https://fantasy.poneeey.fr)**, covering **Top 14** and **Nations
Championship**. Inspect your squad, check real teamsheets, compare players and
evaluate complete lineup changes—with readable terminal tables or structured
JSON.

**Built to work with agents.** Give your coding assistant or other
terminal-capable agent the same commands you use. Fanpo handles acquisition,
local storage, projections and rule checks; your agent investigates the choices
and explains the tradeoffs. No LLM API key is needed by Fanpo.

[Quick start](#quick-start-from-source) ·
[Use with an agent](#use-with-an-agent) · [CLI reference](docs/cli.md) ·
[How analysis works](docs/analysis.md)

## What you can do

- **Know who's playing:** announced starters, substitutes, availability and
  locks.
- **Understand your squad:** positions, current salary cap, club/nation quotas,
  captain and impact checks.
- **Compare alternatives:** evaluate named swap packages or complete lineups,
  with budget effects and projected point changes.
- **Keep the evidence:** SQLite snapshots, source timestamps, model parameters
  and freshness warnings travel with the analysis.
- **Work your way:** terminal tables for people, `--json` for agents and
  scripts, `--offline` for stored analysis, `--debug` for request metadata.

The CLI reads the Fantasy service and writes its local cache. It does **not**
submit transfers or change your team on the website.

## Install the executable

Download your platform archive from
[GitHub Releases](https://github.com/Pingpouff/fanpo/releases) when v0.1.0 is
published. Linux and macOS x64/ARM64 and Windows x64 builds include SQLite and
the runtime: **no Deno installation needed**.

```sh
fanpo --help
fanpo composition
fanpo sync
fanpo analyze lineup --offline --json
fanpo skills export --output ./fanpo-agent-kit
```

Configure `FANTASY_TOKEN` first. See
[installation, configuration and updates](docs/releases.md) for download
verification, platform requirements and per-user data locations. The exported
agent kit contains version-matched skills, game rules and workflow references;
ask your agent to read its `AGENTS.md`.

## Quick start from source

You need
**[Deno 2.9+](https://docs.deno.com/runtime/getting_started/installation/)** and
an account on [fantasy.poneeey.fr](https://fantasy.poneeey.fr). Run the
following from your local checkout of this repository.

### 1. Install and configure

```sh
deno install --frozen-lockfile
cp .env.example .env
```

Edit `.env` and set `FANTASY_TOKEN` to your token, **without** the `Bearer`
prefix. [How to find your token →](docs/getting-started.md#get-your-token)

### 2. Inspect your team

```sh
deno task cli --help
deno task cli composition
deno task cli teamsheets
```

### 3. Prepare an analysis

```sh
deno task sqlite:setup                 # Once: prepare the local SQLite library
deno task cli sync                    # Cache your squad and match context
deno task cli analyze lineup          # Check legality, roles and projections
```

You now have a local evidence store in `.data/`. To reuse it without network
requests or credentials:

```sh
deno task cli analyze lineup --offline
```

For setup details, token renewal, permissions and common errors, see
[Getting started](docs/getting-started.md).

## Choose your competition

**Top 14 is the default.** Add **`--nationchampionship`** for internationals; no
numeric competition ID is needed.

```sh
deno task cli games
deno task cli composition --nationchampionship
deno task cli teamsheets --nationchampionship
deno task cli sync --nationchampionship
deno task cli analyze lineup --nationchampionship
```

Use the same flag throughout a workflow, including offline commands. Each
competition has its own cache. The international default team is discovered from
your leagues; Top 14 keeps its default resource ID of `1`.

## Use with an agent

Open this checkout in your preferred terminal-capable agent and start with
[AGENTS.md](AGENTS.md). The repository includes
[Fantasy Rugby skills](.agents/skills/fantasy-rugby/SKILL.md) for player
analysis, matchups, lineup audits, captaincy and impact choices. Agents without
automatic skill discovery can read these Markdown instructions directly.

Try this prompt:

> Use Fanpo to review my Nations Championship squad for the target round.
> Refresh the evidence, audit my current team, compare plausible replacements,
> and propose a complete lineup with captain and impact. Show the budget, nation
> counts, source timestamps and remaining uncertainties. Do not change my team
> on the website.

The agent uses **the CLI as its analysis interface**:

```sh
deno task cli sync --nationchampionship --json
deno task cli analyze lineup --nationchampionship --offline --json
deno task cli analyze matchups --nationchampionship --offline --json
deno task cli data players --nationchampionship --position TL --available --json
```

Then it investigates candidate IDs with `analyze player`, compares full packages
with `compare`, and validates the final proposal with `analyze lineup`.

**No embedded LLM or automatic lineup optimizer is required.** Your agent
provides the reasoning; Fanpo provides reusable calculations and traceable
facts. [Agent integration guide →](docs/agents.md)

## Useful commands

| Goal                            | Command                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Inspect a player                | `deno task cli player 825 --detailed`                     |
| Find players in your cache      | `deno task cli data players --position TL --available`    |
| Inspect upcoming fixtures       | `deno task cli competition matches`                       |
| Check data freshness            | `deno task cli data status`                               |
| Compare your proposed team      | `deno task cli compare --alternative .data/proposed.json` |
| Get machine-readable analysis   | `deno task cli analyze lineup --json`                     |
| Diagnose requests and cache use | `deno task cli sync --debug`                              |

Discover IDs in the selected competition before using them. For multiple named
swap packages, complete lineup files and all options, see the
[CLI reference](docs/cli.md).

## Read results with context

`VALID`, `INVALID` and `PROVISIONAL` describe the available validation evidence.
A fresh source does not guarantee player selection, and `Unresolved` means
missing evidence—not zero points. Sparse role histories can produce fragile
projections; international forecasts are explicitly exploratory.

Fanpo keeps those limitations visible alongside its numbers. See
[Analysis and local data](docs/analysis.md) and the
[Fantasy rules reference](regles_fantasy_rugby.md).

## Documentation

| Guide                                                      | What it covers                                        |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| [Getting started](docs/getting-started.md)                 | Install, token setup and troubleshooting              |
| [CLI reference](docs/cli.md)                               | Commands, flags, output and examples                  |
| [Agent integration](docs/agents.md)                        | Prompts, JSON contracts and the agent workflow        |
| [Fantasy advice workflow](docs/fantasy-advice-workflow.md) | Detailed procedure for evidence-based lineup advice   |
| [Analysis and local data](docs/analysis.md)                | Projections, validation, SQLite and model limitations |
| [TypeScript API](docs/api.md)                              | Embedding the client and named competition contexts   |
| [Contributing](CONTRIBUTING.md)                            | Development setup and verification                    |

## Development

`main` contains stable code; ongoing work integrates through `develop` using
feature pull requests. See the
[branch workflow](CONTRIBUTING.md#branch-workflow).

```sh
deno task sqlite:setup
deno task check
deno task test
```

Tests use synthetic fixtures and require no Fantasy token or production API
access. [Architecture and development details →](docs/development.md)

Fanpo is an independent tool for the Fantasy service. Access to that service and
its data remains subject to its own terms. Third-party components retain their
own licenses; see [Third-party notices](THIRD_PARTY_NOTICES.md).

## License

[MIT](LICENSE). Third-party components retain their
[own licenses](THIRD_PARTY_NOTICES.md).
