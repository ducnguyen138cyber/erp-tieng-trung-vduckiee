# Blue/white runtime audit — 2026-11-03

Baseline main: `3657bfb74f48083db06cfed4d0bdbcf682f82604`.
Production and immutable baseline: `https://vduckie.pages.dev/`,
`https://e619e492.vduckie.pages.dev/`.

## Evidence before the change

A fresh Cloud Browser loaded the current blue theme and SVG mascot on both
origins. Deployment was successful; the remaining legacy appearance is observable
without an old browser cache. Production's DOM contained
`blue-edtech-v1.css?v=5-nov03` and `blue-white-final-20261103.css?v=2`, followed by
stylesheets dynamically mounted by HSK, dictionary, personal dashboard and premium
learning modules.

Actual computed values and matching rules:

- `.home-library-link`: text `rgb(24,53,46)` from `v72-layout.css` using
  `--layout-green`; the theme did not cover this live selector/token.
- `#hsk .hsk-focus-tabs button.active`: background `rgb(21,61,52)` from
  `hsk-professional-runtime.css?v=home-isolation4` loaded after the theme.
- `.hsk-focus-tabs`: cream `rgb(246,243,235)`.
- `.hsk-focus-reveal`: forest `rgb(24,62,52)`.
- Header/menu icons, search input, quiz launcher, locked HSK levels and lesson
  number circles also retained local forest/cream declarations.
- The previous browser theme test checked a root custom property and mascot URL;
  it did not establish the final computed paint on each screen.

The Cloudflare Dashboard was opened with Cloud Browser and showed its sign-in
page; no authenticated dashboard access was available. Deployment verification
uses the connected GitHub Cloudflare check and direct browser inspection of the
immutable deployment, rather than claiming dashboard access.

## Implementation boundaries

An explicit `vduckie-brand` cascade layer owns only paint properties/tokens.
Its important declarations outrank legacy unlayered important declarations even
when those sheets arrive later. No display, visibility, sizing, routing, learning,
EXP, Supabase, AI behavior or progress algorithm is changed by this theme.
Foregrounds inherit neutral black; deliberate controls retain blue/white contrast.
Incorrect-answer feedback retains red semantics.

The Duckie artwork follows the user's explorer-duck references: a white duck,
explorer hat, blue book and simple backpack, drawn in a restrained 2D animation
style. It was produced with the built-in ImageGen tool, then encoded as a 55KB
transparent WebP for the site. Header, hero, cards, chat and icons consume the
versioned asset directly. The scoped legacy image adapter remains for deferred
components; it does not select user avatars. The full generation prompt and source
reference identities remain in the task conversation. This is not a claim of
human-drawn artwork.

PWA cache version advances to v15, worker updates bypass the HTTP cache, and
new visual asset URLs are precached with their exact query versions. Existing
learning storage and unrelated caches are preserved.

## Verification

`tests/brand-runtime-browser.mjs` inspects actual painted colors, rendered asset
URLs, missing requests and Console exceptions at 1440px and 390px across home,
curriculum, all four HSK lesson stages, Daily ERP including writing, review,
dictionary, all ranking periods, profile and Chat. It waits for deferred learning
modules/styles rather than checking the initial document only. It also injects a
late legacy important rule to prove the cascade priority.

With `VISUAL_BASE_URL` it runs against an actual deployment and records response
status/Service Worker origin, worker registration, cache names and a warm reload.
`VISUAL_OBSERVE_ONLY=1` records the old baseline without pretending its colors pass.
Local fixtures isolate Supabase for repeatable regressions; live audits do not
mock public site requests or send chat messages. These checks do not claim a new
Google OAuth or live authenticated EXP test.
