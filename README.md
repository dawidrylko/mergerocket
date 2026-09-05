# mergerocket

mergerocket is a command line tool that walks a directory, reads every text file it finds and writes them all into one file. It exists to get a whole tree into a single LLM prompt without copying files by hand.

[![npm version](https://img.shields.io/npm/v/mergerocket.svg)](https://www.npmjs.com/package/mergerocket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Every file is wrapped in a start and an end marker carrying its path, so the model can tell where one file stops and the next begins. Binary files and anything `.gitignore` excludes are left out by default. An optional summary at the top reports what was merged and what was skipped.

## Requirements

Node.js 24.12.0 or newer. That is the version `.nvmrc` pins, and CI runs the suite on Node.js 24 and 26.

## Install

```bash
npm install -g mergerocket
```

The equivalents are `yarn global add mergerocket` and `pnpm add -g mergerocket`. To keep it to one project, install it as a dev dependency with `npm install --save-dev mergerocket` and call it from a package script.

## Quickstart

```bash
mergerocket
```

That merges the current directory into `merged_<epoch>.txt`, where the suffix is the epoch time in milliseconds. Hidden files are skipped, `.gitignore` is honoured, and the images and archives in the default blacklist are dropped.

## Options

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `-d`, `--dir` | directory | `.` | Directory to walk, recursively. |
| `-o`, `--out` | file path | `merged_<epoch>.txt` | Where the merged file is written. Missing parent directories are created. |
| `--blacklist` | extensions, comma separated | see below | Extensions dropped from the merge entirely. |
| `--start` | marker template | `--- START: {file} ---` | Written before each file. `{file}` becomes the path. |
| `--end` | marker template | `--- END: {file} ---` | Written after each file. `{file}` becomes the path. |
| `--keep-hidden` | flag | off | Include files and directories whose name begins with a dot. |
| `--ignore-gitignore` | flag | off | Disregard `.gitignore` and merge the files it excludes. |
| `--attach-summary` | flag | off | Prepend a summary block to the output file. |

The default blacklist is `.png,.jpg,.jpeg,.gif,.bmp,.ico,.zip,.gz,.tar,.rar,.exe`. Passing `--blacklist` replaces that list rather than adding to it.

Matching reads the final extension only, the one `path.extname` returns. `.test.js` therefore never matches anything, because the extension of `app.test.js` is `.js`. Filter those through `.gitignore` instead.

The `.gitignore` support covers the common cases: a literal name, a directory, and a wildcard such as `*.log`. It does not implement negation, so a `!keep.log` line has no effect and the file stays excluded.

## Examples

### Merge one subdirectory into a named file

```bash
mergerocket --dir src --out bundle.txt
```

### Include dotfiles and the files git ignores

```bash
mergerocket --keep-hidden --ignore-gitignore
```

### Markers that read as comments in the target language

```bash
mergerocket --start "// BEGIN {file}" --end "// END {file}"
```

### Keep images but drop vector art and lockfiles

```bash
mergerocket --blacklist ".svg,.lock"
```

### Everything at once, with a summary

```bash
mergerocket -d src -o context.txt --keep-hidden --attach-summary
```

## Output

The result is one plain text file. Each merged file contributes a marker, its contents, and a closing marker:

```
--- START: one.txt ---
alpha

--- END: one.txt ---

--- START: sub/two.md ---
beta

--- END: sub/two.md ---
```

Each marker carries the `--dir` value joined to the path beneath it. `--dir src` therefore yields `src/one.txt`, and an absolute `--dir` yields absolute paths. The default `.` collapses to a plain relative path, which is what the example above shows.

A file carrying a null byte in its first 8000 bytes counts as binary: it still gets its markers, but the body is replaced with `[SKIP] Binary file: <path>`. A file that cannot be read gets `[SKIP] Failed to read file: <path>`. Blacklisted extensions produce no markers at all, and the output file leaves itself out.

With `--attach-summary`, a block goes in front of everything else:

```
--- START: Merged File Summary ---
Execution Date: 9/5/2026, 11:52:50 PM
Duration: 1 ms
Files processed for merging: 2
Text files merged: 2
Binary files skipped: 0
Files failed to read: 0
Merged file count by type:
  .txt: 1
  .md: 1
--- END: Merged File Summary ---
```

The summary is wrapped with the same marker templates, so `--start` and `--end` apply to it too.

## Development

```bash
pnpm install
pnpm test
```

The suite is [ava](https://github.com/avajs/ava): 22 tests covering the merge behaviour and the exported helpers. `pnpm coverage` runs the same suite under c8.

## Releasing

Releases run from a pushed tag. `.github/workflows/release.yml` checks the tag against `version` in `package.json`, audits the dependencies, runs the tests, packs the tarball, publishes to npm and opens a GitHub Release.

```bash
npm version patch
git push --follow-tags
```

Use `minor` or `major` in place of `patch` as the change requires. `npm version` writes the new version, commits it and creates the tag.

The first release is the exception. `package.json` already reads 0.1.0, so tag the existing commit rather than letting `npm version` invent 0.1.1:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

Publishing uses npm trusted publishing over OIDC, so there is no `NPM_TOKEN` to store or rotate. It needs one setup step on npmjs.com: in the package settings, add a trusted publisher for `dawidrylko/mergerocket` with the workflow file `release.yml`.

Past releases are listed in [CHANGELOG.md](./CHANGELOG.md).

## License

MIT. See [LICENSE](./LICENSE).

## Author

[Dawid Ryłko](https://dawidrylko.com)
