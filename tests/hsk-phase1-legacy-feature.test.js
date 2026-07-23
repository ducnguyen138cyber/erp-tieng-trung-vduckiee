'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const legacy = require('../assets/hsk-content/hsk-legacy-compat');

const confirmedMappings = [
  { legacyId: 'hsk1-legacy-confirmed', canonicalId: 'hsk1-u01-l01', status: 'mapped', confidence: 1, mappingRule: 'manual-semantic-review' },
  { legacyId: 'hsk1-*', canonicalId: null, status: 'review-required', confidence: 0.2, mappingRule: 'manual-review-required' }
];

test('confirmed legacy ID mapping resolves canonical ID', () => {
  const result = legacy.mapLegacyHskLessonId('hsk1-legacy-confirmed', confirmedMappings);
  assert.deepEqual(result, { legacyId: 'hsk1-legacy-confirmed', canonicalId: 'hsk1-u01-l01', status: 'mapped', confidence: 1, mappingRule: 'manual-semantic-review' });
});

test('uncertain mapping remains review-required', () => {
  const result = legacy.mapLegacyHskLessonId('hsk1-12', confirmedMappings);
  assert.equal(result.status, 'review-required');
  assert.equal(result.canonicalId, null);
});

test('unmapped progress is preserved and never converted to not learned', () => {
  const source = { 'hsk1-legacy-confirmed': true, 'hsk2-unknown': true };
  const result = legacy.mapLegacyHskProgress(source, confirmedMappings);
  assert.deepEqual(result.canonicalProgress, { 'hsk1-u01-l01': true });
  assert.deepEqual(result.preservedLegacy, source);
  assert.equal(result.unresolved[0].legacyCompleted, true);
  assert.equal(result.writesPerformed, false);
  const completion = legacy.resolveLegacyCompletion('hsk2-unknown', source, result.canonicalProgress, confirmedMappings);
  assert.equal(completion.completed, null);
  assert.equal(completion.legacyCompleted, true);
  assert.equal(completion.preserved, true);
});

test('production defaults to legacy curriculum with locked gate', () => {
  const access = flags.resolveHskCurriculumAccess({});
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(access.mode, 'legacy-production');
  assert.equal(access.canonicalEnabled, false);
  assert.equal(access.qualityGate, 'locked');
  assert.equal(access.progressWritesEnabled, false);
});

test('authorized developer preview is read-only and public URL hints are ignored', () => {
  const preview = flags.resolveHskCurriculumAccess({ developerAuthorized: true, previewRequested: true, query: '?hskV2=1' });
  assert.equal(preview.mode, 'developer-preview');
  assert.equal(preview.readOnly, true);
  assert.equal(preview.progressWritesEnabled, false);
  assert.equal(preview.publicOverrideAccepted, false);
  const publicAttempt = flags.resolveHskCurriculumAccess({ developerAuthorized: false, previewRequested: true, query: '?hskV2=1' });
  assert.equal(publicAttempt.mode, 'legacy-production');
});
