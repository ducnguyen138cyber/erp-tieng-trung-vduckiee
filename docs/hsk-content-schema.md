# HSK Content Schema Proposal — Phase 0

The machine-readable draft is `docs/schemas/hsk-content.schema.json`. It is a design contract, not yet a production loader.

## Required provenance

Every record must contain:

- `syllabusVersion`
- `hskLevel`
- `sourceIds`
- `contentVersion`

Exam-facing records additionally use `examBlueprintVersion`.

## Record families

1. `level` — objectives, topics, references, units, checkpoints and final assessment.
2. `lesson` — ordered objectives, prerequisites, vocabulary/grammar/character references, sections, practice and review.
3. `vocabulary` — simplified/traditional, pinyin, POS, Vietnamese meanings, context, collocations, examples, register, learner errors and audio reference.
4. `grammar` — formula, conditions, sentence position, correct/incorrect examples, Vietnamese learner errors, confusables and review levels.
5. `exercise` — skill, format, topic, difficulty, cognitive skill, template family, answer/feedback and spaced-review metadata.
6. `assessment-blueprint` — sections, weights, targets, difficulty distribution and rubric.

## HSK 7–9 rule

Vocabulary records sourced from the official advanced list use `hskLevel: "7-9"`; the curriculum may add `pedagogicTargetLevel: 7 | 8 | 9`. This prevents a pedagogic sequencing decision from being misrepresented as an official split.

## Lazy-load boundary for Phase 1

- Load root manifest only at HSK entry.
- Load selected level manifest on level selection.
- Load the active unit/lesson and its referenced content only.
- Prefetch only the next lesson’s small manifest and required assets.
- Never load all HSK 1–9 records on page startup.

## Validation gates

Schema validation is necessary but insufficient. Phase 1 validators must also check unique IDs, references, prerequisite cycles, pinyin, answer/options consistency, source IDs, audio assets, skill coverage, final assessments and duplicate families.
