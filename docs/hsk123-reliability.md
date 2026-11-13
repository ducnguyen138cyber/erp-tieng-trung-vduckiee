# HSK1–3 reliability audit — working handoff

Branch: `audit/hsk123-content-reliability`. Base: `6fba328c5d74dbfaa1909e6b54e0f6ec4391227e`. Do not merge automatically.

## Scope and reproducibility

All **70 JSON files / 2,906 typed records** under HSK1–3 were parsed. HSK1: 1,439 records (24 lessons, 300 words, 900 sentences, 21 grammar, 120 exercises, 50 characters, 13 assessments, 10 units, 1 level). HSK2: 509 (28 lessons, 200 words, 29 grammar, 168 exercises, 60 characters, 13 assessments, 10 units, 1 level). HSK3: 958 (36 lessons, 500 words, 42 grammar, 252 exercises, 100 characters, 15 assessments, 12 units, 1 level).

Enrichment/provenance documents are in the file/hash inventory, not double-counted as canonical words. Lesson sections are inspected through their parent; they are not extra canonical records. HSK2–3 currently have no sentence shards. Automatic scan is **not** exhaustive linguistic review of examples, translations, dialogues, level appropriateness or mastery.

```sh
python -m pip install -r scripts/hsk123-audit-requirements.txt
node scripts/audit-hsk123-reliability.cjs
node --test tests/hsk123-reliability.test.cjs
```

`reports/hsk123/baseline.json` preserves the initial inventory, item IDs/paths/versions/sources, check states and evidence. `current.json` is regenerated after repairs. Findings count rule occurrences, not unique wrong sentences. Neither a machine pass nor historical `linguistic-reviewed` labels certify independent review.

## Confirmed first findings

- **Critical:** 21 HSK3 grammar source/key mismatches, listed individually in `hsk123-confirmed-findings.json`. Example `hsk3-lesson-04-exercise-2` asks to preserve 我想提高听力，因为平时听得还不够清楚。 but accepts 我终于找到了护照。 These describe different situations. Three similar questions already used self-review on main; they are preserved.
- **High:** 474 numbered Pinyin fields lose intermediate tones in HSK2–3. Example `hsk2-v-0101`: authored ménkǒu but numbered `menkou3`, not `men2 kou3`. Fix must convert the existing authored tone marks, never substitute dictionary-generated pronunciation.
- **High:** 52 listening exercises have no after-answer transcript policy (24 HSK1, 28 HSK2). Runtime displays these scripts before answering.
- **High:** 1,341 HSK1 historical review claims have no version-bound independent reviewer evidence. Current learner flow accepts the labels as mastery evidence. Preserve historical metadata but stop treating it as certification; no user storage migration.
- **High:** four HSK1 reading-evidence objects render as open answers without a rubric.
- **Low:** 124 redundant accepted-answer entries after the existing punctuation normalization.

## Suspected / needs specialist review

- Open translation, paraphrase, use-explanation and reading-explanation questions with exact-string grading need either a clearly exhaustive controlled answer contract or self-review. Format alone does not prove a linguistic error.
- 41 phonetic alignments fail conservatively, often because 儿化 merges a syllable. Do not auto-correct.
- Character-level reading differences include valid neutral tones, sandhi and polyphones. They are explicitly suspects, not confirmed errors. pypinyin is a machine reference, not an authoritative pronunciation verdict.
- Contextual semantic review of examples, discourse naturalness, Vietnamese translations and level fit requires independent expertise. Sources asserting an official HSK version also need primary-source verification; source existence is not source correctness.

## Review policy

`unreviewed → machine-checked → human-reviewed → approved`. Machine state is an audit sidecar bound to IDs/content versions and file hashes. Independent promotion requires a named reviewer, review date, source/reference, scope, independence and matching content version. This task creates no independent signatures and never opens `qualityGate`.

## Remaining implementation and validation

Checkpoint 1: inventory + deterministic checks + confirmed/suspected evidence. Next: remove unsafe grading, fix verified representation defects, add regression tests and review workflow validation; then desktop/mobile journeys for first/middle/last lessons. Browser/CI results, repaired counts, pass rates, provenance verification and preview will be appended. **Task not yet accepted; browser journeys have not yet been run for this branch.**
