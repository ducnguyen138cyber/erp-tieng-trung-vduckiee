# VDuckie Account QA — production acceptance blockers (2026-11-06)

## Verified
- Production Supabase project `vduckie-chinese` is active; `public.user_words` row-level policies restrict SELECT/INSERT/UPDATE/DELETE by `auth.uid() = user_id`.
- Anonymous/default SMTP restrictions are documented by Supabase: without a custom SMTP provider, delivery is limited to pre-authorized organization team email addresses. **We have NOT independently verified whether custom SMTP is enabled for this particular project.**
- Read-only authentication log aggregation for the past 24 hours observed `invalid_credentials`, `bad_jwt` and `refresh_token_not_found` errors. These do not prove an SMTP issue; no live inbox receipt has been confirmed.
- The GitHub workflow account-sync-safety verifies JavaScript behavior only, with in-memory fixture backends.

## Owner action needed for email delivery
1. Supabase Dashboard → select `vduckie-chinese` → Authentication → SMTP Settings.
2. Check whether **Custom SMTP** is enabled. If off, choose a legitimate transactional-email provider (e.g. Resend/Brevo/SES) and configure sender domain/address, host, port, username, password **in Supabase Dashboard only**, not in code or PR.
3. Verify sender-domain DNS records (SPF, DKIM; DMARC recommended), then save configuration.
4. Authentication → URL Configuration: Site URL `https://vduckie.pages.dev`; allow `https://vduckie.pages.dev/**` and, if needed, the trusted Cloudflare preview return URL; avoid arbitrary wildcards.
5. Authentication → Providers: verify Email and Google are enabled, and Google OAuth credentials/authorized callback include `https://zpwntwtximcxnyvtcfxp.supabase.co/auth/v1/callback`.
6. Use a **fresh disposable inbox you control**, not a learner account: sign up, inspect actual inbox message headers, click verification link, sign in, request reset link, update password. Keep any OTP/password outside GitHub issues or test logs.
7. Record anonymized timestamps, test status and HTTP/error code only.

## Two-device acceptance
- Create two disposable users A and B using supported sign-up; confirm both email addresses.
- Use two isolated browser profiles, A in PC and mobile. Complete HSK, ERP, Vietnamese, SRS; force offline changes then reconnect; verify values through owner-scoped authenticated data.
- Update separate fields simultaneously; update same SRS word simultaneously; ensure no lost attempts or duplicate EXP.
- Sign out/in, reload, clear cache; ensure A's data cannot appear under B.
- Test Chrome desktop, mobile 390px/320px and installed PWA. Do not label tests PASS if they used mock storage.
- **Do not merge PR #108** until all above have evidence. Existing cloud profile CAS does not yet guarantee lossless same-field counters; other sync paths require review.

## Findings and scope
- The current connected Supabase tools can inspect database/logs but do not expose Auth SMTP configuration, OAuth settings, or a test inbox; therefore email delivery and real browser acceptance cannot be completed using those tools alone.
- No schema/RLS or existing learner records should be changed to compensate for missing test credentials.
