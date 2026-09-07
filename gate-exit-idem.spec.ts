import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery && !!(window as any).CanonicalInspection);
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
test('EXITIDEM globe->Focus: a storm of exit() calls fires exitToReferrer exactly once and lands on the globe', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const s = (window as any).__orbitalAppState, g = (window as any).SpatialGallery, CI = (window as any).CanonicalInspection;
    g.open({ stackName: 'priority', fileId: 'p0' }); await new Promise(r => setTimeout(r, 250));
    await g.activateFileId('p5', g.cards.find((c: any) => String(c.fileId) === 'p5').element);
    await new Promise(r => setTimeout(r, 200));
    let refCalls = 0; const orig = CI.exitToReferrer.bind(CI);
    CI.exitToReferrer = (...a: any[]) => { refCalls++; return orig(...a); };
    // The storm: 7 synchronous exit() calls, exactly as the device trace showed.
    for (let i = 0; i < 7; i++) CI.exit();
    await new Promise(r => setTimeout(r, 400));
    return { refCalls, focus: s.isFocusMode, sphere: !g.elements.root.hidden, grid: document.getElementById('grid-modal')?.classList.contains('hidden') === false, details: document.getElementById('details-modal')?.classList.contains('hidden') === false };
  });
  expect(r.refCalls).toBe(1);   // one exit, not seven (the storm is killed)
  expect(r.focus).toBe(false);  // exited
  expect(r.grid).toBe(false);   // never routed through grid
  expect(r.details).toBe(false);// never routed through details
});
