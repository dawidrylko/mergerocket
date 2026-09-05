# Changelog

All notable changes to mergerocket are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-05

### Added

- Release workflow: a pushed `vX.Y.Z` tag verifies the version against `package.json`, audits, runs the tests, publishes to npm over OIDC trusted publishing and opens a GitHub Release.
- CI workflow: the test suite runs on Node.js 22 and 24 for every pull request and every push to master. A separate audit job runs on every push to master and once a week.
- A `files` field. The published tarball now carries `main.js`, `mergerocket.js`, `CHANGELOG.md` and the metadata npm always includes, and nothing else. It previously shipped the whole test suite, `ava.config.js` and `.nvmrc`.
- Declared a Node.js 24.12.0 floor through `engines`, and `publishConfig.access` so the publish stays explicit rather than relying on the registry default.
- This changelog, plus issue templates for bug reports and feature requests.

### Changed

- Rewrote the README around a quickstart and a table of options. It now documents the output format, the placeholder left in place of a binary file, and how much of `.gitignore` is actually supported.
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
