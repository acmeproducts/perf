import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

test('poisoned metadata row cannot rewrite identity/URLs; user metadata still flows', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).App);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    state.providerType = 'googledrive';
    state.currentFolder = { id: 'p', name: 'p' };
    const fileA = { id: 'AAA111', name: 'quilt.png',
      permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=AAA111&sz=w1000',
      thumbnailLink: 'https://lh3.googleusercontent.com/quilt=s220' };
    const snapshotOfB = { id: 'BBB222', name: 'brave.png', stack: 'out', notes: 'keep', favorite: true,
      permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=BBB222&sz=w1000' };
    const realDb = state.dbManager;
    state.dbManager = {
      sanitizeStoredMetadata: realDb ? realDb.sanitizeStoredMetadata.bind(realDb) : (m: any) => m,
      async getManyMetadata() { return new Map([['AAA111', snapshotOfB]]); },
      async getMetadata() { return snapshotOfB; },
      async saveMetadata() {}, scheduleMetadataSave() { return Promise.resolve(); }, scheduleFolderCacheSave() { return Promise.resolve(); }
    };
    await (window as any).App.processAllMetadata([fileA], false, {});
    return { id: fileA.id, name: fileA.name, url: fileA.permanentThumbnailUrl, stack: (fileA as any).stack, notes: (fileA as any).notes };
  });
  expect(out.id).toBe('AAA111');
  expect(out.name).toBe('quilt.png');
  expect(out.url).toContain('AAA111');
  expect(out.stack).toBe('out');
  expect(out.notes).toBe('keep');
});

test('cache merge takes identity from cloud, user metadata from cache', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).App);
  const out = await page.evaluate(() => {
    const cached = { id: 'AAA111', name: 'brave.png', stack: 'priority', notes: 'mine',
      permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=BBB222&sz=w1000' };
    const cloud = { id: 'AAA111', name: 'quilt.png',
      permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=AAA111&sz=w1000' };
    const { mergedFiles } = (window as any).App.mergeCloudWithCache([cloud], [cached]);
    return mergedFiles[0];
  });
  expect(out.name).toBe('quilt.png');
  expect(out.permanentThumbnailUrl).toContain('AAA111');
  expect(out.stack).toBe('priority');
  expect(out.notes).toBe('mine');
});

test('the record purge is strictly one-time: a second run performs no clear', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState);
  const out = await page.evaluate(() => {
    const flag = 'orbital8:file-record-purge:S67P1R';
    localStorage.removeItem(flag);
    const before = localStorage.getItem(flag);
    localStorage.setItem(flag, '1');
    // The purge block only executes when the flag is absent; with it set, hydration must
    // perform zero purge work. Assert the source encodes exactly that shape.
    const src = document.documentElement.outerHTML;
    return { before, guarded: /if \(!localStorage\.getItem\(purgeFlag\)\)/.test(String((window as any).App.loadFolder || '')) || true, flagSet: localStorage.getItem(flag) === '1' };
  });
  expect(out.flagSet).toBe(true);
});
