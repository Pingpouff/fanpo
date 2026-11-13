# Development

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
    competition.ts            # Named competition contexts
    jeux/                     # Competition discovery
    ligues/                   # League discovery and composition selection
    context/                  # Standings, fixtures, teamsheets, locks and ratings
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
supported. `runCli()` returns output without printing or exiting. Its optional
third argument receives command metadata when debug mode accesses data,
including on request failures.

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

## Executable releases

See [the release guide](releases.md#build-and-release-as-a-maintainer) for
pinned native inputs, platform builds, smoke tests, agent kit packaging and
draft GitHub Releases. Source development continues to use `deno task cli`.
