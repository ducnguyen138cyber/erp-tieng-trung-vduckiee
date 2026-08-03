'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { checkCoverage } = require('../scripts/hsk-content-lib');
const lessons = require('../data/hsk/hsk3/lessons.json').records;

test('HSK3 schedules every introduced word for active spaced retrieval', () => {
  for (const lesson of lessons) {
    const review = lesson.sections.find((section) => section.type === 'review');
    assert.ok(review, `${lesson.id} is missing spaced review`);
    assert.deepEqual(
      [...review.content.vocabularyRefs].sort(),
      [...lesson.vocabularyRefs].sort(),
      `${lesson.id} spaced review must cover every introduced word`
    );
    assert.deepEqual(review.content.spacingDays, [1, 3, 7, 14, 30]);
  }

  const hsk3 = checkCoverage(path.resolve(__dirname, '..')).levels.find((level) => level.level === 3);
  assert.ok(hsk3);
  assert.deepEqual(hsk3.vocabularyIntroducedButNotPracticed, []);
  assert.deepEqual(hsk3.grammarWithoutExercise, []);
});
