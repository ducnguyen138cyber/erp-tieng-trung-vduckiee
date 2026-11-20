# HSK2–3 Shadowing completion

## Content

| Level | Lessons | Original dialogue turns | Complete Hanzi/Pinyin/Vietnamese |
|---|---:|---:|---:|
| HSK2 | 28 | 112 | 112 |
| HSK3 | 36 | 144 | 144 |

All Hanzi and speaker labels come verbatim from `data/hsk/hsk{2,3}/lessons.json`; source lessons are unchanged. One card is one spoken turn, including all its sentences. The original 8 annotation IDs per level remain stable. Previously displayed sentence fragments map through `legacyIds` to their whole turn, preserving selected position and starred/weak flags in `vduckie-shadowing-v1`. Unknown fields and other levels remain preserved.

Vietnamese translations were authored against every source turn. New Pinyin began as a pypinyin 0.55.0 draft, followed by contextual/neutral-reading corrections (including 了解 liǎojiě, 量 liáng, 当地 dāngdì, 教 jiāo, 得 dé/de, 长 cháng/zhǎng, 重 chóng, 着 zhe/zháo, clock-number 一 versus sandhi, and erhua). Citation third tones are retained. The original 16 Pinyin annotations are preserved. Content remains `machine-assisted-unreviewed`: completeness and structural tests are **not teacher approval** or a pronunciation-quality certificate.

HSK2/3 now load only their compact annotated JSON with lesson titles, rather than fetching the entire 0.54/0.96 MB course files. The two payloads and v3 JS/CSS are precached under PWA cache v51. HSK1's 900 sentence sources are unchanged.

## Practice behavior

- Existing lesson, starred and weak filters, temporary recording and speed controls remain.
- Playback supports 1 or 3 repetitions, with cancellation on Stop/navigation/backgrounding.
- Rate, repeat count and text visibility preferences persist per level.
- Starting recording stops sample playback. Navigating away, changing sentence or backgrounding releases microphone tracks and temporary recording URLs; permission/constructor failure cleans up streams.
- No recording upload, pronunciation AI score, EXP award or account/schema change.

## Acceptance

Targeted unit tests check every turn against real source lessons, all legacy fragment mappings, original IDs, complete fields, pronunciation regressions and PWA cache behavior. Browser tests cover HSK1 plus first/middle/last lessons of HSK2/3 at 1365, 390 and 320px, migration, filters, saved preferences, repetition/Stop, permission refusal and MediaRecorder with synthetic microphone input. TTS is mocked for deterministic playback-control checks. These browser tests do not certify physical iPhone/Android microphones or system Chinese voice quality.

At initial commit: targeted unit tests **22/22 PASS**, JS syntax and diff checks PASS. Final exact-head CI results, preview URL and screenshot evidence are recorded in the PR description. PR remains unmerged until owner approval.
