# MSUTONG public roadmap research

This implementation maps MSUTONG's public curriculum structure without copying textbook pages, dialogues, audio, or exercises.

## Cross-checked structure

- PREP's public curriculum summary lists 12 books: four beginner, four intermediate, and four advanced. It also publicly lists ten lesson topics for each beginner book and describes the skills focus.
  - https://prepedu.com/vi/blog/giao-trinh-han-ngu-msutong
- QTEDU independently describes the same 12-book / three-level structure, an initial pronunciation phase, later text-vocabulary-grammar work, four-skill practice, and character writing/typing.
  - https://qtedu.vn/giao-trinh-han-ngu-msutong.html
- Bac Nha Books' public catalog confirms the four-book beginner set.
  - https://www.bacnhabooks.com/giaotrinhhanungsutong

## Product decision

- All 12 books are shown so future enrichment is data-only.
- Beginner Book 1 uses the ten publicly listed Vietnamese lesson topics.
- Objectives and future exercises are original VDuckie companion content, not copied textbook material.
- Book/lesson metadata is labeled `partial` or `mapped`; unavailable detail is not presented as complete.
- Existing HSK content remains available as a supplementary library rather than being deleted.

## V2 lesson implementation

The second implementation narrows the production claim to Beginner Book 1. It
uses the ten-topic public order above, then supplies original VDuckie companion
content for each lesson: six vocabulary items, two Vietnamese grammar
explanations, an original dialogue, audio actions and three checks. Higher books
remain visibly labeled as roadmap only.

The learning design was also cross-checked against the openly licensed
*Elementary Chinese I* course from Michigan State University, which covers
beginner pronunciation, characters, greetings, identity, family, food and other
first-semester communication skills with audio and practice activities:

- https://openbooks.lib.msu.edu/chs101/
- https://open.umn.edu/opentextbooks/textbooks/elementary-chinese-i

No lesson dialogue, exercise or textbook page in the production bundle is copied
from a scan or unofficial PDF. Public sources establish the topic order; VDuckie
provides its own teaching text and practice flow.
