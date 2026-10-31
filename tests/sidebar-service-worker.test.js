'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker(online = true) {
  const handlers = {}, stores = new Map(), requests = [];
  const response = body => ({ ok: true, type: 'basic', body, clone() { return response(body); } });
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async put(request, value) { entries.set(request.url || request, value); },
        async addAll() {},
      };
    },
    async match(request, options = {}) {
      const url = request.url || request;
      for (const entries of stores.values()) for (const [key, value] of entries) {
        if (key === url || (options.ignoreSearch && key.split('?')[0] === url.split('?')[0])) return value;
      }
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../service-worker.js'), 'utf8'), {
    URL, caches,
    self: { registration: { scope: 'https://example.test/app/' }, addEventListener(type, fn) { handlers[type] = fn; }, skipWaiting() {}, clients: { claim() {} } },
    async fetch(request) { requests.push(request.url); if (!online) throw new Error('offline'); return response('current'); },
  });
  return {
    stores, requests, caches, handlers, response,
    async seed(url, body) { await (await caches.open('vduckie-pwa-v12-static')).put(url, response(body)); },
    async load(path, extra = {}) {
      let result; const pending = [];
      handlers.fetch({ request: { url: new URL(path, 'https://example.test/app/').href, method: 'GET', mode: 'cors', ...extra }, respondWith(value) { result = value; }, waitUntil(value) { pending.push(value); } });
      const value = await result;
      await Promise.all(pending);
      return value;
    },
  };
}

test('warm cache returns current sidebar code on the first online load', async () => {
  const w = worker();
  await w.seed('https://example.test/app/assets/v90/home-exp-sidebar-v90.js?v=90.3', 'before-PR43');
  assert.equal((await w.load('assets/v90/home-exp-sidebar-v90.js?v=90.3')).body, 'current');
});

test('cache-busted assets cannot reuse a different query version', async () => {
  const w = worker();
  await w.seed('https://example.test/app/assets/v90/home-exp-sidebar-v90.js?v=90.3', 'before-fix');
  assert.equal((await w.load('assets/v90/home-exp-sidebar-v90.js?v=90.4')).body, 'current');
});

test('offline code fallback uses only its exact version', async () => {
  const w = worker(false);
  await w.seed('https://example.test/app/assets/code.js?v=1', 'offline-v1');
  assert.equal((await w.load('assets/code.js?v=1')).body, 'offline-v1');
  await assert.rejects(w.load('assets/code.js?v=2'), /offline/);
});

test('no-store HTML shell fetch is not replaced by stale cached shell', async () => {
  const w = worker();
  await w.seed('https://example.test/app/app-shell-v88.html?v=learning2.9', 'old-shell');
  assert.equal((await w.load('app-shell-v88.html?v=learning2.9', { cache: 'no-store' })).body, 'current');
});

test('Supabase, OAuth and non-GET requests bypass cache; activation removes only old app caches', async () => {
  const w = worker();
  for (const [url, extra] of [['https://project.supabase.co/rest/v1/rpc/get_leaderboard', {}], ['auth/callback', {}], ['api/test', {}], ['assets/code.js', { method: 'POST' }]]) {
    assert.equal(await w.load(url, extra), undefined);
  }
  await w.caches.open('unrelated-user-cache');
  await w.caches.open('vduckie-pwa-v12-static');
  await w.caches.open('vduckie-pwa-v13-static');
  let pending;
  w.handlers.activate({ waitUntil(value) { pending = value; } });
  await pending;
  assert.deepEqual(await w.caches.keys(), ['unrelated-user-cache', 'vduckie-pwa-v13-static']);
  assert.deepEqual(w.requests, []);
});
