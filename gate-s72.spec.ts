import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="coral"/></svg>');
    state.imageFiles = Array.from({ length: 20 }, (_, i) => ({ id: 'n' + i, name: 'n' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 's72', name: 's72' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'n0' });
  });
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 20);
};

const dragSeq = `
  const g = (window as any).SpatialGallery;
  const scene = g.elements.scene;
  const fire = (type, x, y) => scene.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 77, pointerType: 'touch', button: 0, clientX: x, clientY: y }));
  const drag = async (sx, sy, mag) => {
    g.velocityX = 0; g.velocityY = 0;
    const x0 = 500, y0 = 400, steps = 6;
    fire('pointerdown', x0, y0);
    for (let i = 1; i <= steps; i++) fire('pointermove', x0 + sx * mag * i / steps, y0 + sy * mag * i / steps);
    fire('pointerup', x0 + sx * mag, y0 + sy * mag);
    g.velocityX = 0; g.velocityY = 0;
    await new Promise(r => setTimeout(r, 40));
  };
`;

test('§72 gate: retrace invariant — right, down, left, up returns exactly to start', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const scene = g.elements.scene;
    const fire = (type: string, x: number, y: number) => scene.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 77, pointerType: 'touch', button: 0, clientX: x, clientY: y }));
    const drag = async (sx: number, sy: number, mag: number) => {
      g.velocityX = 0; g.velocityY = 0;
      const x0 = 500, y0 = 400, steps = 6;
      fire('pointerdown', x0, y0);
      for (let i = 1; i <= steps; i++) fire('pointermove', x0 + sx * mag * i / steps, y0 + sy * mag * i / steps);
      fire('pointerup', x0 + sx * mag, y0 + sy * mag);
      g.velocityX = 0; g.velocityY = 0;
      await new Promise(r => setTimeout(r, 40));
    };
    const before = g.orient.slice();
    await drag(1, 0, 90); await drag(0, 1, 70); await drag(-1, 0, 90); await drag(0, -1, 70);
    const after = g.orient.slice();
    const drift = Math.max(...before.map((v: number, i: number) => Math.abs(v - after[i])));
    return { drift };
  });
  expect(out.drift).toBeLessThan(1e-6);
});

test('§72 gate: roll is unrepresentable after arbitrary mixed drags', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const scene = g.elements.scene;
    const fire = (type: string, x: number, y: number) => scene.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 77, pointerType: 'touch', button: 0, clientX: x, clientY: y }));
    const drag = async (sx: number, sy: number, mag: number) => {
      g.velocityX = 0; g.velocityY = 0;
      const x0 = 500, y0 = 400, steps = 6;
      fire('pointerdown', x0, y0);
      for (let i = 1; i <= steps; i++) fire('pointermove', x0 + sx * mag * i / steps, y0 + sy * mag * i / steps);
      fire('pointerup', x0 + sx * mag, y0 + sy * mag);
      g.velocityX = 0; g.velocityY = 0;
      await new Promise(r => setTimeout(r, 30));
    };
    let maxRoll = 0;
    const seq: Array<[number, number, number]> = [[1,1,80],[-1,1,60],[1,-1,110],[0,1,50],[-1,0,140],[1,1,35],[-1,-1,95]];
    for (const [sx, sy, mag] of seq) { await drag(sx, sy, mag); maxRoll = Math.max(maxRoll, Math.abs(g.orient[1])); }
    return { maxRoll };
  });
  expect(out.maxRoll).toBeLessThan(1e-9);
});
