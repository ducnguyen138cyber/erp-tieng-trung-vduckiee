# HSK Source Registry

Machine-readable registry: `data/hsk/sources.json`
Latest curriculum-architecture review: **2026-07-29**

## Version decision

VDuckie uses **GF0025-2021** as the normative nine-level proficiency framework and the current Chinese Test Service HSK 3.0 resources as the examination-blueprint track. They are related but not interchangeable.

HSK 7–9 remains an official combined advanced band for vocabulary/exam implementation. A pedagogic sequence may target Levels 7, 8 and 9, but records must not claim an invented official three-way vocabulary split.

Current exam rollout is also separate from the target blueprint. The CTI notice checked on 2026-07-29 describes the 31 January 2026 HSK 3.0 pilot for Levels 1–6 while regular 2026 sessions continue with HSK 2.0 until a formal changeover announcement. This status must be checked again before every learner-facing release.

Every canonical record must carry `syllabusVersion`, `hskLevel`, `sourceIds` and `contentVersion`. Exam-facing records also carry `examBlueprintVersion`.

## Registry and licensing state

| Source ID | Publisher | Type | Levels | Main scope | Confidence | License status |
|---|---|---|---|---|---|---|
| `moe-gf0025-2021-standard` | Ministry of Education / State Language Commission | official standard | 1–9 | level framework, skills, language items | authoritative | `reuse-limited` |
| `moe-gf0025-2021-qa` | Ministry of Education | official explanation | 1–9 | totals, history, implementation | authoritative | `reuse-limited` |
| `cti-hsk3-current-syllabus-2026` | Chinese Testing International | official exam syllabus | 1–6, 7–9 | tasks, topics, blueprint | authoritative-current | `reuse-limited` |
| `cti-hsk79-first-test-2022` | Chinese Testing International | official announcement | 7–9 | combined advanced test status | authoritative | `reuse-limited` |
| `cti-test-calendar-2026` | Chinese Testing International | current-status source | 1–6, 7–9 | exam implementation calendar | authoritative-current | `reuse-limited` |
| `cti-hsk3-pilot-notice-2026` | Chinese Testing International | official current-status notice | 1–6 | pilot and transition status | authoritative-current | `reuse-limited` |
| `cti-hsk3-competency-profile-2026` | Chinese Testing International | official competency profile | 1–9 | level output descriptors | authoritative-current | `reuse-limited` |
| `blcu-new-standard-pedagogy-2025` | Beijing Language and Culture University | university pedagogy | 1–9 | integrated skills, discourse and academic progression | institutional-pedagogy | `reuse-limited` |
| `cc-cedict-current` | CC-CEDICT/MDBG community | supplemental dictionary | cross-level | pinyin/POS/gloss cross-check | supplemental | `verified` |
| `unicode-unihan-17` | Unicode Consortium | technical character data | cross-level | codepoint/radical/variant checks | authoritative-technical | `verified` |
| `legacy-ivankra-hsk30` | ivankra | derived legacy dataset | 1–6, 7–9 | legacy V79 vocabulary | needs verification | `review-required` |
| `legacy-cvdict` | Phong Phan | derived legacy dictionary | cross-level | Vietnamese legacy glosses | needs human review | `review-required` |

Full URLs, access dates, scopes, license notes and derived-data notes are stored in `data/hsk/sources.json`.

## Claim-to-source boundary

- GF0025-2021 controls the proficiency framework, four quantitative language dimensions and five skills.
- The current CTI syllabus PDF controls exam vocabulary membership/order and the extraction targets for tasks, topics, characters and grammar.
- The CTI pilot notice controls statements about 2026 operational status.
- The CTI competency profile controls the direction of level output descriptors.
- BLCU material supports integrated pedagogy; it cannot create an official word list or exam rule.
- VDuckie design envelopes for text length, audio length, lesson count and speech speed are explicitly pedagogic choices, not official quotas.

## Automatic source gate

A record cannot be `production-ready` when any referenced source has `licenseStatus: "review-required"`. The validator fails the build with `production-license-gate`.

`reuse-limited` means the source can support alignment and short attribution, not bulk republication. Dialogues, examples, exercises, transcripts, distractors and assessments must be newly authored.

## Vietnamese review states

- `draft`: unreviewed working translation.
- `machine-assisted`: machine/AI assistance was used; mandatory human review remains.
- `human-reviewed`: a human reviewer has checked meaning, naturalness and context.

Production-ready records require the appropriate human-reviewed state. No Phase 1 fixture is described as human-reviewed or production-ready.
