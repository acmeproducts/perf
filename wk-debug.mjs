const BASE = 'http://127.0.0.1:4723';
const j = (m, p, body) => fetch(BASE + p, { method: m, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json());
const session = await j('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'MiniBrowser', 'webkitgtk:browserOptions': { args: ['--automation'], binary: '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser' } } } });
const sid = session.value.sessionId;
const S = p => `/session/${sid}${p}`;
await j('POST', S('/window/rect'), { width: 1024, height: 820 });
await j('POST', S('/url'), { url: 'file:///home/claude/perf/ui-v2.html' });
const exec = (s, a=[]) => j('POST', S('/execute/sync'), { script: s, args: a }).then(r => r.value);
for (let i = 0; i < 40; i++) { if (await exec('return typeof window.SpatialGallery !== "undefined"')) break; await new Promise(r => setTimeout(r, 250)); }
await exec(`
  const state = window.__orbitalAppState;
  const url = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>');
  const files = Array.from({ length: 30 }, (_, i) => ({ id: 'c'+i, name: 'c'+i, stack: 'in', stackSequence: 1000-i, metadataStatus: 'loaded', thumbnails: { medium: { url } }, downloadUrl: url }));
  state.imageFiles = files; state.currentFolder = { id: 'd', name: 'd' }; state.providerType = 'test-provider';
  state.currentStack = 'in'; state.currentStackPosition = 0; state.stacks = { in: [], out: [], priority: [], trash: [] };
  window.SharedImageResources.clear(); window.Core.initializeStacks();
  document.querySelector('#app-container')?.classList.remove('hidden');
  window.SpatialGallery.open({ stackName: 'in', fileId: 'c0' });
  window.__evt = { pd: 0, pm: 0, pu: 0, td: 0, tm: 0, types: [] };
  ['pointerdown','pointermove','pointerup'].forEach(t => document.addEventListener(t, e => { window.__evt[t==='pointerdown'?'pd':t==='pointermove'?'pm':'pu']++; if (t==='pointerdown') window.__evt.types.push(e.pointerType + '@' + Math.round(e.clientX) + ',' + Math.round(e.clientY) + '->' + (e.target.className || e.target.id || e.target.tagName)); }, true));
  ['touchstart','touchmove'].forEach(t => document.addEventListener(t, () => { window.__evt[t==='touchstart'?'td':'tm']++; }, true));
  return 1;
`);
await new Promise(r => setTimeout(r, 1200));
const ptr = (type, list) => j('POST', S('/actions'), { actions: [{ type: 'pointer', id: 'f', parameters: { pointerType: type }, actions: list }] });
await ptr('touch', [
  { type: 'pointerMove', duration: 0, x: 362, y: 470 }, { type: 'pointerDown', button: 0 },
  { type: 'pointerMove', duration: 200, x: 662, y: 350 }, { type: 'pointerUp', button: 0 }
]);
await new Promise(r => setTimeout(r, 300));
console.log('after touch fling:', JSON.stringify(await exec('return window.__evt')));
console.log('orient:', await exec('return window.SpatialGallery.orient.map(v=>v.toFixed(2)).join(",")'));
await ptr('mouse', [
  { type: 'pointerMove', duration: 0, x: 362, y: 470 }, { type: 'pointerDown', button: 0 },
  { type: 'pointerMove', duration: 200, x: 662, y: 350 }, { type: 'pointerUp', button: 0 }
]);
await new Promise(r => setTimeout(r, 300));
console.log('after mouse fling:', JSON.stringify(await exec('return window.__evt')));
console.log('orient:', await exec('return window.SpatialGallery.orient.map(v=>v.toFixed(2)).join(",")'));
console.log('scene rect:', JSON.stringify(await exec('const r = window.SpatialGallery.elements.scene.getBoundingClientRect(); return {l:r.left,t:r.top,w:r.width,h:r.height}')));
await j('DELETE', S(''));
