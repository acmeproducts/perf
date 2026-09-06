import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).SpatialGallery && !!(window as any).Gestures);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};

// Gate 1: tap opens EXACTLY the tapped image even when a >80px drag (that started OUTSIDE
// Focus) overlaps the tap->Focus transition and would otherwise fire Focus nav.
test('§101 gate 1: table tap opens the tapped image despite an overlapping >80px drag', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const T = (window as any).PhotoTable;
    const G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    // Enter Focus on t8 (correct selection).
    T.handleTap(T.photos.find((p: any) => String(p.fileId) === 't8'));
    await new Promise(r => setTimeout(r, 200));
    const before = String(state.currentFileId || '');
    // Now a >80px drag whose gesture STARTED OUTSIDE Focus reaches pointer-up while in Focus.
    // On p25 (no start-surface guard) this fires nav and drifts off t8; §101 must hold.
    G.gestureStartInFocus = false;   // set by handler at start; false = began on table/globe
    G.startPos = { x: 100, y: 300 };
    G.currentPos = { x: 280, y: 300 }; // 180px > 80
    G.maxTapDistance = 180;
    G.startTimestamp = performance.now() - 500;
    G.hubPressActive = false; G.holdConsumed = false; G.gestureStarted = true;
    G.handleEnd({ type: 'pointerup', changedTouches: null, clientX: 280, clientY: 300, preventDefault(){} });
    await new Promise(r => setTimeout(r, 200));
    const after = String(state.currentFileId || '');
    return { before, after };
  });
  expect(out.before).toBe('t8');
  expect(out.after).toBe('t8');   // no drift
});

// Gate 2: a swipe that STARTS in Focus still navigates.
test('§101 gate 2: a Focus-originated swipe navigates to the id-neighbor', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const T = (window as any).PhotoTable;
    const G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const order = state.stacks.priority.map((f: any) => String(f.id));
    T.handleTap(T.photos.find((p: any) => String(p.fileId) === 't8'));
    await new Promise(r => setTimeout(r, 150));
    const opened = String(state.inspection?.fileId || '');
    // A NEW gesture that starts in Focus:
    G.gestureStartInFocus = true;
    await G.nextImage();
    await new Promise(r => setTimeout(r, 150));
    const afterNext = String(state.currentFileId || '');
    return { opened, afterNext, expected: order[(order.indexOf('t8') + 1) % order.length] };
  });
  expect(out.opened).toBe('t8');
  expect(out.afterNext).toBe(out.expected);
});

// Gate 3: explore->Focus works and stays in Focus.
test('§101 gate 3: explore tap enters Focus and stays (no grid jump)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('t5', g.cards.find((c: any) => String(c.fileId) === 't5').element);
    await new Promise(r => setTimeout(r, 200));
    return { entered: String(state.inspection?.fileId || ''), surface: state.inspection?.surface };
  });
  expect(out.entered).toBe('t5');
  expect(out.surface).toBe('focus');
});

// Gate 4: exit returns correctly.
test('§101 gate 4: exit from Focus returns to the origin surface', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('t5', g.cards.find((c: any) => String(c.fileId) === 't5').element);
    await new Promise(r => setTimeout(r, 200));
    (window as any).CanonicalInspection.exit();
    await new Promise(r => setTimeout(r, 250));
    return { sphereVisible: !g.elements.root.hidden, focusMode: state.isFocusMode };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.focusMode).toBe(false);
});
