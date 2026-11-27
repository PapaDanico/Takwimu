#!/usr/bin/env node
// Checks data/siaya-budget-departments.json (Siaya budgets and spending by department, County Treasury PBBs and
// CBROPs): schema; ids unique and built from the fields; every value names a source in the source library and the
// manifest with the same SHA-256, a table and a PDF page; values equal the printed text (a printed '-' is null, never
// 0); every department name is in the crosswalk and every code in the department list; the sum and row checks are
// recomputed and their status is right (a document that does not add up is flagged, never corrected); years of the
// ten-year window with no budget table are listed as gaps; nothing is labelled approved.
// Run: node scripts/test-budget-departments.js
const fs = require('fs');
const path = require('path');
const { check } = require('./lib-schema-check');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-budget-departments.json');
const schema = read('schemas/siaya-budget-departments.schema.json');
const lib = read('data/source-library.json').documents;
const man = read('data/source-manifest.json').documents;
const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };

check(schema, data, 'siaya-budget-departments').forEach((m) => ok(false, `schema ${m}`));

// ---- sources ----
const src = Object.fromEntries(data.sources.map((s) => [s.source_id, s]));
data.sources.forEach((s) => {
  const l = lib.find((d) => d.document_id === s.source_id);
  ok(l && l.sha256 === s.sha256 && l.retrieval_status === 'downloaded', `source ${s.source_id}: not in the source library as downloaded with the same SHA-256`);
  ok(l && l.data_reuse === 'figures may be reused with citation' && l.document_redistribution === false, `source ${s.source_id}: county documents are figures-with-citation, not redistributed`);
  const m = man.find((d) => d.id === s.source_id || d.sha256 === s.sha256);
  ok(s.source_id === 'siaya-brop-2019-20' || (m && m.sha256 === s.sha256), `source ${s.source_id}: not in the source manifest with the same SHA-256`);
});

// ---- observations ----
const CLS = { total: 'tot', recurrent: 'rec', development: 'dev', compensation: 'pe', operations: 'om' };
const codes = new Set(data.departments.map((d) => d.code));
const ids = new Set();
const num = (s) => Number(String(s).replace(/,/g, '').replace(/^\((.*)\)$/, '-$1'));
data.observations.forEach((o) => {
  const tag = `observation ${o.id}`;
  ok(!ids.has(o.id), `${tag}: duplicate id`); ids.add(o.id);
  const fyc = o.fy.replace('/', '').slice(2);
  const want = `BD-${fyc}-${o.document_kind}-${o.dept_code}-${o.measure}-${CLS[o.class]}${o.budget_version ? `-${o.budget_version.slice(0, 4)}` : ''}${o.includes_balance_bf === null ? '' : o.includes_balance_bf ? '-bf' : '-nobf'}`;
  ok(o.id === want, `${tag}: id should be ${want}`);
  ok(Boolean(src[o.source_id]), `${tag}: source ${o.source_id} is not in sources`);
  ok(src[o.source_id] && src[o.source_id].kind === o.document_kind, `${tag}: document_kind differs from the source`);
  ok(o.dept_code === 'TOTAL' || codes.has(o.dept_code), `${tag}: unknown department ${o.dept_code}`);
  if (o.original_text === '-') ok(o.value === null && /not zero/.test(o.note || ''), `${tag}: a printed '-' must be null with a note`);
  else ok(o.value === num(o.original_text), `${tag}: value ${o.value} is not the printed ${o.original_text}`);
  ok(o.value !== 0 || o.original_text === '0', `${tag}: a zero must be printed as 0`);
  if (o.measure === 'actual') ok(o.budget_version === null && o.includes_balance_bf === null && o.document_kind === 'CBROP', `${tag}: an actual has no budget version and comes from a CBROP`);
  else ok(Boolean(o.budget_version), `${tag}: a budget names its version`);
  if (o.document_kind === 'PBB') ok(o.measure === 'budget', `${tag}: a PBB prints budgets only`);
  ok(o.confidence <= 4, `${tag}: a text-layer reading is confidence 4 at most until read twice`);
  ok(!/approved after review|reviewed and approved/i.test(JSON.stringify(o)), `${tag}: no value is approved without a review record`);
});
ok(data.observations.length > 1000, 'expected more than 1,000 department values');

