import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
const { PNG } = createRequire(import.meta.url)('pngjs');

const uiUrl = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')).href;
test.use({ hasTouch: true });

const colors = { a: '#ef4444', b: '#22c55e', c: '#3b82f6', d: '#a855f7' } as const;
const svg = (id: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="${colors[id as keyof typeof colors] || '#eab308'}"/><text x="40" y="55" text-anchor="middle" font-size="30">${id}</text></svg>`)}`;

function raster(id: string) {
  const png = new PNG({width:384,height:256}), code = id.charCodeAt(0);
  for (let y=0;y<png.height;y++) for (let x=0;x<png.width;x++) {
    const i=(y*png.width+x)*4;
    png.data[i]=225+(x+code)%25; png.data[i+1]=20+(y+code)%20;
    png.data[i+2]=65+(x+y)%25; png.data[i+3]=255;
  }
  return 'data:image/png;base64,'+PNG.sync.write(png).toString('base64');
}

async function boot(page: Page, count = 4, rasterImages = false) {
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
    state.folderSessionGeneration = 1;
    state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentFileId = 'a';
    state.currentStackPosition = 0; state.stacks = { in: [], out: [], priority: [], trash: [] };
    state.syncManager.stop?.(); state.syncManager = null;
    state.provider = { deleteFile: async () => true };
    w.Core.initializeStacks();
    w.Utils.showScreen('app-container');
    w.__sources = sources;
  }, { sources: Object.fromEntries(Array.from({length: count}, (_, i) => {
    const id = String.fromCharCode(97 + i); return [id, rasterImages ? raster(id) : svg(id)];
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
        if (!root || !root.getClientRects().length || root.hidden || root.getAttribute('aria-hidden') === 'true' || getComputedStyle(root).display === 'none') continue;
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
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg(expectedId));
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
  await expect(page.locator('.spatial-gallery__card')).toHaveCount(count, { timeout: 30000 });
  await page.waitForFunction(() => {
    const gallery = (window as any).SpatialGallery;
    return !gallery.frameId && gallery.cards.every((card: any) => card.renderCache?.transform || card.renderCache?.hidden);
  });
}

async function tapCard(page: Page, id: string, touch: boolean) {
  const point = await page.evaluate(id => {
    const card = [...document.querySelectorAll<HTMLElement>('.spatial-gallery__card')].find(c => c.dataset.fileId === id)!;
    const r = card.getBoundingClientRect();
    for (const fy of [.5,.3,.7,.15,.85]) for (const fx of [.5,.3,.7,.15,.85]) {
      const x = r.x + r.width * fx, y = r.y + r.height * fy;
      if (document.elementFromPoint(x,y)?.closest('[data-file-id]') === card) return {x,y};
    } return null;
  }, id);
  expect(point, 'Requested card must have exposed image pixels').not.toBeNull();
  const {x,y} = point!;
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
  await tapCard(page, 'b', true);
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
      if (w.SpatialGallery.cards.some((card: any) => card.depth >= .3 && getComputedStyle(card.element).visibility === 'hidden')) w.__hiddenFrames++;
      requestAnimationFrame(check);
    }; requestAnimationFrame(check);
  });
  const cdp = await page.context().newCDPSession(page);
  const viewport = page.viewportSize()!;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: viewport.width * .35, y: viewport.height * .5 }] });
  for (let step = 1; step <= 15; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: viewport.width * (.35 + step * .035), y: viewport.height * .55 }] });
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

async function platformTap(page: Page, selector: string, touch: boolean) {
  const target = page.locator(selector);
  if (touch) await target.tap(); else await target.click();
}

