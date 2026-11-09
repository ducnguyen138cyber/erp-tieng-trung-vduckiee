# P1 – Public VDuckie load audit (2026-11-09)

Source: [P1 Public Load Lab run #42584564022](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/42584564022), run by GitHub Actions on public production `https://vduckie.pages.dev/`.

## Cold navigation observed

| Profile | Time until app's home dashboard truly initialized/visible | Resources | Reported transfer | CLS |
|---|---:|---:|---:|---:|
| Desktop Chromium baseline | **2,477 ms** | 196 | ~2.01 MB | 0.002 |
| Chromium mobile 390×844, CPU 4× slower, 1.6 Mbps / 160 ms RTT | **13,068 ms** | 196 | ~2.00 MB | 1.768 |

The mobile run's first-contentful-paint was ~424 ms, but that included the “Đang mở VDuckie…” bootstrap placeholder. **It is not app readiness or useful content.** Previous measurement script falsely ended as soon as `#homeHub` existed and reported 945 ms with a placeholder screenshot; that run was discarded. The revised test waits for `__VDUCKIE_EXPERIENCE_V86_READY__` plus a visible painted dashboard before recording readiness.

## Findings and priority

1. Significant **perceived startup delay** in the emulated low-end mobile profile (~13.1s). Diagnose startup JavaScript/dependency ordering and defer nonessential modules until the learning surface is interactive.
2. **Very high observed CLS** on the emulated mobile profile. Investigate changes between bootstrap placeholder, app shell injection, sidebar/header and late widgets. Do not remove functional UI merely to force the metric down.
3. Roughly 196 resource entries and 2 MB reported transfer in this single cold run. Sizes are browser-reported, may omit cross-origin byte counts and are not an audited network waterfall.

## Scope limitations

These are **one-off lab measurements**, not physical-device benchmarks or representative percentiles. Requests originated from a GitHub runner, with Chromium CPU/network throttling, not a Vietnamese carrier network. No actual user login, Supabase production session, protected data, or browser PWA warm-cache path was measured. FCP/LCP here primarily reflect the boot placeholder rather than useful HSK content.

**Follow-up needed:** optimize the measured slow/mobile path on a separate PR with a before/after comparison using the same harness. Do not claim the prior performance PR improved production until that is demonstrated.
