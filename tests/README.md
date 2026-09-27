# Running the ui-v2 gate suite

```bash
npm install
npm run test:regressions     # run everything, then report movement against the baseline
```

`test:regressions` is the command to use day to day. It exits 0 when the failure set
has not moved, and non-zero when it has.

| script | what it does |
| --- | --- |
| `npm run test:e2e` | plain `playwright test`; exits non-zero because of the standing failures |
| `npm run test:regressions` | run, then compare against `tests/known-failures.json` |
| `npm run test:baseline` | run, then **re-record** the baseline from this run |
| `npm run test:isolation` | just the harness guard (fast, ~4s) |

## What this config covers, and what it does not

The root config discovers the root-level gate specs (`gate-*.spec.ts`,
`determinism.spec.ts`, `canonical-order-tap.spec.ts`, …) and everything under `tests/`.

It deliberately excludes two suites that have their own configs and their own
prerequisites — both need the image server, and running them from here would hang
without it and fill the baseline with environment noise:

```bash
node bench/server.mjs                         # VARIANTS_DIR=. — see bench/README.md
npx playwright test -c e2e/pw.config.ts        # acceptance: Pixel 7 + desktop, 500 images
npx playwright test -c bench/pw.config.ts      # benchmark, not a pass/fail gate
```

`e2e/` is the suite `CLAUDE.md` names, and it maps to `UI-V2-OWNER-ACCEPTANCE.md`. It is
the one that answers "does this work on a device"; the root gates answer "did this
specific past bug come back". Both matter and neither substitutes for the other.

`e2e/pw.config.ts` now shares the root config's Chromium resolver instead of
hard-coding `/opt/pw-browsers/chromium-1194/...`.

## Why there is a baseline

227 tests, 118 of which fail on a clean checkout. They split roughly into gates written
against features that never landed in `ui-v2.html` (a Sort-screen favourite heart,
`PhotoTable.restoreSettings`, `App.repairDriveIdentityFields`,
`DBManager.sanitizeStoredMetadata` — none of those identifiers appear in the file) and
real unfixed bugs. A large part of the second group is not stale at all: items 3 and 13
of `UI-V2-OWNER-ACCEPTANCE.md` ("no rebuild on return", "size and count controls work,
no cap") are exactly what `gate-s87`, `gate-s88`, `gate-s90`, `gate-s92` and `gate-s94`
assert. Pruning those would be deleting the acceptance criteria.

That means a raw `playwright test` always exits non-zero, so it cannot tell you whether
*your* change broke something. `tests/known-failures.json` records the standing set, and
`scripts/check-regressions.mjs` reports only the delta:

- **NEW FAILURES** — was passing, now fails. Your change. Fix it.
- **NEWLY PASSING** — a baselined failure now passes. Good; re-record so it stays
  protected. The check fails on this deliberately, otherwise the baseline rots into a
  list that hides future regressions.
- **Flaky** — failed then passed on retry. Reported, counted as neither.

Shrinking `knownFailures` is the goal. It is a ratchet, not a permission slip.

`retries: 1` is on everywhere, not just CI, because that classification is what makes
the gate usable. With retries off, a flake is indistinguishable from a real break and
gets baked into the baseline.

### Quarantine

Retries catch a test that fails once and passes on the retry. They do not catch a test
that fails *both* attempts on one run and passes both on the next — and this suite has
some, because the fixed-duration sleeps mean a slower machine changes the outcome
rather than just the timing. Those tests flip the gate in both directions, NEW FAILURE
one run and NEWLY PASSING the next, with nobody's change involved.

The `quarantine` list in `known-failures.json` holds them. They are printed on every
run with their current result, and counted as neither. Two are in there today:

- `churn-repro.spec.ts › card pixels always belong to the card fileId through churn`
- `focus-navigation.spec.ts › Explorer Focus identity regressions › warm resume restarts exactly one moving Explorer loop`

Quarantine is a to-fix list, not a hiding place. The fix is to replace those specs'
sleeps with condition waits, then delete the entry. `npm run test:baseline` carries the
list forward rather than dropping it, so re-recording will not silently un-quarantine
anything.

Test ids in the baseline are `<file>::<describe › … › title>`, matching what the line
reporter prints — so a name can be copied straight from terminal output into
`quarantine`. The checker refuses to run if two tests share an id, since a collision
would silently shrink the failure set and hide a regression.

## Isolation

Every browser spec loads `ui-v2.html` over `file://`, and the app writes localStorage
(view context, last folder, Explore/Table control settings, OAuth credentials) and an
IndexedDB database. One origin, shared by all 222 tests.

Playwright gives each test a fresh `BrowserContext`, so that storage does not leak
today — `tests/isolation-guard.spec.ts` proves it by writing a canary in one test and
failing if the next can read it. Nothing enforced that before, though: a config that
set `storageState`, reused a context, or moved to `launchPersistentContext` would have
silently made these gates order-dependent, and a gate passing because an earlier spec
left a favourable `explore_settings` behind is close to invisible in a report.

Two layers now:

1. **`tests/isolation-guard.spec.ts`** runs with the suite and covers every spec,
   migrated or not. If isolation breaks at the config level, it fails.
2. **`tests/support/isolation.ts`** exports a hardened `test` that snapshots storage at
   document-start — before `initApp()` can dirty it — fails the test if the context
   started dirty, and wipes the origin afterwards.

New specs should import from the hardened fixture:

```ts
import { expect, test } from './support/isolation';   // from tests/
import { expect, test } from './tests/support/isolation';  // from the repo root
```

Existing specs were left importing `@playwright/test` directly. Migrating them is
mechanical but touches 33 files, and doing it in the same change as the harness fix
would make a regression in either hard to attribute.

## Browser resolution

`playwright.config.ts` finds Chromium in this order:

1. `CHROMIUM_PATH` if set
2. whatever revision is actually installed under `PLAYWRIGHT_BROWSERS_PATH`, preferring
   the full browser over `headless_shell` (the sphere gates read real compositor
   geometry)
3. Playwright's own lookup

The previous `playwright.local.config.ts` hard-coded `/tmp/chromium`, which exists on no
machine in the repo's history — the suite could not be run from the checked-in config at
all. That file now just re-exports the root config.

## Known fragility

197 fixed-duration waits (`setTimeout(r, 300)`, `waitForTimeout`) against 85 condition
waits (`waitForFunction`). The fixed sleeps are the remaining flake source — one test
(`focus-navigation.spec.ts › warm resume restarts exactly one moving Explorer loop`)
differed between two otherwise identical full runs. Converting sleeps to condition waits
is the next hygiene step; the baseline makes it safe to do incrementally, because any
conversion that changes a result shows up as movement.
