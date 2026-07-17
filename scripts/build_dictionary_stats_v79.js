#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'assets', 'v79', 'hsk-dictionary');
const context = {
  console,
  setTimeout: () => 0,
  clearTimeout: () => {},
  dispatchEvent: () => {},
  CustomEvent: function CustomEvent(name, options) { this.type = name; this.detail = options && options.detail; },
  window: null,
  globalThis: null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

const scripts = [
  'lite-terms.js',
  'assets/v76/erp-terms-v76-core.js',
  'assets/v76/erp-terms-v76-production.js',
  'assets/v76/erp-terms-v76-warehouse-purchasing.js',
  'assets/v76/erp-terms-v76-sales-finance.js',
  'assets/v76/erp-terms-v76-system-documents.js',
  'assets/v77/erp-terms-v77-core.js',
  'assets/v77/erp-terms-v77-planning-production.js',
  'assets/v77/erp-terms-v77-product-plm.js',
  'assets/v77/erp-terms-v77-warehouse-wms.js',
  'assets/v77/erp-terms-v77-procurement.js',
  'assets/v77/erp-terms-v77-sales-crm.js',
  'assets/v77/erp-terms-v77-broad-candidates.js',
  'assets/v77/erp-terms-v77-finalize.js'
];

for (const relativePath of scripts) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
const hskTerms = manifest.chunks.flatMap((name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')));
const erpWords = new Set((context.ERP_TERMS || []).map((term) => term && term[0]).filter(Boolean));
const hskWords = new Set(hskTerms.map((term) => term.h).filter(Boolean));
let overlapCount = 0;
for (const word of hskWords) if (erpWords.has(word)) overlapCount++;
const totalUnique = new Set([...erpWords, ...hskWords]).size;

if (erpWords.size !== 1600) throw new Error(`Expected 1600 ERP terms, got ${erpWords.size}`);
if (hskWords.size < 10000) throw new Error(`Expected 10000+ HSK terms, got ${hskWords.size}`);

const stats = {
  version: '79.0',
  erpCount: erpWords.size,
  hskCount: hskWords.size,
  overlapCount,
  totalUnique,
  translatedHskCount: Number(manifest.translatedCount || 0),
  generatedAt: manifest.generatedAt
};
fs.writeFileSync(
  path.join(root, 'assets', 'v79', 'dictionary-stats.json'),
  JSON.stringify(stats),
  'utf8'
);
console.log(stats);
