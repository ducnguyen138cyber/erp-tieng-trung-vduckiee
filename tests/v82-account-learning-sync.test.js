const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets', 'v82', 'account-learning-sync-v82.js'), 'utf8');
const patch = fs.readFileSync(path.join(root, 'scripts', 'apply_account_sync_v82.js'), 'utf8');
const context = { globalThis: null, console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const utils = context.VDuckieAccountSyncUtils;

test('syncs durable learning data and rejects local-only browser state', () => {
  const accepted = [
    'vduckie-erp-v74-progress',
    'vduckie-hsk-section-progress-v1',
    'vduckie-erp-study-progress-v1',
    'vduckie-exercise-results-v1',
    'vduckie-review-srs-v1',
    'vduckie-study-activity-v1',
    'vduckie-study-goals-v1',
    'vduckie-learning-settings-v1',
    'vduckie-roast-enabled',
    'vduckie-hsk-roast-enabled',
    'vduckie-personal-notes-v1'
  ];
  for (const key of accepted) assert.equal(utils.isSyncableKey(key), true, key);

  const rejected = [
    'vduckie-cloud-queue-v1',
    'vduckie-hsk-active-user-v1',
    'vduckie-hsk-account-cache-v1:user',
    'vduckie-learning-profile-cache-v2:user',
    'erp-hsk-progress-v2',
    'erp-hsk-state-v2',
    'vduckie-hsk-progress-meta-v1',
    'search-query',
    'sidebar-open'
  ];
  for (const key of rejected) assert.equal(utils.isSyncableKey(key), false, key);
});

test('merges independent progress maps without losing completed work', () => {
  const local = {
    version: 2,
    fields: {
      'vduckie-erp-v74-progress': {
        value: JSON.stringify({ warehouse: { completed_at: '2026-07-17T01:00:00Z', score: 5 } }),
        updatedAt: 100
      }
    }
  };
  const remote = {
    version: 2,
    fields: {
      'vduckie-erp-v74-progress': {
        value: JSON.stringify({ production: { completed_at: '2026-07-18T01:00:00Z', score: 4 } }),
        updatedAt: 100
      }
    }
  };
  const merged = utils.merge(local, remote);
  const progress = JSON.parse(merged.fields['vduckie-erp-v74-progress'].value);
  assert.equal(progress.warehouse.score, 5);
  assert.equal(progress.production.score, 4);
});

test('newer settings win while equal-time arrays are unioned', () => {
  const local = {
    fields: {
      'vduckie-learning-settings-v1': { value: JSON.stringify({ roastHsk: true }), updatedAt: 10 },
      'vduckie-personal-history-v1': { value: JSON.stringify(['你好']), updatedAt: 20 }
    }
  };
  const remote = {
    fields: {
      'vduckie-learning-settings-v1': { value: JSON.stringify({ roastHsk: false }), updatedAt: 30 },
      'vduckie-personal-history-v1': { value: JSON.stringify(['库存']), updatedAt: 20 }
    }
  };
  const merged = utils.merge(local, remote);
  assert.equal(JSON.parse(merged.fields['vduckie-learning-settings-v1'].value).roastHsk, false);
  assert.deepEqual(Array.from(JSON.parse(merged.fields['vduckie-personal-history-v1'].value)).sort(), ['你好', '库存'].sort());
});

test('stores profile in a hidden per-user system row', () => {
  const profile = { fields: { 'vduckie-study-goals-v1': { value: '{"dailyWords":10}', updatedAt: 123 } } };
  const row = utils.profileRow(profile, 'user-abc');
  assert.equal(row.user_id, 'user-abc');
  assert.equal(row.word_key, '__vduckie_learning_profile_v2__');
  assert.equal(row.category, '__system_learning_profile__');
  assert.match(row.note, /dailyWords/);
  const parsed = utils.parseProfileRow(row);
  assert.equal(parsed.fields['vduckie-study-goals-v1'].updatedAt, 123);
});

test('streak calculation counts consecutive study dates', () => {
  const today = new Date(2026, 6, 18);
  const dates = { '2026-07-18': 2, '2026-07-17': 1, '2026-07-16': 3, '2026-07-14': 1 };
  assert.equal(utils.calculateStreak(dates, today), 3);
});

test('runtime captures all requested learning domains', () => {
  for (const token of [
    'vduckie-hsk-section-progress-v1',
    'vduckie-erp-study-progress-v1',
    'vduckie-exercise-results-v1',
    'vduckie-review-srs-v1',
    'vduckie-study-activity-v1',
    'vduckie-study-goals-v1',
    'vduckie-learning-settings-v1',
    'vduckie:learning-change',
    'vduckie:erp-lesson-progress',
    'vduckie:hsk-progress-synced'
  ]) assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('deployment patch inserts loader and filters system rows from vocabulary sync', () => {
  assert.match(patch, /account-learning-sync-v82\.js\?v=82\.0/);
  assert.match(patch, /supabase-sync\.js\?v=82\.0/);
  assert.match(patch, /\^__vduckie_/);
  assert.match(patch, /\^__system_/);
});
