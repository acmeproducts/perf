import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiUrl = `file://${path.resolve(__dirname, 'ui-v2.html')}`;

// Every card's displayed pixels must belong to its fileId, and a tap must open that file.
// Runs after heavy churn: stack switches, Focus round trips, sort writebacks, deletes.

test('card pixels always belong to the card fileId through churn, and taps open the tapped picture', async ({ page }) => {
  await page.goto(uiUrl);
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);

  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const mk = (id: string, i: number, stack: string) => {
      const r = (i * 37 + 40) % 256, g = (i * 89 + 30) % 256, b = (i * 151 + 60) % 256;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="rgb(${r},${g},${b})"/></svg>`;
      const url = 'data:image/svg+xml;base64,' + btoa(svg);
      return { id, name: id, stack, stackSequence: 5000 - i, metadataStatus: 'loaded',
        thumbnails: { small: { url }, medium: { url }, large: { url } }, downloadUrl: url,
        __color: [r, g, b] };
    };
    const files: any[] = [];
    for (let i = 0; i < 80; i++) files.push(mk('in' + i, i, 'in'));
    for (let i = 0; i < 30; i++) files.push(mk('out' + i, 200 + i, 'out'));
    for (let i = 0; i < 30; i++) files.push(mk('pri' + i, 400 + i, 'priority'));
    state.imageFiles = files;
    state.currentFolder = { id: 'churn', name: 'churn' };
    state.providerType = 'test-provider';
    state.currentStack = 'in';
    state.currentStackPosition = 0;
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    (window as any).SharedImageResources.clear();
    (window as any).Core.initializeStacks();
    document.querySelector('#app-container')?.classList.remove('hidden');
    (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'in0' });
  });

  const waitPopulated = async () => {
    await page.waitForFunction(() => {
      const g = (window as any).SpatialGallery;
      return !g.elements.root.hidden && g.cards.length === g.files.length && g.cards.length > 0
        && g.cards.every((c: any) => c.image.complete && c.image.naturalWidth > 0 && c.image.getAttribute('src'));
    }, undefined, { timeout: 15000 });
  };
  await waitPopulated();

  const auditCards = async (label: string) => {
    const bad = await page.evaluate(() => {
      const state = (window as any).__orbitalAppState;
      const g = (window as any).SpatialGallery;
      const expected = new Map(state.imageFiles.map((f: any) => [String(f.id), f.thumbnails.medium.url]));
      const problems: any[] = [];
      g.cards.forEach((card: any, index: number) => {
        const src = card.image.getAttribute('src') || '';
        const want = expected.get(String(card.fileId));
        if (src !== want) problems.push({ index, fileId: card.fileId, srcTail: src.slice(-24), wantTail: (want || '').slice(-24) });
        if (String(card.element.dataset.fileId) !== String(card.fileId)) problems.push({ index, fileId: card.fileId, datasetMismatch: card.element.dataset.fileId });
        if (String(card.image.dataset.fileId) !== String(card.fileId)) problems.push({ index, fileId: card.fileId, imgDatasetMismatch: card.image.dataset.fileId });
        if (String(g.files[index]?.id) !== String(card.fileId)) problems.push({ index, fileId: card.fileId, filesOrderMismatch: g.files[index]?.id });
      });
      return problems;
    });
    expect(bad, label).toEqual([]);
  };

  const settle = () => page.evaluate(() => { const g = (window as any).SpatialGallery; g.velocityX = 0; g.velocityY = 0; g.render(performance.now()); });

  const tapFrontAndVerify = async (label: string) => {
    await settle();
    const target = await page.evaluate(() => {
      const g = (window as any).SpatialGallery;
      const painted = g.cards.map((card: any) => ({ fileId: card.fileId, src: card.image.getAttribute('src'), rect: card.element.getBoundingClientRect(), z: Number(card.element.style.zIndex) || 0 }))
        .filter((c: any) => c.rect.width > 0);
      painted.sort((a: any, b: any) => b.z - a.z);
      const f = painted[0];
      return { fileId: f.fileId, src: f.src, x: f.rect.left + f.rect.width / 2, y: f.rect.top + f.rect.height / 2 };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForFunction(() => (window as any).__orbitalAppState.inspection?.surface === 'focus', undefined, { timeout: 8000 });
    const opened = await page.evaluate(() => ({
      fileId: String((window as any).__orbitalAppState.inspection?.fileId || ''),
      centerSrc: (document.querySelector('#center-image') as HTMLImageElement | null)?.getAttribute('src') || ''
    }));
    expect(opened.fileId, `${label}: opened fileId`).toBe(String(target.fileId));
    // The picture the person sees in Focus must be the same picture that was on the tapped card.
    expect(opened.centerSrc, `${label}: focus shows the tapped picture`).toBe(target.src);
    // Exit Focus back to the sphere.
    await page.evaluate(() => { const b = document.getElementById('focus-origin-close') as HTMLButtonElement | null; if (b) { b.disabled = false; b.click(); } });
    await page.waitForFunction(() => !(window as any).SpatialGallery.elements.root.hidden, undefined, { timeout: 8000 });
  };

  await auditCards('fresh sphere');
  await tapFrontAndVerify('fresh sphere tap');

  // Churn 1: stack switch out and back.
  await page.evaluate(() => (window as any).SpatialGallery.open({ stackName: 'out', fileId: 'out0' }));
  await waitPopulated();
  await auditCards('after switch to out');
  await page.evaluate(() => (window as any).SpatialGallery.open({ stackName: 'in', fileId: 'in3' }));
  await waitPopulated();
  await auditCards('after switch back to in');
  await tapFrontAndVerify('tap after stack switches');

  // Churn 2: writeback — move current file to another stack while in Focus, then resume.
  await page.evaluate(() => {
    const g = (window as any).SpatialGallery;
    const front = g.cards[g.selectedIndex] || g.cards[0];
    return g.activateFileId(String(front.fileId));
  });
  await page.waitForFunction(() => (window as any).__orbitalAppState.inspection?.surface === 'focus');
  await page.evaluate(() => {
    const state = (window as any).__orbitalAppState;
    const id = String(state.inspection.fileId);
    (window as any).Core.moveImageToStack ? (window as any).Core.moveImageToStack(id, 'out') : (() => {
      const file = state.imageFiles.find((f: any) => String(f.id) === id);
      file.stack = 'out';
      (window as any).Core.initializeStacks();
    })();
  });
  await page.evaluate(() => { const b = document.getElementById('focus-origin-close') as HTMLButtonElement | null; if (b) { b.disabled = false; b.click(); } });
  await page.waitForFunction(() => !(window as any).SpatialGallery.elements.root.hidden, undefined, { timeout: 8000 });
  await page.waitForTimeout(400);
  await auditCards('after writeback resume');
  await tapFrontAndVerify('tap after writeback');

  // Churn 3: several rapid stack flips.
  for (const [stack, anchor] of [['priority', 'pri0'], ['in', 'in10'], ['out', 'out2'], ['in', 'in0']] as const) {
    await page.evaluate(([s, a]) => (window as any).SpatialGallery.open({ stackName: s, fileId: a }), [stack, anchor]);
    await waitPopulated();
  }
  await auditCards('after rapid flips');
  await tapFrontAndVerify('tap after rapid flips');
});
