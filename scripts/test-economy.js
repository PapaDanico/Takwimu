#!/usr/bin/env node
// Checks data/siaya-economy.json (Siaya Gross County Product, KNBS GCP 2025 and GCP 2024 editions):
// schema; every value has a table and page; activity values sum to the printed GCP for each year and vintage;
// vintages are kept distinct; revision differences are computed correctly. Run: node scripts/test-economy.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siaya-economy.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', 'siaya-economy.schema.json'), 'utf8'));
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
checkSchema(schema, data, 'siaya-economy', schemaErrors);
schemaErrors.forEach((m) => fail(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.vintage, s]));
const obs = data.observations;
const sectorCodes = data.sectors.map((s) => s.code);

// ---- vintages distinct ----
ok(Object.keys(sources).length === data.sources.length, 'two sources share a vintage name');
ok(new Set(data.sources.map((s) => s.sha256)).size === data.sources.length, 'two vintages point at the same file (sha256)');
ok(new Set(obs.map((o) => o.id)).size === obs.length, 'duplicate observation id');
const keyOf = (o) => [o.vintage, o.indicator, o.sector || '', o.period, o.price_basis].join('|');
const seen = new Set();
obs.forEach((o) => {
  ok(!seen.has(keyOf(o)), `${o.id}: the same value is recorded twice in one vintage`);
  seen.add(keyOf(o));
  ok(Boolean(sources[o.vintage]), `${o.id}: unknown vintage ${o.vintage}`);
});
// overlapping years 2020-2023 must exist in both vintages for the totals, kept as separate rows
['current', 'constant_2016'].forEach((basis) => ['2020', '2021', '2022', '2023'].forEach((y) => {
  const both = obs.filter((o) => o.indicator === 'gcp_total' && o.price_basis === basis && o.period === y);
  ok(both.length === 2 && both[0].vintage !== both[1].vintage, `gcp_total ${basis} ${y}: expected one value per vintage, found ${both.length}`);
}));

// ---- every value has a table and page, inside its source ----
obs.forEach((o) => {
  const s = sources[o.vintage];
  ok(typeof o.table === 'string' && /^(Table|Annexe|Figure) [0-9IVX]+/.test(o.table), `${o.id}: table missing or not a table/annexe/figure reference`);
  ok(Number.isInteger(o.pdf_page) && s && o.pdf_page >= 1 && o.pdf_page <= s.pdf_pages, `${o.id}: pdf_page outside the document`);
  ok(s && o.printed_page === o.pdf_page - s.printed_page_offset, `${o.id}: printed_page does not follow ${s && s.printed_page_rule}`);
  ok(o.read_method !== 'ocr_tesseract' || o.confidence <= 3, `${o.id}: OCR value with confidence above 3`);
  ok(o.confidence >= 5 || (o.note && o.note.length > 20), `${o.id}: confidence below 5 needs a note`);
  ok(/^\d{4}$/.test(o.period) ? Number(o.period) >= Number(s.reference_period.slice(0, 4)) && Number(o.period) <= Number(s.reference_period.slice(5)) : true, `${o.id}: year outside the edition's reference period`);
  ok(o.indicator === 'gva_by_activity' ? sectorCodes.includes(o.sector) : o.sector === null, `${o.id}: sector code`);
  ok(!/revenue|budget|expenditure/i.test(o.indicator), `${o.id}: GCP must not be recorded as government revenue or spending`);
});
// provisional flags: only GCP 2025's 2024 (marked *) is provisional in the yearly series
obs.filter((o) => /^\d{4}$/.test(o.period)).forEach((o) => {
  ok(o.provisional === (o.vintage === 'GCP2025' && o.period === '2024'), `${o.id}: provisional flag`);
});

