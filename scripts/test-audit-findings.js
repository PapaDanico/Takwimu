#!/usr/bin/env node
// Checks every coded-findings file in lib/county-registry.js (kind "findings", e.g. data/counties/kisumu/audit-findings.json)
// against schemas/county-audit-findings.schema.json, and:
// - each finding cites a document in the county's audits file whose entity and year match, with a PDF page;
// - ids are <doc_id>-NN, unique, and numbered in order within a document;
// - amounts are positive KSh; a prior-year flag carries its basis;
// - no honorifics or personal-name patterns, and loaded words only inside a quoted report heading;
// - recurrence_by_category recomputes from the findings; a "not yet coded" gap has no findings and names a held report;
// - meta.held matches the registry (a kind outside the county's public_kinds is held).
// Run: node scripts/test-audit-findings.js
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const honorific = /(^|[^A-Za-z])(Hon|H\.E|Dr|Mr|Mrs|Ms|Prof|Eng|M\/s)\.?\s+[A-Z]/;
const loaded = /\b(fraud\w*|corrupt\w*|theft|thieves|stole\w*|embezzl\w*|fictitious|looted)\b/i;

const slugs = counties.withKind('findings');
slugs.forEach((slug) => {
  const d = counties.load(slug, 'findings');
  const tag = (x) => `${slug} findings ${x}`;
  const out = check(counties.schema('findings'), d, `${slug}-findings`);
  ok(out.length === 0, tag(`schema: ${out.slice(0, 5).join('; ')}`));
  ok(Boolean(d.meta.held) === !counties.isPublicKind(slug, 'findings'), tag(`meta.held must be ${!counties.isPublicKind(slug, 'findings')}`));
  ok(d.meta.county_code === counties.COUNTY_DATA[slug].code, tag('meta.county_code'));
  ok(counties.has(slug, 'audits'), tag('needs the county audits file for its documents'));
  const A = counties.load(slug, 'audits');
  const docs = Object.fromEntries(A.documents.map((x) => [x.doc_id, x]));
  const ids = new Set();
  const lastN = {};
  d.findings.forEach((f) => {
    const w = tag(f.id);
    ok(!ids.has(f.id), `${w}: duplicate id`); ids.add(f.id);
    const doc = docs[f.doc_id];
    ok(Boolean(doc), `${w}: doc_id ${f.doc_id} not in the audits file`);
    if (doc) {
      ok(doc.entity === f.entity && doc.fy === f.fy, `${w}: entity or year differs from the document`);
      ok(/^Report of the Auditor-General/.test(doc.title || ''), `${w}: findings are coded from the Auditor-General's report only`);
    }
    const m = f.id.match(/^(.*)-(\d{2})$/);
    ok(m && m[1] === f.doc_id, `${w}: id must be <doc_id>-NN`);
    if (m) { const k = Number(m[2]); ok(k === (lastN[f.doc_id] || 0) + 1, `${w}: numbering not in order`); lastN[f.doc_id] = k; }
    ok(Number.isInteger(f.page) && f.page >= 1, `${w}: page`);
    f.amounts.forEach((a, i) => ok(a.unit === 'KSh' && Number.isFinite(a.value) && a.value > 0, `${w} amount ${i}: positive KSh`));
    if (f.unresolved_prior_year.flag) ok(!f.unresolved_prior_year.basis.startsWith('Not stated'), `${w}: prior-year flag without basis`);
    ok(!f.listed_unresolved_next_year || d.findings.some((g) => g.entity === f.entity && Number(g.fy.slice(0, 4)) === Number(f.fy.slice(0, 4)) + 1), `${w}: next-year flag without a coded next-year report`);
  });
  const walk = (v, where, inHeading) => {
    if (typeof v === 'string') {
      ok(!honorific.test(v), `${where}: honorific or personal-name pattern`);
      ok(inHeading || !loaded.test(v), `${where}: loaded word outside a quoted report heading`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`, inHeading));
    else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], `${where}.${k}`, inHeading || (k === 'report_heading' && v[k] && v[k].quoted === true)));
  };
  walk(d, tag(''), false);
  const rec = {};
  d.findings.forEach((f) => { rec[f.entity] = rec[f.entity] || {}; rec[f.entity][f.category] = rec[f.entity][f.category] || {}; rec[f.entity][f.category][f.fy] = (rec[f.entity][f.category][f.fy] || 0) + 1; });
  const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
  ok(canon(rec) === canon(d.recurrence_by_category), tag('recurrence_by_category does not match the findings'));
  d.gaps.forEach((g) => {
    ok(!d.findings.some((f) => f.entity === g.entity && f.fy === g.fy), tag(`gap ${g.entity} ${g.fy}: has findings`));
    if (g.status === 'not yet coded') ok(Boolean(g.doc_id && docs[g.doc_id]), tag(`gap ${g.entity} ${g.fy}: names no held report`));
  });
  // Every Auditor-General report in the audits file is either coded or listed as a gap (no silent drop).
  A.documents.filter((x) => /^Report of the Auditor-General/.test(x.title || '')).forEach((x) => ok(d.findings.some((f) => f.doc_id === x.doc_id) || d.gaps.some((g) => g.doc_id === x.doc_id), tag(`report ${x.doc_id}: neither coded nor listed as a gap`)));
});

if (errors.length) {
  console.error(`test-audit-findings: ${errors.length} of ${n} checks failed`);
  errors.slice(0, 40).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log(`test-audit-findings: ${n} checks passed (${slugs.map((s) => `${s}: ${counties.load(s, 'findings').findings.length} findings`).join('; ')})`);
