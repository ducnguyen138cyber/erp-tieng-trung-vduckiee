"use strict";

const CACHE_VERSION = "vduckie-pwa-v50";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SCOPE_URL = new URL(self.registration.scope);
const scoped = (path) => new URL(path, SCOPE_URL).href;

const APP_SHELL = [
  "./assets/vietnamese/entry.js?v=1",
  "./assets/navigation/screen-router.js?v=vi1",
  "./supabase-sync.js?v=vi1",
  "./install.html",
  "./assets/pwa/mobile-pwa.css?v=1",
  "./pwa-register.js?v=3",
  "./community.js?v=factory1",
  "./assets/v75/home-welcome-v75.1.js?v=factory1",
  "./assets/v90/exp-board-v90.js?v=public1",
  "./app-shell-v88.html?v=fast-auth-home1",
  "./assets/boot/pinyin-parts-boot-v1.js?v=1",
  "./assets/boot/erp-dictionary-boot-v1.js?v=1",
  "./erp-content-v74.js?v=factory1",
  "./erp-lessons-v74.js?v=factory1",
  "./dialogue.js?v=factory1",
  "./assets/v86/experience-suite-loader-v86.js?v=progress-row1",
  "./assets/v86/home-dashboard-v86.5.js?v=progress-row1",
  "./assets/v85/personal-dashboard-v85.js?v=progress-row1",
  "./assets/v86/premium-learning-v86.js?v=public1",
  "./assets/navigation/screen-router.js?v=drawer1",
  "./assets/v90/home-exp-sidebar-v90.js?v=factory1",

  "./assets/auth/auth-screen.css?v=6",
  "./assets/auth/auth-screen.js?v=6",
  "./assets/interface/public-interface.css?v=3",
  "./assets/interface/mobile-navigation.js?v=1",
  "./assets/factory/workshop-content.js?v=1",
  "./assets/games/sentence-engine.js?v=2",
  "./assets/games/sentence-game.js?v=2",
  "./assets/games/sentence-game.css?v=2",
  "./data/games/sentences.json?v=1",
  "./assets/games/typing-game.css?v=5",
  "./assets/games/games-hub.css?v=1",
  "./assets/games/typing-engine.js?v=2",
  "./assets/games/typing-game.js?v=6",
  "./assets/games/airplane.svg?v=2",
  "./",
  "./index.html",
  "./app-shell-v88.html",
  "./offline.html",
  "./assets/mascot/duckie-reader-icon-32.png?v=2.0",
  "./assets/mascot/duckie-reader-icon-180.png?v=2.0",
  "./assets/mascot/duckie-reader-icon-192.png",
  "./assets/mascot/duckie-reader-icon-512.png",
  "./assets/design-system/brand-runtime-v2.css?v=2.2",
  "./assets/design-system/mascot-swap-v1.js?v=7",
  "./assets/mascot/duckie-reader-2d-v2.webp?v=2.0",
  "./assets/mascot/duckie-flashcards-2d-v3.webp?v=3.0",
  "./assets/mascot/duckie-writing-2d-v3.webp?v=3.0",
  "./assets/mascot/duckie-listening-2d-v3.webp?v=3.0",
  "./assets/mascot/duckie-speaking-two-wings-v4.svg?v=4.0",
  "./assets/mascot/duckie-speaking-2d-v5.webp?v=5.0",
  "./assets/v90/exp-floating-feedback-v91.css?v=1",
  "./assets/i18n/interface-language-menu-v1.css?v=3b1",
  "./assets/i18n/interface-i18n-v1.js?v=factory1",
  "./assets/v90/exp-core-v90.js?v=word-float1",
  "./assets/v89/exp-learning-hooks-v89.js?v=word-float1",
  "./assets/v95/mascot-manifest-v95.js?v=two-wings4",
  "./assets/design-system/mascot-swap-v1.js?v=10",
  "./assets/mascot/duckie-reader-icon-32.png?v=4.0",
  "./assets/design-system/erp-workspace-v1.css?v=1.0",
  "./assets/design-system/remaining-interface-polish-20261103.css?v=1",
  "./assets/design-system/hsk-rail-stability-v1.css?v=1",
  "./assets/hsk-content/hsk-study-journey-v1.js?v=phase2.3",
  "./assets/hsk-content/hsk-study-flow-v1.js?v=word-float1",
  "./assets/hsk-content/hsk-study-journey-v1.css?v=phase2.3",
  "./assets/hsk-content/hsk-professional-runtime.js?v=public1",
  "./assets/hsk-content/hsk-content-feature-flags.js?v=public1",
  "./assets/curriculum/graded-hsk-entry.js?v=public1",
  "./assets/hsk-content/hsk-practice-bank-v1.js?v=2",
  "./assets/hsk-content/hsk-practice-ui-v1.js?v=2",
  "./assets/hsk-content/hsk-practice-ui-v1.css?v=2",
  "./assets/hsk-content/hsk-shadowing-v1.js?v=2",
  "./assets/hsk-content/hsk-shadowing-v1.css?v=2",
  "./assets/v95/mascot-manifest-v95.js?v=96.1",
  "./assets/search/header-chinese-search.css?v=2",
  "./assets/search/header-chinese-search.js?v=2",
  "./assets/search/dictionary-extras.css?v=2",
  "./assets/ai/free-learning-assistant.css?v=2",
  "./hsk-lessons.js?v=2b4.2",
  "./assets/v79/unified-dictionary-v79.js?v=79.1",
  "./manifest.webmanifest",
  "./assets/mascot/duckie-reader-maskable-512.png",
  "./pwa-register.js",
  "./v72-layout.css",
  "./erp-lessons-v74.css?v=74.1",
  "./lite-terms.js",
  "./erp-content-v74.js",
  "./erp-lessons-v74.js",
  "./hsk-lessons.js",
  "./dialogue.js",
  "./assets/daily-learning-v2.css?v=2.9",
  "./assets/daily-learning-v2.js?v=factory1",
  "./assets/msutong-hsk1-v2.js",
  "./assets/curriculum/content-v1.js",
  "./assets/curriculum/progress-v1.js",
  "./assets/curriculum/workspace-v1.js",
  "./assets/curriculum/workspace-v1.css",
  "./assets/v79/hsk-dictionary-v79.js",
  "./assets/v79/unified-dictionary-v79.js",
  "./assets/v79/unified-dictionary-v79.css",
  "./assets/v79/unified-dictionary-v79.part1.txt",
  "./assets/v79/unified-dictionary-v79.part2.txt",
  "./assets/v79/unified-dictionary-v79.part3.txt",
  "./assets/v79/unified-dictionary-v79.part4.txt",
  "./assets/v79/unified-dictionary-v79.part5.txt",
  "./vendor/hanzi-writer.min.js",
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
  return request.headers?.has("Authorization") ||
    ["code", "access_token", "refresh_token", "error", "error_description", "token_hash", "auth"].some((key) => url.searchParams.has(key)) ||
    url.hostname.endsWith(".supabase.co") ||
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
  // Only the offline/install pages are mandatory. A missing old learning asset
  // must not prevent mobile installation. Keep optional requests bounded.
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const required = ["./offline.html", "./install.html", "./assets/pwa/mobile-pwa.css?v=1", "./pwa-register.js?v=3", "./assets/mascot/duckie-reader-icon-192.png"].map(scoped);
    await cache.addAll(required);
    const optional = APP_SHELL.filter((url) => !required.includes(url));
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < optional.length) {
        const url = optional[next++];
        try { await cache.addAll([url]); } catch (_) { /* Warm on demand instead. */ }
      }
    }));
    // New installs activate naturally. Updates wait until a safe user action.
  })());
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
  // Media byte-range responses (206) cannot be stored with Cache.put.
  if (request.headers?.has("Range")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (["./install.html", "./install"].some((path) => url.pathname === new URL(path, SCOPE_URL).pathname) ? await caches.match(scoped("./install.html")) : null) || caches.match(scoped("./offline.html")))
    );
    return;
  }

  if (!isStaticAsset(url)) return;
  // Executable assets must be current on this load, not on the next reload.
  // Keep query versions distinct; otherwise a pre-fix script can win forever.
  if (/\.(?:html|css|js|json|svg|png|jpe?g|webp)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        // The app bootstraps a versioned shell URL while install precaches an
        // unversioned copy. Fall back to that shell only when offline; keep
        // scripts/styles strictly query-versioned to avoid stale code.
        if (url.pathname === new URL("./app-shell-v88.html", SCOPE_URL).pathname) {
          const shell = await caches.match(scoped("./app-shell-v88.html"));
          if (shell) return shell;
        }
        throw error;
      }
    })());
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const refreshed = fetch(request).then((response) => {
        if (response.ok && response.type === "basic") caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      event.waitUntil(refreshed);
      return cached || refreshed;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
