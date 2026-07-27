# Phase 2B-2 — HSK 1 progress compatibility (dry run only)

## Legacy inventory

The effective production HSK 1 curriculum is V75: 15 lessons and 150 vocabulary items. Legacy state remains authoritative and is read only from:

- `erp-hsk-progress-v2`: lesson completion booleans keyed by legacy lesson ID.
- `erp-hsk-state-v2`: selected `{ level, lesson }`.
- `vduckie-hsk-progress-meta-v1`: completion timestamps and state timestamps.
- `vduckie-hsk-account-cache-v1:<user>` and the synthetic Supabase `user_words` row `__vduckie_hsk_progress_v1__`: account-scoped copies of the same legacy HSK snapshot.
- `VDuckieLocalLearning.prepareForCloud()` / normal `user_words` rows: word-level `is_known`, `is_saved`, and their timestamps.
- `vduckie-hsk-section-progress-v1`, `vduckie-exercise-results-v1`, and `vduckie-review-srs-v1`: inventoried for audit, but not migrated unless a future phase proves an unambiguous HSK 1 vocabulary relationship.

XP, level, leaderboard and streak data belong to separate systems and are not migration inputs.

## Canonical contract

Contract version: `1.0.0`.

A dry-run record is vocabulary-oriented and includes curriculum/owner identity, canonical lesson and vocabulary IDs, learned/saved state, counters, timestamps, source, and migration metadata. The contract is versioned for a later idempotent write phase.

Migrated in Phase 2B-2 preview:

- owner key;
- canonical lesson/vocabulary IDs produced by deterministic mapping;
- learned and saved state from attributable word rows;
- known/saved timestamps;
- source and migration audit metadata.

Not migrated:

- legacy lesson completion;
- selected lesson/level;
- mastered/completion inference;
- quiz/dictation counters without explicit attributable records;
- XP, leaderboard, streak or achievements.

## Mapping rules

Mapping never uses lesson position or array index as evidence. It evaluates, in order:

1. exact simplified Hanzi;
2. normalized Hanzi or traditional Hanzi, constrained by normalized pinyin when needed;
3. normalized pinyin plus Vietnamese meaning overlap;
4. ambiguous or unmatched finding when no unique target is proven.

Duplicate canonical targets are reported separately. Results are sorted and deterministic between runs.

## Safety

`hsk-progress-migration.js` is hard-coded to dry-run mode and has no storage or network writer. The Developer Center bridge captures before/after snapshots of legacy local storage, account cache, word rows and the effective V75 curriculum. Mapping, dry-run, canonical preview and rollback must leave those snapshots byte-equivalent. The reserved canonical storage key is read for verification but never written.

Production flags remain false/locked, Supabase schema is unchanged, and no user data is migrated in Phase 2B-2.
