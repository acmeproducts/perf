import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const uiUrl = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')).href;
test.use({ viewport: { width: 1100, height: 800 }, hasTouch: true });

const colors = { a: '#ef4444', b: '#22c55e', c: '#3b82f6', d: '#a855f7' } as const;
const svg = (id: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="${colors[id as keyof typeof colors] || '#eab308'}"/><text x="40" y="55" text-anchor="middle" font-size="30">${id}</text></svg>`)}`;

async function boot(page: Page, count = 4) {
  await page.goto(uiUrl);
  await page.waitForFunction(() => Boolean((window as any).__orbitalAppState && (window as any).SpatialGallery));
  await page.evaluate(({ sources, count }) => {
    const w = window as any;
    const state = w.__orbitalAppState;
    state.imageFiles = Array.from({length: count}, (_, i) => String.fromCharCode(97 + i)).map((id, index) => ({
      id, name: id, tags: index > 0 && index <= 10 ? ['match'] : [], stack: 'in', stackSequence: 40 - index * 10, metadataStatus: 'loaded',
      thumbnails: { small: { url: sources[id] }, medium: { url: sources[id] }, large: { url: sources[id] } },
      downloadUrl: sources[id]
    }));
    state.currentFolder = { id: 'canonical-regression', name: 'canonical-regression' };
    state.folderSessionGeneration += 1;
    state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentFileId = 'a';
    state.currentStackPosition = 0; state.stacks = { in: [], out: [], priority: [], trash: [] };
    state.syncManager.stop?.(); state.syncManager = null;
    state.provider = { deleteFile: async () => true };
    w.Core.initializeStacks();
    w.Utils.showScreen('app-container');
    w.__sources = sources;
  }, { sources: Object.fromEntries(Array.from({length: count}, (_, i) => {
    const id = String.fromCharCode(97 + i); return [id, svg(id)];
  })), count });
  await page.evaluate(async () => {
    const w = window as any;
    await Promise.all(w.__orbitalAppState.imageFiles.map((f: any) => w.SharedImageResources.ensure(f, 'thumb')));
    await w.Core.displayCurrentImage();
    w.__frameErrors = [];
    const observe = () => {
      const s = w.__orbitalAppState, image = document.querySelector<HTMLImageElement>('#center-image')!;
      if (document.querySelector('#app-container')!.classList.contains('focus-mode')) {
        const binding = w.SharedImageResources.bindings.get(image), expected = String(s.currentFileId);
        const values = [s.inspection.requestedFileId, s.inspection.fileId, binding?.fileId, image.dataset.fileId, s.stacks[s.currentStack][0]?.id];
        if (values.some(id => String(id) !== expected) || image.getAttribute('src') !== w.__sources[expected] || getComputedStyle(image).opacity !== '1') w.__frameErrors.push({ expected, values, src: image.getAttribute('src') });
      }
      for (const [rootSelector, itemSelector, stack] of [
        ['#grid-modal', '.grid-item', s.grid.stack], ['#spatial-gallery', '.spatial-gallery__card', w.SpatialGallery.stackName],
        ['#photo-table', '.photo-table__print', w.PhotoTable.stackName]
      ]) {
        const root = document.querySelector(rootSelector);
        if (!root || !root.getClientRects().length || root.hidden || getComputedStyle(root).display === 'none') continue;
        const canonical = (s.stacks[stack] || []).map((f: any) => String(f.id)); let last = -1;
        for (const node of root.querySelectorAll(itemSelector)) {
          const next = canonical.indexOf(node.dataset.fileId);
          if (next <= last) w.__frameErrors.push({ rootSelector, canonical, id: node.dataset.fileId });
          last = next;
        }
      }
      requestAnimationFrame(observe);
    }; requestAnimationFrame(observe);
  });
}

async function ids(page: Page) {
  return page.evaluate(() => {
    const w = window as any;
    const state = w.__orbitalAppState;
    return {
      canonical: state.stacks.in.map((file: any) => String(file.id)),
      grid: [...document.querySelectorAll<HTMLElement>('.grid-item')].map(node => node.dataset.fileId),
      explore: w.SpatialGallery.cards.map((card: any) => String(card.element.dataset.fileId)),
      table: w.PhotoTable.photos.map((photo: any) => String(photo.element.dataset.fileId))
    };
  });
}

test.afterEach(async ({ page }) => {
  if (!page.isClosed()) expect(await page.evaluate(() => (window as any).__frameErrors || [])).toEqual([]);
});

async function expectHead(page: Page, id: string) {
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg(id));
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__orbitalAppState;
    return [s.currentFileId, s.stacks[s.currentStack][0]?.id, s.currentStackPosition];
  })).toEqual([id, id, 0]);
}

