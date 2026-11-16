# HSK5–6 self-study release

HSK5 exposes 60 lessons across 20 units; HSK6 exposes 72 lessons across 24 units. Vocabulary inventories remain 1,600 and 1,800 entries. Existing lesson, exercise and word IDs are retained, so the additive study journal can resume lessons, save answers and schedule reviews without replacing previous HSK or MSUTONG progress.

The archived advanced corpus contains arbitrary word substitutions in dialogues/readings, context questions with unrelated keys, generated confusable-word claims, and self-referential dictionary glosses. The public learner loads `hsk-advanced-self-study-v1.js` and `advanced-cases-v1.json` before exposing these levels. If the supplement cannot be loaded or a unit case is missing, loading fails explicitly; it does not fall back to the problematic templates.

The supplement contains 44 original fictional cases, one per unit. The three lessons in a unit reuse that case for comprehension, analysis and application alongside the existing vocabulary, grammar and character sequence. Chinese case sentences have Vietnamese translations. Dialogue, TTS listening, reading and open exercises are grounded in those sentences. This is deliberate repeated practice, not 132 independent long-form reading passages.

All 1,464 advanced exercises are available. The 204 vocabulary questions ask explicitly for a dictionary meaning and Pinyin rather than asserting that an arbitrary word solves a scenario. Other responses use inspectable reference text and Vietnamese self-review criteria. Grammar tasks use the meaning and model from their own grammar example. Listening exercise transcripts remain hidden until submission. Open responses are not automatically marked correct or counted as independently verified mastery.

The 33 HSK6 self-referential/variant glosses are resolved using matching CVDICT headword/Pinyin entries or expanded cross-references. Attribution: CVDICT by Phong Phan, CC BY-SA 4.0, based on CC-CEDICT; see `data/dictionary/cvdict-v1/ATTRIBUTION.md`. Unsupported generated collocations and unrelated confusable labels are suppressed in the advanced learner. Word examples shown by the supplement come from its actual bilingual cases; not every word has a case example.

Canonical manifests remain read-only and their review gates stay locked. No human review signatures or official exam certification are asserted. The self-study journal is separate from canonical content; it now accepts levels 1–6. Levels 7–9 stay unavailable. The release does not add HSK5–6 official mock exams or Shadowing audio recordings; listening uses browser TTS.

The word EXP RPC accepts HSK1–6 with the existing authenticated-only execution grant, +3 EXP per distinct word, global 50-word daily cap, transaction lock and deduplication. The migration only extends the allowed level range and rejects a null level; historical EXP is preserved. The accompanying SQL test uses a transaction and rolls back all fixture awards.

Validation covers all prepared lessons/exercises, missing-case failure, journal reload/review behavior and compatibility with existing HSK1–4. Browser CI samples first/middle/last lessons at four desktop/mobile sizes, exercises all stages and assessments, and checks navigation, reload, transcript conceal/reveal and saved progress.
