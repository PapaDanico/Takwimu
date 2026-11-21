// Siaya geographic registry (data/siaya-geography.json): structure, codes, parents and names.
// Fails on registry errors. Ward names used in other data/siaya-*.json files are only reported as warnings,
// because those files belong to other workstreams.
// Optional: when the cited IEBC PDFs are in /tmp/claude-0/library and pdftotext is installed, the names and
// codes are re-read from the PDFs; otherwise that step is reported as skipped.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

const geo = read('data/siaya-geography.json');
const schema = read('schemas/siaya-geography.schema.json');

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
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') checkSchema(s.additionalProperties, v, `${where}.${k}`, root, out);
    });
  }
}
{ const out = []; checkSchema(schema, geo, 'siaya-geography', schema, out); out.forEach((m) => fail(`schema ${m}`)); }

// ---- Counts, codes, parents ----
const { county, constituencies: cons, wards } = geo;
if (county.iebc_county_code !== '041') fail(`county code is ${county.iebc_county_code}, expected 041`);
if (cons.length !== 6) fail(`expected exactly 6 constituencies, found ${cons.length}`);
if (wards.length !== 30) fail(`expected exactly 30 wards, found ${wards.length}`);

const EXPECTED_CONS = ['Ugenya', 'Ugunja', 'Alego Usonga', 'Gem', 'Bondo', 'Rarieda'];
EXPECTED_CONS.forEach((n) => { if (!cons.some((c) => c.name === n)) fail(`constituency ${n} missing`); });

const uniq = (list, label) => {
  const seen = new Set();
  list.forEach((v) => { if (seen.has(v)) fail(`duplicate ${label}: ${v}`); seen.add(v); });
};
uniq(cons.map((c) => c.id), 'constituency id');
uniq(cons.map((c) => c.iebc_constituency_code), 'constituency code');
uniq(wards.map((w) => w.id), 'ward id');
uniq(wards.map((w) => w.iebc_ward_code), 'ward code');
uniq(wards.map((w) => w.name.toLowerCase()), 'ward name');

const consById = new Map(cons.map((c) => [c.id, c]));
const sortedIds = (a) => [...a].sort().join(',');
if (sortedIds(county.constituency_ids) !== sortedIds(cons.map((c) => c.id))) fail('county.constituency_ids does not match the constituency list');
cons.forEach((c) => { if (c.parent !== county.id) fail(`constituency ${c.id} parent is ${c.parent}, expected ${county.id}`); });
wards.forEach((w) => {
  const p = consById.get(w.parent);
  if (!p) { fail(`ward ${w.id} parent ${w.parent} is not a constituency`); return; }
  if (p.iebc_constituency_code !== w.iebc_constituency_code) fail(`ward ${w.id} constituency code ${w.iebc_constituency_code} differs from parent ${p.iebc_constituency_code}`);
  const listing = cons.filter((c) => c.ward_ids.includes(w.id));
  if (listing.length !== 1) fail(`ward ${w.id} is listed under ${listing.length} constituencies (needs exactly one)`);
  else if (listing[0].id !== w.parent) fail(`ward ${w.id} parent ${w.parent} but listed under ${listing[0].id}`);
});
cons.forEach((c) => c.ward_ids.forEach((id) => { if (!wards.some((w) => w.id === id)) fail(`constituency ${c.id} lists unknown ward ${id}`); }));

// ---- Names match the cited sources (as recorded) ----
const sourceIds = new Set(geo.sources.map((s) => s.id));
wards.forEach((w) => {
  const sn = w.source_names;
  Object.keys(sn).forEach((k) => { if (!sourceIds.has(k)) fail(`ward ${w.id}: source_names key ${k} is not a listed source`); });
  if (sn['IEBC-2017-RESULTS'] !== w.name.toUpperCase()) fail(`ward ${w.id}: name "${w.name}" does not match IEBC 2017 "${sn['IEBC-2017-RESULTS']}"`);
  const g = sn['IEBC-GN-13904-2025'];
  if (g !== null && g !== w.name) fail(`ward ${w.id}: name "${w.name}" does not match Gazette Notice 13904 "${g}"`);
  if (g === null && w.parent !== 'ugunja') fail(`ward ${w.id}: only Ugunja wards are absent from Gazette Notice 13904`);
  const variants = [w.name, ...w.aliases.map((a) => a.name)];
  Object.entries(sn).forEach(([k, v]) => { if (v !== null && !variants.includes(v)) fail(`ward ${w.id}: ${k} spelling "${v}" is neither the name nor an alias`); });
});