async function expectGrid(page: Page, expected: string[], stack = 'in', origin: any = null) {
  await page.evaluate(({ stack, origin }) => (window as any).Grid.open(stack, { origin }), { stack, origin });
  await expect(page.locator('.grid-item')).toHaveCount(expected.length);
  expect(await page.locator('.grid-item').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.fileId))).toEqual(expected);
  for (const [index, id] of expected.entries()) await expect(page.locator('.grid-item img').nth(index)).toHaveAttribute('src', svg(id));
  await page.locator('#close-grid').click();
  await expect(page.locator('#grid-modal')).toBeHidden();
}

async function paintTiming(page: Page, event: 'pointerup' | 'keydown', expectedId?: string) {
  await page.evaluate(({ event, expectedId }) => {
    const w = window as any; w.__paintMs = null;
    document.addEventListener(event, () => {
      const start = performance.now();
      const check = () => {
        const image = document.querySelector<HTMLImageElement>('#center-image')!;
        const done = expectedId ? image.getAttribute('src') === w.__sources[expectedId] && getComputedStyle(image).opacity === '1'
          : !document.querySelector('#app-container')!.classList.contains('focus-mode');
        if (done) w.__paintMs = performance.now() - start; else requestAnimationFrame(check);
      }; requestAnimationFrame(check);
    }, { capture: true, once: true });
  }, { event, expectedId });
}

async function expectFastPaint(page: Page) {
  await page.waitForFunction(() => (window as any).__paintMs !== null);
  expect(await page.evaluate(() => (window as any).__paintMs)).toBeLessThan(100);
}

function expectCanonicalSubsequence(canonical: string[], surface: (string | undefined)[]) {
  let cursor = -1;
  for (const id of surface) {
    const next = canonical.indexOf(String(id), cursor + 1);
    expect(next, `${id} must retain canonical relative order`).toBeGreaterThan(cursor);
    cursor = next;
  }
}

async function expectFocusInvariant(page: Page, expectedId: string) {
  await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);
  const frame = await page.evaluate(() => {
    const w = window as any;
    const state = w.__orbitalAppState;
    const image = document.querySelector<HTMLImageElement>('#center-image')!;
    const binding = w.SharedImageResources.bindings.get(image);
    return {
      requested: String(state.inspection.requestedFileId), current: String(state.currentFileId),
      inspection: String(state.inspection.fileId), resource: String(binding?.fileId), image: String(image.dataset.fileId),
      position: String(state.stacks[state.currentStack][0]?.id)
    };
  });
  expect(new Set(Object.values(frame))).toEqual(new Set([expectedId]));
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg(expectedId));
  await expect(page.locator('#center-image')).toHaveCSS('opacity', '1');
}

async function openExplore(page: Page, fileId = 'a', count = 4) {
  await page.evaluate((id) => (window as any).SpatialGallery.open({ stackName: 'in', fileId: id }), fileId);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  await expect(page.locator('.spatial-gallery__card')).toHaveCount(count);
  await page.waitForFunction(() => {
    const gallery = (window as any).SpatialGallery;
    return !gallery.frameId && gallery.cards.every((card: any) => card.renderCache?.transform);
  });
}

