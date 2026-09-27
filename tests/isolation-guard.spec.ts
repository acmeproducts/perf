/**
 * Guards the test harness itself.
 *
 * The ui-v2 gate suite is ~220 tests that all load the same file:// origin and all
 * let the app write localStorage and IndexedDB. If contexts were ever shared, gates
 * would start passing or failing based on what ran before them -- and a gate that
 * passes for the wrong reason is worse than one that fails.
 *
 * These canaries fail loudly if that ever becomes true, for every spec in the repo,
 * whether or not it imports the hardened `test` from ./support/isolation.
 *
 * Ordering note: Playwright runs tests within a file in declaration order, so the
 * writer runs before the readers. The readers do not depend on the writer having run
 * (a fresh context is correct either way) -- they only fail if it leaked.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from './support/isolation';

const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ui-v2.html')}`;

const CANARY = 'orbital8-isolation-canary';

test('writes a storage canary into the shared file:// origin', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as unknown as Record<string, unknown>).__orbitalAppState);

  await page.evaluate(canary => {
    localStorage.setItem(canary, 'leaked');
    sessionStorage.setItem(canary, 'leaked');
  }, CANARY);

  // Also leave a row in the app's own database, which is the store that actually
  // carries a user's sorting work and folder caches.
  const wrote = await page.evaluate(async canary => new Promise<boolean>(resolve => {
    const request = indexedDB.open('Orbital8-UI', 8);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('folderListCache')) { db.close(); resolve(false); return; }
      const tx = db.transaction('folderListCache', 'readwrite');
      tx.objectStore('folderListCache').put({ cacheKey: canary, folders: [], updatedAt: Date.now() });
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); resolve(false); };
    };
    request.onerror = () => resolve(false);
  }), CANARY);

  expect(wrote, 'expected to be able to write the app database, otherwise the next assertions prove nothing').toBe(true);
});

test('a later test cannot see the previous test localStorage or sessionStorage', async ({ page }) => {
  await page.goto(uiUrl);

  const seen = await page.evaluate(canary => ({
    local: localStorage.getItem(canary),
    session: sessionStorage.getItem(canary)
  }), CANARY);

  expect(seen.local, 'localStorage leaked across tests: the gate suite is order-dependent').toBeNull();
  expect(seen.session, 'sessionStorage leaked across tests: the gate suite is order-dependent').toBeNull();
});

test('a later test cannot see the previous test IndexedDB rows', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as unknown as Record<string, any>).__orbitalAppState?.dbManager?.db);

  const row = await page.evaluate(async canary => new Promise<unknown>(resolve => {
    const request = indexedDB.open('Orbital8-UI', 8);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('folderListCache')) { db.close(); resolve(null); return; }
      const get = db.transaction('folderListCache', 'readonly').objectStore('folderListCache').get(canary);
      get.onsuccess = () => { db.close(); resolve(get.result ?? null); };
      get.onerror = () => { db.close(); resolve(null); };
    };
    request.onerror = () => resolve(null);
  }), CANARY);

  expect(row, 'IndexedDB leaked across tests: cached folders and stack assignments would bleed between gates').toBeNull();
});

test('each test starts on a context with no databases carried over', async ({ page }) => {
  // Checked before the app boots: initApp() opens Orbital8-UI on DOMContentLoaded,
  // so after boot the database always exists and the check would be vacuous.
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__dbNamesAtStart = typeof indexedDB?.databases === 'function'
      ? indexedDB.databases().then(dbs => dbs.map(db => db.name || ''))
      : Promise.resolve([]);
  });
  await page.goto(uiUrl);

  const names = await page.evaluate(() => (window as unknown as Record<string, any>).__dbNamesAtStart);
  expect(names, 'a database survived into a new test context').toEqual([]);
});
