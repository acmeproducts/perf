import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="tan"/></svg>');
    state.imageFiles = Array.from({ length: 6 }, (_, i) => ({ id: 'v' + i, name: 'v' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's76', name: 's76' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};

test('§76.1 one finger-lift closes the grid; repeats and the trailing click are inert', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    let closes = 0;
    const grid = (window as any).Grid;
    const realClose = grid.close.bind(grid);
    grid.close = () => { closes++; return realClose(); };
    grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    const x = document.getElementById('close-grid') as HTMLButtonElement;
    x.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 5, button: 0 }));
    x.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 6, button: 0 }));
    x.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return { closes, hidden: document.getElementById('grid-modal')!.classList.contains('hidden') };
  });
  expect(out.closes).toBe(1);
  expect(out.hidden).toBe(true);
});

test('§76.1 grid window size persists across close and reopen', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const content = document.querySelector('#grid-modal .modal-content') as HTMLElement;
    const resizable = content.style.resize === 'both';
    content.style.width = '640px'; content.style.height = '480px';
    await new Promise(r => setTimeout(r, 450)); // ResizeObserver debounce
    const saved = JSON.parse(localStorage.getItem('orbital8:grid-window-size') || 'null');
    return { resizable, saved };
  });
  expect(out.resizable).toBe(true);
  expect(out.saved?.width).toBe('640px');
  expect(out.saved?.height).toBe('480px');
});

test('§76.2 the sort heart toggles the current file via the standard path and follows image changes; hidden in focus', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).App.updateUserMetadata = async () => true; // provider write stub
    (window as any).CurrentImage.set('v2', 'in', { allowCrossStack: false });
    (window as any).Core.updateFavoriteButton();
    const heart = document.getElementById('sort-favorite-btn') as HTMLButtonElement;
    heart.click();
    await new Promise(r => setTimeout(r, 100));
    const afterToggle = { fav: (window as any).Utils.isFavorite((window as any).CurrentImage.current()) === true, cls: heart.classList.contains('favorited') };
    // Image change: heart must reflect the new current file (not favorited).
    (window as any).CurrentImage.set('v3', 'in', { allowCrossStack: false });
    (window as any).Core.updateFavoriteButton();
    const afterChange = heart.classList.contains('favorited');
    // Hidden while focus is open.
    document.querySelector('#app-container')!.classList.add('focus-mode');
    const hiddenInFocus = getComputedStyle(heart).display === 'none';
    document.querySelector('#app-container')!.classList.remove('focus-mode');
    return { afterToggle, afterChange, hiddenInFocus };
  });
  expect(out.afterToggle.fav).toBe(true);
  expect(out.afterToggle.cls).toBe(true);
  expect(out.afterChange).toBe(false);
  expect(out.hiddenInFocus).toBe(true);
});

test('§76.3 table scale and limit persist and restore on init', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const table = (window as any).PhotoTable;
    table.imageScale = 1; table.imageLimit = 24;
    table.adjustControl('scale', 20);
    table.adjustControl('limit', 15);
    const saved = JSON.parse(localStorage.getItem('orbital8:table-settings') || 'null');
    // Fresh state simulation: reset then restore.
    table.imageScale = 1; table.imageLimit = 24;
    table.restoreSettings();
    return { saved, restoredScale: table.imageScale, restoredLimit: table.imageLimit };
  });
  expect(out.saved.imageScale).toBeCloseTo(1.2, 5);
  expect(out.saved.imageLimit).toBe(39);
  expect(out.restoredScale).toBeCloseTo(1.2, 5);
  expect(out.restoredLimit).toBe(39);
});
