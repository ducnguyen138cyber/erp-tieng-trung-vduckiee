'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateRepository } = require('./hsk-repository-validator');
const { checkDuplicates } = require('./hsk-duplicate-engine');

const VOCABULARY_ID = /^hsk1-v-(\d{4})$/;
const SENTENCE_ID = /^hsk1-s-(\d{4})$/;

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function percent(passed, total) {
  return total ? Number(((passed / total) * 100).toFixed(2)) : 0;
}

function checkIndex(root, relativeDirectory, idPattern, expectedCount) {
  const directory = path.join(root, relativeDirectory);
  const indexFile = path.join(directory, 'index.json');
  const index = readJson(indexFile);
  const issues = [];
  const records = [];
  let shardCount = 0;
  for (const shard of index.shards || []) {
    const file = path.join(directory, shard.file);
    if (!fs.existsSync(file)) {
      issues.push(`Missing shard ${path.relative(root, file)}`);
      continue;
    }
    const document = readJson(file);
    const shardRecords = Array.isArray(document.records) ? document.records : [];
    records.push(...shardRecords);
    shardCount += 1;
    if (shardRecords.length !== shard.count) issues.push(`${shard.file}: expected ${shard.count}, got ${shardRecords.length}`);
    if (sha256(file) !== shard.sha256) issues.push(`${shard.file}: sha256 mismatch`);
    if (shardRecords[0] && shardRecords[0].id !== shard.firstId) issues.push(`${shard.file}: firstId mismatch`);
    if (shardRecords.at(-1) && shardRecords.at(-1).id !== shard.lastId) issues.push(`${shard.file}: lastId mismatch`);
  }
  if (index.expectedCount !== expectedCount) issues.push(`index expectedCount must be ${expectedCount}`);
  if (index.actualCount !== expectedCount) issues.push(`index actualCount must be ${expectedCount}`);
  if (records.length !== expectedCount) issues.push(`loaded ${records.length}, expected ${expectedCount}`);
  const ids = records.map((record) => record.id);
  if (new Set(ids).size !== ids.length) issues.push('duplicate IDs in indexed records');
  ids.forEach((id, indexNumber) => {
    const match = idPattern.exec(id);
    if (!match || Number(match[1]) !== indexNumber + 1) issues.push(`unstable or non-sequential ID ${id} at ${indexNumber + 1}`);
  });
  return { index, shardCount, records, issues };
}