test('one exit gesture cannot sort an image or open Grid; the next deliberate tap still works', async ({ page }, testInfo) => {
  const touch = testInfo.project.name.includes('android');
  await boot(page);
  await page.evaluate(() => {
    const w = window as any, s = w.__orbitalAppState;
    const file = { ...s.imageFiles[0], id: 'keep-fixture', name: 'keep-fixture', stack: 'priority' };
    s.imageFiles.push(file); s.stacks.priority.push(file); w.Core.updateStackCounts();
  });
  const before = await page.evaluate(() => (window as any).__orbitalAppState.imageFiles.map((f: any) => [f.id, f.stack]));
  for (let attempt = 0; attempt < 3; attempt++) {
    await openExplore(page);
    await platformTap(page, '#spatial-gallery-close', touch);
    await expect(page.locator('#spatial-gallery')).toBeHidden();
    await expect(page.locator('#grid-modal')).toBeHidden();
    expect(await page.evaluate(() => (window as any).__orbitalAppState.imageFiles.map((f: any) => [f.id, f.stack]))).toEqual(before);
    expect(await page.evaluate(() => (window as any).__orbitalAppState.currentStack)).toBe('in');
  }
  await platformTap(page, '#pill-priority', touch);
  await expect.poll(() => page.evaluate(() => (window as any).__orbitalAppState.currentStack)).toBe('priority');
  await expect(page.locator('#grid-modal')).toBeHidden();
  await platformTap(page, '#pill-priority', touch);
  await expect(page.locator('#grid-modal')).toBeVisible();
  await platformTap(page, '#close-grid', touch);
  await expect(page.locator('#grid-modal')).toBeHidden();
});

test('500-card Focus return preserves the already painted globe on its first usable frame', async ({ page }, testInfo) => {
  const touch = testInfo.project.name.includes('android');
  await boot(page, 500); await openExplore(page, 'a', 500);
  const point = await page.evaluate(() => {
    const w = window as any, g = w.SpatialGallery;
    w.__sceneBefore = new Map(g.cards.map((c: any) => [c.fileId, { node: c.element, vector: JSON.stringify(c.vector), transform: c.element.style.transform, src: c.image.src }]));
    w.__orientBefore = JSON.stringify(g.orient);
    for (const card of g.cards) {
      if (card.fileId === 'a') continue;
      const r = card.element.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x > 10 && x < innerWidth - 10 && y > 100 && y < innerHeight - 100 && document.elementFromPoint(x,y)?.closest('[data-file-id]') === card.element) return { x, y, id: card.fileId };
    }
    return null;
  });
  expect(point).not.toBeNull();
  if (touch) await page.touchscreen.tap(point!.x, point!.y); else await page.mouse.click(point!.x, point!.y);
  await expectFocusInvariant(page, point!.id);
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  await expectFocusInvariant(page, point!.id);
  await page.evaluate(() => {
    const w = window as any; w.__returnFrames = []; w.__returnMutations = 0;
    document.addEventListener('pointerup', () => {
      const start = performance.now();
      new MutationObserver(records => { w.__returnMutations += records.filter(r => r.type === 'childList' || r.attributeName === 'src').length; })
        .observe(w.SpatialGallery.elements.scene, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
      const inspect = () => {
        const g = w.SpatialGallery;
        w.__returnFrames.push({ ms: performance.now() - start, focus: w.__orbitalAppState.isFocusMode,
          usable: !g.elements.root.hidden && !g.elements.root.inert && g.elements.root.getAttribute('aria-hidden') !== 'true',
          same: g.orient.every((value: number, i: number) => Math.abs(value - JSON.parse(w.__orientBefore)[i]) < 1e-12) && g.cards.every((card: any) => {
            const before = w.__sceneBefore.get(card.fileId);
            return before.node === card.element && before.vector === JSON.stringify(card.vector) && before.transform === card.element.style.transform && before.src === card.image.src;
          }) });
        if (w.__returnFrames.length < 8) requestAnimationFrame(inspect);
      }; requestAnimationFrame(inspect);
    }, {capture: true, once: true});
  });
  await platformTap(page, '#focus-origin-close', touch);
  await page.waitForFunction(() => (window as any).__returnFrames.length === 8);
  const result = await page.evaluate(() => ({frames: (window as any).__returnFrames, mutations: (window as any).__returnMutations}));
  expect(result.frames[0].ms).toBeLessThan(100);
  expect(result.frames.every((f: any) => !f.focus && f.usable && f.same)).toBe(true);
  expect(result.mutations).toBe(0);
  await testInfo.attach('warm-return-frames', {body: JSON.stringify(result), contentType:'application/json'});
});

