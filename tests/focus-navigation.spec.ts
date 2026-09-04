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
  test('atomically hides Explore during Focus and retains its DOM across repeated transitions', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await page.evaluate(() => {
      document.querySelector('#app-container')?.classList.remove('hidden');
      const gallery = (window as any).SpatialGallery;
      (window as any).__surfaceCards = gallery.cards.map((card: any) => card.element);
      (window as any).__surfaceImages = gallery.cards.map((card: any) => card.image || card.element.querySelector('img'));
      (window as any).__surfaceOverlap = false;
      const sample = () => {
        const explore = document.querySelector('#spatial-gallery') as HTMLElement;
        const focus = document.querySelector('#app-container') as HTMLElement;
        const painted = (element: HTMLElement) => {
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
        };
        if (painted(explore) && focus.classList.contains('focus-mode') && painted(focus)) {
          (window as any).__surfaceOverlap = true;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await expect(page.locator('#spatial-gallery')).toBeVisible();
    await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
    await expect(page.locator('.focus-mode-ui').first()).toHaveCSS('display', 'none');

    for (let iteration = 0; iteration < 3; iteration++) {
      await activateExploreFile(page, iteration % 2 ? 'file-x' : 'file-y');
      const gallery = page.locator('#spatial-gallery');
      await expect(gallery).toHaveCSS('display', 'none');
      await expect(gallery).toBeHidden();
      await expect(gallery).toHaveAttribute('inert', '');
      await expect(gallery).toHaveAttribute('aria-hidden', 'true');
      expect(await gallery.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        return target === element || element.contains(target);
      })).toBe(false);

      await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
      await expect(gallery).toBeVisible();
      expect(await page.evaluate(() => ({
        originFocus: document.body.classList.contains('origin-focus'),
        focusMode: document.querySelector('#app-container')?.classList.contains('focus-mode'),
        retained: (window as any).SpatialGallery.cards.every((card: any, index: number) =>
          card.element === (window as any).__surfaceCards[index]
          && (card.image || card.element.querySelector('img')) === (window as any).__surfaceImages[index])
      }))).toEqual({ originFocus: false, focusMode: false, retained: true });
      await page.waitForTimeout(20);
    }

    expect(await page.evaluate(() => (window as any).__surfaceOverlap)).toBe(false);
  });

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

  test('measures an unchanged warm Focus return with zero card or thumbnail churn', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.cards.length)).toBe(3);
    const before = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      (window as any).__warmFocusCards = gallery.cards.map((card: any) => card.element);
      (window as any).__warmFocusImages = gallery.cards.map((card: any) => card.image);
      return {
        order: gallery.files.map((file: any) => file.id),
        rotation: [gallery.rotationX, gallery.rotationY]
      };
    });

    await activateExploreFile(page, 'file-y');
    expect(await page.evaluate(() => {
      const root = (window as any).SpatialGallery.elements.root;
      return { inert: root.inert, ariaHidden: root.getAttribute('aria-hidden'), pointerEvents: root.style.pointerEvents };
    })).toEqual({ inert: true, ariaHidden: 'true', pointerEvents: 'none' });
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.warmResumeMetrics?.interactiveExploreMs)).not.toBeNull();

    const result = await page.evaluate(({ order, rotation }) => {
      const gallery = (window as any).SpatialGallery;
      return {
        metrics: gallery.warmResumeMetrics,
        cardsRetained: gallery.cards.every((card: any, index: number) => card.element === (window as any).__warmFocusCards[index]
          && card.image === (window as any).__warmFocusImages[index]),
        order: gallery.files.map((file: any) => file.id),
        rotation: [gallery.rotationX, gallery.rotationY],
        inert: gallery.elements.root.inert,
        ariaHidden: gallery.elements.root.hasAttribute('aria-hidden')
      };
    }, before);
    expect(result.metrics).toMatchObject({ cardRecreationCount: 0, imageRequestCount: 0, layoutWorkCount: 0, animationFrameCount: 2 });
    expect(result.metrics.firstExplorePaintMs).toBeGreaterThanOrEqual(0);
    expect(result.metrics.interactiveExploreMs).toBeGreaterThanOrEqual(result.metrics.firstExplorePaintMs);
    expect(result).toMatchObject({ cardsRetained: true, order: before.order, rotation: before.rotation, inert: false, ariaHidden: false });
  });

  test('finishes an interrupted 500-image population after returning from Focus', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    const initial = await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      const Core = (window as any).Core;
      const gallery = (window as any).SpatialGallery;
      const template = state.imageFiles[0];
      gallery.close({ restoreFocus: false, force: true });
      state.imageFiles = Array.from({ length: 500 }, (_, index) => ({
        ...template,
        id: `bulk-${index}`,
        name: `Bulk ${index}`,
        stackSequence: 500 - index,
        thumbnails: { ...template.thumbnails }
      }));
      (window as any).SharedImageResources.clear();
      Core.initializeStacks();
      gallery.pageSize = 30;
      gallery.open({ stackName: 'in', fileId: 'bulk-0' });
      clearTimeout(gallery.pageTimer);
      const first = gallery.cards[0];
      (window as any).__bulkFirstCard = first.element;
      (window as any).__bulkFirstImage = first.image;
      return { mounted: gallery.cards.length, requested: gallery.files.length };
    });

    expect(initial).toEqual({ mounted: 30, requested: 500 });
    await activateExploreFile(page, 'bulk-0');
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    await expect.poll(() => page.evaluate(() => (window as any).SpatialGallery.cards.length), { timeout: 10_000 }).toBe(500);
    expect(await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      return gallery.cards[0].element === (window as any).__bulkFirstCard
        && gallery.cards[0].image === (window as any).__bulkFirstImage
        && gallery.cards.every((card: any) => card.element.dataset.fileId === String(card.fileId)
          && card.image.dataset.fileId === String(card.fileId));
    })).toBe(true);
    await expect(page.locator('#spatial-gallery-loading')).toBeHidden();
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

  test('keeps a non-first Grid activation canonical across close, Focus, sort, filter, and return', async ({ page }) => {
    await prepareSort(page);
    await page.evaluate(() => (window as any).Grid.open('in'));
    await expect(page.locator('#grid-modal')).toBeVisible();

    await page.locator('.grid-item[data-file-id="file-z"] .grid-focus-button').dispatchEvent('click');
    await expect.poll(() => page.evaluate(() => (window as any).__orbitalAppState.currentFileId)).toBe('file-z');
    await expect(page.locator('#grid-modal')).toBeHidden();
    await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);

    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      state.stacks.in.find((file: any) => file.id === 'file-x').stackSequence = 1;
      state.stacks.in.find((file: any) => file.id === 'file-y').stackSequence = 3;
      state.stacks.in.find((file: any) => file.id === 'file-z').stackSequence = 2;
      state.stacks.in = (window as any).Core.sortFiles(state.stacks.in);
      (window as any).Grid.open('in');
      const search = document.querySelector('#omni-search') as HTMLInputElement;
      search.value = 'FILE-Z';
      (window as any).Grid.performSearch();
    });

    expect(await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      const tile = document.querySelector('.grid-item[data-file-id="file-z"]');
      return {
        order: state.stacks.in.map((file: any) => file.id),
        currentFileId: state.currentFileId,
        bulkSelected: state.grid.selected,
        currentClass: tile?.classList.contains('current'),
        ariaCurrent: tile?.getAttribute('aria-current')
      };
    })).toEqual({
      order: ['file-y', 'file-z', 'file-x'], currentFileId: 'file-z', bulkSelected: ['file-z'],
      currentClass: true, ariaCurrent: 'true'
    });

    await page.evaluate(() => (window as any).Grid.close());
    await expect.poll(() => page.evaluate(() => (window as any).__orbitalAppState.currentFileId)).toBe('file-z');
    await page.evaluate(() => (window as any).CanonicalInspection.enter('file-z', {
      surface: 'sort', stackName: 'in', fileId: 'file-z'
    }));
    await expect.poll(async () => (await focusSnapshot(page)).currentFileId).toBe('file-z');
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    expect(await page.evaluate(() => (window as any).__orbitalAppState.currentFileId)).toBe('file-z');
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

