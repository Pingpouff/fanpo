# Fanpo v0.1.0 executable release

Accepted design: a single executable with embedded SQLite, per-user
configuration and storage, and an exportable version-matched agent kit. Targets:
Linux/macOS x64 and ARM64, Windows x64. MIT license. A tag on main creates a
draft release; publication remains manual.

## Implementation steps

- [x] Add isolated release startup, paths, configuration, native extraction,
      version reporting and skill export; preserve source CLI defaults.
- [x] Add pinned native assets, reproducible build tasks, native smoke checks,
      platform archives, checksums and a draft-release workflow.
- [x] Update installation, agent and maintainer documentation and licensing.
- [ ] Verify checks, tests, compiled Linux smoke, kit references and final
      review.

## Decisions and evidence

- Baseline: 123 tests passed before changes.
- Release runtime tests: five new tests failed on absent modules, then passed
  after implementing paths, config, extraction, overwrite protection and CLI
  help.
- Linux compatibility: upstream SQLite binaries require a newer glibc than the
  local host. Build SQLite 3.50.4 from checksum-pinned amalgamation source in
  Ubuntu 22.04 containers for both Linux architectures; use pinned upstream
  libraries on macOS/Windows.
- Compiled binaries permit production API HTTPS only. Alternate API hosts remain
  supported through the source CLI with explicit Deno permissions.

- Final review identified JSON output rewriting, inherited SQLite development
  mode, and misleading source-only packaged instructions. Restrict formatting to
  help, clear development mode in release preparation, and document both runtime
  modes.
- GitHub CI owns the five-platform build and stores final archives/checksums for
  30 days as workflow artifacts; version tags on main additionally create a
  draft release. Pull requests exercise the release matrix before merge.

- First GitHub matrix: Linux x64/ARM64 and macOS x64/ARM64 passed; Windows
  exposed CRLF-dependent token-section extraction. Normalize kit input line
  endings and add an injected-CRLF regression before rerunning CI.