test('close drag cancels and keyboard activation remains available', async ({ page }) => {
  await boot(page); await openExplore(page);
  const box = await page.locator('#spatial-gallery-close').boundingBox();
  await page.mouse.move(box!.x + box!.width/2, box!.y + box!.height/2); await page.mouse.down();
  await page.mouse.move(box!.x + 90, box!.y + 90); await page.mouse.up();
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  await page.locator('#spatial-gallery-close').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#spatial-gallery')).toBeHidden();
});

test('500-card bidirectional spin keeps exposed thumbnails painted', async ({ page }, testInfo) => {
  await boot(page, 500); await openExplore(page, 'a', 500);
  const touch = testInfo.project.name.includes('android'), viewport = page.viewportSize()!;
  const cdp = await page.context().newCDPSession(page);
  const start = {x: viewport.width * .35, y: viewport.height * .5};
  if (touch) await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[start]});
  else { await page.mouse.move(start.x,start.y); await page.mouse.down(); }
  for (let phase = 0; phase < 6; phase++) {
    const x = viewport.width * (phase % 2 ? .3 : .8), y = viewport.height * (.48 + phase * .01);
    if (touch) {
      for (let step = 0; step < 4; step++) await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:x + step,y}]});
    } else await page.mouse.move(x,y,{steps:8});
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const samples = await page.evaluate(() => {
      const g = (window as any).SpatialGallery, points: {x:number,y:number}[] = [];
      for (const card of g.cards) {
        if (card.depth < .65) continue;
        const img = card.image, r = img.getBoundingClientRect();
        const x = r.x + r.width * .3, y = r.y + r.height * .3;
        if (x < 12 || x > innerWidth - 12 || y < 100 || y > innerHeight - 90) continue;
        if (document.elementFromPoint(x,y)?.closest('[data-file-id]') !== card.element) continue;
        if (!img.complete || !img.naturalWidth || getComputedStyle(card.element).visibility === 'hidden') throw Error('Exposed thumbnail lost its image');
        points.push({x,y}); if (points.length >= 12) break;
      } return points;
    });
    expect(samples.length).toBeGreaterThan(3);
    const shot = await page.screenshot(), png = PNG.sync.read(shot);
    const scale = png.width / viewport.width;
    for (const point of samples) {
      const offset = (Math.round(point.y * scale) * png.width + Math.round(point.x * scale)) * 4;
      const rgb = [...png.data.subarray(offset,offset+3)];
      expect(Math.max(...rgb)-Math.min(...rgb), 'Thumbnail interior must contain its colored pixels, not a blank frame').toBeGreaterThan(35);
    }
    if (phase === 5) await testInfo.attach('rotated-globe', {body:shot,contentType:'image/png'});
  }
  if (touch) await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]}); else await page.mouse.up();
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
});


test('Focus deletion retains survivor geometry and a reopened globe still rotates', async ({ page }, testInfo) => {
  const touch = testInfo.project.name.includes('android');
  await boot(page); await openExplore(page);
  await page.evaluate(() => {
    const w = window as any;
    w.__survivors = new Map(w.SpatialGallery.cards.map((c: any) => [c.fileId, {node:c.element,vector:JSON.stringify(c.vector)}]));
  });
  await tapCard(page, 'b', touch); await expectFocusInvariant(page, 'b');
  await platformTap(page, '#focus-delete-btn', touch); await expectFocusInvariant(page, 'c');
  await platformTap(page, '#focus-origin-close', touch);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  expect(await page.locator('.spatial-gallery__card').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.fileId))).toEqual(['c','d','a']);
  expect(await page.evaluate(() => {
    const w = window as any;
    return w.SpatialGallery.cards.every((c: any) => c.element === w.__survivors.get(c.fileId).node && JSON.stringify(c.vector) === w.__survivors.get(c.fileId).vector);
  })).toBe(true);
  await platformTap(page, '#spatial-gallery-close', touch);
  await openExplore(page, 'c', 3);
  const before = await page.evaluate(() => JSON.stringify((window as any).SpatialGallery.orient));
  const v = page.viewportSize()!;
  await page.mouse.move(v.width*.4,v.height*.5); await page.mouse.down();
  await page.mouse.move(v.width*.7,v.height*.6,{steps:8}); await page.mouse.up();
  await expect.poll(() => page.evaluate(() => JSON.stringify((window as any).SpatialGallery.orient))).not.toBe(before);
});


