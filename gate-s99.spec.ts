import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page, stack = 'priority') => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).SpatialGallery && !!(window as any).Gestures);
  await page.evaluate(s => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: s, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = s; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  }, stack);
};

test('§99 table tap opens the tapped image AND next/prev navigate correctly in Focus', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const order = state.stacks.priority.map((f: any) => String(f.id));
    const startIdx = order.indexOf('t8');
    T.handleTap(T.photos.find((p: any) => String(p.fileId) === 't8'));
    await new Promise(r => setTimeout(r, 200));
    const opened = String(state.inspection?.fileId || '');
    await (window as any).Gestures.nextImage();
    await new Promise(r => setTimeout(r, 150));
    const afterNext = String(state.inspection?.fileId || '');
    const centerNext = String((document.getElementById('center-image') as HTMLElement)?.dataset.fileId || '');
    await (window as any).Gestures.prevImage();
    await new Promise(r => setTimeout(r, 150));
    const afterPrev = String(state.inspection?.fileId || '');
    return { opened, afterNext, afterPrev, expectNext: order[(startIdx + 1) % order.length], back: order[startIdx] };
  });
  expect(out.opened).toBe('t8');
  expect(out.afterNext).toBe(out.expectNext);   // next actually moved (not inert)
  expect(out.afterNext).not.toBe('t8');
  const centerAfterPrev = out.afterPrev;
  expect(centerAfterPrev).toBe('t8');           // prev returned
});

test('§99 explore tap enters Focus and next/prev work', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('t5', g.cards.find((c: any) => String(c.fileId) === 't5').element);
    await new Promise(r => setTimeout(r, 200));
    const entered = String(state.inspection?.fileId || '');
    const surface = state.inspection?.surface;
    await (window as any).Gestures.nextImage();
    await new Promise(r => setTimeout(r, 150));
    const afterNext = String(state.inspection?.fileId || '');
    const stillFocus = state.inspection?.surface === 'focus';
    return { entered, surface, afterNext, stillFocus };
  });
  expect(out.entered).toBe('t5');
  expect(out.surface).toBe('focus');
  expect(out.afterNext).not.toBe('t5');   // nav moved
  expect(out.stillFocus).toBe(true);      // did NOT jump to grid
});
