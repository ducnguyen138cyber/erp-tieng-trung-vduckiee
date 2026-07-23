# HSK Legacy Progress Mapping — Phase 1

No real user progress is migrated in Phase 1. The legacy keys `erp-hsk-state-v2` and `erp-hsk-progress-v2` remain untouched.

Machine-readable review table: `data/hsk/legacy-mapping.json`.

## Current mapping inventory

| Legacy ID pattern | Canonical ID | Status | Confidence | Rule | Main risk |
|---|---|---|---:|---|---|
| `foundation-*` | none | `unmapped` | 0.0 | Review each lesson semantically | Losing foundation completion |
| `hsk1-*` | none | `review-required` | 0.2 | Extract effective V75 IDs and compare objectives | V75 overwrites the earlier HSK 1 array |
| `hsk2-*` | none | `review-required` | 0.2 | Review during Phase 3 | Similar topic names do not prove equivalence |
| `hsk3-*` | none | `review-required` | 0.2 | Review during Phase 4 | Legacy coverage is thinner |
| `hsk4-*` | none | `review-required` | 0.2 | Review during Phase 5 | Order number must not drive mapping |

## Adapter API

`assets/hsk-content/hsk-legacy-compat.js` exports:

- `mapLegacyHskLessonId(legacyId, mappings)`
- `mapLegacyHskProgress(legacyProgress, mappings)`
- `resolveLegacyCompletion(legacyId, legacyProgress, canonicalProgress, mappings)`

Only mappings with `status: "mapped"` and a non-empty canonical ID are converted. Uncertain or missing mappings return `review-required`/`unmapped`, preserve the original completion object and set `writesPerformed: false`.

An unresolved completion returns `completed: null`, not `false`. This prevents “not mapped yet” from being interpreted as “not learned”.
