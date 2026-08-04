'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const hsk4 = path.join(root, 'data', 'hsk', 'hsk4');
const read = (name) => JSON.parse(fs.readFileSync(path.join(hsk4, name), 'utf8'));
const records = (name) => read(name).records;
const vocabulary = read('vocabulary/index.json');
const lessons = records('lessons.json');
const exercises = records('exercises.json');
const grammar = records('grammar.json');
const characters = records('characters.json');
const units = records('units.json');
const assessments = records('assessments.json');
const manifest = read('course-manifest.json');

function section(lesson, type) {
  const found = lesson.sections.find((item) => item.type === type);
  assert.ok(found, `${lesson.id} missing ${type}`);
  return found.content;
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, label);
}

test('HSK4 C5 has the locked professional curriculum inventory', () => {
  assert.equal(units.length, 16);
  assert.equal(lessons.length, 48);
  assert.equal(vocabulary.expectedCount, 1000);
  assert.equal(vocabulary.shards.length, 20);
  assert.equal(grammar.length, 76);
  assert.equal(characters.length, 150);
  assert.equal(exercises.length, 384);
  assert.equal(assessments.length, 20);
  assert.equal(manifest.level, 4);
  assert.equal(manifest.phase, 'C5');
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.writesProgress, false);
  assert.equal(manifest.readOnly, true);
  assert.equal(manifest.qualityGate, 'locked');
});

test('every HSK4 lesson has a distinct authored learning situation and complete flow', () => {
  const required = [
    'situation', 'vocabulary', 'character', 'grammar', 'dialogue', 'listening', 'reading',
    'pronunciation', 'culture-note', 'guided-practice', 'independent-practice', 'summary', 'review'
  ];
  for (const lesson of lessons) {
    assert.equal(lesson.practiceRefs.length, 8, lesson.id);
    assert.ok(lesson.objectives.some((item) => /register|collocation|discourse/i.test(item)), lesson.id);
    for (const type of required) section(lesson, type);
    assert.equal(section(lesson, 'review').vocabularyRefs.length, lesson.vocabularyRefs.length, lesson.id);
    assert.deepEqual(section(lesson, 'review').spacingDays, [1, 3, 7, 14, 30]);
    assert.ok(section(lesson, 'dialogue').registerNoteVi, lesson.id);
    assert.ok(section(lesson, 'listening').listeningNoteVi, lesson.id);
    assert.ok(section(lesson, 'reading').readingStrategyVi, lesson.id);
    assert.ok(section(lesson, 'grammar').grammarNoteVi, lesson.id);
    assert.ok(section(lesson, 'independent-practice').speakingVi, lesson.id);
    assert.ok(section(lesson, 'independent-practice').writingVi, lesson.id);
    assert.ok(section(lesson, 'independent-practice').realWorldTaskVi, lesson.id);
  }
  unique(lessons.map((item) => item.titleZh), 'duplicate Chinese lesson titles');
  unique(lessons.map((item) => item.titleVi), 'duplicate Vietnamese lesson titles');
  unique(lessons.map((item) => section(item, 'situation').promptVi), 'duplicate situations');
  unique(lessons.map((item) => section(item, 'dialogue').scriptZh), 'duplicate dialogues');
  unique(lessons.map((item) => section(item, 'listening').scriptZh), 'duplicate listening scripts');
  unique(lessons.map((item) => section(item, 'reading').textZh), 'duplicate reading passages');
  unique(lessons.map((item) => section(item, 'independent-practice').speakingVi), 'duplicate speaking tasks');
  unique(lessons.map((item) => section(item, 'independent-practice').writingVi), 'duplicate writing tasks');
  unique(lessons.map((item) => section(item, 'independent-practice').realWorldTaskVi), 'duplicate real-life tasks');
});

test('HSK4 distributes all official vocabulary once and retrieves every item', () => {
  const introduced = lessons.flatMap((lesson) => lesson.vocabularyRefs);
  const reviewed = lessons.flatMap((lesson) => section(lesson, 'review').vocabularyRefs);
  assert.equal(introduced.length, 1000);
  assert.equal(new Set(introduced).size, 1000);
  assert.deepEqual([...reviewed].sort(), [...introduced].sort());
  assert.equal(new Set(reviewed).size, 1000);
  const practiced = new Set(exercises.flatMap((exercise) => exercise.vocabularyFocus || []));
  for (const id of introduced) assert.ok(practiced.has(id), id);
});

test('HSK4 exercises balance receptive, productive, discourse and self-review work', () => {
  const counts = exercises.reduce((result, item) => {
    result[item.skill] = (result[item.skill] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, {
    vocabulary: 48,
    grammar: 48,
    listening: 48,
    reading: 48,
    speaking: 48,
    writing: 48,
    integrated: 96
  });
  assert.equal(new Set(exercises.map((item) => item.prompt)).size, exercises.length);
  assert.ok(exercises.every((item) => item.explanationVi && item.acceptedAnswers.length > 0));
  assert.equal(exercises.filter((item) => item.format === 'self-review').length, 48);
  assert.equal(exercises.filter((item) => item.format === 'authentic-writing-task').length, 48);
  assert.equal(exercises.filter((item) => item.format === 'evidence-based-speaking').length, 48);
});

test('HSK4 grammar and character metadata do not use placeholder technical facts', () => {
  assert.ok(grammar.every((item) => item.correctExamples.length && item.commonErrorsVi.length));
  assert.ok(grammar.every((item) => item.registerNoteVi && item.spokenWrittenNoteVi));
  assert.ok(characters.every((item) => Number.isInteger(item.strokeCount) && item.strokeCount > 0));
  assert.ok(characters.every((item) => ['bundled-static-vector-count', 'unicode-unihan-17-kTotalStrokes'].includes(item.strokeCountSource)));
  assert.ok(characters.every((item) => ['static-fallback', 'unavailable'].includes(item.strokeOrderStatus)));
});

test('HSK4 assessment ladder includes all checkpoints and production-heavy gates', () => {
  assert.equal(assessments.filter((item) => item.assessmentType === 'mini-checkpoint').length, 16);
  for (const id of [
    'hsk4-assessment-midpoint', 'hsk4-assessment-final', 'hsk4-assessment-mastery', 'hsk4-assessment-project'
  ]) assert.ok(assessments.some((item) => item.id === id), id);
  assert.ok(assessments.every((item) => item.rubric.productive >= 78));
});
