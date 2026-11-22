#!/usr/bin/env node
// Checks data/imf.json (IMF World Economic Outlook for Kenya, built by scripts/fetch_imf.py):
// schema; every value has indicator, year, unit, vintage, type and source URL; types follow the WEO
// latest-actual-year rule so no projection (or estimate) is labelled actual; vintages are distinct;
// documents carry the IMF licence with redistribution off; comparisons with data/national.json (World Bank)
// and data/cbk.json (CBK) are recomputed from those files. Run: node scripts/test-imf.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const data = read('data/imf.json');
const schema = read('schemas/imf.schema.json');
const national = read('data/national.json');
const cbk = read('data/cbk.json');
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

// ---- schema (same subset as scripts/validate-data.js, with local $ref) ----
function checkSchema(s, value, where, out) {
  if (s.$ref) {
    const target = s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], schema);
    if (!target) { out.push(`${where}: unresolved $ref ${s.$ref}`); return; }
    checkSchema(target, value, where, out);
    return;
  }
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
    });
  }
}
const schemaErrors = [];
checkSchema(schema, data, 'imf', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

// ---- vintages distinct ----
const names = data.vintages.map((v) => v.vintage);
ok(new Set(names).size === names.length, 'two vintages share a name');
ok(new Set(data.vintages.map((v) => v.sdmx_version)).size === names.length, 'two vintages share an SDMX version');

// ---- every value complete; type follows the latest-actual rule ----
data.vintages.forEach((v) => {
  const ind = Object.fromEntries(v.indicators.map((i) => [i.code, i]));
  ok(Number(v.publication_date.slice(0, 4)) === v.edition_year, `${v.vintage}: edition_year differs from publication date`);
  const month = Number(v.publication_date.slice(5, 7));
  ok(v.vintage === `${month <= 6 ? 'April' : 'October'} ${v.edition_year}`, `${v.vintage}: name does not match publication date ${v.publication_date}`);
  const seen = new Set();
  v.values.forEach((x) => {
    const where = `${v.vintage} ${x.indicator} ${x.year}`;
    ['indicator', 'year', 'unit', 'vintage', 'type', 'source_url'].forEach((k) => ok(x[k] !== undefined && x[k] !== null && x[k] !== '', `${where}: missing ${k}`));
    ok(x.vintage === v.vintage, `${where}: value filed under the wrong vintage (${x.vintage})`);
    ok(/^https:\/\//.test(x.source_url), `${where}: source URL is not https`);
    const meta = ind[x.indicator];
    ok(meta && meta.available, `${where}: indicator not described in this vintage`);
    if (!meta) return;
    ok(x.unit === meta.unit, `${where}: unit ${x.unit} differs from indicator unit ${meta.unit}`);
    const la = meta.latest_actual_year;
    const expected = x.year >= v.edition_year ? 'projection' : (la !== null && la !== undefined && x.year <= la ? 'actual' : 'estimate');
    ok(x.type === expected, `${where}: type ${x.type}, rule gives ${expected}`);
    ok(!(x.type === 'actual' && x.year >= v.edition_year), `${where}: projection year labelled actual`);
    ok(!(x.type === 'actual' && (la === null || la === undefined || x.year > la)), `${where}: labelled actual after the latest actual year`);
    const key = `${x.indicator}|${x.year}`;
    ok(!seen.has(key), `${where}: duplicate value`);
    seen.add(key);
  });
  const files = new Set(v.raw_files.map((r) => r.sha256));
  ok(files.size === v.raw_files.length, `${v.vintage}: two raw files share a sha256`);
});
// vintages must not share raw files
const allSha = data.vintages.flatMap((v) => v.raw_files.map((r) => r.sha256));
ok(new Set(allSha).size === allSha.length, 'a raw file is shared between vintages');

// ---- documents: licence, no redistribution, sha256 only when downloaded ----
const docIds = new Set();
data.documents.forEach((d) => {
  ok(!docIds.has(d.id), `document ${d.id}: duplicate id`);
  docIds.add(d.id);
  ok(d.licence.redistribution_allowed === false, `document ${d.id}: redistribution must stay false unless the IMF states otherwise`);
  ok(/link and cite/.test(d.licence.statement), `document ${d.id}: licence statement missing "link and cite"`);
  if (d.sha256 !== null) ok(/^[0-9a-f]{64}$/.test(d.sha256) && d.retrieved, `document ${d.id}: sha256 without retrieval date`);
  else ok(/not downloaded|web page only|offline/.test(d.download_status), `document ${d.id}: no sha256 and no reason`);
});
ok(data.meta.licence.redistribution_allowed === false, 'meta licence: redistribution must be false');

// ---- comparisons recomputed from the World Bank and CBK files ----
function other(ref) {
  if (ref.file === 'national.json') {
    const i = national.indicators.find((n) => n.code === ref.series);
    const p = i && i.series.find((s) => s.year === ref.year);
    return p && p.value !== null ? p.value / (ref.divisor || 1) : null;
  }
  const s = cbk.series[ref.series];
  if (!s) return null;
  const v = ref.month ? (s.monthly || {})[ref.month] : (s.annual || {})[String(ref.year)];
  if (v === null || v === undefined) return null;
  if (ref.ratio_of) { const den = other(ref.ratio_of); return den ? (100 * v) / den : null; }
  return v;
}
const latest = data.vintages.reduce((a, b) => (a.publication_date > b.publication_date ? a : b));
const imfVal = Object.fromEntries(latest.values.map((x) => [`${x.indicator}|${x.year}`, x]));
const near = (a, b) => Math.abs(a - b) < 1e-4;
data.comparisons.forEach((c) => {
  const where = `comparison ${c.imf_indicator} vs ${c.other_label} ${c.year}`;
  ok(c.vintage === latest.vintage, `${where}: not from the latest vintage`);
  const x = imfVal[`${c.imf_indicator}|${c.year}`];
  ok(x && near(x.value, c.imf_value), `${where}: IMF value differs from data`);
  ok(x && x.type === c.imf_type && x.type !== 'projection', `${where}: projections must not be compared as outturns`);
  const o = other(c.other);
  ok(o !== null && near(o, c.other_value), `${where}: other value ${c.other_value} differs from source (${o})`);
  if (o === null || !x) return;
  const diff = c.difference_basis === 'points' ? x.value - o : (100 * (x.value - o)) / o;
  ok(near(diff, c.difference), `${where}: difference ${c.difference}, recomputed ${diff}`);
  ok(c.candidate_conflict === Math.abs(diff) > c.threshold, `${where}: candidate flag wrong`);
  ok(c.threshold === 0.5, `${where}: threshold must be 0.5`);
});
ok(data.comparisons.length > 0, 'no comparisons computed');

if (errors.length) {
  console.error(`test-imf: ${errors.length} failure(s) in ${checks} checks`);
  errors.slice(0, 40).forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
const cands = data.comparisons.filter((c) => c.candidate_conflict).length;
console.log(`test-imf: ${checks} checks passed (${data.vintages.length} vintages, ${data.vintages.reduce((n, v) => n + v.values.length, 0)} values, ${data.comparisons.length} comparisons, ${cands} candidate conflicts)`);
