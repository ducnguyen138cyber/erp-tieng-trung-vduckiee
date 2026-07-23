# Phase 2 Authoring Guide — Verified HSK 1

Phase 2 may begin only after the Phase 1 commit is accepted. This guide does not authorize bulk generation.

## Authoring sequence

1. Reconcile the official HSK 1 vocabulary, grammar, Hanzi, task and topic inventory against registered official sources.
2. Record item-level `sourceIds` and `syllabusVersion`; do not relabel the legacy 150-word course as GF0025-2021.
3. Propose units and lessons from the verified inventory.
4. Write original examples, dialogues, readings, transcripts, exercises and assessments.
5. Add spaced-review metadata instead of copying questions.
6. Create the midpoint checkpoint, end checkpoint, practice test, mastery review and final assessment blueprint.
7. Complete human review for Vietnamese, Chinese correctness, level fit, ambiguity and copyright.
8. Build an explicit legacy progress mapping table; uncertain mappings remain unresolved.
9. Preview through an authorized read-only developer harness.
10. Switch HSK 1 only in a separately tested Phase 2 commit after every blocking gate reaches zero.

## Required per-record states

- Working content: `draft` or `machine-assisted`.
- Human-reviewed Vietnamese: `translationReviewStatus: "human-reviewed"`.
- Production candidate: all references, sources, assets and assessments valid; no review-required source; review status approved.
- Final level gate: `productionReady` remains false until UI/mobile/regression tests and legacy mapping review pass.

## Required commands

```bash
node scripts/validate-hsk-content.js
node scripts/check-hsk-duplicates.js
node scripts/check-hsk-coverage.js
node scripts/generate-hsk-report.js
node --test tests/*.test.js
```

Phase 2 must report verified counts, exercise counts by skill, checkpoints, source coverage, duplicates, validation errors, manual-review items, commit and push status. It must stop before HSK 2.