async function tapCard(page: Page, id: string, touch: boolean) {
  const card = page.locator(`.spatial-gallery__card[data-file-id="${id}"]`);
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2, y = box!.y + box!.height / 2;
  expect(await page.evaluate(({x,y}) => document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-file-id]')?.dataset.fileId, {x,y})).toBe(id);
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

test('all rendered surfaces preserve the one canonical stable-ID sequence', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).Grid.open('in'));
  await expect(page.locator('.grid-item')).toHaveCount(4);
  let order = await ids(page);
  expect(order.grid).toEqual(order.canonical);
  await page.evaluate(() => (window as any).Grid.close());

  await openExplore(page, 'c');
  order = await ids(page);
  expectCanonicalSubsequence(order.canonical, order.explore);
  await page.evaluate(() => (window as any).SpatialGallery.close({ restoreFocus: false, force: true }));

  await page.evaluate(() => (window as any).PhotoTable.open({ stackName: 'in', fileId: 'c' }));
  await expect(page.locator('.photo-table__print')).toHaveCount(4);
  order = await ids(page);
  expectCanonicalSubsequence(order.canonical, order.table);
});

test('real Grid reorder persists through reinitialization and Focus traverses canonical order', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).Grid.open('in'));
  const first = page.locator('.grid-item[data-file-id="a"] .grid-drag-handle');
  const target = page.locator('.grid-item[data-file-id="c"]');
  const from = await first.boundingBox(), to = await target.boundingBox();
  expect(from && to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 8 });
  await page.mouse.up();
  const canonical = ['b', 'a', 'c', 'd'];
  await expect.poll(async () => (await ids(page)).grid).toEqual(canonical);
  await page.evaluate(() => (window as any).Core.initializeStacks());
  expect((await ids(page)).canonical).toEqual(canonical);
  await page.locator(`.grid-item[data-file-id="${canonical[0]}"] .grid-focus-button`).click();
  await expectFocusInvariant(page, canonical[0]);
  for (const expected of canonical.slice(1)) {
    await page.keyboard.press('ArrowRight');
    await expectFocusInvariant(page, expected);
  }
});

test('touch middle-card tap keeps exact identity even with a poisoned coordinate picker', async ({ page }) => {
  await boot(page);
  await openExplore(page);
  await page.evaluate(() => { (window as any).SpatialGallery.cardAtPoint = () => { throw new Error('coordinate picker must not run for a rendered card target'); }; });
  await tapCard(page, 'b', true);
  await expectFocusInvariant(page, 'b');
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg('b'));
});

test('real touch drag is mutually exclusive with Focus activation', async ({ page }) => {
  await boot(page);
  await openExplore(page);
  const card = page.locator('.spatial-gallery__card[data-file-id="b"]');
  const box = await card.boundingBox(); expect(box).not.toBeNull();
  await page.evaluate(() => { (window as any).__focusEnters = 0; document.querySelector('#app-container')?.addEventListener('transitionend', () => {}); });
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expectFocusInvariant(page, 'b');
  await page.locator('#focus-origin-close').click();
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  const scene = page.locator('.spatial-gallery__scene');
  const sceneBox = await scene.boundingBox(); expect(sceneBox).not.toBeNull();
  const cdp = await page.context().newCDPSession(page);
  const start = { x: sceneBox!.x + sceneBox!.width * .5, y: sceneBox!.y + sceneBox!.height * .5 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 180, y: start.y + 80 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
});

test('desktop click opens exact card and visual identity is not decorated', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).Grid.open('in'));
  await expect(page.locator('.grid-item.current')).toHaveCSS('box-shadow', 'none');
  await page.evaluate(() => (window as any).Grid.close());
  await openExplore(page);
  const selected = page.locator('.spatial-gallery__card.selected');
  await expect(selected).toHaveCSS('border-color', 'rgba(255, 255, 255, 0.7)');
  await tapCard(page, 'b', false);
  await expectFocusInvariant(page, 'b');
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg('b'));
});

