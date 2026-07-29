'use strict';

const crypto = require('node:crypto');

const FIXTURE_VERSION = '1.0.0';
const DEFAULT_SEED = 20260729;
const MAX_FIXTURE_SIZE = 10000;
const BASE_TIME = 1785283200000;

const CATEGORIES = Object.freeze([
  'empty',
  'viewed-last-seen',
  'learned',
  'saved',
  'mastered',
  'quiz-correct',
  'quiz-incorrect',
  'dictation-correct',
  'dictation-incorrect',
  'lesson-completion',
  'mixed',
  'missing-fields',
  'extra-fields',
  'timestamp-variants',
  'duplicate-record',
  'conflict-record',
  'invalid-id',
  'null-record',
  'undefined-record',
  'wrong-type',
  'reordered-progress',
  'no-hsk1-progress',
  'outside-hsk1',
  'stale-canonical-like',
  'unknown-legacy-id'
]);

function normalize(value) {
  if (value === undefined) return '__undefined__';
  if (typeof value === 'number' && !Number.isFinite(value)) return `__${String(value)}__`;
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const output = {};
    Object.keys(value).sort().forEach((key) => { output[key] = normalize(value[key]); });
    return output;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(normalize(value));
}

function hash(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex');
}

function hashFixture(fixture) {
  const body = {};
  Object.keys(fixture || {}).sort().forEach((key) => {
    if (key !== 'fixtureHash') body[key] = fixture[key];
  });
  return hash(body);
}

function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  if (!state) state = DEFAULT_SEED;
  return function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function isoTime(offset) {
  return new Date(BASE_TIME + (offset * 60000)).toISOString();
}

function exactMappings(mappingReport) {
  const mappings = mappingReport && Array.isArray(mappingReport.mappings) ? mappingReport.mappings : [];
  const exact = mappings.filter((item) => item.status === 'exact' && item.canonicalVocabularyId);
  if (!exact.length) throw new Error('Large simulation fixture requires at least one exact HSK1 mapping.');
  return exact;
}

function unmatchedMappings(mappingReport) {
  const mappings = mappingReport && Array.isArray(mappingReport.mappings) ? mappingReport.mappings : [];
  return mappings.filter((item) => item.status === 'unmatched');
}

function wordRow(mapping, index, state) {
  state = state || {};
  return {
    word_key: state.key || `legacy-word-${String(index).padStart(6, '0')}`,
    hanzi: mapping.simplified,
    pinyin: mapping.pinyin,
    meaning_vi: mapping.meaningVi,
    is_known: state.learned === true,
    is_saved: state.saved === true,
    known_updated_at: state.learned ? isoTime(index + 1) : null,
    saved_updated_at: state.saved ? isoTime(index + 2) : null
  };
}

