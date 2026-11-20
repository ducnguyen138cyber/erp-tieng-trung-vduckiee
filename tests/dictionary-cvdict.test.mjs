import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, parseEntry, latin, vietnamese } from '../scripts/build-cvdict-index.mjs';

test('CVDICT parser keeps simplified, traditional, Pinyin, Vietnamese meanings', () => {
  assert.deepEqual(parseEntry('學習 学习 [xue2 xi2] /học tập/học hỏi/'), ['学习', '學習', 'xue2 xi2', 'học tập; học hỏi']);
  assert.equal(parseEntry('# license: CC BY-SA 4.0'), null);
  assert.equal(parseEntry('invalid line'), null);
  assert.equal(latin('lǜ4 / lu:4'), 'lvlv');
  assert.equal(vietnamese('Nhập kho thành phẩm'), 'nhap kho thanh pham');
});
test('CVDICT build emits precise Hanzi, Pinyin, Vietnamese indexes and entry shards', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vduckie-cvdict-'));
  try {
    const sample = [
      '# sample', '中國 中国 [Zhong1 guo2] /Trung Quốc/nước Trung Quốc/',
      '學習 学习 [xue2 xi2] /học tập/việc học/',
      '入庫 入库 [ru4 ku4] /nhập kho/', '庫存 库存 [ku4 cun2] /tồn kho/',
      '中國 中国 [Zhong1 guo2] /Trung Quốc/nước Trung Quốc/'
    ].join('\n');
    const info = await build(sample, dir + '/data', 4);
    assert.equal(info.entryCount, 4);
    assert.equal(info.license, 'CC BY-SA 4.0');
    const readJson = async p => JSON.parse(await readFile(dir + '/data/' + p, 'utf8'));
    const cnBucket = ('中'.codePointAt(0) % 64).toString(16).padStart(2, '0');
    const cn = await readJson('index/han-' + cnBucket + '.json');
    assert.deepEqual(cn['中国'], [0]);
    const py = await readJson('index/py-r.json');
    assert.deepEqual(py['ruku'], [2]);
    const vi = await readJson('index/vi-n.json');
    assert.ok(vi['nhap'].includes(2));
    const shard = await readJson('entries/02.json');
    assert.equal(shard[0][0], '入库');
    assert.equal((await readJson('manifest.json')).entryShards, 128);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Browser lookup resolves exact Hanzi, numbered Pinyin and Vietnamese phrases from lazy shards', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vduckie-lookup-'));
  try {
    await build([
      '學習 学习 [xue2 xi2] /học tập/việc học/',
      '入庫 入库 [ru4 ku4] /nhập kho/',
      '庫存 库存 [ku4 cun2] /tồn kho/',
      '中國 中国 [Zhong1 guo2] /Trung Quốc/'
    ].join('\n'), dir + '/data', 4);
    const manifest = JSON.parse(await readFile(dir + '/data/manifest.json', 'utf8'));
    // The fixture has four rows; the public client deliberately refuses
    // incomplete production corpora, so mock only the declared row count.
    manifest.entryCount = 122000;
    await writeFile(dir + '/data/manifest.json', JSON.stringify(manifest));
    const root = {
      fetch: async (url) => {
        const file = url.split('cvdict-v1/')[1];
        try {
          const data = await readFile(dir + '/data/' + file, 'utf8');
          return { ok: true, json: async () => JSON.parse(data) };
        } catch { return { ok: false, status: 404 }; }
      },
      console: { warn() {} }
    };
    const browserCode = await readFile('assets/search/dictionary-expanded.js', 'utf8');
    runInNewContext(browserCode, { window: root, Promise, Set });
    const lookup = root.VDuckieExpandedDictionary.lookup;
    assert.equal((await lookup('入库'))[0].hanzi, '入库');
    assert.equal((await lookup('ru4 ku4'))[0].pinyin, 'rù kù');
    assert.equal((await lookup('nhập kho'))[0].hanzi, '入库');
    assert.equal((await lookup('học tập'))[0].hanzi, '学习');
    assert.equal((await lookup('學習'))[0].hanzi, '学习');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
