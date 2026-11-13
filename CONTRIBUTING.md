# Contributing to Fanpo

Fanpo is a CLI-first tool for people and agents. Changes should preserve useful
terminal output, machine-readable JSON and the distinction between facts,
forecasts and uncertainty.

## Local setup

Install Deno 2.9+, then from the repository root:

```sh
deno install --frozen-lockfile
deno task sqlite:setup
deno task check
deno task test
```

Tests use synthetic fixtures and mocked API responses. You do not need a Fantasy
account or token to run them. Live CLI use additionally needs local `.env`; see
[Getting started](docs/getting-started.md).

## Making changes

### Branch workflow

| Branch                 | Purpose                                           | Pull request target                         |
| ---------------------- | ------------------------------------------------- | ------------------------------------------- |
| `main`                 | Stable, release-ready code; GitHub default branch | Releases from `develop`, or urgent hotfixes |
| `develop`              | Integration branch for ongoing development        | Feature and maintenance work                |
| `feature/<short-name>` | One scoped feature, branched from `develop`       | `develop`                                   |
| `fix/<short-name>`     | A normal bug fix, branched from `develop`         | `develop`                                   |
| `hotfix/<short-name>`  | An urgent fix, branched from `main`               | `main`, then synchronize into `develop`     |

Start a feature from the latest integration branch:

```sh
git fetch origin
git switch develop
git pull --ff-only
git switch -c feature/player-comparison
```

Commit focused changes, run the checks below, then push your feature branch and
open a pull request targeting `develop`. Keep unrelated work in separate pull
requests. Prefer squash-merging short-lived feature branches and delete them
after integration.

When `develop` is ready for release, open a pull request from `develop` to
`main`. Use a merge commit for this long-lived branch integration to preserve
ancestry, then synchronize `main` back into `develop`. Do not squash-merge the
two long-lived branches. Tag releases deliberately once a version is chosen.
Hotfixes merged into `main` must also be brought back into `develop`.

CI runs on pushes and pull requests, including both long-lived branches. Avoid
force-pushing `main` or `develop`; do not work directly on `main` for normal
feature implementation. Repository branch protection, when enabled, enforces the
corresponding GitHub requirements.

### Code and documentation

- Keep API access, storage, calculations and CLI presentation separate; see
  [the architecture](docs/development.md#source-layout).
- Preserve existing public entry points and command behavior unless the change
  explicitly requires a breaking change.
- Exercise meaningful behavior with tests: API context, cache isolation, money,
  validation, projections, output contracts and errors. Never use real account
  data in fixtures.
- Update [the CLI reference](docs/cli.md), [API guide](docs/api.md) and agent
  guidance when their interfaces change.
- Run `deno task fmt`, `deno task check` and `deno task test` before submitting.
  GitHub CI runs the same setup and checks on Ubuntu.

Pull requests should explain the problem, resulting behavior and validation
performed. For a bug report, include the command, Deno/OS versions and a
redacted error. Never attach a token, `.env`, personal database or raw
account-specific API response.

Third-party skills retain their upstream license and attribution. See
[Third-party notices](THIRD_PARTY_NOTICES.md).

Executable build and release instructions are in
[the release guide](docs/releases.md). The workflow creates a draft only after
all platform builds pass; publication is manual.
