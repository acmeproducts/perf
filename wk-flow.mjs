import { PNG } from 'pngjs';
const BASE = 'http://127.0.0.1:4723';
const j = (m, p, body) => fetch(BASE + p, { method: m, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json());
const session = await j('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'MiniBrowser', 'webkitgtk:browserOptions': { args: ['--automation'], binary: '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser' } } } });
const sid = session.value?.sessionId;
if (!sid) { console.error(JSON.stringify(session).slice(0,300)); process.exit(1); }
const S = p => `/session/${sid}${p}`;
await j('POST', S('/window/rect'), { width: 1024, height: 820 });
await j('POST', S('/url'), { url: 'file:///home/claude/perf/ui-v2.html' });
const exec = (s, a = []) => j('POST', S('/execute/sync'), { script: s, args: a }).then(r => r.value);
for (let i = 0; i < 40; i++) { if (await exec('return typeof window.__orbitalAppState !== "undefined" && typeof window.SpatialGallery !== "undefined"')) break; await new Promise(r => setTimeout(r, 250)); }

const colors = await exec(`
  const state = window.__orbitalAppState;
  // Instrument EVERY Focus enter with its call origin.
  window.__enters = [];
  const CI = window.CanonicalInspection;
  const realEnter = CI.enter.bind(CI);
  CI.enter = function(fileId, referrer, options) {
    window.__enters.push({ fileId: String(fileId), referrer: (referrer && referrer.surface) || String(referrer), stack: (new Error().stack || '').split('\\n').slice(2,5).join(' | ') });
    return realEnter(fileId, referrer, options);
  };
  const colors = [];
  const files = Array.from({ length: 40 }, (_, i) => {
    const r = (i * 37 + 40) % 256, g = (i * 89 + 30) % 256, b = (i * 151 + 60) % 256;
    colors.push([r, g, b]);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="rgb(' + r + ',' + g + ',' + b + ')"/></svg>';
    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    return { id: 'c' + i, name: 'c' + i, stack: 'in', stackSequence: 1000 - i, metadataStatus: 'loaded',
      thumbnails: { small: { url }, medium: { url }, large: { url } }, downloadUrl: url };
  });
  state.imageFiles = files;
  state.currentFolder = { id: 'flow', name: 'flow' };
  state.providerType = 'test-provider';
  state.currentStack = 'in';
  state.currentStackPosition = 0;
  state.stacks = { in: [], out: [], priority: [], trash: [] };
  window.SharedImageResources.clear();
  window.Core.initializeStacks();
  document.querySelector('#app-container')?.classList.remove('hidden');
  window.Core.initializeImageDisplay?.();
  // record which element receives every pointerdown
  window.__downs = [];
  document.addEventListener('pointerdown', e => { const t = e.target; window.__downs.push((t.id || t.className || t.tagName || '?').toString().slice(0, 60)); }, true);
  return colors;
`);
for (let i = 0; i < 60; i++) {
  const ok = await exec('const g=window.SpatialGallery; return g.cards.length===g.files.length && g.cards.every(c=>{const im=c.element.querySelector("img");return im&&im.complete&&im.naturalWidth>0;})');
  if (ok) break;
  await new Promise(r => setTimeout(r, 250));
}
const colorToId = new Map(colors.map((c, i) => [c.join(','), 'c' + i]));
const shot = async () => PNG.sync.read(Buffer.from((await j('GET', S('/screenshot'))).value, 'base64'));
const px = (png, x, y) => { const i = (Math.round(y) * png.width + Math.round(x)) * 4; return [png.data[i], png.data[i+1], png.data[i+2]]; };
const matchColor = rgb => { let best = null, d0 = Infinity; for (const [k, id] of colorToId) { const [r,g,b] = k.split(',').map(Number); const d = Math.abs(r-rgb[0])+Math.abs(g-rgb[1])+Math.abs(b-rgb[2]); if (d < d0) { d0 = d; best = id; } } return d0 <= 24 ? best : null; };
const act = async seq => { const r = await j('POST', S('/actions'), { actions: [seq] }); await j('DELETE', S('/actions')); return r; };
// Realistic touch tap: 9px of wobble during contact.
const tap = (x, y) => act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
  { type: 'pointerMove', duration: 0, x: Math.round(x), y: Math.round(y) },
  { type: 'pointerDown', button: 0 },
  { type: 'pointerMove', duration: 40, x: Math.round(x) + 2, y: Math.round(y) + 1 },
  { type: 'pause', duration: 30 }, { type: 'pointerUp', button: 0 }
] });
const churnyTap = async (x, y) => {
  // finger down...
  await act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 0, x: Math.round(x), y: Math.round(y) },
    { type: 'pointerDown', button: 0 }
  ] });
  // ...background sync re-renders the sphere while the finger is down...
  await exec('const g=window.SpatialGallery; g.rotationX += 0.35; if (g.render) try { g.render(performance.now()); } catch(e) {} return 1;');
  // ...finger up on the same spot.
  await act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 0, x: Math.round(x) + 2, y: Math.round(y) + 1 },
    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }
  ] }).catch(() => null);
  await act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 0, x: Math.round(x) + 2, y: Math.round(y) + 1 },
    { type: 'pointerUp', button: 0 }
  ] }).catch(() => null);
};

