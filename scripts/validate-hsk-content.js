#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { validateRepository } = require('./hsk-content-lib');
const root = path.resolve(process.argv[2] || process.cwd());
const result = validateRepository(root);
console.log(JSON.stringify({ ok: result.ok, ...result.summary }, null, 2));
for (const issue of result.errors) {
  const target = [issue.file, issue.id].filter(Boolean).join(' :: ');
  console.error(`[${issue.rule}] ${target} :: ${issue.message}`);
}
if (!result.ok) process.exitCode = 1;
