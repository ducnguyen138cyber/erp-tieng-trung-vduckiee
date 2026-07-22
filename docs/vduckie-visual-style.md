# VDuckie Visual Style Guide

Version: 1.0  
Applies to: all mascot assets from Level 1 through Level 10.

## 1. Core character identity

VDuckie is a cheerful yellow duck with a slightly naïve but intelligent expression.

Required traits:

- Round, oversized head.
- Large, readable eyes.
- Orange beak.
- Slightly chubby torso.
- Short legs and wide feet.
- Clean cartoon/vector style with soft curves.
- Clear outlines that remain readable at small sizes.
- Bright, clean colors with restrained shading.
- No distorted anatomy, extra limbs, duplicated accessories, or excessive micro-detail.

## 2. Canvas and alignment

Canonical canvas:

- **512 × 512 px**
- Transparent background.
- Near-front camera angle.
- Character faces slightly toward the viewer, never a strong side profile.

Character alignment:

- Horizontal center: `x = 256`.
- Head center target: `x = 256`, `y = 190`.
- Body center target: `x = 256`, `y = 335`.
- Foot baseline: `y = 448`.
- Ground/contact shadow, when used: `y = 452–466`.

Safe zone:

- Left/right: 44 px.
- Top: 36 px.
- Bottom: 32 px.
- No hand, foot, glasses, shell fragment, book, tablet, or accessory may cross the safe zone.

All Level assets must keep the same canvas, center line, scale family, and baseline so switching assets does not cause layout shift.

## 3. Proportions

Default body ratio for Level 2 and later:

- Head height: about 42% of character height.
- Head width: about 48% of canvas width.
- Body height: about 32% of character height.
- Body width: about 38% of canvas width.
- Leg height: about 8% of character height.
- Feet width: about 14% of canvas width each.
- Head-to-body visual ratio: approximately **1.35 : 1**.

Level 2 may use a slightly larger head and smaller body to feel newly hatched.

## 4. Line treatment

At 512 px canvas:

- Main outline: 8–11 px.
- Inner facial lines: 6–8 px.
- Small detail lines: not below 5 px.
- Rounded line caps and joins.
- Avoid very thick black outlines.
- Use the primary outline color instead of pure black.

## 5. Color palette

Primary mascot colors:

| Purpose | Color |
|---|---|
| Feather yellow | `#FFD447` |
| Feather highlight | `#FFE98A` |
| Feather shadow | `#E7AB31` |
| Beak and feet | `#F28A2E` |
| Beak shadow | `#CF6424` |
| Main outline | `#293D36` |
| Eye white | `#FFFDF5` |
| Pupil | `#1E302B` |
| Soft cheek | `#F3A064` |

Egg colors:

| Purpose | Color |
|---|---|
| Shell light | `#FFF9E8` |
| Shell mid | `#F4E0AD` |
| Shell shadow | `#DDBE75` |
| Crack | `#8C642D` |

Brand accents:

| Purpose | Color |
|---|---|
| VDuckie green | `#1F6B55` |
| Warm accent | `#C96A3D` |
| Gold accent | `#E9B43E` |

## 6. Eyes and expression

Eyes:

- Large oval or rounded shape.
- White area must remain visible around the pupil.
- Pupils should move clearly for look-left/look-right frames.
- Blink frames use a soft curved eyelid line, not a flat black bar.
- Sad expression uses lowered eyelids and slightly raised inner brows.
- Happy expression may use curved eyes or brighter pupils.

Do not change eye size or spacing between animation frames; only lids, pupils, brows, and small head angles should change.

## 7. Beak

- Rounded orange beak with a soft center seam.
- The beak sits on the face center line.
- Closed beak is the default.
- Happy frame may open the beak slightly.
- Sad frame lowers the corners subtly.
- Avoid oversized teeth or human-like mouth anatomy.

## 8. Accessories

All future outfit/accessory variants are complete mascot assets, not separate overlays.

Rules:

- Accessory must sit inside the 44 px horizontal safe zone.
- Handheld items align to the same hand position across variants.
- Glasses remain centered on the same eye anchors.
- Head accessories must not crop at the top.
- Outfit hems and sleeves must not hide or duplicate limbs.
- No text, logos, or thought bubbles are baked into mascot images.
- Thought bubbles stay HTML/CSS UI elements.

## 9. Animation asset rules

Allowed render modes:

- `full-skin`
- `sprite`
- `lottie`
- `svg-sequence`

For sprite sheets:

- Every frame uses the same 512 × 512 character cell.
- No frame may shift the feet baseline by more than 4 px unless the state intentionally jumps.
- Keep frame count small for mobile performance.
- Transparent background only.

For Lottie/SVG animation later:

- Preserve the same head, body, and foot anchors.
- Avoid complex clip-path masks around limbs.
- Prefer simple groups and transform origins.
- Every animation requires a static fallback asset.

## 10. Level 1–2 asset plan

Level 1:

- `egg-normal.svg`
- `egg-cracked.svg`
- `egg-hatching.svg`

Level 2:

- One six-cell sprite sheet:
  - default
  - blink
  - look-left
  - look-right
  - happy
  - sad

Each Level 2 frame uses a 512 × 512 cell inside a 3072 × 512 transparent sprite sheet.
