"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test('public course JSON revalidates instead of discarding the HTTP cache',async()=>{
 const src=read('assets/hsk-content/hsk-professional-runtime.js');
 const fn=src.slice(src.indexOf('  function fetchJson('),src.indexOf('  function loadIndexedCollection('));
 const calls=[];const root={fetch:async(path,options)=>{calls.push([path,options.cache]);return {ok:true,json:async()=>({records:[]})}}};
 const fetchJson=vm.runInNewContext(fn+'\nfetchJson;', {root});
 await fetchJson('./data/hsk/hsk1/lessons.json');await fetchJson('./data/hsk/hsk1/lessons.json');
 assert.deepEqual(calls,[['./data/hsk/hsk1/lessons.json','no-cache'],['./data/hsk/hsk1/lessons.json','no-cache']]);
 root.fetch=async()=>({ok:false,status:503});await assert.rejects(fetchJson('./data/hsk/hsk1/lessons.json'),/HTTP 503/);
});

test('professional course boot waits on home but starts on learner navigation or direct link',()=>{
 const source=read('assets/hsk-content/hsk-professional-runtime.js');
 const boot=source.slice(source.indexOf('  function boot() {'),source.indexOf('  if (root.document) boot();'));
 function scenario(search){
  const events={},timers=[],calls=[];let route='home',observe;
  const doc={readyState:'complete',body:{getAttribute(){return route}},addEventListener(n,f){events[n]=f},removeEventListener(n){delete events[n]}};
  const state={status:'idle',data:null};
  const root={document:doc,location:{search,hash:''},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},MutationObserver:class{constructor(fn){observe=fn}observe(){}disconnect(){}}};
  vm.runInNewContext(boot+'\nboot();',{root,state,URLSearchParams,mount(){calls.push('mount');return Promise.resolve()},observeIntro(){calls.push('observe')}});
  timers[0].fn();return {events,timers,calls,state,navigate(){route='hsk-study';observe()}};
 }
 const home=scenario('');assert.deepEqual(home.calls,[]);assert.equal(home.timers.at(-1).ms,20000);
 home.events['vduckie:experience-v86-ready']();assert.equal(home.timers.at(-1).ms,1500);home.timers.at(-1).fn();assert.deepEqual(home.calls,['mount']);
 const nav=scenario('?screen=home');nav.navigate();assert.deepEqual(nav.calls,['mount']);
 const explicit=scenario('?screen=home');explicit.state.status='loading';explicit.navigate();assert.deepEqual(explicit.calls,['observe']);
 assert.deepEqual(scenario('?screen=hsk-study&hskLevel=3').calls,['mount']);
});

test('startup preloads use the exact eventual local asset URLs',()=>{
  const index=read('index.html'), shell=read('app-shell-v88.html'), loader=read('pinyin-pro.loader.js');
  const hints=[...index.matchAll(/<link rel="preload" as="(style|script)" href="([^"]+)">/g)];
  assert.equal(hints.length,4);
  for(const [,type,url] of hints){
    assert.ok(fs.existsSync(path.join(root,url.split('?')[0])));
    assert.ok((type==='style'?shell:shell+loader).includes(url),url+' is requested with the same cache key');
  }
  assert.doesNotMatch(index,/<link rel="preload"[^>]*pinyin-parts/);
});

test('unified dictionary initialization respects delayed HSK loading; opening requests full data immediately',()=>{
  const installer=read('assets/v79/unified-dictionary-v79.part5.txt');
  const opening=read('assets/v79/unified-dictionary-v79.part4.txt');
  const source=installer.slice(installer.indexOf('function install()'),installer.indexOf('if (document.readyState'));
  const scheduled=[];
  const state={root:{VDuckieHSKDictionaryLoader:{schedule(){scheduled.push('schedule')},load(){scheduled.push('load')}},location:{search:'',hash:''}},URLSearchParams,byId(){return null},state:{},records:[],loadStyles(){},createMenu(){},createPage(){},addLookupButton(){},refreshData(){},bindEvents(){},wrapNavigation(){},watchLateData(){},openDictionary(){},renderControls(){},filterRecords(){}};
  vm.runInNewContext(source+'\ninstall();',state);
  assert.deepEqual(scheduled,['schedule']);
  const first=opening.slice(opening.indexOf('function openDictionary('),opening.indexOf('    source = source ==='));
  vm.runInNewContext(first+'\n}\nopenDictionary("hsk");',state);
  assert.deepEqual(scheduled,['schedule','load']);
});