function checkHsk1(rootDirectory, options = {}) {
  const root = path.resolve(rootDirectory || process.cwd());
  const validation = validateRepository(root);
  const duplication = options.duplication || (options.skipDuplicates ? null : checkDuplicates(root, { sentenceNearThreshold: 0.92 }));
  const vocabularyIndex = checkIndex(root, 'data/hsk/hsk1/vocabulary', VOCABULARY_ID, 300);
  const sentenceIndex = checkIndex(root, 'data/hsk/hsk1/sentences', SENTENCE_ID, 900);
  const vocabulary = vocabularyIndex.records;
  const sentences = sentenceIndex.records;
  const validationErrors = validation.errors.filter((issue) => {
    return /^hsk1-[vs]-\d{4}$/.test(issue.id || '') || String(issue.file || '').startsWith('data/hsk/hsk1/');
  });
  const pinyinErrors = validationErrors.filter((issue) => issue.rule.startsWith('pinyin'));
  const unicodeErrors = validationErrors.filter((issue) => issue.rule.startsWith('unicode'));
  const referenceErrors = validationErrors.filter((issue) => [
    'sentence-reference',
    'sentence-backlink',
    'vocabulary-reference',
    'vocabulary-backlink',
    'primary-vocabulary',
    'source-reference',
    'source-reference-consistency',
    'target-surface-form'
  ].includes(issue.rule));
  const requiredFieldErrors = validationErrors.filter((issue) => ['schema', 'hsk1-required'].includes(issue.rule));
  const sentenceByPrimary = new Map();
  for (const sentence of sentences) {
    if (!sentenceByPrimary.has(sentence.primaryVocabularyId)) sentenceByPrimary.set(sentence.primaryVocabularyId, []);
    sentenceByPrimary.get(sentence.primaryVocabularyId).push(sentence);
  }
  const coverageErrors = [];
  for (const record of vocabulary) {
    const linked = sentenceByPrimary.get(record.id) || [];
    const difficulties = linked.map((sentence) => sentence.difficulty).sort();
    if (linked.length !== 3) coverageErrors.push(`${record.id}: expected 3 primary sentences, got ${linked.length}`);
    if (difficulties.join(',') !== '1,2,3') coverageErrors.push(`${record.id}: expected difficulty 1,2,3, got ${difficulties.join(',')}`);
    const actualIds = linked.map((sentence) => sentence.id).sort();
    const declaredIds = (record.sentenceIds || []).slice().sort();
    if (actualIds.join(',') !== declaredIds.join(',')) coverageErrors.push(`${record.id}: sentenceIds do not match primary links`);
  }
  const provenanceComplete = [...vocabulary, ...sentences].filter((record) => Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0).length;
  const humanVietnameseReviewed = [...vocabulary, ...sentences].filter((record) => record.translationReviewStatus === 'human-reviewed').length;
  const humanPedagogyReviewed = sentences.filter((record) => ['pedagogy-reviewed', 'approved'].includes(record.reviewStatus)).length;
  const duplicateBlockers = duplication ? duplication.summary.blockers : 0;
  const structuralDimensions = {
    'inventory-count': vocabulary.length === 300 && sentences.length === 900,
    'schema': requiredFieldErrors.length === 0,
    'stable-id': vocabularyIndex.issues.length === 0 && sentenceIndex.issues.length === 0,
    'unicode': unicodeErrors.length === 0,
    'pinyin': pinyinErrors.length === 0,
    'source-provenance': provenanceComplete === 1200,
    'reference-integrity': referenceErrors.length === 0,
    'duplicate-blockers': duplicateBlockers === 0,
    'sentence-coverage': coverageErrors.length === 0
  };
  const releaseDimensions = {
    ...structuralDimensions,
    'human-vietnamese-review': humanVietnameseReviewed === 1200,
    'human-pedagogy-review': humanPedagogyReviewed === 900
  };
  const structuralPassed = Object.values(structuralDimensions).filter(Boolean).length;
  const releasePassed = Object.values(releaseDimensions).filter(Boolean).length;
  const structuralComplete = structuralPassed === Object.keys(structuralDimensions).length;
  const phase2aComplete = structuralComplete && validationErrors.length === 0 && duplicateBlockers === 0;
  return {
    schemaVersion: '1.0.0',
    datasetVersion: '1.0.0',
    generatedAt: 'deterministic',
    phase: '2A',
    status: phase2aComplete ? 'complete-structural-production-locked' : 'blocked',
    phase2aComplete,
    productionEnabled: false,
    publicOverrideAllowed: false,
    progressWritesEnabled: false,
    qualityGate: 'locked',
    counts: {
      vocabulary: vocabulary.length,
      sentences: sentences.length,
      phase2aRecords: vocabulary.length + sentences.length,
      repositoryRecords: validation.summary.records,
      vocabularyShards: vocabularyIndex.shardCount,
      sentenceShards: sentenceIndex.shardCount,
      sources: validation.summary.sources,
      schemas: validation.summary.schemas
    },
    validation: {
      ok: validation.ok,
      repositoryErrors: validation.summary.errors,
      repositoryWarnings: validation.summary.warnings,
      phase2aErrors: validationErrors.length,
      requiredFieldErrors: requiredFieldErrors.length,
      pinyinErrors: pinyinErrors.length,
      unicodeErrors: unicodeErrors.length,
      referenceErrors: referenceErrors.length,
      indexErrors: vocabularyIndex.issues.length + sentenceIndex.issues.length,
      coverageErrors: coverageErrors.length
    },
    duplicates: duplication ? {
      blockers: duplication.summary.blockers,
      exact: duplication.summary.exact,
      normalized: duplication.summary.normalized,
      nearReview: duplication.summary.nearReview
    } : null,
    coverage: {
      structuralPassed,
      structuralTotal: Object.keys(structuralDimensions).length,
      structuralPercent: percent(structuralPassed, Object.keys(structuralDimensions).length),
      releasePassed,
      releaseTotal: Object.keys(releaseDimensions).length,
      releaseReadinessPercent: percent(releasePassed, Object.keys(releaseDimensions).length),
      sourceReferencePercent: percent(provenanceComplete, 1200),
      humanVietnameseReviewPercent: percent(humanVietnameseReviewed, 1200),
      humanPedagogyReviewPercent: percent(humanPedagogyReviewed, 900),
      structuralDimensions,
      releaseDimensions
    },
    issues: {
      vocabularyIndex: vocabularyIndex.issues,
      sentenceIndex: sentenceIndex.issues,
      coverage: coverageErrors,
      validation: validationErrors
    }
  };
}

module.exports = { VOCABULARY_ID, SENTENCE_ID, sha256, checkIndex, checkHsk1 };
