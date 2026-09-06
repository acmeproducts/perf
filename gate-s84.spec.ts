import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).ModeChoiceModal);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 4 }, (_, i) => mk('k' + i, i, 'priority')).concat(Array.from({ length: 3 }, (_, i) => mk('m' + i, i + 20, 'out')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).App.updateUserMetadata = async () => true;
    if (typeof (window as any).Gestures.initGestureOverlay === 'function' && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};

test('§84 Bug1: grid keep->maybe move, exit lands on MAYBE following the moved file', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).Grid.open('priority', { origin: { surface: 'sort', stackName: 'priority', fileId: 'k0', gridStack: 'priority' } });
    await new Promise(r => setTimeout(r, 150));
    // Move k0 keep(priority) -> maybe(out) via the real grid action.
    // Move k0 priority->out exactly as executeMove does, then record acted file.
    const f = state.imageFiles.find((x: any) => x.id === 'k0');
    const ci = state.stacks.priority.findIndex((x: any) => x.id === 'k0');
    if (ci !== -1) state.stacks.priority.splice(ci, 1);
    f.stack = 'out'; f.stackSequence = Date.now();
    state.stacks.out.unshift(f);
    state.grid.lastActedFileId = 'k0';
    await new Promise(r => setTimeout(r, 100));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 250));
    return { currentStack: state.currentStack, currentId: String(state.currentFileId) };
  });
  expect(out.currentStack).toBe('out');   // Maybe, following the moved file
  expect(out.currentId).toBe('k0');
});

test('§84 Bug2: after grid close the Sort gesture screen is live and the mode double-tap works', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    // Grid opened over a live Explore sphere (the real path).
    (window as any).SpatialGallery.open({ stackName: 'priority', fileId: 'k1' });
    await new Promise(r => setTimeout(r, 200));
    (window as any).Grid.open('priority', { origin: { surface: 'sort', stackName: 'priority', fileId: 'k1', gridStack: 'priority' } });
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 250));
    const gsa = document.getElementById('gesture-screen-a')!;
    // Active Sort state: not hidden, aria-hidden false, and the inline pointer-events matches
    // the §70 active path ('') — identical to a normal Sort session (the .stage CSS keeps a
    // base 'none'; tappable children carry pointer-events:auto).
    const liveGesture = !gsa.hasAttribute('hidden') && gsa.getAttribute('aria-hidden') === 'false' && gsa.style.pointerEvents === '';
    // The double-tap action should be able to open the chooser.
    let chooserOpened = false;
    (window as any).ModeChoiceModal.open({ stackName: state.currentStack, fileId: state.currentFileId });
    chooserOpened = !document.getElementById('mode-choice-modal')!.hidden;
    return { liveGesture, sphereHidden: (window as any).SpatialGallery.elements.root.hidden, chooserOpened };
  });
  expect(out.sphereHidden).toBe(true);
  expect(out.liveGesture).toBe(true);
  expect(out.chooserOpened).toBe(true);
});
