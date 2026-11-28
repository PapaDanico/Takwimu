#!/usr/bin/env node
// Checks every department file in lib/county-registry.js (kind "departments", e.g. data/counties/kisumu/departments.json)
// against schemas/county-departments.schema.json, and:
// - meta.held matches the registry; county code; every source_id is a document in data/source-manifest.json with a sha256;
// - ids unique; one total row per year; a "dash" cell is null and a "printed" cell is a number (no zero written for a dash);
// - checks recompute: departments sum to the printed total (amount columns), printed ratios against printed amounts;
//   a disagreeing ratio must carry a cell note (source inconsistency kept, never corrected);
// - comparisons recompute against data/counties-cob.json (same report, county totals);
// - the dataset stays Provisional and no review record cites it.
// Run: node scripts/test-county-departments.js
const fs = require('fs');
const path = require('path');
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const manifest = JSON.parse(fs.readFileSync(path.join(counties.ROOT, 'data', 'source-manifest.json'), 'utf8'));
const docs = new Map((Array.isArray(manifest) ? manifest : manifest.documents || manifest.sources).map((x) => [x.id, x]));
const cob = JSON.parse(fs.readFileSync(path.join(counties.ROOT, 'data', 'counties-cob.json'), 'utf8'));
const AMT = ['budget_rec', 'budget_dev', 'exchequer_rec', 'exchequer_dev', 'expenditure_rec', 'expenditure_dev'];
const RATIOS = [['expenditure_rec', 'exchequer_rec', 'exp_to_exchequer_rec_pct'], ['expenditure_dev', 'exchequer_dev', 'exp_to_exchequer_dev_pct'],
  ['expenditure_rec', 'budget_rec', 'absorption_rec_pct'], ['expenditure_dev', 'budget_dev', 'absorption_dev_pct']];

const slugs = counties.withKind('departments');
slugs.forEach((slug) => {
  const d = counties.load(slug, 'departments');
  const tag = (x) => `${slug} departments ${x}`;
  const out = check(counties.schema('departments'), d, `${slug}-departments`);
  ok(out.length === 0, tag(`schema: ${out.slice(0, 5).join('; ')}`));
  ok(Boolean(d.meta.held) === !counties.isPublicKind(slug, 'departments'), tag(`meta.held must be ${!counties.isPublicKind(slug, 'departments')}`));
  ok(d.meta.county_code === counties.COUNTY_DATA[slug].code, tag('meta.county_code'));
  ok(/^Provisional/.test(d.meta.status), tag('status must stay Provisional'));
  d.meta.source_ids.forEach((s) => ok(docs.has(s) && /^[0-9a-f]{64}$/.test(docs.get(s).sha256 || ''), tag(`source ${s} not in source-manifest with a sha256`)));
  const ids = new Set();
  const byYear = {};
  d.records.forEach((r) => {
    const w = tag(r.id);
    ok(!ids.has(r.id), `${w}: duplicate id`); ids.add(r.id);
    ok(r.id.startsWith(`${slug}-dept-${r.fy.replace('/', '-')}-`), `${w}: id must start with <slug>-dept-<fy>-`);
    ok(d.meta.source_ids.includes(r.source_id), `${w}: source_id not in meta.source_ids`);
    Object.entries(r.cells).forEach(([c, x]) => {
      if (x.status === 'printed') ok(typeof x.value === 'number', `${w} ${c}: printed cell without a number`);
      else ok(x.value === null, `${w} ${c}: ${x.status} cell must be null`);
      if (AMT.includes(c) && x.value !== null) ok(x.value >= 0, `${w} ${c}: negative amount`);
    });
    (byYear[r.fy] = byYear[r.fy] || []).push(r);
  });
  const checkKey = new Map(d.checks.map((c) => [`${c.fy}|${c.check}`, c]));
  Object.entries(byYear).forEach(([fy, rows]) => {
    const tots = rows.filter((r) => r.is_total);
    ok(tots.length === 1, tag(`${fy}: needs exactly one total row`));
    if (tots.length !== 1) return;
    const tot = tots[0]; const deps = rows.filter((r) => !r.is_total);
    AMT.forEach((c) => {
      const s = Math.round(deps.reduce((a, r) => a + (r.cells[c].value || 0), 0) * 100) / 100;
      const k = checkKey.get(`${fy}|sum of departments, ${c}`);
      ok(k && Math.abs(k.computed - s) < 0.005 && k.printed === tot.cells[c].value, tag(`${fy} sum check ${c} does not recompute`));
      ok(Math.abs(s - tot.cells[c].value) <= 0.02 * deps.length, tag(`${fy} ${c}: departments add to ${s}, printed total ${tot.cells[c].value}`));
    });
    const intPct = rows.every((r) => RATIOS.every(([, , p]) => r.cells[p].value === null || Number.isInteger(r.cells[p].value)));
    rows.forEach((r) => RATIOS.forEach(([a, b, p]) => {
      const x = r.cells[a].value; const y = r.cells[b].value; const v = r.cells[p].value;
      if (!x || !y || v === null) return;
      const comp = Math.round(1000 * x / y) / 10;
      const k = checkKey.get(`${fy}|${r.department}: ${p}`);
      ok(k && k.computed === comp && k.printed === v, tag(`${fy} ${r.department} ${p}: check entry missing or stale`));
      if (Math.abs(comp - v) > (intPct ? 0.6 : 0.15)) ok(Boolean(r.cells[p].note), tag(`${fy} ${r.department} ${p}: printed ${v} vs ${comp} without a note`));
    }));
    const k = (cob.years.find((y) => y.fy === fy) || { counties: [] }).counties.find((c) => c.slug === slug);
    d.comparisons.filter((c) => c.fy === fy).forEach((c) => {
      const raw = k ? k[c.counties_cob_field] : undefined;
      const v = raw && typeof raw === 'object' ? raw.value : raw;
      ok((v ?? null) === c.counties_cob_value, tag(`${fy} comparison ${c.measure}: counties-cob value is ${v}`));
      ok(c.department_table_total === tot.cells[c.measure].value, tag(`${fy} comparison ${c.measure}: total differs from the record`));
      ok(c.agrees === (v != null && Math.abs(v - c.department_table_total) < 0.006), tag(`${fy} comparison ${c.measure}: agrees flag`));
    });
  });
  const rv = path.join(counties.ROOT, 'data', 'reviews.json');
  if (fs.existsSync(rv)) ok(!fs.readFileSync(rv, 'utf8').includes(`${slug}-dept-`), tag('a review record cites a department record; reviews are added by the editor only'));
});

if (errors.length) {
  console.error(`test-county-departments: ${errors.length} of ${n} checks failed`);
  errors.slice(0, 40).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log(`test-county-departments: ${n} checks passed (${slugs.map((s) => { const d = counties.load(s, 'departments'); return `${s}: ${d.records.length} rows, ${Object.keys(d.headers_by_year).length} years, ${d.checks.filter((c) => !c.agrees).length} source inconsistency`; }).join('; ')})`);
