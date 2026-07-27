'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const migration = require('../assets/hsk-content/hsk-progress-migration');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function loadLegacyLessons(root) {
  let source = '';
  for (let part = 1; part <= 4; part += 1) {
    source += fs.readFileSync(path.join(root, 'assets', 'v75', `hsk1-data.part${part}.txt`), 'utf8');
  }
  const window = {};
  vm.runInNewContext(source, { window }, { filename: 'hsk1-v75-data.js' });
  const lessons = window.HSK1_V75_LESSONS;
  if (!Array.isArray(lessons) || lessons.length !== 15) throw new Error('Expected 15 V75 HSK1 lessons.');
  const count = lessons.reduce((total, lesson) => total + (lesson.words || []).length, 0);
  if (count !== 150) throw new Error(`Expected 150 V75 vocabulary items, received ${count}.`);
  return lessons;
}

function loadCanonicalVocabulary(root) {
  const directory = path.join(root, 'data', 'hsk', 'hsk1', 'vocabulary');
  const index = readJson(path.join(directory, 'index.json'));
  const records = index.shards.flatMap((shard) => readJson(path.join(directory, shard.file)).records || []);
  if (records.length !== 300) throw new Error(`Expected 300 canonical vocabulary records, received ${records.length}.`);
  return records;
}

function canonicalLessons(vocabulary) {
  const lessons = [];
  for (let offset = 0; offset < vocabulary.length; offset += 20) {
    lessons.push({
      id: `hsk1-canonical-preview-${String(lessons.length + 1).padStart(2, '0')}`,
      words: vocabulary.slice(offset, offset + 20).map((item) => [item.simplified, item.pinyin, item.meaningVi, '', '', [], item.id])
    });
  }
  return lessons;
}

function generate(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const legacyLessons = loadLegacyLessons(root);
  const canonicalVocabulary = loadCanonicalVocabulary(root);
  return migration.buildMappingReport({
    legacyLessons,
    canonicalVocabulary,
    canonicalLessons: canonicalLessons(canonicalVocabulary)
  });
}

if (require.main === module) {
  process.stdout.write(`${JSON.stringify(generate(process.cwd()), null, 2)}\n`);
}

module.exports = Object.freeze({ generate, loadLegacyLessons, loadCanonicalVocabulary, canonicalLessons });
