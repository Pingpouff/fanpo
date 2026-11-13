# Fanpo for agents

[Quick start](../README.md#quick-start-from-source) · [CLI reference](cli.md) ·
[Detailed advice workflow](fantasy-advice-workflow.md)

Fanpo is a CLI-first tool designed to be used by agents. Any assistant that can
read local files and run terminal commands can use the same interface as a
human. No provider-specific SDK or LLM integration is required by Fanpo.

## Division of responsibilities

| Fanpo provides                                | Your agent provides                            |
| --------------------------------------------- | ---------------------------------------------- |
| Authenticated, competition-scoped API reads   | Investigation and interpretation               |
| SQLite facts, source IDs and timestamps       | Explanations grounded in those facts           |
| Player and matchup projections                | Judgement about sample size and context        |
| Budget, position, quota and multiplier checks | Complete, mutually compatible proposals        |
| Reproducible package comparisons              | A readable recommendation with remaining risks |

Fanpo does not embed an LLM or search automatically for an optimal squad. It
also has no CLI command to submit a team to the website. Analysis can update
local facts and files; the user's live team stays unchanged.

## Use the standalone executable

The [standalone release](releases.md) includes the eight Fantasy Rugby skills,
rules and required references. Export them without credentials or network:

```sh
fanpo skills export --output ./fanpo-agent-kit
```

Ask your agent to read the exported `AGENTS.md` and keep the directory structure
intact. No source checkout is required. The same kit is available as a release
ZIP. It matches the executable version; export again to a new directory after
upgrading. In the workflows below, replace `deno task cli` with `fanpo` when
using the executable. Automatic integration into agent configuration is manual.

## Give an agent the repository

Complete the [setup](getting-started.md), then open the checkout in your agent.
The root [AGENTS.md](../AGENTS.md) gives a concise entry point. Fantasy skills
live in [`.agents/skills/`](../.agents/skills/fantasy-rugby/SKILL.md); their
`SKILL.md` files define workflows for audits, player comparisons, matchups,
captaincy, impacts and final validation.

Automatic discovery depends on your agent. If it does not discover these files,
ask it to read `AGENTS.md`, the relevant skills, the
[game rules](../regles_fantasy_rugby.md), and the
[advice workflow](fantasy-advice-workflow.md). No skill installation is needed
to read the instructions or run the CLI.

Suggested prompt:

> Use Fanpo's CLI to review my current Nations Championship lineup. Read the
> project instructions, refresh the right competition, audit the squad, and
> compare plausible replacements. Give me one complete proposal with captain and
> impact, budget, nation counts, evidence timestamps and uncertainties. Leave my
> team on the website unchanged.

## Start with a single, consistent scope

Top 14 is the default. Add `--nationchampionship` to **every** command in an
international session. Keep the same `--profile`, `--season`, `--db`, `--origin`
and explicit `--composition`, when supplied. Do not mix player IDs or snapshots
from different competitions.

```sh
deno task cli data status --nationchampionship --json
deno task cli sync --nationchampionship --json
deno task cli analyze lineup --nationchampionship --offline --json
deno task cli analyze matchups --nationchampionship --offline --json
```

Audit first: identify incomplete squads, illegal positions, missing multipliers,
quota violations or budget problems before comparing sporting options.

## Discover, investigate, compare, validate

Use cached discovery rather than repeatedly downloading the catalogue:

```sh
deno task cli data players --nationchampionship --position TL --available --json
```

Take player IDs from this result. `--available` excludes flagged-unavailable
players; it does not establish that they are selected. Investigate current and
alternative players together with `analyze player ID... --json`, adding the same
competition flag. This command refreshes missing/stale facts itself.

Compare complete proposals with the production CLI:

```sh
deno task cli compare --nationchampionship --alternative .data/proposed.json --json
deno task cli analyze lineup --nationchampionship --lineup .data/proposed.json --json
```

Create `.data/proposed.json` from a real, complete 17-slot lineup; do not assume
an example file already exists. See [lineup files](analysis.md#lineup-files).
For swaps that retain captain and impact slots, `compare --candidate` accepts
multiple independent named packages. See
[candidate syntax](analysis.md#lineup-files).

Changing captain or impact requires a complete lineup file. Compare those
variants too. Revalidate after any player, price, role or lock change.

## Consume JSON, not terminal tables

- Without `--debug`, stdout contains the requested JSON payload directly.
- With `--debug --json`, unwrap `.data`; `.metadata` contains request/cache
  diagnostics. The wrapper is emitted when metadata was recorded.
- Fatal errors exit nonzero and write diagnostics to stderr.
- A refresh can exit successfully while returning stale fallback data. Inspect
  `fullyCurrent`, warnings and nested validation instead of relying on exit
  status alone.
- Raw inspection commands preserve API envelopes; analysis commands return
  `competition`, `round`, `model`, `fullyCurrent`, `evidence`, `warnings` and
  `result`. Cache status additionally exposes its local `scope`.
- Analysis totals use whole currency units; raw API player prices are decimal
  strings in millions. A total of `11000000` means `11.00 M`.
- Preserve `null`. It means unresolved evidence, not zero.

For example, with optional `jq`:

```sh
deno task cli analyze lineup --nationchampionship --offline --json \
  | jq '{competition, round, fullyCurrent, warnings, validation: .result.validation}'
```

Do not scrape colored tables or rebuild the scoring model with SQL, Python or
scratch scripts. Use detailed player statistics to explain a rating, not to add
bonuses to a projection that already incorporates it.

## Make uncertainty useful

A recommendation should distinguish:

- structural legality from the overall `PROVISIONAL` status;
- announced roles from unknown selection or minutes;
- historical score ranges from predictive floors and ceilings;
- resolved expected totals from conditional starter/substitute scenarios;
- measured results from forecasts and hypothetical gains.

`fullyCurrent` concerns the requested sources' freshness. Read nested warnings
and role samples as well. A forecast based on a single appearance can resolve
numerically without being reliable. NC projections carry an international
validation warning; insufficient matchup history uses a neutral adjustment.

Do not promise a gain because a full proposed team outscores an incomplete
baseline. A player change is only useful if the complete package remains legal.

## Storage and credentials

SQLite owns acquired facts. Store proposal inputs and personal reports in
ignored `.data/`; keep raw API exports out of a parallel cache. Reports should
cite source IDs/timestamps, target round, model version and the exact commands
used. The full output contract is in the
[advice workflow](fantasy-advice-workflow.md#final-validation-and-report).

The user supplies a token through the process environment or the executable’s
per-user configuration file (source checkouts can use local `.env`). Never read
it into a prompt, print it, or add it to a report. Use the configured CLI;
diagnose authentication by HTTP status. Request metadata deliberately excludes
tokens and request headers.
