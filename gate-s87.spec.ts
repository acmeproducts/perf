import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery && !!(window as any).PhotoTable);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 20 }, (_, i) => mk('k' + i, i, 'priority')).concat(Array.from({ length: 8 }, (_, i) => mk('r' + i, i + 40, 'trash')));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};

test('§87 returning to a previously-built stack reuses its cached cards (no full rebuild)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    // Build KEEP globe.
    g.open({ stackName: 'priority', fileId: 'k0' });
    await new Promise(r => setTimeout(r, 300));
    const keepElements = g.cards.map((c: any) => c.element);
    // Switch to TRASH (builds trash, caches keep on close).
    g.close({ force: true });
    g.open({ stackName: 'trash', fileId: 'r0' });
    await new Promise(r => setTimeout(r, 300));
    // Return to KEEP — must reuse the cached card elements.
    g.close({ force: true });
    g.open({ stackName: 'priority', fileId: 'k0' });
    await new Promise(r => setTimeout(r, 300));
    const afterReturn = new Set(g.cards.map((c: any) => c.element));
    const reused = keepElements.filter((el: any) => afterReturn.has(el)).length;
    return { reused, total: keepElements.length, stack: g.stackName };
  });
  expect(out.stack).toBe('priority');
  expect(out.reused).toBeGreaterThanOrEqual(Math.floor(out.total * 0.8)); // cached cards reused
});

test('§87 returning after an insert reconciles the delta (old cards kept, new card added)', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const state = (window as any).__orbitalAppState;
    g.open({ stackName: 'priority', fileId: 'k0' });
    await new Promise(r => setTimeout(r, 300));
    const before = g.cards.map((c: any) => c.element);
    g.close({ force: true });
    // Insert a new file into KEEP while away.
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles.push({ id: 'kNEW', name: 'kNEW', stack: 'priority', stackSequence: 999, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    (window as any).Core.initializeStacks();
    g.open({ stackName: 'priority', fileId: 'k0' });
    await new Promise(r => setTimeout(r, 300));
    const after = new Set(g.cards.map((c: any) => c.element));
    const reused = before.filter((el: any) => after.has(el)).length;
    const hasNew = g.files.some((f: any) => f.id === 'kNEW');
    return { reused, total: before.length, hasNew };
  });
  expect(out.hasNew).toBe(true);
  expect(out.reused).toBeGreaterThanOrEqual(Math.floor(out.total * 0.8));
});

test('§87 table floating controls: persisted scale/limit are shown in labels after init', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(() => {
    const table = (window as any).PhotoTable;
    table.imageScale = 1.4; table.imageLimit = 42; table.persistSettings();
    table.imageScale = 1; table.imageLimit = 24;
    table.init();
    return { scale: table.imageScale, limit: table.imageLimit, scaleLabel: document.getElementById('photo-table-scale')!.textContent, limitLabel: document.getElementById('photo-table-limit')!.textContent };
  });
  expect(out.scale).toBeCloseTo(1.4, 5);
  expect(out.limit).toBe(42);
  expect(out.scaleLabel).toBe('140%');
  expect(out.limitLabel).toBe('42');
});
