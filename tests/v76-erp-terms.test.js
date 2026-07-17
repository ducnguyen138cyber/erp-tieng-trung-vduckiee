const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const parts = [
  'erp-terms-v76-production.js',
  'erp-terms-v76-warehouse-purchasing.js',
  'erp-terms-v76-sales-finance.js',
  'erp-terms-v76-system-documents.js'
].map((name) => fs.readFileSync(path.join(root, 'assets', 'v76', name), 'utf8'));
const source = parts.join('\n');
const core = fs.readFileSync(path.join(root, 'assets', 'v76', 'erp-terms-v76-core.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'pinyin-pro.loader.js'), 'utf8');

test('v76 contributes a substantial ERP vocabulary expansion', () => {
  const rows = source.match(/^\["/gm) || [];
  assert.ok(rows.length >= 250, `expected at least 250 curated rows, got ${rows.length}`);
});

test('v76 covers the main company ERP workflows', () => {
  for (const term of [
    '批次需求计划', '净需求', '生产计划锁定', '托外进货',
    '组成用量', '损耗率', '盘点', '请购单', '采购单',
    '报价单', '销货单', '资产折旧', '权限复制', '凭证设计'
  ]) {
    assert.match(source, new RegExp(term));
  }
});

test('merge core deduplicates terms and keeps the eight-field schema', () => {
  assert.match(core, /existing\[row\[0\]\]/);
  assert.match(core, /var term=\[row\[0\],"","",row\[1\]/);
  assert.match(core, /ERPPronunciation\.generate/);
  assert.match(core, /refreshVisiblePronunciation/);
});

test('loader injects all v76 parts before the main app starts', () => {
  for (const name of [
    'erp-terms-v76-core.js',
    'erp-terms-v76-production.js',
    'erp-terms-v76-warehouse-purchasing.js',
    'erp-terms-v76-sales-finance.js',
    'erp-terms-v76-system-documents.js'
  ]) {
    assert.match(loader, new RegExp(name.replaceAll('.', '\\.') + '\\?v=76\\.0'));
  }
  assert.match(loader, /document\.write\('<script src="'/);
  assert.doesNotMatch(loader, /<\\\\\/script>/);
});
