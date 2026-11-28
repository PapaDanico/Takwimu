#!/usr/bin/env node
// Checks each registry county's geography (schemas/county-geography.schema.json and the boundary files in
// lib/county-registry.js geo): IEBC codes unique and nested (wards in constituencies in the county); for Kisumu exactly
// the 7 IEBC constituencies and 35 wards; every ward polygon joins the registry by IEBC code and id, and every
// constituency polygon by code; the name crosswalk covers every ward; the ward coverage is valid with no overlap and its
// area is within 1% of the official land area; KNBS sub-counties are listed apart (Kadibo has no constituency); registered
// voters are as printed. Run: node scripts/test-county-geography.js
const fs = require('fs');
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const EXPECT = { kisumu: { constituencies: ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Seme', 'Nyando', 'Muhoroni', 'Nyakach'], wards: 35 } };
const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
counties.withKind('geography').filter((s) => !counties.legacy(s)).forEach((slug) => {
  const g = counties.load(slug, 'geography');
  const out = check(counties.schema('geography'), g, `${slug}-geography`);
  ok(out.length === 0, `${slug}: schema: ${out.slice(0, 5).join('; ')}`);
  ok(Number(g.county.iebc_county_code) === counties.COUNTY_DATA[slug].code, `${slug}: county code`);
  const e = EXPECT[slug];
  if (e) {
    ok(JSON.stringify([...g.constituencies.map((c) => c.name)].sort()) === JSON.stringify([...e.constituencies].sort()), `${slug}: constituencies are ${g.constituencies.map((c) => c.name).join(', ')}`);
    ok(g.wards.length === e.wards, `${slug}: ${g.wards.length} wards, expected ${e.wards}`);
  }
  const codes = new Set(g.wards.map((w) => w.iebc_ward_code));
  ok(codes.size === g.wards.length && new Set(g.wards.map((w) => w.id)).size === g.wards.length, `${slug}: ward codes or ids repeat`);
  const con = Object.fromEntries(g.constituencies.map((c) => [c.id, c]));
  g.wards.forEach((w) => ok(con[w.parent] && con[w.parent].iebc_constituency_code === w.iebc_constituency_code && con[w.parent].ward_ids.includes(w.id), `${slug} ${w.id}: not nested in its constituency`));
  ok(g.constituencies.reduce((s, c) => s + c.ward_ids.length, 0) === g.wards.length, `${slug}: constituency ward lists do not add to the wards`);
  ok(JSON.stringify(g.county.constituency_ids) === JSON.stringify(g.constituencies.map((c) => c.id)), `${slug}: county constituency_ids`);
  ok(g.crosswalk.length === g.wards.length && g.crosswalk.every((x) => codes.has(x.iebc_code)), `${slug}: crosswalk does not cover every ward`);
  // Registered voters as printed.
  g.constituencies.forEach((c) => { const v = c.registered_voters_2022; ok(v.as_printed.replace(/,/g, '').includes(String(v.value)) && v.as_printed.includes(c.iebc_constituency_code), `${slug} ${c.id}: voters not as printed`); ok(g.sources.some((s) => s.id === v.source_id && s.sha256), `${slug} ${c.id}: voters source not hashed`); });
  // Sub-county slugs match the census rows.
  // KNBS sub-counties are a separate list: every KNBS sub-county with census figures is in it, and a KNBS unit with no
  // namesake constituency (Kadibo) is never tied to one.
  const knbs = new Set(g.knbs_sub_counties.map((x) => x.slug));
  if (counties.has(slug, 'population')) {
    const sub = counties.load(slug, 'population').by_sub_county;
    if (sub) Object.keys(sub.values).forEach((k) => ok(knbs.has(k), `${slug}: census sub-county ${k} is not in knbs_sub_counties`));
  }
  g.knbs_sub_counties.forEach((x) => ok(x.same_name_constituency_id === null || con[x.same_name_constituency_id], `${slug} ${x.slug}: same_name_constituency_id does not exist`));
  if (slug === 'kisumu') ok(g.knbs_sub_counties.some((x) => x.slug === 'kadibo' && x.same_name_constituency_id === null), 'kisumu: Kadibo must be listed as a KNBS sub-county with no constituency');
  // Area and topology (computed by scripts/build-county-geo.py on the unsimplified polygons).
  ok(g.checks.coverage_valid === true && g.checks.ward_overlap_km2 < 0.01, `${slug}: ward coverage invalid or overlapping`);
  ok(Math.abs(g.checks.ward_area_vs_official_pct) <= 1, `${slug}: ward area ${g.checks.ward_area_km2} km2 is more than 1% from the official ${g.checks.official_land_area_km2} km2`);
  ok(g.checks.constituency_vs_wards.length === g.constituencies.length, `${slug}: constituency check rows`);
  ok(/City of Kisumu|city/i.test(g.meta.scope) || slug !== 'kisumu', `${slug}: scope must say the city boundary is not drawn`);
  ok(/lake/i.test(g.meta.lake_rule), `${slug}: lake rule missing`);
  // Boundary files join the registry.
  const geo = counties.COUNTY_DATA[slug].geo || {};
  ['wards', 'constituencies'].forEach((k) => ok(geo[k] && fs.existsSync(counties.abs(geo[k])), `${slug}: boundary file ${k} missing`));
  if (geo.wards) {
    const W = JSON.parse(fs.readFileSync(counties.abs(geo.wards), 'utf8'));
    const byCode = Object.fromEntries(g.wards.map((w) => [w.iebc_ward_code, w]));
    ok(W.features.length === g.wards.length, `${slug}: ${W.features.length} ward polygons for ${g.wards.length} wards`);
    W.features.forEach((f) => { const p = f.properties; const w = byCode[p.ward_code]; ok(w && w.id === p.ward_id && w.name === p.ward_name && con[w.parent].iebc_constituency_code === p.constituency_code, `${slug}: ward polygon ${p.ward_code} ${p.ward_name} does not join the registry`); ok(Array.isArray(p.label) && f.geometry.type === 'MultiPolygon', `${slug} ${p.ward_code}: geometry`); });
    ok(/CC BY/.test(W.meta.licence) && W.meta.attribution && /^[0-9a-f]{64}$/.test(W.meta.resource_sha256), `${slug}: ward file licence, attribution or hash`);
  }
  if (geo.constituencies) {
    const C = JSON.parse(fs.readFileSync(counties.abs(geo.constituencies), 'utf8'));
    ok(C.features.length === g.constituencies.length && C.features.every((f) => g.constituencies.some((c) => c.iebc_constituency_code === f.properties.ward_code && c.id === f.properties.ward_id)), `${slug}: constituency polygons do not join the registry`);
  }
});
if (errors.length) { errors.slice(0, 30).forEach((x) => console.error(`  - ${x}`)); console.error(`test-county-geography: ${errors.length} of ${n} checks failed`); process.exit(1); }
console.log(`test-county-geography: ${n} checks passed (${counties.withKind('geography').filter((s) => !counties.legacy(s)).join(', ')})`);
