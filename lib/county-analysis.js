// Analysis for a registry county (lib/county-registry.js), worked out at build time from published data only:
//   - the county's fiscal ledger (Controller of Budget values only, the rule of components/county/CountyTrends.js: a
//     year with no CoB value, or with two CoB values that differ, is a gap, never filled or chosen);
//   - the county's population file (2019 census count and KNBS projections as printed; never interpolated);
//   - data/cpi.json (national CPI, fiscal-year index; base FY 2024/25, as for Siaya in scripts/build-siaya-analysis.js);
//   - data/counties-cob.json (47 counties, FY 2021/22 to 2024/25, one Controller of Budget table per year) read through
//     lib/review-status.js masked(), so a value rejected in review is removed and every measure using it is a gap;
//   - Siaya's published per-person calculation (data/siaya-analysis.json family A1, also masked) for comparison.
// Nothing here is stored: every result keeps its inputs (dataset, record, source, page) so the page can cite them, and
// scripts/test-county-analysis.js recomputes every value from the files.
const rs = require('./review-status');
const cp = require('./county-pages');
const CPI = require('../data/cpi.json');

const CPI_BASE = '2024/25';
const round = (v, dp) => Math.round(v * 10 ** dp) / 10 ** dp;
const fyStart = (fy) => Number(fy.slice(0, 4));
const toKsh = (o) => (o.unit === 'KSh billion' ? o.value * 1e9 : o.unit === 'KSh million' ? o.value * 1e6 : null);

// What the page cites for one ledger value.
const recOf = (l, o) => ({ dataset: l.dataset, id: o.id, source: o.source, publisher: o.publisher, published: o.published, url: o.url, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, read: o.read, value: o.value, unit: o.unit, printed: o.printed, confidence: o.confidence, needs_page_check: o.needs_page_check, state_label: o.state_label });

// One Controller of Budget value for a measure and year, or a gap with its reason.
function cobValue(l, measure, fy) {
  const cob = l.kinds.findIndex((k) => k.key === 'controller_of_budget');
  const row = (l.values[measure] || []).find((r) => r.fy === fy);
  const recs = row && cob >= 0 ? row.byKind[cob].filter((o) => !(o.review && o.review.hide) && toKsh(o) != null) : [];
  const uniq = [...new Set(recs.map((o) => Math.round(toKsh(o) / 1e6)))];
  if (!recs.length) return { gap: `no Controller of Budget value for FY ${fy} is held (other publishers' values, if any, are on the ledger)` };
  if (uniq.length > 1) return { gap: `the Controller of Budget prints ${uniq.length} different values for FY ${fy}; none is chosen` };
  const o = recs[0];
  return { value: toKsh(o), rec: recOf(l, o) };
}

// Real county spending per person at FY 2024/25 prices, for each fiscal year that starts in a year the population file
// covers (the population of calendar year Y is matched to the fiscal year that starts in Y, as for Siaya).
function perPerson(slug) {
  const l = cp.ledger(slug);
  const P = cp.people(slug);
  const pts = P.points.filter((p) => !(p.review && p.review.hide));
  const rows = pts.map((p) => {
    const fy = `${p.year}/${String((p.year + 1) % 100).padStart(2, '0')}`;
    const exp = cobValue(l, 'expenditure_total', fy);
    const base = { fy, population: p.value, population_kind: p.kind, population_rec: { dataset: P.dataset, id: p.id, source_id: p.source.source_id, source: p.src_title, url: p.src_url, published: p.published, table: p.source.table, pdf_page: p.source.pdf_page, printed_page: p.source.printed_page, read: p.read, confidence: p.confidence, state_label: p.state_label } };
    if (exp.gap) return { ...base, gap: `Spending: ${exp.gap}.` };
    if (!(fy in CPI.fiscal_year)) return { ...base, gap: `data/cpi.json has no fiscal-year index for FY ${fy}.` };
    const nominal = round(exp.value / p.value, 0);
    const real = round((exp.value / p.value) * (CPI.fiscal_year[CPI_BASE] / CPI.fiscal_year[fy]), 0);
    return { ...base, expenditure: exp.value, exp_rec: exp.rec, cpi: CPI.fiscal_year[fy], nominal, real, confidence: Math.min(exp.rec.confidence, p.confidence, CPI.meta.confidence) };
  });
  return { rows, cpiBase: CPI_BASE, cpiBaseValue: CPI.fiscal_year[CPI_BASE], cpiMethod: CPI.meta.method, cpiSource: CPI.meta.source, cpiUrl: CPI.meta.source_url };
}

