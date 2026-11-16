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

test('concurrent mini/full refreshes coalesce RPCs and reuse one all-time snapshot', async () => {
  const {sandbox,calls,nodes}=runtime();
  await Promise.all([sandbox.VDuckieEXPBoard.refresh(),sandbox.VDuckieHomeEXP90.refreshMini()]);
  assert.equal(calls.length,2);
  assert.match(nodes.expMiniList.innerHTML,/1500/);
  assert.match(nodes.expLeaderboardList.innerHTML,/1500/);
  const content=nodes.expLeaderboardList.innerHTML;
  const refresh=sandbox.VDuckieEXPBoard.refresh();
  assert.equal(nodes.expLeaderboardList.innerHTML,content,'resolved rows remain while refreshing');
  await refresh;
});

test('account switch rejects stale leaderboard completion and cache is identity scoped', async () => {
  const {sandbox,calls,nodes}=runtime();
  let resolve;
  sandbox.VDuckieEXPCore.client().rpc=(name)=>new Promise(done=>{if(name==='get_leaderboard')resolve=done;else done({data:[],error:null})});
  const pending=sandbox.VDuckieEXPBoard.refresh();
  sandbox.VDuckieEXPCore.session=()=>({user:{id:'other'}});
  resolve({data:[{rank:1,display_name:'Previous account',total_exp:200,period_exp:2}],error:null});
  await pending;
  assert.doesNotMatch(nodes.expLeaderboardList.innerHTML,/Previous account/);
});

test('EXP startup waits for identity and adjacent same-user auth events coalesce', async () => {
  let init,authChanged,sessionResolve,readResolve,reads=0,notifications=0,now=10000;
  const s={user:{id:'A',user_metadata:{full_name:'Alice'}}};
  const sandbox={VDUCKIE_SUPABASE_CONFIG:{url:'https://fixture.supabase.co',publishableKey:'sb_publishable_fixture'},
    supabase:{createClient:()=>({auth:{getSession:()=>new Promise(r=>sessionResolve=r),onAuthStateChange(fn){authChanged=fn}},rpc(){reads++;return new Promise(r=>readResolve=r)}})},
    document:{readyState:'loading',getElementById:()=>null,addEventListener:(type,fn)=>{if(type==='DOMContentLoaded')init=fn},dispatchEvent(){}},
    console,Intl,Date:{now:()=>now},CustomEvent:class{},setTimeout:fn=>fn(),clearTimeout(){}};
  sandbox.window=sandbox;vm.runInNewContext(fs.readFileSync(path.join(root,'assets/v90/exp-core-v90.js'),'utf8'),sandbox);
  sandbox.VDuckieEXPCore.onSession(()=>notifications++);assert.equal(notifications,0,'no temporary guest render');
  init();sessionResolve({data:{session:s}});await Promise.resolve();
  assert.equal(notifications,1);
  const a=sandbox.VDuckieEXP.getCurrentUserEXP(),b=sandbox.VDuckieEXP.getCurrentUserEXP();assert.equal(reads,1);
  readResolve({data:1500,error:null});assert.equal(await a,1500);assert.equal(await b,1500);
  authChanged('SIGNED_IN',s);assert.equal(notifications,1,'duplicate sign-in does not rerender');
  now+=2000;authChanged('SIGNED_IN',s);assert.equal(notifications,2,'later refocus can refresh confirmed EXP');
  authChanged('SIGNED_OUT',null);assert.equal(notifications,3);
});

test('Top 5 recovers identical confirmed rows after a failed refresh', async () => {
  const {sandbox,nodes}=runtime();
  await sandbox.VDuckieHomeEXP90.refreshMini();
  const confirmed=nodes.expMiniList.innerHTML,client=sandbox.VDuckieEXPCore.client(),rpc=client.rpc;
  client.rpc=()=>Promise.resolve({error:{message:'test offline'},data:null});
  sandbox.VDuckieEXPBoard.invalidate();
  const log=sandbox.console;
  sandbox.console={...log,error(){}};
  await sandbox.VDuckieHomeEXP90.refreshMini();
  assert.match(nodes.expMiniList.innerHTML,/Thử lại/);
  client.rpc=rpc;sandbox.VDuckieEXPBoard.invalidate();
  await sandbox.VDuckieHomeEXP90.refreshMini();
  assert.equal(nodes.expMiniList.innerHTML,confirmed,'a cached markup signature must not trap the error/loading state');
});
