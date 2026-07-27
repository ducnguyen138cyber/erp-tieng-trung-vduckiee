(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskProgressContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CONTRACT_VERSION = '1.0.0';
  var CURRICULUM_ID = 'hsk1-canonical-2026';
  var LEGACY_CURRICULUM_ID = 'hsk1-legacy-v75';
  var CANONICAL_STORAGE_KEY = 'vduckie-hsk-canonical-progress-v1';

  function text(value) { return String(value == null ? '' : value).trim(); }
  function count(value) {
    var number = Number(value || 0);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function nullableTime(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    if (isFinite(number) && number > 0) return number;
    var parsed = Date.parse(value);
    return isNaN(parsed) ? null : parsed;
  }
  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }

  function createProgressRecord(input) {
    input = input || {};
    var migration = input.migration || {};
    if (!text(input.ownerKey)) throw new Error('Canonical progress ownerKey is required.');
    if (!text(input.vocabularyId) && !text(input.lessonId)) throw new Error('Canonical progress requires vocabularyId or lessonId.');
    var record = {
      version: CONTRACT_VERSION,
      curriculumId: CURRICULUM_ID,
      ownerKey: text(input.ownerKey),
      lessonId: text(input.lessonId) || null,
      vocabularyId: text(input.vocabularyId) || null,
      learned: input.learned === true,
      saved: input.saved === true,
      mastered: input.mastered === true,
      quizAttempts: count(input.quizAttempts),
      quizCorrect: count(input.quizCorrect),
      dictationAttempts: count(input.dictationAttempts),
      dictationCorrect: count(input.dictationCorrect),
      completion: input.completion === true,
      lastSeenAt: nullableTime(input.lastSeenAt),
      updatedAt: nullableTime(input.updatedAt),
      source: text(input.source) || 'legacy-hsk1-dry-run',
      migration: {
        mode: 'dry-run',
        fromCurriculumId: LEGACY_CURRICULUM_ID,
        legacyLessonId: text(migration.legacyLessonId) || null,
        legacyVocabularyId: text(migration.legacyVocabularyId) || null,
        mappingStatus: text(migration.mappingStatus) || 'unmatched',
        mappingRule: text(migration.mappingRule) || null,
        contractVersion: CONTRACT_VERSION
      }
    };
    if (record.quizCorrect > record.quizAttempts) throw new Error('quizCorrect cannot exceed quizAttempts.');
    if (record.dictationCorrect > record.dictationAttempts) throw new Error('dictationCorrect cannot exceed dictationAttempts.');
    return freeze(record);
  }

  function describeMigrationPolicy() {
    return freeze({
      version: CONTRACT_VERSION,
      migratedFields: ['ownerKey', 'lessonId', 'vocabularyId', 'learned', 'saved', 'lastSeenAt', 'updatedAt', 'source', 'migration'],
      conditionallyMigratedFields: ['quizAttempts', 'quizCorrect', 'dictationAttempts', 'dictationCorrect'],
      notMigratedFields: ['legacyLessonCompletion', 'mastered', 'completion', 'xp', 'leaderboard', 'streak', 'selectedLevel', 'selectedLesson'],
      reason: 'Only deterministic vocabulary identity and explicitly attributable word state are safe in Phase 2B-2. Legacy lesson completion and XP have no semantic canonical equivalent.'
    });
  }

  return Object.freeze({
    CONTRACT_VERSION: CONTRACT_VERSION,
    CURRICULUM_ID: CURRICULUM_ID,
    LEGACY_CURRICULUM_ID: LEGACY_CURRICULUM_ID,
    CANONICAL_STORAGE_KEY: CANONICAL_STORAGE_KEY,
    createProgressRecord: createProgressRecord,
    describeMigrationPolicy: describeMigrationPolicy
  });
});
