import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
const uiUrl = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui-v2.html')}`;
const boot = async (page: import('@playwright/test').Page) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).PhotoTable && !!(window as any).SpatialGallery && !!(window as any).Gestures && !!(window as any).Grid && !!(window as any).CanonicalInspection);
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="teal" width="8" height="8"/></svg>');
    const mk = (id: string, i: number, stack: string) => ({ id, name: id, stack, stackSequence: 900 - i, metadataStatus: 'loaded', thumbnails: { medium: { url: svg } }, downloadUrl: svg });
    state.imageFiles = Array.from({ length: 20 }, (_, i) => mk('p' + i, i, 'priority'));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'priority'; state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    if ((window as any).Gestures.initGestureOverlay && !(window as any).Gestures.overlay) (window as any).Gestures.initGestureOverlay();
  });
};
const surf = (page: any) => page.evaluate(() => {
  const s = (window as any).__orbitalAppState;
  return { focus: s.isFocusMode === true, sphere: !(window as any).SpatialGallery.elements.root.hidden, table: !(window as any).PhotoTable.elements.root.hidden,
    grid: document.getElementById('grid-modal')?.classList.contains('hidden') === false,
    details: document.getElementById('details-modal')?.classList.contains('hidden') === false,
    id: String(s.inspection?.fileId || '') };
});

test('F1 table tap opens and stays on the tapped image', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => { const T=(window as any).PhotoTable; T.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); T.handleTap(T.photos.find((x:any)=>String(x.fileId)==='p8')); await new Promise(r=>setTimeout(r,200)); });
  expect((await surf(page)).id).toBe('p8');
});
test('F2 genuine Focus tap navigates', async ({ page }) => {
  await boot(page);
  const n = await page.evaluate(async () => { const T=(window as any).PhotoTable,G=(window as any).Gestures; T.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); T.handleTap(T.photos.find((x:any)=>String(x.fileId)==='p8')); await new Promise(r=>setTimeout(r,200)); let c=0; const o=G.nextImage.bind(G); G.nextImage=()=>{c++;return o();}; G.handleTap(700,400); await new Promise(r=>setTimeout(r,150)); return c; });
  expect(n).toBe(1);
});
test('F3 globe tap enters Focus on tapped id, stays', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => { const g=(window as any).SpatialGallery; g.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); await g.activateFileId('p5', g.cards.find((c:any)=>String(c.fileId)==='p5').element); await new Promise(r=>setTimeout(r,200)); });
  const s = await surf(page); expect(s.id).toBe('p5'); expect(s.focus).toBe(true); expect(s.grid).toBe(false);
});
test('F4 globe->Focus->X (real press) returns to globe, not grid/detail, one exit', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => { const g=(window as any).SpatialGallery; g.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); await g.activateFileId('p5', g.cards.find((c:any)=>String(c.fileId)==='p5').element); await new Promise(r=>setTimeout(r,200)); (window as any).__ref=0; const CI=(window as any).CanonicalInspection; const o=CI.exitToReferrer.bind(CI); CI.exitToReferrer=(...a:any[])=>{(window as any).__ref++;return o(...a);}; });
  const box = await page.evaluate(() => { const b=document.getElementById('focus-origin-close')!; const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; });
  await page.mouse.move(box.x,box.y); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(400);
  const s = await surf(page); const ref = await page.evaluate(()=>(window as any).__ref);
  expect(s.focus).toBe(false); expect(s.grid).toBe(false); expect(s.details).toBe(false); expect(s.sphere).toBe(true); expect(ref).toBeLessThanOrEqual(1);
});
test('F5 table->Focus->X returns to table, not grid/detail', async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => { const T=(window as any).PhotoTable; T.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); T.handleTap(T.photos.find((x:any)=>String(x.fileId)==='p5')); await new Promise(r=>setTimeout(r,200)); });
  const box = await page.evaluate(() => { const b=document.getElementById('focus-origin-close')!; const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; });
  await page.mouse.move(box.x,box.y); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(400);
  const s = await surf(page); expect(s.focus).toBe(false); expect(s.grid).toBe(false); expect(s.details).toBe(false); expect(s.table).toBe(true);
});
test('F6 exit storm: 7x exit() fires exitToReferrer exactly once', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => { const g=(window as any).SpatialGallery,CI=(window as any).CanonicalInspection; g.open({stackName:'priority',fileId:'p0'}); await new Promise(r=>setTimeout(r,250)); await g.activateFileId('p5', g.cards.find((c:any)=>String(c.fileId)==='p5').element); await new Promise(r=>setTimeout(r,200)); let c=0; const o=CI.exitToReferrer.bind(CI); CI.exitToReferrer=(...a:any[])=>{c++;return o(...a);}; for(let i=0;i<7;i++) CI.exit(); await new Promise(r=>setTimeout(r,400)); return c; });
  expect(r).toBe(1);
});
