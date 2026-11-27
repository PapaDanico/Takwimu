#!/usr/bin/env node
// Checks each county population file in lib/county-registry.js (schemas/county-population.schema.json): the parts add
// up (male + female + intersex = census total; sub-counties = census total; male + female = each projection total), a
// projection is labelled as one and never stands as the census, every point cites a hashed source with a page and the
// figure as printed, and a print that differs is kept beside the value used. Run: node scripts/test-county-population.js
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const digits = (s) => (String(s).match(/\d[\d,]*/g) || []).map((x) => Number(x.replace(/,/g, '')));
counties.withKind('population').forEach((slug) => {
  const p = counties.load(slug, 'population');
  const out = check(counties.schema('population'), p, `${slug}-population`);
  ok(out.length === 0, `${slug}: schema: ${out.slice(0, 5).join('; ')}`);
  ok(p.meta.county_code === counties.COUNTY_DATA[slug].code, `${slug}: county_code`);
  const census = p.points.filter((x) => x.kind === 'census');
  ok(census.length >= 1, `${slug}: no census point`);
  p.points.forEach((x) => {
    const w = `${slug} ${x.id} (${x.year} ${x.kind})`;
    ok(x.source.source_id in p.sources, `${w}: source not in sources`);
    ok(digits(x.source.as_printed).includes(x.value), `${w}: value ${x.value} is not in the printed text`);
    if (x.kind === 'census') ok(x.male + x.female + x.intersex === x.value, `${w}: male + female + intersex is not the total`);
    if (x.kind === 'projection') {
      // A printed difference must be stated in the note with the printed sum; nothing is adjusted.
      const sum = x.male + x.female;
      ok(sum === x.value || (x.note || '').includes(sum.toLocaleString('en-US')), `${w}: male + female (${sum}) is not the projection total and the note does not state the printed difference`);
      ok(/projection/i.test(x.note || '') && x.projection_by, `${w}: a projection must say so and name who projected it`);
      ok(!census.some((c) => c.year === x.year), `${w}: a projection for a census year`);
    }
  });
  const ys = p.points.map((x) => x.year);
  ok(new Set(ys).size === ys.length, `${slug}: two points for one year`);
  const sc = p.by_sub_county;
  const base = p.points.find((x) => x.year === sc.year && x.kind === sc.kind);
  ok(base && Object.values(sc.values).reduce((a, b) => a + b, 0) === base.value, `${slug}: sub-county values do not add to the ${sc.year} ${sc.kind} total`);
  ok(p.points.some((x) => x.id === p.denominator.census_point && x.kind === 'census'), `${slug}: denominator census point is not a census`);
  p.denominator.projection_points.forEach((id) => ok(p.points.some((x) => x.id === id && x.kind === 'projection'), `${slug}: denominator projection ${id} is not a projection`));
  (p.print_differences || []).forEach((d) => { const x = p.points.find((y) => y.id === d.point); ok(x && x.value !== d.as_printed, `${slug}: print difference for ${d.point} does not differ`); });
  ok(p.gaps.length > 0, `${slug}: gaps must be listed`);
});
if (errors.length) { errors.forEach((e) => console.error(`  - ${e}`)); console.error(`test-county-population: ${errors.length} of ${n} checks failed`); process.exit(1); }
console.log(`test-county-population: ${n} checks passed (${counties.withKind('population').join(', ')})`);
