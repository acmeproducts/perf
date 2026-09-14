# Turnover — Orbital8 UI, session ending 2026-09-13

## Current state
`main` is byte-identical to commit `3c8471d`. This is the owner-confirmed baseline: taps faithful, sphere not sparse. Everything built on top of it this session was rolled back.

## What's confirmed true right now (on 3c8471d)
- Table floating controls (image size / count) are inert — wrong CSS class, buttons exist but are `display:none`.
- Explore rebuilds fully instead of resuming when: (a) switching Sort↔Explore for the same stack/folder, and (b) leaving to select a folder then returning to the same one. These may be two different bugs, not one — (a) is root-caused (see below), (b) is not.
- Focus tapping a thumbnail shows a small image then swaps to a larger one — intentional progressive-load code, not a leftover.
- Focus forward/back stalls on rapid repeated clicks — plausible cause found (Focus shares a request queue with the sphere, added in R4.23/G17 for a different reason), not confirmed on-device.

## What was attempted and reverted this session
Full history: `UI-V2-MASTER-PLAN.md` §112 onward, and §123 specifically (RCA + manager review + red team review for the four items above — https://github.com/acmeproducts/perf/blob/main/UI-V2-MASTER-PLAN.md#123--four-confirmed-defects-on-the-true-baseline-3c8471d--rca-manager-review-red-team-review-2026-09-13). Every fix built this session passed its own isolated tests and the full Playwright suite before being pushed. Every one was still rejected or rolled back on real-device testing, more than once. That gap — lab-green not matching device reality — was never resolved. Do not trust a green test suite alone as sufficient before shipping to this owner.

Specific failures worth knowing before repeating them:
- A fix for the Explore tap-accuracy bug (zIndex tie-break in `cardAtPoint`) shipped, tested clean, then reported as "horrible regressions" on device — root cause of the device/lab gap was never found.
- A fix for Table's inert controls was correct and reusable in isolation, but got bundled with other changes twice and rolled back both times along with unrelated breakage that wasn't its fault.
- A warm-resume fix for Explore's rebuild-on-return (item above) was proven working once (commit `25c1825`), then lost in an emergency rollback, then restored, then rolled back again in the final rollback of this session — it is currently NOT live but the mechanism and fix are known and documented.
- A slot-concurrency change (16→24) made on-device performance measurably worse (longer stalls, "stuck at 191/210") despite passing every local test — the cause of that specific device-only regression was never found.
- A round of four combined fixes (items 1b, 2, 3, 4 above) passed a clean 4-run test suite and was pushed, then rejected by the owner as "everything is wrong" with no further detail on what specifically broke.

## What is proven and safe to reuse, if picked back up
- Table controls fix: swap `photo-table__controls`/`photo-table__controls-toggle` classes for `spatial-gallery__controls`/`spatial-gallery__button spatial-gallery__controls-toggle`. CSS-only, JS already wired. Built and tested at least twice this session (`a7c85e3`, and again in `1f53a76`).
- Explore warm-resume (item a, mode-switcher case only): give `SpatialGallery.close()` a `preserve` option matching the one `PhotoTable.close()` already has, and pass it from the mode-switcher call site. Proven with a counter-proof test in `25c1825` and again in `1f53a76`.
- Focus queue-bypass (item stalling on rapid clicks): `ensure()` in `SharedImageResources` gained a bounded queue in commit `152829d` (R4.23) to fix the sphere specifically; before that commit Focus was never queued. `1f53a76` gave Focus's own fetches a bypass. Never confirmed on-device.
- Small-then-large image removal: `1f53a76` removed the two-stage paint in `SharedImageResources.present()`. Never confirmed on-device.

None of the above is currently live. All are fully described, with exact commit hashes, in git history and in `UI-V2-MASTER-PLAN.md` §123 if someone wants to re-derive them without starting from zero.

## What was never solved
- Why fixes that pass every local/lab test keep failing or behaving differently on the owner's actual device. This is the real, unsolved problem underneath all four items above — not any single bug.
- Item 1a (folder round-trip rebuild) — root cause not found; confirmed it is NOT the same mechanism as the mode-switcher rebuild.
- Whether raising thumbnail-load concurrency is genuinely unsafe or whether that one on-device test was confounded by something else.

## Recommendation
Whoever picks this up needs actual device access, or a much tighter feedback loop with the owner mid-change than existed this session. Proposing fixes based on a local Playwright suite alone was not sufficient for this project, repeatedly, and that pattern needs to change before the four items above are attempted again — not the fixes themselves, most of which are already built and just need real verification.
