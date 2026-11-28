// Recomputes every value on /counties/<slug>/analysis/ (lib/county-analysis.js) from the raw files, independently of
// the library's code path: the county fiscal ledger (Controller of Budget records only), the population file,
// data/cpi.json and data/counties-cob.json. Checks units, the gap rule (no CoB value or two different CoB values is a
// gap, never a choice), that no year is interpolated, that ranks count from the highest value, and that every result
// cites a page. Run: node scripts/test-county-analysis.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const counties = require('../lib/county-registry');
const ca = require('../lib/county-analysis');
const rs = require('../lib/review-status');

const ROOT = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const CPI = read('data/cpi.json');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks += 1; };

const slugs = counties.slugs().filter((s) => counties.state(s) === 'published' && counties.pages(s).includes('analysis'));
ok(slugs.length >= 1, 'at least one published county has an analysis page');

slugs.forEach((slug) => {
  const L = counties.load(slug, 'ledger');
  const P = counties.load(slug, 'population');
  const ksh = (o) => (o.unit === 'KSh billion' ? o.value * 1e9 : o.unit === 'KSh million' ? o.value * 1e6 : NaN);
  const cobRecs = (measure, fy) => L.observations.filter((o) => o.measure === measure && o.fy === fy && o.source_kind === 'controller_of_budget');

  // Spending per person.
  const pp = ca.perPerson(slug);
  ok(pp.rows.length === P.points.length, `${slug}: one per-person row per population point (none interpolated)`);
  pp.rows.forEach((r) => {
    const p = P.points.find((x) => `${x.year}/${String((x.year + 1) % 100).padStart(2, '0')}` === r.fy);
    ok(p && p.value === r.population, `${slug} FY ${r.fy}: population is the printed figure of calendar year ${r.fy.slice(0, 4)}`);
    const recs = cobRecs('expenditure_total', r.fy);
    const distinct = [...new Set(recs.map((o) => Math.round(ksh(o) / 1e6)))];
    if (distinct.length !== 1) { ok(Boolean(r.gap) && r.real == null, `${slug} FY ${r.fy}: ${distinct.length} CoB spending values must be a gap`); return; }
    ok(!r.gap, `${slug} FY ${r.fy}: one CoB value gives a result`);
    const real = Math.round((ksh(recs[0]) / p.value) * (CPI.fiscal_year[ca.CPI_BASE] / CPI.fiscal_year[r.fy]));
    ok(real === r.real, `${slug} FY ${r.fy}: real per person ${r.real} recomputes as ${real}`);
    ok(Math.round(ksh(recs[0]) / p.value) === r.nominal, `${slug} FY ${r.fy}: nominal per person recomputes`);
    ok(r.exp_rec.pdf_page && r.population_rec.pdf_page, `${slug} FY ${r.fy}: both inputs cite a page`);
    ok(r.real > 500 && r.real < 100000, `${slug} FY ${r.fy}: KSh per person in a plausible range (unit check)`);
    ok(r.confidence <= Math.min(recs[0].confidence, p.confidence), `${slug} FY ${r.fy}: result no more certain than its inputs`);
  });

  // Absorption: printed percentages, CoB only.
  ca.absorption(slug).forEach((r) => [['recurrent', 'absorption_recurrent_pct'], ['development', 'absorption_development_pct']].forEach(([k, m]) => {
    const vals = [...new Set(cobRecs(m, r.fy).map((o) => o.value))];
    if (vals.length === 1) ok(r[k].value === vals[0] && r[k].value >= 0 && r[k].value <= 150, `${slug} FY ${r.fy} ${k} absorption is the printed CoB percentage`);
    else ok(Boolean(r[k].gap), `${slug} FY ${r.fy} ${k} absorption: ${vals.length} CoB values is a gap`);
  }));

  // Among 47 counties.
  const C = rs.masked('counties-cob');
  const ac = ca.amongCounties(slug);
  ok(ac.measures.length === ca.PRINTED.length + ca.DERIVED.length, `${slug}: every comparison measure is built`);
  ac.measures.forEach((x) => x.years.forEach((y) => {
    const Y = C.years.find((z) => z.fy === y.fy);
    const me = Y.counties.find((r) => r.slug === slug);
    const val = (r) => {
      if (!x.derived) return r[x.key] && r[x.key].value != null ? r[x.key].value : null;
      const [, , num, den] = ca.DERIVED.find((d) => d[0] === x.key);
      return r[num] && r[den] && r[num].value != null && r[den].value ? Math.round((r[num].value / r[den].value) * 1000) / 10 : null;
    };
    const mine = val(me);
    ok((y.county ? y.county.value : null) === mine, `${slug} ${x.key} FY ${y.fy}: county value ${mine}`);
    ok((y.all ? y.all.value : null) === val(Y.total_row), `${slug} ${x.key} FY ${y.fy}: all-county value is the total row`);
    if (mine != null) {
      const higher = Y.counties.map(val).filter((v) => v != null && v > mine).length;
      ok(y.rank === higher + 1, `${slug} ${x.key} FY ${y.fy}: position ${y.rank} counts from the highest`);
      ok(y.ranked === Y.counties.map(val).filter((v) => v != null).length && y.ranked <= 47, `${slug} ${x.key} FY ${y.fy}: ranked among counties with a value`);
      ok(y.county.page, `${slug} ${x.key} FY ${y.fy}: cites a page`);
      ok(mine >= 0 && mine <= 200, `${slug} ${x.key} FY ${y.fy}: a percentage (unit check)`);
    } else ok(y.rank == null, `${slug} ${x.key} FY ${y.fy}: no value, no position`);
  }));
});

// The Siaya comparison is Siaya's own published calculation, masked.
ca.siayaPerPerson().forEach((r) => ok(/per person at FY 2024\/25 prices/.test(r.unit), `Siaya FY ${r.fy}: same unit as the county calculation`));

console.log(`test-county-analysis: ${checks} checks passed (${slugs.join(', ')})`);
