# HSK1–3 reliability audit — implementation handoff

**Current Vietnamese handoff: [hsk123-bao-cao.md](hsk123-bao-cao.md).** The checkpoints below preserve discovery history. Final scope: 27 Critical, 2,134 High, 124 Low findings corrected; 2,173 records edited; 430 machine suspects remain for contextual review; independent review 0%.

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

## Checkpoint 2–3: repairs and QA implemented (2026-11-13)

- **2,119 unique records edited** with per-field before/after and reasons in `hsk123-content-changes.json`. Existing IDs, authored Hanzi, tone-mark Pinyin and vocabulary meanings are preserved.
- Corrected **474** numbered Pinyin representations (112 HSK2, 362 HSK3); only conversion of existing authored tones, not guessed new pronunciations.
- Removed **1,474** unsupported review labels (1,341 canonical HSK1 records + 133 enrichment entries). They now explicitly say `unreviewed`. Previous values remain in the change ledger. C1/C2 editorial generators no longer assign linguistic-review labels themselves.
- **21 Critical** HSK3 source/key mismatches now use the meaning of the existing grammar example as the actual task, and rubric self-review. The unrelated source has been removed; no wrong automatic key remains.
- **12 High** HSK3 listening prompts were subsequently confirmed mismatched against their lesson's actual listening answerKey. They now ask the corresponding detail question and self-review meaning, rather than claiming sequence/attitude assessment.
- Concealed **52** listening transcripts before answering. Runtime also defaults to concealing scripts for all HSK1–3 listening exercises, preventing omission of metadata from reintroducing the leak.
- Restored four missing HSK1 reading-evidence rubrics; removed redundant equivalent answer entries. Open production/explanation/semantic listening answers use explicit self-review and retain valid models as references after submission. Literal dictation and finite choices still grade normally.
- Mastery for HSK1–3 now requires independent, version-bound reviewer evidence. Historical completion is preserved; no canonical learner-data migration, account or storage-format change. HSK4 retains its previous public behavior; HSK5–6 remain locked.
- Review policy validates ordered events, content hashes/versions, reviewer/date/reference/independence, and separate approver for approval. Current review events are **empty**. Optional attestation schema fields do not create a review or unlock production.
- CI now regenerates the reliability report and checks its committed snapshot. New regressions exercise real DOM conceal/reveal, wrong-key refusal for open tasks, explicit finite grading, non-certifying legacy labels, stale/fabricated event rejection, and preserved old completion.

### Correction examples

| ID | Hán / Pinyin / Việt | Before | After |
|---|---|---|---|
| `hsk2-v-0101` | 门口 · ménkǒu · cửa ra vào | `menkou3` loses mén's tone | `men2 kou3`; authored Hanzi/Pinyin/meaning unchanged |
| `hsk3-v-0201` | 健康 · jiànkāng · sức khỏe; khỏe mạnh | `jiankang1` loses jiàn's tone | `jian4 kang1`; authored Hanzi/Pinyin/meaning unchanged |
| `hsk3-lesson-04-exercise-2` | 我终于找到了护照。 · Wǒ zhōngyú zhǎodào le hùzhào. · Cuối cùng tôi đã tìm thấy hộ chiếu. | Accepted this unrelated answer while asking to rewrite a statement about improving listening | Task now explicitly asks to express the matching Vietnamese meaning with the result complement; example is a reference after submission, rubric does not impose one correct string |

### Metrics and limitations

Current mechanical checks: **2,906/2,906 canonical records pass the implemented checks (100%)**. Another **833 enrichment entries** have shape/review-label checks (133/200/500 by level); they are not extra canonical words. Independently reviewed: **0/2,906 (0%)**, and no independent review asserted for enrichment.

Confirmed corpus findings identified so far: **21 Critical, 2,016 High, 124 Low** rule occurrences (includes later discoveries); all corrected in the checked scope. This counts issue occurrences, not 2,161 different wrong sentences. Remaining machine linguistic triage: **326 suspects** (41 conservative alignment failures, 285 character-reading differences). Many are valid 儿化, neutral tones or sandhi; these are not 326 confirmed pronunciation errors.

Specialist queue: verify the 326 phonetic flags by context, the 21 repaired grammar tasks' teaching fit, 12 corrected listening tasks, all open-answer rubrics and models, and contextual Hanzi/Pinyin/meaning/grammar/dialogue/level fit not certified by schema. Existing lesson-objectives such as hearing four tones are not proved by a number dictation alone. Listening uses draft TTS, not independently verified recordings. Dictionary/Shadowing do not consume numbered-Pinyin fields or exercise answer keys; their existing Hanzi, marked Pinyin and meanings were not altered. No claim that their entire linguistic content is correct.

The historical C2 patch document is retained as provenance, not a new review signature. Legacy HSK2/3 corpus generators can still overwrite editorial corrections if run indiscriminately; the new corpus audit/regression is the merge guard. Do not regenerate the corpus wholesale to apply this PR.

Primary machine-tool reference: https://github.com/mozillazg/python-pinyin (pinned 0.55.0). Machine dictionary readings are triage references, not independent professional evidence.

Local relevant regression: **74 tests passed, 0 failed** at checkpoint 2–3. The earlier test demanding `linguistic-reviewed` by label was corrected to require honest `unreviewed` machine-assisted content, with new independent-evidence regressions; it was not skipped. Whole repository schema validation: 10,695 records, 0 errors (this is structural validation only, not a semantic audit of HSK4+). Desktop/mobile browser sampling and CI are still pending at this checkpoint.
