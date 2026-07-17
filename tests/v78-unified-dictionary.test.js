const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = [1, 2, 3, 4, 5]
  .map((number) => fs.readFileSync(path.join(root, 'assets', 'v78', `unified-dictionary-v78.part${number}.txt`), 'utf8'))
  .join('');
const runtimeLoader = fs.readFileSync(path.join(root, 'assets', 'v78', 'unified-dictionary-v78.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets', 'v78', 'unified-dictionary-v78.css'), 'utf8');
const communityLoader = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
const context = { globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const utils = context.VDuckieDictionaryUtils;

const erp = [
  ['库存', 'kù cún', 'khù xuấn', 'Tồn kho', 'Kho', '', '', ''],
  ['计划', 'jì huà', 'chi hụa', 'Kế hoạch sản xuất', 'Sản xuất', '', '', '']
];
const hsk = {
  levels: {
    1: [{ words: [['你好', 'nǐ hǎo', 'Xin chào', '你好！', 'Xin chào!'], ['计划', 'jìhuà', 'Kế hoạch', '我有计划。', 'Tôi có kế hoạch.']] }],
    2: [], 3: [], 4: []
  }
};
const records = utils.buildRecords(erp, hsk, null);

test('merges HSK and ERP records by Hanzi without duplicates', () => {
  assert.equal(records.length, 3);
  const shared = records.find((record) => record.hanzi === '计划');
  assert.deepEqual(Array.from(shared.sources).sort(), ['erp', 'hsk']);
  assert.equal(shared.hskLevel, 1);
  assert.deepEqual(Array.from(shared.erpCategories), ['Sản xuất']);
});

test('finds ERP-only, HSK-only and shared terms with unaccented or compact pinyin', () => {
  assert.deepEqual(Array.from(utils.filterRecords(records, { source: 'erp', query: 'ton kho' })).map((record) => record.hanzi), ['库存']);
  assert.deepEqual(Array.from(utils.filterRecords(records, { source: 'hsk', query: 'ni hao' })).map((record) => record.hanzi), ['你好']);
  assert.deepEqual(Array.from(utils.filterRecords(records, { source: 'hsk', query: 'nihao' })).map((record) => record.hanzi), ['你好']);
  assert.deepEqual(Array.from(utils.filterRecords(records, { source: 'all', query: 'jihua' })).map((record) => record.hanzi), ['计划']);
});

test('source and secondary filters work without clearing the search query', () => {
  const state = { source: 'hsk', query: 'ke hoach', hskLevel: '1', erpGroup: 'all' };
  assert.deepEqual(Array.from(utils.filterRecords(records, state)).map((record) => record.hanzi), ['计划']);
  state.source = 'erp';
  state.erpGroup = 'production';
  assert.equal(state.query, 'ke hoach');
  assert.deepEqual(Array.from(utils.filterRecords(records, state)).map((record) => record.hanzi), ['计划']);
});

test('ERP business mapping covers all requested filters', () => {
  assert.equal(utils.mapErpGroup('Sản xuất'), 'production');
  assert.equal(utils.mapErpGroup('Kho'), 'warehouse');
  assert.equal(utils.mapErpGroup('Mua hàng'), 'purchasing');
  assert.equal(utils.mapErpGroup('Tài chính'), 'accounting');
  assert.equal(utils.mapErpGroup('Chất lượng'), 'quality');
  assert.equal(utils.mapErpGroup('Hệ thống'), 'other');
});

test('independent dictionary navigation, lookup buttons and speech remain installed', () => {
  assert.match(source, /data-dictionary-menu/);
  assert.match(source, /data-open-dictionary/);
  assert.match(source, /oldGlossary\.classList\.add\("hidden"\)/);
  assert.match(source, /vduckie:erp-v77-ready/);
  assert.match(source, /speechSynthesis\.speak/);
  assert.match(source, /version: "78\.0"/);
  assert.match(communityLoader, /unified-dictionary-v78\.js\?v=78\.0/);
  assert.match(runtimeLoader, /Promise\.all\(tasks\)/);
  for (let number = 1; number <= 5; number++) assert.match(runtimeLoader, new RegExp(`part"\\+index\\+"\\.txt\\?v=78\\.0`));
});

test('responsive CSS covers 80–125% style pressure, mobile and long content', () => {
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /minmax\(min\(100%,330px\),1fr\)/);
  assert.match(css, /@media\(max-width:1180px\)/);
  assert.match(css, /@media\(max-width:980px\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:430px\)/);
});
