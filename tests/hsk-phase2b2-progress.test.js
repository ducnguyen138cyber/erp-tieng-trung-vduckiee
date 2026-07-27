'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const contract = require('../assets/hsk-content/hsk-progress-contract');
const migration = require('../assets/hsk-content/hsk-progress-migration');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const { createHskDeveloperPreview } = require('../assets/hsk-content/hsk-developer-preview');

function fixture() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'hsk-phase2b2-progress.json'), 'utf8'));
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  let writes = 0;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes += 1; values.set(key, String(value)); },
    removeItem(key) { writes += 1; values.delete(key); },
    get writes() { return writes; }
  };
}

function previewHarness() {
  const legacyLessons = Array.from({ length: 15 }, (_, lessonIndex) => ({
    id: `hsk1-${lessonIndex + 1}`,
    title: `Legacy ${lessonIndex + 1}`,
    words: Array.from({ length: 10 }, (_, wordIndex) => [`词${lessonIndex}-${wordIndex}`, `ci${lessonIndex}${wordIndex}`, `Từ ${lessonIndex}-${wordIndex}`])
  }));
  legacyLessons[0].words[0] = ['爱', 'ài', 'Yêu'];
  legacyLessons[0].words[1] = ['后 面', 'hòumiàn', 'Phía sau'];
  const canonicalVocabulary = [
    { id: 'hsk1-v-0001', simplified: '爱', traditional: '愛', pinyin: 'ài', pinyinNormalized: 'ai', meaningVi: 'yêu' },
    { id: 'hsk1-v-0002', simplified: '后面', traditional: '後面', pinyin: 'hòumiàn', pinyinNormalized: 'houmian', meaningVi: 'phía sau' }
  ];
  const canonicalLessons = Array.from({ length: 15 }, (_, index) => ({ id: `hsk1-canonical-preview-${String(index + 1).padStart(2, '0')}`, words: [] }));
  canonicalLessons[0].words = [
    ['爱', 'ài', 'Yêu', '', '', [], 'hsk1-v-0001'],
    ['后面', 'hòumiàn', 'Phía sau', '', '', [], 'hsk1-v-0002']
  ];
  const localStorage = storage({
    'erp-hsk-progress-v2': JSON.stringify({ 'hsk1-1': true }),
    'erp-hsk-state-v2': JSON.stringify({ level: 1, lesson: 0 }),
    'vduckie-hsk-progress-meta-v1': JSON.stringify({ version: 1, updatedAt: 1 })
  });
  const root = {
    HSK1_V75_LESSONS: legacyLessons,
    HSKCurriculum: { levels: { 1: legacyLessons } },
    localStorage,
    VDuckieEXPCore: { session: () => ({ user: { id: 'developer-id', email: 'ducnguyenn138@gmail.com' } }) },
    VDuckieLocalLearning: {
      prepareForCloud: () => [
        { word_key: '爱', hanzi: '爱', is_known: true, is_saved: false, known_updated_at: '2026-07-01T00:00:00.000Z' },
        { word_key: '后面', hanzi: '后面', is_known: false, is_saved: true, saved_updated_at: '2026-07-02T00:00:00.000Z' }
      ]
    }
  };
  let mode = 'legacy';
  const runtimeBridge = {
    useCanonical(lessons) { mode = 'canonical'; root.HSKCurriculum.levels[1] = lessons; },
    useLegacy() { mode = 'legacy'; root.HSKCurriculum.levels[1] = legacyLessons; },
    disable() { mode = 'legacy'; root.HSKCurriculum.levels[1] = legacyLessons; }
  };
  const adapterApi = {
    adaptCanonicalHsk1: () => ({
      lessons: canonicalLessons,
      flashcards: Array(300).fill({ examples: [{}, {}, {}], audioText: '爱' }),
      quizItems: Array(300).fill({ options: ['a', 'b', 'c', 'd'] }),
      dictations: Array(900).fill({ chinese: '我爱你', audioText: '我爱你' }),
      search: () => [{ id: 'hsk1-v-0001' }],
      metrics: { lessons: 15, vocabulary: 300, sentences: 900 }
    })
  };
  const preview = createHskDeveloperPreview({
    root,
    flags,
    adapterApi,
    contractApi: contract,
    migrationApi: migration,
    loader: { loadCanonicalHsk1: async () => ({ vocabulary: canonicalVocabulary, sentences: [] }) },
    runtimeApi: { requestDeveloperBridge: async () => runtimeBridge },
    refreshDictionary() {}
  });
  return { root, localStorage, preview, getMode: () => mode };
}

