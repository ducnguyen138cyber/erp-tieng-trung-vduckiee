const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/v106/mascot-polish-v106.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/v106/mascot-polish-v106.css"), "utf8");

class FakeEvent {
  constructor(type, init = {}) { this.type = type; Object.assign(this, init); this.defaultPrevented = false; this.propagationStopped = false; }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this.propagationStopped = true; }
}
class FakeCustomEvent extends FakeEvent { constructor(type, init = {}) { super(type, init); this.detail = init.detail; } }
class FakeEventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(listener); }
  removeEventListener(type, listener) { const list = this.listeners.get(type) || []; const index = list.indexOf(listener); if (index >= 0) list.splice(index, 1); }
  dispatchEvent(event) { if (!event.target) event.target = this; for (const listener of [...(this.listeners.get(event.type) || [])]) listener.call(this, event); return !event.defaultPrevented; }
}
class FakeClassList {
  constructor(node) { this.node = node; this.values = new Set(); }
  setFromString(value) { this.values = new Set(String(value || "").split(/\s+/).filter(Boolean)); }
  sync() { this.node._className = [...this.values].join(" "); this.node.ownerDocument?._notify(this.node, "attributes", "class"); }
  add(...names) { names.forEach(name => this.values.add(name)); this.sync(); }
  remove(...names) { names.forEach(name => this.values.delete(name)); this.sync(); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) { const next = force === undefined ? !this.contains(name) : !!force; next ? this.values.add(name) : this.values.delete(name); this.sync(); return next; }
}
class FakeElement extends FakeEventTarget {
  constructor(tagName, ownerDocument) {
    super(); this.tagName = String(tagName || "div").toUpperCase(); this.ownerDocument = ownerDocument; this.children = []; this.parentNode = null;
    this.attributes = new Map(); this.classList = new FakeClassList(this); this._className = ""; this._hidden = false; this.inert = false; this.style = { setProperty(){}, removeProperty(){} };
    this.innerHTML = ""; this.id = ""; this.isConnected = false;
  }
  get className() { return this._className; }
  set className(value) { this._className = String(value || ""); this.classList.setFromString(this._className); }
  get hidden() { return this._hidden; }
  set hidden(value) { this._hidden = !!value; this._hidden ? this.attributes.set("hidden", "") : this.attributes.delete("hidden"); this.ownerDocument?._notify(this, "attributes", "hidden"); }
  appendChild(node) { node.parentNode = this; node.isConnected = true; this.children.push(node); this.ownerDocument?._notify(this, "childList"); return node; }
  removeChild(node) { const index = this.children.indexOf(node); if (index >= 0) this.children.splice(index, 1); node.parentNode = null; node.isConnected = false; this.ownerDocument?._notify(this, "childList"); return node; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === "id") this.id = String(value); if (name === "class") this.className = value; if (name === "hidden") this._hidden = true; this.ownerDocument?._notify(this, "attributes", name); }
  getAttribute(name) { if (name === "class") return this.className || null; if (name === "id") return this.id || null; return this.attributes.has(name) ? this.attributes.get(name) : null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); if (name === "hidden") this._hidden = false; this.ownerDocument?._notify(this, "attributes", name); }
  contains(node) { for (let current = node; current; current = current.parentNode) if (current === this) return true; return false; }
  focus() { this.ownerDocument.activeElement = this; }
  matches(selector) {
    return selector.split(",").some(raw => {
      const part = raw.trim();
      if (!part) return false;
      if (part === "button") return this.tagName === "BUTTON";
      if (part.startsWith(".")) return this.classList.contains(part.slice(1));
      const attrContains = part.match(/^\[([^=*]+)\*="([^"]+)"\]$/); if (attrContains) return String(this.getAttribute(attrContains[1]) || "").includes(attrContains[2]);
      const attrEqual = part.match(/^\[([^=]+)="([^"]+)"\]$/); if (attrEqual) return this.getAttribute(attrEqual[1]) === attrEqual[2];
      const attrOnly = part.match(/^\[([^\]]+)\]$/); if (attrOnly) return this.hasAttribute(attrOnly[1]);
      return false;
    });
  }
  closest(selector) { for (let current = this; current; current = current.parentNode) if (current.matches?.(selector)) return current; return null; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) { const result = []; const visit = node => { for (const child of node.children) { if (child.matches(selector)) result.push(child); visit(child); } }; visit(this); return result; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300 }; }
}
class FakeDocument extends FakeEventTarget {
  constructor() {
    super(); this.readyState = "complete"; this.hidden = false; this._observers = [];
    this.documentElement = new FakeElement("html", this); this.body = new FakeElement("body", this); this.body.isConnected = true; this.activeElement = this.body;
  }
  createElement(tag) { return new FakeElement(tag, this); }
  getElementById(id) { let found = null; const visit = node => { if (node.id === id) found = node; if (!found) node.children.forEach(visit); }; visit(this.body); return found; }
  querySelector(selector) { return this.body.querySelector(selector); }
  querySelectorAll(selector) { return this.body.querySelectorAll(selector); }
  _notify(target, type, attributeName) { for (const observer of this._observers) if (observer.matches(target, type, attributeName)) observer.callback([{ target, type, attributeName }]); }
}
class FakeMutationObserver {
  constructor(callback, document) { this.callback = callback; this.document = document; this.targets = []; }
  observe(target, options) { this.targets.push({ target, options }); this.document._observers.push(this); }
  disconnect() { const index = this.document._observers.indexOf(this); if (index >= 0) this.document._observers.splice(index, 1); this.targets = []; }
  matches(target, type, attributeName) {
    return this.targets.some(entry => {
      const inScope = entry.target === target || (entry.options.subtree && entry.target.contains(target));
      if (!inScope || !entry.options[type]) return false;
      return !entry.options.attributeFilter || entry.options.attributeFilter.includes(attributeName);
    });
  }
}
class Scheduler {
  constructor() { this.now = 0; this.nextId = 1; this.jobs = new Map(); }
  setTimeout(fn, delay = 0) { const id = this.nextId++; this.jobs.set(id, { at: this.now + Number(delay), fn }); return id; }
  clearTimeout(id) { this.jobs.delete(id); }
  advance(ms) {
    const end = this.now + ms;
    while (true) {
      let selected = null;
      for (const [id, job] of this.jobs) if (job.at <= end && (!selected || job.at < selected.job.at || (job.at === selected.job.at && id < selected.id))) selected = { id, job };
      if (!selected) break;
      this.now = selected.job.at; this.jobs.delete(selected.id); selected.job.fn();
    }
    this.now = end;
  }
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }

