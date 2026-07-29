# Phase 2B-4 — HSK 1 production-readiness audit

## Scope and conclusion

Phase 2B-4 audits the canonical HSK 1 preview, legacy isolation, progress compatibility, in-memory review, developer authorization, cache/deployment behavior, and every adjacent write boundary. It does not approve a review decision, run a real migration, enable canonical progress writes, change Supabase, or open production.

The deterministic machine-readable result is `reports/hsk1-production-readiness-report.json`. Regenerate it with:

```bash
node scripts/hsk1-production-readiness-audit.js --write
```

The current matrix has 18 dimensions: 15 pass, 3 warning, and 0 fail. Phase 2B-5 may begin after this phase passes. Real migration and production remain blocked.

## Audit findings and hardening

The audit reproduced and fixed these blocking defects:

- The V75 runtime shards were joined across a newline inside `patchDictation`, producing a production `SyntaxError` and leaving the older eight-lesson fallback active. The loader now normalizes shard seams, all V75 data/runtime bundles are parsed in the audit, and the production dependency is cache-busted.
- A failed canonical load retained successful index/shard promises, allowing a retry to mix partial in-memory cache from different deployment moments. Any canonical load failure now purges the whole HSK 1 canonical cache while retaining a developer-readable error.
- The canonical runtime loader accepted duplicate IDs and did not enforce per-shard count or ID boundaries. It now rejects missing/duplicate IDs, shard count mismatch, and first/last ID mismatch.
- A review item could be decided twice in one RAM session. Review queues and exported manifests now validate signatures, canonical/legacy IDs, candidate membership, duplicate review IDs, duplicate decisions, duplicate targets, and stale manifests.
- A partial canonical activation or interrupted rollback could leave runtime curriculum canonical while preview state reported an error. Selection, rollback, and bridge cleanup now force legacy restoration and report failure explicitly.
- An authorization request could complete after the live session changed. The runtime now rechecks the current user immediately before creating a bridge, invalidates in-flight authorization on disable, restores legacy on an unauthorized bridge call, and cleans stale controller bridges/listeners.
- Existing account-learning and EXP listeners observed canonical quiz/dictation UI even though the HSK runtime itself was read-only. Runtime guards now reject those events before localStorage, profile upload, learning evidence, or EXP RPC boundaries.

No business behavior changes for legacy production learning. The canonical curriculum and every canonical progress write remain disabled.

## Safety evidence

The Phase 2B-4 tests cover:

- canonical index 404;
- vocabulary/sentence shard failure;
- malformed JSON;
- shard count mismatch;
- duplicate canonical ID;
- partial cache cleanup and clean retry;
- input-order-independent mapping and dry-run;
- mapping/review engine exceptions;
- malformed queue and decision;
- unknown canonical/legacy/review IDs;
- duplicate decision and target;
- stale decision manifest;
- storage read failure;
- partial activation and interrupted rollback;
- regular user, verified developer, logout, permission revocation, reload, and two tabs;
- four required viewport sizes;
- canonical load failure in Chromium;
- zero canonical storage, Supabase upsert/RPC, EXP, and legacy-state changes during preview, dry-run, and review.

The write inventory is embedded in the machine-readable report. Existing legacy writes remain available only for their legacy business flows; canonical actions are rejected at the runtime boundary.

## Remaining warnings

Four human-review items remain unresolved and unapplied: `北京`, `小姐`, `前面`, and `后面`. This is not a Phase 2B-4 failure and does not block read-only Phase 2B-5 simulation.

Real migration and production are still blocked because:

- human review is incomplete;
- Phase 2B-5 has not run;
- no real migration writer exists;
- no operational write kill switch or durable migration telemetry exists;
- canonical progress writes are disabled;
- `productionEnabled=false`, `publicOverrideAllowed=false`, and `qualityGate="locked"`;
- release-readiness coverage remains 81.82%.