test('Table entry, Focus review taps and both exits preserve one action per gesture', async ({ page }, testInfo) => {
  const touch = testInfo.project.name.includes('android');
  await boot(page);
  await page.evaluate(() => (window as any).PhotoTable.open({stackName:'in',fileId:'a'}));
  await expect(page.locator('.photo-table__print')).toHaveCount(4);
  const point = await page.evaluate(() => {
    for (const card of document.querySelectorAll<HTMLElement>('.photo-table__print')) {
      const r = card.getBoundingClientRect();
      for (const fy of [.5,.3,.7]) for (const fx of [.5,.3,.7]) {
        const x=r.x+r.width*fx,y=r.y+r.height*fy;
        if (document.elementFromPoint(x,y)?.closest('.photo-table__print') === card) return {x,y,id:card.dataset.fileId!};
      }
    } return null;
  });
  expect(point).not.toBeNull();
  if (touch) await page.touchscreen.tap(point!.x,point!.y); else await page.mouse.click(point!.x,point!.y);
  await expectFocusInvariant(page,point!.id);
  const sequence = await page.evaluate(() => (window as any).__orbitalAppState.stacks.in.map((f: any) => f.id));
  const box = await page.locator('#image-viewport').boundingBox();
  for (const [fraction,id] of [[.75,sequence[1]],[.25,sequence[0]]] as [number,string][]) {
    await paintTiming(page,'pointerup',id);
    const x=box!.x+box!.width*fraction,y=box!.y+box!.height*.5;
    if(touch) await page.touchscreen.tap(x,y); else await page.mouse.click(x,y);
    await expectFocusInvariant(page,id); await expectFastPaint(page);
  }
  await platformTap(page,'#focus-origin-close',touch);
  await expect(page.locator('#photo-table')).toBeVisible();
  await platformTap(page,'#photo-table-close',touch);
  await expect(page.locator('#photo-table')).toBeHidden();
  await expect(page.locator('#grid-modal')).toBeHidden();
  await expectHead(page,sequence[0]);
  expect(await page.evaluate(() => (window as any).__orbitalAppState.imageFiles.every((f: any) => f.stack === 'in'))).toBe(true);
});


for (const count of [7,217,514]) test('fully loaded raster globe has bounded layers and no missing paint: '+count, async ({page}, testInfo) => {
  test.setTimeout(120000);
  const touch=testInfo.project.name.includes('android'), cdp=await page.context().newCDPSession(page);
  let drawnLayers=0;
  cdp.on('LayerTree.layerTreeDidChange', (event: any) => { if(event.layers) drawnLayers=event.layers.filter((l: any)=>l.drawsContent).length; });
  await cdp.send('LayerTree.enable');
  await boot(page,count,true); await openExplore(page,'a',Math.min(count,500));
  await expect(page.locator('#spatial-gallery-loading')).toBeHidden();
  await page.waitForFunction(() => (window as any).SpatialGallery.cards.every((c: any)=>c.image.complete&&c.image.naturalWidth===384));
  const viewport=page.viewportSize()!, observations: any[]=[];
  for(let phase=0;phase<3;phase++) {
    const start={x:viewport.width*.3,y:viewport.height*.5};
    if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    else { await page.mouse.move(start.x,start.y); await page.mouse.down(); }
    for(let step=1;step<=8;step++) {
      const point={x:viewport.width*(.3+step*.04),y:viewport.height*(.5+step*(phase%2?.005:-.005))};
      if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]}); else await page.mouse.move(point.x,point.y);
    }
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    const samples=await page.evaluate(()=>{
      const g=(window as any).SpatialGallery, samples: any[]=[];
      for(const c of g.cards) {
        if(getComputedStyle(c.element).visibility==='hidden'||!c.image.complete||!c.image.naturalWidth) throw Error('A fully loaded thumbnail disappeared');
        // Rear cards intentionally blend with the dark background; inspect every card's
        // visibility above and sample pixels where image color remains distinguishable.
        if(c.depth < .3) continue;
        const r=c.image.getBoundingClientRect();
        for(const fx of [.3,.5,.7]) {
          const x=r.x+r.width*fx,y=r.y+r.height*.35;
          if(x<10||x>innerWidth-10||y<120||y>innerHeight-100)continue;
          if(document.elementFromPoint(x,y)?.closest('[data-file-id]')===c.element){samples.push({x,y,id:c.fileId});break;}
        }
      }
      return samples;
    });
    expect(samples.length).toBeGreaterThan(0);
    const shot=await page.screenshot(), png=PNG.sync.read(shot), scale=png.width/viewport.width;
    for(const p of samples){const i=(Math.round(p.y*scale)*png.width+Math.round(p.x*scale))*4;expect(png.data[i]-png.data[i+2], 'Painted image '+p.id).toBeGreaterThan(20);}
    expect(drawnLayers,'Layer count must not grow with thumbnail count').toBeLessThan(64);
    observations.push({phase,drawnLayers,samples:samples.length});
    if(phase===2) await testInfo.attach('fully-loaded-rotation',{body:shot,contentType:'image/png'});
    if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  }
  await page.waitForFunction(() => !(window as any).SpatialGallery.frameId);
  const point=await page.evaluate(()=>{
    for(const c of (window as any).SpatialGallery.cards){const r=c.image.getBoundingClientRect(),x=r.x+r.width*.4,y=r.y+r.height*.4;if(x>10&&x<innerWidth-10&&y>120&&y<innerHeight-100&&document.elementFromPoint(x,y)?.closest('[data-file-id]')===c.element)return{x,y,id:c.fileId};}return null;
  });
  expect(point).not.toBeNull();
  if(touch)await page.touchscreen.tap(point!.x,point!.y);else await page.mouse.click(point!.x,point!.y);
  await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);
  await expect(page.locator('#center-image')).toHaveAttribute('src',raster(point!.id));
  await expect(page.locator('#spatial-gallery')).toHaveCSS('display','none');
  await platformTap(page,'#focus-origin-close',touch);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  await testInfo.attach('rendering-observations',{body:JSON.stringify(observations),contentType:'application/json'});
});


