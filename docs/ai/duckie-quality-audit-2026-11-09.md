# Duckie AI production spot-check — 2026-11-09

Source: [GitHub Actions run #42585795979](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/42585795979), four real public questions to `https://vduckie.pages.dev/api/duckie-chat`, without personal data.

| Prompt | Status | Keyword/known fact | Editorial observation |
|---|---|---|---|
| Viết tiếng Trung là gì? | HTTP 200 | 写 / xiě present | Suitable basic example |
| Mặc cả tiếng Trung là gì? | HTTP 200 | 讨价还价 / tǎo jià huán jià present | Concise and grounded |
| Ăn tối tiếng Trung là gì? | HTTP 200 | 吃晚饭 / chī wǎnfàn present | **Needs review:** added a needless generalization about dinner being 17–20h |
| Giải thích 越来越 | HTTP 200 | 越来越 present | **Needs review:** described a following verb as typical although its examples use adjectives; should explain 越来越 + adjectives and some mental/state verbs |

**Important:** 4/4 matching expected strings was not 4/4 pedagogically approved. These are real-output observations, but only a four-case sample. Backend changes in this PR add strict canonical Pinyin-tone checks, safer unknown-word admissions, and source-backed prompts correcting the two observed teaching risks. They are not yet evidence that a deployed version has learned every rule.

Automated live checks now explicitly label nuanced grammar/cultural responses `pedagogy-review-needed` rather than `verified-spot-check` even when they contain correct Chinese words. More independent linguistic review and targeted real-production follow-up are necessary before claiming full teaching quality.

## Candidate hardening — 2026-11-10

- Integrated main `256334da` (PR #119) into the existing PR #118 branch.
- Canonical vocabulary checks bind pronunciation to the exact Hanzi/Pinyin pair, reject conflicting repeated pairs, and accept NFC/NFD, markdown, fullwidth parentheses and syllable spacing. A correct syllable in another word no longer hides a wrong tone.
- Explicit new vocabulary questions do not inherit the previous topic; short follow-ups retain context. Grammar/correction checks require a pronunciation field rather than treating Vietnamese accents as Pinyin. Malformed JSON `null` returns 400.
- CI checks the immutable Cloudflare preview associated with the exact PR head. It fails when the candidate cannot be identified or AI is unavailable; it never substitutes production and calls that candidate validation.
- Real-response evidence stores complete bounded answers (5,000 chars), source labels, endpoint and head SHA. Three curated glossary lookups exercise delivery; the generated 越来越 explanation always requires editorial review. A green smoke workflow is not language-expert approval.
- Local targeted tests: **27/27 PASS**; JavaScript syntax PASS. Preview, live responses and updated browser/regression CI are pending at the time of this commit. No production deployment/merge is claimed.

Limit: this remains a three-entry canonical glossary safeguard, not validation of every word, generated example or grammar explanation. Current HSK rules are not certified by this PR.
