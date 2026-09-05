import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

// The device-only killer: the background refresh lands while the person views a photo,
// the cloud/cache merge flips that photo's stack assignment (the app's own recent writeback
// hasn't propagated), and the legacy refresh then repainted the screen by POSITION —
// replacing the viewed photo with a different one and misrouting the X.
test('a background refresh that flips the viewed file\'s stack cannot swap the displayed photo or break the X', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = (c: string) => 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="' + c + '"/></svg>');
    const files = Array.from({ length: 10 }, (_, i) => ({ id: 'r' + i, name: 'r' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg('#3355aa') }, medium: { url: svg('#3355aa') }, large: { url: svg('#3355aa') } }, downloadUrl: svg('#3355aa') }));
    state.imageFiles = files;
    state.currentFolder = { id: 'stomp', name: 'stomp' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'r0' });
    await new Promise(r => setTimeout(r, 300));
    const g = (window as any).SpatialGallery;
    const tapped = g.cards[4];
    await g.activateFileId(String(tapped.fileId), tapped.element);
    await new Promise(r => setTimeout(r, 200));
    // The refresh lands: the viewed file's stack flips (cloud lag) and the refresh applies.
    const viewedId = String(state.inspection.fileId);
    const viewedFile = state.imageFiles.find((f: any) => String(f.id) === viewedId);
    viewedFile.stack = 'out';
    const anchorId = state.currentFileId;
    const anchorStack = state.currentStack;
    (window as any).Core.initializeStacks();
    if ((window as any).__legacyRefresh) {
      (window as any).Core.updateStackCounts?.();
      (window as any).Core.displayCurrentImage();
    } else {
      if (anchorId) (window as any).CurrentImage.set(anchorId, anchorStack, { allowCrossStack: true });
      (window as any).Core.updateStackCounts?.();
      const surfaceLive = state.isFocusMode || !g.elements?.root?.hidden || !(window as any).PhotoTable.elements?.root?.hidden;
      if (!surfaceLive) (window as any).Core.displayCurrentImage();
    }
    await new Promise(r => setTimeout(r, 300));
    const center = document.getElementById('center-image') as HTMLImageElement | null;
    // Then the X.
    const btn = document.getElementById('focus-origin-close') as HTMLButtonElement;
    btn.disabled = false;
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 41, button: 0 }));
    await new Promise(r => setTimeout(r, 400));
    return {
      viewedId,
      shownAfterRefresh: String(center?.dataset.fileId || ''),
      stillFocusAfterRefresh: state.isFocusMode === true || state.inspection?.surface === 'focus',
      xLandedOnSphere: !g.elements.root.hidden,
      xLandedInSortFocus: state.inspection?.surface === 'focus' || document.body.classList.contains('origin-focus')
    };
  });
  expect(out.shownAfterRefresh === out.viewedId || out.shownAfterRefresh === '').toBe(true);
  expect(out.xLandedOnSphere).toBe(true);
});
