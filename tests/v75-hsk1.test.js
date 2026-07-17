const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadLessons() {
  let source = '';
  for (let i = 1; i <= 4; i += 1) {
    source += fs.readFileSync(path.resolve(__dirname, `../assets/v75/hsk1-data.part${i}.txt`), 'utf8');
  }
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: 'hsk1-v75-data.js' });
  return sandbox.window.HSK1_V75_LESSONS;
}

test('HSK 1 v75 has 15 lessons and exactly 150 unique words', () => {
  const lessons = loadLessons();
  assert.equal(lessons.length, 15);
  const words = lessons.flatMap((lesson) => lesson.words.map((word) => word[0]));
  assert.equal(words.length, 150);
  assert.equal(new Set(words).size, 150);
});

test('every lesson has 10 words and all required activities', () => {
  const lessons = loadLessons();
  for (const lesson of lessons) {
    assert.equal(lesson.words.length, 10, `${lesson.id}: 10 words`);
    assert.ok(lesson.grammar.length >= 3 && lesson.grammar.length <= 4, `${lesson.id}: 3-4 grammar patterns`);
    assert.ok(lesson.dialogue.length >= 2, `${lesson.id}: dialogue`);
    assert.ok(lesson.reading?.zh && lesson.reading?.vi, `${lesson.id}: reading`);
    assert.ok(Array.isArray(lesson.reading?.options) && lesson.reading.options.length >= 3, `${lesson.id}: reading quiz`);
    assert.ok(lesson.dictation?.zh, `${lesson.id}: dictation`);
  }
});

test('lessons 3, 6, 9, 12 and 15 contain cumulative reviews', () => {
  const lessons = loadLessons();
  const reviewLessons = lessons.map((lesson, index) => lesson.review ? index + 1 : null).filter(Boolean);
  assert.equal(JSON.stringify(reviewLessons), JSON.stringify([3, 6, 9, 12, 15]));
  for (const lessonNumber of reviewLessons) {
    const review = lessons[lessonNumber - 1].review;
    assert.equal(review.dictations.length, 3);
    assert.equal(review.prompts.length, 3);
    assert.ok(review.focus.length >= 3);
  }
});
