# HSK Migration Plan — Phase 0

## Preserve before replacing

- Keep `erp-hsk-state-v2` and `erp-hsk-progress-v2` readable during migration.
- Build an explicit mapping from legacy IDs (`hsk1-1`, etc.) to canonical IDs.
- Preserve completion state only after the mapped lesson has a verified semantic equivalent.
- Keep HSK and ERP stores/events separate.
- Preserve Roast Mode event compatibility through an adapter; do not make content JSON call XP directly.

## Retirement order

1. Phase 1 introduces a read-only canonical loader and validator behind a feature flag.
2. Parse legacy HSK data into an audit-only intermediate representation; do not publish it as verified content.
3. Add compatibility adapters for DOM events, progress reads and lesson navigation.
4. Complete and validate HSK 1 in canonical files.
5. Switch HSK 1 to the canonical loader, then remove `community.js` loading of `hsk1-v75-loader.js` in the same tested commit.
6. Retire `Function(code)` and V75 `.txt` executable fragments only after state migration tests pass.
7. Migrate HSK 2–4 level by level; HSK 5–9 remain locked until their phases pass all gates.

## Data that must not be silently reused

- The `150 words` HSK1 label is legacy and cannot be relabeled GF0025-2021.
- The v79 dictionary cannot be treated as the official level inventory without reconciliation against the official source.
- HSK 7–9 words cannot be assigned an “official” 7, 8 or 9 level based on frequency splitting.

## Rollback strategy

Rollback is feature-flag based, not `git reset`: canonical loader can be disabled while legacy content remains readable until a level migration is accepted. Mascot, Developer Center, ERP, Supabase schema and XP/Level are outside this migration.

# HSK Delivery Plan — Phase 1 to Phase 10

Phase 0 stops after audit and blueprint approval.

- **Phase 1 — Foundation:** canonical `data/hsk` architecture, source registry JSON, JSON schemas, lazy loader, compatibility adapter, validators, duplicate/coverage/source/quality report generators, test fixtures.
- **Phase 2 — HSK 1:** complete verified curriculum, checkpoints, final assessment, mobile UI test and legacy-state migration.
- **Phase 3 — HSK 2:** same quality gates; no start until HSK1 has zero blocking errors.
- **Phase 4 — HSK 3.**
- **Phase 5 — HSK 4.**
- **Phase 6 — HSK 5:** introduce systematic translation and integrated tasks.
- **Phase 7 — HSK 6:** extended argument, reports and multi-meaning terminology.
- **Phase 8 — HSK 7:** advanced combined-band vocabulary with Level 7 performance rubric.
- **Phase 9 — HSK 8:** synthesis, nuance, rebuttal and source-based writing.
- **Phase 10 — HSK 9:** specialist discourse, interpreting, translation, editing and justified choices.

## Per-phase stop gate

Each level phase must report sources, units, lessons, introduced vocabulary, grammar, practice by skill, checkpoints, coverage, duplicates, validation errors, files, tests, commit and manual-review items. The next level cannot start while blocking errors, missing final assessment, broken mobile UI or unreviewed licensing remain.