// Real entry path: double-tap the sort surface to raise the chooser, then choose Explore.
const gs = await exec('const el = document.getElementById("gesture-screen-a") || document.querySelector("[id^=gesture-screen]") || document.getElementById("image-container") || document.body; const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2, id: el.id || el.tagName };');
console.log('sort tap target:', JSON.stringify(gs));
await tap(gs.x, gs.y); await new Promise(r => setTimeout(r, 120)); await tap(gs.x, gs.y);
await new Promise(r => setTimeout(r, 700));
const chooser = await exec('const m = document.getElementById("mode-choice-modal"); return m ? { hidden: m.hidden } : null;');
console.log('chooser:', JSON.stringify(chooser));
if (chooser && !chooser.hidden) {
  const btn = await exec('const b = document.querySelector("[data-mode-choice=\'explore\']"); if(!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 };');
  if (btn) { await tap(btn.x, btn.y); await new Promise(r => setTimeout(r, 900)); }
} else {
  await exec('window.SpatialGallery.open({ stackName: "in", fileId: "c0" }); return 1;');
  await new Promise(r => setTimeout(r, 500));
}
for (let i = 0; i < 60; i++) {
  const ok = await exec('const g=window.SpatialGallery; return !g.elements.root.hidden && g.cards.length===g.files.length && g.cards.length>0 && g.cards.every(c=>{const im=c.element.querySelector("img");return im&&im.complete&&im.naturalWidth>0;})');
  if (ok) break;
  await new Promise(r => setTimeout(r, 250));
}
console.log('cards:', await exec('return window.SpatialGallery.cards.length'), 'sphereVisible:', await exec('return !window.SpatialGallery.elements.root.hidden'));

const rounds = [];
for (let round = 0; round < 5; round++) {
  await exec('const g=window.SpatialGallery; g.velocityX=0; g.velocityY=0; if(g.render) try{g.render(performance.now())}catch(e){} return 1;');
  const png = await shot();
  let point = null, expected = null;
  for (const [dx, dy] of [[0,0],[45,25],[-50,-30],[70,-40],[-70,45],[30,60],[-35,-60],[90,10]]) {
    const id = matchColor(px(png, 512 + dx, 410 + dy));
    if (id) { point = [512 + dx, 410 + dy]; expected = id; break; }
  }
  if (!point) { rounds.push({ round, skip: 'no color at probes' }); continue; }
  await exec('window.__enters.length = 0; window.__downs.length = 0; return 1;');
  // finger down; background render shifts the sphere; finger lifts.
  await act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 0, x: point[0], y: point[1] },
    { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 40 }
  ] });
  await exec('const g=window.SpatialGallery; g.rotationX += 0.3; if (g.render) try { g.render(performance.now()); } catch(e) {} return 1;');
  await act({ type: 'pointer', id: 'f', parameters: { pointerType: 'touch' }, actions: [
    { type: 'pointerMove', duration: 30, x: point[0] + 2, y: point[1] + 1 },
    { type: 'pointerUp', button: 0 }
  ] });
  await new Promise(r => setTimeout(r, 700));
  // The real device event: a background Drive refresh lands while the person views the
  // photo — files re-sorted (position shift), then the refresh's UI application runs.
  await exec(`
    const state = window.__orbitalAppState;
    state.imageFiles.forEach((f, i) => { f.stackSequence = 500 + ((i * 7) % 40) * 10; });
    const anchorId = state.currentFileId;
    const anchorStack = state.currentStack;
    window.Core.initializeStacks();
    if (window.__refreshApplies === 'legacy') {
      window.Core.updateStackCounts?.();
      window.Core.displayCurrentImage();
    } else {
      if (anchorId) window.CurrentImage.set(anchorId, anchorStack, { allowCrossStack: true });
      window.Core.updateStackCounts?.();
      const surfaceLive = state.isFocusMode || !window.SpatialGallery.elements?.root?.hidden || !window.PhotoTable.elements?.root?.hidden;
      if (!surfaceLive) window.Core.displayCurrentImage();
    }
    return 1;
  `);
  await new Promise(r => setTimeout(r, 350));
  const midView = await exec('const c = document.getElementById("center-image"); return { surface: window.__orbitalAppState.inspection?.surface || null, shownFileId: String(c?.dataset.fileId || ""), focusMode: window.__orbitalAppState.isFocusMode };');
  const afterTap = await exec('return { surface: window.__orbitalAppState.inspection?.surface || null, fileId: String(window.__orbitalAppState.inspection?.fileId || ""), enters: window.__enters, downs: window.__downs, referrer: window.CanonicalInspection.referrer?.surface || null }');
  // Real tap on the X.
  const xRect = await exec('const b=document.getElementById("focus-origin-close"); if(!b) return null; const r=b.getBoundingClientRect(); return r.width ? { x: r.left + r.width/2, y: r.top + r.height/2 } : null;');
  let afterExit = null;
  if (xRect) {
    await tap(xRect.x, xRect.y);
    await new Promise(r => setTimeout(r, 900));
    afterExit = await exec('return { sphereVisible: !window.SpatialGallery.elements.root.hidden, surface: window.__orbitalAppState.inspection?.surface || null, focusMode: window.__orbitalAppState.isFocusMode }');
  }
  rounds.push({ round, expected, tapOpened: afterTap.fileId,
    tapOk: afterTap.surface === 'focus' && afterTap.fileId === expected,
    stillShowingTapped: midView.surface === 'focus' && midView.shownFileId === expected,
    referrer: afterTap.referrer,
    exitBackOnSphere: afterExit?.sphereVisible === true && afterExit?.surface !== 'focus' });
  console.log(JSON.stringify(rounds[rounds.length-1]));
}
const bad = rounds.filter(r => !r.skip && (!r.tapOk || !r.stillShowingTapped || !r.exitBackOnSphere));
console.log('SUMMARY rounds:', rounds.filter(r=>!r.skip).length, 'failures:', bad.length);
await j('DELETE', S(''));