test.describe('Explorer pointer hit targeting', () => {
  test('Focus exit guard releases after Sort-origin round trips and the mode chooser stays live', async ({ page }) => {
    await installDeterministicImages(page);
    await page.goto(uiUrl);
    await page.waitForFunction(() => typeof window !== 'undefined' && !!(window as any).__orbitalAppState);
    await page.evaluate(({ resources }) => {
      const state = (window as any).__orbitalAppState;
      const files = ['file-x', 'file-y', 'file-z'].map((id, index) => ({
        id, name: id.toUpperCase(), stack: 'in', stackSequence: 100 - index, metadataStatus: 'loaded',
        thumbnails: { medium: { url: resources[id].thumb }, large: { url: resources[id].display } },
        downloadUrl: resources[id].display
      }));
      state.imageFiles = files;
      state.currentFolder = { id: 'guard-release-test', name: 'Guard release test' };
      state.providerType = 'test-provider';
      state.currentStack = 'in';
      state.currentStackPosition = 0;
      state.stacks = { in: [], out: [], priority: [], trash: [] };
      (window as any).SharedImageResources.clear();
      (window as any).Core.initializeStacks();
      document.querySelector('#app-container')?.classList.remove('hidden');
    }, {
      resources: Object.fromEntries(['file-x', 'file-y', 'file-z'].map(id => [id, {
        thumb: imageUrl(id, 'thumb'), display: imageUrl(id, 'display')
      }]))
    });

    const guardState = () => page.evaluate(() => ({
      inspGuard: !!(window as any).CanonicalInspection?.exitPointerGuard
    }));
    const openChooser = async () => {
      const opened = await page.evaluate(() => (window as any).Gestures.openSortModeChoice((window as any).CurrentImage.current()?.id));
      expect(opened).toBeTruthy();
      await expect(page.locator('#mode-choice-modal')).toBeVisible();
    };

    const roundTrip = async (mode: 'explore' | 'focus', iteration: number) => {
      await openChooser();
      await page.locator(`[data-mode-choice="${mode}"]`).click();
      if (mode === 'explore') {
        await page.waitForSelector('#spatial-gallery:not([hidden]) .spatial-gallery__card');
        await page.locator('#spatial-gallery-close').click();
        await expect(page.locator('#spatial-gallery')).toBeHidden();
      } else {
        await expect(page.locator('#app-container')).toHaveClass(/focus-mode/);
        await page.locator('#focus-origin-close').click();
        await expect(page.locator('#app-container')).not.toHaveClass(/focus-mode/);
      }
      await page.waitForTimeout(30);
      const guards = await guardState();
      expect(guards.inspGuard, `exit pointer guard released (iteration ${iteration}, ${mode})`).toBe(false);
      expect(await page.evaluate(() => !!(window as any).SpatialGallery.exitPointerGuard), `gallery guard released (iteration ${iteration})`).toBe(false);
    };

    // The historical leak: Sort → Focus → X left the guard set forever, killing all clicks.
    await roundTrip('explore', 1);
    await roundTrip('focus', 2);
    await roundTrip('explore', 3);
    await roundTrip('focus', 4);
    await roundTrip('explore', 5);

    // Document clicks must still be fully live after every round trip.
    await openChooser();
    await page.locator('#mode-choice-close').click();
    await expect(page.locator('#mode-choice-modal')).toBeHidden();
  });

  test('touch jitter below tap slop preserves sphere geometry and activates the pressed card', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);

    const result = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      if (gallery.frameId) cancelAnimationFrame(gallery.frameId);
      gallery.frameId = null;
      gallery.velocityX = .17;
      gallery.velocityY = -.11;
      gallery.requestFrame = () => {};
      gallery.elements.scene.setPointerCapture = () => {};
      gallery.elements.scene.releasePointerCapture = () => {};

      const card = gallery.cards[0].element as HTMLElement;
      card.style.cssText = 'position: fixed; left: 100px; top: 180px; width: 160px; height: 120px; margin: 0; transform: none !important; z-index: 10;';
      const before = {
        rotationX: gallery.rotationX,
        rotationY: gallery.rotationY,
        velocityX: gallery.velocityX,
        velocityY: gallery.velocityY
      };
      const activations: string[] = [];
      gallery.activateFileId = (fileId: string) => { activations.push(fileId); return true; };

      card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerId: 21, pointerType: 'touch', button: 0, clientX: 130, clientY: 220 }));
      card.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true, pointerId: 21, pointerType: 'touch', button: 0, clientX: 138, clientY: 226 }));
      const afterMove = {
        rotationX: gallery.rotationX,
        rotationY: gallery.rotationY,
        velocityX: gallery.velocityX,
        velocityY: gallery.velocityY
      };
      card.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, pointerId: 21, pointerType: 'touch', button: 0, clientX: 138, clientY: 226 }));
      return { before, afterMove, activations, pressedFileId: gallery.cards[0].fileId };
    });

    expect(result.afterMove).toEqual(result.before);
    expect(result.activations).toEqual([result.pressedFileId]);
  });

  test('overlapping cards preserve the exact touch, pen, and mouse down target and reject drags', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);

    const result = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      if (gallery.frameId) cancelAnimationFrame(gallery.frameId);
      gallery.frameId = null;
      gallery.velocityX = 0;
      gallery.velocityY = 0;
      gallery.requestFrame = () => {};
      gallery.elements.scene.setPointerCapture = () => {};
      gallery.elements.scene.releasePointerCapture = () => {};

      const positions = [100, 180, 260];
      gallery.cards.forEach((card: any, index: number) => {
        card.element.style.cssText = `position: fixed; left: ${positions[index]}px; top: 180px; width: 160px; height: 120px; margin: 0; transform: none !important; z-index: ${index + 1};`;
      });

      const activations: Array<{ fileId: string, cardFileId: string }> = [];
      gallery.activateFileId = (fileId: string, element: HTMLElement) => {
        activations.push({ fileId, cardFileId: gallery.cards.find((card: any) => card.element === element)?.fileId });
        return true;
      };

      const pointer = (type: string, pointerId: number, x: number, jitter: number, mutateId = false) => {
        const target = document.elementFromPoint(x, 220)!;
        const card = target.closest('.spatial-gallery__card') as HTMLElement;
        const originalId = card.dataset.fileId!;
        target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerId, pointerType: type, button: 0, clientX: x, clientY: 220 }));
        if (mutateId) card.dataset.fileId = 'changed-after-down';
        target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true, pointerId, pointerType: type, button: 0, clientX: x + jitter, clientY: 220 }));
        target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, pointerId, pointerType: type, button: 0, clientX: x + jitter, clientY: 220 }));
        card.dataset.fileId = originalId;
      };

      // Each point is the exposed portion of a different member of the overlapping stack.
      pointer('touch', 11, 130, 8, true);
      pointer('pen', 12, 210, 6);
      pointer('mouse', 13, 290, 2);
      pointer('touch', 14, 290, 30);
      return activations;
    });

    expect(result).toEqual([
      { fileId: 'file-x', cardFileId: 'file-x' },
      { fileId: 'file-y', cardFileId: 'file-y' },
      { fileId: 'file-z', cardFileId: 'file-z' }
    ]);
  });

  test('vertical spin is unclamped: free trackball rotation continues past the old pitch limit', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    const fingerprints = await page.evaluate(async () => {
      const gallery = (window as any).SpatialGallery;
      const scene = gallery.elements.scene;
      scene.setPointerCapture = () => {};
      scene.releasePointerCapture = () => {};
      if (gallery.frameId) { cancelAnimationFrame(gallery.frameId); gallery.frameId = null; }
      gallery.requestFrame = () => {};
      const dispatch = (type: string, id: number, x: number, y: number) =>
        scene.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: 'mouse', button: 0, clientX: x, clientY: y }));
      const dragUp = (id: number, dyTotal: number) => {
        dispatch('pointerdown', id, 600, 500);
        for (let step = 1; step <= 5; step++) dispatch('pointermove', id, 600, 500 - (dyTotal * step) / 5);
        dispatch('pointerup', id, 600, 500 - dyTotal);
        gallery.velocityX = 0; gallery.velocityY = 0;
        if (gallery.frameId) { cancelAnimationFrame(gallery.frameId); gallery.frameId = null; }
        gallery.render(performance.now());
        return gallery.cards.map((card: any) => `${card.element.style.zIndex}|${card.element.style.transform}`).join('~');
      };
      // First drag pushes total pitch to ~2.7rad — far past the old ±1.35 clamp. Under the
      // clamp, the second drag produced zero further rotation; free rotation must keep moving.
      const afterBigDrag = dragUp(71, 450);
      const afterFollowUp = dragUp(72, 100);
      return { afterBigDrag, afterFollowUp };
    });
    expect(fingerprints.afterFollowUp).not.toEqual(fingerprints.afterBigDrag);
  });

  test('deleting an image in Focus pops the retained sphere back without a rebuild', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    // Mark every card element so we can prove the survivors are the same DOM nodes.
    await page.evaluate(() => {
      (window as any).SpatialGallery.cards.forEach((card: any, index: number) => { card.element.dataset.retainedMark = `mark-${index}`; });
    });
    await activateExploreFile(page, 'file-y');
    // While in Focus, remove file-y from the stack (simulates delete/move writeback) and
    // advance the current image, then exit back to the sphere.
    const result = await page.evaluate(async () => {
      const w = window as any;
      const state = w.__orbitalAppState;
      state.stacks[state.currentStack] = state.stacks[state.currentStack].filter((file: any) => file.id !== 'file-y');
      w.CurrentImage.set('file-x', state.currentStack, { allowCrossStack: false });
      state.inspection.fileId = 'file-x';
      await w.CanonicalInspection.exitToReferrer({ persist: false });
      const gallery = w.SpatialGallery;
      return {
        galleryHidden: document.getElementById('spatial-gallery')!.hidden,
        cardIds: gallery.cards.map((card: any) => card.fileId),
        marks: gallery.cards.map((card: any) => card.element.dataset.retainedMark || null),
        loadingHidden: (document.querySelector('#spatial-gallery .spatial-gallery__loading') as HTMLElement)?.hidden ?? true
      };
    });
    expect(result.galleryHidden).toBe(false);
    expect(result.cardIds.sort()).toEqual(['file-x', 'file-z']);
    // Every surviving card kept its original element: the resume was an insert/remove, not a rebuild.
    expect(result.marks.every(mark => typeof mark === 'string' && mark.startsWith('mark-'))).toBe(true);
    expect(result.loadingHidden).toBe(true);
  });

  test('far-hemisphere cards are culled from layers but the selected card never is', async ({ page }) => {
    await installDeterministicImages(page);
    await page.goto(uiUrl);
    await page.waitForFunction(() => !!(window as any).__orbitalAppState);
    await page.evaluate(({ base }) => {
      const state = (window as any).__orbitalAppState;
      const files = Array.from({ length: 40 }, (_, index) => {
        const id = `bulk-${index}`;
        return {
          id, name: id, stack: 'in', stackSequence: 1000 - index, metadataStatus: 'loaded',
          thumbnails: { medium: { url: `${base}/${id}-thumb.svg` }, large: { url: `${base}/${id}-display.svg` } },
          downloadUrl: `${base}/${id}-display.svg`
        };
      });
      state.imageFiles = files;
      state.currentFolder = { id: 'cull-test', name: 'Cull test' };
      state.providerType = 'test-provider';
      state.currentStack = 'in';
      state.currentStackPosition = 0;
      state.stacks = { in: [], out: [], priority: [], trash: [] };
      (window as any).SharedImageResources.clear();
      (window as any).Core.initializeStacks();
      document.querySelector('#app-container')?.classList.remove('hidden');
      return (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'bulk-0' });
    }, { base: 'https://focus-navigation.test' });
    await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 40);
    const cull = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      gallery.render(performance.now());
      const hidden = gallery.cards.filter((card: any) => card.element.style.visibility === 'hidden');
      const far = gallery.cards.filter((card: any) => card.element.classList.contains('far'));
      const pick = gallery.cardAtPoint(
        hidden[0] ? hidden[0].element.getBoundingClientRect().left + 1 : -1,
        hidden[0] ? hidden[0].element.getBoundingClientRect().top + 1 : -1
      );
      return {
        hiddenCount: hidden.length,
        farCount: far.length,
        selectedHidden: gallery.cards[gallery.selectedIndex]?.element.style.visibility === 'hidden',
        hiddenPickedId: pick && hidden.some((card: any) => card === pick) ? pick.fileId : null
      };
    });
    expect(cull.hiddenCount).toBeGreaterThan(0);
    expect(cull.farCount).toBeGreaterThan(0);
    expect(cull.selectedHidden).toBe(false);
    expect(cull.hiddenPickedId).toBeNull();
  });

  test('sphere population fetches all thumbnails eagerly with visible-first priority', async ({ page }) => {
    await installDeterministicImages(page);
    await page.goto(uiUrl);
    await page.waitForFunction(() => !!(window as any).__orbitalAppState);
    await page.evaluate(({ base }) => {
      const state = (window as any).__orbitalAppState;
      const files = Array.from({ length: 40 }, (_, index) => {
        const id = `bulk-${index}`;
        return {
          id, name: id, stack: 'in', stackSequence: 1000 - index, metadataStatus: 'loaded',
          thumbnails: { medium: { url: `${base}/${id}-thumb.svg` }, large: { url: `${base}/${id}-display.svg` } },
          downloadUrl: `${base}/${id}-display.svg`
        };
      });
      state.imageFiles = files;
      state.currentFolder = { id: 'bulk-population-test', name: 'Bulk population test' };
      state.providerType = 'test-provider';
      state.currentStack = 'in';
      state.currentStackPosition = 0;
      state.stacks = { in: [], out: [], priority: [], trash: [] };
      (window as any).SharedImageResources.clear();
      (window as any).Core.initializeStacks();
      document.querySelector('#app-container')?.classList.remove('hidden');
      return (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'bulk-0' });
    }, { base: 'https://focus-navigation.test' });
    await page.waitForFunction(() => (window as any).SpatialGallery.cards.length === 40);
    // Give deferred paths a beat, then require every card — including indices past the old
    // 18-card eager window — to be eager with its src already assigned.
    await page.waitForTimeout(150);
    const policy = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      return gallery.cards.map((card: any, index: number) => ({
        index,
        loading: card.image.loading,
        hasSrc: !!card.image.getAttribute('src')
      }));
    });
    expect(policy.length).toBe(40);
    for (const card of policy) {
      expect(card.loading, `card ${card.index} loading mode`).toBe('eager');
      expect(card.hasSrc, `card ${card.index} src assigned`).toBe(true);
    }
  });

  test('an uncached current image paints its thumb instead of holding a blank screen', async ({ page }) => {
    await installDeterministicImages(page);
    // Make the display rendition slow so the blank window would be visible without the thumb-first path.
    await page.route(imageUrl('file-y', 'display'), async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: imageSvg('#00ff00') });
    });
    await page.goto(uiUrl);
    await page.waitForFunction(() => !!(window as any).__orbitalAppState);
    await page.evaluate(({ resources }) => {
      const state = (window as any).__orbitalAppState;
      const files = ['file-x', 'file-y'].map((id, index) => ({
        id, name: id.toUpperCase(), stack: index === 0 ? 'in' : 'out', stackSequence: 100 - index, metadataStatus: 'loaded',
        thumbnails: { medium: { url: resources[id].thumb }, large: { url: resources[id].display } },
        downloadUrl: resources[id].display
      }));
      state.imageFiles = files;
      state.currentFolder = { id: 'blank-screen-test', name: 'Blank screen test' };
      state.providerType = 'test-provider';
      state.currentStack = 'in';
      state.currentStackPosition = 0;
      state.stacks = { in: [], out: [], priority: [], trash: [] };
      (window as any).SharedImageResources.clear();
      (window as any).Core.initializeStacks();
      document.querySelector('#app-container')?.classList.remove('hidden');
    }, {
      resources: Object.fromEntries(['file-x', 'file-y'].map(id => [id, {
        thumb: imageUrl(id, 'thumb'), display: imageUrl(id, 'display')
      }]))
    });

    // Switch to the 'out' stack whose head is uncached and whose display is slow.
    await page.evaluate(() => {
      const w = window as any;
      w.CurrentImage.set('file-y', 'out', { allowCrossStack: true });
      return w.Core.displayCurrentImage();
    });

    // Within well under the display delay, the center image must be visible showing the thumb.
    await page.waitForFunction(() => {
      const img = document.querySelector('#center-image') as HTMLImageElement;
      return img && img.style.opacity === '1' && (img.getAttribute('src') || '').includes('file-y-thumb');
    }, undefined, { timeout: 1000 });

    // The slow display rendition still arrives and replaces the thumb.
    await page.waitForFunction(() => {
      const img = document.querySelector('#center-image') as HTMLImageElement;
      return img && img.style.opacity === '1' && (img.getAttribute('src') || '').includes('file-y-display');
    }, undefined, { timeout: 4000 });

    // Stack-head warming: the other stack's head thumb has been requested into the shared cache.
    await page.waitForFunction(() => {
      const shared = (window as any).SharedImageResources;
      return Array.from(shared.entries.values()).some((entry: any) =>
        String(entry.fileId) === 'file-x' && entry.readyState !== 'idle');
    }, undefined, { timeout: 3000 });
  });

  test('a real tap on the live sphere activates exactly the painted frontmost card', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      gallery.velocityX = 0; gallery.velocityY = 0;
      if (gallery.frameId) { cancelAnimationFrame(gallery.frameId); gallery.frameId = null; }
    });
    // Derive the expected winner from painted geometry only (rect + inline z-index),
    // independent of the implementation under test, at the visual center of the front card.
    const target = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      const painted = gallery.cards.map((card: any) => ({
        fileId: card.fileId,
        rect: card.element.getBoundingClientRect(),
        z: Number(card.element.style.zIndex) || 0
      })).filter((c: any) => c.rect.width > 0);
      painted.sort((a: any, b: any) => b.z - a.z);
      const front = painted[0];
      const x = front.rect.left + front.rect.width / 2;
      const y = front.rect.top + front.rect.height / 2;
      const covering = painted.filter((c: any) => x >= c.rect.left && x <= c.rect.right && y >= c.rect.top && y <= c.rect.bottom);
      covering.sort((a: any, b: any) => b.z - a.z);
      return { fileId: covering[0].fileId, x, y };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForFunction(expected => (window as any).__orbitalAppState.inspection?.fileId === expected, target.fileId);
    expect(await page.evaluate(() => (window as any).__orbitalAppState.currentFileId)).toBe(target.fileId);
    expect(await page.evaluate(() => document.querySelector('#center-image')?.getAttribute('data-file-id'))).toBe(target.fileId);
  });

  test('coordinate picking overrides a misleading event target for down and release', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);

    const result = await page.evaluate(() => {
      const gallery = (window as any).SpatialGallery;
      if (gallery.frameId) cancelAnimationFrame(gallery.frameId);
      gallery.frameId = null;
      gallery.velocityX = 0;
      gallery.velocityY = 0;
      gallery.requestFrame = () => {};
      gallery.elements.scene.setPointerCapture = () => {};
      gallery.elements.scene.releasePointerCapture = () => {};

      // Fully overlapping, transformed cards sharing one point; file-z is painted frontmost.
      gallery.cards.forEach((card: any, index: number) => {
        card.element.style.cssText = `position: fixed; left: 120px; top: 180px; width: 160px; height: 120px; margin: 0; transform: rotate(${index}deg) !important; z-index: ${index + 1};`;
      });

      const activations: Array<{ fileId: string, cardFileId: string }> = [];
      const originalActivate = gallery.activateFileId.bind(gallery);
      gallery.activateFileId = (fileId: string, element: HTMLElement) => {
        activations.push({ fileId, cardFileId: gallery.cards.find((card: any) => card.element === element)?.fileId });
        return true;
      };

      const frontHit = gallery.cardAtPoint(200, 240);
      const backElement = gallery.cards[0].element as HTMLElement;
      const frontElement = gallery.cards[2].element as HTMLElement;

      // 1. Down dispatched on the BACK card element while the coordinates sit on the front card:
      //    the pressed card must be the one cardAtPoint returns, not the event target.
      backElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerId: 31, pointerType: 'mouse', button: 0, clientX: 200, clientY: 240 }));
      const pressed = {
        fileId: gallery.pressedFileId,
        cardFileId: gallery.cards.find((card: any) => card.element === gallery.pressedCard)?.fileId
      };
      backElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, pointerId: 31, pointerType: 'mouse', button: 0, clientX: 201, clientY: 240 }));

      // 2. Down on the front card, then raise a different card above the release point.
      //    composedPath still contains the pressed card, but it is no longer frontmost — no activation.
      frontElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerId: 32, pointerType: 'mouse', button: 0, clientX: 200, clientY: 240 }));
      gallery.cards[1].element.style.zIndex = '9';
      frontElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, pointerId: 32, pointerType: 'mouse', button: 0, clientX: 200, clientY: 240 }));
      gallery.cards[1].element.style.zIndex = '2';

      // 3. Real activation path: the front card's exact stable ID enters Focus.
      gallery.activateFileId = originalActivate;
      backElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerId: 33, pointerType: 'mouse', button: 0, clientX: 200, clientY: 240 }));
      backElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, pointerId: 33, pointerType: 'mouse', button: 0, clientX: 200, clientY: 240 }));

      return { frontFileId: frontHit?.fileId, pressed, activations };
    });

    expect(result.frontFileId).toBe('file-z');
    expect(result.pressed).toEqual({ fileId: 'file-z', cardFileId: 'file-z' });
    expect(result.activations).toEqual([{ fileId: 'file-z', cardFileId: 'file-z' }]);

    await page.waitForFunction(() => (window as any).__orbitalAppState.inspection?.fileId === 'file-z');
    expect(await page.evaluate(() => (window as any).__orbitalAppState.currentFileId)).toBe('file-z');
  });
});
