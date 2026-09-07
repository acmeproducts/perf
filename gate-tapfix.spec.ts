import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).Gestures);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};
// The entering tap: gesture started OUTSIDE Focus (table tap that opened Focus). handleEnd's
// tap branch must NOT navigate. Drive the real handleEnd with gestureStartInFocus=false.
test('TAPFIX a tap whose gesture began outside Focus does not fire Focus nav', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, T = (window as any).PhotoTable, G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    let nav = 0; const on = G.nextImage.bind(G), op = G.prevImage.bind(G);
    G.nextImage = () => { nav++; return on(); }; G.prevImage = () => { nav++; return op(); };
    T.handleTap(T.photos.find((x: any) => String(x.fileId) === 'p8')); await new Promise(r => setTimeout(r, 150));
    const opened = String(s.inspection?.fileId || '');
    // Simulate the entering tap reaching handleEnd: gesture began outside Focus.
    G.gestureStarted = false; G.tapHandled = false; G.gestureStartInFocus = false;
    G.startPos = { x: 50, y: 400 }; G.currentPos = { x: 51, y: 401 };
    G.maxTapDistance = 2; G.startTimestamp = performance.now() - 120; G.hubPressActive = false;
    G.handleEnd({ type: 'pointerup', changedTouches: null, clientX: 51, clientY: 401, preventDefault(){} });
    await new Promise(r => setTimeout(r, 150));
    return { opened, navAfter: nav };
  });
  expect(r.opened).toBe('p8');
  expect(r.navAfter).toBe(0);
});
