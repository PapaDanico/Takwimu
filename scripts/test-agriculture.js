#!/usr/bin/env node
// Checks data/siaya-agriculture.json (Siaya crops, livestock, fisheries, irrigation by source):
// schema; every value has source, table, page, period, unit and status (observed/target/projection);
// pages fall inside the cited PDF and match its printed-page offset; the printed string matches the value;
// no duplicate ids or duplicate values; conflicts point at real rows; area x yield = production within
// rounding wherever a source prints all three. Run: node scripts/test-agriculture.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siaya-agriculture.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', 'siaya-agriculture.schema.json'), 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) fail(m); };

// ---- schema (same subset as scripts/validate-data.js) ----
function checkSchema(s, value, where, out) {
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: ${value} is below minimum ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: ${value} is above maximum ${s.maximum}`);
  }
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems) out.push(`${where}: needs at least ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => checkSchema(s.items, v, `${where}[${i}]`, out));
  }
  if (kind(value) === 'object') {
    (s.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = s.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') checkSchema(s.additionalProperties, v, `${where}.${k}`, out);
    });
  }
}
const schemaErrors = [];
checkSchema(schema, data, 'siaya-agriculture', schemaErrors);
schemaErrors.forEach((m) => fail(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.source_id, s]));
const obs = data.observations;
ok(Object.keys(sources).length === data.sources.length, 'two sources share an id');
ok(new Set(data.sources.map((s) => s.sha256)).size === data.sources.length, 'two sources point at the same file (sha256)');

// ---- every value: source + table + page + period + unit + status ----
const firstNumber = (s) => { const m = String(s).match(/\d[\d,]*(\.\d+)?/); return m ? Number(m[0].replace(/,/g, '')) : null; };
obs.forEach((o) => {
  const src = sources[o.source_id];
  ok(Boolean(src), `${o.id}: unknown source ${o.source_id}`);
  ['table', 'period', 'unit', 'status'].forEach((k) => ok(typeof o[k] === 'string' && o[k].trim() !== '', `${o.id}: missing ${k}`));
  ok(['observed', 'target', 'projection'].includes(o.status), `${o.id}: status ${o.status}`);
  if (src) {
    ok(o.pdf_page >= 1 && o.pdf_page <= src.pdf_pages, `${o.id}: pdf_page ${o.pdf_page} outside 1-${src.pdf_pages}`);
    ok(o.printed_page === o.pdf_page - src.printed_page_offset, `${o.id}: printed_page ${o.printed_page} does not match pdf_page ${o.pdf_page} - offset ${src.printed_page_offset}`);
  }
  if (o.value === null) {
    ok(Boolean(o.note), `${o.id}: null value needs a note giving the reason`);
  } else {
    const n = firstNumber(o.value_as_printed);
    if (n === null) ok(Boolean(o.note) || /^[a-z]+ /i.test(o.value_as_printed), `${o.id}: no number in value_as_printed and no note`);
    else ok(Math.abs(n - o.value) < 1e-9, `${o.id}: value ${o.value} differs from printed "${o.value_as_printed}"`);
    ok(o.value >= 0, `${o.id}: negative value`);
  }
  if (o.confidence <= 2) ok(Boolean(o.note), `${o.id}: confidence ${o.confidence} needs a note`);
  // a target or projection must never sit in an observed row's place: id carries the status
  ok(o.id.endsWith(`-${o.status}`), `${o.id}: id does not carry its status`);
  if (o.status !== 'observed') ok(!/achiev/i.test(o.note || '') || /target/i.test(o.note || ''), `${o.id}: target row described as achieved`);
});

// ---- no duplicates ----
ok(new Set(obs.map((o) => o.id)).size === obs.length, 'duplicate observation id');
const keyOf = (o) => [o.source_id, o.table, o.indicator, o.commodity, o.scheme || '', o.period, o.unit, o.status].join('|');
const seen = new Map();
obs.forEach((o) => {
  const k = keyOf(o);
  ok(!seen.has(k), `${o.id}: same value recorded twice (also ${seen.get(k)})`);
  seen.set(k, o.id);
});

// ---- conflicts point at real rows, shown side by side ----
const ids = new Set(obs.map((o) => o.id));
ok(new Set(data.conflicts.map((c) => c.id)).size === data.conflicts.length, 'duplicate conflict id');
data.conflicts.forEach((c) => c.values.forEach((v) => ok(ids.has(v), `conflict ${c.id}: unknown value ${v}`)));

// ---- area x yield = production, within rounding, where all three are printed ----
// Tolerance: half a unit of the printed yield's last decimal, times area, plus half a unit of production.
function decimals(s) { const m = String(s).replace(/,/g, '').match(/\.(\d+)/); return m ? m[1].length : 0; }
function yieldCheck(rows) {
  const out = [];
  const groups = {};
  rows.filter((o) => o.status === 'observed' || o.status === 'target' || o.status === 'projection').forEach((o) => {
    const g = [o.source_id, o.commodity, o.scheme || '', o.period, o.status].join('|');
    (groups[g] = groups[g] || {})[o.indicator] = o;
  });
  let n = 0;
  Object.entries(groups).forEach(([g, x]) => {
    const a = x.area_cropped; const p = x.production; const y = x.yield;
    if (!a || !p || !y || a.value === null || p.value === null || y.value === null) return;
    if (a.unit !== 'ha' || p.unit !== 'tonnes' || y.unit !== 't_per_ha') { out.push(`${g}: units ${a.unit}/${p.unit}/${y.unit} not comparable`); return; }
    n += 1;
    const tol = 0.5 * Math.pow(10, -decimals(y.value_as_printed)) * a.value + 0.5 + 1e-9;
    if (Math.abs(a.value * y.value - p.value) > tol) out.push(`${g}: area ${a.value} x yield ${y.value} = ${a.value * y.value}, production ${p.value} (tolerance ${tol})`);
  });
  return { n, out };
}
const yc = yieldCheck(obs);
yc.out.forEach((m) => fail(`yield ${m}`));
checks += 1;
// self-test the checker on synthetic rows (not data): it must pass a consistent triplet and catch a bad one
const mk = (ind, unit, v, s) => ({ source_id: 'X', commodity: 'c', period: '2000', status: 'observed', indicator: ind, unit, value: v, value_as_printed: s });
const good = yieldCheck([mk('area_cropped', 'ha', 1000, '1,000'), mk('production', 'tonnes', 2150, '2,150'), mk('yield', 't_per_ha', 2.15, '2.15')]);
const bad = yieldCheck([mk('area_cropped', 'ha', 1000, '1,000'), mk('production', 'tonnes', 3000, '3,000'), mk('yield', 't_per_ha', 2.15, '2.15')]);
ok(good.n === 1 && good.out.length === 0 && bad.out.length === 1, 'yield checker self-test failed');

if (errors.length) {
  errors.forEach((m) => console.error(`FAIL ${m}`));
  console.error(`test-agriculture: ${errors.length} failure(s) in ${checks} checks`);
  process.exit(1);
}
console.log(`test-agriculture: ${checks} checks passed (${obs.length} values, ${data.sources.length} sources, ${data.conflicts.length} conflicts, ${data.gaps.length} gaps, ${yc.n} area/yield/production triplets)`);
