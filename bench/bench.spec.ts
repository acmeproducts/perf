import { test, devices } from '@playwright/test';
const VARIANT = process.env.V || 'ui.html';
const N = Number(process.env.N || 500);
const META = process.env.META !== '0';
test('bench', async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices['Pixel 7'] }); const page = await ctx.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  // No page.route (it disables the HTTP cache). Metadata requests are redirected to the local server by a fetch shim.
  await page.addInitScript(() => { const f = window.fetch.bind(window); (window as any).fetch = (u: any, o: any) => { const m = typeof u === 'string' && u.match(/graph\.microsoft\.com\/v1\.0\/me\/drive\/items\/f(\d+)\/content/); return f(m ? 'http://127.0.0.1:8766/meta/' + m[1] : u, o); }; });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('http://127.0.0.1:8766/ui/' + VARIANT + (process.env.PERF ? '?perf=1' : ''));
  await page.waitForFunction(() => typeof (window as any).eval === 'function' && (() => { try { return !!eval('state') && !!eval('Core') && !!eval('Gestures'); } catch { return false; } })(), null, { timeout: 30000 });
  const result = await page.evaluate(`(async () => {
    const N = ${N};
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const longtasks = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => longtasks.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: false }); } catch (e) {}
    const base = 'http://127.0.0.1:8766/img/';
    state.imageFiles = Array.from({ length: N }, (_, i) => ({ id: 'f' + i, name: 'img' + i + '.png', mimeType: 'image/png', stack: 'in', stackSequence: 1e6 - i,
      metadataStatus: 'pending', tags: [], favorite: false,
      thumbnails: { small: { url: base + 'small/' + i }, medium: { url: base + 'medium/' + i }, large: { url: base + 'large/' + i } }, downloadUrl: base + 'large/' + i }));
    state.currentFolder = { id: 'bench', name: 'bench' }; state.providerType = 'test-provider'; state.currentStack = 'in'; state.currentStackPosition = 0; state.currentFileId = 'f0';
    state.stacks = { in: [], out: [], priority: [], trash: [] };
    try { state.syncManager?.stop?.(); state.syncManager = null; } catch (e) {}
    state.provider = { getAccessToken: async () => 'token', deleteFile: async () => true, makeApiCall: async () => new Response('') };
    if (!state.activeRequests) state.activeRequests = new AbortController();
    Core.initializeStacks();
    try { Utils.showScreen('app-container'); } catch (e) { document.querySelector('#app-container')?.classList.remove('hidden'); }
    const img = document.querySelector('#center-image');
    const painted = id => { const n = String(id).slice(1); return img && img.complete && img.naturalWidth > 0 && (img.currentSrc || img.src).includes('/large/' + n) && getComputedStyle(img).opacity !== '0'; };
    const waitPaint = async (id, limit = 4000) => { const t0 = performance.now(); while (performance.now() - t0 < limit) { if (painted(id)) return Math.round(performance.now() - t0); await new Promise(r => requestAnimationFrame(r)); } return null; };
    const blocked = (t0, t1) => { const inWin = longtasks.filter(l => l.t >= t0 && l.t <= t1); return { max: Math.round(Math.max(0, ...inWin.map(l => l.d))), total: Math.round(inWin.reduce((a, l) => a + Math.max(0, l.d - 50), 0)) }; };
    const out = { steps: [] };
    const step = async (label, fn, expectId) => { const t0 = performance.now(); await fn(); const paint = await waitPaint(expectId); const t1 = performance.now(); out.steps.push({ label, paint, ...blocked(t0, t1) }); };
    // Folder shown in Sort, then background metadata extraction starts (as after a real folder load).
    await step('sort first image', () => Core.displayCurrentImage(), 'f0');
    const metaStart = performance.now();
    const metaDone = ${META} ? App.extractMetadataInBackground(state.imageFiles.filter(f => f.mimeType === 'image/png')).then(() => performance.now() - metaStart) : Promise.resolve(0);
    await sleep(300);
    await step('sort -> focus', () => Gestures.toggleFocusMode(), 'f0');
    for (let i = 1; i <= 15; i++) { await sleep(350); await step('focus next', () => Gestures.nextImage(), 'f' + i); }
    for (let i = 14; i >= 10; i--) { await sleep(350); await step('focus back', () => Gestures.prevImage(), 'f' + i); }
    // Rapid taps: 4 nexts 120ms apart.
    await sleep(350); const tr = performance.now(); for (let i = 0; i < 4; i++) { Gestures.nextImage(); await sleep(120); } const rp = await waitPaint('f14'); out.steps.push({ label: 'focus 4 rapid nexts', paint: rp === null ? null : Math.round(performance.now() - tr - 360), ...blocked(tr, performance.now()) });
    await sleep(350);
    // Grid open: time until the first 12 grid thumbnails are painted.
    const g0 = performance.now(); try { Grid.open(state.currentStack); } catch (e) { out.gridError = String(e); }
    let gridPaint = null; while (performance.now() - g0 < 6000) { const imgs = [...document.querySelectorAll('#grid-container img, .grid-item img')].slice(0, 12); if (imgs.length >= 12 && imgs.every(i => i.complete && i.naturalWidth > 0)) { gridPaint = Math.round(performance.now() - g0); break; } await new Promise(r => requestAnimationFrame(r)); }
    out.steps.push({ label: 'grid open (first 12 thumbs)', paint: gridPaint, ...blocked(g0, performance.now()) });
    out.metaMs = Math.round(await Promise.race([metaDone, sleep(60000).then(() => -1)]));
    out.metaLoaded = state.imageFiles.filter(f => f.metadataStatus === 'loaded').length;
    out.order = state.stacks.in.slice(0, 8).map(f => f.id).join(',');
    out.res = performance.getEntriesByType('resource').filter(e => e.name.includes('/large/')).slice(0, 30).map(e => e.name.split('/large/')[1] + ':' + Math.round(e.startTime) + (e.transferSize === 0 ? 'C' : '')).join(' ');
    return out;
  })()`);
  if (process.env.PERF) console.log((await page.evaluate(() => (window as any).__perfSummary())).split('RAW')[0]);
  console.log('ORDER', (result as any).order); console.log('LARGE', (result as any).res);
  const r: any = result; const s = r.steps;
  const agg = (label: string) => { const xs = s.filter((x: any) => x.label === label); const p = xs.map((x: any) => x.paint); const miss = p.filter((v: any) => v === null).length; const vals = p.filter((v: any) => v !== null).sort((a: number, b: number) => a - b);
    return `${label}: median ${vals[Math.floor(vals.length / 2)] ?? '-'}ms worst ${vals[vals.length - 1] ?? '-'}ms${miss ? ' MISSED ' + miss : ''} | freeze max ${Math.max(...xs.map((x: any) => x.max))}ms`; };
  console.log(`BENCH ${VARIANT} :: ` + ['sort first image', 'sort -> focus', 'focus next', 'focus back', 'focus 4 rapid nexts', 'grid open (first 12 thumbs)'].map(agg).join(' || ') + ` || metadata ${r.metaLoaded}/${N} in ${r.metaMs}ms${r.gridError ? ' GRIDERR ' + r.gridError : ''}${errors.length ? ' PAGEERR ' + errors[0] : ''}`);
  await ctx.close();
});