test('Table defaults to 50, caps at 500 and places prints below the top fifth', async ({page},testInfo)=>{
  test.setTimeout(120000);
  await boot(page,514);
  await page.evaluate(()=> (window as any).PhotoTable.open({stackName:'in',fileId:'a'}));
  await expect(page.locator('.photo-table__print')).toHaveCount(50);
  await platformTap(page,'#photo-table-controls-toggle',testInfo.project.name.includes('android'));
  await expect(page.locator('#photo-table-limit')).toHaveText('50');
  await page.evaluate(()=> (window as any).PhotoTable.adjustControl('limit',445));
  const plus='#photo-table-controls [data-control="limit"] [data-delta="5"]';
  await platformTap(page,plus,testInfo.project.name.includes('android'));
  await expect(page.locator('#photo-table-limit')).toHaveText('500');
  await expect(page.locator('.photo-table__print')).toHaveCount(500);
  await platformTap(page,plus,testInfo.project.name.includes('android'));
  await expect(page.locator('.photo-table__print')).toHaveCount(500);
  const minTop=await page.locator('.photo-table__print').evaluateAll(nodes=>Math.min(...nodes.map(n=>n.getBoundingClientRect().top)));
  expect(minTop).toBeGreaterThanOrEqual(page.viewportSize()!.height*.2-.5);
  await platformTap(page,'#photo-table-controls [data-control="limit"] [data-delta="-5"]',testInfo.project.name.includes('android'));
  await expect(page.locator('.photo-table__print')).toHaveCount(495);
});


async function chooseView(page: Page, view: string, touch: boolean) {
  await platformTap(page,'#app-container > .app-footer',touch);
  await platformTap(page,'[data-submode="'+view+'"]',touch);
}

async function dragInput(page: Page, start: {x:number,y:number}, end: {x:number,y:number}, touch: boolean) {
  if (!touch) {
    await page.mouse.move(start.x,start.y); await page.mouse.down();
    await page.mouse.move(end.x,end.y,{steps:8}); await page.mouse.up(); return;
  }
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/8,y:start.y+(end.y-start.y)*i/8}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await cdp.detach();
}

async function reorderCBeforeA(page: Page, touch: boolean) {
  const from=(await page.locator('.grid-item[data-file-id="c"] .grid-drag-handle').boundingBox())!;
  const to=(await page.locator('.grid-item[data-file-id="a"]').boundingBox())!;
  await dragInput(page,{x:from.x+from.width/2,y:from.y+from.height/2},{x:to.x+to.width/2,y:to.y+to.height/2},touch);
}

