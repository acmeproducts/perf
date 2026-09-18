import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
test.use({ viewport: { width: 1100, height: 800 }, hasTouch: true });

const colors = { a: '#ef4444', b: '#22c55e', c: '#3b82f6', d: '#a855f7' } as const;
const svg = (id: keyof typeof colors) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="${colors[id]}"/><text x="40" y="55" text-anchor="middle" font-size="30">${id}</text></svg>`)}`;

async function boot(page: Page) {
  await page.goto(uiUrl);
  await page.waitForFunction(() => Boolean((window as any).__orbitalAppState && (window as any).SpatialGallery));
  await page.evaluate((sources) => {
    const w = window as any;
    const state = w.__orbitalAppState;
    state.imageFiles = ['a', 'b', 'c', 'd'].map((id, index) => ({
      id, name: id, stack: 'in', stackSequence: 40 - index * 10, metadataStatus: 'loaded',
      thumbnails: { small: { url: sources[id] }, medium: { url: sources[id] }, large: { url: sources[id] } },
      downloadUrl: sources[id]
    }));
    state.currentFolder = { id: 'canonical-regression', name: 'canonical-regression' };
    state.folderSessionGeneration += 1;
    state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentFileId = 'b';
    state.currentStackPosition = 1; state.stacks = { in: [], out: [], priority: [], trash: [] };
    state.dbManager.scheduleFolderCacheSave = () => {};
    state.dbManager.scheduleMetadataSave = () => {};
    w.App.updateUserMetadata = async () => true;
    w.Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
  }, Object.fromEntries(Object.keys(colors).map(id => [id, svg(id as keyof typeof colors)])));
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
    const binding = w.__orbitalInternals.sharedImageResources.bindings.get(image);
    return {
      requested: String(state.inspection.requestedFileId), current: String(state.currentFileId),
      inspection: String(state.inspection.fileId), resource: String(binding?.fileId), image: String(image.dataset.fileId),
      position: String(state.stacks[state.currentStack][state.currentStackPosition]?.id)
    };
  });
  expect(new Set(Object.values(frame))).toEqual(new Set([expectedId]));
}

async function openExplore(page: Page, fileId = 'a') {
  await page.evaluate((id) => (window as any).SpatialGallery.open({ stackName: 'in', fileId: id }), fileId);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
  await expect(page.locator('.spatial-gallery__card')).toHaveCount(4);
}

async function tapCard(page: Page, id: string, touch: boolean) {
  const card = page.locator(`.spatial-gallery__card[data-file-id="${id}"]`);
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2, y = box!.y + box!.height / 2;
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
  await expect.poll(async () => (await ids(page)).canonical.join(',')).not.toBe('a,b,c,d');
  const canonical = (await ids(page)).canonical;
  await page.evaluate(() => (window as any).Core.initializeStacks());
  expect((await ids(page)).canonical).toEqual(canonical);
  await page.evaluate((id) => (window as any).CanonicalInspection.enter(id, 'sort'), canonical[0]);
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
  await tapCard(page, 'c', false);
  await expectFocusInvariant(page, 'c');
  await expect(page.locator('#center-image')).toHaveAttribute('src', svg('c'));
});

test('Focus exit hides immediately, retains Explore nodes, and blocks trailing click', async ({ page }) => {
  await boot(page); await openExplore(page);
  const handles = await page.locator('.spatial-gallery__card').evaluateAll(nodes => nodes.map(node => (node as any).__testHandle = crypto.randomUUID()));
  await tapCard(page, 'b', false); await expectFocusInvariant(page, 'b');
  const close = page.locator('#focus-origin-close'); const box = await close.boundingBox(); expect(box).not.toBeNull();
  await page.evaluate(() => {
    const root = document.querySelector('#app-container')!; (window as any).__exitStart = performance.now();
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
  expect(retained).toEqual(handles);
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page.locator('#spatial-gallery')).toBeVisible();
});