// ---- Name lookup (names and aliases, per level, case-insensitive) ----
const norm = (s) => s.toLowerCase().replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim();
const wardIndex = new Map();
wards.forEach((w) => [w.name, ...w.aliases.map((a) => a.name)].forEach((n) => {
  const k = norm(n);
  if (wardIndex.has(k) && wardIndex.get(k) !== w.id) fail(`ward alias "${n}" resolves to both ${wardIndex.get(k)} and ${w.id}`);
  wardIndex.set(k, w.id);
}));
const consIndex = new Map();
cons.forEach((c) => [c.name, ...c.aliases.map((a) => a.name)].forEach((n) => {
  const k = norm(n);
  if (consIndex.has(k) && consIndex.get(k) !== c.id) fail(`constituency alias "${n}" resolves to both ${consIndex.get(k)} and ${c.id}`);
  consIndex.set(k, c.id);
}));

// ---- Sub-county systems: every unit points at a constituency; ward counts agree ----
geo.sub_county_systems.forEach((sys) => {
  if (sys.units.length !== 6) fail(`${sys.system}: expected 6 units, found ${sys.units.length}`);
  uniq(sys.units.map((u) => u.constituency_id), `${sys.system} constituency mapping`);
  sys.units.forEach((u) => {
    const c = consById.get(u.constituency_id);
    if (!c) fail(`${sys.system}: unit ${u.name} maps to unknown constituency ${u.constituency_id}`);
    else if (u.wards !== undefined && u.wards !== c.ward_ids.length) fail(`${sys.system}: ${u.name} has ${u.wards} wards, registry has ${c.ward_ids.length}`);
  });
});

// ---- Consistency with data files owned elsewhere (warnings only) ----
try {
  const sc = read('data/subcounties.json');
  sc.sub_counties.forEach((s) => {
    const c = consById.get(s.id);
    if (!c) { warnings.push(`subcounties.json: ${s.id} has no registry constituency`); return; }
    if (s.name !== c.name) warnings.push(`subcounties.json: ${s.id} named "${s.name}", registry "${c.name}"`);
    if (s.wards !== c.ward_ids.length) warnings.push(`subcounties.json: ${s.id} has ${s.wards} wards, registry ${c.ward_ids.length}`);
  });
  if (sc.sub_counties.length !== 6) warnings.push(`subcounties.json lists ${sc.sub_counties.length} sub-counties`);
} catch (e) { warnings.push(`subcounties.json not read: ${e.message}`); }
try {
  const b = read('data/siaya-boundaries.json');
  b.areas.forEach((a) => {
    const c = consById.get(a.id);
    if (!c) warnings.push(`siaya-boundaries.json: area ${a.id} has no registry constituency`);
    else if (a.name !== c.name) warnings.push(`siaya-boundaries.json: ${a.id} named "${a.name}", registry "${c.name}"`);
  });
  const layer = geo.spatial_layers.find((l) => l.file === 'data/siaya-boundaries.json');
  if (!layer) fail('spatial_layers has no entry for data/siaya-boundaries.json');
  else {
    if (b.meta.licence !== layer.licence) warnings.push(`siaya-boundaries.json licence "${b.meta.licence}" differs from registry "${layer.licence}"`);
    if (String(b.meta.boundary_year) !== layer.boundary_year_represented) warnings.push(`siaya-boundaries.json boundary_year ${b.meta.boundary_year} differs from registry ${layer.boundary_year_represented}`);
  }
} catch (e) { warnings.push(`siaya-boundaries.json not read: ${e.message}`); }
try {
  const k = read('data/kenya-counties-map.json');
  const layer = geo.spatial_layers.find((l) => l.file === 'data/kenya-counties-map.json');
  if (layer && k.meta && k.meta.licence !== layer.licence) warnings.push(`kenya-counties-map.json licence "${k.meta.licence}" differs from geoBoundaries ADM1 metadata "${layer.licence}"`);
} catch (e) { /* file optional */ }

// ---- Ward names used in other data/siaya-*.json files ----
const STOP = new Set(['the', 'each', 'every', 'per', 'one', 'a', 'any', 'county', 'assembly', 'all', 'and', 'of', 'in', 'by', 'to', 'for', 'new', 'no', 'other', 'which', 'this', 'that']);
const found = []; // { file, where, name }
function walk(file, node, where) {
  if (Array.isArray(node)) { node.forEach((v, i) => walk(file, v, `${where}[${i}]`)); return; }
  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => {
      const lk = k.toLowerCase();
      if ((lk === 'ward' || lk === 'ward_name' || lk === 'wards') && typeof v === 'string') found.push({ file, where: `${where}.${k}`, name: v });
      else if (lk === 'wards' && Array.isArray(v)) v.forEach((x, i) => { if (typeof x === 'string') found.push({ file, where: `${where}.${k}[${i}]`, name: x }); });
      walk(file, v, `${where}.${k}`);
    });
    return;
  }
  if (typeof node === 'string') {
    const re = /((?:[A-Z][a-z]+[ -]){0,2}[A-Z][a-z]+) [Ww]ard\b/g;
    let m;
    while ((m = re.exec(node))) {
      const words = m[1].split(/[ -]/).filter((w) => !STOP.has(w.toLowerCase()));
      if (words.length) found.push({ file, where, name: words.join(' ') });
    }
  }
}
const files = fs.readdirSync(path.join(ROOT, 'data')).filter((f) => /^siaya-.*\.json$/.test(f) && f !== 'siaya-geography.json' && f !== 'siaya-boundaries.json');
files.forEach((f) => {
  try { walk(f, read(`data/${f}`), f); } catch (e) { warnings.push(`${f} not read: ${e.message}`); }
});
let resolved = 0;
const unresolved = [];
found.forEach((x) => {
  const k = norm(x.name);
  // A phrase like "Central Sakwa ward" may carry a leading word; try the longest suffix that resolves.
  const parts = k.split(' ');
  let hit = null;
  for (let i = 0; i < parts.length && !hit; i += 1) hit = wardIndex.get(parts.slice(i).join(' ')) || null;
  if (hit) resolved += 1; else unresolved.push(x);
});

