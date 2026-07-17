const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const candidates = fs.readFileSync(path.join(root, 'assets', 'v77', 'erp-terms-v77-broad-candidates.js'), 'utf8');
const finalize = fs.readFileSync(path.join(root, 'assets', 'v77', 'erp-terms-v77-finalize.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'pinyin-pro.loader.js'), 'utf8');

function createContext(startCount) {
  const context = { console, setTimeout, clearTimeout, globalThis: null };
  context.globalThis = context;
  context.ERP_TERMS = Array.from({ length: startCount }, (_, index) => [
    `旧词${index}`, '', '', '', 'Legacy', '', '', ''
  ]);
  context.VDuckieERPTermsV77 = {
    terms: context.ERP_TERMS,
    added: [],
    addText(text) {
      for (const line of String(text).split(/\r?\n/)) {
        const row = line.trim().split('\t');
        if (!row[0] || this.terms.some((term) => term[0] === row[0])) continue;
        const term = [row[0], '', '', row[1] || '', row[2] || '', row[3] || '', '', ''];
        this.terms.push(term);
        this.added.push(term);
      }
    },
    finish(categories, sourceCount, sources) {
      context.ERP_TERMS_V77 = {
        categories,
        sourceCount,
        sources,
        addedCount: this.added.length,
        totalCount: this.terms.length
      };
    }
  };
  context.PinyinEngineReady = Promise.resolve(false);
  vm.createContext(context);
  return context;
}

test('v77.1 candidate pool is broad and duplicate free', () => {
  const context = createContext(0);
  vm.runInContext(candidates, context);
  const rows = context.__ERP_V77_CANDIDATES__;
  assert.ok(rows.length >= 1400, `expected at least 1400 candidates, got ${rows.length}`);
  assert.equal(new Set(rows.map((row) => row[0])).size, rows.length);
  for (const category of ['Tài chính', 'Chất lượng', 'Bảo trì', 'Logistics', 'Nhân sự', 'Dự án', 'Dữ liệu']) {
    assert.ok(rows.some((row) => row[2] === category), `missing ${category}`);
  }
});

test('v77.1 finalizer stops at exactly 1600 unique ERP terms', () => {
  const context = createContext(850);
  vm.runInContext(candidates, context);
  vm.runInContext(finalize, context);
  assert.equal(context.ERP_TERMS.length, 1600);
  assert.equal(new Set(context.ERP_TERMS.map((term) => term[0])).size, 1600);
  assert.equal(context.ERP_TERMS_V77.targetReached, true);
  assert.equal(context.ERP_TERMS_V77.version, '77.1');
});

test('loader preserves committed v77 groups and runs finalizer last', () => {
  const files = [
    'erp-terms-v77-core.js',
    'erp-terms-v77-planning-production.js',
    'erp-terms-v77-product-plm.js',
    'erp-terms-v77-warehouse-wms.js',
    'erp-terms-v77-procurement.js',
    'erp-terms-v77-sales-crm.js',
    'erp-terms-v77-broad-candidates.js',
    'erp-terms-v77-finalize.js'
  ];
  let lastIndex = -1;
  for (const file of files) {
    const index = loader.indexOf(file);
    assert.ok(index > lastIndex, `${file} must be loaded in order`);
    lastIndex = index;
  }
  assert.match(loader, /v=77\.1/);
});