test('canonical progress contract is versioned and minimal', () => {
  assert.equal(contract.CONTRACT_VERSION, '1.0.0');
  assert.equal(contract.CANONICAL_STORAGE_KEY, 'vduckie-hsk-canonical-progress-v1');
  const record = contract.createProgressRecord({ ownerKey: 'fixture-user', lessonId: 'lesson-1', vocabularyId: 'word-1', learned: true, saved: false, source: 'fixture', migration: { mappingStatus: 'exact' } });
  assert.equal(record.version, '1.0.0');
  assert.equal(record.curriculumId, 'hsk1-canonical-2026');
  assert.equal(record.learned, true);
  assert.equal(record.mastered, false);
  assert.equal(record.quizAttempts, 0);
  assert.equal(record.migration.mode, 'dry-run');
  assert.ok(Object.isFrozen(record));
});

test('mapping classifies exact, normalized, ambiguous, unmatched and duplicate target deterministically', () => {
  const input = fixture();
  const first = migration.buildMappingReport(input);
  const second = migration.buildMappingReport(input);
  assert.deepEqual(second, first);
  assert.equal(first.summary.totalLegacyItems, 5);
  assert.equal(first.summary.exactMapped, 1);
  assert.equal(first.summary.normalizedMapped, 2);
  assert.equal(first.summary.ambiguous, 1);
  assert.equal(first.summary.unmatched, 1);
  assert.equal(first.summary.duplicateTargets, 1);
  assert.equal(first.summary.coveragePercent, 60);
  assert.equal(first.lessonMapping.status, 'not-migrated');
});

test('dry-run creates preview records without storage or API writes and preserves legacy input', () => {
  const input = fixture();
  const mappingReport = migration.buildMappingReport(input);
  const completed = { 'hsk1-1': true };
  const wordRows = [
    { word_key: '爱', hanzi: '爱', is_known: true, is_saved: false, known_updated_at: '2026-07-01T00:00:00.000Z' },
    { word_key: '后面', hanzi: '后面', is_known: false, is_saved: true, saved_updated_at: '2026-07-02T00:00:00.000Z' },
    { word_key: '不存在', hanzi: '不存在', is_known: true, is_saved: true }
  ];
  const before = JSON.stringify({ completed, wordRows });
  let storageWrites = 0, apiWrites = 0;
  const forbiddenStorage = { setItem() { storageWrites += 1; throw new Error('write forbidden'); } };
  const forbiddenApi = { upsert() { apiWrites += 1; throw new Error('write forbidden'); } };
  void forbiddenStorage; void forbiddenApi;
  const result = migration.runDryRun({ ...input, mappingReport, completed, wordRows, ownerKey: 'fixture-user', contractApi: contract });
  assert.equal(JSON.stringify({ completed, wordRows }), before);
  assert.equal(storageWrites, 0);
  assert.equal(apiWrites, 0);
  assert.equal(result.writesPerformed, false);
  assert.equal(result.apiWrites, 0);
  assert.equal(result.canonicalStorageWrites, 0);
  assert.equal(result.previewRecords.length, 2);
  assert.ok(result.skipped.some((item) => item.reason === 'legacy-lesson-completion-not-migrated'));
  assert.ok(result.skipped.some((item) => item.reason === 'unmatched-progress-source'));
  assert.ok(result.conflicts.some((item) => item.reason === 'duplicate-target-mapping'));
  assert.equal(result.invalidRecords.length, 0);
});