test('Focus exit hides immediately, retains Explore nodes, and blocks trailing click', async ({ page }) => {
  await boot(page); await openExplore(page);
  const handles = await page.locator('.spatial-gallery__card').evaluateAll(nodes => nodes.map(node => (node as any).__testHandle = crypto.randomUUID()));
  await tapCard(page, 'b', false); await expectFocusInvariant(page, 'b');
  const close = page.locator('#focus-origin-close'); const box = await close.boundingBox(); expect(box).not.toBeNull();
  await page.evaluate(() => {
    const root = document.querySelector('#app-container')!; (window as any).__exitStart = performance.now();
    document.addEventListener('pointerup', () => { (window as any).__exitStart = performance.now(); }, {capture: true, once: true});
    new MutationObserver((_, observer) => {
      if (!root.classList.contains('focus-mode')) { observer.disconnect(); (window as any).__exitElapsed = performance.now() - (window as any).__exitStart; }
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
  });
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForFunction(() => Number.isFinite((window as any).__exitElapsed));
  const elapsed = await page.evaluate(() => (window as any).__exitElapsed as number);
  expect(elapsed).toBeLessThan(50);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  const retained = await page.locator('.spatial-gallery__card').evaluateAll(nodes => nodes.map(node => (node as any).__testHandle));
  expect(retained.slice().sort()).toEqual(handles.slice().sort());
  // mouse.up already delivered the trailing native click from the same gesture.
  await expect(page.locator('#spatial-gallery')).toBeVisible();
});

test('Focus forward, back and delete update image zero and subsequent Grid order', async ({ page }) => {
  await boot(page); await openExplore(page); await tapCard(page, 'b', true); await expectFocusInvariant(page, 'b');
  await paintTiming(page, 'keydown', 'c'); await page.keyboard.press('ArrowRight'); await expectFocusInvariant(page, 'c'); await expectFastPaint(page);
  await paintTiming(page, 'keydown', 'b'); await page.keyboard.press('ArrowLeft'); await expectFocusInvariant(page, 'b'); await expectFastPaint(page);
  await page.locator('#focus-delete-btn').click(); await expectFocusInvariant(page, 'c');
  await expectGrid(page, ['c', 'd', 'a'], 'in', { surface: 'focus', focusOrigin: 'explore' });
  await expectFocusInvariant(page, 'c');
});

test('Sort moves use image zero in both source and destination stacks', async ({ page }) => {
  await boot(page);
  await page.keyboard.press('ArrowRight'); await expectHead(page, 'b');
  await expectGrid(page, ['b', 'c', 'd']); await expectHead(page, 'b');
  await page.keyboard.press('ArrowRight'); await expectHead(page, 'c');
  await expectGrid(page, ['b', 'a'], 'out'); await expectHead(page, 'b');
  await page.keyboard.press('ArrowLeft'); await expectHead(page, 'a');
  await expectGrid(page, ['b', 'c', 'd'], 'in'); await expectHead(page, 'b');
});

test('ten search results become the first ten items and survive persisted reinitialization', async ({ page }) => {
  await boot(page, 12); await page.evaluate(() => (window as any).Grid.open('in'));
  await page.locator('#omni-search').fill('#match'); await expect(page.locator('.grid-item')).toHaveCount(10);
  await page.locator('#close-grid').click(); await expectHead(page, 'b');
  const expected = ['b','c','d','e','f','g','h','i','j','k','a','l'];
  await expectGrid(page, expected);
  await expect.poll(() => page.evaluate(async () => {
    const s = (window as any).__orbitalAppState;
    const files = await s.dbManager.getFolderCache(s.currentFolder.id);
    return files?.slice().sort((a: any,b: any) => b.stackSequence - a.stackSequence).map((f: any) => f.id);
  })).toEqual(expected);
  await page.evaluate(async () => {
    const w = window as any, s = w.__orbitalAppState;
    s.imageFiles = await s.dbManager.getFolderCache(s.currentFolder.id);
    s.currentFileId = null; s.stacks = { in: [], out: [], priority: [], trash: [] };
    w.Core.initializeStacks(); await w.Core.displayCurrentImage();
  });
  await expectGrid(page, expected); await expectHead(page, 'b');
});

for (const target of ['a', 'e']) test(`group drag leads with dragged image at ${target === 'a' ? 'zero' : 'nonzero'} position`, async ({ page }) => {
  await boot(page, 6); await page.evaluate(() => (window as any).Grid.open('in'));
  for (const id of ['b','c','d']) await page.locator(`.grid-item[data-file-id="${id}"]`).click();
  const from = await page.locator('.grid-item[data-file-id="d"] .grid-drag-handle').boundingBox();
  const to = await page.locator(`.grid-item[data-file-id="${target}"]`).boundingBox();
  expect(from && to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2); await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 }); await page.mouse.up();
  const expected = target === 'a' ? ['d','b','c','a','e','f'] : ['a','d','b','c','e','f'];
  await expect.poll(() => page.locator('.grid-item').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.fileId))).toEqual(expected);
  await page.locator('#close-grid').click(); await expectHead(page, expected[0]);
  await expectGrid(page, expected); await expectHead(page, expected[0]);
});

