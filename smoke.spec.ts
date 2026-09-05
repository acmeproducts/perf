import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

test('R4.29 boots, populates a 40-card sphere, and G19 guards are live', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>');
    const files = Array.from({ length: 40 }, (_, i) => ({ id: 's' + i, name: 's' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.imageFiles = files;
    state.currentFolder = { id: 'smoke', name: 'smoke' };
    state.providerType = 'test-provider';
    state.currentStack = 'in';
    state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 's0' });
    // G19 guards present and behaving
    const app = (window as any).App;
    const sanitized = state.dbManager?.sanitizeStoredMetadata
      ? state.dbManager.sanitizeStoredMetadata({ id: 'X', name: 'evil', stack: 'out', permanentThumbnailUrl: 'u' })
      : null;
    const repaired = app.repairDriveIdentityFields ? typeof app.repairDriveIdentityFields : null;
    return { sanitized, repaired };
  });
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.length > 0, undefined, { timeout: 10000 });
  expect(errors).toEqual([]);
  expect(out.repaired).toBe('function');
  expect(out.sanitized).toEqual({ stack: 'out' });
});
