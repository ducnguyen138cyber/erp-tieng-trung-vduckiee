'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { checkHsk1 } = require('../scripts/hsk1-quality-engine');

const root = path.resolve(__dirname, '..');
const result = checkHsk1(root);

test('Phase 2A has exactly 300 canonical vocabulary and 900 sentences', () => {
  assert.equal(result.counts.vocabulary, 300);
  assert.equal(result.counts.sentences, 900);
  assert.equal(result.counts.phase2aRecords, 1200);
  assert.equal(result.counts.vocabularyShards, 6);
  assert.equal(result.counts.sentenceShards, 9);
});

test('Phase 2A IDs, shard checksums and indexes are deterministic', () => {
  assert.equal(result.validation.indexErrors, 0, JSON.stringify(result.issues, null, 2));
  const vocabularyIndex = JSON.parse(fs.readFileSync(path.join(root, 'data/hsk/hsk1/vocabulary/index.json'), 'utf8'));
  const sentenceIndex = JSON.parse(fs.readFileSync(path.join(root, 'data/hsk/hsk1/sentences/index.json'), 'utf8'));
  assert.equal(vocabularyIndex.shards[0].firstId, 'hsk1-v-0001');
  assert.equal(vocabularyIndex.shards.at(-1).lastId, 'hsk1-v-0300');
  assert.equal(sentenceIndex.shards[0].firstId, 'hsk1-s-0001');
  assert.equal(sentenceIndex.shards.at(-1).lastId, 'hsk1-s-0900');
});

test('Phase 2A schema and required field contract pass', () => {
  assert.equal(result.validation.repositoryErrors, 0, JSON.stringify(result.issues.validation, null, 2));
  assert.equal(result.validation.requiredFieldErrors, 0);
  assert.equal(result.counts.schemas, 9);
});

test('Phase 2A provenance snapshot identifies the official 300-item source', () => {
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/hsk/hsk1/provenance/source-snapshot.json'), 'utf8'));
  const official = snapshot.sources.find((source) => source.sourceId === 'cti-hsk3-syllabus-pdf-2026');
  assert.equal(official.expectedItems, 300);
  assert.equal(official.role, 'canonical-membership');
  assert.equal(snapshot.copyrightPolicy.exampleSentencesOriginal, true);
});
