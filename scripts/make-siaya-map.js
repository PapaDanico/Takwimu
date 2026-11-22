// One-off: turns the geoBoundaries (IEBC) ADM2 GeoJSON into projected SVG paths for the six Siaya sub-counties.
// Usage: node scripts/make-siaya-map.js path/to/geoBoundaries-KEN-ADM2_simplified.geojson
// The output (data/siaya-boundaries.json) is committed, so the normal build needs no network.
const fs = require('fs');
const path = require('path');
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NAMES = { 'Alego Usonga': 'alego-usonga', Bondo: 'bondo', Gem: 'gem', Rarieda: 'rarieda', Ugenya: 'ugenya', Ugunja: 'ugunja' };
const feats = src.features.filter((f) => NAMES[f.properties.shapeName]);
if (feats.length !== 6) throw new Error(`expected 6 features, found ${feats.length}`);
const rings = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).flat();
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
feats.forEach((f) => rings(f.geometry).flat().forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }));
const lat0 = ((minY + maxY) / 2) * (Math.PI / 180);
const k = Math.cos(lat0);
const W = 420;
const scale = (W - 20) / ((maxX - minX) * k);
const px = (x) => 10 + (x - minX) * k * scale;
const py = (y) => 10 + (maxY - y) * scale;
const H = Math.ceil(10 + (maxY - minY) * scale + 10);
const out = { meta: {
  source: 'geoBoundaries gbOpen Kenya ADM2 (IEBC constituency boundaries via OCHA ROSEA), simplified geometry',
  source_url: 'https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM2/',
  licence: 'CC BY 3.0 IGO',
  boundary_year: 2020,
  retrieved: '2026-11-21',
  projection: 'Equirectangular scaled by cos(latitude of centre); not for measuring area or distance',
  width: W, height: H,
  note: 'Siaya County has six sub-counties (Alego Usonga, Bondo, Gem, Rarieda, Ugenya, Ugunja) that carry the same names as the IEBC constituencies drawn here. Boundaries are simplified for display.',
}, areas: [] };
feats.forEach((f) => {
  const rs = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
  let d = ''; let ax = 0, ay = 0, at = 0;
  rs.forEach((poly) => poly.forEach((ring, ri) => {
    d += 'M' + ring.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join('L') + 'Z';
    if (ri === 0) {
      let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < ring.length - 1; i += 1) {
        const [x0, y0] = [px(ring[i][0]), py(ring[i][1])]; const [x1, y1] = [px(ring[i + 1][0]), py(ring[i + 1][1])];
        const c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
      }
      a /= 2; if (a) { ax += (cx / (6 * a)) * Math.abs(a); ay += (cy / (6 * a)) * Math.abs(a); at += Math.abs(a); }
    }
  }));
  out.areas.push({ id: NAMES[f.properties.shapeName], name: f.properties.shapeName, d, cx: +(ax / at).toFixed(1), cy: +(ay / at).toFixed(1) });
});
out.areas.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(__dirname, '..', 'data', 'siaya-boundaries.json'), JSON.stringify(out));
console.log('written', out.meta.width, out.meta.height, out.areas.map((a) => `${a.id}@${a.cx},${a.cy}`).join(' '), fs.statSync(path.join(__dirname, '..', 'data', 'siaya-boundaries.json')).size, 'bytes');