test("Pinyin boot is one request with all 16 original fragments in order", () => {
  const shell = read("app-shell-v88.html");
  const bundle = read("assets/boot/pinyin-parts-boot-v1.js");
  assert.doesNotMatch(shell, /src="\.\/assets\/boot\/pinyin-parts-boot-v1\.js\?v=1"/);
  assert.match(shell, /src="\.\/pinyin-pro\.loader\.js\?v=background3"/);
  assert.doesNotMatch(shell, /src="\.\/pinyin-data\d+\.js"/);
  assert.equal((bundle.match(/__PINYIN_GZIP_PARTS__\.push/g) || []).length, 16);
  for (let i = 1, offset = -1; i <= 16; ++i) {
    const name = "pinyin-data" + i + ".js";
    const marker = "/* " + name + " */";
    const next = bundle.indexOf(marker);
    assert.ok(next > offset, name + " appears in the correct order");
    assert.ok(bundle.includes(read(name).trimEnd()), name + " is unchanged");
    offset = next;
  }
  new vm.Script(bundle);
});

test("home defers the Pinyin bundle but early learning interaction starts it exactly once",async()=>{
  const loader=read('pinyin-pro.loader.js').split('\n(function () {')[0];
  function boot(search){
    const scripts=[],events={},timers=[];
    const document={readyState:'loading',createElement(){return{}},head:{appendChild(s){scripts.push(s)}},
      addEventListener(name,fn){events[name]=fn},removeEventListener(name){delete events[name]}};
    const state=vm.createContext({document,location:{search,hash:''},URLSearchParams,DecompressionStream,Blob,Response,atob,
      setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){}});
    vm.runInContext(loader,state);
    return {state,scripts,events,timers};
  }
  const home=boot('?screen=home');assert.equal(home.scripts.length,0);
  home.events.DOMContentLoaded();assert.equal(home.timers.length,1);
  home.events.pointerdown();assert.equal(home.scripts.length,1);assert.equal(home.scripts[0].async,true);
  home.timers[0]();assert.equal(home.scripts.length,1);
  vm.runInContext(read('assets/boot/pinyin-parts-boot-v1.js'),home.state);home.scripts[0].onload();
  assert.equal(await home.state.PinyinEngineReady,true);assert.equal(home.state.pinyinPro.pinyin('你好'),'nǐ hǎo');
  const direct=boot('?screen=shadowing');assert.equal(direct.scripts.length,1);direct.scripts[0].onerror();assert.equal(await direct.state.PinyinEngineReady,false);
  const ready=boot('');ready.events['vduckie:experience-v86-ready']();assert.equal(ready.scripts.length,1);ready.scripts[0].onerror();assert.equal(await ready.state.PinyinEngineReady,false);
});

test("ERP dictionary boot replaces the 15 serial document.write calls", async () => {
  const bundle = read("assets/boot/erp-dictionary-boot-v1.js");
  const files = [
    "assets/v76/erp-terms-v76-core.js",
    "assets/v76/erp-terms-v76-production.js",
    "assets/v76/erp-terms-v76-warehouse-purchasing.js",
    "assets/v76/erp-terms-v76-sales-finance.js",
    "assets/v76/erp-terms-v76-system-documents.js",
    "assets/v77/erp-terms-v77-core.js",
    "assets/v77/erp-terms-v77-planning-production.js",
    "assets/v77/erp-terms-v77-product-plm.js",
    "assets/v77/erp-terms-v77-warehouse-wms.js",
    "assets/v77/erp-terms-v77-procurement.js",
    "assets/v77/erp-terms-v77-sales-crm.js",
    "assets/v77/erp-terms-v77-broad-candidates.js",
    "assets/v77/erp-terms-v77-finalize.js",
    "assets/v79/hsk-dictionary-v79.js",
    "assets/v79/unified-dictionary-v79.js"
  ];
  let offset = -1;
  for (const file of files) {
    const pos = bundle.indexOf("/* " + file + " */");
    assert.ok(pos > offset, "preserve dependency order for " + file);
    assert.ok(bundle.includes(read(file).trimEnd()), "preserve contents for " + file);
    offset = pos;
  }
  new vm.Script(bundle);
  const writes = [];
  const state = {};
  const doc = {readyState:"loading",write(html){writes.push(html);}};
  vm.runInNewContext(read("pinyin-pro.loader.js"), {
    globalThis:state,window:state,document:doc,console,Promise
  });
  assert.equal(writes.length, 1);
  assert.match(writes[0], /erp-dictionary-boot-v1\.js\?v=home2/);
  assert.match(writes[0], /<\/script>/);
  await state.PinyinEngineReady;
});

