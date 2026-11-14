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
    'sidebar-open',
    'vduckie-vietnamese-v1:alice'
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

test('deployment patch isolates accounts and installs v82.1', () => {
  assert.match(patch, /account-learning-sync-v82\.js\?v=82\.1/);
  assert.match(patch, /supabase-sync\.js\?v=82\.1/);
  assert.match(patch, /function switchLocalProfile\(nextUserId\)/);
  assert.match(patch, /removeSyncableValues\(\)/);
  assert.match(patch, /readProfileCache\("anonymous"\)/);
  assert.match(patch, /\^__vduckie_/);
  assert.match(patch, /\^__system_/);
});


function accountRuntime() {
  const values = new Map();
  const timers = new Map();
  let timerId = 0;
  const reads = [];
  const writes = [];
  const ctx = {
    console,
    navigator: { onLine: true },
    localStorage: {
      get length() { return values.size; },
      key: (index) => Array.from(values.keys())[index] || null,
      getItem: (key) => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key)
    },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id)
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,"assets/v82/learning-progress-merge-v1.js"),"utf8"),ctx);
  // Instrument private lifecycle functions only in this VM, never in production.
  vm.runInContext(source.replace('  root.VDuckieAccountSyncUtils = {', `
    root.testLifecycle = {
      attach: function(value) { client = value; },
      session: handleSession,
      schedule: scheduleUpload,
      maybeReload: maybeReload
    };
    root.VDuckieAccountSyncUtils = {`), ctx);
  ctx.testLifecycle.attach({ from() { return {
    select() { return this; }, eq() { return this; },
    maybeSingle() { return new Promise(done => reads.push(row => done({data:row,error:null}))); },
    insert(rows) { writes.push(...rows);return {select(){return Promise.resolve({data:rows.map(r=>({word_key:r.word_key})),error:null});}}; },
    update(row) { writes.push(row);return {eq(){return this;},select(){return Promise.resolve({data:[{word_key:row.word_key}],error:null});}}; }
  }; } });
  return { ctx, values, timers, reads, writes, api: ctx.testLifecycle };
}

test('anonymous bootstrap retains HSK mastery, SRS and resume position across repeated session initialization', () => {
  const r = accountRuntime();
  const key = 'vduckie-hsk-study-journey-v1';
  const progress = JSON.stringify({current:{level:3,lessonId:'hsk3-lesson-01'},lessons:{'hsk3-lesson-01':{position:{stage:'words',cards:{0:3}},masteryAnswers:{q1:{correct:false,verified:true}}}},reviews:{'3:努力':{weak:true,nextAt:1}}});
  r.values.set(key, progress);
  r.api.session(null);
  assert.equal(r.values.get(key), progress);
  r.api.session(null);
  assert.equal(r.values.get(key), progress);
  assert.equal(r.writes.length, 0);
});

test('cold-start expired account data is never captured as guest progress', () => {
  const r = accountRuntime();
  r.values.set('vduckie-learning-profile-active-user-v2', 'alice');
  r.values.set('vduckie-hsk-study-journey-v1', '{"privateAccountProgress":true}');
  r.api.session(null);
  assert.equal(r.values.has('vduckie-hsk-study-journey-v1'), false);
  assert.doesNotMatch(r.values.get('vduckie-learning-profile-cache-v2:anonymous') || '', /privateAccountProgress/);
});

test('logout cancels a queued learning upload even if its callback was already queued', async () => {
  const r = accountRuntime();
  r.api.session({user:{id:'alice'}});
  r.values.set('vduckie-study-goals-v1', '{"dailyWords":12}');
  r.api.schedule();
  const staleCallback = Array.from(r.timers.values())[0];
  assert.equal(typeof staleCallback, 'function');
  r.api.session(null);
  assert.equal(r.timers.size, 0);
  assert.doesNotThrow(() => staleCallback());
  r.reads[0](null);
  await new Promise(setImmediate);
  assert.equal(r.writes.length, 0);
});

test('late profile fetch and queued upload cannot apply Alice data after switching to Bob', async () => {
  const r = accountRuntime();
  r.api.session({user:{id:'alice'}});
  r.values.set('vduckie-study-goals-v1', '{"dailyWords":12}');
  r.api.schedule();
  const staleCallback = Array.from(r.timers.values())[0];
  r.api.session({user:{id:'bob'}});
  staleCallback();
  const remote = utils.profileRow({fields:{'vduckie-study-goals-v1':{value:'{"dailyWords":99}',updatedAt:Date.now()+10000}}}, 'alice');
  r.reads[0](remote);
  await new Promise(setImmediate);
  assert.notEqual(r.values.get('vduckie-study-goals-v1'), '{"dailyWords":99}');
  assert.equal(r.writes.length, 0);
  r.reads[1](null);
  await new Promise(setImmediate);
  assert.equal(r.writes.length, 1);
  assert.equal(r.writes[0].user_id, 'bob');
  assert.doesNotMatch(r.writes[0].note, /dailyWords/);
});


test('remote legacy visits and timestamp-only settings cannot reload an active HSK answer',()=>{
 const r=accountRuntime();let reloaded=0;r.ctx.location={reload(){reloaded++;}};r.ctx.VDuckieHskStudyFlow={getCurrent(){return {level:2,lessonId:'hsk2-lesson-15'};}};
 const key='vduckie-learning-settings-v1',before={fields:{[key]:{value:JSON.stringify({roastHsk:true,updatedAt:1})}}},after={fields:{[key]:{value:JSON.stringify({roastHsk:true,updatedAt:2})}}};
 r.api.maybeReload('alice',after,['vduckie-hsk-section-progress-v1',key],[key],before);
 assert.equal(r.timers.size,0);assert.equal(reloaded,0);
 // An actual preference change still takes the existing refresh path.
 after.fields[key].value=JSON.stringify({roastHsk:false,updatedAt:3});
 r.api.maybeReload('alice',after,[key],[key],before);assert.equal(r.timers.size,1);
});
