import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page, n = 120) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable);
  await page.evaluate(count => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: count }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    try { localStorage.removeItem('orbital8:table-settings'); } catch (e) {}
  }, n);
};

test('§92 image size % actually resizes the thumbnails', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.imageScale = 1; T.imageLimit = 24;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const w1 = T.photos[0].element.getBoundingClientRect().width;
    T.adjustControl('scale', 50); // +50%
    await new Promise(r => setTimeout(r, 200));
    const w2 = T.photos[0].element.getBoundingClientRect().width;
    T.adjustControl('scale', -80); // back down well below
    await new Promise(r => setTimeout(r, 200));
    const w3 = T.photos[0].element.getBoundingClientRect().width;
    return { w1, w2, w3 };
  });
  expect(out.w2).toBeGreaterThan(out.w1);  // larger % => larger tiles
  expect(out.w3).toBeLessThan(out.w1);     // smaller % => smaller tiles
});

test('§92 image count is not capped at 50 — it reaches the full stack', async ({ page }) => {
  await boot(page, 120);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.imageScale = 1; T.imageLimit = 24;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 30; i++) T.adjustControl('limit', 5); // push way past 50
    await new Promise(r => setTimeout(r, 200));
    return { limit: T.imageLimit, photoCount: T.photos.length, stackSize: (window as any).__orbitalAppState.stacks.in.length };
  });
  expect(out.limit).toBeGreaterThan(50);
  expect(out.limit).toBe(out.stackSize);
});

test('§92 no duplicate thumbnails after scale/count changes', async ({ page }) => {
  await boot(page, 120);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 8; i++) { T.adjustControl('limit', 5); T.adjustControl('scale', 10); }
    await new Promise(r => setTimeout(r, 200));
    const ids = T.photos.map((p: any) => String(p.fileId));
    return { total: ids.length, unique: new Set(ids).size };
  });
  expect(out.unique).toBe(out.total);
});
