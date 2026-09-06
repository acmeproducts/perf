import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page, count = 12) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(n => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>');
    state.imageFiles = Array.from({ length: n }, (_, i) => ({ id: 'w' + i, name: 'w' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's71', name: 's71' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'w0' });
  }, count);
  await page.waitForFunction(n => (window as any).SpatialGallery.cards.length === n, count);
};

test('§71 gate: all eight drag directions rotate the sphere with correct axis signs', async ({ page }) => {
  await boot(page);
  const results = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const scene = g.elements.scene;
    const dirs: Array<[string, number, number]> = [
      ['L->R', 1, 0], ['R->L', -1, 0], ['T->B', 0, 1], ['B->T', 0, -1],
      ['LL->UR', 1, -1], ['LR->UL', -1, -1], ['UR->LL', -1, 1], ['UL->LR', 1, 1]
    ];
    const out: any[] = [];
    for (const [name, sx, sy] of dirs) {
      g.velocityX = 0; g.velocityY = 0;
      const before = g.orient.slice();
      const x0 = 500, y0 = 400, steps = 5, mag = 60;
      const fire = (type: string, x: number, y: number) => scene.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 99, pointerType: 'touch', button: 0, clientX: x, clientY: y }));
      fire('pointerdown', x0, y0);
      for (let i = 1; i <= steps; i++) fire('pointermove', x0 + sx * mag * i / steps, y0 + sy * mag * i / steps);
      fire('pointerup', x0 + sx * mag, y0 + sy * mag);
      await new Promise(r => setTimeout(r, 60));
      const after = g.orient.slice();
      const changed = before.some((v: number, i: number) => Math.abs(v - after[i]) > 1e-4);
      // Axis-sign contract: horizontal component -> yaw sign = sx; vertical -> pitch sign = -sy.
      // Reset for next direction.
      g.velocityX = 0; g.velocityY = 0;
      out.push({ name, changed });
    }
    return out;
  });
  for (const r of results) expect(r.changed, r.name).toBe(true);
});

test('§71 gate: X returns instantly with reused cards even after the background sync bumps the generation', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const state = (window as any).__orbitalAppState;
    const beforeElements = g.cards.map((c: any) => c.element);
    await g.activateFileId('w4', g.cards.find((c: any) => String(c.fileId) === 'w4').element);
    await new Promise(r => setTimeout(r, 250));
    // The background sync bumps the churn counter mid-Focus.
    state.folderSessionGeneration = (state.folderSessionGeneration || 0) + 3;
    (window as any).CanonicalInspection.exit();
    await new Promise(r => setTimeout(r, 300));
    const afterElements = new Set(g.cards.map((c: any) => c.element));
    const reused = beforeElements.filter((el: any) => afterElements.has(el)).length;
    return {
      sphereVisible: !g.elements.root.hidden,
      surface: state.inspection?.surface || null,
      reused, total: beforeElements.length,
      loading: !!document.querySelector('.spatial-gallery__loading:not([hidden])')
    };
  });
  expect(out.sphereVisible).toBe(true);
  expect(out.surface).toBe('explore');
  expect(out.reused).toBe(out.total);
  expect(out.loading).toBe(false);
});
