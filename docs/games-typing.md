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
The airplane stays fixed in the horizontal center. Meteor rendering uses compositor transforms. Positions use elapsed active time as a fraction of the arena height. Pause stops
both physics and the three-minute round timer. A hidden document pauses the game;
resuming requires the player's action.

Each complete word earns 100 game points times the combo multiplier. The first
five words use ×1, the next five ×2, up to ×5. Missing a meteor resets the combo.
Accuracy counts correct inserted characters divided by all inserted characters;
deleting with Backspace is not another attempt. Each meteor has a 10% chance of
carrying a heart; destroying it adds one life, capped at four. Initial lives: three.

## Input and lifecycle

Input accepts mixed case, spaces, tone marks, tone numbers and ü/v/u:/u. A glyph
map keeps the tone-marked Pinyin highlight aligned with the unmarked input.
Wrong inserted characters are ignored immediately, preserving the accepted prefix and allowing the next correct key without Backspace. Each newly accepted character emits one shot; rapid/batched input staggers visible projectiles by 80 ms. Completion
is automatic and consumes one target, so repeated input events cannot score it twice.
The browser draws live text and CSS/SVG effects; the reference screenshot is not
used as an interactive background.

WebAudio produces small synthesized tones after a user gesture. Mute is remembered
on the device. Closing/restarting removes the dialog, animation frame, viewport and
visibility listeners, and closes its audio context. CSS animations stop while paused.
`visualViewport` height/offset changes keep the input above the visible viewport's
bottom when a mobile keyboard reduces the available height.

## EXP

Typing gameplay is independent of account EXP. Completing words only changes
round score/combo/hearts. Starting, ending (time or hearts), replaying and exiting
a round never invoke EXP rewards or learning evidence. There is no end-of-round
EXP bonus. Gameplay does not consume the 50-word daily learning reward quota.
The existing word-learning EXP mechanism is unchanged.

## Verification

- `node --test tests/typing-game.test.cjs`: normalization/glyph mapping, correction,
  timing in all modes, spawn cap, hearts, game over, pause, combo, three-minute end,
  restart and real vocabulary shards.
- `node tests/typing-game-browser.mjs`: Chromium integration with real-time gameplay,
  four viewport sizes, screenshots and WebM video under `artifacts/typing-game/`.
  Authenticated-like EXP spies assert zero reward/evidence calls during gameplay,
  gameover, replay and exit. A simulated visibility change verifies
  the hidden-tab branch independently of headless Chrome's tab-visibility behavior.
- `tests/sql/typing-exp-rollback.sql`: historical shared word-learning reward
  checks; the game no longer calls this RPC. No reward SQL changes are needed.
- The existing Sidebar stability workflow covers navigation/auth/PWA regressions.

Viewport checks include 1440×900, 390×844, 844×390 and 390×480. The last represents
reduced space while typing; it does not replace a physical iPhone/Android keyboard
check. Generated browser evidence is uploaded by the Typing game workflow.

## Rendering performance

The active game lives in an open ShadowRoot with the same stylesheet as the hub.
Page-wide translation, mascot and roadmap MutationObservers cannot traverse its
per-key DOM updates. The background app is inert and hidden while playing.
Meteor travel is one linear Web Animation for the whole fall, rather than a
JavaScript style write each frame. Physics still uses elapsed active seconds;
resize rebuilds the remaining path, and pause/resume controls native animations.
The existing glyph nodes are recolored in place. HUD text changes only when its
value changes. Projectiles (64), bursts (8) and floating scores (8) reuse bounded
pools. Native animations are canceled, and audio buffer sources stopped, on exit.
Key/break tones use precomputed AudioBuffers instead of constructing oscillators
and gain envelopes for every character. Completion fades the rock over 160 ms.

`tests/typing-game-performance.mjs` compares shipped commit `b60fc4c` and the
current renderer in the full app using identical Chromium, 4× CPU throttling,
real keyboard events and deterministic vocabulary. It covers all desktop modes
and mobile Hard, collecting frame intervals, long tasks, script/layout/style
CPU time and MutationObserver callbacks. Results and an optimized Hard recording
are uploaded by CI. EXP/auth boundaries are mocked, not physics or rendering.
Frame intervals on a virtual CI runner are evidence of relative performance;
they are not a guarantee for every physical display or GPU.
