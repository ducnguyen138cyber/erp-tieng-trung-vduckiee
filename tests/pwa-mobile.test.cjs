"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const source = fs.readFileSync("pwa-register.js", "utf8");
function runtime({ standalone = false, supported = true, waiting = false } = {}) {
  const handlers = {}, docHandlers = {}, swHandlers = {}, messages = [], registrations = [];
  let reloads = 0;
  const install = { hidden: true, disabled: false, hasAttribute: key => key === "data-pwa-install" };
  const update = { hidden: true, hasAttribute: () => false };
  const link = {}, status = {}, open = {};
  const nodes = { "[data-pwa-install]": [install], "[data-pwa-update]": [update], "[data-pwa-install-link]": [link], "[data-pwa-status]": [status], "[data-pwa-open]": [open] };
  const registration = { waiting: waiting ? { postMessage: m => messages.push(m) } : null, addEventListener() {}, async update() {} };
  const document = { readyState: "loading", querySelectorAll: s => nodes[s] || [], addEventListener: (type, fn) => docHandlers[type] = fn };
  const navigator = { onLine: true };
  if (supported) navigator.serviceWorker = { controller: waiting ? {} : null, addEventListener: (type, fn) => swHandlers[type] = fn, async register(url, options) { registrations.push({ url, options }); return registration; } };
  const window = { document, location: { href: "https://example.test/sub/install.html", reload: () => reloads++ }, isSecureContext: true, matchMedia: () => ({ matches: standalone }), addEventListener: (type, fn) => handlers[type] = fn };
  vm.runInNewContext(source, { window, navigator, URL, console });
  return { handlers, docHandlers, swHandlers, install, update, link, status, open, messages, registrations, reloads: () => reloads };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test("native install is only offered after a real prompt; dismissing leaves manual instructions", async () => {
  const r = runtime(); r.handlers.load();
  assert.equal(r.install.hidden, true);
  let prompted = 0, prevented = 0;
  r.handlers.beforeinstallprompt({ preventDefault() { prevented++; }, async prompt() { prompted++; }, userChoice: Promise.resolve({ outcome: "dismissed" }) });
  assert.equal(r.install.hidden, false);
  r.docHandlers.click({ target: { closest: () => r.install } }); await settle();
  assert.equal(prompted, 1); assert.equal(prevented, 1); assert.equal(r.install.hidden, true);
  assert.match(r.status.textContent, /cài sau/);
});
test("iOS/manual instructions work even without service worker support", () => {
  const r = runtime({ supported: false }); r.handlers.load();
  assert.equal(r.install.hidden, true); assert.equal(r.link.hidden, false);
});
test("installed mode hides install links and offers returning to study", () => {
  const r = runtime({ standalone: true }); r.handlers.load();
  assert.equal(r.install.hidden, true); assert.equal(r.link.hidden, true); assert.equal(r.open.hidden, false);
});
test("updates never reload an active lesson until the user requests them", async () => {
  const r = runtime({ waiting: true }); r.handlers.load(); await settle();
  assert.equal(r.update.hidden, false);
  r.swHandlers.controllerchange(); assert.equal(r.reloads(), 0);
  r.docHandlers.click({ target: { closest: () => r.update } });
  assert.deepEqual(r.messages, ["SKIP_WAITING"]);
  r.swHandlers.controllerchange(); assert.equal(r.reloads(), 1);
  assert.equal(r.registrations[0].url, "https://example.test/sub/service-worker.js");
  assert.equal(r.registrations[0].options.scope, "/sub/");
});
test("worker install tolerates an obsolete optional asset and never forces update activation", async () => {
  const handlers = {}, calls = []; let skipped = 0;
  vm.runInNewContext(fs.readFileSync("service-worker.js", "utf8"), { URL, self: { registration: { scope: "https://example.test/sub/" }, addEventListener: (type, fn) => handlers[type] = fn, skipWaiting: () => skipped++ }, caches: { async open() { return { async addAll(urls) { calls.push(urls); if (urls.some(u => u.includes("community.js"))) throw Error("404"); } }; } } });
  let installing; handlers.install({ waitUntil: p => installing = p }); await installing;
  assert.ok(calls[0].some(u => u.endsWith("/offline.html")));
  assert.equal(skipped, 0);
});
