import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="plum"/></svg>');
    state.imageFiles = Array.from({ length: 12 }, (_, i) => ({ id: 'z' + i, name: 'z' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's70', name: 's70' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'z0' });
  });
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 12);
};

test('§70 gate: sort gesture screen is structurally inert while the sphere is live; taps cannot bump the position', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const screenA = document.getElementById('gesture-screen-a') as HTMLElement;
    const posBefore = state.currentStackPosition;
    const idBefore = String(state.currentFileId);
    // Synthetic directional tap through the layer (as the double delivery did).
    screenA.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 91, clientX: 800, clientY: 400 }));
    screenA.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 91, clientX: 800, clientY: 400 }));
    await new Promise(r => setTimeout(r, 350));
    return {
      hidden: screenA.hasAttribute('hidden'),
      pointerEvents: screenA.style.pointerEvents,
      positionUnchanged: state.currentStackPosition === posBefore,
      idUnchanged: String(state.currentFileId) === idBefore
    };
  });
  expect(out.hidden).toBe(true);
  expect(out.pointerEvents).toBe('none');
  expect(out.positionUnchanged).toBe(true);
  expect(out.idUnchanged).toBe(true);
});

test('§70 gate: a sphere tap opens exactly the tapped id, and closing the sphere restores the sort layer', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const state = (window as any).__orbitalAppState;
    await g.activateFileId('z7', g.cards.find((c: any) => String(c.fileId) === 'z7').element);
    await new Promise(r => setTimeout(r, 250));
    const opened = String(state.inspection?.fileId || '');
    // Exit focus and close the sphere: sort layer must come back.
    (window as any).CanonicalInspection.exit();
    await new Promise(r => setTimeout(r, 300));
    g.close({ force: true });
    (window as any).__orbitalAppState.isFocusMode = false;
    (window as any).Gestures.updateGestureOverlayMode();
    const screenA = document.getElementById('gesture-screen-a') as HTMLElement;
    return { opened, sortLayerBack: !screenA.hasAttribute('hidden') && screenA.style.pointerEvents !== 'none' };
  });
  expect(out.opened).toBe('z7');
  expect(out.sortLayerBack).toBe(true);
});
