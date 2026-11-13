# Standalone releases

Fanpo's executable includes its runtime, SQLite, and a version-matched agent
kit. No Deno installation, source checkout, or SQLite setup command is required.
Release archives and the agent-kit ZIP are built by GitHub Actions; a release
becomes publicly available when its maintainer publishes the draft.

## Install

Download the archive for your system from
[GitHub Releases](https://github.com/Pingpouff/fanpo/releases), together with
`SHA256SUMS`. The first planned release is **v0.1.0**.

| System              | Asset suffix         | Requirements                        |
| ------------------- | -------------------- | ----------------------------------- |
| Linux x64           | `linux-x64.tar.gz`   | glibc 2.35+ (Ubuntu 22.04 baseline) |
| Linux ARM64         | `linux-arm64.tar.gz` | glibc 2.35+ (Ubuntu 22.04 baseline) |
| macOS Intel         | `macos-x64.tar.gz`   | macOS 13+                           |
| macOS Apple Silicon | `macos-arm64.tar.gz` | macOS 13+                           |
| Windows x64         | `windows-x64.zip`    | Windows 10+                         |

Check the downloaded archive's SHA-256 against its entry in `SHA256SUMS`:
`sha256sum <archive>` on Linux, `shasum -a 256 <archive>` on macOS, or
`Get-FileHash <archive> -Algorithm SHA256` in PowerShell.

Extract the archive, then move `fanpo` (or `fanpo.exe`) into a directory on your
PATH. On Linux/macOS, ensure it is executable with `chmod +x fanpo`. Keep the
supplied license notices when redistributing the executable.

```sh
fanpo --version
fanpo --help
```

Releases are initially unsigned. macOS Gatekeeper or Windows SmartScreen may
request approval. Verify the download first, then use your operating system's
approval controls for that specific executable. Linux builds target glibc;
Alpine/musl is not supported. Runtime support also follows Deno 2.9.7's system
requirements; the smoke matrix uses Ubuntu 22.04, macOS 15, and Windows Server
2022 environments.

## Configure once

Set `FANTASY_TOKEN` in your process environment, or create the configuration
file below. Use your token without the `Bearer` prefix; see
[how to find it](getting-started.md#get-your-token). Keep it private and outside
agent prompts. On Unix, use file mode `600`; on Windows restrict access to your
user account.

| System  | Configuration file                        | Default database                                   | Native library cache          |
| ------- | ----------------------------------------- | -------------------------------------------------- | ----------------------------- |
| Linux   | `$XDG_CONFIG_HOME/fanpo/env`              | `$XDG_DATA_HOME/fanpo/fanpo.sqlite`                | `$XDG_CACHE_HOME/fanpo/`      |
| macOS   | `~/Library/Application Support/Fanpo/env` | `~/Library/Application Support/Fanpo/fanpo.sqlite` | `~/Library/Caches/Fanpo/`     |
| Windows | `%LOCALAPPDATA%\Fanpo\env`                | `%LOCALAPPDATA%\Fanpo\fanpo.sqlite`                | `%LOCALAPPDATA%\Fanpo\Cache\` |

Unset Linux XDG directories default to `~/.config`, `~/.local/share`, and
`~/.cache`, respectively. XDG overrides must be absolute paths. Create the
configuration's parent directory yourself; Fanpo does not write your token.

```dotenv
FANTASY_TOKEN=your-token
```

The file accepts blank lines, `#` comment lines, and `KEY=value` entries with
optional matching single/double quotes. Values are literal: no variable
expansion, escapes, `export` prefixes, or inline comments. Supported keys are
`FANTASY_TOKEN` and `FANTASY_API_URL`. Existing process values take precedence,
including empty values. The executable does not automatically load a `.env` file
from the working directory.

The compiled executable allows HTTPS requests to `fantasy.poneeey.fr:443`.
Custom API hosts require the source CLI with explicit Deno network permissions.
This keeps alternate-host development available without expanding release
network permissions. `--db` overrides the database path; `DENO_SQLITE_PATH`
overrides the embedded native library. Existing checkout databases stay in
place; use `--db /path/to/checkout/.data/fanpo.sqlite` to reuse one.

SQLite is extracted lazily, offline, into a versioned cache directory. Removing
that native cache is safe; the executable recreates it when needed. Removing the
database discards cached evidence. Updating Fanpo only replaces the executable;
configuration and data remain separate.

```sh
fanpo composition
fanpo sync --nationchampionship
fanpo analyze lineup --nationchampionship --offline --json
```

The executable can read/write user-selected database, proposal and export paths
and load SQLite through FFI. It does not launch subprocesses.

## Give an agent the kit

```sh
fanpo skills export --output ./fanpo-agent-kit
```

The parent directory must exist and the destination must be new. Export is
offline and requires neither credentials nor writable application storage.
`--json` reports its version and destination. A matching
`fanpo-agent-kit-v0.1.0.zip` is also attached to the release.

Open the exported directory with your terminal-capable agent and ask it to read
`AGENTS.md`. It contains eight Fantasy Rugby skills under `.agents/skills/`,
authoritative rules, and linked CLI/advice references. Keep this directory
structure together so references resolve. Agent-specific automatic discovery
varies; reading the files explicitly always works. Fanpo does not install into
an agent's global configuration automatically.

The kit is versioned with the CLI. Export a new directory after upgrading and
switch your agent to that version. Kit examples use `fanpo`, structured JSON,
and the same validation workflow as the source checkout.

## Build and release as a maintainer

Use Deno **2.9.7** with the committed lockfile. Linux builds additionally
require `cc` and `unzip`; build in Ubuntu 22.04 to retain the advertised glibc
baseline. Build natively on each target; the release workflow checks runner
architecture and executes each result.

```sh
deno install --frozen-lockfile
deno task build
deno task release:smoke
deno task release:kit
```

Outputs stay under ignored `tmp/release/`. The kit destination must not already
exist; archive or remove a previous generated kit before exporting again.
`build` downloads checksum-pinned native inputs and the pinned Deno runtime;
end-user commands do not download dependencies. The input checksums live in
`scripts/release/native.json`. Linux compiles SQLite 3.50.4 from official
amalgamation source; macOS/Windows embed the corresponding pinned
`denodrivers/sqlite3` 0.13.0 libraries.

Release-related pull requests run the five-platform build automatically and
retain the assembled workflow artifact for 30 days. After the workflow is merged
into `main`, you can also run **Release executable** manually on a feature
branch to validate all five platforms and download the assembled
`fanpo-release-assets` workflow artifact. This does not create a GitHub Release.
The regular CI remains credential-free.

For a public release:

1. Update `src/release/version.ts`, documentation examples, and
   dependency/license notices as needed; verify locally and through the manual
   matrix workflow.
2. Merge the feature into `develop`, then merge the release PR from `develop`
   into `main` using the documented merge-commit workflow.
3. Tag the intended main commit `v0.1.0` and push the tag. Version metadata must
   match, and the tagged commit must be an ancestor of `origin/main`.
4. The workflow checks the code, builds and smoke-tests every platform,
   assembles five archives, the agent-kit ZIP and `SHA256SUMS`, then creates a
   draft.
5. Review its assets and release notes, then publish the draft manually.

A failed matrix job prevents release creation. If draft creation fails because a
draft already exists, inspect it and the workflow artifacts before manually
replacing assets; the workflow does not overwrite a release automatically. Code
signing, package-manager installation and automatic updates are deferred.