// ---- activity values sum to printed GCP (each value rounded to KSh 1 million) ----
const groups = {};
obs.filter((o) => o.indicator === 'gva_by_activity').forEach((o) => { (groups[`${o.vintage}|${o.period}`] = groups[`${o.vintage}|${o.period}`] || []).push(o); });
ok(Object.keys(groups).length === 6, `expected 6 vintage-years with activity values, found ${Object.keys(groups).length}`);
Object.entries(groups).forEach(([k, rows]) => {
  const [v, y] = k.split('|');
  ok(rows.length === sectorCodes.length, `${k}: ${rows.length} activity values, expected ${sectorCodes.length}`);
  const fisim = rows.find((r) => r.sector === 'fisim');
  ok(fisim && fisim.value < 0, `${k}: FISIM must be negative`);
  ok(rows.filter((r) => r.sector !== 'fisim').every((r) => r.value >= 0), `${k}: an activity value is negative`);
  const sum = rows.reduce((a, r) => a + r.value, 0);
  const tol = Math.ceil((rows.length + 1) / 2); // half a million per rounded term
  const annex = obs.find((o) => o.vintage === v && o.period === y && o.indicator === 'gcp_annex_total');
  const main = obs.find((o) => o.vintage === v && o.period === y && o.indicator === 'gcp_total' && o.price_basis === 'current');
  ok(annex && Math.abs(sum - annex.value) <= tol, `${k}: activities sum to ${sum}, annex GCP ${annex && annex.value} (tolerance ${tol})`);
  ok(main && Math.abs(sum - main.value) <= tol, `${k}: activities sum to ${sum}, main-table GCP ${main && main.value} (tolerance ${tol})`);
  ok(annex && main && Math.abs(annex.value - main.value) <= 1, `${k}: annex GCP ${annex && annex.value} and main-table GCP ${main && main.value} differ by more than rounding`);
});
// constant prices are below current prices for every year after the 2016 base year
obs.filter((o) => o.indicator === 'gcp_total' && o.price_basis === 'constant_2016').forEach((c) => {
  const cur = obs.find((o) => o.vintage === c.vintage && o.period === c.period && o.indicator === 'gcp_total' && o.price_basis === 'current');
  ok(cur && c.value < cur.value, `${c.id}: constant-price GCP not below current-price GCP`);
});

// ---- revisions ----
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const expected = [];
const index = {};
obs.forEach((o) => { const k = [o.indicator, o.sector || '', o.period, o.price_basis].join('|'); (index[k] = index[k] || {})[o.vintage] = o; });
Object.values(index).forEach((p) => { if (p.GCP2024 && p.GCP2025 && /^\d{4}$/.test(p.GCP2025.period)) expected.push(`${p.GCP2024.id}>${p.GCP2025.id}`); });
ok(data.revisions.length === expected.length, `revisions: ${data.revisions.length} recorded, ${expected.length} overlapping values`);
data.revisions.forEach((r) => {
  const a = byId[r.earlier_id];
  const b = byId[r.later_id];
  const tag = `revision ${r.indicator} ${r.sector || ''} ${r.period} ${r.price_basis}`;
  ok(a && b && a.vintage === r.earlier_vintage && b.vintage === r.later_vintage && a.vintage !== b.vintage, `${tag}: ids/vintages`);
  if (!a || !b) return;
  ok(expected.includes(`${a.id}>${b.id}`), `${tag}: not an overlapping pair`);
  ok(a.indicator === b.indicator && a.sector === b.sector && a.period === b.period && a.price_basis === b.price_basis, `${tag}: compares unlike values`);
  ok(r.earlier_value === a.value && r.later_value === b.value, `${tag}: values do not match the observations`);
  const d = Math.round((b.value - a.value) * 10) / 10;
  ok(Math.abs(r.difference - d) < 1e-9, `${tag}: difference ${r.difference}, expected ${d}`);
  const pct = a.value ? Math.round((d / a.value) * 1000) / 10 : null;
  ok(pct === null ? r.difference_pct === null : Math.abs(r.difference_pct - pct) < 1e-9, `${tag}: difference_pct ${r.difference_pct}, expected ${pct}`);
});
// at least one revision is non-zero, so a later edition was not copied over an earlier one
ok(data.revisions.some((r) => r.difference !== 0), 'every revision is zero: vintages look overwritten');

if (errors.length) {
  errors.forEach((m) => console.error(`FAIL ${m}`));
  console.error(`test-economy: ${errors.length} failure(s) in ${checks} checks`);
  process.exit(1);
}
console.log(`test-economy: ${checks} checks passed (${obs.length} values, ${Object.keys(groups).length} vintage-years of activity sums, ${data.revisions.length} revisions)`);
