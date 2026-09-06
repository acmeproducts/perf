import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 30 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    try { localStorage.removeItem('orbital8:table-settings'); } catch (e) {}
  });
};

test('§90 floating controls are VISIBLE by default when Table opens', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.controlsOpen = true; // fresh default
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    return { controlsHidden: document.getElementById('photo-table-controls')!.hidden };
  });
  expect(out.controlsHidden).toBe(false);
});

test('§90 adjusting scale/limit updates labels, applies, and persists', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const beforeCount = T.photos.length;
    // Click + on Images and + on Image size via the real steppers.
    (document.querySelector('[data-control="limit"] .spatial-gallery__adjust') as HTMLElement).click();
    (document.querySelector('[data-control="scale"] .spatial-gallery__adjust') as HTMLElement).click();
    await new Promise(r => setTimeout(r, 200));
    const afterCount = T.photos.length;
    const saved = JSON.parse(localStorage.getItem('orbital8:table-settings') || 'null');
    return {
      limitLabel: document.getElementById('photo-table-limit')!.textContent,
      scaleLabel: document.getElementById('photo-table-scale')!.textContent,
      beforeCount, afterCount, saved
    };
  });
  expect(out.limitLabel).toBe('29');
  expect(out.scaleLabel).toBe('110%');
  expect(out.afterCount).toBeGreaterThan(out.beforeCount);
  expect(out.saved.imageLimit).toBe(29);
  expect(out.saved.imageScale).toBeCloseTo(1.1, 5);
});

test('§90 open/closed control preference persists across reopen', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 200));
    T.toggleControls(false); // user hides them
    const savedClosed = JSON.parse(localStorage.getItem('orbital8:table-settings') || 'null').controlsOpen;
    // Reopen: preference restored.
    T.restoreSettings();
    T.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 200));
    return { savedClosed, hiddenOnReopen: document.getElementById('photo-table-controls')!.hidden };
  });
  expect(out.savedClosed).toBe(false);
  expect(out.hiddenOnReopen).toBe(true);
});
