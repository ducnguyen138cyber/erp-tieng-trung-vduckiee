const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../assets/v82/account-learning-sync-v82.js"), "utf8");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function createStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); }
  };
}

function createFakeBackend() {
  let row = null;
  let connected = true;
  let failed = 0;
  const operations = [];
  function operation(name, field) {
    const clauses = [];
    const q = {
      eq(k, v) { clauses.push([k, v]); return q; },
      maybeSingle() { return Promise.resolve({ data: row && matches(row) ? {...row} : null, error: null }); },
      select() { if (name === "select") return q; return Promise.resolve(commit()); },
      then(resolve, reject) { return Promise.resolve(name === "select" ? {data: row && matches(row) ? [{...row}] : [], error: null} : commit()).then(resolve, reject); }
    };
    function matches(value) { return clauses.every(([key, expected]) => value[key] === expected); }
    function commit() {
      if (!connected || failed > 0) {
        if (failed) failed--;
        return { data: null, error: {message:"network unavailable"} };
      }
      if (name === "insert") {
        if (row) return { data: [], error: null };
        row = {...field[0]}; operations.push("insert");
      } else if (name === "update") {
        if (!row || !matches(row)) return { data: [], error: null };
        row = {...row, ...field}; operations.push("update");
      }
      return { data: [{word_key:row.word_key}], error:null };
    }
    return q;
  }
  return {
    setOnline(value) { connected = value; },
    failNext(n=1) { failed = n; },
    getRow() { return row && {...row}; },
    operations,
    client() {
      return {
        auth: {
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange(fn) { this.onAuth = fn; }
        },
        from() {
          return {
            select() { return operation("select"); },
            upsert(data) { return operation("insert", data); },
            update(data) { return operation("update", data); }
          };
        }
      };
    }
  };
}

function createBrowser(backend, userId) {
  const storage = createStorage(), handlers = {};
  const client = backend.client();
  const root = {
    localStorage: storage,
    sessionStorage: createStorage(),
    navigator: {onLine:true},
    document: {getElementById:()=>null,addEventListener:()=>{},dispatchEvent:()=>{}},
    CustomEvent: function(){},
    location: {reload:()=>{}},
    supabase: {createClient:()=>client},
    addEventListener(name,fn) {handlers[name]=fn;},
    setInterval:()=>1, clearInterval:()=>{},
    setTimeout, clearTimeout
  };
  vm.runInNewContext(source,{window:root,globalThis:root,CustomEvent:root.CustomEvent,setTimeout,clearTimeout});
  root.supabase.createClient();
  async function signIn() {
    await sleep(20);
    client.auth.onAuth("SIGNED_IN", {user:{id:userId}});
    await sleep(35);
  }
  return {root,storage,handlers,signIn};
}

const KEY = "vduckie-hsk-study-journey-v1";
const value = id => JSON.stringify({lessons:{[id]:{completedAt:Date.now()}}});
async function settle() {await sleep(800);}

test("offline edit survives, reconnect uploads and another browser restores", async () => {
  const backend = createFakeBackend();
  const pc = createBrowser(backend,"user-1");
  await pc.signIn();
  await settle();
  backend.setOnline(false);
  pc.root.navigator.onLine = false;
  pc.storage.setItem(KEY,value("pc-offline"));
  pc.handlers.storage({key:KEY});
  await settle();
  assert.doesNotMatch(backend.getRow() ? backend.getRow().note : "", /pc-offline/, "offline edit must not be saved remotely");
  assert.match(pc.storage.getItem("vduckie-learning-profile-cache-v2:user-1"),/pc-offline/);
  backend.setOnline(true);
  pc.root.navigator.onLine = true;
  pc.handlers.online();
  await settle();
  assert.match(backend.getRow().note,/pc-offline/);
  const mobile = createBrowser(backend,"user-1");
  await mobile.signIn();
  await settle();
  assert.match(mobile.storage.getItem(KEY),/pc-offline/);
});

test("two devices changing different learning keys do not overwrite each other", async () => {
  const backend = createFakeBackend();
  const pc = createBrowser(backend,"user-2");
  const mobile = createBrowser(backend,"user-2");
  await Promise.all([pc.signIn(),mobile.signIn()]);
  await settle();
  pc.storage.setItem(KEY,value("hsk-pc"));
  pc.handlers.storage({key:KEY});
  mobile.storage.setItem("vduckie-erp-study-progress-v1",JSON.stringify({lessons:{erpMobile:true}}));
  mobile.handlers.storage({key:"vduckie-erp-study-progress-v1"});
  await settle();
  const profile = JSON.parse(backend.getRow().note);
  assert.match(profile.fields[KEY].value,/hsk-pc/);
  assert.match(profile.fields["vduckie-erp-study-progress-v1"].value,/erpMobile/);
});

test("failed cloud write leaves an account-scoped durable cache", async () => {
  const backend = createFakeBackend();
  const pc = createBrowser(backend,"user-3");
  await pc.signIn();
  await settle();
  backend.failNext(1);
  pc.storage.setItem(KEY,value("retry-me"));
  pc.handlers.storage({key:KEY});
  await settle();
  assert.match(pc.storage.getItem("vduckie-learning-profile-cache-v2:user-3"),/retry-me/);
  pc.handlers.online();
  await settle();
  assert.match(backend.getRow().note,/retry-me/);
});
