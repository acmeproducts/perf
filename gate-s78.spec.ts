import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).PhotoTable);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    state.imageFiles = Array.from({ length: 6 }, (_, i) => ({ id: 'w' + i, name: 'w' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's78', name: 's78' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).App.updateUserMetadata = async () => true;
  });
};

test('§78 heart lives INSIDE the image frame, not the viewport, and clears the Detail button', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(() => {
    const heart = document.getElementById('sort-favorite-btn')!;
    const frame = document.getElementById('center-image-frame')!;
    const detail = document.getElementById('details-button')!;
    const parentIsFrame = heart.parentElement === frame;
    // Force a visible image box so geometry is real.
    const img = document.getElementById('center-image') as HTMLImageElement;
    img.style.width = '300px'; img.style.height = '200px';
    (window as any).CurrentImage.set('w1', 'in', { allowCrossStack: false });
    (window as any).SortFavorite.refresh();
    const hr = heart.getBoundingClientRect();
    const dr = detail.getBoundingClientRect();
    const overlapsDetail = !(hr.right < dr.left || hr.left > dr.right || hr.bottom < dr.top || hr.top > dr.bottom);
    return { parentIsFrame, overlapsDetail, heartHidden: heart.hidden };
  });
  expect(out.parentIsFrame).toBe(true);
  expect(out.overlapsDetail).toBe(false);
  expect(out.heartHidden).toBe(false);
});

test('§78 heart toggles favorite via its own path and follows image changes; hidden in Focus', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    (window as any).CurrentImage.set('w2', 'in', { allowCrossStack: false });
    (window as any).SortFavorite.refresh();
    const heart = document.getElementById('sort-favorite-btn')!;
    heart.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    const afterToggle = (window as any).Utils.isFavorite((window as any).CurrentImage.current()) === true && heart.classList.contains('favorited');
    (window as any).CurrentImage.set('w3', 'in', { allowCrossStack: false });
    (window as any).SortFavorite.refresh();
    const afterChange = heart.classList.contains('favorited');
    document.querySelector('#app-container')!.classList.add('focus-mode');
    (window as any).SortFavorite.refresh();
    const hiddenInFocus = heart.hidden === true || getComputedStyle(heart).display === 'none';
    document.querySelector('#app-container')!.classList.remove('focus-mode');
    return { afterToggle, afterChange, hiddenInFocus };
  });
  expect(out.afterToggle).toBe(true);
  expect(out.afterChange).toBe(false);
  expect(out.hiddenInFocus).toBe(true);
});

test('§78 COUNTER-PROOF: Focus favoriting still works (G27)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    (window as any).CurrentImage.set('w4', 'in', { allowCrossStack: false });
    const focusBtn = document.getElementById('focus-favorite-btn')!;
    const before = (window as any).Utils.isFavorite((window as any).CurrentImage.current());
    focusBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    const after = (window as any).Utils.isFavorite((window as any).CurrentImage.current());
    return { before, after, btnFav: focusBtn.classList.contains('favorited') };
  });
  expect(out.before).toBe(false);
  expect(out.after).toBe(true);
  expect(out.btnFav).toBe(true);
});

test('§78 grid X closes on one finger-lift; repeats and trailing click inert', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    let closes = 0;
    const grid = (window as any).Grid;
    const real = grid.close.bind(grid);
    grid.close = () => { closes++; return real(); };
    grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    const x = document.getElementById('close-grid')!;
    x.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 3, button: 0 }));
    x.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 4, button: 0 }));
    x.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return { closes, hidden: document.getElementById('grid-modal')!.classList.contains('hidden') };
  });
  expect(out.closes).toBe(1);
  expect(out.hidden).toBe(true);
});

test('§78 table scale/limit persist and restore', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(() => {
    const table = (window as any).PhotoTable;
    table.imageScale = 1; table.imageLimit = 24;
    table.adjustControl('scale', 20);
    table.adjustControl('limit', 15);
    const saved = JSON.parse(localStorage.getItem('orbital8:table-settings') || 'null');
    table.imageScale = 1; table.imageLimit = 24;
    table.restoreSettings();
    return { saved, s: table.imageScale, l: table.imageLimit };
  });
  expect(out.saved.imageScale).toBeCloseTo(1.2, 5);
  expect(out.saved.imageLimit).toBe(39);
  expect(out.s).toBeCloseTo(1.2, 5);
  expect(out.l).toBe(39);
});


