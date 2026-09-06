import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="peru"/></svg>');
    state.imageFiles = Array.from({ length: 9 }, (_, i) => ({ id: 'q' + i, name: 'q' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's75', name: 's75' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};

test('§75a search → close: results at the stack head, current = stack top, counter 0', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('q5', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    // Simulate a search: filtered = q7, q2 in that grid order; search marks dirty.
    state.grid.filtered = [state.imageFiles.find((f: any) => f.id === 'q7'), state.imageFiles.find((f: any) => f.id === 'q2')];
    state.grid.isDirty = true;
    state.grid.skipReorderOnClose = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    const head = (state.stacks.in || []).slice(0, 2).map((f: any) => String(f.id));
    return { head, currentId: String(state.currentFileId), position: state.currentStackPosition, stack: state.currentStack };
  });
  expect(out.head).toEqual(['q7', 'q2']);
  expect(out.currentId).toBe('q7');
  expect(out.position).toBe(0);
  expect(out.stack).toBe('in');
});

test('§75c clean close to Sort: current = stack top', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('q5', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    const topId = String((state.stacks.in || [])[0]?.id || '');
    return { topId, currentId: String(state.currentFileId), position: state.currentStackPosition };
  });
  expect(out.currentId).toBe(out.topId);
  expect(out.position).toBe(0);
});

test('§75d explore-origin close keeps its anchor routing (unchanged)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'q3' });
    await new Promise(r => setTimeout(r, 250));
    (window as any).CurrentImage.set('q3', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', { origin: { surface: 'explore', stackName: 'in', fileId: 'q3' } });
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 300));
    return { sphereVisible: !(window as any).SpatialGallery.elements.root.hidden, currentId: String(state.currentFileId) };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.currentId).toBe('q3');
});
