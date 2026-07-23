'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { checkCoverage, checkDuplicates, generateReports } = require('../scripts/hsk-content-lib');

const root = path.resolve(__dirname, '..');

function makeWorkspace() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hsk-phase1-quality-'));
  fs.cpSync(path.join(root, 'data'), path.join(temp, 'data'), { recursive: true });
  fs.mkdirSync(path.join(temp, 'reports'), { recursive: true });
  return temp;
}

function appendExercise(workspace, mutate) {
  const file = path.join(workspace, 'data/hsk/fixtures/hsk1/practice/hsk1-fixture-exercises.json');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const record = JSON.parse(JSON.stringify(document.records[0]));
  mutate(record);
  document.records.push(record);
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

test('intentional spaced review is reported but is not a serious duplicate blocker', () => {
  const report = checkDuplicates(root);
  assert.equal(report.summary.blockers, 0);
  assert.ok(report.summary.intentionalReviews >= 1);
  assert.ok(report.findings.some((finding) => finding.intentionalReview && finding.rule === 'exact-duplicate'));
});

test('exact duplicate without review metadata is a blocker', () => {
  const workspace = makeWorkspace();
  appendExercise(workspace, (record) => {
    record.id = 'hsk1-fixture-ex-duplicate-exact';
    record.reviewMetadata = null;
  });
  const report = checkDuplicates(workspace);
  assert.ok(report.findings.some((finding) => finding.rule === 'exact-duplicate' && finding.severity === 'critical'));
  assert.ok(report.summary.blockers > 0);
});

test('normalized duplicate is detected', () => {
  const workspace = makeWorkspace();
  appendExercise(workspace, (record) => {
    record.id = 'hsk1-fixture-ex-duplicate-normalized';
    record.prompt = ' 你好， có nghĩa phù hợp nhất là gì ? ';
    record.reviewMetadata = null;
  });
  const report = checkDuplicates(workspace);
  assert.ok(report.findings.some((finding) => finding.rule === 'normalized-duplicate'));
});

test('name or number mutation is marked for review', () => {
  const workspace = makeWorkspace();
  const file = path.join(workspace, 'data/hsk/fixtures/hsk1/practice/hsk1-fixture-exercises.json');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const base = JSON.parse(JSON.stringify(document.records[5]));
  base.id = 'hsk1-fixture-ex-number-mutation-a';
  base.prompt = 'Sắp xếp thành câu giới thiệu tên: 安 / 我 / 叫';
  const changed = JSON.parse(JSON.stringify(base));
  changed.id = 'hsk1-fixture-ex-number-mutation-b';
  changed.prompt = 'Sắp xếp thành câu giới thiệu tên: 林 / 我 / 叫';
  document.records.push(base, changed);
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  const report = checkDuplicates(workspace);
  assert.ok(report.findings.some((finding) => ['name-or-number-mutation', 'near-duplicate'].includes(finding.rule)));
});

test('coverage counts skills and learning-target use correctly', () => {
  const report = checkCoverage(root);
  const fixture = report.fixtures[0];
  assert.equal(fixture.units, 1);
  assert.equal(fixture.lessons, 2);
  assert.equal(fixture.vocabulary, 10);
  assert.equal(fixture.grammar, 3);
  assert.equal(fixture.characters, 2);
  assert.equal(fixture.assessments, 1);
  assert.equal(fixture.checkpoints, 1);
  for (const skill of ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing']) assert.ok(fixture.exercisesBySkill[skill] > 0, skill);
  assert.deepEqual(fixture.vocabularyIntroducedButNotPracticed, []);
  assert.deepEqual(fixture.grammarWithoutExercise, []);
});

test('planned levels are never reported complete', () => {
  const report = checkCoverage(root);
  assert.equal(report.levels.length, 9);
  assert.ok(report.levels.every((level) => level.status === 'planned' && level.complete === false && level.productionReady === false));
});

test('reports are deterministic across repeated generation', () => {
  const workspace = makeWorkspace();
  generateReports(workspace);
  const first = fs.readdirSync(path.join(workspace, 'reports')).sort().map((name) => [name, fs.readFileSync(path.join(workspace, 'reports', name), 'utf8')]);
  generateReports(workspace);
  const second = fs.readdirSync(path.join(workspace, 'reports')).sort().map((name) => [name, fs.readFileSync(path.join(workspace, 'reports', name), 'utf8')]);
  assert.deepEqual(second, first);
});
