# Duckie Chat v2 – Audit / Model options / rollout

## Diagnosis (source-level evidence)
- Frontend: `assets/ai/duckie-chat.js` used `textContent` to render all responses (no Chinese removal / no encoding conversion). Thus there is no source evidence that frontend replaces Hanzi with `""`. It simply displayed what the backend supplied.
- Backend: `functions/api/duckie-chat.js` previously checked presence of **any** Chinese character and retried once. A wrong Hanzi could pass; Pinyin mismatch, response truncation and overly fixed instructions were unchecked.
- Content-Type is JSON with `charset=utf-8`; the application is not using a Latin-1 codec or font conversion.
- Cloudflare production inference logs and unmodified raw model payloads were **not** available using the linked GitHub connector. Therefore the true originating cause of each observed `""` response is not conclusively proven; model generation is likely but unconfirmed. Verify with Cloudflare Functions logs and a supervised real inference before calling it root-cause proven.

## Model evaluation (pricing docs verified 2026-11-02)
| Provider/model | Notable benefits | Limitations | Listed token rate (USD per 1M input/output) |
| --- | --- | --- | --- |
| Cloudflare Llama 3.1 8B -fast (current) | Already integrated, quick and simple | Reported weak Vietnamese → Chinese teaching quality | Confirm `-fast` SKU in current dashboard; no unverified price stated |
| Cloudflare Qwen3 30B A3B FP8 (`@cf/qwen/qwen3-30b-a3b-fp8`) | Multilingual instructions, Chinese-language focused family, same binding | Must benchmark output/latency with live prompts; may reason verbosely | $0.0509 / $0.335 |
| Cloudflare Qwen3.8 27B (`@cf/qwen/qwen3.8-27b`) | Modern model, long context, Chinese-language model family | More output cost, performance and response speed not benchmarked | $0.450 / $3.200 |
| Google Gemini API free tier | Worth testing if Cloudflare output is insufficient | Provider switch, key management, different free quotas and privacy requirements; no key installed | Some model free tiers; verify exact model/rate limit in AI Studio |

Source: https://developers.cloudflare.com/workers-ai/platform/pricing/ , https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/ , https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/ , https://ai.google.dev/gemini-api/docs/pricing

Cloudflare currently grants 10,000 neurons/day on Workers Free, then requests fail rather than silently charging. On Workers Paid, above-free usage bills by neurons. No plan upgrade or payment settings were changed.

## Activation
Production default remains `@cf/meta/llama-3.1-8b-instruct-fast`. To opt into a specific supported Qwen model *after reviewing live results and free quota*, configure an encrypted/server-side `DUCKIE_AI_MODEL` variable (not in frontend) to one of two allowed model IDs in `functions/api/duckie-chat.js` and redeploy. No model changes happen automatically, no new provider key is required.

## Quality checks
Mock tests prove request validation, intent prompt construction, retry count, output-shape guards, basic UTF-8 Hanzi preservation, followup context, and frontend safety. They **do not** prove Pinyin correctness or natural response quality. Automatic Pinyin/Hanzi semantic matching remains unsolved except matching the known seed headwords; HSK dictionary/ERP broad retrieval is a future enhancement. Model outputs are never written into the authoritative vocabulary store.

## Manual production acceptance, required for full sign-off
After merge/redeploy, ask all ten questions from `tests/duckie-tutor-quality-v2.test.mjs` on desktop and mobile with Cloudflare model actually running. Check real Chinese characters, marked Pinyin correctness, tone, natural grammar, no broken formatting, browser Console/Network. Capture outcome for each and compare cost/speed; model benchmarking not claimed on mocked unit tests.

## Security
No API keys in browser; Cloudflare AI bound on server. Content is rendered with `createTextNode` and safe DOM nodes. The client can submit an optional selected-word *hint*, which is untrusted user input, not a verified dictionary record. The small hardcoded lexical seed should eventually be replaced with controlled server-side HSK/ERP records. Apply rate limits before public scale-up.
