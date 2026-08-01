"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { validate } = require("../scripts/hsk2-quality-engine");

const ROOT = path.resolve(__dirname,"..");

test("HSK2 C3 professional curriculum passes schema, coverage, diversity and provenance gates",()=>{
  const result=validate(ROOT);
  assert.equal(result.ok,true,JSON.stringify(result.errors,null,2));
  assert.deepEqual({units:result.summary.units,lessons:result.summary.lessons,vocabulary:result.summary.vocabulary,characters:result.summary.characters,grammar:result.summary.grammar,exercises:result.summary.exercises,assessments:result.summary.assessments},{units:10,lessons:28,vocabulary:200,characters:60,grammar:29,exercises:168,assessments:13});
  assert.equal(result.summary.cumulativeVocabulary,500);
  assert.equal(result.summary.officialRows,"301-500");
  assert.ok(result.summary.exerciseFormats>=20);
  assert.equal(result.summary.exactDuplicates,0);
  assert.equal(result.summary.nearDuplicates,0);
  assert.equal(result.summary.humanSignoffRequired,true);
});

test("HSK2 remains read-only and does not claim verified audio/stroke assets",()=>{
  const result=validate(ROOT);
  assert.equal(result.summary.repositoryErrors,0);
  assert.ok(result.warnings.some((warning)=>warning.rule==="audio-pending"));
  assert.ok(result.warnings.some((warning)=>warning.rule==="stroke-pending"));
  assert.ok(result.warnings.some((warning)=>warning.rule==="human-signoff"));
});
