#!/usr/bin/env node
// Checks data/siaya-county-series.json (county Budget Review and Outlook Papers and the Auditor-General's revenue
// reports, kept as separate series): schema; ids unique; every value names a source in the source library and the
// manifest with the same SHA-256 and a PDF page; values equal the printed text; the second-reading rule for OCR
// figures (accepted at confidence 3 only when two independent passes read the figure, else capped at 2 and marked
// for a human check); the arithmetic checks recomputed; the comparisons recomputed from the observations and the
// Controller of Budget series in data/history.json, and never written back into it (series are not blended); the
// FY 2019/20 conflict (Auditor-General table against the Controller of Budget) is in the register with these values.
// Run: node scripts/test-county-series.js
const fs = require('fs');
const path = require('path');
const { check } = require('./lib-schema-check');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-county-series.json');
const schema = read('schemas/siaya-county-series.schema.json');
const lib = read('data/source-library.json').documents;
const man = read('data/source-manifest.json').documents;
const hist = read('data/history.json');
const reg = read('data/conflicts.json');
const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };
const near = (a, b, t = 0.005) => Math.abs(a - b) <= t;
const num = (s) => Number(String(s).replace(/^Kshs\s+/, '').replace(/\s+conditional allocations$/, '').replace(/,/g, ''));

check(schema, data, 'siaya-county-series').forEach((m) => ok(false, `schema ${m}`));

const src = Object.fromEntries(data.sources.map((s) => [s.source_id, s]));
data.sources.forEach((s) => {
  const l = lib.find((d) => d.document_id === s.source_id);
  ok(l && l.sha256 === s.sha256 && l.retrieval_status === 'downloaded', `source ${s.source_id}: not in the source library as downloaded with the same SHA-256`);
  const m = man.find((d) => d.id === s.source_id || d.sha256 === s.sha256);
  ok(s.source_id === 'siaya-brop-2019-20' || (m && m.sha256 === s.sha256), `source ${s.source_id}: not in the manifest with the same SHA-256`);
  if (/^OAG-/.test(s.source_id)) ok(m && /^[0-9a-f]{32}$/.test(m.md5_library || ''), `source ${s.source_id}: a Parliament library file needs the library MD5`);
});

const series = new Set(data.series.map((s) => s.id));
const ids = new Set();
data.observations.forEach((o) => {
  const tag = `observation ${o.id}`;
  ok(!ids.has(o.id), `${tag}: duplicate id`); ids.add(o.id);
  ok(series.has(o.series), `${tag}: unknown series`);
  ok(Boolean(src[o.source_id]), `${tag}: source not listed`);
  ok(near(o.value, num(o.original_text), 1e-6), `${tag}: value ${o.value} is not the printed ${o.original_text}`);
  ok(o.basis && o.basis.length > 20, `${tag}: basis must be stated`);
  const oag = /^OAG-/.test(o.source_id);
  ok(oag === /^oag-/.test(o.series), `${tag}: an Auditor-General document belongs to an oag series, a county paper to county-cbrop`);
  if (o.read_method === 'ocr-tesseract') {
    const r = o.second_reading;
    ok(Boolean(r), `${tag}: an OCR figure needs its second reading`);
    if (!r) return;
    const n = Object.values(r.passes).filter(Boolean).length;
    ok(n === r.passes_reading_it && r.agree === (n >= 2), `${tag}: agreement does not follow from the passes`);
    if (r.agree) ok(o.confidence <= 3 && o.needs_human_check === false, `${tag}: an OCR figure read twice is confidence 3 at most, no human check`);
    else ok(o.confidence <= 2 && o.needs_human_check === true, `${tag}: an OCR figure not read twice must be capped at confidence 2 and marked for a human check`);
  } else {
    ok(o.confidence <= 4 && !o.second_reading, `${tag}: a text-layer figure is confidence 4 at most`);
  }
});
// The rule is not vacuous: every Auditor-General figure went through it.
ok(data.observations.filter((o) => /^OAG-/.test(o.source_id)).every((o) => o.read_method === 'ocr-tesseract'), 'every Auditor-General figure here was read from a scan');

