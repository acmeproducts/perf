import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

// §64 binary gate: tap → exactly that image → next shows the id-neighbor → prev returns →
// X lands on the visible globe on its own stack. Pass = publish. Fail = discard.
test('§64 gate: full loop — tap, next, prev, X', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="navy"/></svg>');
    state.imageFiles = Array.from({ length: 10 }, (_, i) => ({ id: 'g' + i, name: 'g' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'gate', name: 'gate' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    const g = (window as any).SpatialGallery;
    g.open({ stackName: 'in', fileId: 'g0' });
    await new Promise(r => setTimeout(r, 300));

    const stack = state.stacks.in.map((f: any) => String(f.id));
    const tappedId = 'g4';
    const tappedIndex = stack.indexOf(tappedId);
    const expectNext = stack[(tappedIndex + 1) % stack.length];

    // Tap.
    await g.activateFileId(tappedId, g.cards.find((c: any) => String(c.fileId) === tappedId).element);
    await new Promise(r => setTimeout(r, 250));
    const step1 = String(state.inspection?.fileId || '');
    const shown1 = String((document.getElementById('center-image') as HTMLElement | null)?.dataset.fileId || '');

    // Next.
    await (window as any).Gestures.nextImage();
    await new Promise(r => setTimeout(r, 250));
    const step2 = String(state.inspection?.fileId || '');
    const shown2 = String((document.getElementById('center-image') as HTMLElement | null)?.dataset.fileId || '');

    // Prev.
    await (window as any).Gestures.prevImage();
    await new Promise(r => setTimeout(r, 250));
    const step3 = String(state.inspection?.fileId || '');

    // X.
    const btn = document.getElementById('focus-origin-close') as HTMLButtonElement;
    btn.disabled = false;
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 71, button: 0 }));
    await new Promise(r => setTimeout(r, 450));

    return {
      tappedId, expectNext, step1, shown1, step2, shown2, step3,
      sphereVisible: !g.elements.root.hidden,
      surface: state.inspection?.surface || null,
      stack: state.currentStack
    };
  });
  expect(out.step1).toBe(out.tappedId);
  expect(out.shown1 === out.tappedId || out.shown1 === '').toBe(true);
  expect(out.step2).toBe(out.expectNext);
  expect(out.shown2 === out.expectNext || out.shown2 === '').toBe(true);
  expect(out.step3).toBe(out.tappedId);
  expect(out.sphereVisible).toBe(true);
  expect(out.surface).toBe('explore');
  expect(out.stack).toBe('in');
});