for(const origin of ['sort','explore','table']) test('explicit Focus to Sort differs from returning to '+origin,async({page},testInfo)=>{
  await boot(page); const touch=testInfo.project.name.includes('android');
  if(origin!=='sort')await chooseView(page,origin,touch);
  await chooseView(page,'focus',touch);await expectFocusInvariant(page,'a');
  await chooseView(page,'sort',touch);
  await expect(page.locator('#spatial-gallery')).toBeHidden();
  await expect(page.locator('#photo-table')).toBeHidden();
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  await expectHead(page,'a'); expect((await ids(page)).canonical).toEqual(['a','b','c','d']);
});

for(const origin of ['sort','explore','table']) for(const mutation of ['none','search','reorder']) test(origin+' → Focus → Grid ('+mutation+') → Focus → '+origin,async({page},testInfo)=>{
  await boot(page); const touch=testInfo.project.name.includes('android');
  if(origin!=='sort')await chooseView(page,origin,touch);
  await chooseView(page,'focus',touch);await expectFocusInvariant(page,'a');
  await platformTap(page,'#focus-stack-name',touch);
  await platformTap(page,'#surface-stack-selector [aria-label="Open Inbox in Grid"]',touch);
  await expect(page.locator('#grid-modal')).toBeVisible();
  let expected=['a','b','c','d'];
  if(mutation==='search'){await page.locator('#omni-search').fill('#match');await expect(page.locator('.grid-item')).toHaveCount(3);expected=['b','c','d','a'];}
  if(mutation==='reorder'){
    await reorderCBeforeA(page,touch);expected=['c','a','b','d'];
  }
  await platformTap(page,'#close-grid',touch);await expectFocusInvariant(page,expected[0]);
  expect((await ids(page)).canonical).toEqual(expected);
  await platformTap(page,'#focus-origin-close',touch);
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  if(origin==='explore')await expect(page.locator('#spatial-gallery')).toBeVisible();
  else if(origin==='table')await expect(page.locator('#photo-table')).toBeVisible();
  else {await expect(page.locator('#spatial-gallery')).toBeHidden();await expect(page.locator('#photo-table')).toBeHidden();await expectHead(page,expected[0]);}
  expect((await ids(page)).canonical).toEqual(expected);
});


async function expectSurface(page: Page, surface: string) {
  await expect(page.locator('#grid-modal')).not.toBeVisible();
  if(surface==='focus')await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);
  else await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  if(surface==='explore')await expect(page.locator('#spatial-gallery')).toBeVisible();else await expect(page.locator('#spatial-gallery')).toBeHidden();
  if(surface==='table')await expect(page.locator('#photo-table')).toBeVisible();else await expect(page.locator('#photo-table')).toBeHidden();
  if(surface==='sort')await expect(page.locator('#center-image')).toHaveAttribute('src',svg(await page.evaluate(()=>{const s=(window as any).__orbitalAppState;return s.stacks[s.currentStack][0].id;})));
}
async function openGridFrom(page:Page,surface:string,touch:boolean) {
  if(surface==='sort'){await platformTap(page,'#pill-in',touch);}
  else {
    const anchor={focus:'#focus-stack-name',explore:'#spatial-gallery-stack',table:'#photo-table-folder'}[surface]!;
    await platformTap(page,anchor,touch);
    await platformTap(page,'#surface-stack-selector [aria-label="Open Inbox in Grid"]',touch);
  }
  await expect(page.locator('#grid-modal')).toBeVisible();
}

