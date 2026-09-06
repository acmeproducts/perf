import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="olive"/></svg>');
    state.imageFiles = Array.from({ length: 10 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's82', name: 's82' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};

test('§82 focus-exit resume no longer depends on the churn generation counter', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const state = (window as any).__orbitalAppState;
    g.open({ stackName: 'in', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const before = g.cards.map((c: any) => c.element);
    await g.activateFileId('t4', g.cards.find((c: any) => String(c.fileId) === 't4').element);
    await new Promise(r => setTimeout(r, 200));
    state.folderSessionGeneration = (state.folderSessionGeneration || 0) + 5; // background churn
    (window as any).CanonicalInspection.exit();
    await new Promise(r => setTimeout(r, 300));
    const after = new Set(g.cards.map((c: any) => c.element));
    const reused = before.filter((el: any) => after.has(el)).length;
    return { sphereVisible: !g.elements.root.hidden, reused, total: before.length };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.reused).toBe(out.total); // reused, not rebuilt — the veil covers the brief swap
});

test('§82 the leaving-Focus veil element exists and is green', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(() => {
    const veil = document.getElementById('leaving-focus-veil')!;
    const spinner = veil.querySelector('.leaving-focus-spinner')!;
    return { exists: !!veil, color: getComputedStyle(veil).color, spinnerBorder: getComputedStyle(spinner).borderTopColor };
  });
  expect(out.exists).toBe(true);
  // #39ff14 = rgb(57,255,20)
  expect(out.color).toBe('rgb(57, 255, 20)');
  expect(out.spinnerBorder).toBe('rgb(57, 255, 20)');
});

test('§82 exiting Table to Sort rearms the center double-tap (ModeCenterTap reset, lastHubTap cleared)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).PhotoTable.open({ stackName: 'in', fileId: 't2' });
    await new Promise(r => setTimeout(r, 250));
    // Dirty the gesture state as a real table session would.
    (window as any).Gestures.lastHubTap = { time: 123456, x: 10, y: 10, fileId: 't2', stackName: 'in' };
    (window as any).PhotoTable.exit();
    await new Promise(r => setTimeout(r, 300));
    return {
      tableHidden: (window as any).PhotoTable.elements.root.hidden,
      hubReset: (window as any).Gestures.lastHubTap.time === 0 && (window as any).Gestures.lastHubTap.fileId === null,
      focusMode: state.isFocusMode
    };
  });
  expect(out.tableHidden).toBe(true);
  expect(out.hubReset).toBe(true);
  expect(out.focusMode).toBe(false);
});

test('§82 table floating controls: persisted scale/limit are shown in the labels after init', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const table = (window as any).PhotoTable;
    table.imageScale = 1.3; table.imageLimit = 40; table.persistSettings();
    // Re-init from scratch.
    table.imageScale = 1; table.imageLimit = 24;
    table.init();
    return { scale: table.imageScale, limit: table.imageLimit, scaleLabel: document.getElementById('photo-table-scale')!.textContent, limitLabel: document.getElementById('photo-table-limit')!.textContent };
  });
  expect(out.scale).toBeCloseTo(1.3, 5);
  expect(out.limit).toBe(40);
  expect(out.scaleLabel).toBe('130%');
  expect(out.limitLabel).toBe('40');
});