function createHarness({ audioState = "running" } = {}) {
  const scheduler = new Scheduler(); const document = new FakeDocument(); const sessionCallbacks = []; let session = { user: { id: "A", email: "a@example.com" } };
  const legacy = document.createElement("div"); legacy.id = "v95LevelUpOverlay"; legacy.hidden = true; document.body.appendChild(legacy);
  const journey = document.createElement("div"); journey.id = "v92EvolutionOverlay"; journey.hidden = true; document.body.appendChild(journey);
  const backgroundButton = document.createElement("button"); backgroundButton.setAttribute("data-panel", "open"); document.body.appendChild(backgroundButton);
  const audioStarts = []; const audioInstances = []; const resumeGate = deferred();
  class AudioContextMock {
    constructor() { this.state = audioState; this.currentTime = 0; this.destination = {}; this.resumeCalls = 0; audioInstances.push(this); }
    resume() { this.resumeCalls += 1; return resumeGate.promise.then(() => { this.state = "running"; }); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createOscillator() {
      const state = { frequency: 0 };
      return { type: "", frequency: { setValueAtTime(value) { state.frequency = value; }, exponentialRampToValueAtTime() {} }, connect() { return this; }, start() { audioStarts.push(state.frequency); }, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect() { return this; } }; }
  }
  class ImageMock { constructor() { this.decoding = ""; this.src = ""; } }
  class MutationObserverMock extends FakeMutationObserver { constructor(callback) { super(callback, document); } }
  const manifest = {
    resolve({ level }) { return { asset: `./lv${level}.webp`, fallbackAsset: `./lv${level}-fallback.webp` }; },
    getItems(type) { return type === "outfit" ? [{ minimumLevel: 6, name: "Manager" }, { minimumLevel: 7, name: "Expert" }] : []; }
  };
  const renderer = { render({ level }) { return `<button data-v95-mascot data-v95-level="${level}"></button>`; }, hydrate() {} };
  const core = {
    session: () => session,
    onSession(callback) { sessionCallbacks.push(callback); callback(session); return () => { const index = sessionCallbacks.indexOf(callback); if (index >= 0) sessionCallbacks.splice(index, 1); }; }
  };
  const store = { getSnapshot: () => ({ level: 1 }) };
  const window = new FakeEventTarget();
  Object.assign(window, {
    window: null, document, VDuckieMascotManifest: manifest, VDuckieMascot: renderer, VDuckieProgressStore: store, VDuckieEXPCore: core,
    AudioContext: AudioContextMock, Image: ImageMock, MutationObserver: MutationObserverMock, CustomEvent: FakeCustomEvent,
    setTimeout: scheduler.setTimeout.bind(scheduler), clearTimeout: scheduler.clearTimeout.bind(scheduler),
    requestAnimationFrame: fn => scheduler.setTimeout(() => fn(scheduler.now), 16), cancelAnimationFrame: id => scheduler.clearTimeout(id),
    matchMedia: () => ({ matches: false }), innerWidth: 1024
  });
  window.window = window;
  const context = vm.createContext({ window, document, console, Object, Array, String, Number, Math, Promise, WeakSet, Map, CustomEvent: FakeCustomEvent, Image: ImageMock, MutationObserver: MutationObserverMock });
  vm.runInContext(source, context, { filename: "mascot-polish-v106.js" });
  function progress(level, sourceName, hydrated = true, identity = session.user?.id || "guest") {
    document.dispatchEvent(new FakeCustomEvent("vduckie:progress-updated", { detail: { level, progressMeta: { source: sourceName, hydrated, sessionIdentity: identity } } }));
  }
  function developer(level) { document.dispatchEvent(new FakeCustomEvent("vduckie:developer-animation-test", { detail: { requestedState: "level-up", button: "level-up", level } })); }
  function mascotEvent(name) { document.dispatchEvent(new FakeCustomEvent("vduckie:mascot-event", { detail: { event: name } })); }
  function click(button) { document.dispatchEvent(new FakeEvent("click", { target: button })); }
  function switchSession(next) { session = next; sessionCallbacks.slice().forEach(callback => callback(session)); }
  return { window, document, scheduler, legacy, journey, backgroundButton, audioStarts, audioInstances, resumeGate, progress, developer, mascotEvent, click, switchSession };
}
async function flushPromises() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

function activeCinematics(h) { return h.document.body.children.filter(node => node.classList.contains("v106-cinematic")); }

test("A: real Level-up opens one V106 cinematic and legacy modal stays fallback-only", () => {
  const h = createHarness(); h.progress(5, "hydrate"); h.progress(6, "mutation");
  assert.equal(activeCinematics(h).length, 1); assert.equal(h.legacy.hidden, true);
  h.legacy.hidden = false; assert.equal(h.legacy.hidden, true);
});

test("B: Developer Preview opens only preview cinematic and never writes progress", () => {
  const h = createHarness(); h.progress(4, "hydrate"); h.developer(4);
  assert.equal(activeCinematics(h).length, 1); assert.match(activeCinematics(h)[0].innerHTML, /Preview/); assert.equal(h.legacy.hidden, true);
  assert.equal(h.window.VDuckiePolishV106.getState().baseline.level, 4);
});

test("C-D: initial hydrate only establishes baseline; later mutation triggers exactly once", () => {
  const h = createHarness(); h.progress(5, "hydrate");
  assert.equal(activeCinematics(h).length, 0); assert.deepEqual({ ...h.window.VDuckiePolishV106.getState().baseline }, { hydrated: true, sessionIdentity: "A", level: 5 });
  h.progress(6, "mutation"); assert.equal(activeCinematics(h).length, 1); assert.match(activeCinematics(h)[0].innerHTML, /Level 5 → Level 6/);
});

test("E: session identity change resets baseline without a fake cinematic", () => {
  const h = createHarness(); h.progress(7, "hydrate", true, "A"); h.switchSession({ user: { id: "B", email: "b@example.com" } });
  h.progress(7, "session", false, "B"); h.progress(3, "hydrate", true, "B");
  assert.equal(activeCinematics(h).length, 0); assert.deepEqual({ ...h.window.VDuckiePolishV106.getState().baseline }, { hydrated: true, sessionIdentity: "B", level: 3 });
  h.progress(4, "mutation", true, "B"); assert.equal(activeCinematics(h).length, 1); assert.match(activeCinematics(h)[0].innerHTML, /Level 3 → Level 4/);
});

test("F: cinematic B owns its timers and A cannot close it or play delayed unlock", () => {
  const h = createHarness(); h.progress(5, "hydrate"); h.progress(6, "mutation"); const aId = h.window.VDuckiePolishV106.getState().activeCinematicId;
  h.scheduler.advance(100); h.progress(7, "mutation"); const bId = h.window.VDuckiePolishV106.getState().activeCinematicId; assert.notEqual(aId, bId);
  h.scheduler.advance(2200); assert.equal(h.audioStarts.filter(value => value === 660).length, 0);
  h.scheduler.advance(100); assert.equal(h.audioStarts.filter(value => value === 660).length, 1);
  h.scheduler.advance(1900); assert.equal(h.window.VDuckiePolishV106.getState().activeCinematicId, bId);
  h.scheduler.advance(100); assert.equal(h.window.VDuckiePolishV106.getState().activeCinematicId, bId);
  h.scheduler.advance(260); assert.equal(h.window.VDuckiePolishV106.getState().activeCinematicId, 0);
});

test("G: cinematic blocks background pointer/focus and restores state after close", () => {
  const h = createHarness(); h.progress(2, "hydrate"); h.progress(3, "mutation"); const overlay = activeCinematics(h)[0];
  assert.equal(h.backgroundButton.inert, true); assert.equal(h.document.body.classList.contains("v106-cinematic-open"), true); assert.equal(h.document.activeElement, overlay);
  const click = new FakeEvent("click", { target: overlay }); overlay.dispatchEvent(click); assert.equal(click.defaultPrevented, true); assert.equal(click.propagationStopped, true);
  h.document.dispatchEvent(new FakeEvent("focusin", { target: h.backgroundButton })); assert.equal(h.document.activeElement, overlay);
  h.scheduler.advance(4560); assert.equal(h.backgroundButton.inert, false); assert.equal(h.document.body.classList.contains("v106-cinematic-open"), false);
});

test("H: SFX routing emits click only for normal buttons and feedback only for learning actions", () => {
  const h = createHarness(); const normal = h.document.createElement("button"); h.document.body.appendChild(normal); h.click(normal);
  const wrong = h.document.createElement("button"); wrong.classList.add("erp-module-option"); h.document.body.appendChild(wrong); h.click(wrong); h.mascotEvent("wrong-answer");
  const correct = h.document.createElement("button"); correct.setAttribute("data-hsk-option", "1"); h.document.body.appendChild(correct); h.click(correct); h.mascotEvent("correct-answer");
  assert.deepEqual(h.audioStarts, [390, 240, 620]);
});

test("I: suspended AudioContext resumes once and only the latest pending tone is played", async () => {
  const h = createHarness({ audioState: "suspended" }); const normal = h.document.createElement("button"); h.document.body.appendChild(normal);
  h.click(normal); h.click(normal); await Promise.resolve(); assert.equal(h.audioInstances.length, 1); assert.equal(h.audioInstances[0].resumeCalls, 1); assert.equal(h.audioStarts.length, 0);
  h.resumeGate.resolve(); await flushPromises(); await new Promise(setImmediate); assert.equal(h.audioStarts.length, 1); assert.equal(h.audioStarts[0], 390);
});

test("J: idle generic micro-accent is excluded from Level 1-2 and retained for Level 3-10", () => {
  assert.doesNotMatch(css, /\.v95-mascot\.is-idle \.v95-motion-accent/);
  const selector = css.match(/\.v95-mascot\.is-idle:is\(([^)]+)\) \.v95-motion-accent/);
  assert.ok(selector); assert.doesNotMatch(selector[1], /v95-level-[12](?:\D|$)/);
  for (let level = 3; level <= 10; level += 1) assert.match(selector[1], new RegExp(`v95-level-${level}`));
});

test("K: cinematic new-in keyframe has one canonical declaration", () => {
  assert.equal((css.match(/@keyframes v106-new-in/g) || []).length, 1);
  assert.match(css, /v106-new-in[^]*rotate\(-2deg\)[^]*rotate\(1\.5deg\)/);
});

test("destroy clears cinematic, body lock, session listener, audio and legacy guard", () => {
  const h = createHarness(); h.progress(5, "hydrate"); h.progress(6, "mutation"); h.window.VDuckiePolishV106.destroy();
  assert.equal(activeCinematics(h).length, 0); assert.equal(h.document.body.classList.contains("v106-cinematic-open"), false); assert.equal(h.backgroundButton.inert, false);
  h.legacy.hidden = false; assert.equal(h.legacy.hidden, false);
  h.progress(7, "mutation"); assert.equal(activeCinematics(h).length, 0);
});
