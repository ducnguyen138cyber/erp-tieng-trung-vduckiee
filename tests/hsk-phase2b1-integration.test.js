'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createHskContentLoader } = require('../assets/hsk-content/hsk-content-loader');
const adapter = require('../assets/hsk-content/hsk-content-adapter');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const { createHskDeveloperPreview } = require('../assets/hsk-content/hsk-developer-preview');

const root = path.resolve(__dirname, '..');

function createFileFetch() {
  const calls = [];
  async function fetchImpl(resource) {
    calls.push(resource);
    const relative = String(resource).replace(/^\.\//, '');
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => fs.readFileSync(file, 'utf8') };
  }
  return { fetchImpl, calls };
}

test('Phase 2B-1 loader reads canonical HSK 1 shards once and enforces locked indexes', async () => {
  const fileFetch = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', fetchImpl: fileFetch.fetchImpl });
  const first = await loader.loadCanonicalHsk1();
  assert.equal(first.vocabulary.length, 300);
  assert.equal(first.sentences.length, 900);
  assert.equal(first.contentIndex.productionEnabled, false);
  assert.equal(first.contentIndex.publicOverrideAllowed, false);
  assert.equal(first.contentIndex.writesProgress, false);
  assert.equal(first.contentIndex.qualityGate, 'locked');
  assert.equal(fileFetch.calls.length, 18);
  const second = await loader.loadCanonicalHsk1();
  assert.equal(second, first);
  assert.equal(fileFetch.calls.length, 18);
});

test('canonical adapter covers lessons, vocabulary, all sentences, audio, search, flashcards, quiz and dictation', async () => {
  const fileFetch = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', fetchImpl: fileFetch.fetchImpl });
  const model = adapter.adaptCanonicalHsk1(await loader.loadCanonicalHsk1());
  assert.deepEqual(model.metrics, {
    lessons: 15,
    vocabulary: 300,
    sentences: 900,
    flashcards: 300,
    quizItems: 300,
    dictations: 900,
    audioTexts: 1200
  });
  assert.ok(model.lessons.every((lesson) => lesson.words.length === 20 && lesson.canonicalSentenceCount === 60));
  const renderedSentenceIds = new Set();
  for (const lesson of model.lessons) {
    for (const word of lesson.words) {
      assert.equal(word[5].length, 3);
      for (const sentence of word[5]) renderedSentenceIds.add(sentence[0]);
    }
  }
  assert.equal(renderedSentenceIds.size, 900);
  assert.ok(model.search('爱').some((item) => item.id === 'hsk1-v-0001'));
  assert.equal(model.flashcards[0].examples.length, 3);
  assert.equal(model.quizItems[0].options.length, 4);
  assert.ok(model.dictations.every((item) => item.chinese && item.audioText));
});

test('authorized Developer Preview switches canonical and legacy without progress writes', async () => {
  const fileFetch = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', fetchImpl: fileFetch.fetchImpl });
  const runtimeCalls = [];
  let runtimeMode = 'legacy';
  const runtimeBridge = {
    useCanonical(lessons, metadata) {
      runtimeMode = 'canonical';
      runtimeCalls.push(['canonical', lessons.length, metadata.vocabulary, metadata.sentences, metadata.readOnly]);
    },
    useLegacy() {
      runtimeMode = 'legacy';
      runtimeCalls.push(['legacy']);
    },
    disable() {
      runtimeMode = 'legacy';
      runtimeCalls.push(['disable']);
    }
  };
  const runtimeApi = { requestDeveloperBridge: async () => runtimeBridge };
  let dictionaryRefreshes = 0;
  const preview = createHskDeveloperPreview({
    root: {},
    flags,
    adapterApi: adapter,
    loader,
    runtimeApi,
    refreshDictionary: () => { dictionaryRefreshes += 1; }
  });
  assert.deepEqual(preview.getPublicState(), {
    mode: 'legacy',
    canonicalAvailable: false,
    publicOverrideAllowed: false,
    progressWritesEnabled: false,
    qualityGate: 'locked'
  });
  const bridge = await preview.requestDeveloperBridge();
  const canonical = await bridge.select('canonical');
  assert.equal(canonical.mode, 'canonical');
  assert.equal(canonical.readOnly, true);
  assert.equal(canonical.progressWritesEnabled, false);
  assert.equal(runtimeMode, 'canonical');
  assert.deepEqual(runtimeCalls[0], ['canonical', 15, 300, 900, true]);
  const smoke = await bridge.smokeCheck();
  assert.ok(Object.values(smoke).every(Boolean));
  const callsAfterFirstLoad = fileFetch.calls.length;
  await bridge.select('legacy');
  await bridge.select('canonical');
  assert.equal(fileFetch.calls.length, callsAfterFirstLoad);
  assert.equal(dictionaryRefreshes, 3);
  bridge.disable();
  assert.equal(runtimeMode, 'legacy');
  assert.equal(runtimeCalls.at(-1)[0], 'disable');
});

test('Developer Preview refuses access when the runtime cannot verify a developer session', async () => {
  const preview = createHskDeveloperPreview({
    root: {},
    flags,
    adapterApi: adapter,
    loader: { loadCanonicalHsk1: async () => { throw new Error('must not load'); } },
    runtimeApi: { requestDeveloperBridge: async () => { throw new Error('not authorized'); } }
  });
  await assert.rejects(preview.requestDeveloperBridge(), /not authorized/);
});

test('production runtime keeps canonical progress writes blocked and only exposes a verified bridge', () => {
  const hskRuntime = fs.readFileSync(path.join(root, 'hsk-lessons.js'), 'utf8');
  const controller = fs.readFileSync(path.join(root, 'assets/developer/developer-control-center.js'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appShell = fs.readFileSync(path.join(root, 'app-shell-v88.html'), 'utf8');
  const community = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
  const legacyLoader = fs.readFileSync(path.join(root, 'assets/v75/hsk1-v75-loader.js'), 'utf8');
  assert.match(hskRuntime, /if \(previewState\.readOnly\) return false/);
  assert.match(hskRuntime, /if \(passed && !previewState\.readOnly/);
  assert.match(hskRuntime, /client\.auth\.getUser\(session\.access_token\)/);
  assert.match(hskRuntime, /normalizedEmail\(verified\.email\) !== DEVELOPER_EMAIL/);
  assert.match(controller, /hskPreview\.requestDeveloperBridge\(\)/);
  assert.match(controller, /currentHskBridge\.disable\(\)/);
  assert.ok(index.indexOf('hsk-content-feature-flags.js?v=2b1.0') < index.indexOf('hsk-progress-contract.js?v=2b2.0'));
  assert.ok(index.indexOf('hsk-progress-contract.js?v=2b2.0') < index.indexOf('hsk-progress-migration.js?v=2b2.0'));
  assert.ok(index.indexOf('hsk-progress-migration.js?v=2b2.0') < index.indexOf('hsk-developer-preview.js?v=2b2.0'));
  assert.ok(index.indexOf('hsk-developer-preview.js?v=2b2.0') < index.indexOf('developer-control-center.js?v=2b2.0'));
  assert.match(appShell, /hsk-lessons\.js\?v=2b1\.0/);
  assert.match(appShell, /community\.js\?v=2b1\.0/);
  assert.match(community, /hsk1-v75-loader\.js\?v=2b1\.0/);
  assert.match(legacyLoader, /\.part"\+i\+"\.txt\?v=2b1\.0/);
});
