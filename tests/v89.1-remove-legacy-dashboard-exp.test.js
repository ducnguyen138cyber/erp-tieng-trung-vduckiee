const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { getRuntimeSnapshot, assertAssetLoaded, assetPosition } = require('./helpers/runtime-snapshot');
const snapshot = getRuntimeSnapshot();
const legacyDashboard = fs.readFileSync(path.join(root, 'assets/v85/personal-dashboard-v85.js'), 'utf8');
const cleanup = fs.readFileSync(path.join(root, 'assets/v89/legacy-dashboard-exp-cleanup-v89.1.js'), 'utf8');
const cleanupCss = fs.readFileSync(path.join(root, 'assets/v89/legacy-dashboard-exp-cleanup-v89.1.css'), 'utf8');

test('legacy dashboard XP is a separate localStorage-derived system', () => {
  assert.match(legacyDashboard, /xp=actions\*8\+\(hsk\+erp\)\*50\+words\*3/);
  assert.doesNotMatch(legacyDashboard, /exp_transactions|get_my_exp|award_exp|VDuckieEXP/);
});

test('legacy learner-level card is hidden before paint and removed after render', () => {
  assert.match(cleanupCss, /\.v85-level\s*\{[^}]*display:\s*none\s*!important/s);
  assert.match(cleanup, /querySelectorAll\("\.v85-level"\)/);
  assert.match(cleanup, /parentNode\.removeChild/);
  assert.match(cleanup, /MutationObserver/);
});

test('entry loads the cleanup assets and runs cleanup after current EXP learning hooks', () => {
  assertAssetLoaded(assert, 'legacy-dashboard-exp-cleanup-v89.1.css', { snapshot });
  assertAssetLoaded(assert, 'legacy-dashboard-exp-cleanup-v89.1.js', { snapshot });
  assertAssetLoaded(assert, 'exp-system-v90.css', { snapshot });
  assertAssetLoaded(assert, 'exp-learning-hooks-v89.js', { snapshot });
  assert.ok(assetPosition('exp-learning-hooks-v89.js', snapshot) < assetPosition('legacy-dashboard-exp-cleanup-v89.1.js', snapshot));
});
