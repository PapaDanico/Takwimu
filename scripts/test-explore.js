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
range('external-debt-stocks', 5, 80);
range('external-debt-public', 5, 80);
range('external-debt-gni', 5, 80);
range('external-debt-service', 1, 60);
// External debt is never presented as total public debt.
natIndicators.filter((x) => /^DT\./.test(x.code)).forEach((x) => {
  if (!/external/i.test(x.name) && !/external/i.test(x.short)) fail(`${x.code}: name must say external`);
  if (!/not total public debt|Domestic debt service is not included/.test(x.note || '')) fail(`${x.code}: note must say it is not total public debt`);
  if (x.sector !== 'public finance') fail(`${x.code}: sector should be public finance`);
});
if (natIndicators.find((x) => x.code === 'GC.DOD.TOTL.GD.ZS').hasValues) fail('central government debt now has values: review the gap note');
if (!nat.meta.gaps.some((g) => /not total or central government debt/.test(g))) fail('national gaps must say external debt is not total public debt');
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
  if (cell.value === null && !/^(Not available|Not yet verified)/.test(out.note)) fail(`compare ${y.fy} ${row.name} ${f.key}: missing value lost its reason`);
  if (cell.value !== null) cd.fields.filter((g) => g.group === f.group).forEach((g) => {
    const c = cellOf(cd, y.fy, g.key, idx);
    if (c.st === 'read' && !caveat(c).includes(cell.note)) fail(`compare ${y.fy} ${row.name} ${g.key}: row note "${cell.note}" not carried to this value`);
  });
})));
if (!noted) fail('compare: no notes found to test');
const nandi = dlRow(cd, '2023/24', cd.fields.find((f) => f.key === 'pb_grand_total'), cd.counties.findIndex((c) => c.slug === 'nandi'));
if (!/31 March 2024/.test(nandi.note)) fail('compare: Nandi FY 2023/24 pending bills lost the 31 March 2024 reporting date');

// Cells the two-method OCR re-read could not confirm (lib/unverified.js) show as "Not yet verified" with the reason
// everywhere: compare list, table and side-by-side cells, dataset downloads (CSV and JSON rows) and stories.
// The source readings stay in the data file; only the presentation changes.
const { UNVERIFIED, isUnverifiedCell } = require('../lib/unverified');
const { naText } = require('../lib/compare-rows');
const { cobRows, cobTotal } = require('../lib/explore');
const { toCSV } = require('../lib/csv');
const found = [];
cob.years.forEach((y) => [...y.counties, y.total_row].forEach((row) => Object.entries(row).forEach(([k, c]) => { if (isUnverifiedCell(c)) found.push(`${y.fy}|${row.name}|${k}`); })));
const listed = UNVERIFIED.map((u) => `${u.fy}|${u.county}|${u.key}`);
if (listed.length !== 7) fail(`unverified: expected the seven cells named on 21 Nov 2026, list has ${listed.length}`);
if (found.sort().join() !== [...listed].sort().join()) fail(`unverified: data marks ${found.join(', ')}; list has ${listed.join(', ')}`);
const dsRows = Object.fromEntries(DATASETS.filter((d) => d.rows && d.id.startsWith('counties-')).map((d) => [d.id, d.rows()]));
UNVERIFIED.forEach((u) => {
  const y = cob.years.find((x) => x.fy === u.fy);
  const isTotal = u.county === 'Total (as printed)';
  const stored = isTotal ? y.total_row[u.key] : y.counties.find((r) => r.name === u.county)[u.key];
  const tag = `unverified ${u.fy} ${u.county} ${u.key}`;
  if (!stored || stored.value !== null || !stored.raw || !stored.reread) fail(`${tag}: source reading or re-read missing from the data file`);
  const cell = isTotal ? cobTotal(u.fy, u.key) : cobRows(u.fy, u.key).find((r) => r.name === u.county);
  if (cell.status !== 'unverified' || cell.value !== null) fail(`${tag}: lib/explore.js status is "${cell.status}"`);
  const idx = isTotal ? 'total' : cd.counties.findIndex((c) => c.name === u.county);
  const c = cellOf(cd, u.fy, u.key, idx);
  if (c.st !== 'unverified' || c.value !== null || c.raw) fail(`${tag}: compare cell is "${c.st}" or shows the raw reading`);
  if (!naText(c).startsWith('Not yet verified: ') || naText(c).length < 40) fail(`${tag}: compare text lacks "Not yet verified" with the reason`);
  if (!isTotal) {
    const out = dlRow(cd, u.fy, cd.fields.find((f) => f.key === u.key), idx);
    if (out.status !== 'not yet verified' || out.value !== null || out.raw_reading || !out.note.startsWith('Not yet verified: ')) fail(`${tag}: compare download row is not marked not yet verified`);
  }
  const rows = Object.values(dsRows).flat().filter((r) => r.fiscal_year === u.fy && r.county === u.county && r.measure === u.key);
  if (rows.length !== 1) fail(`${tag}: expected one dataset row, found ${rows.length}`);
  rows.forEach((r) => {
    if (r.status !== 'not yet verified' || r.value !== null || r.raw_reading || !r.note.startsWith('Not yet verified: ')) fail(`${tag}: dataset row is not marked not yet verified`);
    const line = toCSV([r]).split('\n')[1];
    if (!/"not yet verified"/.test(line) || /^"[^"]*","[^"]*","[^"]*","[^"]*","[^"]*","\d/.test(line)) fail(`${tag}: CSV line shows a number or lacks the status`);
  });
});

