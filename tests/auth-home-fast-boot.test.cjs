"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("Pinyin boot is one request with all 16 original fragments in order", () => {
  const shell = read("app-shell-v88.html");
  const bundle = read("assets/boot/pinyin-parts-boot-v1.js");
  assert.match(shell, /src="\.\/assets\/boot\/pinyin-parts-boot-v1\.js\?v=1"/);
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
  assert.match(writes[0], /erp-dictionary-boot-v1\.js\?v=1/);
  assert.match(writes[0], /<\/script>/);
  await state.PinyinEngineReady;
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

test("login first paint does not wait for profile upsert or leaderboard", () => {
  const sidebar=read("assets/v90/home-exp-sidebar-v90.js");
  const leaderboard=read("assets/v90/exp-leaderboard-v90.js");
  assert.match(sidebar,/Promise\.all\(\[refreshAccount\(\), refreshMissions\(\), refreshMini\(\)\]\)/);
  assert.match(sidebar,/renderAccount\(currentTotal\);\s*renderMissions\(currentMissions\);/);
  assert.doesNotMatch(sidebar,/core\.syncProfile\(\)\.then\(function \(\) \{ return Promise\.all/);
  assert.doesNotMatch(leaderboard,/core\.syncProfile\(\)\.then\(root\.VDuckieEXP\.getCurrentUserEXP\)/);
  assert.match(read("index.html"),/fetch\(shellUrl,\{cache:"default"\}\)/);
  const worker=read("service-worker.js");
  assert.match(worker,/pinyin-parts-boot-v1/);
  assert.match(worker,/erp-dictionary-boot-v1/);
});