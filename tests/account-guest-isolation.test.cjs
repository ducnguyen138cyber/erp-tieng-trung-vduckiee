/* Regression: never silently attach guest progress to a newly signed-in account. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

test("guest learning data remains isolated across account switches", async () => {
  const data = new Map([["vduckie-hsk-study-journey-v1", JSON.stringify({ lessons: { guestLesson: { completedAt: 123 } } })]]);
  const storage = {
    get length() { return data.size; },
    key(i) { return [...data.keys()][i] || null; },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); }
  };
  let authCallback;
  const client = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: fn => { authCallback = fn; }
    },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      }),
      upsert: () => Promise.resolve({ error: null })
    })
  };
  const timers = [];
  const root = {
    localStorage: storage,
    sessionStorage: storage,
    navigator: { onLine: true },
    document: {
      getElementById: () => null,
      addEventListener: () => {},
      dispatchEvent: () => {}
    },
    CustomEvent: function () {},
    location: { reload: () => {} },
    supabase: { createClient: () => client },
    addEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: fn => { timers.push(fn); return timers.length; },
    clearTimeout: () => {}
  };
  const code = fs.readFileSync(path.join(__dirname, "../assets/v82/account-learning-sync-v82.js"), "utf8");
  vm.runInNewContext(code, { window: root, globalThis: root, CustomEvent: root.CustomEvent });
  root.supabase.createClient();
  while (timers.length) timers.shift()();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(storage.getItem("vduckie-hsk-study-journey-v1") !== null, true);

  authCallback("SIGNED_IN", { user: { id: "account-A" } });
  timers.shift()();
  assert.equal(storage.getItem("vduckie-hsk-study-journey-v1"), null, "guest progress must not be silently attached to A");
  assert.equal(storage.getItem("vduckie-learning-profile-cache-v2:anonymous") !== null, true, "guest backup must survive sign-in");

  storage.setItem("vduckie-hsk-study-journey-v1", JSON.stringify({ lessons: { accountALesson: true } }));
  authCallback("SIGNED_IN", { user: { id: "account-B" } });
  timers.shift()();
  assert.equal(storage.getItem("vduckie-hsk-study-journey-v1"), null, "A's progress must not appear in B");
  assert.match(storage.getItem("vduckie-learning-profile-cache-v2:account-A"), /accountALesson/);
});
