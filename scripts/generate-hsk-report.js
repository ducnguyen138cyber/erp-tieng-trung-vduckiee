#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { generateReports } = require('./hsk-content-lib');
const root = path.resolve(process.argv[2] || process.cwd());
const result = generateReports(root);
console.log(JSON.stringify({ qualityGate: result.quality.qualityGate, phase2Allowed: result.quality.phase2Allowed, productionCurriculumAllowed: result.quality.productionCurriculumAllowed, validationErrors: result.validation.summary.errors, duplicateBlockers: result.duplication.summary.blockers, reports: Object.keys(result.reports).sort() }, null, 2));
if (!result.validation.ok || result.duplication.summary.blockers > 0) process.exitCode = 1;
