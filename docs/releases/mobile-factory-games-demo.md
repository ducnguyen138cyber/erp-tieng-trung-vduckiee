# Mobile, factory Chinese and Pinyin game demo

Preview branch: `demo/mobile-factory-games` (PR #95). No main merge is part of this demo.

- Mobile drawer: left header button, overlay, Escape/backdrop/close, focus trap, background inert, route selection closes the drawer. Desktop navigation stays visible. Chat cannot overlap the drawer.
- Public copy: removes the V85 personalization/role card and developer script panels from default bootstrap; removes version/phase tags, backend/migration messages, and technical sync notes. Dictionary attribution, privacy, real learning instructions and course-quality information remain.
- Factory Chinese: existing ERP modules remain as specialist content with their IDs/progress intact. Adds four modules, 40 contextual vocabulary definitions/examples, 16 practical phrases, four dialogues and topic filters (shift handover, safety, quality, equipment).
- Falling typing: HSK 1–4 and required difficulty selection stay unchanged. Adds guided, Hanzi-only and Vietnamese-only prompts; withheld answers are absent from meteor DOM. Preserves compositor animations, effects pool and one projectile per correct letter.
- Sentence translation: 36 curated prompts in three topics, 10 questions per round, explicit equivalent answers, wrong keys discarded, Backspace supported, reveal Hanzi/Pinyin only after correct completion or skip. Results/review/restart/exit; no AI calls and no account EXP.

Translation matching uses the curated alternatives in `data/games/sentences.json`; it does not judge every valid translation or accept arbitrary synonyms. Typing accuracy includes rejected keys. Sentence points are 100 per completed sentence, once.

## Verification

Pure tests: sentence candidates/normalization, invalid key retention, variants, skip/round/replay accounting, module references, examples containing their focus word, canonical dialogue requirements, existing typing engine and public/PWA/i18n regressions.

Actual Chromium: `tests/public-demo-browser.mjs` (1440×900, 320×740, 390×844, 844×390, reduced 390×480), plus existing typing gameplay and CPU-throttled performance A/B checks. Screenshots/video and JSON reports are uploaded by `.github/workflows/typing-game.yml`. Supabase is mocked for browser scenarios, and award-method spies assert zero EXP calls; live OAuth/database writes are not exercised.