test('§79 heart is chromeless: transparent bg, no border, grey off / red on', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    state.imageFiles = [{ id: 'h0', name: 'h0', stack: 'in', stackSequence: 900, metadataStatus: 'loaded', favorite: false, thumbnails: { medium: { url: svg } }, downloadUrl: svg }];
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).App.updateUserMetadata = async () => true;
    (window as any).CurrentImage.set('h0', 'in', { allowCrossStack: false });
    (window as any).SortFavorite.refresh();
  });
  const out = await page.evaluate(() => {
    const heart = document.getElementById('sort-favorite-btn')!;
    const off = getComputedStyle(heart);
    const offColor = off.color; const bg = off.backgroundColor; const border = off.borderTopWidth;
    heart.classList.add('favorited');
    const onColor = getComputedStyle(heart).color;
    return { offColor, onColor, bg, border };
  });
  // grey #9ca3af = rgb(156,163,175); red #ef4444 = rgb(239,68,68)
  expect(out.offColor).toBe('rgb(156, 163, 175)');
  expect(out.onColor).toBe('rgb(239, 68, 68)');
  expect(out.bg).toBe('rgba(0, 0, 0, 0)');
  expect(out.border).toBe('0px');
});

test('§79 grid ALWAYS exits to Sort, even when opened from Explore', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    state.imageFiles = Array.from({ length: 5 }, (_, i) => ({ id: 'g' + i, name: 'g' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'g2' });
    await new Promise(r => setTimeout(r, 250));
    (window as any).Grid.open('in', { origin: { surface: 'explore', stackName: 'in', fileId: 'g2' } });
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 300));
    return { sphereHidden: (window as any).SpatialGallery.elements.root.hidden, focusMode: state.isFocusMode, inspection: state.inspection?.surface || null };
  });
  expect(out.sphereHidden).toBe(true);   // did NOT resume Explore
  expect(out.focusMode).toBe(false);     // did NOT resume Focus
});

test('§80 grid opened for a DIFFERENT stack than the origin exits to Sort on the GRID stack top', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).SpatialGallery);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    const mk = (id, i, stack) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 5 }, (_, i) => mk('in' + i, i, 'in')).concat(Array.from({ length: 4 }, (_, i) => mk('out' + i, i + 20, 'out')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    // In Explore on the 'in' stack...
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'in2' });
    await new Promise(r => setTimeout(r, 250));
    // ...open the grid for the 'out' stack.
    (window as any).Grid.open('out', { origin: { surface: 'explore', stackName: 'in', fileId: 'in2' } });
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 300));
    const outTop = (state.stacks.out || [])[0]?.id;
    return {
      currentStack: state.currentStack,
      currentId: String(state.currentFileId),
      outTop: String(outTop || ''),
      sphereHidden: (window as any).SpatialGallery.elements.root.hidden,
      focusMode: state.isFocusMode
    };
  });
  expect(out.currentStack).toBe('out');       // the grid's (live) stack, not the origin 'in'
  expect(out.currentId).toBe(out.outTop);      // its top image
  expect(out.sphereHidden).toBe(true);
  expect(out.focusMode).toBe(false);
});


test('§81 stack-switcher -> grid -> close goes to SORT on the grid stack (not focus/explore), from Explore origin', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid && !!(window as any).SpatialGallery && !!(window as any).SurfaceStackSelector);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    const mk = (id, i, stack) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 5 }, (_, i) => mk('in' + i, i, 'in')).concat(Array.from({ length: 4 }, (_, i) => mk('tr' + i, i + 20, 'trash')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    // Sort -> Explore.
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'in1' });
    await new Promise(r => setTimeout(r, 250));
    // Stack switcher (opened from explore) -> grid for the recycle (trash) stack.
    (window as any).SurfaceStackSelector.surface = 'explore';
    (window as any).SurfaceStackSelector.openGrid('trash');
    await new Promise(r => setTimeout(r, 200));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 300));
    return {
      currentStack: state.currentStack,
      currentId: String(state.currentFileId),
      trashTop: String((state.stacks.trash || [])[0]?.id || ''),
      sphereHidden: (window as any).SpatialGallery.elements.root.hidden,
      focusMode: state.isFocusMode,
      inspection: state.inspection?.surface || null
    };
  });
  expect(out.focusMode).toBe(false);           // NOT focus
  expect(out.sphereHidden).toBe(true);         // NOT explore
  expect(out.currentStack).toBe('trash');      // the grid (recycle) stack
  expect(out.currentId).toBe(out.trashTop);    // its top
});
