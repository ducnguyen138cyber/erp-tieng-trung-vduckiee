"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pngSize = (file) => {
  const png = fs.readFileSync(path.join(root, file));
  assert.equal(png.toString("ascii", 1, 4), "PNG", `${file} must be a PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

test("manifest is installable and subpath-safe", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), icon.src);
  assert.deepEqual(pngSize("assets/pwa/vduckie-192.png"), [192, 192]);
  assert.deepEqual(pngSize("assets/pwa/vduckie-512.png"), [512, 512]);
  assert.deepEqual(pngSize("assets/pwa/vduckie-maskable-512.png"), [512, 512]);
});

test("index registers relative PWA resources", () => {
  const index = read("index.html");
  const shell = read("app-shell-v88.html");
  assert.match(index, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(index, /src="\.\/pwa-register\.js\?v=1"/);
  assert.match(shell, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(shell, /src="\.\/pwa-register\.js\?v=1"/);
  const registration = read("pwa-register.js");
  assert.match(registration, /new URL\("\.\/service-worker\.js", window\.location\.href\)/);
  assert.match(registration, /new URL\("\.\/", window\.location\.href\)/);
});

test("service worker versions caches and cleans prior VDuckie caches", () => {
  const worker = read("service-worker.js");
  assert.match(worker, /CACHE_VERSION = "vduckie-pwa-v5"/);
  assert.match(worker, /key\.startsWith\("vduckie-pwa-"\)/);
  assert.match(worker, /caches\.delete\(key\)/);
  assert.match(worker, /self\.skipWaiting\(\)/);
  assert.match(worker, /self\.clients\.claim\(\)/);
});

test("service worker excludes auth, Supabase and dynamic APIs", () => {
  const worker = read("service-worker.js");
  for (const exclusion of ["request.method", ".supabase.co", "/auth/", "/oauth", "/callback", "/functions/api/", "/api/", "functions/api/jarvis.js"]) {
    assert.ok(worker.includes(exclusion), exclusion);
  }
});

test("offline navigation fallback and app shell are explicit", () => {
  const worker = read("service-worker.js");
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /\.\/app-shell-v88\.html/);
  assert.match(worker, /\.\/offline\.html/);
  assert.match(read("offline.html"), /VDuckie đang ngoại tuyến/);
});
