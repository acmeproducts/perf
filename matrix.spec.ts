import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).SpatialGallery && !!(window as any).Gestures && !!(window as any).Grid && !!(window as any).CanonicalInspection);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 20 }, (_, i) => mk('p' + i, i, 'priority')).concat(Array.from({ length: 10 }, (_, i) => mk('s' + i, i + 40, 'in')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};
const sleep = (p: any, ms: number) => p.waitForTimeout(ms);

test('M1 table tap opens and stays on the tapped image', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, T = (window as any).PhotoTable;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p8'));
    await new Promise(r => setTimeout(r, 200));
    return String(s.inspection?.fileId || '');
  });
  expect(r).toBe('p8');
});

test('M2 genuine Focus tap navigates', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, T = (window as any).PhotoTable, G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p8')); await new Promise(r => setTimeout(r, 200));
    let n = 0; const on = G.nextImage.bind(G); G.nextImage = () => { n++; return on(); };
    G.handleTap(700, 400); await new Promise(r => setTimeout(r, 150));
    return n;
  });
  expect(r).toBe(1);
});

test('M3 Focus swipe navigates', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, T = (window as any).PhotoTable, G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p8')); await new Promise(r => setTimeout(r, 200));
    const order = s.stacks.priority.map((f: any) => String(f.id));
    await G.nextImage(); await new Promise(r => setTimeout(r, 150));
    return { cur: String(s.currentFileId), exp: order[(order.indexOf('p8') + 1) % order.length] };
  });
  expect(r.cur).toBe(r.exp);
});

test('M4 globe tap enters Focus and stays (no grid jump)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('p5', g.cards.find((c: any) => String(c.fileId) === 'p5').element);
    await new Promise(r => setTimeout(r, 200));
    return { id: String(s.inspection?.fileId || ''), surface: s.inspection?.surface };
  });
  expect(r.id).toBe('p5'); expect(r.surface).toBe('focus');
});

test('M5 globe -> Focus -> exit returns to the GLOBE (not grid/Details)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('p5', g.cards.find((c: any) => String(c.fileId) === 'p5').element);
    await new Promise(r => setTimeout(r, 200));
    (window as any).CanonicalInspection.exit(); await new Promise(r => setTimeout(r, 250));
    return { sphere: !g.elements.root.hidden, focus: s.isFocusMode, detailsOpen: document.getElementById('details-modal')?.classList.contains('hidden') === false };
  });
  expect(r.sphere).toBe(true); expect(r.focus).toBe(false); expect(r.detailsOpen).toBe(false);
});

test('M6 table -> Focus -> exit returns to table/sort (not Details)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, T = (window as any).PhotoTable;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p8')); await new Promise(r => setTimeout(r, 200));
    (window as any).CanonicalInspection.exit(); await new Promise(r => setTimeout(r, 250));
    return { detailsOpen: document.getElementById('details-modal')?.classList.contains('hidden') === false, focus: s.isFocusMode };
  });
  expect(r.detailsOpen).toBe(false); expect(r.focus).toBe(false);
});

test('M7 grid open -> close -> Sort on grid stack top (not Details/Focus)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState;
    (window as any).Grid.open('priority', { origin: { surface: 'sort', stackName: 'priority', fileId: 'p0', gridStack: 'priority' } });
    await new Promise(r => setTimeout(r, 200)); s.grid.isDirty = false;
    await (window as any).Grid.close(); await new Promise(r => setTimeout(r, 250));
    return { stack: s.currentStack, focus: s.isFocusMode, detailsOpen: document.getElementById('details-modal')?.classList.contains('hidden') === false, top: String(s.stacks.priority[0]?.id || ''), cur: String(s.currentFileId || '') };
  });
  expect(r.focus).toBe(false); expect(r.detailsOpen).toBe(false); expect(r.stack).toBe('priority'); expect(r.cur).toBe(r.top);
});

test('M8 sort -> Focus -> exit returns to Sort', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('p3', 'priority', { allowCrossStack: false });
    (window as any).CanonicalInspection.enter('p3', { surface: 'sort', stackName: 'priority', fileId: 'p3' });
    await new Promise(r => setTimeout(r, 200));
    (window as any).CanonicalInspection.exit(); await new Promise(r => setTimeout(r, 250));
    return { focus: s.isFocusMode, detailsOpen: document.getElementById('details-modal')?.classList.contains('hidden') === false };
  });
  expect(r.focus).toBe(false); expect(r.detailsOpen).toBe(false);
});
