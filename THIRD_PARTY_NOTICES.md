# Third-party notices

## Deno agent skills

The following bundled skill directories come from
[denoland/skills](https://github.com/denoland/skills):

- `.agents/skills/deno/`
- `.agents/skills/deno-deploy/`
- `.agents/skills/deno-frontend/`
- `.agents/skills/deno-sandbox/`
- `.agents/skills/migrate-to-deno/`

Their source paths and hashes are recorded in `skills-lock.json`. They retain
their MIT license and attribution. The upstream license is reproduced in
[LICENSE.denoland](.agents/skills/LICENSE.denoland).

## Runtime dependencies

Dependencies declared in `deno.json` and resolved in `deno.lock`, including
Cliffy and SQLite, are distributed by their respective projects under their own
licenses. The standalone executable embeds the Deno 2.9.7 runtime, including V8
and Node compatibility code. [Bundled license texts](licenses/runtime.txt)
preserve the Deno, V8, Node, Cliffy, Deno standard library, SQLite wrapper and
plug notices. The `@db/sqlite` wrapper is Apache-2.0 licensed; SQLite itself is
public domain.

Native libraries are generated/downloaded into ignored `tmp/release/` and
embedded in compiled releases. Linux uses checksum-pinned SQLite 3.50.4
amalgamation source from sqlite.org. macOS/Windows use checksum-pinned
`denodrivers/sqlite3` 0.13.0 release assets. Inputs and hashes are recorded in
`scripts/release/native.json`. Source runs still provision SQLite into ignored
`.data/` with `deno task sqlite:setup`.

## Fantasy service and data

The Fantasy website, its names, APIs, player statistics and account data belong
to their respective owners. A license for Fanpo does not grant rights to that
service or its data. Use your own account and follow the service's terms.
