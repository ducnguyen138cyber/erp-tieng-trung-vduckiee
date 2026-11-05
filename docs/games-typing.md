# Trò chơi · Luyện gõ

Entry: `?screen=games`. Sidebar: Ôn tập → Trò chơi → Xếp hạng.
The screen router owns visibility, history and the single active sidebar item.
The game's full-screen dialog uses the current VDuckie mascot asset in its header.

## Content and setup

The required sequence is game card → HSK level → difficulty → Start. Back buttons
allow changing the choices. HSK 1–4 match the published learner course. HSK 5–9
remain locked. The adapter reads existing vocabulary indexes and their shards;
it does not generate vocabulary or call an AI model. It validates Hanzi, Pinyin
and Vietnamese meaning, and removes repeated Hanzi within a selected pool.

## Timing and scoring

| Mode | Full fall | Next meteor at |
| --- | --- | --- |
| Dễ | 12 s | 85%, or 10.2 s |
| Vừa | 9 s | 80%, or 7.2 s |
| Khó | 6 s | 75%, or 4.5 s |

An early destruction schedules another meteor after 0.6 active seconds. A single
spawn deadline and a maximum of two active meteors prevent duplicate spawns.
Positions use elapsed active time as a fraction of the arena height. Pause stops
both physics and the three-minute round timer. A hidden document pauses the game;
resuming requires the player's action.

Each complete word earns 100 game points times the combo multiplier. The first
five words use ×1, the next five ×2, up to ×5. Missing a meteor resets the combo.
Accuracy counts correct inserted characters divided by all inserted characters;
deleting with Backspace is not another attempt. Each meteor has a 10% chance of
carrying a heart; destroying it adds one life, capped at five. Initial lives: three.

## Input and lifecycle

Input accepts mixed case, spaces, tone marks, tone numbers and ü/v/u:/u. A glyph
map keeps the tone-marked Pinyin highlight aligned with the unmarked input.
A wrong suffix remains editable, preserving the correctly typed prefix. Completion
is automatic and consumes one target, so repeated input events cannot score it twice.
The browser draws live text and CSS/SVG effects; the reference screenshot is not
used as an interactive background.

WebAudio produces small synthesized tones after a user gesture. Mute is remembered
on the device. Closing/restarting removes the dialog, animation frame, viewport and
visibility listeners, and closes its audio context. CSS animations stop while paused.
`visualViewport` height/offset changes keep the input above the visible viewport's
bottom when a mobile keyboard reduces the available height.

## EXP

The game calls the same `VDuckieEXP.awardWordMastery(level, hanzi, anchor)` used by
word learning. There is no new reward endpoint, separate quota or local EXP counter.
The existing authenticated RPC awards +3 EXP, deduplicates its word key across
learning/game attempts, and serializes the shared 50-word daily quota in Vietnam time.
Combo changes game score only. Guest play and play after the quota remain available.
A per-round promise map also prevents duplicate concurrent calls for the same word.

## Verification

- `node --test tests/typing-game.test.cjs`: normalization/glyph mapping, correction,
  timing in all modes, spawn cap, hearts, game over, pause, combo, three-minute end,
  restart and real vocabulary shards.
- `node tests/typing-game-browser.mjs`: Chromium integration with real-time gameplay,
  four viewport sizes, screenshots and WebM video under `artifacts/typing-game/`.
  Only the EXP network boundary is mocked. A simulated visibility change verifies
  the hidden-tab branch independently of headless Chrome's tab-visibility behavior.
- `tests/sql/typing-exp-rollback.sql`: real +3 awards, repeated-word rejection,
  shared daily cap and total EXP checks. All test writes are rolled back.
- The existing Sidebar stability workflow covers navigation/auth/PWA regressions.

Viewport checks include 1440×900, 390×844, 844×390 and 390×480. The last represents
reduced space while typing; it does not replace a physical iPhone/Android keyboard
check. Generated browser evidence is uploaded by the Typing game workflow.
