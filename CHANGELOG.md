# Changelog

All notable changes to mergerocket are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- A symlinked directory pointing back at an ancestor no longer sends the walk round the same files repeatedly. Each real directory is now walked once, so a link to an already visited directory ends the descent. Previously the walk only stopped when the path outgrew the filesystem limit, around 33 levels deep.
- The output file is now recognised as itself when the walk reaches it through a symlink, and is left out of the merge. It was compared with `path.resolve`, which normalises a path but never follows links. Where a loop also exposed the output file, the merge appended the output to its own content once per level: a single 6 byte input produced 15.3 MB that way, and a run over this repository's own test fixtures reached 922 MB.
- A dangling symlink at `--out` is now removed before the merge starts. `fs.existsSync` follows symlinks and reports false for a broken one, so the link survived, the first write followed it, and the output was created wherever it pointed. With the link aimed inside `--dir`, that wrote a file into the source tree and then merged it into itself.

## [0.1.0] - 2026-09-05

### Added

- Release workflow: a pushed `vX.Y.Z` tag verifies the version against `package.json`, audits, runs the tests, publishes to npm over OIDC trusted publishing and opens a GitHub Release.
- CI workflow: the test suite runs on Node.js 26 for every pull request and every push to master. A separate audit job runs on every push to master and once a week.
- A `files` field. The published tarball now carries `main.js`, `mergerocket.js`, `CHANGELOG.md` and the metadata npm always includes, and nothing else. It previously shipped the whole test suite, `ava.config.js` and `.nvmrc`.
- Declared a Node.js 26.0.0 floor through `engines`, and `publishConfig.access` so the publish stays explicit rather than relying on the registry default.
- This changelog, plus issue templates for bug reports and feature requests.

### Changed

- Rewrote the README around a quickstart and a table of options. It now documents the output format, the placeholder left in place of a binary file, how much of `.gitignore` is actually supported, and a known limitations section covering symlink cycles, the memory cost of `--attach-summary` and the binary heuristic.
- Narrowed the npm keywords and the package description to what the tool does.
- Raised ava to 8 and c8 to 12. The old versions pulled in 27 high and critical advisories through `@vercel/nft`, which failed the audit step and would have blocked every release. The suite passes unchanged on the new majors.

### Fixed

- Dropped the `./` prefix from the `bin` path. npm rewrote it and warned on every publish.
- Removed a README example that passed `.test.js` and `.d.ts` to `--blacklist`. Matching uses `path.extname`, so those patterns would have excluded every `.js` and `.ts` file rather than the intended few.

## [0.0.1] - 2025-04-14

### Added

- First release. Recursive merge of the text files under a directory into one output file, with configurable start and end markers, an extension blacklist, `.gitignore` support, a hidden-file toggle and an optional summary report.

[Unreleased]: https://github.com/dawidrylko/mergerocket/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dawidrylko/mergerocket/compare/0.0.1...v0.1.0
[0.0.1]: https://github.com/dawidrylko/mergerocket/releases/tag/0.0.1