const surfaces=['sort','focus','explore','table'];
for(const from of surfaces)for(const to of surfaces.filter(s=>s!==from))test('direct view '+from+' → '+to+' preserves stack order',async({page},testInfo)=>{
  await boot(page);const touch=testInfo.project.name.includes('android');
  if(from!=='sort')await chooseView(page,from,touch);
  await chooseView(page,to,touch);await expectSurface(page,to);
  expect((await ids(page)).canonical).toEqual(['a','b','c','d']);
  expect(await page.evaluate(()=> (window as any).__orbitalAppState.currentFileId)).toBe('a');
});
for(const origin of surfaces)for(const mutation of ['none','search','reorder'])test(origin+' → Grid ('+mutation+') → X restores origin and head',async({page},testInfo)=>{
  await boot(page);const touch=testInfo.project.name.includes('android');
  if(origin!=='sort')await chooseView(page,origin,touch);
  await openGridFrom(page,origin,touch);let expected=['a','b','c','d'];
  expect(await page.locator('.grid-item').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.fileId))).toEqual(expected);
  if(mutation==='search'){await page.locator('#omni-search').fill('#match');await expect(page.locator('.grid-item')).toHaveCount(3);expected=['b','c','d','a'];}
  if(mutation==='reorder'){
    await reorderCBeforeA(page,touch);expected=['c','a','b','d'];
  }
  await platformTap(page,'#close-grid',touch);await expectSurface(page,origin);
  expect((await ids(page)).canonical).toEqual(expected);
  expect(await page.evaluate(()=> (window as any).__orbitalAppState.currentFileId)).toBe(expected[0]);
});
for(const origin of surfaces)test(origin+' → Grid → chosen Focus image → X keeps the latest head',async({page},testInfo)=>{
  await boot(page);const touch=testInfo.project.name.includes('android');
  if(origin!=='sort')await chooseView(page,origin,touch);
  await openGridFrom(page,origin,touch);
  await platformTap(page,'.grid-item[data-file-id="c"] .grid-focus-button',touch);
  await expectFocusInvariant(page,'c');expect((await ids(page)).canonical).toEqual(['c','d','a','b']);
  await platformTap(page,'#focus-origin-close',touch);await expectSurface(page,origin==='focus'?'sort':origin);
  expect((await ids(page)).canonical).toEqual(['c','d','a','b']);
});
for(const origin of ['sort','explore','table'])for(const mutation of ['navigate','delete','switch stack'])test(origin+' → Focus → '+mutation+' → X returns with committed head',async({page},testInfo)=>{
  await boot(page);const touch=testInfo.project.name.includes('android');
  if(mutation==='switch stack')await page.evaluate(()=>{const w=window as any,s=w.__orbitalAppState;const d=s.imageFiles.find((f:any)=>f.id==='d');d.stack='out';w.Core.initializeStacks();});
  if(origin!=='sort')await chooseView(page,origin,touch);
  await chooseView(page,'focus',touch);await expectFocusInvariant(page,'a');
  let expected='b';
  if(mutation==='navigate') {
    if(touch) {const v=page.viewportSize()!;await dragInput(page,{x:v.width*.3,y:v.height*.5},{x:v.width*.75,y:v.height*.5},true);}
    else await page.keyboard.press('ArrowRight');
  }
  if(mutation==='delete')await platformTap(page,'#focus-delete-btn',touch);
  if(mutation==='switch stack'){
    await platformTap(page,'#focus-stack-name',touch);
    const stackButton=page.getByRole('button',{name:/Maybe.*1/}); if(touch)await stackButton.tap();else await stackButton.click();expected='d';
  }
  await expectFocusInvariant(page,expected);
  await platformTap(page,'#focus-origin-close',touch);await expectSurface(page,origin);
  const state=await page.evaluate(()=>{const s=(window as any).__orbitalAppState;return{head:s.stacks[s.currentStack][0]?.id,current:s.currentFileId};});
  expect(state).toEqual({head:expected,current:expected});
});

for(const origin of ['sort','explore','table'])test(origin+' → Focus → delete last image clears every surface',async({page},testInfo)=>{
  await boot(page,1);const touch=testInfo.project.name.includes('android');
  if(origin!=='sort')await chooseView(page,origin,touch);
  await chooseView(page,'focus',touch);await expectFocusInvariant(page,'a');
  await platformTap(page,'#focus-delete-btn',touch);
  await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
  await expect(page.locator('#spatial-gallery')).toBeHidden();await expect(page.locator('#photo-table')).toBeHidden();
  await expect(page.locator('#center-image')).not.toHaveAttribute('src',/./);
  await expect(page.locator('[data-submode="sort"]')).toHaveAttribute('aria-current','page');
  expect(await page.evaluate(()=>{const s=(window as any).__orbitalAppState;return{current:s.currentFileId,count:s.stacks.in.length};})).toEqual({current:null,count:0});
});
