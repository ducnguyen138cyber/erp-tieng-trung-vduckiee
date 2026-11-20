/**
 * Build the optional, on-demand CVDICT search corpus for VDuckie.
 * Source: https://github.com/ph0ngp/CVDICT (CC BY-SA 4.0).
 * Node 20+. For local tests: node scripts/build-cvdict-index.mjs ./CVDICT.u8
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_DIR = 'data/dictionary/cvdict-v1';
export const ENTRY_SHARDS = 128;
export const HAN_SHARDS = 64;
const REMOTE_SOURCE = 'https://raw.githubusercontent.com/ph0ngp/CVDICT/main/CVDICT.u8';
const STOPWORDS = new Set(['va','la','cua','mot','cac','cho','theo','voi','duoc','trong','nhung','nhu','tu','den','co','khong','do','hay','nguoi','loai','thuoc','noi','ve','de','nay','kia','mang','hoac','tai','boi','trong','khi','the','lam','mot','nen','ra','vao','dung','chi','moi']);

export function vietnamese(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function latin(value) {
  return String(value || '').toLowerCase().replace(/u:/g, 'v').replace(/[üǖǘǚǜ]/g, 'v').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[1-5]/g, '').replace(/[^a-z]/g, '');
}
export function parseEntry(line) {
  if (!line || line[0] === '#') return null;
  const match = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/.exec(line);
  if (!match) return null;
  const meanings = match[4].split('/').map(s => s.trim()).filter(Boolean);
  if (!meanings.length) return null;
  return [match[2], match[1], match[3], meanings.join('; ')];
}
function bucketForChar(ch) {
  return (ch.codePointAt(0) % HAN_SHARDS).toString(16).padStart(2, '0');
}
function shardForEntry(id) {
  return (id % ENTRY_SHARDS).toString(16).padStart(2, '0');
}
function add(index, key, id) {
  if (!index[key]) index[key] = [];
  const ids = index[key];
  if (ids[ids.length - 1] !== id) ids.push(id);
}
async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value), 'utf8');
}
export async function build(raw, output = DATA_DIR, minEntries = 100000) {
  const lines = raw.split(/\r?\n/), rows = [], duplicates = new Set();
  let rejected = 0;
  for (const line of lines) {
    const row = parseEntry(line);
    if (!row) { if (line.trim() && !line.startsWith('#')) rejected++; continue; }
    const key = row[0] + '\u0000' + row[1] + '\u0000' + row[2];
    if (duplicates.has(key)) continue;
    duplicates.add(key);
    rows.push(row);
  }
  if (rows.length < minEntries) throw new Error('CVDICT source incomplete: only ' + rows.length + ' entries (minimum ' + minEntries + ')');
  await rm(output, { recursive: true, force: true });
  const entryFiles = Array.from({ length: ENTRY_SHARDS }, () => []);
  const hanIndexes = Array.from({ length: HAN_SHARDS }, () => Object.create(null));
  const pyIndexes = Object.create(null), viIndexes = Object.create(null);
  for (let id = 0; id < rows.length; id++) {
    const row = rows[id];
    entryFiles[id % ENTRY_SHARDS].push(row);
    const chars = new Set(Array.from(row[0] + row[1]).filter(ch => /\p{Script=Han}/u.test(ch)));
    for (const ch of chars) add(hanIndexes[ch.codePointAt(0) % HAN_SHARDS], ch, id);
    for (const word of new Set([row[0], row[1]])) {
      const first = Array.from(word)[0];
      if (first && Array.from(word).length > 1) add(hanIndexes[first.codePointAt(0) % HAN_SHARDS], word, id);
    }
    const pinyin = latin(row[2]);
    if (pinyin) {
      const bucket = pinyin[0];
      if (!pyIndexes[bucket]) pyIndexes[bucket] = Object.create(null);
      add(pyIndexes[bucket], pinyin, id);
    }
    const tokens = new Set(vietnamese(row[3]).split(' ').filter(token => token.length >= 2));
    for (const word of tokens) {
      const bucket = word[0];
      if (!viIndexes[bucket]) viIndexes[bucket] = Object.create(null);
      add(viIndexes[bucket], word, id);
    }
  }
  for (let i = 0; i < ENTRY_SHARDS; i++) await writeJson(output + '/entries/' + i.toString(16).padStart(2, '0') + '.json', entryFiles[i]);
  for (let i = 0; i < HAN_SHARDS; i++) await writeJson(output + '/index/han-' + i.toString(16).padStart(2, '0') + '.json', hanIndexes[i]);
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    await writeJson(output + '/index/py-' + letter + '.json', pyIndexes[letter] || {});
    await writeJson(output + '/index/vi-' + letter + '.json', viIndexes[letter] || {});
  }
  const manifest = {
    version: 1, entryCount: rows.length, rejectedLines: rejected, entryShards: ENTRY_SHARDS, hanShards: HAN_SHARDS,
    source: 'CVDICT by Phong Phan, adapted from CC-CEDICT',
    sourceUrl: 'https://github.com/ph0ngp/CVDICT', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', generatedAt: new Date().toISOString()
  };
  await writeJson(output + '/manifest.json', manifest);
  await writeFile(output + '/ATTRIBUTION.md',
    '# CVDICT dictionary data\n\nData adapted from [CVDICT by Phong Phan](https://github.com/ph0ngp/CVDICT), derived from [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict). Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).\n\nVDuckie stores a mechanically converted, shard-indexed derivative of CVDICT. Corrections to this derivative must be shared on the same license terms. Translations are reference material and may contain errors.\n', 'utf8');
  return manifest;
}
async function main() {
  const file = process.argv[2];
  let raw;
  if (file) raw = await readFile(file, 'utf8');
  else {
    const response = await fetch(REMOTE_SOURCE, { signal: AbortSignal.timeout(180000), headers: { 'User-Agent': 'VDuckie-dictionary-builder' } });
    if (!response.ok) throw new Error('CVDICT download failed: HTTP ' + response.status);
    raw = await response.text();
  }
  console.log(JSON.stringify(await build(raw)));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exitCode = 1; });
