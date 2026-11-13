# Working with Fanpo

Fanpo is a CLI-first Fantasy Rugby toolkit designed for both people and agents.
Use its CLI for data acquisition, projections, validation and comparisons.

## Fantasy advice

1. Read `.agents/skills/fantasy-rugby/SKILL.md` and the specialist skills it
   routes to for the request. Read `regles_fantasy_rugby.md` for game rules.
2. Follow `docs/fantasy-advice-workflow.md`; `docs/agents.md` explains JSON,
   competition scope and agent integration.
3. Top 14 is the default. Use `--nationchampionship` consistently for NC,
   including `sync`, `data`, `analyze`, `compare` and offline reads.
4. Audit the current team before recommending changes. Read effective budget and
   club/nation limit from the selected API composition.
5. Use `data players` to discover candidates, `analyze player` to evaluate them,
   `compare` for complete packages and `analyze lineup` for final validation.
6. Treat missing evidence as unresolved, never zero. Report source timestamps,
   role uncertainty, sample limitations and the model version. Retain an overall
   `PROVISIONAL` status when returned by the CLI.
7. SQLite owns facts; do not recreate scoring with direct SQL or scratch
   scripts. Save proposals and personal reports under ignored `.data/`.
8. Do not change a live team as part of advice. Never print or include tokens in
   prompts, reports, issues or commits.

Useful starting commands:

```sh
deno task cli --help
deno task cli data status --json
deno task cli sync --json
deno task cli analyze lineup --offline --json
```

## Development

- Use the existing Deno/TypeScript toolchain. Read the relevant Deno skill under
  `.agents/skills/` when working on runtime code.
- Keep API requests/models in `src/api`, persistence in `src/data`, pure scoring
  in `src/analysis`, orchestration in `src/operations` and presentation in
  `src/cli`. Preserve the public compatibility entry points.
- Keep credentials in local `.env`, facts in `.data/`, and generated files in
  `tmp/`. Synthetic fixtures belong in `tests/`.
- Run `deno task sqlite:setup`, `deno task check` and `deno task test` before
  claiming a code change is verified. Tests require no production token.
- Use `docs/development.md` and `CONTRIBUTING.md` for setup and contribution
  guidance. Keep the README quick start and command reference in sync with CLI
  changes.
