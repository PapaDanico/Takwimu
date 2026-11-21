// Checks that every national value shown or downloaded agrees with its unit label: raw World Bank values carry the
// World Bank unit; scaled values (value / div) carry the display unit, whose word (million, billion) matches div.
// Run: node scripts/test-explore.js (part of npm run validate and npm run build).
const nat = require('../data/national.json');
const { natIndicators, DATASETS, trendSeries } = require('../lib/explore');
const errors = [];
const fail = (m) => errors.push(m);
const trends = trendSeries();
natIndicators.forEach((x) => {
  const raw = nat.indicators.find((i) => i.code === x.code);
  if (x.unit !== raw.unit) fail(`${x.code}: raw unit changed to "${x.unit}"`);
  const want = /\bbillion\b/.test(x.dispUnit) ? 1e9 : /\bmillion\b/.test(x.dispUnit) ? 1e6 : 1;
  if (x.div !== want) fail(`${x.code}: display unit "${x.dispUnit}" needs div ${want}, has ${x.div}`);
  const ds = DATASETS.find((d) => d.id === `kenya-${x.slug}`);
  if (ds) ds.rows().forEach((r) => {
    if (r.unit !== raw.unit) fail(`${x.code} download ${r.year}: unit "${r.unit}" is not the World Bank unit "${raw.unit}"`);
    const p = raw.series.find((q) => q.year === r.year);
    if (r.value !== p.value) fail(`${x.code} download ${r.year}: value ${r.value} is not the raw ${p.value}`);
  });
  const t = trends.find((s) => s.slug === x.slug);
  if (t) {
    if (t.unit !== x.dispUnit) fail(`${x.code} trend: unit "${t.unit}" is not the display unit "${x.dispUnit}"`);
    t.values.forEach((v, i) => { const p = raw.series[i]; if ((v === null) !== (p.value === null) || (v !== null && Math.abs(v * x.div - p.value) > 1e-6 * Math.abs(p.value))) fail(`${x.code} trend ${p.year}: ${v} ${t.unit} does not equal ${p.value} / ${x.div}`); });
  }
});
// Plausibility of the scaled figures (Kenya, 2010 to 2025).
const range = (slug, lo, hi) => { const t = trends.find((s) => s.slug === slug); t.values.filter((v) => v !== null).forEach((v) => { if (v < lo || v > hi) fail(`${slug}: ${v} ${t.unit} is outside ${lo} to ${hi}`); }); };
range('population', 40, 60);
range('remittances', 0.5, 10);
range('gdp-per-person', 500, 5000);
// Every county value with a note in counties-cob.json keeps it in the compare output (screen and downloads):
// a published value keeps it as a caveat, a missing value as its reason. Notes on one value of a row and group
// (a reporting date) also reach the other values of that group.
const { cob, compareData } = require('../lib/explore');
const { dlRow, caveat, cellOf } = require('../lib/compare-rows');
const cd = compareData();
let noted = 0;
cob.years.forEach((y) => y.counties.forEach((row, idx) => cd.fields.forEach((f) => {
  const cell = row[f.key];
  if (!cell || !cell.note) return;
  noted += 1;
  const out = dlRow(cd, y.fy, f, idx);
  if (cell.value !== null && !out.note.includes(cell.note)) fail(`compare ${y.fy} ${row.name} ${f.key}: note "${cell.note}" missing from the download row`);
  if (cell.value === null && !out.note.startsWith('Not available')) fail(`compare ${y.fy} ${row.name} ${f.key}: missing value lost its reason`);
  if (cell.value !== null) cd.fields.filter((g) => g.group === f.group).forEach((g) => {
    const c = cellOf(cd, y.fy, g.key, idx);
    if (c.st === 'read' && !caveat(c).includes(cell.note)) fail(`compare ${y.fy} ${row.name} ${g.key}: row note "${cell.note}" not carried to this value`);
  });
})));
if (!noted) fail('compare: no notes found to test');
const nandi = dlRow(cd, '2023/24', cd.fields.find((f) => f.key === 'pb_grand_total'), cd.counties.findIndex((c) => c.slug === 'nandi'));
if (!/31 March 2024/.test(nandi.note)) fail('compare: Nandi FY 2023/24 pending bills lost the 31 March 2024 reporting date');

if (errors.length) { console.error('Explore unit tests failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`Explore unit tests passed (${natIndicators.length} national indicators, ${noted} noted county values).`);
