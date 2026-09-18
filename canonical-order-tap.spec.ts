import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>');
    state.imageFiles = ['a', 'b', 'c'].map((id, index) => ({ id, name: id, stack: 'in', stackSequence: 30 - index,
      metadataStatus: 'loaded', thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'regression', name: 'regression' };
    state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentStackPosition = 1; state.currentFileId = 'b';
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};

test('one canonical stable-ID order is read by Grid, Sort, and Focus', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const grid = (window as any).Grid;
    grid.open('in');
    await grid.applyReorder(['c'], 0);
    const canonical = state.stacks.in.map((file: any) => file.id);
    const gridOrder = state.grid.lazyLoadState.allFiles.map((file: any) => file.id);
    const sortOrder = (window as any).CurrentImage.stack('in').map((file: any) => file.id);
    const focusOrder = canonical.map((id: string) => {
      (window as any).CurrentImage.set(id, 'in', { allowCrossStack: false });
      return state.currentFileId;
    });
    return { canonical, gridOrder, sortOrder, focusOrder, currentStillStable: state.currentFileId === 'c' };
  });
  expect(result.canonical).toEqual(['c', 'a', 'b']);
  expect(result.gridOrder).toEqual(result.canonical);
  expect(result.sortOrder).toEqual(result.canonical);
  expect(result.focusOrder).toEqual(result.canonical);
});

const pointerTap = async (page: import('@playwright/test').Page, pointerType: 'touch' | 'mouse', poisonPicker = false) =>
  page.evaluate(({ pointerType, poisonPicker }) => {
    const gallery = (window as any).SpatialGallery;
    gallery.open({ stackName: 'in', fileId: 'a' });
    const middle = gallery.cards.find((card: any) => card.fileId === 'b');
    const adjacent = gallery.cards.find((card: any) => card.fileId === 'c');
    const opened: string[] = [];
    gallery.elements.scene.setPointerCapture = () => {};
    gallery.activateFileId = (id: string) => { opened.push(id); return true; };
    if (poisonPicker) gallery.cardAtPoint = () => adjacent;
    const event = { button: 0, pointerId: 7, pointerType, clientX: 50, clientY: 50,
      target: middle.element, composedPath: () => [middle.element, gallery.elements.scene] };
    gallery.onPointerDown(event);
    gallery.onPointerUp({ ...event, type: 'pointerup' });
    return opened;
  }, { pointerType, poisonPicker });

test('touch tapping the middle Explore card opens that exact card once', async ({ page }) => {
  await boot(page);
  expect(await pointerTap(page, 'touch')).toEqual(['b']);
});

test('touch card identity does not consult an adjacent cardAtPoint result', async ({ page }) => {
  await boot(page);
  expect(await pointerTap(page, 'touch', true)).toEqual(['b']);
});

test('a drag beyond tap slop spins and does not enter Focus', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const gallery = (window as any).SpatialGallery;
    gallery.open({ stackName: 'in', fileId: 'a' });
    const card = gallery.cards[1]; let opens = 0; const before = [...gallery.orient];
    gallery.elements.scene.setPointerCapture = () => {};
    gallery.activateFileId = () => { opens++; };
    const down = { button: 0, pointerId: 8, pointerType: 'touch', clientX: 10, clientY: 10,
      target: card.element, composedPath: () => [card.element, gallery.elements.scene] };
    gallery.onPointerDown(down);
    gallery.onPointerMove({ ...down, clientX: 40, clientY: 10 });
    gallery.onPointerMove({ ...down, clientX: 65, clientY: 20 });
    gallery.onPointerUp({ ...down, type: 'pointerup', clientX: 65, clientY: 20 });
    return { opens, spun: gallery.orient.some((value: number, index: number) => value !== before[index]) };
  });
  expect(result).toEqual({ opens: 0, spun: true });
});

test('desktop pointer clicking opens the exact clicked Explore card', async ({ page }) => {
  await boot(page);
  expect(await pointerTap(page, 'mouse', true)).toEqual(['b']);
});

test('Explore to Focus to Explore retains baseline card nodes', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const gallery = (window as any).SpatialGallery;
    gallery.open({ stackName: 'in', fileId: 'a' });
    await new Promise(resolve => setTimeout(resolve, 100));
    const before = gallery.cards.map((card: any) => card.element);
    await gallery.activateFileId('b', gallery.cards.find((card: any) => card.fileId === 'b').element);
    await new Promise(resolve => setTimeout(resolve, 100));
    (window as any).CanonicalInspection.exit();
    await new Promise(resolve => setTimeout(resolve, 150));
    const after = new Set(gallery.cards.map((card: any) => card.element));
    return before.every((element: Element) => after.has(element));
  });
  expect(result).toBe(true);
});
