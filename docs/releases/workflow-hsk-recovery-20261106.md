# Interrupted-session recovery — 6 November 2026

## Recovered state

- `main` was and remains `16d92af` (PR #94). The shipped typing, no-EXP and mascot changes in PRs #89/#90/#92/#93/#94 were not reimplemented.
- Saved demo work was in PR #95, branch `demo/mobile-factory-games`, commits `177b121`, `7062952`, `5a6a125`. Four local edits survived: sentence-game dock overlap, factory-profile translations, translation regression coverage, and backdrop click targeting. These were preserved and pushed as `eb9ff08`.
- The scrollbar-gutter test was fixed in `d56d5b5`; gameplay testing also found a real stale sentence-summary counter. `b57c798` updates the visible completed-count/points alongside the header, with a browser regression.
- This recovery PR is stacked on #95 on `fix/workflow-hsk-recovery`; neither PR is merged. SEO #91 and unrelated HSK7 #37 / vocabulary #23 / audio #2 remain untouched.

## Findings and corrections

The baseline HSK workflow on `main` already failed at its broad website regression step. Content structure validation passed. Its failures mixed obsolete cache IDs, an expectation that PWA did not exist, retired roast/color/mascot UI contracts, and old browser tests that expected every learning section to be visible at once and HSK5–6 to be public.

- Readiness now validates the deployed PWA's private/auth/non-GET bypass, network-first executable caching and exact query-version fallbacks. Negative tests reject missing private bypass and cross-version code fallback. Canonical production, migration and progress-write gates remain closed.
- Runtime inventory executes the actual static document-write bootstrap. It distinguishes the default public shell from the developer-script shell and avoids treating source-string replacement targets as loaded assets.
- Current HSK3–4 browser coverage navigates the four learning tabs, verifies lesson inventories, answers exercises, visits every assessment, switches levels, reloads/direct-links and checks four viewport widths. Auth/database boundaries are mocked. HSK5–6 tests now assert the actual disabled public controls and reject query attempts to enable courses or progress writes.
- Duplicate detection previously rebuilt Unicode normalization and trigram/union sets for every pair. It now caches signatures once, computes Jaccard without a union allocation, and prunes only when the mathematical upper bound cannot reach the threshold. The complete current report is identical; 1,000 random-set comparisons preserve the previous similarity definition. The full-report comparison took about 7.5 seconds in this workspace; CI/shared-machine timing can differ.
- HSK workflow cancels superseded runs, includes `.js`, `.cjs` and `.mjs` tests, and has a separate short browser-contract workflow with screenshots/JSON evidence.

## Validation

- Repository content validator: **10,695 records, 21 sources, 9 schemas; zero errors/warnings**.
- Selected sidebar/cache/auth/EXP/curriculum/UI suite: **110 passed** after the runtime-inventory change.
- Readiness/inventory negative tests and canonical bridge/read-only contract suite: **16 passed**.
- Duplicate parity: **2 passed**, with the complete tracked duplicate findings unchanged.
- Actual Chromium gameplay, public demo and sidebar tests pass on the current demo; performance A/B passed before the independent sentence-summary display fix and is rerun on the final demo commit.
- HSK3–4 actual Chromium smoke passed; the first HSK5–6 recovery run exposed a stale selector for a disabled control (locked controls intentionally have no navigation data attribute). The selector was corrected to the rendered accessible label. Final workflow outcomes and remaining limits are recorded in the PR before review.

No live OAuth flow, database write, reward claim, user-data migration, or HSK5+ publication is part of this recovery.
