'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { checkHsk1 } = require('../scripts/hsk1-quality-engine');

const root = path.resolve(__dirname, '..');
const result = checkHsk1(root);

test('Phase 2A pinyin, Unicode and bidirectional references pass', () => {
  assert.equal(result.validation.pinyinErrors, 0);
  assert.equal(result.validation.unicodeErrors, 0);
  assert.equal(result.validation.referenceErrors, 0);
});

test('every vocabulary has difficulty 1, 2 and 3 sentence coverage', () => {
  assert.equal(result.validation.coverageErrors, 0, JSON.stringify(result.issues.coverage, null, 2));
  assert.equal(result.coverage.structuralDimensions['sentence-coverage'], true);
});

test('Phase 2A has no blocking duplicate and reports near duplicates separately', () => {
  assert.equal(result.duplicates.blockers, 0);
  assert.ok(Number.isInteger(result.duplicates.nearReview));
  assert.ok(result.duplicates.nearReview >= 0);
});

test('structural coverage is complete while human release review remains explicit', () => {
  assert.equal(result.coverage.structuralPercent, 100);
  assert.equal(result.coverage.releaseReadinessPercent, 81.82);
  assert.equal(result.coverage.humanVietnameseReviewPercent, 0);
  assert.equal(result.coverage.humanPedagogyReviewPercent, 0);
});
