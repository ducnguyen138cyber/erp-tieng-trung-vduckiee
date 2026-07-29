'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const contract = require('../assets/hsk-content/hsk-progress-contract');
const migration = require('../assets/hsk-content/hsk-progress-migration');
const review = require('../assets/hsk-content/hsk-progress-review');
const { createHskContentLoader } = require('../assets/hsk-content/hsk-content-loader');
const { createHskDeveloperPreview } = require('../assets/hsk-content/hsk-developer-preview');

const rootDirectory = path.resolve(__dirname, '..');

function fixture() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'hsk-phase2b2-progress.json'), 'utf8'));
}

function fileResponse(resource, mutate) {
  const relative = String(resource).split('?')[0].replace(/^\.\//, '');
  const file = path.join(rootDirectory, relative);
  if (!fs.existsSync(file)) return { ok: false, status: 404, text: async () => '' };
  let text = fs.readFileSync(file, 'utf8');
  if (mutate) text = mutate(text);
  return { ok: true, status: 200, text: async () => text };
}

function legacyLessons() {
  return Array.from({ length: 15 }, (_, lessonIndex) => ({
    id: `hsk1-${lessonIndex + 1}`,
    title: `Legacy ${lessonIndex + 1}`,
    words: Array.from({ length: 10 }, (_, wordIndex) => [
      `旧${lessonIndex}-${wordIndex}`,
      'jiu',
      'legacy'
    ])
  }));
}

function canonicalDataset() {
  return {
    vocabulary: Array.from({ length: 300 }, (_, index) => ({
      id: `hsk1-v-${String(index + 1).padStart(4, '0')}`,
      simplified: `新${index}`,
      pinyin: 'xin',
      meaningVi: 'canonical',
      sentenceIds: [
        `hsk1-s-${String(index * 3 + 1).padStart(4, '0')}`,
        `hsk1-s-${String(index * 3 + 2).padStart(4, '0')}`,
        `hsk1-s-${String(index * 3 + 3).padStart(4, '0')}`
      ]
    })),
    sentences: Array.from({ length: 900 }, (_, index) => ({
      id: `hsk1-s-${String(index + 1).padStart(4, '0')}`,
      chinese: `句${index}`,
      pinyin: 'ju',
      vietnamese: 'câu',
      grammarTags: ['hsk1-original']
    }))
  };
}

function previewHarness(runtimeBridge, overrides = {}) {
  const legacy = legacyLessons();
  const root = {
    HSK1_V75_LESSONS: legacy,
    HSKCurriculum: { levels: { 1: legacy } },
    localStorage: { getItem() { return null; } },
    VDuckieEXPCore: {
      session() {
        return { user: { id: 'developer-id', email: 'ducnguyenn138@gmail.com' } };
      }
    }
  };
  const dataset = canonicalDataset();
  const adapterApi = {
    adaptCanonicalHsk1() {
      return {
        lessons: Array.from({ length: 15 }, (_, index) => ({
          id: `hsk1-canonical-preview-${String(index + 1).padStart(2, '0')}`,
          words: Array(20).fill(['新', 'xin', 'canonical'])
        })),
        metrics: { lessons: 15, vocabulary: 300, sentences: 900 }
      };
    }
  };
  const preview = createHskDeveloperPreview({
    root,
    flags,
    contractApi: contract,
    migrationApi: overrides.migrationApi || migration,
    reviewApi: overrides.reviewApi || review,
    adapterApi,
    loader: { loadCanonicalHsk1: async () => dataset },
    runtimeApi: { requestDeveloperBridge: async () => runtimeBridge },
    refreshDictionary() {}
  });
  return { root, legacy, preview };
}

test('production feature and progress locks ignore hostile public context', () => {
  const access = flags.resolveHskCurriculumAccess({
    developerAuthorized: false,
    previewRequested: true,
    HSK_CURRICULUM_V2_ENABLED: true,
    publicOverrideAllowed: true,
    progressWritesEnabled: true,
    query: '?canonical=1&developer=1&writes=1',
    hash: '#canonical'
  });
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(access.mode, 'legacy-production');
  assert.equal(access.publicOverrideAccepted, false);
  assert.equal(access.progressWritesEnabled, false);
  assert.equal(access.qualityGate, 'locked');
});

test('canonical loader rejects duplicate IDs and purges partial shard cache before retry', async () => {
  let failSentenceShard = true;
  const calls = [];
  const fetchImpl = async (resource) => {
    calls.push(String(resource));
    if (failSentenceShard && String(resource).endsWith('hsk1-s-0801-0900.json')) {
      return { ok: false, status: 404, text: async () => '' };
    }
    if (!failSentenceShard && String(resource).endsWith('hsk1-v-0001-0050.json')) {
      return fileResponse(resource, (text) => {
        const value = JSON.parse(text);
        value.records[1].id = value.records[0].id;
        return JSON.stringify(value);
      });
    }
    return fileResponse(resource);
  };
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', fetchImpl });
  await assert.rejects(loader.loadCanonicalHsk1(), (error) => error.code === 'FILE_NOT_FOUND');
  assert.equal(loader.getHskContentLoaderState().cacheEntries, 0);

  failSentenceShard = false;
  await assert.rejects(loader.loadCanonicalHsk1(), (error) => error.code === 'DUPLICATE_ID');
  assert.ok(calls.filter((resource) => resource.endsWith('content-index.json')).length >= 2);
  assert.equal(loader.getHskContentLoaderState().cacheEntries, 0);
});

test('canonical loader failure matrix remains developer-readable and fail-closed', async () => {
  const cases = [
    {
      name: 'canonical index 404',
      match: (resource) => String(resource).endsWith('content-index.json'),
      response: { ok: false, status: 404, text: async () => '' },
      code: 'FILE_NOT_FOUND'
    },
    {
      name: 'vocabulary shard 404',
      match: (resource) => String(resource).endsWith('hsk1-v-0001-0050.json'),
      response: { ok: false, status: 404, text: async () => '' },
      code: 'FILE_NOT_FOUND'
    },
    {
      name: 'sentence shard 404',
      match: (resource) => String(resource).endsWith('hsk1-s-0801-0900.json'),
      response: { ok: false, status: 404, text: async () => '' },
      code: 'FILE_NOT_FOUND'
    },
    {
      name: 'malformed JSON',
      match: (resource) => String(resource).endsWith('hsk1-v-0001-0050.json'),
      response: { ok: true, status: 200, text: async () => '{bad json' },
      code: 'INVALID_JSON'
    },
    {
      name: 'count mismatch',
      match: (resource) => String(resource).endsWith('hsk1-s-0801-0900.json'),
      response: null,
      mutate: (text) => {
        const value = JSON.parse(text);
        value.records.pop();
        return { ok: true, status: 200, text: async () => JSON.stringify(value) };
      },
      code: 'SHARD_COUNT_MISMATCH'
    }
  ];
  for (const scenario of cases) {
    const loader = createHskContentLoader({
      baseUrl: './data/hsk/',
      fetchImpl: async (resource) => {
        if (!scenario.match(resource)) return fileResponse(resource);
        return scenario.mutate ? scenario.mutate(fs.readFileSync(path.join(rootDirectory, String(resource).replace(/^\.\//, '')), 'utf8')) : scenario.response;
      }
    });
    await assert.rejects(loader.loadCanonicalHsk1(), (error) => {
      assert.equal(error.code, scenario.code, scenario.name);
      assert.ok(error.message, scenario.name);
      return true;
    });
    assert.equal(loader.getHskContentLoaderState().status, 'error', scenario.name);
    assert.equal(loader.getHskContentLoaderState().cacheEntries, 0, scenario.name);
  }
});

test('mapping and dry-run outputs do not depend on fixture ordering', () => {
  const input = fixture();
  const reordered = JSON.parse(JSON.stringify(input));
  reordered.legacyLessons.reverse();
  reordered.legacyLessons.forEach((lesson) => lesson.words.reverse());
  reordered.canonicalVocabulary.reverse();
  reordered.canonicalLessons.reverse();
  reordered.canonicalLessons.forEach((lesson) => lesson.words.reverse());
  assert.deepEqual(migration.buildMappingReport(reordered), migration.buildMappingReport(input));

  const mappingReport = migration.buildMappingReport(input);
  const wordRows = [
    { word_key: 'unmatched', hanzi: '不存在', is_known: true, is_saved: false },
    { word_key: 'love', hanzi: '爱', is_known: true, is_saved: false },
    { word_key: 'behind', hanzi: '后面', is_known: false, is_saved: true }
  ];
  const first = migration.runDryRun({ mappingReport, wordRows, ownerKey: 'fixture-user', contractApi: contract });
  const second = migration.runDryRun({ mappingReport, wordRows: wordRows.slice().reverse(), ownerKey: 'fixture-user', contractApi: contract });
  assert.deepEqual(second, first);
});

test('review engine rejects malformed queues, duplicate decisions and stale manifests', () => {
  const input = fixture();
  const queue = review.createReviewQueue({
    mappingReport: migration.buildMappingReport(input),
    canonicalVocabulary: input.canonicalVocabulary
  });
  const session = review.createReviewSession(queue);
  const item = queue.items[0];
  const decision = item.candidates.length ? {
    decision: 'map',
    canonicalVocabularyId: item.candidates[0].canonicalVocabularyId,
    reviewer: 'developer-human',
    note: 'Explicitly checked evidence.'
  } : {
    decision: 'keep-unmatched',
    reviewer: 'developer-human',
    note: 'No safe target.'
  };
  const manifest = session.recordDecision(item.reviewId, decision);
  assert.throws(() => session.recordDecision(item.reviewId, decision), /already has a decision/);
  assert.equal(review.validateReviewManifest(manifest, queue), true);

  const malformed = JSON.parse(JSON.stringify(queue));
  malformed.items[0].candidates.push({
    canonicalVocabularyId: 'outside-canonical-dataset',
    simplified: '坏',
    pinyin: 'huai',
    meaningVi: 'invalid',
    score: 100,
    evidence: ['forged'],
    kind: 'suggestion'
  });
  assert.throws(() => review.createReviewSession(malformed), /signature|canonical dataset/);

  const stale = JSON.parse(JSON.stringify(manifest));
  stale.queueSignature = 'stale-queue';
  assert.throws(() => review.validateReviewManifest(stale, queue), /stale|signature/i);

  const unknownReview = JSON.parse(JSON.stringify(manifest));
  unknownReview.decisions[0].reviewId = 'review-unknown';
  assert.throws(() => review.validateReviewManifest(unknownReview, queue), /unknown or duplicate review ID/);

  const unknownLegacy = JSON.parse(JSON.stringify(manifest));
  unknownLegacy.decisions[0].legacyVocabularyId = 'legacy-unknown';
  assert.throws(() => review.validateReviewManifest(unknownLegacy, queue), /unknown legacy ID/);

  const duplicateManifest = JSON.parse(JSON.stringify(manifest));
  duplicateManifest.decisions.push({ ...duplicateManifest.decisions[0] });
  assert.throws(() => review.validateReviewManifest(duplicateManifest, queue), /unknown or duplicate review ID/);

  const candidateItem = queue.items.find((entry) => entry.candidates.length);
  assert.ok(candidateItem);
  const mappedSession = review.createReviewSession(queue);
  const mappedManifest = mappedSession.recordDecision(candidateItem.reviewId, {
    decision: 'map',
    canonicalVocabularyId: candidateItem.candidates[0].canonicalVocabularyId,
    reviewer: 'developer-human',
    note: 'Explicitly checked candidate evidence.'
  });
  const unknownCanonical = JSON.parse(JSON.stringify(mappedManifest));
  unknownCanonical.decisions[0].canonicalVocabularyId = 'canonical-unknown';
  assert.throws(() => review.validateReviewManifest(unknownCanonical, queue), /unknown canonical ID/);
});

test('canonical activation and rollback errors force the runtime back to legacy', async () => {
  let mode = 'legacy';
  let legacy;
  const activationRuntime = {
    useCanonical(lessons) {
      mode = 'canonical';
      harness.root.HSKCurriculum.levels[1] = lessons;
      throw new Error('mapping engine throw after partial activation');
    },
    useLegacy() {
      mode = 'legacy';
      harness.root.HSKCurriculum.levels[1] = legacy;
    },
    disable() {
      mode = 'legacy';
      harness.root.HSKCurriculum.levels[1] = legacy;
    }
  };
  const harness = previewHarness(activationRuntime);
  legacy = harness.legacy;
  const bridge = await harness.preview.requestDeveloperBridge();
  await assert.rejects(bridge.select('canonical'), /partial activation/);
  assert.equal(mode, 'legacy');
  assert.equal(harness.root.HSKCurriculum.levels[1], legacy);
  assert.equal(bridge.getState().mode, 'legacy');

  let rollbackMode = 'legacy';
  let failLegacyOnce = true;
  let rollbackHarness;
  const rollbackRuntime = {
    useCanonical(lessons) {
      rollbackMode = 'canonical';
      rollbackHarness.root.HSKCurriculum.levels[1] = lessons;
    },
    useLegacy() {
      if (failLegacyOnce) {
        failLegacyOnce = false;
        throw new Error('rollback interrupted');
      }
      rollbackMode = 'legacy';
      rollbackHarness.root.HSKCurriculum.levels[1] = rollbackHarness.legacy;
    },
    disable() {
      rollbackMode = 'legacy';
      rollbackHarness.root.HSKCurriculum.levels[1] = rollbackHarness.legacy;
    }
  };
  rollbackHarness = previewHarness(rollbackRuntime);
  const rollbackBridge = await rollbackHarness.preview.requestDeveloperBridge();
  await assert.rejects(rollbackBridge.verifyRollback(), /rollback interrupted/);
  assert.equal(rollbackMode, 'legacy');
  assert.equal(rollbackHarness.root.HSKCurriculum.levels[1], rollbackHarness.legacy);
});

test('mapping, review and storage failures are visible and never activate canonical runtime', async () => {
  let mode = 'legacy';
  const runtime = {
    useCanonical() { mode = 'canonical'; },
    useLegacy() { mode = 'legacy'; },
    disable() { mode = 'legacy'; }
  };

  const storageHarness = previewHarness(runtime);
  storageHarness.root.localStorage.getItem = () => { throw new Error('storage denied'); };
  const storageBridge = await storageHarness.preview.requestDeveloperBridge();
  await assert.rejects(storageBridge.select('canonical'), /Unable to read legacy storage key/);
  assert.equal(mode, 'legacy');
  assert.equal(storageBridge.getState().status, 'error');

  const mappingApi = {
    ...migration,
    buildMappingReport() { throw new Error('mapping engine throw'); }
  };
  const mappingHarness = previewHarness(runtime, { migrationApi: mappingApi });
  const mappingBridge = await mappingHarness.preview.requestDeveloperBridge();
  await assert.rejects(mappingBridge.analyzeLegacyProgress(), /mapping engine throw/);
  assert.equal(mode, 'legacy');
  assert.equal(mappingBridge.getState().progress.status, 'error');

  const reviewApi = {
    createReviewQueue() { throw new Error('review engine throw'); },
    createReviewSession: review.createReviewSession
  };
  const reviewHarness = previewHarness(runtime, { reviewApi });
  const reviewBridge = await reviewHarness.preview.requestDeveloperBridge();
  await assert.rejects(reviewBridge.buildProgressReviewQueue(), /review engine throw/);
  assert.equal(mode, 'legacy');
  assert.equal(reviewBridge.getState().progress.status, 'error');
});

test('V75 loader joins token-split shards into parseable code', async () => {
  const loaderSource = fs.readFileSync(path.join(rootDirectory, 'assets/v75/hsk1-v75-loader.js'), 'utf8');
  const parseErrors = [];
  let parsedBundles = 0;
  const sandbox = {
    fetch: async (resource) => fileResponse(resource),
    Function(code) {
      return function parseOnly() {
        new vm.Script(code);
        parsedBundles += 1;
      };
    },
    console: { error(...args) { parseErrors.push(args.map(String).join(' ')); } }
  };
  vm.runInNewContext(loaderSource, sandbox, { filename: 'hsk1-v75-loader.js' });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(parseErrors, []);
  assert.equal(parsedBundles, 2);
});

test('tracked readiness report is deterministic and keeps later gates blocked', () => {
  const generatorPath = path.join(rootDirectory, 'scripts/hsk1-production-readiness-audit.js');
  assert.equal(fs.existsSync(generatorPath), true);
  const generator = require(generatorPath);
  const generated = generator.generate(rootDirectory);
  const tracked = JSON.parse(fs.readFileSync(path.join(rootDirectory, 'reports/hsk1-production-readiness-report.json'), 'utf8'));
  assert.deepEqual(generated, tracked);
  assert.equal(generated.readiness.phase2b5.eligible, true);
  assert.equal(generated.readiness.realMigration.eligible, false);
  assert.equal(generated.readiness.production.eligible, false);
  assert.equal(generated.summary.fail, 0);
  assert.ok(generated.dimensions.every((dimension) => ['pass', 'warning', 'fail'].includes(dimension.status)));
  assert.ok(generated.dimensions.every((dimension) => Array.isArray(dimension.evidence) && dimension.files.length && dimension.tests.length));
});
