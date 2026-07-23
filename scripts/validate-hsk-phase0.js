#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const audit=json("reports/hsk-phase0-audit.json"),gaps=json("reports/hsk-coverage-gap-report.json"),schema=json("docs/schemas/hsk-content.schema.json");
assert.equal(audit.auditedHead.length,40);
assert.equal(audit.sourceRegistrySummary.sourceIds.length,9);
assert.equal(new Set(audit.sourceRegistrySummary.sourceIds).size,9);
assert.ok(audit.sourceRegistrySummary.officialSourceCount>=5);
assert.equal(audit.plannedCurriculum.levels.length,9);
assert.deepEqual(audit.plannedCurriculum.levels.map(x=>x.level),[1,2,3,4,5,6,7,8,9]);
for(const x of audit.plannedCurriculum.levels){assert.ok(x.plannedLessons>=x.range[0]&&x.plannedLessons<=x.range[1],`HSK${x.level} range`);}
for(const x of audit.plannedCurriculum.levels.filter(x=>x.level>=7)){assert.equal(x.officialVocabularyBand,"7-9");assert.equal(x.officiallySplitVocabulary,false);}
assert.equal(audit.currentArchitecture.effectiveOverrides[0].effectiveLessons,15);
assert.equal(audit.contentInventory.levels.find(x=>x.level===5).effectiveLessons,0);
assert.equal(audit.duplicateBaseline.corpusParsed,false);
assert.equal(audit.qualityGate.productionGate,"blocked");
assert.equal(new Set(gaps.gaps.map(x=>x.id)).size,gaps.gaps.length);
assert.ok(schema.$defs.lesson.required.includes("sourceIds"));
assert.ok(schema.$defs.exercise.required.includes("templateFamily"));
assert.ok(schema.$defs.level.required.includes("finalAssessmentId"));
console.log(JSON.stringify({ok:true,sources:9,levels:9,gaps:gaps.gaps.length,plannedLessons:audit.plannedCurriculum.totalLessons},null,2));
