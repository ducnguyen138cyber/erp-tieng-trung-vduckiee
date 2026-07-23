'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { validateRepository } = require('../scripts/hsk-content-lib');

const root = path.resolve(__dirname, '..');

function makeWorkspace() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hsk-phase1-schema-'));
  fs.cpSync(path.join(root, 'data'), path.join(temp, 'data'), { recursive: true });
  return temp;
}

function mutateJson(workspace, relative, mutate) {
  const file = path.join(workspace, relative);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(value);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

test('valid Phase 1 fixture passes schemas and integrity rules', () => {
  const result = validateRepository(root);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.summary.schemas, 8);
  assert.equal(result.summary.errors, 0);
});

test('missing required lesson field fails with file, ID and schema rule', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/lessons/hsk1-fixture-u01-l01.json', (record) => { delete record.titleVi; });
  const result = validateRepository(workspace);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((issue) => issue.id === 'hsk1-fixture-u01-l01' && issue.rule === 'schema' && issue.message.includes('titleVi')));
});

test('invalid HSK level fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/lessons/hsk1-fixture-u01-l01.json', (record) => { record.level = 10; });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.id === 'hsk1-fixture-u01-l01' && issue.rule === 'schema'));
});

test('invalid status fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/hsk2/level.json', (record) => { record.contentStatus = 'complete-ish'; });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.id === 'hsk2' && ['schema', 'status'].includes(issue.rule)));
});

test('duplicate ID fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/vocabulary/hsk1-fixture-vocabulary.json', (document) => {
    document.records[1].id = document.records[0].id;
  });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.rule === 'id-unique'));
});

test('missing reference fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/lessons/hsk1-fixture-u01-l02.json', (record) => {
    record.vocabularyRefs.push('hsk1-fixture-v-does-not-exist');
  });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.id === 'hsk1-fixture-u01-l02' && issue.rule === 'vocabulary-reference'));
});

test('cyclic lesson prerequisite fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/lessons/hsk1-fixture-u01-l01.json', (record) => {
    record.prerequisiteIds = ['hsk1-fixture-u01-l02'];
  });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.rule === 'prerequisite-cycle'));
});

test('production-ready record cannot use review-required source', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/vocabulary/hsk1-fixture-vocabulary.json', (document) => {
    const record = document.records[0];
    record.contentStatus = 'production-ready';
    record.translationReviewStatus = 'human-reviewed';
    record.reviewStatus = 'approved';
    record.sourceIds.push('legacy-cvdict');
  });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.rule === 'production-license-gate'));
});

test('production-ready level requires a valid final assessment reference', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/level.json', (record) => {
    record.contentStatus = 'production-ready';
    record.translationReviewStatus = 'human-reviewed';
    record.productionReady = true;
    record.finalAssessmentId = null;
  });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.id === 'hsk1-fixture' && issue.rule === 'final-assessment-required'));
});

test('cross-level unit reference fails', () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, 'data/hsk/fixtures/hsk1/units/hsk1-fixture-u01.json', (record) => { record.level = 2; });
  const result = validateRepository(workspace);
  assert.ok(result.errors.some((issue) => issue.rule === 'cross-level-reference'));
});
