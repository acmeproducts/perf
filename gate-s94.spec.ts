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

test('§94 DEFAULT view: tiles are layout-safe (<=160px), not oversized', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.imageScale = 1; T.imageLimit = 24;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    // The default (100%) SET width must equal the p18 safe formula exactly — no regression.
    // (Rendered width adds constant CSS padding; we assert the style.width the code sets.)
    const setWidths = T.photos.map((p: any) => parseFloat(p.element.style.width));
    const expected = Math.max(62, Math.min(160, window.innerWidth * .145)); // p18 formula at scale 1
    return { max: Math.max(...setWidths), min: Math.min(...setWidths), expected };
  });
  expect(out.max).toBeCloseTo(out.expected, 0);   // default == p18 safe size (no blow-up)
  expect(out.min).toBeCloseTo(out.expected, 0);
});

test('§94 scale resizes within a safe range (100% == default; up and down both change size)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.imageScale = 1; T.imageLimit = 24;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const w100 = T.photos[0].element.getBoundingClientRect().width;
    T.adjustControl('scale', 40);
    await new Promise(r => setTimeout(r, 150));
    const wUp = T.photos[0].element.getBoundingClientRect().width;
    T.adjustControl('scale', -80);
    await new Promise(r => setTimeout(r, 150));
    const wDown = T.photos[0].element.getBoundingClientRect().width;
    return { w100, wUp, wDown };
  });
  expect(out.wUp).toBeGreaterThan(out.w100);
  expect(out.wDown).toBeLessThan(out.w100);
  expect(out.wUp).toBeLessThanOrEqual(out.w100 * 1.7);  // bounded, no blow-up
});

test('§94 count reaches the full stack (not capped at 50)', async ({ page }) => {
  await boot(page, 90);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.imageScale = 1; T.imageLimit = 24;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 40; i++) T.adjustControl('limit', 5);
    await new Promise(r => setTimeout(r, 150));
    return { limit: T.imageLimit, stackSize: (window as any).__orbitalAppState.stacks.in.length };
  });
  expect(out.limit).toBeGreaterThan(50);
  expect(out.limit).toBe(out.stackSize);
});

test('§94 no duplicates after repeated adjusts', async ({ page }) => {
  await boot(page, 90);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 8; i++) { T.adjustControl('limit', 5); T.adjustControl('scale', 10); }
    await new Promise(r => setTimeout(r, 150));
    const ids = T.photos.map((p: any) => String(p.fileId));
    return { total: ids.length, unique: new Set(ids).size };
  });
  expect(out.unique).toBe(out.total);
});
