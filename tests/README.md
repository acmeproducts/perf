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

## Why there is a baseline

222 tests, 70 of which fail on a clean checkout. They split roughly into gates written
against features that never landed in `ui-v2.html` (a Sort-screen favourite heart,
`PhotoTable.restoreSettings`, `App.repairDriveIdentityFields`,
`DBManager.sanitizeStoredMetadata` — none of those identifiers appear in the file) and
real unfixed bugs.

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

One test is not fully tamed by that:
`focus-navigation.spec.ts › warm resume restarts exactly one moving Explorer loop`.
It is bistable across runs — sometimes it passes, sometimes it fails both attempts — so
it is currently baselined, and a run where it passes will report it as NEWLY PASSING.
If that noise gets annoying before someone fixes it, the honest move is to fix its
waits (it is one of the sleep-based specs) rather than to special-case it here.

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
