const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/v92/progress-store-v92.js"), "utf8");

class EventTargetMock {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(listener); }
  removeEventListener(type, listener) { const list = this.listeners.get(type) || []; const index = list.indexOf(listener); if (index >= 0) list.splice(index, 1); }
  dispatchEvent(event) { for (const listener of [...(this.listeners.get(event.type) || [])]) listener(event); }
}
class CustomEventMock { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }
async function settle() { await Promise.resolve(); await new Promise(resolve => setTimeout(resolve, 5)); await Promise.resolve(); }

function harness() {
  const document = new EventTargetMock(); document.readyState = "complete"; document.hidden = false;
  let session = { user: { id: "A", email: "a@example.com" } }; let total = 4000; const sessionCallbacks = []; const events = [];
  const core = {
    session: () => session,
    onSession(callback) { sessionCallbacks.push(callback); callback(session); return () => {}; },
    calculateUserLevel(value) { const level = Math.max(1, Math.floor(Number(value || 0) / 1000) + 1); return { level, totalEXP: Number(value || 0), currentLevelEXP: Number(value || 0) % 1000, expRequired: 1000, progressPercent: (Number(value || 0) % 1000) / 10, expRemaining: 1000 - (Number(value || 0) % 1000) }; }
  };
  const exp = { getCurrentUserEXP: () => Promise.resolve(total) };
  document.addEventListener("vduckie:progress-updated", event => events.push(event.detail));
  const window = { window: null, document, VDuckieEXPCore: core, VDuckieEXP: exp, setTimeout, clearTimeout, CustomEvent: CustomEventMock }; window.window = window;
  vm.runInContext(source, vm.createContext({ window, document, console, Object, Array, String, Number, Math, Promise, CustomEvent: CustomEventMock }), { filename: "progress-store-v92.js" });
  return {
    window, document, events,
    setTotal(value) { total = value; },
    switchSession(next) { session = next; sessionCallbacks.forEach(callback => callback(session)); }
  };
}

test("progress metadata distinguishes initial hydrate from a learning mutation", async () => {
  const h = harness(); await settle();
  const hydrated = h.events.filter(event => event.progressMeta.source === "hydrate").at(-1);
  assert.equal(hydrated.level, 5); assert.equal(hydrated.progressMeta.hydrated, true); assert.equal(hydrated.progressMeta.sessionIdentity, "A");
  h.setTotal(5000); h.document.dispatchEvent(new CustomEventMock("vduckie:exp-updated")); await settle();
  const mutation = h.events.at(-1); assert.equal(mutation.level, 6); assert.equal(mutation.progressMeta.source, "mutation"); assert.equal(mutation.progressMeta.hydrated, true);
});

test("session switch emits an unhydrated boundary then hydrates the new identity", async () => {
  const h = harness(); await settle(); h.setTotal(2000); h.switchSession({ user: { id: "B", email: "b@example.com" } });
  const boundary = h.events.findLast(event => event.progressMeta.source === "session");
  assert.equal(boundary.progressMeta.sessionIdentity, "B"); assert.equal(boundary.progressMeta.hydrated, false);
  await settle(); const hydrated = h.events.at(-1);
  assert.equal(hydrated.level, 3); assert.equal(hydrated.progressMeta.source, "hydrate"); assert.equal(hydrated.progressMeta.sessionIdentity, "B"); assert.equal(hydrated.progressMeta.hydrated, true);
});
