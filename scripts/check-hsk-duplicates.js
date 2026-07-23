#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { checkDuplicates, writeJsonDeterministic } = require('./hsk-content-lib');
const root = path.resolve(process.argv[2] || process.cwd());
const report = checkDuplicates(root);
writeJsonDeterministic(path.join(root, 'reports', 'hsk-duplication-report.json'), report);
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.blockers > 0) process.exitCode = 1;
