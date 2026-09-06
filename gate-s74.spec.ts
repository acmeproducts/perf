import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).Grid);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="sienna"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url: svg }, medium: { url: svg }, large: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 8 }, (_, i) => mk('a' + i, i, 'in')).concat(Array.from({ length: 6 }, (_, i) => mk('b' + i, i + 20, 'out')));
    state.currentFolder = { id: 's74', name: 's74' };
    state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  });
};

test('§74a same-stack: grid close keeps the mid-stack current image on center stage', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('a4', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    return { id: String(state.currentFileId), stack: state.currentStack,
      posId: String((state.stacks[state.currentStack] || [])[state.currentStackPosition]?.id || '') };
  });
  expect(out.id).toBe('a4');
  expect(out.stack).toBe('in');
  expect(out.posId).toBe('a4');
});

test('§74b cross-stack: closing a grid for another stack leaves the current image and stack untouched', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('a3', 'in', { allowCrossStack: false });
    (window as any).Grid.open('out', {});
    await new Promise(r => setTimeout(r, 150));
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    return { id: String(state.currentFileId), stack: state.currentStack };
  });
  expect(out.id).toBe('a3');
  expect(out.stack).toBe('in');
});

test('§74c moved: the current image is FOLLOWED to its new stack (identity over position); deletion falls back cleanly', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    (window as any).CurrentImage.set('a2', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    // Simulate the grid moving the current image out of its stack.
    const file = state.imageFiles.find((f: any) => f.id === 'a2');
    file.stack = 'out';
    (window as any).Core.initializeStacks();
    state.grid.isDirty = false;
    const result = await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    const followed = { id: String(state.currentFileId), stack: state.currentStack };
    // Deletion case: current removed from every stack -> clean fallback to the grid stack.
    (window as any).CurrentImage.set('a5', 'in', { allowCrossStack: false });
    (window as any).Grid.open('in', {});
    await new Promise(r => setTimeout(r, 150));
    state.imageFiles = state.imageFiles.filter((f: any) => f.id !== 'a5');
    (window as any).Core.initializeStacks();
    state.grid.isDirty = false;
    await (window as any).Grid.close();
    await new Promise(r => setTimeout(r, 200));
    return { followed, afterDeleteId: String(state.currentFileId), afterDeleteInStack: (state.stacks.in || []).some((f: any) => String(f.id) === String(state.currentFileId)) };
  });
  expect(out.followed.id).toBe('a2');
  expect(out.followed.stack).toBe('out');
  expect(out.afterDeleteId).not.toBe('a5');
  expect(out.afterDeleteInStack).toBe(true);
});