// ---- Optional: re-read names and codes from the cited IEBC PDFs ----
const LIB = '/tmp/claude-0/library';
function pdfText(file, first, last) {
  return execFileSync('pdftotext', ['-f', String(first), '-l', String(last), '-layout', file, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
}
const pdfChecks = [];
try {
  const gn = path.join(LIB, 'GEO-IEBC-r9lwR44tQK', 'body');
  const r17 = path.join(LIB, 'GEO-IEBC-siEABKREDq', 'body');
  if (fs.existsSync(gn) && fs.existsSync(r17)) {
    const tGn = pdfText(gn, 296, 303);
    const rowsGn = new Map();
    for (const m of tGn.matchAll(/041\s+Siaya\s+(\d{3})\s+([A-Za-z ]+?)\s+(\d{4})\s+([A-Za-z ]+?)\s{2,}\d{3}\s/g)) rowsGn.set(m[3], { cons: m[1], name: m[4].trim() });
    const tR = pdfText(r17, 546, 552);
    const rowsR = new Map();
    for (const m of tR.matchAll(/041\s+SIAYA\s+(\d{3})\s+([A-Z ]+?)\s+(\d{4})\s+([A-Z][A-Z ]*?[A-Z])\s+(?:IND|\d{3})\s/g)) rowsR.set(m[3], { cons: m[1], name: m[4].trim() });
    wards.forEach((w) => {
      const r = rowsR.get(w.iebc_ward_code);
      if (!r) fail(`PDF check: ward code ${w.iebc_ward_code} not found in IEBC 2017 results`);
      else if (r.name !== w.source_names['IEBC-2017-RESULTS'] || r.cons !== w.iebc_constituency_code) fail(`PDF check: ${w.iebc_ward_code} reads ${r.cons} ${r.name} in IEBC 2017 results`);
      const g = rowsGn.get(w.iebc_ward_code);
      const want = w.source_names['IEBC-GN-13904-2025'];
      if (want === null && g) fail(`PDF check: ${w.iebc_ward_code} is in Gazette Notice 13904 but recorded as absent`);
      if (want !== null && (!g || g.name !== want || g.cons !== w.iebc_constituency_code)) fail(`PDF check: ${w.iebc_ward_code} reads ${g ? `${g.cons} ${g.name}` : 'nothing'} in Gazette Notice 13904`);
    });
    if (rowsR.size !== 30) fail(`PDF check: IEBC 2017 results list ${rowsR.size} Siaya ward codes, expected 30`);
    pdfChecks.push(`re-read ${rowsR.size} wards from IEBC 2017 results and ${rowsGn.size} from Gazette Notice 13904`);
  } else pdfChecks.push('skipped (cited PDFs not in /tmp/claude-0/library)');
} catch (e) { pdfChecks.push(`skipped (${e.code === 'ENOENT' ? 'pdftotext not installed' : e.message.split('\n')[0]})`); }

// ---- Report ----
console.log(`test-geography: county ${county.iebc_county_code}, ${cons.length} constituencies, ${wards.length} wards`);
console.log(`  source PDF check: ${pdfChecks.join('; ')}`);
console.log(`  ward names in other data/siaya-*.json files: ${found.length} found, ${resolved} resolved, ${unresolved.length} unresolved`);
const warnAll = [...warnings, ...unresolved.map((u) => `unresolved ward name "${u.name}" at ${u.where}`)];
if (warnAll.length) { console.log('  warnings:'); warnAll.forEach((w) => console.log(`   - ${w}`)); }
if (errors.length) {
  console.error(`test-geography: ${errors.length} error(s)`);
  errors.forEach((e) => console.error(`   x ${e}`));
  process.exit(1);
}
console.log('test-geography: pass');
