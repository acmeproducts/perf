import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const uiUrl = `file://${path.resolve(path.dirname(__filename), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).App && !!(window as any).__orbitalAppState.dbManager !== undefined);
};

test.describe('File identity integrity (R4.26 / G19)', () => {
  test('a poisoned metadata row (another file\'s full snapshot) cannot rewrite a file\'s identity or URLs', async ({ page }) => {
    await boot(page);
    const out = await page.evaluate(async () => {
      const state = (window as any).__orbitalAppState;
      state.providerType = 'googledrive';
      state.currentFolder = { id: 'poison-test', name: 'poison-test' };
      const fileA = { id: 'AAA111', name: 'quilt.png', mimeType: 'image/jpeg',
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=AAA111&sz=w1000',
        thumbnailLink: 'https://lh3.googleusercontent.com/quilt=s220', downloadUrl: 'https://drive.google.com/uc?export=view&id=AAA111' };
      const snapshotOfB = { id: 'BBB222', name: 'brave-shot.png', stack: 'out', notes: 'from B', stackSequence: 77, favorite: true,
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=BBB222&sz=w1000',
        thumbnailLink: 'https://lh3.googleusercontent.com/brave=s220', downloadUrl: 'https://drive.google.com/uc?export=view&id=BBB222',
        metadataStatus: 'loaded', tags: [], qualityRating: 0, contentRating: 0, extractedMetadata: {} };
      // Legacy poisoned row: a full snapshot of file B stored under file A's key.
      const realDbManager = state.dbManager;
      state.dbManager = {
        sanitizeStoredMetadata: realDbManager
          ? realDbManager.sanitizeStoredMetadata.bind(realDbManager)
          : (m: any) => m,
        async getManyMetadata() { return new Map([['AAA111', snapshotOfB]]); },
        async getMetadata() { return snapshotOfB; },
        async saveMetadata() {}, scheduleMetadataSave() { return Promise.resolve(); }, scheduleFolderCacheSave() { return Promise.resolve(); }
      };
      await (window as any).App.processAllMetadata([fileA], false, {});
      return {
        id: fileA.id, name: fileA.name,
        thumbUrl: fileA.permanentThumbnailUrl, tLink: fileA.thumbnailLink, downloadUrl: fileA.downloadUrl,
        stack: (fileA as any).stack, notes: (fileA as any).notes, favorite: (fileA as any).favorite
      };
    });
    // User metadata flows through; identity and URLs must not.
    expect(out.id).toBe('AAA111');
    expect(out.name).toBe('quilt.png');
    expect(out.thumbUrl).toContain('AAA111');
    expect(out.tLink).toContain('quilt');
    expect(out.downloadUrl).toContain('AAA111');
    expect(out.stack).toBe('out');
    expect(out.notes).toBe('from B');
    expect(out.favorite).toBe(true);
  });

  test('repairDriveIdentityFields rebuilds crossed URL fields from the file\'s own id', async ({ page }) => {
    await boot(page);
    const out = await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      state.providerType = 'googledrive';
      state.currentFolder = { id: 'repair-test', name: 'repair-test' };
      const crossed = { id: 'AAA111', name: 'brave-shot.png', targetFileId: 'BBB222',
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=BBB222&sz=w1000',
        permanentThumbnailUrlSmall: 'https://drive.google.com/thumbnail?id=BBB222&sz=w800',
        downloadUrl: 'https://drive.google.com/uc?export=view&id=BBB222',
        thumbnailLink: 'https://drive.google.com/thumbnail?id=BBB222&sz=s220' };
      const shortcut = { id: 'SC1', isShortcut: true, shortcutDetails: { targetId: 'TGT9' },
        targetFileId: 'WRONG', permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=WRONG&sz=w1000' };
      const clean = { id: 'CCC333', targetFileId: 'CCC333',
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=CCC333&sz=w1000',
        permanentThumbnailUrlSmall: 'https://drive.google.com/thumbnail?id=CCC333&sz=w800' };
      const repaired = (window as any).App.repairDriveIdentityFields([crossed, shortcut, clean]);
      return { repaired, crossed, shortcut, cleanThumb: clean.permanentThumbnailUrl };
    });
    expect(out.repaired).toBe(2);
    expect(out.crossed.targetFileId).toBe('AAA111');
    expect(out.crossed.permanentThumbnailUrl).toContain('id=AAA111');
    expect(out.crossed.permanentThumbnailUrlSmall).toContain('id=AAA111');
    expect(out.crossed.downloadUrl).toContain('AAA111');
    expect(out.crossed.thumbnailLink).toBeNull();
    expect(out.shortcut.targetFileId).toBe('TGT9');
    expect(out.shortcut.permanentThumbnailUrl).toContain('id=TGT9');
    expect(out.cleanThumb).toContain('id=CCC333');
  });

  test('cloud merge takes identity from cloud and only user metadata from cache', async ({ page }) => {
    await boot(page);
    const out = await page.evaluate(() => {
      const cachedCrossed = { id: 'AAA111', name: 'brave-shot.png', stack: 'priority', notes: 'keep me', favorite: true,
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=BBB222&sz=w1000' };
      const cloudClean = { id: 'AAA111', name: 'quilt.png',
        permanentThumbnailUrl: 'https://drive.google.com/thumbnail?id=AAA111&sz=w1000' };
      const { mergedFiles } = (window as any).App.mergeCloudWithCache([cloudClean], [cachedCrossed]);
      return mergedFiles[0];
    });
    expect(out.name).toBe('quilt.png');
    expect(out.permanentThumbnailUrl).toContain('id=AAA111');
    expect(out.stack).toBe('priority');
    expect(out.notes).toBe('keep me');
    expect(out.favorite).toBe(true);
  });
});
