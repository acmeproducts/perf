import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery && !!(window as any).PhotoTable && !!(window as any).Gestures && !!(window as any).CanonicalInspection);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 16 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};
const surfaces = (page: any) => page.evaluate(() => {
  const s = (window as any).__orbitalAppState;
  const cls = (id: string) => { const e = document.getElementById(id); return e ? !e.classList.contains('hidden') && !e.hidden : false; };
  return {
    focus: s.isFocusMode === true,
    sphere: !(window as any).SpatialGallery.elements.root.hidden,
    table: !(window as any).PhotoTable.elements.root.hidden,
    gridOpen: cls('grid-modal'),
    detailsOpen: document.getElementById('details-modal')?.classList.contains('hidden') === false,
    inspection: s.inspection?.surface || null,
    currentStack: s.currentStack
  };
});

test('EXIT globe->Focus, press the REAL X once => returns to globe (not grid/detail)', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('p5', g.cards.find((c: any) => String(c.fileId) === 'p5').element);
    await new Promise(r => setTimeout(r, 200));
  });
  const inFocus = await surfaces(page);
  expect(inFocus.focus).toBe(true);
  // Press the REAL X button via real pointer events.
  const box = await page.evaluate(() => { const b = document.getElementById('focus-origin-close')!; const r = b.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await surfaces(page);
  expect(after.focus).toBe(false);
  expect(after.gridOpen).toBe(false);
  expect(after.detailsOpen).toBe(false);
  expect(after.sphere).toBe(true);   // returned to the globe
});

test('EXIT table->Focus, press the REAL X once => returns to table (not grid/detail)', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p5')); await new Promise(r => setTimeout(r, 200));
  });
  expect((await surfaces(page)).focus).toBe(true);
  const box = await page.evaluate(() => { const b = document.getElementById('focus-origin-close')!; const r = b.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await surfaces(page);
  expect(after.focus).toBe(false);
  expect(after.gridOpen).toBe(false);
  expect(after.detailsOpen).toBe(false);
  expect(after.table).toBe(true);   // returned to the table
});
