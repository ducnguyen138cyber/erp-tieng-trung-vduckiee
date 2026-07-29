# Phase 2B-3 — HSK 1 progress mapping human review

## Scope

Phase 2B-3 adds developer-only tooling for the `ambiguous` and `unmatched` findings produced by the Phase 2B-2 deterministic mapping report. It does not change the mapping, migrate progress, or authorize production.

The current repository mapping baseline is:

- 150 legacy vocabulary items;
- 146 exact mappings;
- 0 normalized mappings;
- 0 ambiguous mappings;
- 4 unmatched mappings;
- 0 duplicate targets;
- 97.33% deterministic coverage.

The four unresolved legacy items are `北京`, `小姐`, `前面`, and `后面`. A suggestion is evidence for a human reviewer to inspect, not an automatic mapping.

## Review queue

`hsk-progress-review.js` builds a deterministic queue from the Phase 2B-2 report and canonical vocabulary. Each queue item includes:

- stable legacy identity and source lesson;
- Hanzi, pinyin, Vietnamese meaning, mapping status, and mapping rule;
- up to five sorted candidate suggestions;
- explicit evidence such as Hanzi containment, pinyin similarity, or Vietnamese meaning overlap;
- a mandatory human-decision marker.

Generate the repository queue without writing a file:

```bash
node scripts/hsk1-progress-review-report.js
```

## In-memory decisions

An authorized developer can use Developer Center → Learning to:

- create the human-review queue;
- inspect one unresolved item at a time;
- select an explicit candidate;
- approve the selected candidate in memory;
- explicitly keep an item unmatched;
- inspect the decision manifest;
- reset the review session.

Every decision requires the verified developer identity and an explicit review note. Two legacy items cannot be approved to the same canonical target within one session.

Decisions are preview evidence only:

- `appliedToMapping=false`;
- `writesPerformed=false`;
- `apiWrites=0`;
- `storageWrites=0`;
- reload, logout, bridge disable, or session reset removes them;
- even a fully reviewed preview manifest keeps `productionBlocked=true`.

## Safety and next gate

Phase 2B-3 never writes local storage, canonical storage, Supabase, or legacy progress. Before/after safety snapshots must remain byte-equivalent.

A later phase may consume a separately approved, version-controlled review manifest only after human review has actually been completed. This phase does not create that approval, enable progress writes, change Supabase, unlock the quality gate, or switch production away from legacy HSK 1.
