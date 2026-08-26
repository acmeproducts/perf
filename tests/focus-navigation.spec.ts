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
      thumbnailBindingFileId: thumbnailBinding?.fileId,
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
      selectedCardDatasetFileId: 'file-x', surface: 'focus'
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
