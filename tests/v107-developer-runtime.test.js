const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
class Target { constructor(){this.map=new Map()} addEventListener(t,f){if(!this.map.has(t))this.map.set(t,[]);this.map.get(t).push(f)} removeEventListener(t,f){const a=this.map.get(t)||[],i=a.indexOf(f);if(i>=0)a.splice(i,1)} dispatchEvent(e){(this.map.get(e.type)||[]).slice().forEach(f=>f(e))} }
function harness(){
  const document=new Target();document.images=[];document.querySelector=()=>null;document.getElementById=()=>null;
  const window=new Target();window.document=document;window.window=window;window.performance={};window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};window.setTimeout=setTimeout;window.clearTimeout=clearTimeout;
  const context=vm.createContext({window,document,console,JSON,Object,Array,String,Number,Math,Date,Map,Promise,setTimeout,clearTimeout});
  for(const file of ["assets/developer-runtime/runtime.js","assets/developer-events/actions.js","assets/developer-tabs/evolution.js","assets/developer-tabs/animation.js","assets/developer-tabs/learning-speaking.js","assets/developer-tabs/inventory-progress.js","assets/developer-tabs/system.js","assets/developer-debug/debug.js","assets/developer-scenarios/scenarios.js"])vm.runInContext(read(file),context,{filename:file});
  const calls=[];const bridge={enable:v=>calls.push(["enable",v]),disable:()=>calls.push(["disable"]),setLevel:v=>calls.push(["setLevel",v]),test:v=>calls.push(["test",v]),setWardrobe:(g,c)=>calls.push(["wardrobe",g,c]),getState:()=>({level:1,real:{level:1}}),getCatalog:()=>({outfit:[{code:"stage-default",name:"Default"}],accessory:[{code:"none",name:"None"}],background:[{code:"default",name:"Default"}],effect:[{code:"none",name:"None"}]})};
  window.VDuckieDeveloper.runtime.setBridge(bridge);return{window,calls};
}

test("progress actions modify preview state and bridge only", async()=>{const h=harness(),d=h.window.VDuckieDeveloper;await d.actions.run("progress.xp100");assert.equal(d.runtime.snapshot().xp,100);assert.ok(h.calls.some(call=>call[0]==="setLevel"));});

test("history is capped at twenty and replay remains available", async()=>{const h=harness(),a=h.window.VDuckieDeveloper.actions;for(let i=0;i<25;i++)await a.run("progress.xp5");assert.equal(a.history().length,20);await a.replay();assert.equal(a.history().length,20);});

test("favorites are in-memory and searchable across tabs",()=>{const h=harness(),a=h.window.VDuckieDeveloper.actions;assert.ok(a.search("hover").some(item=>item.id==="evolution.hover"));a.toggleFavorite("evolution.hover");assert.ok(a.favorites().some(item=>item.id==="evolution.hover"));});

test("scenario runner uses managed timers and can be cancelled without writes",async()=>{const h=harness(),d=h.window.VDuckieDeveloper;await d.actions.run("scenario.play",{code:"new-user"});assert.equal(d.runtime.snapshot().scenarioRunning,true);await d.actions.run("scenario.stop");assert.equal(d.runtime.snapshot().scenarioRunning,false);});

test("reset preview returns to confirmed real level and clears transient state", async()=>{
  const h=harness(),d=h.window.VDuckieDeveloper;
  await d.actions.run("evolution.set-level",{value:8});
  await d.actions.run("progress.streak-up");
  d.runtime.resetPreview();
  const state=d.runtime.snapshot();
  assert.equal(state.level,1);
  assert.equal(state.streak,0);
  assert.deepEqual(h.calls.slice(-2),[["disable"],["enable",1]]);
});

test("registries expose twelve tabs, broad actions and sixteen scenarios",()=>{
  const h=harness(),d=h.window.VDuckieDeveloper;
  assert.equal(d.tabOrder.length,12);
  assert.ok(d.actions.list().length>=70);
  assert.equal(d.scenarioOrder.length,16);
});
