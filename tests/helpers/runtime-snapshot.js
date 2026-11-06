'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function normalizeAssetReference(reference) {
  return String(reference || '')
    .replace(/<\\\/script>/g, '</script>')
    .replace(/\\\//g, '/')
    .trim();
}

function isRealAssetReference(reference) {
  if (!reference) return false;
  if (reference.includes('\\.')) return false;
  if (/^(?:#|data:|blob:|javascript:|mailto:|tel:)/i.test(reference)) return false;
  return true;
}

function collectAttributeReferences(source) {
  const references = [];
  const pattern = /\b(?:src|href)=["']([^"'<>]+)["']/g;
  let match;
  while ((match = pattern.exec(source))) {
    const reference = normalizeAssetReference(match[1]);
    if (isRealAssetReference(reference)) references.push(reference);
  }
  return references;
}

function collectBootstrapReferences(indexSource) {
  const references = collectAttributeReferences(indexSource);
  const shellMatch = indexSource.match(/\bshellUrl\s*=\s*["']([^"']+)["']/);
  if (shellMatch) references.push(normalizeAssetReference(shellMatch[1]));
  return references;
}

function unique(values) {
  return [...new Set(values)];
}

function getRuntimeSnapshot(options = {}) {
  const indexSource = read('index.html');
  const shellSource = read('app-shell-v88.html');
  const bootstrap = [...indexSource.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(code => code.includes('async function restoreStaticVDuckie'));
  if (!bootstrap) throw new Error('Missing static app bootstrap');
  let effectiveHtml = '';
  const context = vm.createContext({
    __shell: shellSource, location: {search: options.search || ''}, URLSearchParams,
    console, document: {open() {}, write(html) {effectiveHtml = html;}, close() {},
      addEventListener() {throw new Error('Bootstrap failed before writing the app shell');}}
  }, {microtaskMode: 'afterEvaluate'});
  vm.runInContext('function fetch(){return Promise.resolve({ok:true,text(){return Promise.resolve(__shell)}})}', context);
  vm.runInContext(bootstrap, context, {timeout: 1000});
  if (!effectiveHtml) throw new Error('Bootstrap did not write an app shell');
  const shell = indexSource.match(/\bshellUrl\s*=\s*["']([^"']+)["']/);
  const assets = unique([...collectAttributeReferences(effectiveHtml), ...(shell ? [shell[1]] : [])]);
  return {indexSource, shellSource, effectiveHtml, assets};
}

function stripQuery(reference) {
  return String(reference).split(/[?#]/, 1)[0];
}

function assetMatches(reference, expected) {
  const actualPath = stripQuery(normalizeAssetReference(reference));
  const expectedPath = stripQuery(normalizeAssetReference(expected));
  return actualPath === expectedPath || actualPath.endsWith(`/${expectedPath}`) || path.posix.basename(actualPath) === path.posix.basename(expectedPath);
}

function findAssets(expected, snapshot = getRuntimeSnapshot()) {
  return snapshot.assets.filter((reference) => assetMatches(reference, expected));
}

function hasCacheBust(reference) {
  try {
    const parsed = new URL(reference, 'https://runtime.test/');
    return parsed.searchParams.has('v') && parsed.searchParams.get('v').trim() !== '';
  } catch (_) {
    return /[?&]v=[^&#]+/.test(reference);
  }
}

function assertAssetLoaded(assert, expected, options = {}) {
  const snapshot = options.snapshot || getRuntimeSnapshot();
  const matches = findAssets(expected, snapshot);
  assert.ok(matches.length > 0, `Runtime does not load ${expected}`);
  if (options.cacheBusted !== false) {
    assert.ok(matches.some(hasCacheBust), `${expected} is loaded without a non-empty cache-busting version`);
  }
  return matches;
}

function assetPosition(expected, snapshot = getRuntimeSnapshot()) {
  return snapshot.assets.findIndex((reference) => assetMatches(reference, expected));
}

function assertAssetNotLoaded(assert, expected, options = {}) {
  const snapshot = options.snapshot || getRuntimeSnapshot();
  assert.deepEqual(findAssets(expected, snapshot), [], `Runtime still loads retired asset ${expected}`);
}

function getRelativeRuntimeAssets(snapshot = getRuntimeSnapshot()) {
  return snapshot.assets.filter((reference) => !/^(?:https?:)?\/\//i.test(reference));
}

module.exports = {
  ROOT,
  read,
  normalizeAssetReference,
  collectAttributeReferences,
  getRuntimeSnapshot,
  findAssets,
  hasCacheBust,
  assertAssetLoaded,
  assetPosition,
  assertAssetNotLoaded,
  getRelativeRuntimeAssets
};
