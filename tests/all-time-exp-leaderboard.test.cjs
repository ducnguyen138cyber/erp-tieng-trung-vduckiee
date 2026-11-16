'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { getRuntimeSnapshot } = require('./helpers/runtime-snapshot');
const root = path.resolve(__dirname, '..');

function runtime(signedIn = true) {
  const nodes = Object.fromEntries(['expPodium', 'expLeaderboardList', 'expMyRank', 'expMiniList'].map(id => [id, { innerHTML: '' }]));
  const calls = [], events = [];
  // A long-time learner leads despite earning less EXP this week.
  const learners = [
    { rank: 1, display_name: 'Long-time learner', avatar_url: '', period_exp: 3, total_exp: 1500 },
    { rank: 2, display_name: 'New learner', avatar_url: '', period_exp: 90, total_exp: 90 },
  ];
  const client = { rpc(name, args) {
    calls.push({ name, ...args });
    return Promise.resolve({ data: name === 'get_my_rank' ? [{ rank: 101, period_exp: 6, total_exp: 300 }] : learners, error: null });
  } };
  const sandbox = {
    document: { readyState: 'loading', getElementById: id => nodes[id] || null, querySelectorAll: () => [], addEventListener() {}, dispatchEvent: event => events.push(event) },
    CustomEvent: function(type, options) { this.type = type; this.detail = options.detail; },
    console,
    VDuckieEXPCore: { client: () => client, session: () => signedIn ? { user: { id: 'me' } } : null,
      escapeHtml: String, initials: () => 'L', formatEXP: n => n + ' EXP', formatNumber: String, calculateUserLevel: () => ({ level: 1 }) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['exp-board-v90.js', 'home-exp-sidebar-v90.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/v90', file), 'utf8'), sandbox);
  }
  return { sandbox, nodes, calls, events };
}

test('full leaderboard and own rank always request all-time totals, including legacy weekly calls', async () => {
  const { sandbox, nodes, calls, events } = runtime();
  for (const period of [undefined, 'week', 'month']) await sandbox.VDuckieEXPBoard.refresh(period);
  assert.equal(sandbox.VDuckieEXPBoard.period(), 'total');
  assert.equal(calls.length, 2, "repeated opens share the confirmed total snapshot");
  assert.ok(calls.every(call => call.p_period === 'total'));
  assert.ok(calls.filter(call => call.name === 'get_leaderboard').every(call => call.p_limit === 100));
  assert.match(nodes.expPodium.innerHTML, /1500 EXP/);
  assert.match(nodes.expLeaderboardList.innerHTML, /1500 EXP/);
  assert.ok(nodes.expLeaderboardList.innerHTML.indexOf('Long-time learner') < nodes.expLeaderboardList.innerHTML.indexOf('New learner'));
  assert.match(nodes.expMyRank.innerHTML, /#101/);
  assert.match(nodes.expMyRank.innerHTML, /300 EXP/);
  assert.ok(events.every(event => event.detail.period === 'total'));
});

test('home top five uses total EXP for authenticated users and guests', async () => {
  for (const signedIn of [true, false]) {
    const { sandbox, nodes, calls } = runtime(signedIn);
    await sandbox.VDuckieHomeEXP90.refreshMini();
    assert.ok(calls.every(call => call.p_period === 'total'));
    assert.equal(calls[0].p_limit, 100, "Top 5 shares the full board snapshot");
    assert.equal(calls.length, signedIn ? 2 : 1);
    assert.match(nodes.expMiniList.innerHTML, /1500<small> EXP/);
    assert.doesNotMatch(nodes.expMiniList.innerHTML, /EXP tuần/);
  }
});

test('ranking UI exposes total EXP and production entry loads new asset versions', () => {
  const ui = fs.readFileSync(path.join(root, 'assets/v90/exp-leaderboard-v90.js'), 'utf8');
  assert.match(ui, /data-exp-period="total"/);
  assert.doesNotMatch(ui, /data-exp-period="(?:week|month)"/);
  for (const filename of ['exp-board-v90.js', 'exp-leaderboard-v90.js', 'home-exp-sidebar-v90.js']) {
    assert.ok(getRuntimeSnapshot().assets.some(asset => asset.endsWith(filename + '?v=beta-perf1')));
  }
});
