import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiPath = path.resolve(__dirname, '../ui-v2.html');
const uiUrl = `file://${uiPath}`;

test.describe('Focus navigation and grid selection sync', () => {
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
        { id: 'file-charlie', name: 'Charlie', stack: 'in', stackSequence: baseSequence - 30 }
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

    for (let step = 0; step < 3; step += 1) {
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

    expect(new Set(forwardSnapshots.map(item => item.displayedId)).size).toBeGreaterThan(1);

    const backwardSnapshots = [] as Array<{
      displayedId: string | null;
      displayedIndex: number;
      selectedIndex: number;
      traversalIndex: number;
      counter: string;
    }>;

    for (let step = 0; step < 3; step += 1) {
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

    expect(new Set(backwardSnapshots.map(item => item.displayedId)).size).toBeGreaterThan(1);

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
      const overlap = { left: 10, right: 110, top: 10, bottom: 110, width: 100, height: 100, x: 10, y: 10, toJSON() {} };
      back.element.getBoundingClientRect = () => overlap;
      front.element.getBoundingClientRect = () => overlap;
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
    expect(continuity.folderCleared).toBe(true);
    expect(continuity.modeCleared).toBe(true);
  });
});
