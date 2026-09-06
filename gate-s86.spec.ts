import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

test('§86 after a cross-stack grid exit, the active stack pill matches the landed stack', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).SurfaceStackSelector);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 4 }, (_, i) => mk('k' + i, i, 'priority')).concat(Array.from({ length: 3 }, (_, i) => mk('r' + i, i + 20, 'trash')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
    // Keep pill active initially (as Sort on Keep would be).
    (window as any).Core.updateActiveProxTab();
    (window as any).SpatialGallery.open({ stackName: 'priority', fileId: 'k0' });
    await new Promise(r => setTimeout(r, 200));
    (window as any).SurfaceStackSelector.surface = 'explore';
    (window as any).SurfaceStackSelector.openGrid('trash');
    await new Promise(r => setTimeout(r, 200));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 250));
    const activePills = ['in', 'out', 'priority', 'trash'].filter(s => document.getElementById('pill-' + s)!.classList.contains('active'));
    return { currentStack: state.currentStack, activePills };
  });
  expect(out.currentStack).toBe('trash');
  expect(out.activePills).toEqual(['trash']);   // only the landed stack's pill is active
});
