import http from 'node:http'; import fs from 'node:fs'; import zlib from 'node:zlib';
// Generated PNGs: per-id colour so decodes are real; sizes like phone photos / Drive thumbnails.
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const cache = new Map();
function png(w, h, seed, text) {
  const key = `${w}x${h}:${seed}:${text ? 1 : 0}`; if (cache.has(key)) return cache.get(key);
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { row[1 + x * 3] = (seed * 37 + x) & 255; row[2 + x * 3] = (seed * 91) & 255; row[3 + x * 3] = (x * 3 + seed) & 255; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (text) parts.push(chunk('tEXt', Buffer.from('parameters\0' + text)));
  parts.push(chunk('IDAT', zlib.deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0)));
  const out = Buffer.concat(parts); cache.set(key, out); return out;
}
const sizes = { small: [300, 375, 60], medium: [600, 750, 120], large: [1000, 1250, 350] };
let hits = {};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/ui/')) { const f = '' + (process.env.VARIANTS_DIR || new URL('./variants/', import.meta.url).pathname) + '' + u.pathname.slice(4); if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(res); return; }
  const m = u.pathname.match(/^\/img\/(small|medium|large)\/(\d+)$/);
  if (m) { hits[m[1]] = (hits[m[1]] || 0) + 1; const [w, h, delay] = sizes[m[1]]; const body = png(w, h, +m[2], null);
    setTimeout(() => { res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' }); res.end(body); }, delay + Math.random() * delay * 0.5); return; }
  const mm = u.pathname.match(/^\/meta\/(\d+)$/);
  if (mm) { const body = png(64, 64, +mm[1], 'a photo prompt '.repeat(120) + ' seed ' + mm[1]);
    setTimeout(() => { res.writeHead(206, { 'content-type': 'image/png', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }); res.end(body); }, 150 + Math.random() * 100); return; }
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET' }); res.end(); return; }
  res.writeHead(404); res.end();
}).listen(8766, () => console.log('ready'));
