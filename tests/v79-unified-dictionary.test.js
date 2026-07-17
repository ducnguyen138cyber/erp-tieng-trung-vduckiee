const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = [1, 2, 3, 4, 5]
  .map((number) => fs.readFileSync(path.join(root, 'assets', 'v79', `unified-dictionary-v79.part${number}.txt`), 'utf8'))
  .join('');
const loader = fs.readFileSync(path.join(root, 'assets', 'v79', 'unified-dictionary-v79.js'), 'utf8');
const hskLoader = fs.readFileSync(path.join(root, 'assets', 'v79', 'hsk-dictionary-v79.js'), 'utf8');
const community = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
const pinyinPipeline = fs.readFileSync(path.join(root, 'pinyin-pro.loader.js'), 'utf8');
const homeCopy = fs.readFileSync(path.join(root, 'assets', 'v79', 'home-copy-v79.js'), 'utf8');

const context = { globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const utils = context.VDuckieDictionaryUtils;

const erpTerms = [
  ['库存', 'kù cún', 'khù xuấn', 'Tồn kho ERP', 'Kho', '', '', ''],
  ['计划', 'jì huà', 'chi hụa', 'Kế hoạch sản xuất', 'Sản xuất', '', '', '']
];
const bulkHsk = [
  { hanzi: '爱', traditional: '愛', pinyin: 'ài', pos: 'V', levels: ['1'], meanings: ['yêu; thích'] },
  { hanzi: '计划', traditional: '計劃', pinyin: 'jìhuà', pos: 'N/V', levels: ['4', '7-9'], meanings: ['kế hoạch'] },
  { hanzi: '甄别', traditional: '甄別', pinyin: 'zhēnbié', pos: 'V', levels: ['7-9'], meanings: ['phân biệt; sàng lọc'] }
];
const curriculum = {
  levels: {
    1: [{ words: [['爱', 'ài', 'Yêu', '我爱学习。', 'Tôi yêu việc học.']] }],
    4: [{ words: [['计划', 'jìhuà', 'Kế hoạch', '请按照计划完成任务。', 'Hãy hoàn thành nhiệm vụ theo kế hoạch.']] }]
  }
};
const records = utils.buildRecords(erpTerms, curriculum, null, bulkHsk);

test('merges full HSK data, curriculum and ERP by Hanzi', () => {
  assert.equal(records.length, 4);
  const shared = records.find((record) => record.hanzi === '计划');
  assert.deepEqual(Array.from(shared.sources).sort(), ['erp', 'hsk']);
  assert.deepEqual(Array.from(shared.hskLevels), ['4', '7-9']);
  assert.deepEqual(Array.from(shared.erpCategories), ['Sản xuất']);
  assert.ok(shared.meanings.hsk.includes('kế hoạch'));
  assert.ok(shared.meanings.erp.includes('Kế hoạch sản xuất'));
});

test('search supports simplified, traditional, accented and unaccented pinyin, and Vietnamese', () => {
  const find = (query) => Array.from(utils.filterRecords(records, { source: 'all', query })).map((record) => record.hanzi);
  assert.deepEqual(find('愛'), ['爱']);
  assert.deepEqual(find('ai'), ['爱']);
  assert.deepEqual(find('jihua'), ['计划']);
  assert.deepEqual(find('sang loc'), ['甄别']);
});

test('HSK 1-6 and 7-9 filters work while ERP filters remain intact', () => {
  assert.deepEqual(
    Array.from(utils.filterRecords(records, { source: 'hsk', hskLevel: '1', query: '' })).map((record) => record.hanzi),
    ['爱']
  );
  assert.deepEqual(
    Array.from(utils.filterRecords(records, { source: 'hsk', hskLevel: '7-9', query: '' })).map((record) => record.hanzi),
    ['计划', '甄别']
  );
  assert.deepEqual(
    Array.from(utils.filterRecords(records, { source: 'erp', erpGroup: 'warehouse', query: '' })).map((record) => record.hanzi),
    ['库存']
  );
});

test('v79 loaders preserve 1600 ERP terms and add the local HSK dataset', () => {
  assert.match(pinyinPipeline, /erp-terms-v77-finalize\.js\?v=77\.1/);
  assert.match(pinyinPipeline, /hsk-dictionary-v79\.js\?v=79\.0/);
  assert.match(pinyinPipeline, /unified-dictionary-v79\.js\?v=79\.0/);
  assert.doesNotMatch(pinyinPipeline, /unified-dictionary-v78/);
  assert.match(community, /home-copy-v79\.js\?v=79\.0/);
  assert.match(hskLoader, /MIN_TERMS=10000/);
  assert.match(loader, /part"\+index\+"\.txt\?v=79\.0/);
  assert.match(source, /version: "79\.0"/);
  assert.match(homeCopy, /vduckie:hsk-dictionary-ready/);
});