function createLegacyState(category, profileIndex, mapping, unmatched, random) {
  const base = {
    viewedLessonId: null,
    lastSeenAt: null,
    wordRows: [],
    completed: {},
    mastered: [],
    quiz: { attempts: 0, correct: 0, incorrect: 0 },
    dictation: { attempts: 0, correct: 0, incorrect: 0 }
  };
  const learned = wordRow(mapping, profileIndex, { learned: true });
  const saved = wordRow(mapping, profileIndex, { saved: true });
  const mixed = wordRow(mapping, profileIndex, { learned: true, saved: true });

  switch (category) {
    case 'empty':
      return base;
    case 'viewed-last-seen':
      base.viewedLessonId = mapping.legacyLessonId;
      base.lastSeenAt = isoTime(profileIndex);
      return base;
    case 'learned':
      base.wordRows = [learned];
      return base;
    case 'saved':
      base.wordRows = [saved];
      return base;
    case 'mastered':
      base.wordRows = [learned];
      base.mastered = [mapping.legacyVocabularyId];
      return base;
    case 'quiz-correct':
      base.wordRows = [learned];
      base.quiz = { attempts: 3, correct: 3, incorrect: 0 };
      return base;
    case 'quiz-incorrect':
      base.wordRows = [saved];
      base.quiz = { attempts: 4, correct: 1, incorrect: 3 };
      return base;
    case 'dictation-correct':
      base.wordRows = [learned];
      base.dictation = { attempts: 2, correct: 2, incorrect: 0 };
      return base;
    case 'dictation-incorrect':
      base.wordRows = [saved];
      base.dictation = { attempts: 3, correct: 1, incorrect: 2 };
      return base;
    case 'lesson-completion':
      base.wordRows = [learned];
      base.completed[mapping.legacyLessonId] = true;
      return base;
    case 'mixed':
      base.wordRows = [mixed];
      base.viewedLessonId = mapping.legacyLessonId;
      base.lastSeenAt = isoTime(profileIndex);
      base.mastered = [mapping.legacyVocabularyId];
      base.quiz = { attempts: 5, correct: 4, incorrect: 1 };
      base.dictation = { attempts: 4, correct: 3, incorrect: 1 };
      base.completed[mapping.legacyLessonId] = true;
      return base;
    case 'missing-fields':
      return { wordRows: [{ word_key: learned.word_key, hanzi: learned.hanzi, is_known: true }] };
    case 'extra-fields':
      base.wordRows = [Object.assign({}, mixed, { ignored_legacy_field: 'synthetic-extra' })];
      base.ignoredProfileField = { synthetic: true };
      return base;
    case 'timestamp-variants':
      base.wordRows = [
        Object.assign({}, learned, { known_updated_at: BASE_TIME + profileIndex }),
        Object.assign({}, saved, { word_key: `${saved.word_key}-saved`, saved_updated_at: isoTime(profileIndex + 10) })
      ];
      return base;
    case 'duplicate-record':
      base.wordRows = [mixed, Object.assign({}, mixed)];
      return base;
    case 'conflict-record':
      base.wordRows = [
        Object.assign({}, learned, { word_key: `${learned.word_key}-a` }),
        Object.assign({}, saved, { word_key: `${saved.word_key}-b` })
      ];
      return base;
    case 'invalid-id':
      base.wordRows = [Object.assign({}, learned, { word_key: '' })];
      return base;
    case 'null-record':
      base.wordRows = [null, learned];
      return base;
    case 'undefined-record':
      base.wordRows = [undefined, learned];
      return base;
    case 'wrong-type':
      base.wordRows = { invalid: true };
      return base;
    case 'reordered-progress':
      base.wordRows = [
        Object.assign({}, saved, { word_key: `${saved.word_key}-z` }),
        Object.assign({}, learned, { word_key: `${learned.word_key}-a` })
      ].reverse();
      return base;
    case 'outside-hsk1':
      base.outsideHsk = {
        hsk2: { learned: ['synthetic-hsk2-word'] },
        erp: { completed: true }
      };
      return base;
    case 'stale-canonical-like':
      base.wordRows = [learned];
      base.canonicalLikeStale = {
        version: '0.0.0-stale',
        curriculumId: 'hsk1-canonical-stale',
        records: [{ vocabularyId: mapping.canonicalVocabularyId, learned: true }]
      };
      return base;
    case 'unknown-legacy-id': {
      const source = unmatched || {
        simplified: `未知${profileIndex}`,
        pinyin: 'wei zhi',
        meaningVi: 'không xác định'
      };
      base.wordRows = [{
        word_key: `unknown-${String(profileIndex).padStart(6, '0')}`,
        hanzi: source.simplified,
        pinyin: source.pinyin,
        meaning_vi: source.meaningVi,
        is_known: true,
        is_saved: random() > 0.5,
        known_updated_at: isoTime(profileIndex)
      }];
      return base;
    }
    return null;
  }
}

function generateFixture(options) {
  options = options || {};
  const size = Number(options.size);
  const seed = options.seed == null ? DEFAULT_SEED : Number(options.seed);
  const mappingReport = options.mappingReport;
  if (!Number.isInteger(size) || size <= 0) throw new Error('Fixture size must be a positive integer.');
  if (size > MAX_FIXTURE_SIZE) throw new Error(`Fixture size exceeds MAX_FIXTURE_SIZE=${MAX_FIXTURE_SIZE}.`);
  if (!Number.isInteger(seed)) throw new Error('Fixture seed must be an integer.');

  const exact = exactMappings(mappingReport);
  const unmatched = unmatchedMappings(mappingReport);
  const random = seededRandom(seed);
  const profiles = [];
  const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));

  for (let index = 0; index < size; index += 1) {
    const category = CATEGORIES[index % CATEGORIES.length];
    const mapping = exact[Math.floor(random() * exact.length) % exact.length];
    const unmatchedMapping = unmatched.length ? unmatched[index % unmatched.length] : null;
    const profileId = `synthetic-hsk1-${String(index + 1).padStart(6, '0')}`;
    const profile = {
      profileId,
      ownerKey: profileId,
      category,
      legacy: category === 'no-hsk1-progress'
        ? null
        : createLegacyState(category, index + 1, mapping, unmatchedMapping, random),
      metadata: {
        synthetic: true,
        fixtureSeed: seed,
        ordinal: index + 1
      }
    };
    profiles.push(profile);
    categoryCounts[category] += 1;
  }

  const body = {
    fixtureVersion: FIXTURE_VERSION,
    seed,
    size,
    generatedAt: new Date(BASE_TIME).toISOString(),
    syntheticOnly: true,
    categories: CATEGORIES.slice(),
    expectedSummary: {
      totalProfiles: size,
      categoryCounts
    },
    profiles
  };
  body.fixtureHash = hashFixture(body);
  return body;
}

module.exports = Object.freeze({
  FIXTURE_VERSION,
  DEFAULT_SEED,
  MAX_FIXTURE_SIZE,
  BASE_TIME,
  CATEGORIES,
  stableStringify,
  hash,
  hashFixture,
  seededRandom,
  generateFixture
});
