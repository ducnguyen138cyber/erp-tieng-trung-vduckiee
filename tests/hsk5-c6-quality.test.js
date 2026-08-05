'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const hsk5 = path.join(root, 'data', 'hsk', 'hsk5');
const read = (name) => JSON.parse(fs.readFileSync(path.join(hsk5, name), 'utf8'));
const records = (name) => read(name).records;
const manifest = read('course-manifest.json');
const units = records('units.json');
const lessons = records('lessons.json');
const grammar = records('grammar.json');
const characters = records('characters.json');
const exercises = records('exercises.json');
const assessments = records('assessments.json');
const vocabularyIndex = read('vocabulary/index.json');
const vocabulary = vocabularyIndex.shards.flatMap((shard) => records(path.join('vocabulary', shard.file)));

function section(lesson, type) {
  const value = lesson.sections.find((item) => item.type === type);
  assert.ok(value, `${lesson.id} missing ${type}`);
  return value.content;
}
function unique(values, label) {
  assert.equal(new Set(values).size, values.length, label);
}

test('HSK5 C6 inventory and production locks are exact', () => {
  assert.equal(units.length, 20);
  assert.equal(lessons.length, 60);
  assert.equal(vocabulary.length, 1600);
  assert.equal(vocabularyIndex.shards.length, 32);
  assert.equal(grammar.length, 70);
  assert.equal(characters.length, 431);
  assert.equal(exercises.length, 600);
  assert.equal(assessments.length, 24);
  assert.equal(manifest.phase, 'C6');
  assert.equal(manifest.level, 5);
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.writesProgress, false);
  assert.equal(manifest.readOnly, true);
  assert.equal(manifest.qualityGate, 'locked');
});

test('all HSK5 lessons have distinct identity and the complete learner flow', () => {
  const required = ['situation','vocabulary','character','grammar','dialogue','listening','reading',
    'pronunciation','culture-note','guided-practice','independent-practice','summary','review'];
  for (const lesson of lessons) {
    assert.equal(lesson.practiceRefs.length, 8, lesson.id);
    assert.equal(lesson.reviewRefs.length, 2, lesson.id);
    assert.ok(lesson.objectives.some((item) => /collocation|register|discourse/i.test(item)), lesson.id);
    required.forEach((type) => section(lesson, type));
    assert.deepEqual(section(lesson, 'review').spacingDays, [1,3,7,14,30]);
    assert.deepEqual(section(lesson, 'review').vocabularyRefs, lesson.vocabularyRefs);
    assert.ok(section(lesson, 'grammar').grammarNoteVi);
    assert.ok(section(lesson, 'dialogue').registerNoteVi);
    assert.ok(section(lesson, 'listening').listeningNoteVi);
    assert.ok(section(lesson, 'reading').readingStrategyVi);
    assert.ok(section(lesson, 'independent-practice').speakingVi);
    assert.ok(section(lesson, 'independent-practice').writingVi);
    assert.ok(section(lesson, 'independent-practice').realWorldTaskVi);
  }
  unique(lessons.map((x) => x.titleZh), 'duplicate Chinese lesson titles');
  unique(lessons.map((x) => x.titleVi), 'duplicate Vietnamese lesson titles');
  unique(lessons.map((x) => section(x, 'situation').promptVi), 'duplicate situations');
  unique(lessons.map((x) => section(x, 'dialogue').scriptZh), 'duplicate dialogues');
  unique(lessons.map((x) => section(x, 'listening').scriptZh), 'duplicate listening');
  unique(lessons.map((x) => section(x, 'reading').textZh), 'duplicate readings');
  unique(lessons.map((x) => section(x, 'independent-practice').speakingVi), 'duplicate speaking');
  unique(lessons.map((x) => section(x, 'independent-practice').writingVi), 'duplicate writing');
  unique(lessons.map((x) => section(x, 'independent-practice').realWorldTaskVi), 'duplicate real-life task');
});

test('official HSK5 vocabulary, grammar and characters are fully introduced and practiced', () => {
  const introducedVocabulary = lessons.flatMap((lesson) => lesson.vocabularyRefs);
  const reviewedVocabulary = lessons.flatMap((lesson) => section(lesson, 'review').vocabularyRefs);
  assert.equal(introducedVocabulary.length, 1600);
  assert.equal(new Set(introducedVocabulary).size, 1600);
  assert.deepEqual([...reviewedVocabulary].sort(), [...introducedVocabulary].sort());
  const practicedVocabulary = new Set(exercises.flatMap((exercise) => exercise.vocabularyFocus));
  introducedVocabulary.forEach((id) => assert.ok(practicedVocabulary.has(id), id));
  const introducedGrammar = new Set(lessons.flatMap((lesson) => lesson.grammarRefs));
  const practicedGrammar = new Set(exercises.flatMap((exercise) => exercise.grammarFocus));
  assert.equal(introducedGrammar.size, 70);
  introducedGrammar.forEach((id) => assert.ok(practicedGrammar.has(id), id));
  assert.equal(new Set(lessons.flatMap((lesson) => lesson.characterRefs)).size, 431);
  assert.equal(vocabulary[0].officialRow, 2001);
  assert.equal(vocabulary.at(-1).officialRow, 3600);
});

test('HSK5 exercises balance all eight skills and authentic formats', () => {
  const counts = Object.fromEntries([...new Set(exercises.map((x) => x.skill))].map((skill) => [
    skill, exercises.filter((x) => x.skill === skill).length
  ]));
  assert.deepEqual(counts, {
    vocabulary: 60, grammar: 60, listening: 60, reading: 60,
    speaking: 60, writing: 60, translation: 60, integrated: 180
  });
  unique(exercises.map((x) => x.prompt), 'duplicate exercise prompts');
  assert.ok(exercises.every((x) => x.explanationVi && x.acceptedAnswers.length));
  for (const format of ['evidence-based-speaking','authentic-writing-task','controlled-translation',
    'listening-note-taking','integrated-summary','self-review','real-communication-task']) {
    assert.equal(exercises.filter((x) => x.format === format).length, 60, format);
  }
});

test('HSK5 grammar, character and assessment metadata carry the advanced quality signals', () => {
  assert.ok(grammar.every((x) => x.correctExamples.length && x.incorrectExamples.length && x.commonErrorsVi.length));
  assert.ok(grammar.every((x) => x.registerNoteVi && x.spokenWrittenNoteVi && x.communicativeFunctionVi));
  assert.ok(characters.every((x) => Number.isInteger(x.strokeCount) && x.strokeCount > 0));
  assert.ok(characters.every((x) => x.strokeCountSource === 'unicode-collation-stroke-order'));
  assert.equal(assessments.filter((x) => x.assessmentType === 'mini-checkpoint').length, 20);
  for (const id of ['hsk5-assessment-midpoint','hsk5-assessment-final','hsk5-assessment-project','hsk5-assessment-mastery']) {
    assert.ok(assessments.some((x) => x.id === id), id);
  }
  assert.ok(assessments.every((x) => x.rubric.productive >= 80));
});