// Dataset status and version stamp (lib/dataset-status.js): every dataset has a status from the vocabulary and the
// short content hash of its data file; every open register case reaches at least one dataset; spot checks of the rules.
{
  const crypto = require('crypto'); const fsx = require('fs'); const pathx = require('path');
  const { STATUSES, CASE_DATASETS } = require('../lib/dataset-status');
  const reg = require('../data/conflicts.json');
  if (STATUSES.join() !== 'unavailable,superseded,disputed,estimated,provisional,verified') fail(`status vocabulary changed: ${STATUSES.join()}`);
  DATASETS.forEach((d) => {
    if (!STATUSES.includes(d.status) || !d.status_reason) fail(`dataset ${d.id}: status "${d.status}" or its reason missing`);
    const want = crypto.createHash('sha256').update(fsx.readFileSync(pathx.join(__dirname, '..', d.data_file))).digest('hex').slice(0, 10);
    if (d.version !== want) fail(`dataset ${d.id}: version ${d.version} is not the content hash of ${d.data_file} (${want})`);
    if (d.download_name !== `${d.id}-${d.version}`) fail(`dataset ${d.id}: download name does not carry the version`);
  });
  Object.keys(CASE_DATASETS).forEach((id) => { if (!reg.conflicts.some((c) => c.id === id)) fail(`dataset status: case ${id} is not in the register`); });
  reg.conflicts.filter((c) => c.status === 'open').forEach((c) => { if (!DATASETS.some((d) => d.status === 'disputed' && d.status_reason.includes(c.id) && d.id !== 'source-conflicts')) fail(`dataset status: open case ${c.id} marks no dataset as disputed`); });
  const st = (id) => (DATASETS.find((d) => d.id === id) || {}).status;
  [['kenya-gdp-growth', 'verified'], ['kenya-unemployment', 'estimated'], ['kenya-deposit-rate-wb', 'disputed'], ['counties-absorption', 'disputed'], ['kenya-derived-measures', 'provisional'], ['cra-county-allocations-2026-27', 'provisional'], ['iebc-registered-voters-2022', 'disputed']].forEach(([id, want]) => { if (st(id) !== want) fail(`dataset status: ${id} is "${st(id)}", expected "${want}"`); });
  if (!/not yet verified/.test(DATASETS.find((d) => d.id === 'counties-absorption').status_reason)) fail('dataset status: counties-absorption reason must name the cells not yet verified');
}

// Siaya Fiscal Pulse (lib/pulse.js): three insights whose figures equal history.json, carry a page and a source PDF,
// hold as worded, and are not the subject of an open conflict register case.
{
  const { insights } = require('../lib/pulse');
  const hist = require('../data/history.json');
  const regp = require('../data/conflicts.json');
  const p = insights();
  if (p.items.length !== 3) fail(`pulse: expected three insights, found ${p.items.length}`);
  p.items.forEach((it) => {
    if (it.holds === false) fail(`pulse ${it.id}: the wording no longer holds for the data`);
    it.figures.forEach((f) => {
      const y = hist.years.find((x) => x.fy === f.fy);
      if (y[f.key] !== f.value) fail(`pulse ${it.id}: ${f.key} FY ${f.fy} ${f.value} is not history.json ${y[f.key]}`);
      if (!f.page || !/^https:\/\//.test(f.pdf_url) || !f.confidence || f.unit !== 'KSh billion' || !f.period) fail(`pulse ${it.id}: FY ${f.fy} ${f.key} lacks page, PDF link, confidence, unit or period`);
      if ((y.derived || []).includes(f.key)) fail(`pulse ${it.id}: FY ${f.fy} ${f.key} is derived, not printed`);
      const fyTag = `FY ${f.fy}`;
      regp.conflicts.filter((c) => c.status === 'open' && c.measure.includes(fyTag) && /spending|expenditure/i.test(c.measure)).forEach((c) => fail(`pulse ${it.id}: open case ${c.id} concerns ${fyTag} spending`));
    });
  });
  if (p.chart.series.some((s) => s.values.length !== p.chart.labels.length)) fail('pulse: chart series and labels differ in length');
  p.gaps.forEach((fy) => { if (p.chart.series.some((s) => s.values[p.chart.labels.indexOf(`FY ${fy}`)] !== null)) fail(`pulse: gap FY ${fy} is filled in the chart`); });
}

if (errors.length) { console.error('Explore unit tests failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`Explore unit tests passed (${natIndicators.length} national indicators, ${noted} noted county values, ${UNVERIFIED.length} cells shown as not yet verified).`);
