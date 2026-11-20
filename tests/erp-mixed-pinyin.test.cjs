const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');

// Exercise the actual bundled Pinyin engine, not a mocked transliterator.
const context = vm.createContext({});
for (let i = 1; i <= 16; i++) vm.runInContext(fs.readFileSync(`pinyin-data${i}.js`, 'utf8'), context);
vm.runInContext(zlib.gunzipSync(Buffer.from(context.__PINYIN_GZIP_PARTS__.join(''), 'base64')).toString(), context);
vm.runInContext(fs.readFileSync('pronunciation.js', 'utf8'), context);
const generate = context.ERPPronunciation.generate;

test('ERP example preserves Excel in its original position', () => {
  assert.equal(generate('物料清单现在用Excel管理。').pinyin, 'wù liào qīng dān xiàn zài yòng Excel guǎn lǐ');
});
test('Chinese-only terms keep the same Pinyin and no punctuation', () => {
  assert.equal(generate('库存。').pinyin, 'kù cún');
  assert.equal(generate('，。').pinyin, '');
});
test('Latin identifiers and numbers survive transliteration intact', () => {
  assert.equal(generate('用ERP管理B01库存').pinyin, 'yòng ERP guǎn lǐ B01 kù cún');
});

test('flashcard example waits for the engine and ignores stale card results', async () => {
  const shell = fs.readFileSync('app-shell-v88.html', 'utf8');
  assert.match(shell, /node.id="cardExamplePinyin"/);
  assert.match(shell, /renderExamplePinyin\(t\[6\]\|\|""\)/);
  const fn = shell.match(/^    function renderExamplePinyin\(value\).*$/m)[0];
  const nodes = { cardExample: { textContent: '', insertAdjacentElement(position,node) { assert.equal(position,'afterend');nodes[node.id]=node; } } };
  let ready;
  const sandbox = vm.createContext({ $: id => nodes[id], document:{createElement(tag) { assert.equal(tag,'span'); return {textContent:''}; }}, window: { PinyinEngineReady: new Promise(r => ready = r), ERPPronunciation: context.ERPPronunciation } });
  vm.runInContext(fn, sandbox);
  nodes.cardExample.textContent = '物料清单现在用Excel管理。';
  sandbox.renderExamplePinyin(nodes.cardExample.textContent);
  nodes.cardExample.textContent = '库存';
  sandbox.renderExamplePinyin('库存');
  ready(true);
  await new Promise(r => setImmediate(r));
  assert.equal(nodes.cardExamplePinyin.textContent, 'kù cún');
  sandbox.renderExamplePinyin('');
  assert.equal(nodes.cardExamplePinyin.textContent, '');
});