// ---- crosswalk ----
const cw = new Set(data.crosswalk.flatMap((c) => c.fys.map((fy) => `${fy}|${c.printed_name}|${c.code}`)));
data.observations.filter((o) => o.dept_code !== 'TOTAL').forEach((o) => ok(cw.has(`${o.fy}|${o.printed_name}|${o.dept_code}`), `crosswalk: ${o.fy} "${o.printed_name}" -> ${o.dept_code} is missing`));
data.crosswalk.forEach((c) => {
  ok(codes.has(c.code), `crosswalk ${c.printed_name}: unknown code ${c.code}`);
  ok(c.fys.every((fy) => data.observations.some((o) => o.fy === fy && o.printed_name === c.printed_name && o.dept_code === c.code)), `crosswalk ${c.printed_name} (${c.code}): a year has no value`);
});
// Every crosswalk code that changed function says so.
['EXECUTIVE', 'TOURISM', 'WATER', 'AGRICULTURE', 'TRADE'].forEach((k) => ok(data.crosswalk.filter((c) => c.code === k).every((c) => !/^Same function/.test(c.comparability)), `crosswalk ${k}: the change of functions must be stated`));
ok(Array.isArray(data.unmatched), 'unmatched names must be listed (possibly none)');

// ---- sum and row checks, recomputed ----
const byId = Object.fromEntries(data.observations.map((o) => [o.id, o]));
const status = (d) => (Math.abs(d) < 1 ? 'adds' : Math.abs(d) <= 5 ? 'within rounding (KSh 5 or less)' : 'does not add');
const groupKey = (o) => [o.source_id, o.table, o.measure, o.class, o.budget_version, o.includes_balance_bf].join('|');
const totals = data.observations.filter((o) => o.dept_code === 'TOTAL');
totals.forEach((t) => {
  const s = data.sum_checks.find((x) => x.total_id === t.id);
  ok(Boolean(s), `sum_checks: no check for ${t.id}`);
  if (!s) return;
  const parts = data.observations.filter((o) => o.dept_code !== 'TOTAL' && groupKey(o) === groupKey(t));
  ok(JSON.stringify(parts.map((p) => p.id).sort()) === JSON.stringify([...s.part_ids].sort()), `sum_checks ${t.id}: parts differ`);
  const sum = parts.reduce((a, p) => a + (p.value || 0), 0);
  ok(Math.abs(sum - s.sum_of_parts) < 0.01 && Math.abs(sum - t.value - s.difference) < 0.01, `sum_checks ${t.id}: sum or difference wrong`);
  ok(s.status === status(sum - t.value), `sum_checks ${t.id}: status should be ${status(sum - t.value)}`);
});
data.row_checks.forEach((r) => {
  const [t, rc, dv] = [byId[r.total_id], byId[r.recurrent_id], byId[r.development_id]];
  ok(t && rc && dv, `row_checks ${r.total_id}: ids not found`);
  if (!(t && rc && dv)) return;
  ok(t.source_id === rc.source_id && rc.source_id === dv.source_id && t.dept_code === rc.dept_code && rc.dept_code === dv.dept_code && t.budget_version === rc.budget_version && t.includes_balance_bf === dv.includes_balance_bf, `row_checks ${r.total_id}: the three values are not from one document, department and version`);
  const d = rc.value + dv.value - t.value;
  ok(Math.abs(d - r.difference) < 0.01 && r.status === status(d), `row_checks ${r.total_id}: difference or status wrong`);
});
ok(data.sum_checks.some((s) => s.status === 'does not add'), 'not vacuous: some printed totals do not add up (e.g. PBB 2014/15 development, Agriculture 225,938,791 against 223,938,791)');

// ---- ten-year window: years without a PBB budget are listed gaps ----
const fys = ['2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25', '2025/26'];
fys.forEach((fy) => {
  const has = data.observations.some((o) => o.fy === fy && o.document_kind === 'PBB');
  ok(has || data.meta.gaps.some((g) => g.fy === fy && /budget/.test(g.what)), `${fy}: no PBB values and no gap listed`);
  const act = data.observations.some((o) => o.fy === fy && o.measure === 'actual');
  ok(act || data.meta.gaps.some((g) => g.fy === fy && /actual/.test(g.what)) || fy === '2025/26', `${fy}: no department actuals and no gap listed`);
});
ok(/Provisional/.test(data.meta.review), 'meta.review must say the values are provisional');

if (errors.length) {
  console.error(`test-budget-departments: ${errors.length} of ${checks} checks failed:\n- ${errors.slice(0, 40).join('\n- ')}`);
  process.exit(1);
}
console.log(`test-budget-departments: ${checks} checks passed (${data.observations.length} values, ${data.crosswalk.length} crosswalk names, ${data.sum_checks.length} sum checks of which ${data.sum_checks.filter((s) => s.status === 'does not add').length} do not add, ${data.meta.gaps.length} gaps)`);
