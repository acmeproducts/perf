import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const setup = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="olive"/></svg>');
    state.imageFiles = Array.from({ length: 12 }, (_, i) => ({ id: 'd' + i, name: 'd' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'det', name: 'det' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'd0' });
  });
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 12);
};

test('input ownership: sort gesture screens are structurally inert while the sphere is live', async ({ page }) => {
  await setup(page);
  const out = await page.evaluate(() => {
    const a = document.getElementById('gesture-screen-a') as HTMLElement;
    return { hidden: a.hasAttribute('hidden'), pe: a.style.pointerEvents };
  });
  expect(out.hidden).toBe(true);
  expect(out.pe).toBe('none');
});

test('focus subject is pinned by id: concurrent position mutation cannot swap the displayed file (the off-by-one)', async ({ page }) => {
  await setup(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const state = (window as any).__orbitalAppState;
    const target = g.cards.find((c: any) => String(c.fileId) === 'd5');
    const pending = g.activateFileId('d5', target.element);
    // The race: something advances the position while the enter is in flight.
    state.currentStackPosition = 6;
    state.currentFileId = 'd6';
    await pending;
    await new Promise(r => setTimeout(r, 300));
    // And again after display settled.
    state.currentStackPosition = 7;
    await (window as any).Core.displayCurrentImage();
    await new Promise(r => setTimeout(r, 200));
    const center = document.getElementById('center-image') as HTMLImageElement | null;
    return { inspectionId: String(state.inspection?.fileId || ''), shown: String(center?.dataset.fileId || ''), currentFileId: String(state.currentFileId) };
  });
  expect(out.inspectionId).toBe('d5');
  expect(out.shown === 'd5' || out.shown === '').toBe(true);
  expect(out.currentFileId).toBe('d5');
});

test('exit destination is immutable: clobbering referrer and stack after enter cannot send the X to Sort', async ({ page }) => {
  await setup(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const CI = (window as any).CanonicalInspection;
    const state = (window as any).__orbitalAppState;
    await g.activateFileId('d3', g.cards.find((c: any) => String(c.fileId) === 'd3').element);
    await new Promise(r => setTimeout(r, 200));
    // Sabotage everything exit used to re-derive from.
    CI.clearReferrer();
    state.currentStack = 'out';
    const btn = document.getElementById('focus-origin-close') as HTMLButtonElement;
    btn.disabled = false;
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 61, button: 0 }));
    await new Promise(r => setTimeout(r, 400));
    return { sphereVisible: !g.elements.root.hidden, surface: state.inspection?.surface || null, stack: state.currentStack };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.surface).toBe('explore');
});