// Siaya's published values of the same measure (data/siaya-analysis.json, family A1), masked.
function siayaPerPerson() {
  const SA = rs.masked('siaya-analysis');
  return SA.records.filter((r) => r.family === 'A1' && r.status === 'value' && r.result != null).map((r) => ({ fy: r.period.replace(/^FY /, ''), real: r.result, title: r.title, source_ids: r.source_ids, unit: r.unit }));
}

// The 47-county Controller of Budget table: measures that need no population, for the county, Siaya and all counties.
const PRINTED = [
  ['overall_absorption_pct', 'Share of the budget spent (overall absorption)', '%'],
  ['development_absorption_pct', 'Share of the development budget spent', '%'],
  ['osr_performance_pct', 'Own-source revenue collected against target', '%'],
];
const DERIVED = [
  ['development_share_pct', 'Development spending as a share of all spending', 'development_expenditure', 'expenditure_total'],
  ['pending_bills_pct', 'Pending bills at year end as a share of the year’s spending', 'pb_grand_total', 'expenditure_total'],
];
function amongCounties(slug) {
  const C = rs.masked('counties-cob');
  const years = [...C.years].sort((a, b) => a.fy.localeCompare(b.fy));
  const cell = (row, key) => (row && row[key] && row[key].value != null ? row[key] : null);
  const measures = [];
  PRINTED.forEach(([key, title, unit]) => measures.push({ key, title, unit, derived: false, years: years.map((y) => {
    const of = (r) => { const c = cell(r, key); return c ? { value: c.value, page: c.pdf_page, printed_page: c.printed_page, table: c.table, read: c.read } : null; };
    const me = y.counties.find((r) => r.slug === slug);
    const vals = y.counties.map((r) => ({ slug: r.slug, v: of(r) })).filter((x) => x.v);
    const rank = of(me) ? 1 + vals.filter((x) => x.v.value > of(me).value).length : null;
    return { fy: y.fy, source_id: y.source_id, source: y.source, county: of(me), siaya: of(y.counties.find((r) => r.slug === 'siaya')), all: of(y.total_row), rank, ranked: vals.length };
  }) }));
  DERIVED.forEach(([key, title, num, den]) => measures.push({ key, title, unit: '%', derived: true, formula: `${num} ÷ ${den} × 100`, years: years.map((y) => {
    const of = (r) => { const a = cell(r, num); const b = cell(r, den); return a && b && b.value ? { value: round((a.value / b.value) * 100, 1), num: a.value, den: b.value, page: a.pdf_page, den_page: b.pdf_page, table: a.table, den_table: b.table } : null; };
    const me = y.counties.find((r) => r.slug === slug);
    const vals = y.counties.map((r) => ({ slug: r.slug, v: of(r) })).filter((x) => x.v);
    const rank = of(me) ? 1 + vals.filter((x) => x.v.value > of(me).value).length : null;
    return { fy: y.fy, source_id: y.source_id, source: y.source, county: of(me), siaya: of(y.counties.find((r) => r.slug === 'siaya')), all: of(y.total_row), rank, ranked: vals.length };
  }) }));
  return { years: years.map((y) => y.fy), measures, reading: years.map((y) => ({ fy: y.fy, method: y.reading_method, source: y.source })) };
}

// Absorption by fiscal year from the county's ledger (CoB only), printed percentages; a gap keeps its reason.
function absorption(slug) {
  const l = cp.ledger(slug);
  const cob = l.kinds.findIndex((k) => k.key === 'controller_of_budget');
  const one = (measure, fy) => {
    const row = (l.values[measure] || []).find((r) => r.fy === fy);
    const recs = row && cob >= 0 ? row.byKind[cob].filter((o) => !(o.review && o.review.hide) && o.value != null) : [];
    const uniq = [...new Set(recs.map((o) => o.value))];
    if (!recs.length) return { gap: 'no Controller of Budget value' };
    if (uniq.length > 1) return { gap: `${uniq.length} different Controller of Budget values` };
    return { value: recs[0].value, rec: recOf(l, recs[0]) };
  };
  return l.years.map((fy) => ({ fy, recurrent: one('absorption_recurrent_pct', fy), development: one('absorption_development_pct', fy) }));
}

module.exports = { perPerson, siayaPerPerson, amongCounties, absorption, cobValue, CPI_BASE, PRINTED, DERIVED };
