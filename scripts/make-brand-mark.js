// Builds the Takwimu Kenya icon mark as genuine vector SVG from real geometry, following the approved concept:
// Kenya silhouette (geoBoundaries ADM0 outline) in Kenyan green, ascending white data bars inside it,
// a black-red-green ribbon across the lower body, and a sunrise-orange arc. No raster is embedded.
// Usage: node scripts/make-brand-mark.js path/to/geoBoundaries-KEN-ADM0_simplified.geojson
const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).features[0].geometry;
const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
const main = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
main.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
const S = 512, pad = 56;
const sc = Math.min((S - 2 * pad) / ((x1 - x0) * k), (S - 2 * pad - 40) / (y1 - y0));
const ox = (S - (x1 - x0) * k * sc) / 2, oy = 70;
const P = ([x, y]) => [ox + (x - x0) * k * sc, oy + (y1 - y) * sc];
// light simplification for a clean icon outline
const pts = main.map(P).filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 2.2);
const outline = 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
const H = (y1 - y0) * sc; const W = (x1 - x0) * k * sc;
const base = oy + H * 0.62;
const bars = [0.28, 0.40, 0.52, 0.64].map((f, i) => {
  const bw = W * 0.075; const bx = ox + W * (0.30 + i * 0.105); const bh = H * f;
  return `<rect x="${bx.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw * 0.18).toFixed(1)}" fill="#FFFFFF"/>`;
}).join('');
const r0 = oy + H * 0.64;
const ribbon = (dy, c) => `<path d="M${(ox - 18).toFixed(1)},${(r0 + dy + 30).toFixed(1)} C${(ox + W * 0.35).toFixed(1)},${(r0 + dy - 10).toFixed(1)} ${(ox + W * 0.7).toFixed(1)},${(r0 + dy + 22).toFixed(1)} ${(ox + W + 18).toFixed(1)},${(r0 + dy - 18).toFixed(1)}" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/>`;
const arc = `<path d="M${(S * 0.22).toFixed(1)},${(oy - 6).toFixed(1)} Q${(S / 2).toFixed(1)},${(oy - 62).toFixed(1)} ${(S * 0.78).toFixed(1)},${(oy - 6).toFixed(1)}" fill="none" stroke="#F7931E" stroke-width="16" stroke-linecap="round"/>`;
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-labelledby="t"><title id="t">Takwimu Kenya</title>${arc}<defs><clipPath id="k"><path d="${outline}"/></clipPath></defs><path d="${outline}" fill="#08762F"/><g clip-path="url(#k)">${bars}</g>${ribbon(0, '#17191C')}${ribbon(17, '#D71920')}${ribbon(34, '#08762F')}</svg>\n`;
// Small-size icon: silhouette and bars only, thicker, no ribbon or arc (per brand rules for favicons).
const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><title>Takwimu Kenya</title><rect width="${S}" height="${S}" rx="96" fill="#FFFFFF"/><path d="${outline}" fill="#08762F" stroke="#07552D" stroke-width="10"/><g clip-path="url(#k2)">${bars.replace(/width="([\d.]+)"/g, (m, w) => `width="${(w * 1.25).toFixed(1)}"`)}</g><defs><clipPath id="k2"><path d="${outline}"/></clipPath></defs><path d="M${(S * 0.26).toFixed(1)},${(oy - 4).toFixed(1)} Q${(S / 2).toFixed(1)},${(oy - 50).toFixed(1)} ${(S * 0.74).toFixed(1)},${(oy - 4).toFixed(1)}" fill="none" stroke="#F7931E" stroke-width="22" stroke-linecap="round"/></svg>\n`;
const mono = full.replace(/#08762F|#07552D|#D71920|#F7931E|#17191C/g, '#17191C').replace(/fill="#FFFFFF"/g, 'fill="#FFFFFF"');
const out = path.join(__dirname, '..', 'brand');
fs.writeFileSync(path.join(out, 'takwimu-mark.svg'), full);
fs.writeFileSync(path.join(out, 'takwimu-mark-small.svg'), small);
fs.writeFileSync(path.join(out, 'takwimu-mark-mono.svg'), mono);
console.log('mark written', full.length, small.length);
