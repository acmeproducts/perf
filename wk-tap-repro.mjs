import { PNG } from 'pngjs';

const BASE = 'http://127.0.0.1:4723';
const j = (m, p, body) => fetch(BASE + p, { method: m, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json());

const session = await j('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'MiniBrowser', 'webkitgtk:browserOptions': { args: ['--automation'], binary: '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser' } } } });
const sid = session.value?.sessionId;
if (!sid) { console.error(JSON.stringify(session)); process.exit(1); }
const S = p => `/session/${sid}${p}`;
await j('POST', S('/window/rect'), { width: 1024, height: 820 });
await j('POST', S('/url'), { url: 'file:///home/claude/perf/ui-v2.html' });
const exec = (script, args = []) => j('POST', S('/execute/sync'), { script, args }).then(r => r.value);

for (let i = 0; i < 40; i++) {
  if (await exec('return typeof window.__orbitalAppState !== "undefined" && typeof window.SpatialGallery !== "undefined"')) break;
  await new Promise(r => setTimeout(r, 250));
}

const setup = await exec(`
  const state = window.__orbitalAppState;
  const colors = [];
  const files = Array.from({ length: 60 }, (_, i) => {
    const r = (i * 37 + 40) % 256, g = (i * 89 + 30) % 256, b = (i * 151 + 60) % 256;
    colors.push([r, g, b]);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="rgb(' + r + ',' + g + ',' + b + ')"/></svg>';
    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    return { id: 'c' + i, name: 'c' + i, stack: 'in', stackSequence: 1000 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url }, medium: { url }, large: { url } }, downloadUrl: url };
  });
  state.imageFiles = files;
  state.currentFolder = { id: 'wk-repro', name: 'wk-repro' };
  state.providerType = 'test-provider';
  state.currentStack = 'in';
  state.currentStackPosition = 0;
  state.stacks = { in: [], out: [], priority: [], trash: [] };
  window.SharedImageResources.clear();
  window.Core.initializeStacks();
  document.querySelector('#app-container')?.classList.remove('hidden');
  window.SpatialGallery.open({ stackName: 'in', fileId: 'c0' });
  return colors;
`);
for (let i = 0; i < 60; i++) {
  const n = await exec('const g=window.SpatialGallery; return g.cards.length===g.files.length && g.cards.every(c=>c.image.complete&&c.image.naturalWidth>0) ? g.cards.length : 0');
  if (n === 60) break;
  await new Promise(r => setTimeout(r, 250));
}
console.log('cards ready:', await exec('return window.SpatialGallery.cards.length'));

const colorToId = new Map(setup.map((c, i) => [c.join(','), 'c' + i]));
const shot = async () => PNG.sync.read(Buffer.from((await j('GET', S('/screenshot'))).value, 'base64'));
const px = (png, x, y) => { const i = (Math.round(y) * png.width + Math.round(x)) * 4; return [png.data[i], png.data[i+1], png.data[i+2]]; };
const matchColor = rgb => {
  let best = null, bestD = Infinity;
  for (const [key, id] of colorToId) {
    const [r, g, b] = key.split(',').map(Number);
    const d = Math.abs(r-rgb[0]) + Math.abs(g-rgb[1]) + Math.abs(b-rgb[2]);
    if (d < bestD) { bestD = d; best = id; }
  }
  return bestD <= 24 ? best : null;
};
const actions = async seq => { const r = await j('POST', S('/actions'), { actions: [seq] }); await j('DELETE', S('/actions')); return r; };
const ptr = list => actions({ type: 'pointer', id: 'finger', parameters: { pointerType: 'touch' }, actions: list });
const tap = (x, y) => ptr([
  { type: 'pointerMove', duration: 0, x: Math.round(x), y: Math.round(y) },
  { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 50 }, { type: 'pointerUp', button: 0 }
]);
const fling = (x1, y1, x2, y2, ms) => {
  const steps = 8, moves = [];
  for (let i = 1; i <= steps; i++) moves.push({ type: 'pointerMove', duration: Math.round(ms / steps), x: Math.round(x1 + (x2 - x1) * i / steps), y: Math.round(y1 + (y2 - y1) * i / steps) });
  return ptr([{ type: 'pointerMove', duration: 0, x: x1, y: y1 }, { type: 'pointerDown', button: 0 }, ...moves, { type: 'pointerUp', button: 0 }]);
};

const cx = 512, cy = 410;
const backToSphere = async () => {
  await exec(`
    const s = window.__orbitalAppState;
    if (s.inspection?.surface === 'focus') {
      const btn = document.getElementById('focus-origin-close');
      if (btn) { btn.disabled = false; }
    }
    return s.inspection?.surface || 'none';
  `);
  // exit via the same path the user takes: tap the Focus X
  const xRect = await exec(`const b=document.getElementById('focus-origin-close'); if(!b) return null; const r=b.getBoundingClientRect(); return r.width? {x:r.left+r.width/2,y:r.top+r.height/2}:null;`);
  if (xRect) { await tap(xRect.x, xRect.y); await new Promise(r => setTimeout(r, 500)); }
  const visible = await exec('return !window.SpatialGallery.elements.root.hidden');
  if (!visible) { await exec('window.SpatialGallery.open({ stackName: "in", fileId: window.__orbitalAppState.currentFileId || "c0" }); return 1;'); await new Promise(r => setTimeout(r, 500)); }
};

const runTrial = async (mode) => {
  await backToSphere();
  const orientBefore = await exec('return window.SpatialGallery.orient.join(",")');
  await fling(cx - 150, cy + 60, cx + 150, cy - 60, 160);
  if (mode === 'settled') {
    // Headless rAF throttling can freeze decay mid-glide; a settled sphere on device has
    // fully decayed velocities. Model that state exactly: zero them.
    await exec('const g=window.SpatialGallery; g.velocityX = 0; g.velocityY = 0; g.render(performance.now()); return 1;');
    await new Promise(r => setTimeout(r, 200));
  } else {
    await new Promise(r => setTimeout(r, 120)); // tap mid-glide
  }
  const orientAfter = await exec('return window.SpatialGallery.orient.join(",")');
  const rotated = orientBefore !== orientAfter;
  const png = await shot();
  let point = null, expected = null;
  for (const [dx, dy] of [[0,0],[45,25],[-50,-30],[75,-45],[-75,50],[30,65],[-35,-65],[95,15],[-95,-15],[60,50],[-60,-50]]) {
    const id = matchColor(px(png, cx + dx, cy + dy));
    if (id) { point = [cx + dx, cy + dy]; expected = id; break; }
  }
  if (!point) return { mode, rotated, skip: true };
  const glidingAtShot = await exec('const g=window.SpatialGallery; return Math.abs(g.velocityX)+Math.abs(g.velocityY) > 0.00015');
  await tap(point[0], point[1]);
  await new Promise(r => setTimeout(r, 800));
  let got = await exec('return { surface: window.__orbitalAppState.inspection?.surface || null, fileId: String(window.__orbitalAppState.inspection?.fileId || window.__orbitalAppState.currentFileId || "") }');
  if (mode === 'gliding') {
    // With the catch fix: the mid-glide tap must STOP the sphere without navigating.
    const stopped = await exec('const g=window.SpatialGallery; return Math.abs(g.velocityX)+Math.abs(g.velocityY) <= 0.00015');
    const stayed = got?.surface !== 'focus';
    if (!stopped || !stayed) return { mode, rotated, glidingAtShot, point, expected, caught: { stopped, stayed, got }, ok: false };
    // Second tap on the now-still sphere: re-read pixels, tap, must open exactly that card.
    const png2 = await shot();
    let point2 = null, expected2 = null;
    for (const [dx, dy] of [[0,0],[45,25],[-50,-30],[75,-45],[-75,50],[30,65],[-35,-65],[95,15],[-95,-15]]) {
      const id = matchColor(px(png2, cx + dx, cy + dy));
      if (id) { point2 = [cx + dx, cy + dy]; expected2 = id; break; }
    }
    if (!point2) return { mode, rotated, skip: true };
    await tap(point2[0], point2[1]);
    await new Promise(r => setTimeout(r, 800));
    got = await exec('return { surface: window.__orbitalAppState.inspection?.surface || null, fileId: String(window.__orbitalAppState.inspection?.fileId || window.__orbitalAppState.currentFileId || "") }');
    return { mode, rotated, glidingAtShot, caughtThenSelected: true, point: point2, expected: expected2, got, ok: got?.surface === 'focus' && got?.fileId === expected2 };
  }
  return { mode, rotated, glidingAtShot, point, expected, got, ok: got?.surface === 'focus' && got?.fileId === expected };
};

const out = { settled: [], gliding: [] };
for (let i = 0; i < 6; i++) out.settled.push(await runTrial('settled'));
for (let i = 0; i < 6; i++) out.gliding.push(await runTrial('gliding'));
for (const mode of ['settled', 'gliding']) {
  const trials = out[mode].filter(t => !t.skip);
  console.log(mode, 'trials:', trials.length, 'rotated:', trials.filter(t=>t.rotated).length, 'fail:', trials.filter(t => !t.ok).length);
  trials.filter(t => !t.ok).forEach(t => console.log('  FAIL', JSON.stringify(t)));
}
await j('DELETE', S(''));
