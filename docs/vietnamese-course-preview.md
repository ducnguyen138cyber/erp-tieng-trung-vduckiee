# 学越南语 preview

## Scope and integration

- Based on main `33eafd88ed947daaca6fd34eb4115ca5a4eb1780` (PWA #106).
- Open PRs checked before implementation: #91 SEO touches index/sitemap; #37/#23 HSK editorial branches; #2 old Adam audio build. No HSK curriculum changes here. #91 may require resolving its index insertion when merged later.
- One existing VDuckie application and account. New exclusive screen `?screen=vietnamese`; optional `viUnit=l01&viTab=words` deep links. Chinese courses remain in their existing routes.
- Simplified Chinese module chrome, Vietnamese learning content; whole-site language preference is preserved. The shared account dialog remains the existing site-wide dialog.
- Tiny entry script loads initially. Full runtime/CSS/course catalog load only when opening Vietnamese; each lesson JSON is loaded on demand. Audio sprites load when a learner plays a unit's audio. Neither lessons nor audio are precached on Chinese home.

## Actual curriculum

12 complete lessons, exactly **168 distinct core words/phrases** (14 each). Two pronunciation units additionally contain 29 alphabet/example entries and six tone examples. Alphabet names and example sounds are distinguished; there is no Pinyin or Chinese-character imitation of pronunciation.

Every core lesson has a Chinese learning goal, 14 Vietnamese entries with Chinese meanings and natural bilingual examples, at least two grammar notes, six dialogue lines, five practice activities and a five-question final quiz. Five activity types are listening choice, meaning choice, matching, accented fill and word ordering. Answers and Chinese explanations are shown only after submission.

Completion requires visiting every vocabulary card, acknowledging rules and dialogue, finishing the five practice activities and reaching 80% in the final quiz. Highest score and completion merge monotonically across devices. Missing accents are not silently accepted. Listening has an explicit reading alternative when playback fails; it is labeled as reading rather than claiming a listening success.

Review saves bookmarks, learned vocabulary and mistakes. Errors are due after ten minutes. Successful recall uses 1/3/7/14/30-day intervals. Repeated success within 20 hours does not advance another stage. No EXP APIs or leaderboard writes are called.

## Audio

**513 unit/phrase references, 498 distinct spoken texts**, bundled as 14 MP3 sprites, fixed `vi-VN-NamMinhNeural` male Vietnamese neural voice. Sources and segment timestamps are committed alongside the files. No runtime TTS keys, fees or external speech endpoint are required. Slow playback uses pitch-preserving media playback at 0.75 speed. Device vi-VN speech is a labeled fallback; foreign-language voices are never used. No microphone, recognition or AI pronunciation scoring is claimed.

Voice provider marks the locale vi-VN; the intended teaching model is Northern Vietnamese. Human listening review on real phones remains appropriate before broad publication, especially isolated letter names, glottalized tones and dialect distinctions. These are synthesized examples, not recordings by a certified teacher.

Rebuild: Python with `edge-tts==7.3.1` and ffmpeg, then `python scripts/build-vietnamese-audio.py`. Intermediate clips live outside Git. The runtime consumes only bundled MP3s.

## Progress and security

Reuse existing owner-only `public.user_words`, with category `__system_vietnamese__`, keys `__vduckie_vi_v1__:<record>`, and `is_known/is_saved=false`. Each lesson, word and last position has its own row. Existing Chinese merge already excludes system rows. No migration, RLS change, new table, credentials or production user record modification is needed.

The cloud bridge reuses the existing authenticated Supabase client and rejects signed-out/offline writes. Loads explicitly filter `user_id` and module category; late responses after account switches are rejected. Separate local keys `vduckie-vietnamese-v1:<user id or guest>` prevent progress sharing between accounts. Guest progress is deliberately not silently assigned to the next person who signs in. An early scoped isolation rule and the router guard prevent late legacy HSK initialization from exposing a second screen or rewriting Vietnamese deep links. Center-scroll and keyboard focus reset only at screen/step transitions, not on every word. Cloud status distinguishes local saving from successful synchronization. Failed reads never trigger stale uploads.

Live RLS was inspected and tested in one transaction with two generated test identities. Own-row reads/writes passed, a new user saw zero foreign rows, cross-user insertion was denied, reselecting the first identity restored its own lesson, and HSK/ERP sentinel rows remained unchanged. The entire test transaction was rolled back. Auth trigger was inspected first and performs only profile SQL. This is database authorization verification, not a real Google/password login.

## Validation

Commands:

```sh
node --test tests/vietnamese-course.test.cjs tests/vietnamese-bridge-audio.test.cjs
# jsdom@26.1.0 required for DOM tests
node --test tests/vietnamese-ui.test.cjs
# Playwright 1.58.2 and Chromium/WebKit required for the CI browser job
node tests/vietnamese-browser.mjs
```

Verified checkpoint `b230701`: 13 content/storage/cloud/audio tests and six DOM interaction scenarios passed. All six browser scenarios passed: Chromium and WebKit at 1440, 390 and 320 pixels, including emulated standalone at 390. No uncaught page errors and zero Vietnamese data requests on initial Chinese home. Local CI-server home-ready times were 3.3–3.9 s in Chromium and 6.1–6.5 s in WebKit; these are not production or mobile-network performance guarantees. The first Chromium scenario also completes the lesson, reloads, signs in, syncs, signs out and signs back in using isolated auth fixtures.

The existing 121-test sidebar/auth/HSK/ERP/EXP/PWA unit regression command passed; two new legacy session regressions also pass. A broad local run passed 577/583 checks; six browser-launch cases are restricted by this workspace and must be verified by GitHub CI. Manual public preview verified the lesson screen, audio playback, listening grading, Chinese explanations, route isolation and center scroll. The Vietnamese browser CI mocks the unrelated legacy community API to avoid a cross-origin failure in its test environment. The old sidebar browser test now explicitly closes the real auth dialog after mocked OAuth initiation before testing the chat behind it. Final CI results for the editorial update are recorded in the PR; do not treat pending jobs as passed.

Limits: no live personal-account sign-in was performed; browser auth scenarios use test fixtures. Real iOS/Android installation, hardware playback, and native pronunciation-teacher review remain device/editorial checks. The browser sign-out scenario exposed a pre-existing 600 ms upload callback in v82 reading a cleared session. Session-generation guards now cancel stale uploads, discard old-account reads and suppress delayed reload/status updates. Two lifecycle regressions cover logout and switching accounts; scoring and profile fields are unchanged.

No main merge is authorized until the owner approves this preview.
