import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiPath = path.resolve(__dirname, '../ui-v2.html');
const uiUrl = `file://${uiPath}`;

const imageUrl = (fileId: string, rendition: 'thumb' | 'display') =>
  `https://focus-navigation.test/${fileId}-${rendition}.svg`;

const imageSvg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="${color}"/></svg>`;

async function installDeterministicImages(page: import('@playwright/test').Page, delayedX = false) {
  const colors: Record<string, string> = {
    'file-x-thumb': '#ffaaaa',
    'file-x-display': '#ff0000',
    'file-y-thumb': '#aaffaa',
    'file-y-display': '#00ff00',
    'file-z-thumb': '#aaaaff',
    'file-z-display': '#0000ff'
  };

  await page.route('https://focus-navigation.test/**', async route => {
    const resource = path.basename(new URL(route.request().url()).pathname, '.svg');
    if (delayedX && resource === 'file-x-display') await new Promise(resolve => setTimeout(resolve, 500));
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: imageSvg(colors[resource]) });
  });
}

async function prepareExplore(page: import('@playwright/test').Page) {
  await page.goto(uiUrl);
  await page.waitForFunction(() => typeof window !== 'undefined' && !!(window as any).__orbitalAppState);
  await page.evaluate(({ resources }) => {
    const state = (window as any).__orbitalAppState;
    const Core = (window as any).Core;
    const files = ['file-x', 'file-y', 'file-z'].map((id, index) => ({
      id,
      name: id.toUpperCase(),
      stack: 'in',
      stackSequence: 100 - index,
      metadataStatus: 'loaded',
      thumbnails: {
        medium: { url: resources[id].thumb },
        large: { url: resources[id].display }
      },
      downloadUrl: resources[id].display
    }));

    state.imageFiles = files;
    state.currentFolder = { id: 'focus-resource-test', name: 'Focus resource test' };
    state.providerType = 'test-provider';
    state.currentStack = 'in';
    state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).SharedImageResources.clear();
    Core.initializeStacks();
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'file-y' });
  }, {
    resources: Object.fromEntries(['file-x', 'file-y', 'file-z'].map(id => [id, {
      thumb: imageUrl(id, 'thumb'),
      display: imageUrl(id, 'display')
    }]))
  });
  await page.waitForSelector('#spatial-gallery:not([hidden]) .spatial-gallery__card');
}

async function prepareSort(page: import('@playwright/test').Page) {
  await installDeterministicImages(page);
  await prepareExplore(page);
  await page.evaluate(() => {
    (window as any).SpatialGallery.close({ restoreFocus: false, force: true });
    (window as any).CurrentImage.set('file-y', 'in', { allowCrossStack: false });
    (window as any).__orbitalAppState.inspection = { surface: null, origin: null, fileId: 'file-y' };
  });
}

async function activateExploreFile(page: import('@playwright/test').Page, fileId: string) {
  return page.evaluate(async id => {
    const gallery = (window as any).SpatialGallery;
    const card = gallery.cards.find((candidate: any) => candidate.fileId === id);
    return gallery.activateFileId(id, card.element);
  }, fileId);
}

async function focusSnapshot(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const image = document.querySelector('#center-image') as HTMLImageElement;
    const binding = (window as any).SharedImageResources.bindings.get(image);
    const selectedCardElement = document.querySelector('#spatial-gallery-scene .spatial-gallery__card.selected') as HTMLElement | null;
    const selectedCard = (window as any).SpatialGallery.cards.find((card: any) => card.element === selectedCardElement);
    const selectedThumbnail = selectedCard?.element.querySelector('img') as HTMLImageElement | undefined;
    const thumbnailBinding = selectedThumbnail && (window as any).SharedImageResources.bindings.get(selectedThumbnail);
    return {
      currentFileId: state.currentFileId,
      stackPosition: state.currentStackPosition,
      promotedFileId: state.stacks[state.currentStack]?.[0]?.id,
      inspectionFileId: state.inspection?.fileId,
      imageFileId: image.dataset.fileId,
      bindingFileId: binding?.fileId,
      bindingKey: binding?.key,
      loadedKey: binding?.loadedKey,
      currentSrc: image.currentSrc || image.src,
      opacity: image.style.opacity,
      naturalWidth: image.naturalWidth,
      selectedCardFileId: selectedCard?.fileId,
      selectedCardDatasetFileId: selectedCard?.element.dataset.fileId,
      thumbnailFileId: selectedThumbnail?.dataset.fileId,
      thumbnailKey: selectedThumbnail?.dataset.sharedResourceKey,
      thumbnailBindingFileId: thumbnailBinding?.fileId,
      thumbnailBindingKey: thumbnailBinding?.key,
      thumbnailLoadedKey: thumbnailBinding?.loadedKey,
      surface: state.inspection?.surface
    };
  });
}

test.describe('Explorer Focus identity regressions', () => {
  test('activates the requested stable ID without changing canonical order', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    const before = await page.evaluate(() => (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id));
    await page.evaluate(() => (window as any).CurrentImage.set('file-y', 'in', { allowCrossStack: false }));

    await activateExploreFile(page, 'file-x');
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x', stackPosition: before.indexOf('file-x'), inspectionFileId: 'file-x',
      imageFileId: 'file-x', bindingFileId: 'file-x', selectedCardFileId: 'file-x',
      selectedCardDatasetFileId: 'file-x', thumbnailFileId: 'file-x',
      thumbnailBindingFileId: 'file-x', thumbnailKey: 'test-provider:file-x:v0:thumb',
      thumbnailBindingKey: 'test-provider:file-x:v0:thumb',
      thumbnailLoadedKey: 'test-provider:file-x:v0:thumb', surface: 'focus'
    });
    expect(await page.evaluate(() => (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id))).toEqual(before);
  });

  test('ignores a stale display completion after another stable ID becomes current', async ({ page }) => {
    await installDeterministicImages(page, true);
    await prepareExplore(page);
    await activateExploreFile(page, 'file-x');
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    await activateExploreFile(page, 'file-y');
    await expect.poll(async () => (await focusSnapshot(page)).currentSrc).toBe(imageUrl('file-y', 'display'));
    await page.waitForTimeout(650);
    expect(await focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-y', imageFileId: 'file-y', bindingFileId: 'file-y',
      currentSrc: imageUrl('file-y', 'display'), surface: 'focus'
    });
  });

  test('defers incremental mounting during movement and retains painted cards', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    const initial = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      clearTimeout(gallery.pageTimer);
      gallery.pageSize = 1;
      gallery.loadGeneration++;
      gallery.buildCards();
      const card = gallery.cards[0];
      const image = card.image || card.element.querySelector('img');
      (window as any).__stableCard = card.element;
      (window as any).__stableImage = image;
      gallery.velocityX = .02;
      gallery.scheduleNextPage();
      return { count: gallery.cards.length, src: image.currentSrc || image.src, fileId: card.fileId };
    });
    await page.waitForTimeout(220);
    expect(await page.evaluate(() => (window as any).SpatialGallery.cards.length)).toBe(initial.count);
    expect(await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      const card = gallery.cards[0]; const image = card.image || card.element.querySelector('img');
      return card.element === (window as any).__stableCard && image === (window as any).__stableImage
        && card.element.isConnected && card.fileId === image.dataset.fileId && (image.currentSrc || image.src) === (window as any).__stableImage.src;
    })).toBe(true);
    await page.evaluate(() => { const gallery = (window as any).SpatialGallery; gallery.velocityX = 0; gallery.velocityY = 0; });
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.cards.length)).toBeGreaterThan(initial.count);
    expect(await page.evaluate(() => (window as any).SpatialGallery.cards[0].element === (window as any).__stableCard)).toBe(true);
  });

  test('returns to the completed Explorer scene without rebuilding or changing its camera', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.cards.every((card: any) => {
      const image = card.image || card.element.querySelector('img');
      const binding = (window as any).SharedImageResources.bindings.get(image);
      return image.complete && image.naturalWidth > 0 && binding?.loadedKey === binding?.key;
    }))).toBe(true);
    await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      gallery.rotationX = .41; gallery.rotationY = -.23; gallery.render(performance.now());
      (window as any).__exploreScene = {
        cards: gallery.cards.map((card: any) => card.element),
        images: gallery.cards.map((card: any) => card.image || card.element.querySelector('img')),
        sources: gallery.cards.map((card: any) => (card.image || card.element.querySelector('img')).currentSrc),
        rotationX: gallery.rotationX, rotationY: gallery.rotationY, generation: gallery.loadGeneration
      };
    });
    await activateExploreFile(page, 'file-x');
    await page.evaluate(async () => { await (window as any).Gestures.nextImage(); (window as any).CanonicalInspection.exitToReferrer({ persist: false }); });
    expect(await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery; const saved = (window as any).__exploreScene;
      return !gallery.elements.root.hidden && gallery.loadGeneration === saved.generation
        && gallery.rotationX === saved.rotationX && gallery.rotationY === saved.rotationY
        && gallery.cards.every((card: any, index: number) => card.element === saved.cards[index]
          && (card.image || card.element.querySelector('img')) === saved.images[index]
          && (card.image || card.element.querySelector('img')).currentSrc === saved.sources[index]);
    })).toBe(true);
    await expect(page.locator('#spatial-gallery')).toBeVisible();
  });

  test('retains painted Explorer thumbnails when Focus sorting changes its population', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.cards.length)).toBe(3);
    await activateExploreFile(page, 'file-y');
    await page.evaluate(async () => {
      const state = (window as any).__orbitalAppState;
      state.dbManager = { scheduleFolderCacheSave: async () => true };
      (window as any).__retainedExploreNodes = new Map(
        (window as any).SpatialGallery.cards.map((card: any) => [card.fileId, card.element])
      );
      await (window as any).Core.moveToStack('out', { source: 'test:focus-sort' });
      (window as any).CanonicalInspection.exitToReferrer({ persist: false });
    });

    await expect(page.locator('#spatial-gallery')).toBeVisible();
    expect(await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      const retained = (window as any).__retainedExploreNodes;
      return gallery.files.map((file: any) => file.id).join(',') === 'file-x,file-z'
        && gallery.cards.every((card: any) => card.element === retained.get(card.fileId));
    })).toBe(true);
  });

  test('puts the Explorer-selected Focus image first when opening its Grid', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await activateExploreFile(page, 'file-y');
    await page.evaluate(() => {
      (window as any).SurfaceStackSelector.open('focus');
      (window as any).SurfaceStackSelector.openGrid('in');
    });

    await expect(page.locator('#grid-modal')).toBeVisible();
    expect(await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      const first = document.querySelector('#grid-container .grid-item') as HTMLElement | null;
      return {
        entryFileId: state.grid.entryFileId,
        firstFileId: state.grid.lazyLoadState.allFiles[0]?.id,
        firstTileFileId: first?.dataset.fileId,
        firstTileCurrent: first?.classList.contains('current')
      };
    })).toEqual({
      entryFileId: 'file-y', firstFileId: 'file-y', firstTileFileId: 'file-y', firstTileCurrent: true
    });
  });

  test('warm resume retains a stationary Explorer without restoration or rendering', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    const before = await page.evaluate(() => {
      const App = (window as any).App;
      const Core = (window as any).Core;
      const gallery = (window as any).SpatialGallery;
      if (gallery.frameId) cancelAnimationFrame(gallery.frameId);
      gallery.frameId = null; gallery.velocityX = 0; gallery.velocityY = 0; gallery.dragging = false;
      (window as any).__visibilityState = 'visible';
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window as any).__visibilityState });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window as any).__visibilityState === 'hidden' });
      (window as any).__warmCounts = { restore: 0, display: 0, request: 0, render: 0 };
      const counts = (window as any).__warmCounts;
      const restore = App.restoreViewContext.bind(App);
      const display = Core.displayCurrentImage.bind(Core);
      const request = gallery.requestFrame.bind(gallery);
      const render = gallery.render.bind(gallery);
      App.restoreViewContext = (...args: any[]) => { counts.restore++; return restore(...args); };
      Core.displayCurrentImage = (...args: any[]) => { counts.display++; return display(...args); };
      gallery.requestFrame = (...args: any[]) => { counts.request++; return request(...args); };
      gallery.render = (...args: any[]) => { counts.render++; return render(...args); };
      (window as any).__warmCards = gallery.cards.map((card: any) => card.element);
      (window as any).__warmImages = gallery.cards.map((card: any) => card.image || card.element.querySelector('img'));
      (window as any).__warmBindings = gallery.cards.map((card: any) => (window as any).SharedImageResources.bindings.get(card.image || card.element.querySelector('img')));
      (window as any).__warmFiles = gallery.files.slice();
      return {
        generation: gallery.loadGeneration, selectedIndex: gallery.selectedIndex,
        fileId: (window as any).__orbitalAppState.currentFileId,
        stack: (window as any).__orbitalAppState.currentStack,
        rotationX: gallery.rotationX, rotationY: gallery.rotationY
      };
    });

    await page.evaluate(() => { (window as any).__visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(0);
    await page.evaluate(() => { (window as any).__visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(0);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(50);

    expect(await page.evaluate(({ before }) => {
      const state = (window as any).__orbitalAppState;
      const gallery = (window as any).SpatialGallery;
      const bindings = (window as any).SharedImageResources.bindings;
      return {
        counts: (window as any).__warmCounts,
        retained: gallery.cards.every((card: any, index: number) => card.element === (window as any).__warmCards[index]
          && (card.image || card.element.querySelector('img')) === (window as any).__warmImages[index]
          && bindings.get(card.image || card.element.querySelector('img')) === (window as any).__warmBindings[index]),
        state: [gallery.loadGeneration, gallery.selectedIndex, state.currentFileId, state.currentStack, gallery.rotationX, gallery.rotationY],
        filesRetained: gallery.files.every((file: any, index: number) => file === (window as any).__warmFiles[index])
      };
    }, { before })).toEqual({
      counts: { restore: 0, display: 0, request: 0, render: 0 }, retained: true,
      state: [before.generation, before.selectedIndex, before.fileId, before.stack, before.rotationX, before.rotationY],
      filesRetained: true
    });
  });

  test('warm resume restarts exactly one moving Explorer loop and focus does not duplicate it', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      gallery.velocityX = .02;
      if (!gallery.frameId) gallery.requestFrame();
      (window as any).__movingFrame = gallery.frameId;
      (window as any).__visibilityState = 'visible';
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window as any).__visibilityState });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window as any).__visibilityState === 'hidden' });
      (window as any).__movingRequests = 0;
      const request = gallery.requestFrame.bind(gallery);
      gallery.requestFrame = (...args: any[]) => { (window as any).__movingRequests++; return request(...args); };
    });
    await page.evaluate(() => { (window as any).__visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(await page.evaluate(() => (window as any).SpatialGallery.frameId)).toBeNull();
    await page.waitForTimeout(0);
    await page.evaluate(() => { (window as any).__visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(await page.evaluate(() => ({ requests: (window as any).__movingRequests, frame: (window as any).SpatialGallery.frameId }))).toMatchObject({ requests: 1 });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect(await page.evaluate(() => (window as any).__movingRequests)).toBe(1);
  });

  test('Table warm resume retains physics and only restarts a moving loop', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await page.evaluate(() => {
      (window as any).SpatialGallery.close({ restoreFocus: false, force: true });
      (window as any).PhotoTable.open({ stackName: 'in', fileId: 'file-y' });
      const table = (window as any).PhotoTable;
      if (table.frameId) cancelAnimationFrame(table.frameId);
      table.frameId = null;
      table.photos.forEach((photo: any) => { photo.state = 'resting'; });
      (window as any).__tableNodes = table.photos.map((photo: any) => photo.element);
      (window as any).__tablePhysics = table.photos.map((photo: any) => [photo.x, photo.y, photo.velocityX, photo.velocityY, photo.rotation]);
      (window as any).__visibilityState = 'visible';
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window as any).__visibilityState });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window as any).__visibilityState === 'hidden' });
      (window as any).__tableCounts = { request: 0, animate: 0, paint: 0 };
      for (const method of ['requestFrame', 'animate', 'paint']) {
        const original = table[method].bind(table);
        table[method] = (...args: any[]) => { (window as any).__tableCounts[method === 'requestFrame' ? 'request' : method]++; return original(...args); };
      }
    });
    await page.evaluate(() => { (window as any).__visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(0);
    await page.evaluate(() => { (window as any).__visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(30);
    expect(await page.evaluate(() => {
      const table = (window as any).PhotoTable;
      return {
        counts: (window as any).__tableCounts,
        nodes: table.photos.every((photo: any, index: number) => photo.element === (window as any).__tableNodes[index]),
        physics: table.photos.map((photo: any) => [photo.x, photo.y, photo.velocityX, photo.velocityY, photo.rotation])
      };
    })).toEqual({ counts: { request: 0, animate: 0, paint: 0 }, nodes: true, physics: await page.evaluate(() => (window as any).__tablePhysics) });

    await page.evaluate(() => {
      const table = (window as any).PhotoTable;
      let nextFrame = 1000;
      window.requestAnimationFrame = () => ++nextFrame;
      window.cancelAnimationFrame = () => {};
      const photo = table.photos[0]; photo.state = 'thrown'; photo.velocityX = 3; photo.velocityY = 2;
      table.requestFrame(); (window as any).__tableCounts.request = 0;
    });
    await page.evaluate(() => { (window as any).__visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(await page.evaluate(() => (window as any).PhotoTable.frameId)).toBeNull();
    await page.waitForTimeout(0);
    await page.evaluate(() => { (window as any).__visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(await page.evaluate(() => (window as any).__tableCounts.request)).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect(await page.evaluate(() => (window as any).__tableCounts.request)).toBe(1);
  });

  test('Sort and canonical Focus do no restoration or display work on warm resume', async ({ page }) => {
    await prepareSort(page);
    await page.evaluate(() => {
      const App = (window as any).App; const Core = (window as any).Core;
      (window as any).__visibilityState = 'visible';
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window as any).__visibilityState });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window as any).__visibilityState === 'hidden' });
      (window as any).__plainCounts = { restore: 0, display: 0 };
      const restore = App.restoreViewContext.bind(App); const display = Core.displayCurrentImage.bind(Core);
      App.restoreViewContext = (...args: any[]) => { (window as any).__plainCounts.restore++; return restore(...args); };
      Core.displayCurrentImage = (...args: any[]) => { (window as any).__plainCounts.display++; return display(...args); };
    });
    for (const focus of [false, true]) {
      if (focus) await page.evaluate(() => (window as any).CanonicalInspection.enter('file-y', 'sort'));
      if (focus) await expect.poll(async () => (await focusSnapshot(page)).bindingKey).toBe('test-provider:file-y:v0:display');
      else await page.waitForTimeout(100);
      await page.evaluate(() => { (window as any).__plainCounts = { restore: 0, display: 0 }; });
      const before = await focusSnapshot(page);
      const referrer = await page.evaluate(() => (window as any).CanonicalInspection.referrerSnapshot?.() || null);
      await page.evaluate(() => { (window as any).__visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(0);
      await page.evaluate(() => { (window as any).__visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(0);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      expect(await focusSnapshot(page)).toEqual(before);
      expect(await page.evaluate(() => (window as any).CanonicalInspection.referrerSnapshot?.() || null)).toEqual(referrer);
    }
    expect(await page.evaluate(() => (window as any).__plainCounts)).toEqual({ restore: 0, display: 0 });
  });

  test('reconciles deletion across canonical Focus and the retained Explorer population', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await activateExploreFile(page, 'file-y');
    await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      state.provider = { deleteFile: async () => true };
      state.dbManager = { scheduleFolderCacheSave: async () => true };
    });
    await page.evaluate(() => (window as any).Core.deleteCurrentImage({ source: 'test' }));
    expect(await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      const deleted = 'file-y';
      const ids = [
        ...state.imageFiles.map((file: any) => file.id), ...state.stacks.in.map((file: any) => file.id),
        ...(window as any).SpatialGallery.files.map((file: any) => file.id),
        ...(window as any).SpatialGallery.cards.map((card: any) => card.fileId)
      ];
      return !ids.includes(deleted) && state.currentFileId === state.inspection.fileId
        && state.stacks.in[state.currentStackPosition]?.id === state.currentFileId;
    })).toBe(true);
  });

  test('one Focus X pointer sequence cannot also close the revealed Explorer', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await activateExploreFile(page, 'file-x');
    await page.evaluate(() => {
      const focusClose = document.getElementById('focus-origin-close')!;
      focusClose.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 41 }));
      focusClose.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.getElementById('spatial-gallery-close')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 41 }));
    });
    await expect.poll(() => page.evaluate(() => !(window as any).SpatialGallery.elements.root.hidden)).toBe(true);
    await page.waitForTimeout(20);
    await page.evaluate(() => document.getElementById('spatial-gallery-close')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.elements.root.hidden)).toBe(true);
  });
});

test.describe('Sort and Table Focus continuity', () => {
  test('keeps Sort selection canonical through Focus paging without reordering the stack', async ({ page }) => {
    await prepareSort(page);
    const before = await page.evaluate(() => (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id));
    await page.evaluate(async () => {
      (window as any).CurrentImage.set('file-x', 'in', { allowCrossStack: false });
      await (window as any).CanonicalInspection.enter('file-x', { surface: 'sort', stackName: 'in', fileId: 'file-x' });
    });
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x', inspectionFileId: 'file-x', imageFileId: 'file-x', bindingFileId: 'file-x', surface: 'focus'
    });
    await page.evaluate(async () => { await (window as any).Gestures.nextImage(); (window as any).CanonicalInspection.exitToReferrer({ persist: false }); });
    await expect.poll(() => page.evaluate(() => ({
      id: (window as any).__orbitalAppState.currentFileId,
      position: (window as any).__orbitalAppState.currentStackPosition,
      imageId: (document.getElementById('center-image') as HTMLImageElement).dataset.fileId,
      order: (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id)
    }))).toEqual({ id: 'file-y', position: 1, imageId: 'file-y', order: before });
  });

  test('opens an exact Table photo and retains unaffected nodes and physics on Focus return', async ({ page }) => {
    await prepareSort(page);
    const before = await page.evaluate(() => {
      const table = (window as any).PhotoTable;
      table.open({ stackName: 'in', fileId: 'file-y' });
      const photo = table.photos.find((item: any) => item.fileId === 'file-x');
      table.photos.forEach((item: any, index: number) => { item.velocityX = index + .25; item.velocityY = -index - .5; });
      (window as any).__tableNodes = new Map(table.photos.map((item: any) => [item.fileId, { element: item.element, image: item.element.querySelector('img'), x: item.x, y: item.y, rotation: item.rotation, velocityX: item.velocityX, velocityY: item.velocityY }]));
      table.handleTap(photo);
      return (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id);
    });
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x', inspectionFileId: 'file-x', imageFileId: 'file-x', bindingFileId: 'file-x', surface: 'focus'
    });
    const identity = await page.evaluate(() => ({
      tableId: (window as any).PhotoTable.currentFileId,
      position: (window as any).__orbitalAppState.currentStackPosition,
      order: (window as any).__orbitalAppState.stacks.in.map((file: any) => file.id)
    }));
    expect(identity).toEqual({ tableId: 'file-x', position: 0, order: before });
    await page.evaluate(async () => { await (window as any).Gestures.nextImage(); (window as any).CanonicalInspection.exitToReferrer({ persist: false }); });
    expect(await page.evaluate(() => {
      const table = (window as any).PhotoTable;
      return table.currentFileId === 'file-y' && table.photos.every((item: any) => {
        const old = (window as any).__tableNodes.get(item.fileId);
        const image = item.element.querySelector('img');
        const binding = (window as any).SharedImageResources.bindings.get(image);
        return !old || (item.element === old.element && image === old.image && item.x === old.x && item.y === old.y
          && item.rotation === old.rotation && item.velocityX === old.velocityX && item.velocityY === old.velocityY
          && item.element.dataset.fileId === item.fileId && image.dataset.fileId === item.fileId && binding.fileId === item.fileId);
      });
    })).toBe(true);
  });
});
