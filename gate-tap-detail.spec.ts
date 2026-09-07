import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 16 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};
test('a real tap (detail=1) on a sphere card activates that exact card', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' });
    await new Promise(r => setTimeout(r, 300));
    const card = g.cards.find((c: any) => String(c.fileId) === 'p6');
    card.element.dataset.moved = 'false';
    // A genuine click: detail === 1 (finger tap / mouse).
    card.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await new Promise(r => setTimeout(r, 250));
    return { opened: String((window as any).__orbitalAppState.inspection?.fileId || '') };
  });
  expect(r.opened).toBe('p6');
});
test('a moved drag (moved=true) does NOT activate', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' });
    await new Promise(r => setTimeout(r, 300));
    const before = String((window as any).__orbitalAppState.inspection?.fileId || '');
    const card = g.cards.find((c: any) => String(c.fileId) === 'p6');
    card.element.dataset.moved = 'true';
    card.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await new Promise(r => setTimeout(r, 200));
    return { before, after: String((window as any).__orbitalAppState.inspection?.fileId || '') };
  });
  expect(r.after).toBe(r.before);  // drag did not open anything new
});
