import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const uiUrl = `file://${path.resolve(path.dirname(__filename), 'ui-v2.html')}`;

test('tap after background re-list with reordered stack opens the tapped file', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);

  const build = (generation: number) => `(function(){
    return Array.from({ length: 16 }, function(_, i) {
      var id = 'f' + i;
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="rgb(' + (i*15) + ',' + (255-i*15) + ',99)"/></svg>';
      var url = 'data:image/svg+xml;base64,' + btoa(svg) + '#g${generation}';
      var seq = ${generation} === 0 ? (1000 - i) : (500 + ((i * 7) % 16) * 10);
      return { id: id, name: id, stack: 'in', stackSequence: seq, metadataStatus: 'loaded',
        thumbnails: { small: { url: url }, medium: { url: url }, large: { url: url } }, downloadUrl: url };
    });
  })()`;

  await page.evaluate(filesExpr => {
    const state = (window as any).__orbitalAppState;
    state.imageFiles = (0, eval)(filesExpr);
    state.currentFolder = { id: 'relist', name: 'relist' };
    state.providerType = 'test-provider';
    state.currentStack = 'in';
    state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).SharedImageResources.clear();
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'f0' });
  }, build(0));

  await page.waitForFunction(() => {
    const g = (window as any).SpatialGallery;
    return !g.elements.root.hidden && g.cards.length === g.files.length && g.cards.length > 0;
  });

  await page.evaluate(filesExpr => {
    const state = (window as any).__orbitalAppState;
    state.imageFiles = (0, eval)(filesExpr);
    (window as any).Core.initializeStacks();
  }, build(1));

  const check = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const g = (window as any).SpatialGallery;
    g.velocityX = 0; g.velocityY = 0;
    const card = g.cards[3];
    const tappedId = String(card.fileId);
    const staleObjects = !g.files.every((f: any) => state.imageFiles.includes(f));
    const result = await g.activateFileId(tappedId, card.element);
    await new Promise(r => setTimeout(r, 300));
    const center = document.querySelector('#center-image') as HTMLImageElement | null;
    return {
      tappedId, staleObjects, result,
      inspectionId: String(state.inspection?.fileId || ''),
      currentFileId: String(state.currentFileId || ''),
      centerFileId: String(center?.dataset.fileId || ''),
      centerSrc: (center?.getAttribute('src') || '').slice(-6),
      expectedSrcTail: (state.imageFiles.find((f: any) => String(f.id) === tappedId)?.thumbnails.medium.url || '').slice(-6)
    };
  });

  expect(check.staleObjects, 'sphere must hold stale objects for this repro to be valid').toBe(true);
  expect(check.inspectionId, 'inspection id').toBe(check.tappedId);
  expect(check.currentFileId, 'currentFileId after display').toBe(check.tappedId);
  expect(check.centerFileId, 'focus center image belongs to tapped file').toBe(check.tappedId);
});
