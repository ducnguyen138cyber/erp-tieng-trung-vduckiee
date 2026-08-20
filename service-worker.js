"use strict";

const CACHE_VERSION = "vduckie-pwa-v11";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SCOPE_URL = new URL(self.registration.scope);
const scoped = (path) => new URL(path, SCOPE_URL).href;

const APP_SHELL = [
  "./",
  "./index.html",
  "./app-shell-v88.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./pwa-register.js",
  "./v72-layout.css",
  "./erp-lessons-v74.css",
  "./lite-terms.js",
  "./erp-content-v74.js",
  "./erp-lessons-v74.js",
  "./hsk-lessons.js",
  "./dialogue.js",
  "./assets/daily-learning-v2.css",
  "./assets/daily-learning-v2.js",
  "./assets/msutong-hsk1-v2.js",
  "./assets/v79/hsk-dictionary-v79.js",
  "./assets/v79/unified-dictionary-v79.js",
  "./assets/v79/unified-dictionary-v79.css",
  "./assets/v79/unified-dictionary-v79.part1.txt",
  "./assets/v79/unified-dictionary-v79.part2.txt",
  "./assets/v79/unified-dictionary-v79.part3.txt",
  "./assets/v79/unified-dictionary-v79.part4.txt",
  "./assets/v79/unified-dictionary-v79.part5.txt",
  "./vendor/hanzi-writer.min.js",
  "./vendor/hsk-char-data.js",
  "./pronunciation.js",
  "./supabase-config.js",
  "./supabase-sync.js",
  "./assets/home/vduckie-welcome.webp",
  "./assets/vduckie-logo.png",
  "./assets/pwa/vduckie-192.png",
  "./assets/pwa/vduckie-512.png"
].map(scoped);

function isDynamicOrPrivate(request, url) {
  if (request.method !== "GET") return true;
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  if (url.origin !== SCOPE_URL.origin) return true;
  const path = url.pathname.toLowerCase();
  return url.hostname.endsWith(".supabase.co") ||
    path.includes("/auth/") ||
    path.includes("/oauth") ||
    path.includes("/callback") ||
    path.includes("/functions/api/") ||
    path.includes("/api/") ||
    path.endsWith("/functions/api/jarvis.js");
}

function isStaticAsset(url) {
  return /\.(?:html|css|js|json|png|jpe?g|webp|svg|woff2?|mp3|m4a|ogg|wav)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("vduckie-pwa-") && ![SHELL_CACHE, STATIC_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isDynamicOrPrivate(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true })) || (await caches.match(scoped("./index.html"))) || caches.match(scoped("./offline.html")))
    );
    return;
  }

  if (!isStaticAsset(url)) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const refreshed = fetch(request).then((response) => {
        if (response.ok && response.type === "basic") caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || refreshed;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
