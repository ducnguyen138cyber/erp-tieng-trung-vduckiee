# HSK Content Foundation — Phase 1

## Safety boundary

The canonical curriculum exists as a locked, read-only foundation. It is not wired into `index.html`, `community.js` or the legacy HSK runtime.

- `productionEnabled`: `false`
- `publicOverrideAllowed`: `false`
- quality gate: `locked`
- progress writes: disabled
- old curriculum remains the production source of truth

The Phase 1 fixture is developer/test-only and is not a completed HSK 1 curriculum.

## Data layout

- `data/hsk/manifest.json`: canonical root manifest and nine planned levels.
- `data/hsk/sources.json`: machine-readable source registry.
- `data/hsk/schemas/*.schema.json`: eight JSON Schema contracts.
- `data/hsk/hsk1` through `hsk9`: planned level manifests only.
- `data/hsk/fixtures`: small architecture proof.
- `data/hsk/import`: reviewed extraction staging contract.

A planned level contains no lessons, assessments or UI-ready placeholder cards. `productionReady` remains false.

## Loader API

`assets/hsk-content/hsk-content-loader.js` exports:

- `createHskContentLoader(options)`
- `loadHskManifest()`
- `loadHskLevel(level)`
- `loadHskUnit(level, unitId)`
- `loadHskLesson(level, lessonId)`
- `loadHskAssessment(level, assessmentId)`
- `clearHskContentCache()`
- `getHskContentLoaderState()`

The loader:

- loads only the requested manifest/level/unit/lesson;
- caches successful requests only;
- removes failed requests from cache;
- applies a timeout and `AbortController` when available;
- distinguishes missing file, invalid JSON, invalid runtime schema and mismatched IDs;
- uses relative paths compatible with Cloudflare Pages and GitHub Pages;
- never hard-codes the production domain.

## Feature access

`assets/hsk-content/hsk-content-feature-flags.js` ignores public query-string hints. Canonical preview requires an already-authorized developer context and remains read-only. The module is intentionally not included in the production page loader during Phase 1.

## Quality commands

```bash
node scripts/validate-hsk-content.js
node scripts/check-hsk-duplicates.js
node scripts/check-hsk-coverage.js
node scripts/generate-hsk-report.js
```

Validation errors include file, record ID and rule, and return a non-zero exit code. Duplicate blockers also return a non-zero exit code.
