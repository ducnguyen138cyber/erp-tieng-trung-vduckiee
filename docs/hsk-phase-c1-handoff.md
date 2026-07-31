# Phase C1 Handoff — Professional HSK 1 Course

## Scope completed

Phase C1 continues directly from the Phase C0 curriculum architecture. It does not redo the source audit, add developer tooling, touch Supabase, create migration/telemetry/control-plane code, or enable production.

The HSK 1 canonical shell is now a structured course with:

- 10 curriculum units and 24 core lessons;
- 17 grammar records with form, meaning, position, correct/incorrect examples and Vietnamese learner errors;
- 50 character records with recognition, radical/components, readings and explicit static-fallback status while stroke-order assets remain unverified;
- 120 lesson-aligned exercises: 24 each for listening, grammar, reading, speaking and writing;
- 10 unit checkpoints, one midpoint assessment, one final assessment and one mastery review;
- 133 curated canonical vocabulary-enrichment entries keyed by `canonicalLookup.simplified`, each with collocations and a Vietnamese learner warning;
- 31 useful multi-character expressions are explicitly marked `derived-phrase` with no false canonical lookup;
- dialogue, short reading, listening script/teacher brief, pronunciation, guided practice, speaking, writing, real-world task and spaced review in every lesson;
- learner-flow contracts for pinyin/translation disclosure, resume, weak-skill routing, mobile interaction and accessibility;
- mastery thresholds of 80% knowledge, 75% receptive and 70% productive, with pronunciation, final assessment and speaking required.

The 16-part Phase C0 lesson contract is mapped into the 12 section types supported by the existing lesson schema. Objectives and warm-up are carried by `situation`; input/comprehension are carried by `dialogue`, `reading`, `listening` and `guided-practice`; speaking/writing/real-world production are carried by `independent-practice` and `review`.

## Files added

- `data/hsk/hsk1/course-manifest.json`
- `data/hsk/hsk1/units.json`
- `data/hsk/hsk1/lessons.json`
- `data/hsk/hsk1/grammar.json`
- `data/hsk/hsk1/characters.json`
- `data/hsk/hsk1/exercises.json`
- `data/hsk/hsk1/assessments.json`
- `data/hsk/hsk1/vocabulary-enrichment.json`
- `scripts/build-hsk-curriculum-c1.js`
- `tests/hsk-phase-c1-professional-course.test.js`
- `reports/hsk-c1-course-report.json`
- `reports/hsk-c1-validation-summary.json`

## Files updated

- `data/hsk/hsk1/level.json`
- `data/hsk/manifest.json`
- `scripts/hsk-reference-validator.js` — fixture records are excluded from canonical unit/lesson ordering gates

## Source use

Course scope and records preserve the Phase C0 source registry:

- `moe-gf0025-2021-standard` — proficiency framework and integrated skill alignment;
- `cti-hsk3-current-syllabus-2026` — current exam syllabus/inventory track;
- `cti-hsk3-competency-profile-2026` — output-competency direction;
- `blcu-new-standard-pedagogy-2025` — institutional evidence for integrated pedagogy;
- `vduckie-hsk1-phase2a-original` — project-authored canonical glosses and examples.

No textbook lesson, sample-test answer key or third-party course text was copied. New dialogues, readings, tasks, distractors and Vietnamese teaching notes are project-authored machine-assisted content and remain blocked from production until human review.

## Validation

- `node scripts/build-hsk-curriculum-c1.js --write` then deterministic stale check — PASS
- full repository schema/reference/source validator — PASS (1,473 records, 16 sources, 9 schemas, 0 errors, 0 warnings)
- full canonical HSK1 vocabulary lookup validation — PASS
- duplicate blocker check — PASS (fixture and canonical scopes isolated; 0 blockers)
- C1 professional-course, Phase 2A contract, quality and production-lock tests — PASS
- C0 snapshot/staleness test intentionally excluded because C1 validly advances the shared manifest; Phase C0 artifacts were not regenerated
- `git diff --check` — PASS

The C1 builder is deterministic: running it without `--write` fails if tracked generated files are stale. The C1 test checks counts, schemas/contracts, references, canonical vocabulary lookups, source IDs, NFC-safe content through the repository validator, duplicate blockers, skill balance, mastery and production safety.

## Production safety

Unchanged and explicitly asserted:

- `qualityGate = locked`
- `productionEnabled = false`
- `publicOverrideAllowed = false`
- canonical progress writes remain disabled
- `productionReady = false`
- no Supabase change
- no migration change
- no production rollout

## Remaining issues

These are release gates, not unfinished structural C1 work:

1. Vietnamese human review and pedagogy sampling are still required before any `human-reviewed` or `production-ready` status.
2. Listening scripts exist, but recorded/licensed audio assets are not yet produced.
3. Character records deliberately use `static-fallback`; verified stroke-order assets are still required.
4. The 133 canonical enriched words improve high-priority lesson vocabulary; 31 additional expressions are deliberately labeled as derived phrases. The remaining canonical inventory should be enriched in later editorial batches based on learner errors and lesson demand, not bulk-filled.
5. Learner-facing browser/mobile integration remains separate from this content phase and must not bypass the current production lock.

## Exact next phase

Phase C2 should perform human editorial sampling and learner-facing preview integration only:

1. review Vietnamese, grammar pedagogy, dialogues, readings and at least the Phase C0 sampling minimums;
2. resolve review findings and record reviewer evidence;
3. produce/verify audio and stroke-order assets with graceful fallback;
4. connect the read-only HSK1 course manifest to a developer-only learner preview;
5. run browser/mobile/accessibility smoke tests and repeat validator, duplicate, source and mastery checks;
6. keep production and progress writes locked until a separate approved rollout phase.
