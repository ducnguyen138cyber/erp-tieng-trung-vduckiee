const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'assets', 'v79', 'hsk-dictionary');
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
const terms = manifest.chunks.flatMap((name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')));

test('HSK v79 contains more than ten thousand unique entries', () => {
  assert.ok(manifest.termCount >= 10000, `expected 10000+, got ${manifest.termCount}`);
  assert.equal(terms.length, manifest.termCount);
  assert.equal(new Set(terms.map((term) => term.h)).size, manifest.termCount);
  assert.ok(manifest.translatedCount >= 10000, `expected 10000+ Vietnamese meanings, got ${manifest.translatedCount}`);
});

test('HSK v79 covers all official grading bands', () => {
  for (const level of ['1', '2', '3', '4', '5', '6', '7-9']) {
    assert.ok(Number(manifest.levelCounts[level]) > 0, `missing level ${level}`);
    assert.ok(terms.some((term) => term.l.includes(level)), `no term tagged ${level}`);
  }
});

test('HSK records include searchable Hanzi, pinyin and Vietnamese meanings', () => {
  const love = terms.find((term) => term.h === '爱');
  assert.ok(love);
  assert.match(love.p, /ài/i);
  assert.ok(love.m.some((meaning) => /yêu|thích/i.test(meaning)));
  assert.equal(love.t, '愛');

  const advanced = terms.find((term) => term.l.includes('7-9'));
  assert.ok(advanced && advanced.h && advanced.p);
});

test('generated data preserves source attribution and license notice', () => {
  const notice = fs.readFileSync(path.join(dataDir, 'NOTICE.md'), 'utf8');
  assert.match(notice, /CVDICT/);
  assert.match(notice, /CC BY-SA 4\.0/);
  assert.ok(manifest.sources.some((source) => /GF0025-2021/.test(source.name)));
});
