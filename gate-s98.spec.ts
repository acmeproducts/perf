import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;

test('§98 in Focus, repeated displayCurrentImage calls + position drift cannot move the pinned subject', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).CanonicalInspection);
  const out = await page.evaluate(async () => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    state.imageFiles = Array.from({ length: 30 }, (_, i) => ({ id: 't' + i, name: 't' + i, stack: 'priority', stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    const T = (window as any).PhotoTable;
    T.open({ stackName: 'priority', fileId: 't0' });
    await new Promise(r => setTimeout(r, 250));
    const photo = T.photos.find((p: any) => String(p.fileId) === 't10');
    T.handleTap(photo);   // pin t10
    await new Promise(r => setTimeout(r, 200));
    const afterTap = String(state.inspection?.fileId || '');
    // Reproduce the trace: position drifts and displayCurrentImage is called repeatedly.
    state.currentStackPosition = state.currentStackPosition - 1;
    state.currentFileId = state.stacks.priority[state.currentStackPosition]?.id;
    await (window as any).Core.displayCurrentImage();
    state.currentStackPosition = state.currentStackPosition - 1;
    state.currentFileId = state.stacks.priority[state.currentStackPosition]?.id;
    await (window as any).Core.displayCurrentImage();
    await new Promise(r => setTimeout(r, 150));
    return {
      afterTap,
      pinnedNow: String(state.inspection?.fileId || ''),
      centerId: String((document.getElementById('center-image') as HTMLElement)?.dataset.fileId || '')
    };
  });
  expect(out.afterTap).toBe('t10');
  expect(out.pinnedNow).toBe('t10');                       // pin never drifted
  expect(out.centerId === 't10' || out.centerId === '').toBe(true);
});
