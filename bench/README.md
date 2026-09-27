# Core benchmark (Sort / Focus / Grid)

Runs any build against 500 generated PNGs (with prompt metadata) served locally with realistic delays,
Pixel 7 emulation and 4x CPU slowdown, background metadata extraction running.

    mkdir -p bench/variants && cp ui-v2.html bench/variants/v2.html
    node bench/server.mjs &
    V=v2.html npx playwright test -c bench/pw.config.ts        # META=0 disables metadata, PERF=1 prints the recorder report

Finding (2026-09-24): in this lab ui.html and ui-v2.html are equally fast (Focus next/back ~0-1ms, no freezes),
so the device slowness is not reproduced here — see plan §130 and use the on-device recorder (?perf=1).