test('full HSK dictionary waits for dashboard or user interaction and duplicate loaders do not start it early',()=>{
 const source=read('assets/v79/hsk-dictionary-v79.js');
 function boot(search){
  const calls=[],events={},timers=[];
  const document={readyState:'complete',addEventListener(n,f){events[n]=f},removeEventListener(n){delete events[n]}};
  const state={location:{search,hash:''},document,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){}};
  const ctx=vm.createContext({window:state,document,URLSearchParams,fetch(url){calls.push(url);return new Promise(()=>{})}});
  vm.runInContext(source,ctx);return {ctx,state,calls,events,timers};
 }
 const home=boot('?screen=home');assert.equal(home.calls.length,0);assert.equal(home.timers[0].ms,8000);
 vm.runInContext(source,home.ctx);assert.equal(home.calls.length,0);
 home.events['vduckie:experience-v86-ready']();assert.equal(home.timers.at(-1).ms,1000);assert.equal(home.calls.length,0);
 home.events.pointerdown();assert.equal(home.calls.length,1);home.timers.at(-1).fn();assert.equal(home.calls.length,1);
 const direct=boot('?screen=dictionary');assert.equal(direct.calls.length,1);
});

test("home experience scripts fetch concurrently but execute in the original order", () => {
  const scripts = [], events = [];
  const doc = {
    createElement(tag) {assert.equal(tag,"script");return {};},
    head:{appendChild(node){scripts.push(node);}},
    dispatchEvent(evt){events.push(evt.type);}
  };
  const win = {};
  vm.runInNewContext(read("assets/v86/experience-suite-loader-v86.js"), {
    window:win,document:doc,console,CustomEvent:class {constructor(type){this.type=type;}}
  });
  assert.equal(scripts.length, 6, "start all downloads without waiting for script #1");
  assert.ok(scripts.every(s=>s.async===false), "dynamic scripts remain ordered");
  assert.match(scripts[0].src,/home-dashboard-v86\.5/);
  assert.match(scripts.at(-1).src,/mobile-layout-fix-v86\.7/);
  for(const script of scripts.slice(0,-1))script.onload();
  assert.equal(events.length,0,"do not report ready until all dependencies finish");
  scripts.at(-1).onload();
  assert.equal(win.__VDUCKIE_EXPERIENCE_V86_READY__,true);
  assert.deepEqual(events,["vduckie:experience-v86-ready"]);
});

test('home decorative tile images load lazily without delaying the brand image',()=>{
 const line=read('index.html').split('\n').find(s=>s.includes('source=source.replace(/<img(?='));
 const html=vm.runInNewContext('var source=input;'+line+';source',{input:read('app-shell-v88.html')});
 assert.equal((html.match(/loading="lazy" decoding="async" fetchpriority="low"/g)||[]).length,8);
 assert.match(html,/<img class="brand-logo" src=/);
 assert.match(html,/<img class="home-welcome-mascot" src=/);
});

test("login first paint does not wait for profile upsert or leaderboard", () => {
  const sidebar=read("assets/v90/home-exp-sidebar-v90.js");
  const leaderboard=read("assets/v90/exp-leaderboard-v90.js");
  assert.match(sidebar,/Promise\.all\(\[refreshAccount\(\), refreshMissions\(\), refreshMini\(false\)\]\)/);
  assert.match(sidebar,/renderAccount\(currentTotal\);\s*renderMissions\(currentMissions\);/);
  assert.doesNotMatch(sidebar,/core\.syncProfile\(\)\.then\(function \(\) \{ return Promise\.all/);
  assert.doesNotMatch(leaderboard,/core\.syncProfile\(\)\.then\(root\.VDuckieEXP\.getCurrentUserEXP\)/);
  assert.match(read("index.html"),/fetch\(shellUrl,\{cache:"default"\}\)/);
  const worker=read("service-worker.js");
  assert.match(worker,/pinyin-parts-boot-v1/);
  assert.match(worker,/erp-dictionary-boot-v1/);
});

test("duplicate auth opens and the selected tab retain input; real transitions clear passwords", async () => {
  const {JSDOM} = require('jsdom');
  const dom = new JSDOM('<header><button id="cloudLogin">Đăng nhập</button></header>', {url:'https://example.invalid',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, d=w.document;
  try {
    w.eval(read('assets/auth/auth-screen.js'));
    await new Promise(resolve=>setTimeout(resolve,0));
    d.getElementById('cloudLogin').click();
    const password=d.getElementById('vdaPassword');password.value='fixture-password';
    d.getElementById('cloudLogin').click();
    assert.equal(password.value,'fixture-password');
    d.getElementById('vdaTabLogin').click();
    assert.equal(password.value,'fixture-password');
    d.getElementById('vdaTabRegister').click();
    assert.equal(password.value,'');
    password.value='another-fixture';
    d.querySelector('[data-vda-close]').click();
    assert.equal(password.value,'');
    d.getElementById('cloudLogin').click();
    assert.equal(password.value,'');
    assert.equal(password.type,'password');
  } finally { w.close(); }
});
