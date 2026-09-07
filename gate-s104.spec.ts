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
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};

// REPRO of the real drift: PhotoTable.handleTap enters Focus, then the SAME tap reaches
// Gestures.handleTap (Focus tap-to-nav) which fires prev/next off the tapped image.
test('§104 the tap that enters Focus is NOT re-consumed as a Focus nav tap', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const T = (window as any).PhotoTable;
    const G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    let navCount = 0;
    const on = G.nextImage.bind(G), op = G.prevImage.bind(G);
    G.nextImage = () => { navCount++; return on(); };
    G.prevImage = () => { navCount++; return op(); };
    // Table tap enters Focus on t8.
    T.handleTap(T.photos.find((p: any) => String(p.fileId) === 't8'));
    await new Promise(r => setTimeout(r, 100));
    // The SAME tap now reaches the document-level Gestures Focus tap-nav.
    G.handleTap(50, 400);  // left half -> would call prevImage on the entering tap
    await new Promise(r => setTimeout(r, 150));
    return { opened: String(state.inspection?.fileId || ''), navCount };
  });
  expect(out.opened).toBe('t8');   // stayed on the tapped image
  expect(out.navCount).toBe(0);    // the entering tap did NOT trigger nav
});

// Non-regression: a GENUINE Focus tap-to-nav (a separate tap while already in Focus) still works.
test('§104 a genuine Focus tap still navigates', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const T = (window as any).PhotoTable;
    const G = (window as any).Gestures;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    T.handleTap(T.photos.find((p: any) => String(p.fileId) === 't8'));
    await new Promise(r => setTimeout(r, 100));
    // First Focus tap consumes the entering-tap guard (this is the tap that entered Focus).
    G.handleTap(50, 400);
    await new Promise(r => setTimeout(r, 800));  // let the guard window lapse for a genuine later tap
    let navCount = 0;
    const on = G.nextImage.bind(G); G.nextImage = () => { navCount++; return on(); };
    // A genuine, separate tap on the right half while in Focus.
    G.handleTap(700, 400);
    await new Promise(r => setTimeout(r, 150));
    return { navCount };
  });
  expect(out.navCount).toBe(1);   // genuine focus tap navigates
});
