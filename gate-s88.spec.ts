import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

test('§88 Focus exit reuses the retained globe (reconcile, not rebuild) even after a background generation bump', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'priority', fileId: 'p0' });
    await new Promise(r => setTimeout(r, 300));
    const before = g.cards.map((c: any) => c.element);
    // Enter Focus.
    await g.activateFileId('p6', g.cards.find((c: any) => String(c.fileId) === 'p6').element);
    await new Promise(r => setTimeout(r, 250));
    // Background sync bumps the churn generation while in Focus.
    state.folderSessionGeneration = (state.folderSessionGeneration || 0) + 7;
    // Spy: a rebuild goes through open(); a reconcile does not. Count open() calls on exit.
    let openCalls = 0;
    const realOpen = g.open.bind(g);
    g.open = (...a: any[]) => { openCalls++; return realOpen(...a); };
    (window as any).CanonicalInspection.exit();
    await new Promise(r => setTimeout(r, 300));
    g.open = realOpen;
    const elapsed = openCalls; // 0 = reconcile (fixed), >=1 = rebuild via open (lag)
    const after = new Set(g.cards.map((c: any) => c.element));
    const reused = before.filter((el: any) => after.has(el)).length;
    return { sphereVisible: !g.elements.root.hidden, reused, total: before.length, elapsed };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.reused).toBe(out.total);   // every card reused — reconcile, not rebuild
  expect(out.elapsed).toBe(0);          // resumeFromFocus did NOT fall through to open()/rebuild
});
