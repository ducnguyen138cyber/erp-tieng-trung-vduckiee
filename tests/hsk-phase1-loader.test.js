'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createHskContentLoader } = require('../assets/hsk-content/hsk-content-loader');

const root = path.resolve(__dirname, '..');

function createFileFetch(overrides = {}) {
  const calls = [];
  async function fetchImpl(resource) {
    calls.push(resource);
    if (Object.prototype.hasOwnProperty.call(overrides, resource)) return overrides[resource];
    const relative = String(resource).replace(/^\.\//, '');
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => fs.readFileSync(file, 'utf8') };
  }
  return { fetchImpl, calls };
}

test('loader loads fixture manifest and only requested level lazily', async () => {
  const mock = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/manifest.json', fetchImpl: mock.fetchImpl });
  const manifest = await loader.loadHskManifest();
  assert.equal(manifest.curriculumId, 'vduckie-hsk-phase1-fixture');
  assert.equal(mock.calls.length, 1);
  const level = await loader.loadHskLevel(1);
  assert.equal(level.id, 'hsk1-fixture');
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.calls.some((resource) => resource.includes('hsk2')), false);
});

test('loader loads one unit and one lesson without loading sibling lesson', async () => {
  const mock = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/manifest.json', fetchImpl: mock.fetchImpl });
  const unit = await loader.loadHskUnit(1, 'hsk1-fixture-u01');
  assert.equal(unit.lessonRefs.length, 2);
  const lesson = await loader.loadHskLesson(1, 'hsk1-fixture-u01-l01');
  assert.equal(lesson.id, 'hsk1-fixture-u01-l01');
  assert.equal(mock.calls.some((resource) => resource.endsWith('hsk1-fixture-u01-l02.json')), false);
});

test('successful requests are cached', async () => {
  const mock = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/manifest.json', fetchImpl: mock.fetchImpl });
  await loader.loadHskLesson(1, 'hsk1-fixture-u01-l01');
  const firstCount = mock.calls.length;
  await loader.loadHskLesson(1, 'hsk1-fixture-u01-l01');
  assert.equal(mock.calls.length, firstCount);
  assert.ok(loader.getHskContentLoaderState().cacheEntries >= 3);
});

test('missing file returns explicit FILE_NOT_FOUND state', async () => {
  const mock = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/missing.json', fetchImpl: mock.fetchImpl, timeoutMs: 100 });
  await assert.rejects(loader.loadHskManifest(), (error) => error.code === 'FILE_NOT_FOUND');
  assert.equal(loader.getHskContentLoaderState().status, 'error');
});

test('invalid runtime schema is rejected before data can be rendered', async () => {
  const resource = './data/hsk/fixtures/manifest.json';
  const mock = createFileFetch({
    [resource]: { ok: true, status: 200, text: async () => JSON.stringify({ schemaVersion: '1.0.0', levels: [] }) }
  });
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/manifest.json', fetchImpl: mock.fetchImpl });
  await assert.rejects(loader.loadHskManifest(), (error) => error.code === 'SCHEMA_INVALID');
});

test('clearHskContentCache empties cache and returns idle state', async () => {
  const mock = createFileFetch();
  const loader = createHskContentLoader({ baseUrl: './data/hsk/', manifestPath: 'fixtures/manifest.json', fetchImpl: mock.fetchImpl });
  await loader.loadHskManifest();
  loader.clearHskContentCache();
  assert.deepEqual(loader.getHskContentLoaderState(), { status: 'idle', error: null, lastResource: null, cacheEntries: 0, cachedResources: [] });
});
