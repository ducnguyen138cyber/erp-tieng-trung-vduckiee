'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const contract = require('../assets/hsk-content/hsk-progress-contract');
const migration = require('../assets/hsk-content/hsk-progress-migration');
const review = require('../assets/hsk-content/hsk-progress-review');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const adapter = require('../assets/hsk-content/hsk-content-adapter');
const { createHskContentLoader } = require('../assets/hsk-content/hsk-content-loader');
const { createHskDeveloperPreview } = require('../assets/hsk-content/hsk-developer-preview');
const mappingGenerator = require('../scripts/hsk1-progress-mapping-report');
const reviewGenerator = require('../scripts/hsk1-progress-review-report');

const rootDirectory = path.resolve(__dirname, '..');

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

function createFileFetch() {
  return async function fetchImpl(resource) {
    const relative = String(resource).replace(/^\.\//, '');
    const file = path.join(rootDirectory, relative);
    if (!fs.existsSync(file)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => fs.readFileSync(file, 'utf8') };
  };
}

function previewHarness() {
  const legacyLessons = mappingGenerator.loadLegacyLessons(rootDirectory);
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
        { word_key: '前面', hanzi: '前面', is_known: true, is_saved: false },
        { word_key: '后面', hanzi: '后面', is_known: false, is_saved: true }
      ]
    }
  };
  const runtimeBridge = {
    useCanonical(lessons) { root.HSKCurriculum.levels[1] = lessons; },
    useLegacy() { root.HSKCurriculum.levels[1] = legacyLessons; },
    disable() { root.HSKCurriculum.levels[1] = legacyLessons; }
  };
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', fetchImpl: createFileFetch() });
  const create = () => createHskDeveloperPreview({
    root,
    flags,
    adapterApi: adapter,
    contractApi: contract,
    migrationApi: migration,
    reviewApi: review,
    loader,
    runtimeApi: { requestDeveloperBridge: async () => runtimeBridge },
    refreshDictionary() {}
  });
  return { root, localStorage, create };
}

test('human-review queue is deterministic and keeps ambiguous/unmatched unresolved', () => {
  const input = fixture();
  const mappingReport = migration.buildMappingReport(input);
  const first = review.createReviewQueue({ mappingReport, canonicalVocabulary: input.canonicalVocabulary });
  const second = review.createReviewQueue({ mappingReport, canonicalVocabulary: input.canonicalVocabulary });
  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, '1.0.0');
  assert.equal(first.mode, 'developer-in-memory-only');
  assert.deepEqual(first.summary, {
    total: 2,
    ambiguous: 1,
    unmatched: 1,
    withSuggestions: 1,
    withoutSuggestions: 1,
    duplicateTargets: 1,
    reviewed: 0,
    unresolved: 2,
    productionBlocked: true
  });
  assert.equal(first.writesPerformed, false);
  assert.equal(first.apiWrites, 0);
  assert.equal(first.storageWrites, 0);
  assert.equal(first.items.find((item) => item.mappingStatus === 'ambiguous').candidates.length, 2);
  assert.ok(Object.isFrozen(first));
});

test('review decisions require explicit evidence and remain unapplied in memory', () => {
  const input = fixture();
  const queue = review.createReviewQueue({
    mappingReport: migration.buildMappingReport(input),
    canonicalVocabulary: input.canonicalVocabulary
  });
  const session = review.createReviewSession(queue);
  const ambiguous = queue.items.find((item) => item.mappingStatus === 'ambiguous');
  const unmatched = queue.items.find((item) => item.mappingStatus === 'unmatched');
  assert.throws(() => session.recordDecision(ambiguous.reviewId, {
    decision: 'map', canonicalVocabularyId: 'missing', reviewer: 'human', note: 'checked'
  }), /explicit review candidate/);
  assert.throws(() => session.recordDecision(ambiguous.reviewId, {
    decision: 'map', canonicalVocabularyId: ambiguous.candidates[0].canonicalVocabularyId, reviewer: '', note: 'checked'
  }), /Reviewer identity/);
  session.recordDecision(ambiguous.reviewId, {
    decision: 'map',
    canonicalVocabularyId: ambiguous.candidates[0].canonicalVocabularyId,
    reviewer: 'developer-human',
    note: 'Compared Hanzi, pinyin, and meaning.'
  });
  const manifest = session.recordDecision(unmatched.reviewId, {
    decision: 'keep-unmatched',
    reviewer: 'developer-human',
    note: 'No canonical equivalent is proven.'
  });
  assert.deepEqual(manifest.summary, {
    total: 2,
    approvedMappings: 1,
    keptUnmatched: 1,
    reviewed: 2,
    unresolved: 0,
    productionBlocked: true,
    writesPerformed: false,
    apiWrites: 0,
    storageWrites: 0
  });
  assert.equal(manifest.appliedToMapping, false);
  assert.equal(manifest.writesPerformed, false);
  assert.equal(queue.summary.reviewed, 0);
  assert.equal(session.reset().summary.unresolved, 2);
});

