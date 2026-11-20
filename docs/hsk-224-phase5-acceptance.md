# HSK1–4 — Phase 5 acceptance (2026-11-09)

**PR:** #112, branch `feat/hsk-224-exam-upgrade`. **Decision: BLOCKED — keep Draft, do not merge.**

## What was verified

- A new targeted test, `tests/hsk-exam-real-data-phase5.test.mjs`, reads the repository's actual vocabulary shard indexes and all 40 shard files (HSK1 6, HSK2 4, HSK3 10, HSK4 20), constructs all 56 paper variants per level, checks contract validation, stable legacy IDs, answer options, feedback source provenance, perfect/blank scoring, and unreviewed status. CI result must be checked before claiming this entire test passed.
- Direct connector-executed JavaScript tests using actual repository vocabulary: HSK1 **56/56** (300 records), HSK2 **56/56** (200 records), HSK3 **56/56** (500 records). All tested paper contracts and full-answer grading passed.
- HSK4 direct tests: **56/56** with actual shards 1–10 (500 records), and separately **56/56** with shards 11–20 (500 records). These are two subsets, **not** verification of the entire 1,000-record dataset in one build; the new CI test covers the complete dataset.
- Prior phase-4 synthetic-data tests checked grading and feedback across 224 variants; synthetic fixtures do not prove quality of real learning content.

## Outstanding gates

1. **Content quality:** 224 deterministic paper variants are assembled from vocabulary. They are not 224 independently written, teacher-reviewed exams. All question review statuses remain `unreviewed`; there is no verified source-specific proof that listening passages, comprehension, contextual tasks and writing distribution replicate official exams. Do not claim these 224 papers are certified or realistic HSK simulations. The number of fully editorially approved papers is **0 verified**.
2. **CI:** GitHub Actions `Sidebar stability` fails at `Cache, auth, EXP, daily learning and layout unit regressions`. Root cause is not determined; do not label it a pre-existing failure without baseline proof. HSK Content Quality, HSK learner browser contracts and typing-game runs must finish and pass, or their failures must be triaged.
3. **Interactive testing:** No real-browser authenticated end-to-end completion of a full HSK1, HSK2, HSK3, and HSK4 paper across desktop/mobile has been established in this acceptance pass. TTS pronunciation and voice availability depend on actual devices; automated structural checks cannot certify quality.
4. **Backward compatibility:** Legacy `vduckie-hsk-practice-exams-v2` result key and paper IDs remain preserved by implementation, but full account/device persistence and collision scenarios are not independently accepted here.

## Safe next action

- Wait for/check the **latest PR head's** CI; fix confirmed regressions in scope, run targeted tests and one related regression, and verify at least one full real-browser paper submission per level.
- Conduct human editorial review and build sufficient varied source-backed questions before marking any paper approved.
- Keep PR #112 Draft and main untouched until the quality and CI gates above are satisfied.

**Terminology:** `224/224 generated and structurally valid` is a technical claim, not a statement that 224 independently authored exams are ready for public use.
