import path from 'node:path'; import { test, expect, devices } from '@playwright/test';
const FILE = process.env.UI || 'ui-v2.html';
test.setTimeout(120000);
test.setTimeout(150000);
for (const dev of ['Pixel 7', 'Desktop Chrome'] as const) test(`${dev}: globe tap opens the tapped image`, async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices[dev] }); const page = await ctx.newPage();
  const errs: string[] = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + path.resolve(process.cwd(), process.env.UI || 'ui-v2.html'));
  await page.waitForFunction(() => !!(window as any).__orbitalAppState && !!(window as any).SpatialGallery);
  await page.evaluate(() => {
    const w = window as any, state = w.__orbitalAppState;
    const colors = ['#e11','#1e1','#11e','#ee1','#1ee','#e1e','#888','#f80','#08f','#8f0'];
    const svg = (i: number) => 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect fill="${colors[i%10]}" width="80" height="100"/><text x="10" y="60" font-size="40">${i}</text></svg>`);
    state.imageFiles = Array.from({ length: 40 }, (_, i) => ({ id: 'p' + i, name: 'p' + i, stack: 'in', stackSequence: 9000 - i, metadataStatus: 'loaded', thumbnails: { small: { url: svg(i) }, medium: { url: svg(i) }, large: { url: svg(i) } }, downloadUrl: svg(i) }));
    state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
    state.currentStack = 'in'; state.currentStackPosition = 0; state.currentFileId = 'p0';
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    try { state.syncManager?.stop?.(); state.syncManager = null; } catch {}
    w.Core.initializeStacks(); w.Utils.showScreen?.('app-container');
    document.querySelector('#app-container')?.classList.remove('hidden');
    w.SpatialGallery.open({ stackName: 'in', fileId: 'p0' });
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const w = window as any, G = w.Gestures, SG = w.SpatialGallery; w.__log = [];
    const log = (m: string) => w.__log.push(m);
    document.addEventListener('pointerdown', e => { const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.spatial-gallery__card') as HTMLElement|null; log('down:' + (el?.dataset.fileId ?? '-') + '/target:' + ((e.target as HTMLElement).closest?.('.spatial-gallery__card') as HTMLElement|null)?.dataset.fileId); }, true);
    for (const t of ['mousedown','mouseup','click']) document.addEventListener(t, (e: any) => log(t + (t==='click' ? '(d' + e.detail + ')' : '') + '@' + ((e.target as HTMLElement).id || (e.target as HTMLElement).className?.toString().split(' ')[0])), true);
    const wrap = (o: any, k: string, name: string) => { const f = o[k].bind(o); o[k] = (...a: any[]) => { log(name + '(' + (a[0] && typeof a[0] !== 'object' ? a[0] : '') + ')'); return f(...a); }; };
    wrap(SG, 'activateFileId', 'globeActivate'); wrap(G, 'nextImage', 'NEXT'); wrap(G, 'prevImage', 'PREV'); wrap(G, 'handleTap', 'sortFocusTap'); wrap(G, 'toggleFocusMode', 'toggleFocus');
    const ci = w.CurrentImage; wrap(ci, 'set', 'setCurrent');
  });
  const results: string[] = [];
  for (let trial = 0; trial < 20; trial++) {
    // Pick a visible card, alternating left/right of centre, and tap its centre.
    const t = await page.evaluate((trial) => {
      const g = (window as any).SpatialGallery; g.velocityX = 0; g.velocityY = 0; (window as any).__log = [];
      const cx = innerWidth / 2 + (trial % 2 ? 40 : -40), cy = innerHeight / 2 + (trial % 3 - 1) * 30;
      // What the browser itself says is on top at that point:
      const el = document.elementFromPoint(cx, cy)?.closest('.spatial-gallery__card') as HTMLElement | null;
      return el ? { id: el.dataset.fileId, x: cx, y: cy } : null;
    }, trial);
    if (!t) { results.push('no-card'); continue; }
    if (dev === 'Pixel 7') await page.touchscreen.tap(t.x, t.y); else await page.mouse.click(t.x, t.y);
    await page.waitForTimeout(900);
    const shown = await page.evaluate(() => { const s = (window as any).__orbitalAppState; return { focus: s.isFocusMode, id: String(s.inspection?.fileId ?? s.currentFileId), cur: String(s.currentFileId) }; });
    const log = await page.evaluate(() => (window as any).__log.join(' '));
    results.push(`\n   aimed ${t.id} -> shown ${shown.cur}${shown.focus ? '' : '(no focus)'} | ${log}`);
    // Exit Focus back to the globe.
    await page.evaluate(async () => { const w = window as any; await w.CanonicalInspection.exit?.(); });
    await page.waitForTimeout(700);
  }
  // Deliberate taps inside Focus must still navigate: open Focus on a card, then tap right half, then left half.
  const fx = await page.evaluate(() => { const g = (window as any).SpatialGallery; g.velocityX = 0; g.velocityY = 0; const el = document.elementFromPoint(innerWidth/2, innerHeight/2)?.closest('.spatial-gallery__card') as HTMLElement; return el?.dataset.fileId; });
  const vw = page.viewportSize()!.width, vh = page.viewportSize()!.height;
  const tapAt = (x: number, y: number) => dev === 'Pixel 7' ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
  await tapAt(vw/2, vh/2); await page.waitForTimeout(1200);
  const cur = () => page.evaluate(() => String((window as any).__orbitalAppState.currentFileId));
  const opened = await cur();
  await tapAt(vw*0.8, vh/2); await page.waitForTimeout(800); const afterRight = await cur();
  await tapAt(vw*0.2, vh/2); await page.waitForTimeout(800); const afterLeft = await cur();
  results.push(`\n   FOCUS-NAV globe tap ${fx} opened ${opened}; right tap -> ${afterRight}; left tap -> ${afterLeft}`);
  console.log('RESULT', dev, FILE, results.join('  '), errs.length ? 'ERRS:' + errs[0] : '');
  await ctx.close();
});
