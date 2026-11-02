# Changelog

## 1.6.0
- Hot reload: thin loader + `core/core.mjs`; falls back to the last working core on load errors.
- `magpie_config`: change aliases, routes and display mode from the chat, no restart.
- `magpie_recall`: fetch full text of earlier answers.
- `@alias` sessions persisted to disk; `context` parameter for background info.
- Recently failed models are tried last for 10 minutes; error classification.
- Call log and 7-day usage summary in `magpie_status`.
- Resume refuses to overwrite a manually edited output file.
- Bundled self-test (`tests/selftest.mjs`).

## 1.5.0
- Per-conversation session IDs for `@alias`; chunk resume; atomic writes; compare defaults to 2 models.

## 1.4.x
- `@alias` model slots with display modes (relay / card / file / auto); expand `${DOCUMENTS}`-style placeholders server-side.

## 1.3.0
- File mode: read/write local files, chunking, folder allowlist with realpath checks.

## 1.0 – 1.2
- Task routing with fallbacks, multi-model compare, status diagnostics.
