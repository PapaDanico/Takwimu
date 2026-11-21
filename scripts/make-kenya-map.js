// One-off: projects the geoBoundaries Kenya ADM1 (county) outlines into compact SVG paths.
// Usage: node scripts/make-kenya-map.js path/to/geoBoundaries-KEN-ADM1_simplified.geojson
// Output data/kenya-counties-map.json is committed so the normal build needs no network.
const fs = require('fs');
const path = require('path');
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ALIAS = { Nairobi: 'nairobi-city', 'Taita Taveta': 'taita-taveta', Tharaka: 'tharaka-nithi' };
const slug = (n) => ALIAS[n] || n.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
src.features.forEach((f) => polys(f.geometry).forEach((p) => p[0].forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); })));
const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
const W = 560;
const sc = (W - 12) / ((maxX - minX) * k);
const px = ([x, y]) => [6 + (x - minX) * k * sc, 6 + (maxY - y) * sc];
const H = Math.ceil(12 + (maxY - minY) * sc);
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [x, y] = pts[i]; const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    if (d > dmax) { dmax = d; idx = i; }
  }
  return dmax > tol ? [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)] : [a, b];
};
const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const areas = [];
src.features.forEach((f) => {
  let d = ''; let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity; let ax = 0, ay = 0, at = 0;
  polys(f.geometry).forEach((poly) => {
    const raw = poly[0].map(px);
    // A closed ring has identical ends, so split it at the point farthest from the start before simplifying.
    let far = 0, fd = 0;
    raw.forEach((p, i) => { const d = Math.hypot(p[0] - raw[0][0], p[1] - raw[0][1]); if (d > fd) { fd = d; far = i; } });
    const ring = [...dp(raw.slice(0, far + 1), 0.55).slice(0, -1), ...dp(raw.slice(far), 0.55)];
    if (ring.length < 4 || area(ring) < 1.2) return;
    d += 'M' + ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
    ring.forEach(([x, y]) => { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); });
    const a = area(ring); ax += (ring.reduce((s, p) => s + p[0], 0) / ring.length) * a; ay += (ring.reduce((s, p) => s + p[1], 0) / ring.length) * a; at += a;
  });
  areas.push({ slug: slug(f.properties.shapeName), name: f.properties.shapeName, d, bbox: [bx0, by0, bx1, by1].map((v) => +v.toFixed(1)), cx: +(ax / at).toFixed(1), cy: +(ay / at).toFixed(1) });
});
areas.sort((a, b) => a.slug.localeCompare(b.slug));
const out = { meta: { source: 'geoBoundaries gbOpen Kenya ADM1 (county boundaries, IEBC via OCHA ROSEA), simplified', source_url: 'https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM1/', licence: 'CC BY 3.0 IGO', retrieved: '2026-11-21', projection: 'Equirectangular scaled by cos(latitude of centre); for display, not for measuring area or distance', width: W, height: H }, areas };
fs.writeFileSync(path.join(__dirname, '..', 'data', 'kenya-counties-map.json'), JSON.stringify(out));
console.log(areas.length, 'counties', W, H, fs.statSync(path.join(__dirname, '..', 'data', 'kenya-counties-map.json')).size, 'bytes');