test('developer-only migration bridge analyzes, dry-runs and rolls back without writes', async () => {
  const h = previewHarness();
  assert.deepEqual(h.preview.getPublicState(), {
    mode: 'legacy', canonicalAvailable: false, publicOverrideAllowed: false, progressWritesEnabled: false, qualityGate: 'locked'
  });
  const bridge = await h.preview.requestDeveloperBridge();
  const writesBefore = h.localStorage.writes;
  const mapping = await bridge.analyzeLegacyProgress();
  assert.equal(mapping.summary.totalLegacyItems, 150);
  const dryRun = await bridge.runMigrationDryRun();
  assert.equal(dryRun.previewRecords.length, 2);
  assert.equal(dryRun.apiWrites, 0);
  assert.equal(dryRun.canonicalStorageWrites, 0);
  assert.equal(h.localStorage.getItem(contract.CANONICAL_STORAGE_KEY), null);
  assert.equal(h.localStorage.writes, writesBefore);
  const rollback = await bridge.verifyRollback();
  assert.equal(rollback.pass, true);
  assert.equal(h.getMode(), 'legacy');
  assert.equal(h.localStorage.writes, writesBefore);
  assert.equal(bridge.getState().progress.rollback, 'pass');
  bridge.disable();
});

test('regular users do not receive the migration bridge', async () => {
  const preview = createHskDeveloperPreview({
    root: {}, flags, contractApi: contract, migrationApi: migration,
    adapterApi: { adaptCanonicalHsk1() { throw new Error('must not adapt'); } },
    loader: { loadCanonicalHsk1: async () => { throw new Error('must not load'); } },
    runtimeApi: { requestDeveloperBridge: async () => { throw new Error('not authorized'); } }
  });
  await assert.rejects(preview.requestDeveloperBridge(), /not authorized/);
  assert.equal(preview.getPublicState().canonicalAvailable, false);
});

test('production locks and source wiring remain write-disabled', () => {
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_QUALITY_GATE, 'locked');
  const access = flags.resolveHskCurriculumAccess({ developerAuthorized: true, previewRequested: true });
  assert.equal(access.progressWritesEnabled, false);
  assert.equal(access.qualityGate, 'locked');
  const root = path.resolve(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'assets/developer-tabs/learning-speaking.js'), 'utf8');
  assert.ok(index.indexOf('hsk-progress-contract.js?v=2b2.0') < index.indexOf('hsk-progress-migration.js?v=2b2.0'));
  assert.ok(index.indexOf('hsk-progress-migration.js?v=2b2.0') < index.indexOf('hsk-developer-preview.js?v=2b2.0'));
  assert.match(ui, /Phân tích Progress Legacy/);
  assert.match(ui, /Chạy Migration Dry Run/);
  assert.match(ui, /Xem Mapping Report/);
  assert.match(ui, /Kiểm tra Rollback/);
  assert.match(ui, /Writes<\/span><strong>DISABLED/);
  assert.doesNotMatch(ui, /enable.*write/i);
});

test('repository V75 to canonical mapping report is deterministic', { skip: !fs.existsSync(path.join(__dirname, '..', 'assets', 'v75', 'hsk1-data.part1.txt')) }, () => {
  const generator = require('../scripts/hsk1-progress-mapping-report');
  const first = generator.generate(path.join(__dirname, '..'));
  const second = generator.generate(path.join(__dirname, '..'));
  assert.deepEqual(second, first);
  assert.deepEqual(first.summary, {
    totalLegacyItems: 150,
    exactMapped: 150,
    normalizedMapped: 0,
    ambiguous: 0,
    unmatched: 0,
    duplicateTargets: 0,
    mapped: 150,
    coveragePercent: 100
  });
  assert.equal(first.generatedMode, 'deterministic-dry-run');
});

test('contract rejects invalid counters and dry-run is hard locked', () => {
  assert.throws(() => contract.createProgressRecord({ ownerKey: 'u', vocabularyId: 'v', quizAttempts: 1, quizCorrect: 2 }), /cannot exceed/);
  assert.equal(migration.DRY_RUN_ONLY, true);
  assert.equal(contract.describeMigrationPolicy().notMigratedFields.includes('xp'), true);
});
