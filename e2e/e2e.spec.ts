// End-to-end acceptance suite for UI-V2-OWNER-ACCEPTANCE.md.
// Runs the whole workflow (Sort -> Focus -> Grid search/reorder -> Sort -> Explore -> Focus -> X -> stack switch
// -> Table -> Sort move -> Focus delete) on 500 images and checks, after every step, that every surface agrees on
// one stack order and one top image. Requires bench/server.mjs on :8766 with VARIANTS_DIR pointing at the repo.
import { test, devices } from '@playwright/test';
const FILE = process.env.UI || 'ui-v2.html';
for (const DEV of (process.env.DEVICES || 'Pixel 7,Desktop Chrome').split(',')) test(`e2e ${DEV}`, async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices[DEV] }); const page = await ctx.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  await page.addInitScript(() => { const f = window.fetch.bind(window); (window as any).fetch = (u: any, o: any) => { const m = typeof u === 'string' && u.match(/graph\.microsoft\.com\/v1\.0\/me\/drive\/items\/f(\d+)\/content/); return f(m ? 'http://127.0.0.1:8766/meta/' + m[1] : u, o); }; });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('http://127.0.0.1:8766/ui/' + FILE);
  await page.waitForFunction(() => { try { return !!eval('state') && !!eval('Core') && !!eval('Grid'); } catch { return false; } }, null, { timeout: 30000 });
  // Test fixture + helpers, installed once in the page.
  await page.evaluate(`(() => {
    const base = 'http://127.0.0.1:8766/img/';
    const mk = (id, n, stack, seq, name) => ({ id, name, mimeType: 'image/png', stack, stackSequence: seq, metadataStatus: 'loaded', tags: [], favorite: false, extractedMetadata: {},
      thumbnails: { small: { url: base + 'small/' + n }, medium: { url: base + 'medium/' + n }, large: { url: base + 'large/' + n } }, downloadUrl: base + 'large/' + n });
    const files = Array.from({ length: 500 }, (_, i) => mk('f' + i, i, 'in', 1e9 - i, (i % 100 === 37 ? 'sunset_' : 'img_') + i + '.png'));
    for (let i = 0; i < 20; i++) files.push(mk('p' + i, 600 + i, 'priority', 1e9 - i, 'pri_' + i + '.png'));
    state.imageFiles = files;
    state.currentFolder = { id: 'e2e', name: 'e2e' }; state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentStackPosition = 0; state.currentFileId = 'f0';
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    try { state.syncManager?.stop?.(); state.syncManager = null; } catch (e) {}
    state.provider = { getAccessToken: async () => 't', deleteFile: async () => true, moveFileToFolder: async () => true, updateFileMetadata: async () => true, makeApiCall: async () => new Response('{}') };
    if (!state.activeRequests) state.activeRequests = new AbortController();
    Core.initializeStacks(); try { Utils.showScreen('app-container'); } catch (e) {}
    window.__lt = []; window.__ltAt = []; window.__step = 'C1'; try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lt.push(e.duration); if (e.duration > 200) window.__ltAt.push('during ' + window.__step + '-next: ' + Math.round(e.duration) + 'ms'); })).observe({ type: 'longtask' }); } catch (e) {}
    const img = document.querySelector('#center-image'); window.__paints = [];
    img.addEventListener('load', () => window.__paints.push((img.currentSrc || img.src).split('/img/')[1] || img.src.slice(0, 30)));
    window.T = {
      ids: (stack, n = 12) => (state.stacks[stack] || []).slice(0, n).map(f => String(f.id)),
      cur: () => String(state.currentFileId),
      shownId: () => { const s = (img.currentSrc || img.src || ''); const m = s.match(/\\/img\\/(?:large|medium|small)\\/(\\d+)/); if (!m) return null; const n = +m[1]; return n >= 600 ? 'p' + (n - 600) : 'f' + n; },
      painted: () => img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity !== '0',
      gridIds: (n = 12) => [...document.querySelectorAll('#grid-container .grid-item')].slice(0, n).map(e => String(e.dataset.fileId)),
      exploreIds: (n = 12) => (SpatialGallery.files || []).slice(0, n).map(f => String(f.id)),
      tableIds: (n = 12) => (PhotoTable.photos || []).slice(0, n).map(p => String(p.fileId)),
      waitPaint: async (id, limit = 4000) => { const t0 = performance.now(); while (performance.now() - t0 < limit) { if (T.shownId() === id && T.painted()) return Math.round(performance.now() - t0); await new Promise(r => requestAnimationFrame(r)); } return null; },
      sleep: ms => new Promise(r => setTimeout(r, ms)),
    };
  })()`);
  const results: { id: string; item: string; pass: boolean; detail: string }[] = []; (globalThis as any).__x = [];
  const check = (id: string, item: string, pass: boolean, detail: string) => { results.push({ id, item, pass, detail }); return page.evaluate(`window.__step = '${id}'`); };
  const ev = <R>(js: string) => page.evaluate(js) as Promise<R>;
  const eq = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

  // C1 Sort starts at the top of the stack.
  await ev(`Core.displayCurrentImage()`); const c1 = await ev<number | null>(`T.waitPaint('f0')`);
  check('C1', 'Sort shows the top of the stack', c1 !== null && (await ev<string>(`T.cur()`)) === 'f0', `current=${await ev(`T.cur()`)} paint=${c1}ms`);
  await page.waitForTimeout(800);
  // C2 Sort -> Focus keeps the same image, no extra paint.
  await ev(`window.__paints = []`); await ev(`Gestures.toggleFocusMode()`); await page.waitForTimeout(400);
  const c2p = await ev<string[]>(`window.__paints`);
  check('C2', 'Sort -> Focus shows the same image, one step', (await ev<string>(`T.shownId()`)) === 'f0' && c2p.length <= 1, `shown=${await ev(`T.shownId()`)} repaints=${c2p.length}`);
  // C3 Focus next walks stack order, one paint per step, fast.
  const lat: (number | null)[] = []; let twoStep = 0; const walk: string[] = [];
  for (let i = 1; i <= 6; i++) { await page.waitForTimeout(350); await ev(`window.__paints = []`); await ev(`Gestures.nextImage()`); lat.push(await ev<number | null>(`T.waitPaint('f${i}')`)); walk.push(await ev<string>(`T.shownId()`)); if ((await ev<string[]>(`window.__paints`)).length > 1) twoStep++; }
  const lv = lat.filter((x): x is number => x !== null).sort((a, b) => a - b);
  const top3 = await ev<string[]>(`T.ids('in', 3)`);
  check('C3', 'Focus next follows stack order, one paint, fast; viewed image becomes top of stack', eq(walk, ['f1', 'f2', 'f3', 'f4', 'f5', 'f6']) && twoStep === 0 && lv.length === 6 && lv[3] <= 60 && top3[0] === 'f6', `walk=${walk.join(',')} latency=${lat.join('/')}ms twoStep=${twoStep} stackTop=${top3.join(',')}`);
  // C4 Focus back.
  for (let i = 0; i < 2; i++) { await page.waitForTimeout(350); await ev(`Gestures.prevImage()`); }
  const c4 = await ev<number | null>(`T.waitPaint('f4')`);
  const walk4: string[] = [];
  for (const [fn, want] of [['nextImage', 'f5'], ['nextImage', 'f6'], ['prevImage', 'f5'], ['prevImage', 'f4']] as const) { await page.waitForTimeout(300); await ev(`Gestures.${fn}()`); await ev(`T.waitPaint('${want}')`); walk4.push(await ev<string>(`T.cur()`)); }
  check('C4', 'Focus back/next never bounce (back twice, next, next, back, back)', c4 !== null && eq(walk4, ['f5', 'f6', 'f5', 'f4']), `after back x2=${c4 !== null ? 'f4' : 'miss'} then ${walk4.join(',')}`);
  // Leave Focus to Sort.
  await ev(`CanonicalInspection.exit()`); await page.waitForTimeout(500);
  // C5 Last viewed (f4) is the top: centre of Sort, top-left of Grid; Grid tiles are the stack order.
  const sort5 = await ev<string>(`T.cur()`);
  await ev(`Grid.open(state.currentStack)`); await page.waitForTimeout(700);
  const g = await ev<string[]>(`T.gridIds()`), s = await ev<string[]>(`T.ids('in')`);
  check('C5', 'Last viewed is Sort centre and Grid top-left; Grid tiles are the stack order', sort5 === 'f4' && g[0] === 'f4' && eq(g, s), `sort=${sort5} grid=${g.slice(0, 5).join(',')}.. stack=${s.slice(0, 5).join(',')}..`);
  // C6 Grid search: results go to the top of the stack, in order, and everything agrees.
  await ev(`(() => { Utils.elements.omniSearch.value = 'sunset'; Grid.performSearch(); })()`); await page.waitForTimeout(400);
  const hits = await ev<string[]>(`Grid.searchImages('sunset').map(f => String(f.id))`);
  await ev(`Grid.close()`); await page.waitForTimeout(700);
  const afterSearch = await ev<string[]>(`T.ids('in', ${hits.length})`);
  const sortAfterSearch = await ev<string>(`T.cur()`);
  check('C6', 'Grid search: results become the top of the stack; Sort shows the first result', hits.length === 5 && eq(afterSearch, hits) && sortAfterSearch === hits[0], `hits=${hits.join(',')} stackTop=${afterSearch.join(',')} sort=${sortAfterSearch}`);
  // C7 Grid reorder (drag a tile to top-left) commits on close; Sort shows the new top.
  await ev(`Grid.open(state.currentStack)`); await page.waitForTimeout(600);
  await ev(`Grid.applyReorder(['f250'], 0)`); await page.waitForTimeout(200); await ev(`Grid.close()`); await page.waitForTimeout(700);
  const top7 = await ev<string[]>(`T.ids('in', 3)`), sort7 = await ev<string>(`T.cur()`);
  check('C7', 'Grid reorder commits: dragged tile becomes top; Sort shows it', top7[0] === 'f250' && sort7 === 'f250', `stackTop=${top7.join(',')} sort=${sort7}`);
  // C8 Order survives a reload of the stacks (stackSequence is the truth).
  const before8 = await ev<string[]>(`T.ids('in', 20)`); await ev(`Core.initializeStacks()`); const after8 = await ev<string[]>(`T.ids('in', 20)`);
  check('C8', 'Stack order survives reload', eq(before8, after8), `before=${before8.slice(0, 6).join(',')} after=${after8.slice(0, 6).join(',')}`);
  await ev(`(() => { state.currentStackPosition = 0; state.currentFileId = state.stacks.in[0].id; return Core.displayCurrentImage(); })()`); await page.waitForTimeout(500);
  // C9 Explore population is the stack order.
  await ev(`SpatialGallery.open({ stackName: 'in', fileId: state.currentFileId })`); await page.waitForTimeout(2500);
  const ex = await ev<string[]>(`T.exploreIds()`), s9 = await ev<string[]>(`T.ids('in')`);
  check('C9', 'Explore shows the stack in order (first 500)', eq(ex, s9) && (await ev<number>(`SpatialGallery.files.length`)) === Math.min(500, await ev<number>(`state.stacks.in.length`)), `explore=${ex.slice(0, 5).join(',')}.. stack=${s9.slice(0, 5).join(',')}.. n=${await ev(`SpatialGallery.files.length`)}`);
  // C10 Explore tap opens exactly the tapped image (real input), Focus next goes to the next in stack order.
  const taps: string[] = []; let tapOk = 0, nextOk = 0; let lastViewed = '';
  for (let k = 0; k < 4; k++) {
    await ev(`(() => { SpatialGallery.velocityX = 0; SpatialGallery.velocityY = 0; })()`); await page.waitForTimeout(300);
    const tgt = await ev<{ id: string; x: number; y: number } | null>(`(() => { const x = innerWidth / 2 + ${(k % 2 ? 30 : -30)}, y = innerHeight / 2 + ${(k - 1.5) * 20}; const el = document.elementFromPoint(x, y)?.closest('.spatial-gallery__card'); return el ? { id: el.dataset.fileId, x, y } : null; })()`);
    if (!tgt) { taps.push('none'); continue; }
    const idx = await ev<number>(`state.stacks.in.findIndex(f => String(f.id) === '${tgt.id}')`); const nextId = await ev<string>(`String(state.stacks.in[${idx} + 1]?.id)`);
    if (DEV === 'Pixel 7') await page.touchscreen.tap(tgt.x, tgt.y); else await page.mouse.click(tgt.x, tgt.y);
    const p = await ev<number | null>(`T.waitPaint('${tgt.id}', 5000)`); if (p !== null) tapOk++;
    await page.waitForTimeout(300); await ev(`Gestures.nextImage()`); if ((await ev<number | null>(`T.waitPaint('${nextId}', 5000)`)) !== null) nextOk++;
    taps.push(`${tgt.id}->${await ev(`T.cur()`)}`); lastViewed = await ev<string>(`T.cur()`);
    // C11 measured on each: Focus X back to the globe.
    const built = await ev<number>(`(() => { window.__cc = 0; const f = SpatialGallery.createCard; SpatialGallery.__cc = SpatialGallery.__cc || f; SpatialGallery.createCard = function (...a) { window.__cc++; return SpatialGallery.__cc.apply(this, a); }; return 0; })()`);
    // App work = the X handler's own JavaScript; full = until that frame is drawn (the lab draws on the CPU,
    // with no GPU, so 'full' overstates the phone).
    const xt = await ev<{ app: number; full: number }>(`new Promise(r => { const t0 = performance.now(); CanonicalInspection.exit(); const app = performance.now() - t0; requestAnimationFrame(() => requestAnimationFrame(() => r({ app: Math.round(app), full: Math.round(performance.now() - t0) }))); })`);
    const rebuilt = await ev<number>(`window.__cc`); (globalThis as any).__x = [...((globalThis as any).__x || []), `${xt.app}ms(full ${xt.full})/${rebuilt}rebuilt`]; void built;
    await page.waitForTimeout(400);
  }
  check('C10', 'Explore tap opens the tapped image; Focus next is the next in stack order', tapOk === 4 && nextOk === 4, `taps ${taps.join(' ')} tapOk=${tapOk}/4 nextOk=${nextOk}/4`);
  const xs: string[] = (globalThis as any).__x || [];
  check('C11', 'Focus X returns to the globe: app work <= 60ms, no rebuild', xs.length === 4 && xs.every(x => parseInt(x) <= 60 && x.endsWith('/0rebuilt')), xs.join(' '));
  // C19 After globe -> Focus -> X, the last viewed image is the top: Grid top-left and Sort centre.
  const top19 = await ev<string>(`String(state.stacks.in[0].id)`);
  await ev(`Grid.open('in')`); await page.waitForTimeout(600); const grid19 = (await ev<string[]>(`T.gridIds(1)`))[0]; await ev(`Grid.close()`); await page.waitForTimeout(600);
  const sort19 = await ev<string>(`T.cur()`);
  check('C19', 'After globe -> Focus -> X: last viewed is top of stack, Grid top-left and Sort centre', top19 === lastViewed && grid19 === lastViewed && sort19 === lastViewed, `lastViewed=${lastViewed} stackTop=${top19} gridTopLeft=${grid19} sort=${sort19}`);
  await ev(`SpatialGallery.open({ stackName: 'in', fileId: state.currentFileId, preserveGeometry: true })`); await page.waitForTimeout(800);
  // C12 Explore stack switch and back: no rebuild on return.
  await ev(`(() => { SpatialGallery.close({ restoreFocus: false }); SpatialGallery.open({ stackName: 'priority', fileId: state.stacks.priority[0].id }); })()`); await page.waitForTimeout(1200);
  await ev(`window.__cc = 0`); await ev(`(() => { SpatialGallery.close({ restoreFocus: false }); SpatialGallery.open({ stackName: 'in', fileId: state.stacks.in[0].id }); })()`); await page.waitForTimeout(800);
  const rebuilt12 = await ev<number>(`window.__cc`);
  check('C12', 'Explore: switching back to a built stack does not rebuild', rebuilt12 === 0, `cards created on return=${rebuilt12}`);
  await ev(`SpatialGallery.close({ restoreFocus: false })`); await ev(`(() => { state.currentStack = 'in'; state.currentStackPosition = 0; state.currentFileId = state.stacks.in[0].id; return Core.displayCurrentImage(); })()`); await page.waitForTimeout(400);
  // C13 Table shows the stack in order.
  await ev(`PhotoTable.open({ stackName: 'in', fileId: state.currentFileId })`); await page.waitForTimeout(1200);
  const tb = await ev<string[]>(`T.tableIds()`), s13 = await ev<string[]>(`T.ids('in')`);
  check('C13', 'Table shows the stack in order', eq(tb, s13), `table=${tb.slice(0, 5).join(',')}.. stack=${s13.slice(0, 5).join(',')}..`);
  // C14 Table tap opens exactly the tapped image (real input).
  let t14 = 0; const t14s: string[] = [];
  for (let k = 0; k < 3; k++) {
    const tgt = await ev<{ id: string; x: number; y: number } | null>(`(() => { const ps = PhotoTable.photos.slice(${k * 3}); for (const p of ps) { const r = p.element.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const el = document.elementFromPoint(x, y)?.closest('.photo-table__print'); if (el === p.element) return { id: String(p.fileId), x, y }; } return null; })()`);
    if (!tgt) { t14s.push('none'); continue; }
    if (DEV === 'Pixel 7') await page.touchscreen.tap(tgt.x, tgt.y); else await page.mouse.click(tgt.x, tgt.y);
    const p = await ev<number | null>(`T.waitPaint('${tgt.id}', 5000)`); if (p !== null) t14++; t14s.push(`${tgt.id}->${await ev(`T.cur()`)}`);
    await ev(`CanonicalInspection.exit()`); await page.waitForTimeout(500);
  }
  check('C14', 'Table tap opens the tapped image', t14 === 3, t14s.join(' '));
  await ev(`PhotoTable.close({ restoreFocus: false, force: true })`); await ev(`(() => { try { ModeNavigation.hide(); } catch (e) {} state.currentStack = 'in'; state.currentStackPosition = 0; state.currentFileId = state.stacks.in[0].id; return Core.displayCurrentImage(); })()`); await page.waitForTimeout(500);
  // C15 Sort move: current image goes to the top of the target stack; Sort shows the next image.
  const moving = await ev<string>(`T.cur()`), following = await ev<string>(`String(state.stacks.in[1].id)`);
  await ev(`Core.moveToStack('priority', { source: 'e2e' })`); await page.waitForTimeout(700);
  const priTop = await ev<string>(`String(state.stacks.priority[0].id)`), sortNow = await ev<string>(`T.cur()`);
  check('C15', 'Sort move: image goes to top of target stack; Sort shows the next image', priTop === moving && sortNow === following, `moved=${moving} priorityTop=${priTop} sortNow=${sortNow} expected=${following}`);
  // C16 Focus delete: next image shown is the following one; stack no longer holds it.
  await ev(`Gestures.toggleFocusMode()`); await page.waitForTimeout(400);
  const del = await ev<string>(`T.cur()`), after = await ev<string>(`String(state.stacks.in[state.currentStackPosition + 1]?.id)`);
  await ev(`Core.deleteCurrentImage({ source: 'e2e' })`); await page.waitForTimeout(900);
  const cur16 = await ev<string>(`T.cur()`), still = await ev<boolean>(`state.stacks.in.some(f => String(f.id) === '${del}')`);
  check('C16', 'Focus delete: next image shown; deleted image gone from the stack', cur16 === after && !still, `deleted=${del} now=${cur16} expected=${after} stillInStack=${still}`);
  // C17 No main-thread freeze over 200ms during the whole run.
  const lt = await ev<number[]>(`window.__lt`);
  check('C17', 'No freeze over 200ms (lab draws on CPU; phone uses GPU)', lt.every(d => d <= 200), `longtasks=${lt.length} worst=${Math.round(Math.max(0, ...lt))}ms :: ${(await ev<string[]>(`window.__ltAt`)).join('; ')}`);
  check('C18', 'No page errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  const pass = results.filter(r => r.pass).length;
  console.log(`\nE2E ${FILE} [${DEV}] ${pass}/${results.length} passed`);
  for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.item}\n        ${r.detail}`);
  await ctx.close();
});
