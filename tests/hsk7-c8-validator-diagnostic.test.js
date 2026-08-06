'use strict';

const test = require('node:test');
const { validateRepository } = require('../scripts/hsk-content-lib');

function aggregate(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, count]) => ({ key, count }));
}

test('temporary C8 repository validator diagnostic', () => {
  const result = validateRepository(process.cwd());
  const errors = result.errors || [];
  const byRule = aggregate(errors, (issue) => issue.rule || '<none>');
  const byMessage = aggregate(errors, (issue) => `${issue.rule || '<none>'} | ${issue.message || '<none>'}`);
  const byFile = aggregate(errors, (issue) => issue.file || issue.path || '<none>');
  console.log('C8_VALIDATOR_SUMMARY=' + JSON.stringify(result.summary));
  console.log('C8_ERRORS_BY_RULE=' + JSON.stringify(byRule));
  console.log('C8_TOP_ERRORS_BY_MESSAGE=' + JSON.stringify(byMessage.slice(0, 100)));
  console.log('C8_TOP_ERROR_FILES=' + JSON.stringify(byFile.slice(0, 100)));
  console.log('C8_FIRST_300_ERRORS=' + JSON.stringify(errors.slice(0, 300)));
});
