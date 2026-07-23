# Official HSK Item Extraction Workflow

Phase 1 defines the import contract but does not invent or bulk-extract missing official lists.

## Staging format

Start from `data/hsk/import/official-extraction-template.json`. Each batch records:

- source ID and syllabus version;
- license status at extraction time;
- extraction status;
- reviewer and review notes;
- candidate records with record-level provenance.

## Required process

1. Confirm that the official source is the correct version and that the relevant portion can be stored or transformed under the project’s usage policy.
2. Extract only explicit information. Do not infer missing HSK levels, grammar classifications or separate HSK 7/8/9 vocabulary bands.
3. Preserve source page/table/section provenance in the working batch.
4. Add newly authored Vietnamese meanings, examples and exercises separately from the official extraction.
5. Mark machine-assisted Vietnamese truthfully.
6. Run schema, reference, duplicate and coverage checks.
7. Obtain linguistic, pedagogic and licensing review before changing `contentStatus` to `production-ready`.
8. Keep staging batches outside the production manifest until all gates pass.
