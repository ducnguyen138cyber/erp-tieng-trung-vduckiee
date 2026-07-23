# Official source extraction staging

This directory is a staging contract, not production curriculum data.

1. Copy `official-extraction-template.json` to a batch-specific working file outside production manifests.
2. Preserve `sourceId`, `syllabusVersion`, source page/table reference and the exact extraction method for every candidate record.
3. Do not infer missing level assignments or grammar entries.
4. Mark Vietnamese text `draft`, `machine-assisted` or `human-reviewed` truthfully.
5. Move a record into canonical level files only after licensing, linguistic and pedagogic review.
6. Never add an import staging file to `data/hsk/manifest.json` as a production level path.
