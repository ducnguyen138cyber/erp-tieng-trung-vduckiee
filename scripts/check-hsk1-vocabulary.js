#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { checkHsk1 } = require('./hsk1-quality-engine');

const root = path.resolve(process.argv[2] || process.cwd());
const result = checkHsk1(root);
console.log(JSON.stringify({
  phase2aComplete: result.phase2aComplete,
  status: result.status,
  counts: result.counts,
  validation: result.validation,
  duplicates: result.duplicates,
  structuralCoverage: result.coverage.structuralPercent,
  releaseReadinessCoverage: result.coverage.releaseReadinessPercent,
  qualityGate: result.qualityGate
}, null, 2));
if (!result.phase2aComplete) {
  for (const [group, issues] of Object.entries(result.issues)) {
    for (const issue of issues) console.error(`[${group}] ${typeof issue === 'string' ? issue : JSON.stringify(issue)}`);
  }
  process.exitCode = 1;
}