// ---- arithmetic checks ----
const by = Object.fromEntries(data.observations.map((o) => [o.id, o]));
data.arithmetic_checks.forEach((c) => {
  const v = c.ids.map((id) => by[id]);
  ok(v.every(Boolean), `arithmetic ${c.rule}: unknown id`);
  if (!v.every(Boolean)) return;
  let d;
  if (/printed variance/.test(c.rule)) d = Math.abs(v[0].value - v[1].value) - Math.abs(num(c.printed_variance));
  else if (/^cash receipts \+ receivables/.test(c.rule)) d = v[0].value + v[1].value - v[2].value;
  else d = v.slice(0, -1).reduce((a, x) => a + x.value, 0) - v[v.length - 1].value;
  ok(near(d, c.difference, 0.01), `arithmetic ${c.ids[0]}: difference ${c.difference}, recomputed ${d}`);
  ok(c.status === (Math.abs(d) < 0.01 ? 'adds' : 'does not add'), `arithmetic ${c.ids[0]}: status wrong`);
});
['quarters 1 to 4', 'equitable share of FY 2024/25 received', 'FIF + Linda Mama'].forEach((k) => ok(data.arithmetic_checks.some((c) => c.rule.startsWith(k) && c.status === 'adds'), `arithmetic: "${k}" must be checked and add`));
ok(data.arithmetic_checks.filter((c) => /printed variance/.test(c.rule)).length === 23, 'every row of the two twelve- and eleven-year tables is checked against its variance');

// ---- comparisons: recomputed, never blended ----
const cob = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
data.comparisons.forEach((c) => {
  const want = [];
  if (cob[c.fy] && typeof cob[c.fy].value === 'number') want.push(cob[c.fy].value);
  data.observations.filter((o) => o.fy === c.fy && ['osr_actual', 'osr_receipts_cash'].includes(o.measure)).forEach((o) => want.push(Math.round(o.value / 1e4) / 100));
  ok(JSON.stringify(want) === JSON.stringify(c.values.map((x) => x.value_ksh_m)), `comparison ${c.fy}: values do not match the observations and history.json`);
  const lo = Math.min(...want); const hi = Math.max(...want);
  ok(near(c.spread_pct_of_smallest, Math.round(((hi - lo) / lo) * 10000) / 100, 0.011), `comparison ${c.fy}: spread wrong`);
});
// The history series keeps the Controller of Budget value for FY 2019/20 (not blended with the audited table).
ok(near(cob['2019/20'].value, 179.43, 1e-9), 'history.json osr_series FY 2019/20 must stay the Controller of Budget 179.43');

// ---- FY 2019/20 conflict ----
const c = reg.conflicts.find((x) => x.id === 'osr-2019-20-audited-table');
ok(Boolean(c), 'conflict osr-2019-20-audited-table must be in data/conflicts.json');
if (c) {
  const oagV = by['CS-ROR25-T1-1920-osr_actual'];
  ok(c.values.some((v) => near(v.value, oagV.value / 1e6, 0.005)), 'the register must list the Auditor-General table value');
  ok(c.values.some((v) => near(v.value, 179.43, 1e-9)), 'the register must list the Controller of Budget value');
}
ok(/Provisional/.test(data.meta.review), 'meta.review must say the values are provisional');

if (errors.length) {
  console.error(`test-county-series: ${errors.length} of ${checks} checks failed:\n- ${errors.slice(0, 40).join('\n- ')}`);
  process.exit(1);
}
console.log(`test-county-series: ${checks} checks passed (${data.observations.length} values in ${data.series.length} series, ${data.observations.filter((o) => o.read_method === 'ocr-tesseract').length} OCR figures read twice, ${data.observations.filter((o) => o.needs_human_check).length} need a human check, ${data.comparisons.length} year comparisons)`);
