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
    const selectedCard = (window as any).SpatialGallery.cards.find((card: any) => card.fileId === state.currentFileId);
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

test.describe('Focus navigation and grid selection sync', () => {
  test('keeps the selected Explore file and its image resource canonical across Focus transitions', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await page.evaluate(() => {
      (window as any).__retainedExploreCards = (window as any).SpatialGallery.cards.map((card: any) => card.element);
      (window as any).__retainedExploreImages = (window as any).SpatialGallery.cards.map((card: any) => card.element.querySelector('img'));
      (window as any).__retainedExploreInstrumentation = { ...(window as any).SharedImageResources.instrumentation };
    });

    await activateExploreFile(page, 'file-y');
    await expect.poll(async () => (await focusSnapshot(page)).currentSrc).toBe(imageUrl('file-y', 'display'));
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));

    await activateExploreFile(page, 'file-x');
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x',
      stackPosition: 0,
      promotedFileId: 'file-x',
      inspectionFileId: 'file-x',
      imageFileId: 'file-x',
      bindingFileId: 'file-x',
      currentSrc: imageUrl('file-x', 'display'),
      opacity: '1',
      naturalWidth: 2,
      selectedCardFileId: 'file-x',
      selectedCardDatasetFileId: 'file-x',
      thumbnailFileId: 'file-x',
      thumbnailBindingFileId: 'file-x',
      surface: 'focus'
    });

    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));
    await expect.poll(() => page.evaluate(() => ({
      surface: (window as any).__orbitalAppState.inspection?.surface,
      selectedFileId: (window as any).SpatialGallery.files[(window as any).SpatialGallery.selectedIndex]?.id,
      cardsRetained: (window as any).SpatialGallery.cards.every((card: any, index: number) => card.element === (window as any).__retainedExploreCards[index]),
      imagesRetained: (window as any).SpatialGallery.cards.every((card: any, index: number) => card.element.querySelector('img') === (window as any).__retainedExploreImages[index]),
      recreationCount: (window as any).SharedImageResources.instrumentation.elementRecreationsDuringMovement,
      sourceReplacementCount: (window as any).SharedImageResources.instrumentation.sourceReplacementsDuringMovement
    }))).toEqual({ surface: 'explore', selectedFileId: 'file-x', cardsRetained: true, imagesRetained: true, recreationCount: 0, sourceReplacementCount: 0 });

    await activateExploreFile(page, 'file-x');
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x',
      imageFileId: 'file-x',
      bindingFileId: 'file-x',
      currentSrc: imageUrl('file-x', 'display'),
      opacity: '1',
      naturalWidth: 2,
      surface: 'focus'
    });

    await page.evaluate(() => (window as any).Gestures.nextImage());
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-y', stackPosition: 0, promotedFileId: 'file-y',
      imageFileId: 'file-y', bindingFileId: 'file-y', currentSrc: imageUrl('file-y', 'display'), opacity: '1', naturalWidth: 2
    });
    await page.evaluate(() => (window as any).Gestures.prevImage());
    await expect.poll(async () => focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x', stackPosition: 0, promotedFileId: 'file-x',
      imageFileId: 'file-x', bindingFileId: 'file-x', currentSrc: imageUrl('file-x', 'display'), opacity: '1', naturalWidth: 2
    });
  });

  test('does not expose Y as X while X display loading or allow a stale callback to replace X', async ({ page }) => {
    await installDeterministicImages(page, true);
    await prepareExplore(page);

    await activateExploreFile(page, 'file-y');
    await expect.poll(async () => (await focusSnapshot(page)).currentSrc).toBe(imageUrl('file-y', 'display'));
    await page.evaluate(() => (window as any).CanonicalInspection.exitToReferrer({ persist: false }));

    await activateExploreFile(page, 'file-x');
    const loading = await focusSnapshot(page);
    expect(loading).toMatchObject({
      currentFileId: 'file-x',
      stackPosition: 0,
      promotedFileId: 'file-x',
      inspectionFileId: 'file-x',
      imageFileId: 'file-x',
      bindingFileId: 'file-x',
      selectedCardFileId: 'file-x',
      selectedCardDatasetFileId: 'file-x',
      thumbnailFileId: 'file-x',
      thumbnailBindingFileId: 'file-x',
      surface: 'focus'
    });
    expect([imageUrl('file-x', 'thumb'), '']).toContain(loading.currentSrc);
    expect(loading.currentSrc).not.toContain('file-y');
    expect(loading.opacity === '0' || loading.loadedKey === loading.bindingKey).toBe(true);

    await expect.poll(async () => (await focusSnapshot(page)).currentSrc).toBe(imageUrl('file-x', 'display'));
    await page.waitForTimeout(600);
    expect(await focusSnapshot(page)).toMatchObject({
      currentFileId: 'file-x',
      imageFileId: 'file-x',
      bindingFileId: 'file-x',
      currentSrc: imageUrl('file-x', 'display'),
      opacity: '1',
      naturalWidth: 2
    });

    await page.evaluate(() => (window as any).App.resetViewState({ skipEmptyState: true }));
    await page.waitForTimeout(600);
    const reset = await focusSnapshot(page);
    expect(reset.surface).toBeNull();
    expect(reset.currentSrc).toBe('');
    expect(reset.currentSrc).not.toContain('file-y');
  });

  test('removes a provider-trashed canonical file from Focus and retained surface populations', async ({ page }) => {
    await installDeterministicImages(page);
    await prepareExplore(page);
    await activateExploreFile(page, 'file-y');
    await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      state.provider = { deleteFile: async () => true };
      state.dbManager = { scheduleFolderCacheSave: async () => true };
    });
    await page.evaluate(() => (window as any).Core.deleteCurrentImage({ exitFocusIfEmpty: true, source: 'test' }));
    await page.evaluate(() => (window as any).Gestures.nextImage());
    await page.evaluate(() => (window as any).Gestures.prevImage());
    const result = await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      return {
        currentFileId: state.currentFileId,
        stackPosition: state.currentStackPosition,
        stackFirst: state.stacks.in[0]?.id,
        imageFiles: state.imageFiles.map((file: any) => file.id),
        stackFiles: state.stacks.in.map((file: any) => file.id),
        exploreFiles: (window as any).SpatialGallery.files.map((file: any) => file.id),
        exploreCards: (window as any).SpatialGallery.cards.map((card: any) => card.fileId),
        centerFileId: (document.querySelector('#center-image') as HTMLImageElement).dataset.fileId
      };
    });
    expect(result.currentFileId).not.toBe('file-y');
    expect(result.stackPosition).toBe(0);
    expect(result.stackFirst).toBe(result.currentFileId);
    expect([...result.imageFiles, ...result.stackFiles, ...result.exploreFiles, ...result.exploreCards]).not.toContain('file-y');
    expect(result.centerFileId).toBe(result.currentFileId);
  });

  test('iterates through images with grid selection and counters aligned', async ({ page }) => {
    await page.route('https://alcdn.msauth.net/**', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.msal = window.msal || {};'
      });
    });

    await page.goto(uiUrl);
    await page.waitForFunction(() => typeof window !== 'undefined' && !!(window as any).__orbitalAppState);
    await page.evaluate(() => {
      (window as any).__state = (window as any).__orbitalAppState;
      (window as any).__Core = (window as any).Core;
      (window as any).__Grid = (window as any).Grid;
      (window as any).__Gestures = (window as any).Gestures;
      (window as any).__Utils = (window as any).Utils;
    });

    await page.evaluate(async () => {
      const state = (window as any).__state;
      const Core = (window as any).__Core;
      const Grid = (window as any).__Grid;
      const Utils = (window as any).__Utils;

      const baseSequence = 10_000_000;
      const sample = [
        { id: 'file-alpha', name: 'Alpha', stack: 'in', stackSequence: baseSequence - 10 },
        { id: 'file-bravo', name: 'Bravo', stack: 'in', stackSequence: baseSequence - 20 },
        { id: 'file-charlie', name: 'Charlie', stack: 'in', stackSequence: baseSequence - 30 },
        { id: 'file-delta', name: 'Delta', stack: 'in', stackSequence: baseSequence - 40 },
        { id: 'file-echo', name: 'Echo', stack: 'in', stackSequence: baseSequence - 50 },
        { id: 'file-foxtrot', name: 'Foxtrot', stack: 'in', stackSequence: baseSequence - 60 }
      ];

      state.imageFiles = sample.map(file => ({
        ...file,
        metadataStatus: 'loaded'
      }));
      state.currentFolder = { id: 'test-folder', name: 'Test Folder' };
      state.providerType = 'googledrive';
      state.currentStack = 'in';
      state.focusTraversalIndex = 0;
      state.currentStackPosition = 0;
      state.isFocusMode = true;
      state.stacks = { in: [], out: [], priority: [], trash: [] };

      Core.initializeStacks();
      await Core.displayTopImageFromStack('in');
      Utils.elements.appContainer.classList.add('focus-mode');
      Grid.open('in');
      Grid.syncSelectionWithFocus();
    });

    await page.waitForSelector('#grid-container .grid-item');

    const forwardSnapshots = [] as Array<{
      displayedId: string | null;
      displayedIndex: number;
      selectedIndex: number;
      traversalIndex: number;
      counter: string;
    }>;

    for (let step = 0; step < 6; step += 1) {
      const snapshot = await page.evaluate(async () => {
        const Gestures = (window as any).__Gestures;
        const state = (window as any).__state;
        const Utils = (window as any).__Utils;
        await Gestures.nextImage();
        const stack = state.stacks[state.currentStack] || [];
        const displayedIndex = state.currentStackPosition;
        const displayedFile = stack[displayedIndex] || null;
        const selectedId = state.grid.selected.length === 1 ? state.grid.selected[0] : null;
        const selectedIndex = selectedId ? stack.findIndex((file: any) => file.id === selectedId) : -1;
        return {
          displayedId: displayedFile ? displayedFile.id : null,
          displayedIndex,
          selectedIndex,
          traversalIndex: state.focusTraversalIndex,
          counter: Utils.elements.focusImageCount?.textContent || ''
        };
      });

      expect(snapshot.displayedId).not.toBeNull();
      expect(snapshot.displayedIndex).toBe(0);
      expect(snapshot.selectedIndex).toBe(snapshot.displayedIndex);
      expect(snapshot.counter).toContain(`${snapshot.traversalIndex + 1}`);
      forwardSnapshots.push(snapshot);
    }

    expect(forwardSnapshots.map(item => item.displayedId)).toEqual(['file-bravo', 'file-charlie', 'file-delta', 'file-echo', 'file-foxtrot', 'file-alpha']);

    const backwardSnapshots = [] as Array<{
      displayedId: string | null;
      displayedIndex: number;
      selectedIndex: number;
      traversalIndex: number;
      counter: string;
    }>;

    for (let step = 0; step < 6; step += 1) {
      const snapshot = await page.evaluate(async () => {
        const Gestures = (window as any).__Gestures;
        const state = (window as any).__state;
        const Utils = (window as any).__Utils;
        await Gestures.prevImage();
        const stack = state.stacks[state.currentStack] || [];
        const displayedIndex = state.currentStackPosition;
        const displayedFile = stack[displayedIndex] || null;
        const selectedId = state.grid.selected.length === 1 ? state.grid.selected[0] : null;
        const selectedIndex = selectedId ? stack.findIndex((file: any) => file.id === selectedId) : -1;
        return {
          displayedId: displayedFile ? displayedFile.id : null,
          displayedIndex,
          selectedIndex,
          traversalIndex: state.focusTraversalIndex,
          counter: Utils.elements.focusImageCount?.textContent || ''
        };
      });

      expect(snapshot.displayedId).not.toBeNull();
      expect(snapshot.displayedIndex).toBe(0);
      expect(snapshot.selectedIndex).toBe(snapshot.displayedIndex);
      expect(snapshot.counter).toContain(`${snapshot.traversalIndex + 1}`);
      backwardSnapshots.push(snapshot);
    }

    expect(backwardSnapshots.map(item => item.displayedId)).toEqual(['file-foxtrot', 'file-echo', 'file-delta', 'file-charlie', 'file-bravo', 'file-alpha']);

    const continuity = await page.evaluate(async () => {
      const state = (window as any).__state;
      const Grid = (window as any).__Grid;
      const Utils = (window as any).__Utils;
      const SpatialGallery = (window as any).SpatialGallery;
      const PhotoTable = (window as any).PhotoTable;
      const CanonicalInspection = (window as any).CanonicalInspection;
      const App = (window as any).App;

      Utils.hideModal('grid-modal');
      Grid.resetAfterClose();
      state.isFocusMode = false;
      const beforeRotation = state.stacks.in.map((file: any) => file.id);
      SpatialGallery.open({ stackName: 'in', fileId: beforeRotation[0] });
      SpatialGallery.render(performance.now());
      const fullOpacity = SpatialGallery.cards.every((card: any) => card.element.style.opacity === '1');
      SpatialGallery.rotationX += 1;
      SpatialGallery.render(performance.now());
      const rotationPreservedOrder = JSON.stringify(beforeRotation) === JSON.stringify(state.stacks.in.map((file: any) => file.id));

      const [back, front] = SpatialGallery.cards;
      const backRect = { left: 10, right: 110, top: 10, bottom: 110, width: 100, height: 100, x: 10, y: 10, toJSON() {} };
      const frontRect = { left: 45, right: 145, top: 45, bottom: 145, width: 100, height: 100, x: 45, y: 45, toJSON() {} };
      back.element.getBoundingClientRect = () => backRect;
      front.element.getBoundingClientRect = () => frontRect;
      back.renderDepth = -0.8;
      front.renderDepth = 0.8;
      const topmostHitId = SpatialGallery.cardAtPoint(50, 50)?.fileId;
      const requestedId = front.fileId;
      await SpatialGallery.activateFileId(requestedId, front.element);
      const focusId = state.currentFileId;
      const promotedId = state.stacks.in[0]?.id;
      CanonicalInspection.exitToReferrer({ persist: false });
      const highlightedId = SpatialGallery.files[SpatialGallery.selectedIndex]?.id;
      await SpatialGallery.activateFileId(highlightedId, SpatialGallery.cards.find((card: any) => card.fileId === highlightedId)?.element);
      const reopenedId = state.currentFileId;
      CanonicalInspection.exitToReferrer({ persist: false });
      Grid.open('in', { origin: { surface: 'explore', stackName: 'in', fileId: state.currentFileId } });
      const gridFirstId = state.grid.lazyLoadState.allFiles[0]?.id;
      Utils.hideModal('grid-modal');
      Grid.resetAfterClose();
      PhotoTable.open({ stackName: 'in', fileId: state.currentFileId });
      const tableActiveId = PhotoTable.currentFileId;
      const tableFirstId = PhotoTable.photos[0]?.fileId;
      const tablePhoto = PhotoTable.photos[0];
      const tableElement = tablePhoto?.element;
      const tableX = tablePhoto?.x;
      if (tablePhoto) { tablePhoto.state = 'thrown'; tablePhoto.velocityX = 6; tablePhoto.velocityY = 0; PhotoTable.animate(); }
      const tablePhysicsMoved = Boolean(tablePhoto && tablePhoto.x > tableX && PhotoTable.frameId);
      PhotoTable.adjustControl('scale', 10);
      const tableResizeRetainedElement = tablePhoto?.element === tableElement && tablePhoto?.element.style.width !== '';
      const tableControlValues = { scale: PhotoTable.thumbnailScale, limit: PhotoTable.imageLimit };
      App.resetViewState({ skipEmptyState: true });

      return {
        fullOpacity,
        rotationPreservedOrder,
        topmostHitId,
        requestedId,
        focusId,
        promotedId,
        highlightedId,
        reopenedId,
        gridFirstId,
        tableActiveId,
        tableFirstId,
        tablePhysicsMoved,
        tableResizeRetainedElement,
        tableControlValues,
        folderCleared: state.currentFolder.id === null,
        modeCleared: state.inspection.surface === null && (window as any).SpatialGallery.elements.root.hidden
      };
    });

    expect(continuity.fullOpacity).toBe(true);
    expect(continuity.rotationPreservedOrder).toBe(true);
    expect(continuity.topmostHitId).toBe(continuity.requestedId);
    expect(continuity.focusId).toBe(continuity.requestedId);
    expect(continuity.promotedId).toBe(continuity.requestedId);
    expect(continuity.highlightedId).toBe(continuity.requestedId);
    expect(continuity.reopenedId).toBe(continuity.requestedId);
    expect(continuity.gridFirstId).toBe(continuity.requestedId);
    expect(continuity.tableActiveId).toBe(continuity.requestedId);
    expect(continuity.tableFirstId).toBe(continuity.requestedId);
    expect(continuity.tablePhysicsMoved).toBe(true);
    expect(continuity.tableResizeRetainedElement).toBe(true);
    expect(continuity.tableControlValues.scale).toBeGreaterThan(1);
    expect(continuity.tableControlValues.limit).toBe(24);
    expect(continuity.folderCleared).toBe(true);
    expect(continuity.modeCleared).toBe(true);
  });
});
