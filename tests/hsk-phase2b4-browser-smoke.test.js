'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

test('Phase 2B-4 browser smoke covers viewports, roles, failure, reload and two tabs', { timeout: 120000 }, () => {
  const script = path.join(__dirname, 'hsk-phase2b4-browser-smoke.py');
  const result = spawnSync(process.env.PYTHON || 'python', [script], { encoding: 'utf8', timeout: 110000 });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.viewports.length, 4);
  assert.deepEqual(payload.viewports.map((entry) => [entry.width, entry.height]), [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [320, 568]
  ]);
  payload.viewports.forEach((entry) => {
    assert.equal(entry.role, 'developer');
    assert.deepEqual(entry.writes, { storage: 0, canonicalStorage: 0, supabase: 0, rpc: 0, exp: 0 });
    assert.deepEqual(entry.layout, { visible: true, overflow: false, inViewport: true });
  });
  assert.equal(payload.roles.regular.mode, 'legacy');
  assert.equal(payload.roles.regular.authorized, false);
  assert.equal(payload.roles.logout.mode, 'legacy');
  assert.equal(payload.roles.permissionRevoked.authorized, false);
  assert.equal(payload.failures.canonical404.mode, 'legacy');
  assert.deepEqual(payload.failures.canonical404.writes, [0, 0, 0, 0, 0]);
  assert.deepEqual(payload.multiTab, { firstReviewed: 1, secondReviewed: 0, canonicalStorage: null });
});
