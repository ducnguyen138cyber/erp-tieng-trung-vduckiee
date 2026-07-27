#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { checkCoverage, writeJsonDeterministic } = require('./hsk-content-lib');
const { checkHsk1 } = require('./hsk1-quality-engine');
const root = path.resolve(process.argv[2] || process.cwd());
const report = checkCoverage(root);
const phase2a = checkHsk1(root);
writeJsonDeterministic(path.join(root, 'reports', 'hsk-coverage-report.json'), report);
console.log(JSON.stringify({ ...report.totals, phase2a: { vocabulary: phase2a.counts.vocabulary, sentences: phase2a.counts.sentences, structuralCoverage: phase2a.coverage.structuralPercent, releaseReadinessCoverage: phase2a.coverage.releaseReadinessPercent } }, null, 2));
if (report.totals.validationErrors > 0 || !phase2a.phase2aComplete) process.exitCode = 1;
