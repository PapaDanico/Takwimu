// Siaya ward boundaries (data/siaya-wards-geo.json): schema, registry match, geometry and metadata.
// Checks: exactly 30 features; each matches one registry ward (code, name, constituency) and every registry ward
// appears once; rings are closed, have at least 4 points, non-zero area and no self-crossing edges; every
// coordinate is inside the Siaya county bbox, and that bbox reproduces the extent of data/siaya-boundaries.json;
// metadata carries licence, attribution, sha256 and vintage.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);

const geo = read('data/siaya-wards-geo.json');
const reg = read('data/siaya-geography.json');
const cty = read('data/siaya-boundaries.json');
const schema = read('schemas/siaya-wards-geo.schema.json');

// ---- JSON Schema (same subset as scripts/validate-data.js) ----
function checkSchema(s, value, where, root, out) {
  if (s.$ref) {
    const target = s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], root);
    if (!target) { out.push(`${where}: unresolved $ref ${s.$ref}`); return; }
    checkSchema(target, value, where, root, out); return;
  }
  if (s.type) {
    const types = [].concat(s.type);
    const t = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    const ok = types.some((x) => x === t || (x === 'integer' && Number.isInteger(value)));
    if (!ok) { out.push(`${where}: expected ${types.join('|')}, got ${t}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} not in enum`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: below minimum`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: above maximum`);
  }
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems) out.push(`${where}: needs at least ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => checkSchema(s.items, v, `${where}[${i}]`, root, out));
  } else if (value && typeof value === 'object') {
    (s.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = s.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, root, out);
      else if (s.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
    });
  }
}
{ const out = []; checkSchema(schema, geo, 'siaya-wards-geo', schema, out); out.slice(0, 20).forEach((m) => fail(`schema ${m}`)); }

// ---- Registry match ----
const feats = geo.features || [];
if (feats.length !== 30) fail(`expected exactly 30 features, found ${feats.length}`);
const regWards = new Map(reg.wards.map((w) => [w.id, w]));
const regCons = new Map(reg.constituencies.map((c) => [c.id, c]));
const norm = (s) => String(s || '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const seen = new Map();
feats.forEach((f, i) => {
  const p = f.properties || {};
  const w = regWards.get(p.ward_id);
  if (!w) { fail(`feature ${i}: ward_id ${p.ward_id} not in registry`); return; }
  seen.set(w.id, (seen.get(w.id) || 0) + 1);
  if (p.ward_code !== w.iebc_ward_code) fail(`${w.id}: code ${p.ward_code} != registry ${w.iebc_ward_code}`);
  if (p.ward_name !== w.name) fail(`${w.id}: name ${p.ward_name} != registry ${w.name}`);
  const c = regCons.get(w.parent);
  if (p.constituency_id !== c.id || p.constituency_name !== c.name || p.constituency_code !== c.iebc_constituency_code) fail(`${w.id}: constituency ${p.constituency_id}/${p.constituency_code} != registry ${c.id}/${c.iebc_constituency_code}`);
  // The source name must resolve to this ward by registry name or alias (after dropping the trailing " Ward").
  const srcName = norm(String(p.source_name).replace(/ Ward$/, ''));
  const known = [w.name, ...(w.aliases || []).map((a) => a.name), ...Object.values(w.source_names || {})].filter(Boolean).map(norm);
  if (!known.includes(srcName)) fail(`${w.id}: source name "${p.source_name}" is not the registry name or a recorded alias`);
  if (norm(String(p.source_subcounty).replace(/ Sub County$/, '')) !== norm(c.name)) fail(`${w.id}: source sub-county "${p.source_subcounty}" != constituency ${c.name}`);
});
reg.wards.forEach((w) => { const n = seen.get(w.id) || 0; if (n !== 1) fail(`registry ward ${w.id} appears ${n} times`); });

// ---- Geometry ----
const bb = (geo.meta && geo.meta.county_bbox) || [0, 0, 0, 0];
const TOL = 0.01; // degrees (about 1.1 km): two different source layers, both simplified
let maxOut = 0;
const cross = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};
let rings = 0; let points = 0;
feats.forEach((f) => {
  const id = f.properties && f.properties.ward_id;
  const g = f.geometry || {};
  if (g.type !== 'MultiPolygon' || !Array.isArray(g.coordinates) || !g.coordinates.length) { fail(`${id}: geometry must be a non-empty MultiPolygon`); return; }
  g.coordinates.forEach((poly, pi) => poly.forEach((ring, ri) => {
    rings += 1; points += ring.length;
    const where = `${id} polygon ${pi} ring ${ri}`;
    if (ring.length < 4) { fail(`${where}: fewer than 4 points`); return; }
    const [a, z] = [ring[0], ring[ring.length - 1]];
    if (a[0] !== z[0] || a[1] !== z[1]) fail(`${where}: ring not closed`);
    let area = 0;
    for (let i = 0; i < ring.length - 1; i += 1) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    if (Math.abs(area) < 1e-9) fail(`${where}: zero area`);
    ring.forEach(([x, y]) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) fail(`${where}: non-numeric coordinate`);
      const out = Math.max(bb[0] - x, x - bb[2], bb[1] - y, y - bb[3], 0);
      maxOut = Math.max(maxOut, out);
      if (out > TOL) fail(`${where}: point ${x},${y} is ${out.toFixed(4)} degrees outside the county bbox`);
    });
    const n = ring.length - 1;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 2; j < n; j += 1) {
        if (i === 0 && j === n - 1) continue;
        if (cross(ring[i], ring[i + 1], ring[j], ring[j + 1])) { fail(`${where}: edges ${i} and ${j} cross`); return; }
      }
    }
  }));
  const [lx, ly] = (f.properties && f.properties.label) || [];
  if (!(lx >= bb[0] - TOL && lx <= bb[2] + TOL && ly >= bb[1] - TOL && ly <= bb[3] + TOL)) fail(`${id}: label point outside the county bbox`);
});

// The county bbox must reproduce data/siaya-boundaries.json (same projection as scripts/make-siaya-map.js).
{
  const [minX, minY, maxX, maxY] = bb;
  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const scale = (cty.meta.width - 20) / ((maxX - minX) * k);
  const H = Math.ceil(10 + (maxY - minY) * scale + 10);
  if (Math.abs(H - cty.meta.height) > 1) fail(`county bbox projects to height ${H}, data/siaya-boundaries.json has ${cty.meta.height}`);
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  cty.areas.forEach((a) => (a.d.match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) || []).forEach((pt) => {
    const [x, y] = pt.split(',').map(Number); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }));
  const px = [x0, y0, x1, y1]; const want = [10, 10, cty.meta.width - 10, H - 10];
  if (px.some((v, i) => Math.abs(v - want[i]) > 1.5)) fail(`county bbox does not match the extent of data/siaya-boundaries.json (${px.join(',')} vs ${want.join(',')})`);
}

// ---- Metadata ----
const m = geo.meta || {};
['licence', 'licence_text', 'attribution', 'publisher', 'vintage', 'resource_sha256', 'dataset_url'].forEach((k) => { if (!m[k]) fail(`meta.${k} missing`); });
if (!/CC BY/.test(m.licence || '')) fail('meta.licence must state CC BY');
if (!/^Ward boundaries: .+ via HDX, CC BY, \d{4}$/.test(m.attribution || '')) fail('meta.attribution must read "Ward boundaries: <publisher> via HDX, CC BY, <year>"');
if (m.attribution && m.publisher && !m.attribution.includes(m.publisher)) fail('meta.attribution must name meta.publisher');

const size = fs.statSync(path.join(ROOT, 'data/siaya-wards-geo.json')).size;
if (size >= 150 * 1024) fail(`file is ${size} bytes; target is under 150 KB`);

const low = feats.filter((f) => f.properties.crosscheck_fao && f.properties.crosscheck_fao.iou < 0.5).map((f) => `${f.properties.ward_name} (${f.properties.crosscheck_fao.iou})`);
if (errors.length) {
  console.error(`test-wards-geo: ${errors.length} error(s)`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-wards-geo: OK. 30 wards, ${rings} rings, ${points} points, ${size} bytes; max ${maxOut.toFixed(4)} degrees outside county bbox (tolerance ${TOL}).`);
if (low.length) console.log(`  note: FAO cross-check overlap below 0.5 for ${low.length} wards (lake shore and Bondo/Rarieda differences): ${low.join(', ')}`);
