# Phase 2B-5 — Large HSK 1 migration simulation

## Scope

Phase 2B-5 is a synthetic, read-only, memory-only simulation of the existing HSK 1 progress dry-run. It does not add a production migration writer, use real profiles, persist a checkpoint, call Supabase, write canonical storage, apply a human-review decision, or alter the production curriculum.

The implementation is internal Node tooling. It is not imported by `index.html`, `app-shell-v88.html`, the Developer Center, or the production runtime, so this phase requires no browser UI or cache-version change.

## Reproduce

Generate the machine-readable report:

```bash
node scripts/hsk1-phase2b5-migration-simulation-report.js --write
```

Run the Phase 2B-5 tests:

```bash
node --test tests/hsk-phase2b5-migration-simulation.test.js
```

The tracked report is `reports/hsk1-phase2b5-migration-simulation-report.json`.

## Fixture and simulation

The fixed seed is `20260729`. The generator creates 100, 1,000, and 10,000 synthetic profiles across 25 categories, including empty, viewed, learned, saved, mastered, quiz, dictation, completion, mixed, missing/extra fields, timestamp variants, duplicates, conflicts, invalid records, reordered records, non-HSK1 data, stale canonical-like state, and unknown legacy IDs.

The engine reuses `hsk-progress-migration.js` for classification and preview records. It provides:

- deterministic batch ordering and configurable batch size;
- pause, resume, cancel, retry, and bounded concurrency;
- signed, versioned, owner-bound in-memory checkpoints;
- transactional batch previews with no partial external state;
- in-memory rollback, rollback-failure visibility, and rollback retry;
- deterministic failure injection by event, profile, batch, code, and seed;
- bounded in-memory telemetry with synthetic identifiers and an injected clock;
- a simulation-only kill-switch contract that always fails closed;
- null/spy production adapters whose actual canonical, storage, Supabase, RPC, and EXP write counts remain zero.

The engine caps fixture size, batch size, retry count, telemetry events, deterministic duration ticks, and concurrent sessions.

## Result and remaining gates

All 40 failure scenarios pass. Small, medium, and large runs are deterministic, batch-size independent, idempotent, rollback-safe, and preserve the legacy before/after hash. The four real unresolved mappings remain `北京`, `小姐`, `前面`, and `后面`; no decision is auto-approved or applied.

Phase 2B-5 completion permits the next read-only/preparation phase to begin. It does not permit real migration or production rollout. Those remain blocked by unresolved human review, the absence of a real migration writer, durable telemetry, an operational production kill switch, staged rehearsal, and explicit production approval. All production flags remain false and `qualityGate` remains `locked`.
