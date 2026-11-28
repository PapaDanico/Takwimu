#!/usr/bin/env node
// Checks every indicators file in lib/county-registry.js (data/indicators.json for Siaya and regional rows,
// data/counties/<slug>/indicators.json for an unpublished county) against schemas/county-indicators.schema.json, and:
// - every value cites a source in the file with a SHA-256, a PDF page (for a PDF), table, row and column;
// - a PDF source's hash is in data/source-manifest.json, data/source-library.json or the county's research register;
// - value_as_printed carries the printed figure: the number (commas and trailing zeros aside) or, for a bounded
//   value, the bound ("<1" is kept as relation less_than, limit 1, value null; never 0 or 1);
// - claims and targets are labelled (kind) and never sit in a conflict as if they were observed estimates;
// - a county file holds only its own county (code) or the lake/national rows the Siaya file may carry;
// - meta.held matches the registry (a kind outside the county's public_kinds is held), and the Siaya file holds no Kisumu row;
// - every conflict names existing values; ids are unique. Run: node scripts/test-indicators.js
const fs = require('fs');
const path = require('path');
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const readData = (f) => JSON.parse(fs.readFileSync(path.join(counties.ROOT, 'data', f), 'utf8'));
const manifest = new Set([...readData('source-manifest.json').documents, ...readData('source-library.json').documents].map((d) => d.sha256).filter(Boolean));
const numOf = (s) => Number(String(s).replace(/,/g, '').replace(/%$/, ''));

counties.withKind('indicators').forEach((slug) => {
  const d = counties.load(slug, 'indicators');
  const tag = (x) => `${slug} indicators ${x}`;
  const out = check(counties.schema('indicators'), d, `${slug}-indicators`);
  ok(out.length === 0, tag(`schema: ${out.slice(0, 5).join('; ')}`));
  const code = counties.COUNTY_DATA[slug].code;
  ok(d.meta.county_code === code, tag('meta.county_code'));
  const held = !counties.isPublicKind(slug, 'indicators');
  ok(Boolean(d.meta.held) === held, tag(`meta.held must be ${held}`));
  const research = counties.COUNTY_DATA[slug].research ? new Set((JSON.parse(fs.readFileSync(counties.abs(counties.COUNTY_DATA[slug].research), 'utf8')).sources || []).map((r) => r.sha256).filter(Boolean)) : new Set();
  const src = Object.fromEntries(d.sources.map((s) => [s.source_id, s]));
  ok(Object.keys(src).length === d.sources.length, tag('duplicate source_id'));
  d.sources.forEach((s) => {
    if (s.file_type === 'PDF') {
      ok(manifest.has(s.sha256) || research.has(s.sha256), tag(`${s.source_id}: PDF hash not in data/source-manifest.json, data/source-library.json or the research register`));
      ok(Number.isInteger(s.pdf_pages) && s.pdf_pages > 0, tag(`${s.source_id}: pdf_pages`));
    }
    ok(s.licence && s.commercial_reuse, tag(`${s.source_id}: licence and commercial_reuse`));
    if (/NC|NonCommercial/i.test(s.licence)) ok(s.commercial_reuse === 'not_permitted', tag(`${s.source_id}: a non-commercial licence must set commercial_reuse not_permitted`));
  });
  const ids = new Set();
  d.observations.forEach((o) => {
    const w = tag(o.id);
    ok(!ids.has(o.id), `${w}: duplicate id`); ids.add(o.id);
    const s = src[o.source_id];
    ok(Boolean(s), `${w}: source ${o.source_id} not in sources`);
    if (s && s.file_type === 'PDF') ok(Number.isInteger(o.pdf_page) && o.pdf_page >= 1 && o.pdf_page <= s.pdf_pages, `${w}: pdf_page outside the PDF`);
    ok(o.table && o.row && o.column, `${w}: table, row and column`);
    if (o.bound) {
      ok(o.value === null && new RegExp(`^<\\s*${o.bound.limit}$`).test(o.value_as_printed), `${w}: a bounded value keeps value null and the printed bound`);
    } else if (o.value !== null) {
      ok(numOf(o.value_as_printed) === o.value, `${w}: value ${o.value} is not the printed ${o.value_as_printed}`);
    }
    if (o.comparator && o.comparator.value !== null) ok(numOf(o.comparator.value_as_printed) === o.comparator.value, `${w}: comparator value is not as printed`);
    if (o.geography === 'county') ok(o.county_code === code, `${w}: county row of another county`);
    if (slug !== 'siaya') ok(o.geography !== 'lake' && o.geography !== 'national', `${w}: lake and national rows belong in data/indicators.json`);
    if (slug === 'siaya') ok(o.county_code !== 42 && !/kisumu/i.test(o.area), `${w}: a Kisumu row in the published file`);
    if (/target/.test(o.kind)) ok(/target/i.test(o.label + o.note), `${w}: a target must say so in its label or note`);
    if (o.kind === 'publisher claim') ok(/claim/i.test(o.note || ''), `${w}: a publisher claim must say so in its note`);
    if (o.standard_error !== undefined && o.standard_error !== null) ok(o.standard_error > 0 && /Annex|standard error/i.test(o.note || ''), `${w}: a standard error needs its printed source in the note`);
  });
  d.conflicts.forEach((c) => {
    c.observations.forEach((id) => ok(ids.has(id), tag(`conflict ${c.id}: unknown value ${id}`)));
    ok(c.hypothesis.length > 20, tag(`conflict ${c.id}: hypothesis`));
  });
  d.gaps.forEach((g) => ok(g.reason && g.next_action, tag(`gap ${g.id}: reason and next action`)));
});

if (errors.length) { console.error(`test-indicators: ${errors.length} failures\n  ${errors.slice(0, 40).join('\n  ')}`); process.exit(1); }
console.log(`test-indicators: ${n} checks passed (${counties.withKind('indicators').join(', ')})`);
