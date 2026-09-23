import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, devices } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), process.env.UI_FILE || 'ui-v2.html')}`;
test.use({ ...devices['Pixel 7'] });
test('Android trailing click (detail 0) after a touch tap cannot re-activate a rebound card', async ({ page }) => {
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
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' });
  });
  await page.waitForTimeout(1500);
  // Find the frontmost card with painted pixels near the viewport centre and tap it with a real touch.
  const target = await page.evaluate(() => {
    const g = (window as any).SpatialGallery;
    (window as any).__acts = [];
    const orig = g.activateFileId.bind(g);
    g.activateFileId = (id: any, el: any) => { (window as any).__acts.push(String(id)); return orig(id, el); };
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const hit = g.cardAtPoint(cx, cy);
    return hit ? { id: String(hit.element.dataset.fileId), x: cx, y: cy } : null;
  });
  expect(target).not.toBeNull();
  await page.touchscreen.tap(target!.x, target!.y);
  await page.waitForTimeout(60);
  // Android echo: the pooled element is rebound to a neighbour, then a detail:0 click arrives.
  const after = await page.evaluate((id) => {
    const g = (window as any).SpatialGallery;
    const card = g.cards.find((c: any) => String(c.element.dataset.fileId) === id)?.element
      || [...document.querySelectorAll<HTMLElement>('.spatial-gallery__card')].find(e => e.dataset.fileId === id)!;
    card.dataset.fileId = id === 'p1' ? 'p2' : 'p1';
    card.dataset.moved = 'false';
    card.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    return (window as any).__acts;
  }, target!.id);
  expect(after).toEqual([target!.id]);
});