for (const origin of ['table', 'sort']) test(`Focus exit paints immediately back to ${origin}`, async ({ page }) => {
  await boot(page);
  if (origin === 'table') {
    await page.evaluate(() => (window as any).PhotoTable.open({ stackName: 'in', fileId: 'a' }));
    await page.locator('.photo-table__print[data-file-id="a"]').click();
  } else {
    await page.evaluate(() => (window as any).Grid.open('in'));
    await page.locator('.grid-item[data-file-id="b"] .grid-focus-button').click();
  }
  await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);
  await paintTiming(page, 'pointerup'); await page.locator('#focus-origin-close').click(); await expectFastPaint(page);
  if (origin === 'table') await expect(page.locator('#photo-table')).toBeVisible();
  else await expectHead(page, 'b');
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
});

test('spinning retains card nodes and image sources without visibility flicker or Focus activation', async ({ page }) => {
  await boot(page, 60); await openExplore(page, 'a', 60);
  await expect(page.locator('.spatial-gallery__loading')).toBeHidden();
  await page.evaluate(() => {
    const w = window as any; w.__churn = []; w.__hiddenFrames = 0;
    const scene = document.querySelector('.spatial-gallery__scene')!;
    new MutationObserver(records => {
      for (const r of records) if (r.type === 'childList' || r.attributeName === 'src') w.__churn.push(r.type);
    }).observe(scene, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    const check = () => {
      if ([...scene.querySelectorAll('.spatial-gallery__card')].some(n => getComputedStyle(n).visibility === 'hidden')) w.__hiddenFrames++;
      requestAnimationFrame(check);
    }; requestAnimationFrame(check);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 550, y: 400 }] });
  for (let x = 580; x <= 1000; x += 30) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 430 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => !(window as any).SpatialGallery.frameId);
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  expect(await page.evaluate(() => [(window as any).__churn, (window as any).__hiddenFrames])).toEqual([[], 0]);
  for (const card of await page.locator('.spatial-gallery__card').all()) await expect(card).toHaveCSS('border-color', 'rgba(255, 255, 255, 0.7)');
});

test('a delayed Focus navigation cannot repaint or change image zero after exit', async ({ page }) => {
  await boot(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://images.test/**', async route => {
    await gate;
    await route.fulfill({ contentType: 'image/svg+xml', body: decodeURIComponent(svg('z').split(',')[1]) });
  });
  await page.evaluate(() => {
    const w = window as any, s = w.__orbitalAppState, url = 'https://images.test/z.svg';
    const file = { id: 'z', name: 'z', stack: 'in', stackSequence: -100, metadataStatus: 'loaded',
      thumbnails: { small: { url }, medium: { url }, large: { url } }, downloadUrl: url };
    s.imageFiles.push(file); s.stacks.in.push(file); w.__sources.z = url;
    w.Grid.open('in');
  });
  await page.locator('.grid-item[data-file-id="a"] .grid-focus-button').click();
  await expectFocusInvariant(page, 'a');
  await page.keyboard.press('ArrowLeft');
  await expectFocusInvariant(page, 'a');
  await page.locator('#focus-origin-close').click();
  release();
  await page.waitForFunction(() => {
    const w = window as any;
    return w.SharedImageResources.resolve(w.__orbitalAppState.imageFiles.find((f: any) => f.id === 'z'), 'thumb').readyState === 'loaded';
  });
  await expectHead(page, 'a');
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
});
