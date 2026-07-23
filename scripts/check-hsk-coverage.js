#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { checkCoverage, writeJsonDeterministic } = require('./hsk-content-lib');
const root = path.resolve(process.argv[2] || process.cwd());
const report = checkCoverage(root);
writeJsonDeterministic(path.join(root, 'reports', 'hsk-coverage-report.json'), report);
console.log(JSON.stringify(report.totals, null, 2));
if (report.totals.validationErrors > 0) process.exitCode = 1;