test('review session blocks duplicate approved canonical targets', () => {
  const canonicalVocabulary = fixture().canonicalVocabulary;
  const mappingReport = {
    summary: { totalLegacyItems: 2, ambiguous: 2, unmatched: 0 },
    duplicateTargets: [],
    mappings: [
      { legacyVocabularyId: 'legacy-a', legacyLessonId: 'hsk1-1', simplified: '甲', pinyin: 'jiǎ', meaningVi: 'A', status: 'ambiguous', mappingRule: 'fixture', candidates: ['hsk1-v-0001'] },
      { legacyVocabularyId: 'legacy-b', legacyLessonId: 'hsk1-1', simplified: '乙', pinyin: 'yǐ', meaningVi: 'B', status: 'ambiguous', mappingRule: 'fixture', candidates: ['hsk1-v-0001'] }
    ]
  };
  const queue = review.createReviewQueue({ mappingReport, canonicalVocabulary });
  const session = review.createReviewSession(queue);
  session.recordDecision('review-legacy-a', {
    decision: 'map', canonicalVocabularyId: 'hsk1-v-0001', reviewer: 'human', note: 'fixture approval'
  });
  assert.throws(() => session.recordDecision('review-legacy-b', {
    decision: 'map', canonicalVocabularyId: 'hsk1-v-0001', reviewer: 'human', note: 'fixture approval'
  }), /Duplicate reviewed canonical target/);
});

test('repository review report exposes the four real unmatched items without writes', () => {
  const first = reviewGenerator.generate(rootDirectory);
  const second = reviewGenerator.generate(rootDirectory);
  assert.deepEqual(second, first);
  assert.equal(first.canonicalVocabularyCount, 300);
  assert.equal(first.summary.total, 4);
  assert.equal(first.summary.ambiguous, 0);
  assert.equal(first.summary.unmatched, 4);
  assert.equal(first.summary.unresolved, 4);
  assert.equal(first.summary.productionBlocked, true);
  assert.equal(first.writesPerformed, false);
  assert.deepEqual(new Set(first.items.map((item) => item.simplified)), new Set(['北京', '小姐', '前面', '后面']));
  assert.ok(first.items.filter((item) => item.candidates.length > 0).length >= 2);
  assert.equal(first.items.find((item) => item.simplified === '北京').candidates.length, 0);
});

test('developer bridge reviews in memory, resets on reload, and preserves legacy state', async () => {
  const harness = previewHarness();
  const firstPreview = harness.create();
  const bridge = await firstPreview.requestDeveloperBridge();
  const writesBefore = harness.localStorage.writes;
  const before = JSON.stringify(harness.root.HSKCurriculum.levels[1]);
  const queue = await bridge.buildProgressReviewQueue();
  assert.equal(queue.summary.total, 4);
  assert.equal(bridge.getState().progress.review.unresolved, 4);
  const manifest = await bridge.recordProgressReviewDecision('keep-unmatched');
  assert.equal(manifest.summary.reviewed, 1);
  assert.equal(manifest.appliedToMapping, false);
  assert.equal(harness.localStorage.writes, writesBefore);
  assert.equal(JSON.stringify(harness.root.HSKCurriculum.levels[1]), before);
  assert.equal((await bridge.resetProgressReviewSession()).summary.unresolved, 4);
  bridge.disable();

  const reloadedBridge = await harness.create().requestDeveloperBridge();
  assert.equal(reloadedBridge.getState().progress.review.status, 'not-built');
  assert.equal(reloadedBridge.getState().progress.review.reviewed, 0);
  assert.equal(harness.localStorage.writes, writesBefore);
  reloadedBridge.disable();
});

test('source wiring exposes review UI while every production lock remains closed', () => {
  const index = fs.readFileSync(path.join(rootDirectory, 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(rootDirectory, 'assets/developer-tabs/learning-speaking.js'), 'utf8');
  const source = fs.readFileSync(path.join(rootDirectory, 'assets/hsk-content/hsk-progress-review.js'), 'utf8');
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_QUALITY_GATE, 'locked');
  assert.ok(index.indexOf('hsk-progress-migration.js?v=2b2.0') < index.indexOf('hsk-progress-review.js?v=2b3.0'));
  assert.ok(index.indexOf('hsk-progress-review.js?v=2b3.0') < index.indexOf('hsk-developer-preview.js?v=2b3.0'));
  assert.match(ui, /Human Review · In-memory only/);
  assert.match(ui, /Approve candidate trong RAM/);
  assert.match(ui, /Production<\/span><strong>BLOCKED/);
  assert.match(ui, /Không áp vào mapping và không ghi API\/storage/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|setItem|removeItem|fetch\s*\(|XMLHttpRequest|supabase/i);
});
