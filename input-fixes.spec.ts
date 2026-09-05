import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const setup = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = (c: string) => 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="' + c + '"/></svg>');
    const files = Array.from({ length: 12 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'in', stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg('#'+(100+i*10).toString(16)+'8899') }, medium: { url: svg('#'+(100+i*10).toString(16)+'8899') }, large: { url: svg('#'+(100+i*10).toString(16)+'8899') } },
      downloadUrl: svg('#'+(100+i*10).toString(16)+'8899') }));
    state.imageFiles = files;
    state.currentFolder = { id: 'input', name: 'input' };
    state.providerType = 'test-provider';
    state.currentStack = 'in';
    state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'p0' });
  });
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 12);
};

test('overlapping cards: the pick is the highest z-index card, not the nearest center', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => {
    const g = (window as any).SpatialGallery;
    const a = g.cards[0], b = g.cards[1];
    // b is painted ON TOP; a's center is CLOSER to the probe point.
    a.element.style.cssText += ';position:fixed;left:100px;top:100px;width:200px;height:200px;margin:0;transform:none;z-index:100;visibility:visible;';
    b.element.style.cssText += ';position:fixed;left:150px;top:150px;width:200px;height:200px;margin:0;transform:none;z-index:900;visibility:visible;';
    // probe at (205,205): inside both; a's center (200,200) is nearer than b's (250,250).
    const hit = g.cardAtPoint(205, 205);
    return { hit: hit ? String(hit.fileId) : null, top: String(b.fileId), nearestCenter: String(a.fileId) };
  });
  expect(result.hit).toBe(result.top);
  expect(result.hit).not.toBe(result.nearestCenter);
});

test('a second impatient tap on the Focus X cannot fire a second exit', async ({ page }) => {
  await setup(page);
  const out = await page.evaluate(async () => {
    const g = (window as any).SpatialGallery;
    const CI = (window as any).CanonicalInspection;
    let exits = 0;
    const originalExit = CI.exit.bind(CI);
    CI.exit = () => { exits++; return originalExit(); };
    await g.activateFileId(String(g.cards[2].fileId), g.cards[2].element);
    const btn = document.getElementById('focus-origin-close') as HTMLButtonElement;
    const enabledOnEnter = btn && !btn.disabled;
    // First tap: pointerup exits immediately.
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, button: 0 }));
    // Impatient second tap + the first tap's trailing click.
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 8, button: 0 }));
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return { enabledOnEnter, exits, disabledAfter: btn.disabled };
  });
  expect(out.enabledOnEnter).toBe(true);
  expect(out.exits).toBe(1);
  expect(out.disabledAfter).toBe(true);
});
