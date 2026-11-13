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
