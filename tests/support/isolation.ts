/**
 * Test isolation for the ui-v2 gate suite.
 *
 * Why this exists
 * ---------------
 * Every browser spec loads ui-v2.html over file://, and the app writes to
 * localStorage (view context, last folder, Explore/Table control settings, OAuth
 * credentials) and to an IndexedDB database named by APP_IDENTITY.dbName. All of
 * that is per-origin, and all the specs share one origin.
 *
 * Playwright already gives each test a fresh BrowserContext, so today that storage
 * does not actually leak between tests -- verified by writing a canary in one test
 * and failing to read it in the next. But nothing in the repo *enforced* that. The
 * isolation was incidental: a config that reused a context, set `storageState`, or
 * switched to `launchPersistentContext` would have silently turned these gates into
 * order-dependent tests, and the failure mode (a gate passing only because an
 * earlier spec left a favourable `explore_settings` behind) is close to impossible
 * to spot by reading a report.
 *
 * So: assert it instead of assuming it.
 *
 * `test` exported here behaves exactly like Playwright's, plus:
 *   - it snapshots storage at document-start, before any app script runs, so a dirty
 *     context is caught on the *first* navigation rather than after the app has
 *     written its own keys;
 *   - it fails the test if the context did not start clean;
 *   - it wipes localStorage, sessionStorage and every IndexedDB database afterwards,
 *     so the guarantee holds even under a persistent context.
 *
 * Usage: replace
 *     import { expect, test } from '@playwright/test';
 * with
 *     import { expect, test } from './tests/support/isolation';   // adjust the path
 *
 * Specs that have not been migrated still work; they just rely on Playwright's
 * default isolation without checking it. tests/isolation-guard.spec.ts covers the
 * harness itself so a config change cannot quietly break isolation for them either.
 */
import { test as base, expect, type Page } from '@playwright/test';

export type PreAppStorage = {
  local: string[];
  session: string[];
  databases: string[];
};

const SNAPSHOT_KEY = '__preAppStorageSnapshot';

/**
 * Record what storage looked like before the page's own scripts ran.
 *
 * This has to be an init script: ui-v2.html calls initApp() on DOMContentLoaded,
 * which reads and writes localStorage and opens IndexedDB immediately, so by the
 * time a test could evaluate anything the app has already dirtied the origin and a
 * pre-existing key is indistinguishable from one the app just wrote.
 *
 * indexedDB.databases() is async and init scripts cannot await, so the database
 * list is attached as a promise and resolved during assertion.
 */
const installSnapshot = (page: Page) =>
  page.addInitScript(key => {
    const w = window as unknown as Record<string, unknown>;
    // Only the first navigation matters; a test that navigates again should not
    // clobber the pre-app snapshot with state the app itself wrote.
    if (w[key]) return;
    const safeKeys = (store: Storage | undefined) => {
      try {
        return store ? Object.keys(store) : [];
      } catch {
        // Storage access throws in some partitioned/blocked configurations. An
        // unreadable store cannot be dirty in a way that affects the app either.
        return [];
      }
    };
    w[key] = {
      local: safeKeys(window.localStorage),
      session: safeKeys(window.sessionStorage),
      databases: typeof indexedDB?.databases === 'function'
        ? indexedDB.databases().then(dbs => dbs.map(db => db.name || '')).catch(() => [])
        : Promise.resolve([])
    };
  }, SNAPSHOT_KEY);

const readSnapshot = async (page: Page): Promise<PreAppStorage | null> =>
  page.evaluate(async key => {
    const snapshot = (window as unknown as Record<string, any>)[key];
    if (!snapshot) return null;
    return {
      local: snapshot.local as string[],
      session: snapshot.session as string[],
      databases: (await snapshot.databases) as string[]
    };
  }, SNAPSHOT_KEY).catch(() => null);

/** Wipe every per-origin store the app uses. Safe to call on an about:blank page. */
export const wipeOrigin = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    try { window.localStorage.clear(); } catch { /* unreadable store: nothing to clear */ }
    try { window.sessionStorage.clear(); } catch { /* same */ }
    if (typeof indexedDB?.databases !== 'function') return;
    const dbs = await indexedDB.databases().catch(() => []);
    await Promise.all(dbs.map(db => db.name
      ? new Promise<void>(resolve => {
          const request = indexedDB.deleteDatabase(db.name!);
          // A delete blocked by a still-open connection must not hang the teardown.
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        })
      : Promise.resolve()));
  }).catch(() => {
    // The page may already be closed or on a non-storage URL. Teardown is
    // best-effort; the discarded context is the real guarantee.
  });
};

export const test = base.extend<{ isolatedOrigin: void }>({
  isolatedOrigin: [
    async ({ page }, use, testInfo) => {
      await installSnapshot(page);

      await use();

      const snapshot = await readSnapshot(page);
      await wipeOrigin(page);

      // A spec that never navigates (pure unit tests importing helpers) has no
      // snapshot and nothing to assert.
      if (!snapshot) return;

      // Only report dirt on a test that would otherwise have passed. Attributing a
      // genuine assertion failure to isolation would send the reader down the wrong
      // path entirely.
      if (testInfo.status !== 'passed') return;

      const dirty = [
        ...snapshot.local.map(key => `localStorage[${key}]`),
        ...snapshot.session.map(key => `sessionStorage[${key}]`),
        ...snapshot.databases.filter(Boolean).map(name => `indexedDB(${name})`)
      ];

      expect(
        dirty,
        `This test started with state left over from an earlier test, so its result is not trustworthy. ` +
        `Leaked: ${dirty.join(', ')}. Check that the Playwright config is not reusing a browser context ` +
        `(storageState, launchPersistentContext, or a hand-rolled browser.newPage()).`
      ).toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };
