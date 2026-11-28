#!/usr/bin/env node
// Builds data/siaya-analysis.json: Siaya analytical measures calculated by Takwimu Kenya from figures already in the
// repository (no new readings). Seven families (owner handover WP1 Analysis, WP3, WP5; reconciliation cases R-002,
// R-003, R-005):
//   A1 real per-capita county expenditure     A2 transfer dependency      A3 execution (absorption) rates
//   A4 pending bills: stocks and changes      A5 audit recurrence         A6 budget beside service (context only)
//   A7 climate financing beside PCRA risk  A8 own-source revenue composition: ordinary OSR and health FIF/A-i-A
// Rules: numerator and denominator always come from the same source document; values are never averaged across
// sources; a missing or non-comparable input gives a gap record with its reason, never a filled value. Output is
// deterministic (no clock, sorted keys), so a re-run must reproduce the committed file byte for byte.
// Run: node scripts/build-siaya-analysis.js            (writes data/siaya-analysis.json)
//      node scripts/build-siaya-analysis.js --stdout   (prints the JSON, writes nothing; used by the test)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const INPUT_FILES = [
  'data/siaya-fiscal-ledger.json', 'data/history.json', 'data/cpi.json', 'data/county.json', 'data/counties-cob.json',
  'data/siaya-audits.json', 'data/siaya-health.json', 'data/siaya-education.json', 'data/siaya-climate.json',
  'data/siaya-economy.json', 'data/siaya-agriculture.json',
];
const raw = Object.fromEntries(INPUT_FILES.map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]));
const load = (f) => JSON.parse(raw[f]);
const L = load('data/siaya-fiscal-ledger.json');
const H = load('data/history.json');
const CPI = load('data/cpi.json');
const CTY = load('data/county.json');
const COB = load('data/counties-cob.json');
const AUD = load('data/siaya-audits.json');
const HEA = load('data/siaya-health.json');
const EDU = load('data/siaya-education.json');
const CLI = load('data/siaya-climate.json');

const LABEL = 'Calculated by Takwimu Kenya from published figures';
const CPI_BASE = '2024/25';
const round = (x, dp) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
const toMillion = (v, unit) => {
  if (unit === 'KSh million') return v;
  if (unit === 'KSh billion') return v * 1000;
  if (unit === 'KSh') return v / 1e6;
  throw new Error(`unknown money unit ${unit}`);
};
const slug = (s) => String(s).replace(/\//g, '-').replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const fyEndDate = (fy) => `${Number(fy.slice(0, 4)) + 1}-06-30`;
const fyStart = (fy) => Number(fy.slice(0, 4));
const minConf = (inputs) => { const c = inputs.map((i) => i.confidence).filter((x) => typeof x === 'number'); return c.length ? Math.min(...c) : null; };

// ---------- input builders: every input names its dataset, record path, field, value, unit, source and page ----------
const obsById = Object.fromEntries(L.observations.map((o) => [o.id, o]));
function ledgerIn(id, role) {
  const o = obsById[id];
  if (!o) throw new Error(`ledger observation ${id} not found`);
  const s = L.sources[o.source_id] || {};
  return {
    role, dataset: 'data/siaya-fiscal-ledger.json', record: `observations[id=${id}]`, field: 'value', value: o.value, unit: o.unit,
    measure: o.measure, period: `FY ${o.fy}`, source_id: o.source_id, source_kind: o.source_kind, source_title: s.title || null,
    source_publication_date: s.publication_date || null, table: o.table || null, pdf_page: o.pdf_page, printed_page: o.printed_page ?? null,
    basis: o.basis || null, scope: o.scope || null, confidence: o.confidence,
  };
}
function historyYearIn(fy, field, role) {
  const y = H.years.find((r) => r.fy === fy);
  const p = (y.provenance || {})[field] || {};
  const repKey = p.source_id ? p.source_id.replace('cob-report-', '').replace('-', '/') : null;
  const r = repKey ? H.reports[repKey] : null;
  return {
    role, dataset: 'data/history.json', record: `years[fy=${fy}]`, field, value: y[field], unit: '%', measure: field, period: `FY ${fy}`,
    source_id: p.source_id || null, source_kind: 'controller_of_budget', source_title: r ? r.title : null, source_publication_date: null,
    table: null, pdf_page: p.page ?? null, printed_page: p.printed_page ?? null, basis: 'as printed in the county chapter', scope: null,
    confidence: r ? r.confidence : null,
  };
}
function cobIn(fy, field, role) {
  const y = COB.years.find((r) => r.fy === fy);
  const c = y.counties.find((r) => r.code === 41);
  const f = c[field];
  return {
    role, dataset: 'data/counties-cob.json', record: `years[fy=${fy}].counties[code=41].${field}`, field: 'value', value: f.value, unit: f.unit,
    measure: field, period: `FY ${fy}`, source_id: y.source_id, source_kind: 'controller_of_budget', source_title: y.source.title,
    source_publication_date: null, table: f.table, pdf_page: f.pdf_page, printed_page: f.printed_page ?? null, basis: 'as printed in the cross-county table',
    scope: 'county government (executive and assembly)', confidence: 3,
  };
}
function cobIn2(fy, code, field, role) {
  const y = COB.years.find((r) => r.fy === fy);
  const c = y.counties.find((r) => r.code === code);
  const f = c[field];
  return {
    role, county_code: code, county: c.name, dataset: 'data/counties-cob.json', record: `years[fy=${fy}].counties[code=${code}].${field}`, field: 'value', value: f.value, unit: f.unit,
    measure: field, period: `FY ${fy}`, source_id: y.source_id, source_kind: 'controller_of_budget', source_title: y.source.title,
    source_publication_date: null, table: f.table, pdf_page: f.pdf_page, printed_page: f.printed_page ?? null, basis: 'as printed in the cross-county table',
    scope: `${c.name} county government`, confidence: 3,
  };
}
function cpiIn(fy, role) {
  return {
    role, dataset: 'data/cpi.json', record: 'fiscal_year', field: fy, value: CPI.fiscal_year[fy], unit: 'index (2010 = 100)', measure: 'cpi_fiscal_year',
    period: `FY ${fy}`, source_id: 'WDI FP.CPI.TOTL', source_kind: 'world_bank', source_title: CPI.meta.source, source_publication_date: null,
    table: null, pdf_page: null, printed_page: null, page_note: 'online database: no page', basis: CPI.meta.method, scope: 'Kenya (national index)',
    confidence: CPI.meta.confidence,
  };
}
const POPULATION = [
  { year: 2015, kind: 'projection', input: () => histPopIn(2015) },
  { year: 2017, kind: 'projection', input: () => histPopIn(2017) },
  { year: 2019, kind: 'census', input: () => countyPopIn('census_2019', 'census') },
  { year: 2022, kind: 'projection', input: () => countyPopIn('projection_2022', 'projection') },
];
function histPopIn(year) {
  const p = H.population.points.find((r) => r.year === year);
  return {
    role: 'population', dataset: 'data/history.json', record: `population.points[year=${year}]`, field: 'value', value: p.value, unit: 'persons',
    measure: `population_${p.kind}`, population_kind: p.kind, period: String(year), source_id: 'county-ADP (as cited in history.json)', source_kind: 'county',
    source_title: p.document || p.source || 'Projection as reproduced in Siaya County Annual Development Plans 2015/16 and 2018/19 (history.json population)',
    source_publication_date: null, table: null, pdf_page: p.pdf_page ?? null, printed_page: p.printed_page ?? null, ...(p.pdf_page ? {} : { page_note: 'page not recorded in history.json' }),
    basis: p.note || null, scope: 'Siaya County', confidence: p.confidence,
  };
}
function countyPopIn(field, kind) {
  return {
    role: 'population', dataset: 'data/county.json', record: 'population', field, value: CTY.population[field], unit: 'persons',
    measure: `population_${kind}`, population_kind: kind, period: field.slice(-4), source_id: 'GOV-01 (CIDP 2023-2027)', source_kind: 'county',
    source_title: CTY.source, source_publication_date: null, table: null,
    ...((CTY.population.pages || {})[field] ? { pdf_page: CTY.population.pages[field].pdf_page, printed_page: CTY.population.pages[field].printed_page } : { pdf_page: null, printed_page: null, page_note: 'page not recorded in county.json' }), basis: kind === 'census' ? 'KNBS 2019 census count as reproduced in the CIDP' : 'Projection as printed in the CIDP',
    scope: 'Siaya County', confidence: CTY.confidence,
  };
}
const audDoc = Object.fromEntries(AUD.documents.map((d) => [d.doc_id, d]));
function findingIn(f, field, sub, role) {
  const d = audDoc[f.doc_id] || {};
  return {
    role, dataset: 'data/siaya-audits.json', record: sub ? `findings[id=${f.id}].${sub}` : `findings[id=${f.id}]`, field, value: sub ? f[sub][field] : f[field],
    unit: field === 'category' || field === 'same_item' ? 'label' : 'flag', measure: `audit_finding_${field}`, period: `FY ${f.fy}`, source_id: f.doc_id,
    source_kind: 'auditor_general', source_title: d.title || null, source_publication_date: d.report_date || null, table: f.section, pdf_page: f.page,
    printed_page: null, basis: `paragraph ${f.paragraph}`, scope: f.entity, confidence: d.confidence ?? null,
  };
}
const eduSrc = Object.fromEntries(EDU.sources.map((s) => [s.source_id, s]));
function eduIn(id, role) {
  const o = EDU.observations.find((r) => r.id === id);
  const s = eduSrc[o.source_id] || {};
  return {
    role, dataset: 'data/siaya-education.json', record: `observations[id=${id}]`, field: 'value', value: o.value, unit: o.unit, measure: o.indicator,
    period: o.period, source_id: o.source_id, source_kind: s.publisher || null, source_title: s.title || null, source_publication_date: s.publication_date || null,
    table: o.table || null, pdf_page: o.pdf_page, printed_page: o.printed_page ?? null, basis: o.value_type || null, scope: o.function || null, confidence: o.confidence,
  };
}
const cliSrc = Object.fromEntries(CLI.sources.map((s) => [s.id, s]));
function climateIn(id, role, field = 'value') {
  const o = CLI.observations.find((r) => r.id === id);
  const s = cliSrc[o.source_id] || {};
  return {
    role, dataset: 'data/siaya-climate.json', record: `observations[id=${id}]`, field, value: o[field], unit: field === 'value' ? o.unit : 'label',
    measure: o.measure, kind: o.kind, period: o.period, source_id: o.source_id, source_kind: s.publisher || null, source_title: s.title || null,
    source_publication_date: s.publication_date || null, table: o.table || null, pdf_page: o.pdf_page, printed_page: o.printed_page ?? null,
    basis: o.definition || null, scope: o.geography, confidence: o.confidence,
  };
}

// ---------- record helpers ----------
const records = [];
function push(rec) {
  const base = {
    calc_id: rec.calc_id, family: rec.family, status: rec.status, title: rec.title, formula: rec.formula, calc: rec.calc || null,
    inputs: rec.inputs || [], beside: rec.beside || [], result: rec.status === 'value' ? rec.result : null, unit: rec.unit, period: rec.period,
    source_ids: [...new Set((rec.inputs || []).map((i) => i.source_id).filter(Boolean))].sort(),
    comparability_notes: rec.comparability_notes || [], caveat: rec.caveat, flags: rec.flags || {}, checks: rec.checks || [],
    gap_reason: rec.status === 'gap' ? rec.gap_reason : null, confidence: minConf(rec.inputs || []), label: LABEL,
  };
  if (records.some((r) => r.calc_id === base.calc_id)) throw new Error(`duplicate calc_id ${base.calc_id}`);
  records.push(base);
}
// The independent evaluator the test re-implements: linear (sum of coefficient x value in to_unit), ratio_pct, real_per_capita,
// count, count_distinct.
function evaluate(calc, inputs) {
  const v = (i) => (calc.to_unit === 'KSh million' ? toMillion(i.value, i.unit) : i.value);
  const sumRoles = (roles) => inputs.filter((i) => roles.includes(i.role)).reduce((a, i) => a + v(i), 0);
  if (calc.op === 'linear') return round(inputs.reduce((a, i) => a + (calc.coefficients[i.role] || 0) * v(i), 0), calc.dp);
  if (calc.op === 'ratio_pct') return round((100 * sumRoles(calc.numerator_roles)) / sumRoles(calc.denominator_roles), calc.dp);
  if (calc.op === 'real_per_capita') {
    const g = (r) => inputs.find((i) => i.role === r);
    return round(((toMillion(g('expenditure').value, g('expenditure').unit) * 1e6) / g('population').value) * (g('cpi_base').value / g('cpi_period').value), calc.dp);
  }
  if (calc.op === 'share_rank') return shareTable(inputs).findIndex((r) => r.code === calc.target_code) + 1;
  if (calc.op === 'count') return inputs.filter((i) => i.role === 'item' && i.value === calc.match).length;
  if (calc.op === 'count_distinct') return new Set(inputs.filter((i) => i.role === 'item').map((i) => i.value)).size;
  throw new Error(`unknown op ${calc.op}`);
}

// A8 47-county table: FIF/A-i-A share of total own-source revenue for each county code, highest first (ties by code).
function shareTable(inputs) {
  const by = {};
  inputs.forEach((i) => { by[i.county_code] = by[i.county_code] || {}; by[i.county_code][i.role] = i.value; });
  return Object.entries(by).map(([code, v]) => ({ code: Number(code), share: round((100 * v.fif) / v.total, 2) })).sort((a, b) => b.share - a.share || a.code - b.code);
}

// Pick one reading among several from the SAME source document for the same measure and year. Readings that agree
// within 1% are the same figure at different rounding: the most precise is used and the others are listed. Readings
// that differ by more than 1% are a within-document conflict: no value is chosen.
function pickSameSource(ids) {
  if (!ids.length) return { none: true };
  const obs = ids.map((id) => obsById[id]);
  const m = obs.map((o) => toMillion(o.value, o.unit));
  const lo = Math.min(...m); const hi = Math.max(...m);
  if (lo > 0 && (hi - lo) / lo > 0.01) return { conflict: true, ids, values_ksh_m: m.map((x) => round(x, 2)) };
  const decimals = (o) => { const s = String(toMillion(o.value, o.unit)); return s.includes('.') ? s.split('.')[1].length : 0; };
  const sorted = [...obs].sort((a, b) => (Number(!!b.table) - Number(!!a.table)) || (decimals(b) - decimals(a)) || a.id.localeCompare(b.id));
  return { id: sorted[0].id, equivalents: sorted.slice(1).map((o) => o.id) };
}
const ledgerBy = (measure, fy, sid) => L.observations.filter((o) => o.measure === measure && o.fy === fy && (!sid || o.source_id === sid)).map((o) => o.id);
const sourcesFor = (measures, fy) => [...new Set(L.observations.filter((o) => measures.includes(o.measure) && o.fy === fy).map((o) => o.source_id))].sort();

// =====================================================================================================================
// A1. Real per-capita county expenditure (FY 2024/25 prices). Population: a census count and a projection are never
// mixed silently; each record names which it uses. A population figure for calendar year Y is matched only to the fiscal
// year that starts in July of Y (FY Y/Y+1); no other year is interpolated or extrapolated.
// =====================================================================================================================
L.years.forEach((fy) => {
  sourcesFor(['expenditure_total'], fy).forEach((sid) => {
    const key = `SIA-A1-${slug(fy)}-${slug(sid)}`;
    const pick = pickSameSource(ledgerBy('expenditure_total', fy, sid));
    const pop = POPULATION.find((p) => p.year === fyStart(fy));
    const title = `Real per-capita county expenditure, FY ${fy} (${sid})`;
    const common = { calc_id: key, family: 'A1', title, unit: `KSh per person at FY ${CPI_BASE} prices`, period: `FY ${fy}`,
      formula: `Total county expenditure (KSh) divided by population, multiplied by CPI(FY ${CPI_BASE}) / CPI(FY ${fy}).`,
      caveat: 'Deflated with the national CPI (World Bank WDI, fiscal-year average of two calendar years; approximate). Population is a single-year figure matched to the fiscal year that starts in that calendar year. Expenditure scope is as the source states it.' };
    if (pick.conflict) return push({ ...common, status: 'gap', gap_reason: `The same document gives different total expenditure figures for this year (${pick.ids.join(', ')}: ${pick.values_ksh_m.join(' vs ')} KSh million); no figure is chosen.` });
    const exp = ledgerIn(pick.id, 'expenditure');
    if (!pop) return push({ ...common, status: 'gap', inputs: [exp], gap_reason: `No population figure for calendar year ${fyStart(fy)} is held (held: census 2009 and 2019; projections 2012, 2015, 2017, 2022). The 2019 census count is not projected forward and no year is interpolated.` });
    if (!(fy in CPI.fiscal_year)) return push({ ...common, status: 'gap', inputs: [exp, pop.input()], gap_reason: `data/cpi.json has no fiscal-year index for FY ${fy}, so the value cannot be stated at FY ${CPI_BASE} prices.` });
    if (/not stated/.test(exp.scope || '')) return push({ ...common, status: 'gap', inputs: [exp], gap_reason: 'The source does not state whether this expenditure covers the County Executive only or the whole county government.' });
    const inputs = [exp, pop.input(), cpiIn(fy, 'cpi_period'), cpiIn(CPI_BASE, 'cpi_base')];
    const calc = { op: 'real_per_capita', dp: 0, population_kind: pop.kind, cpi_base_fy: CPI_BASE };
    const nominal = round((toMillion(exp.value, exp.unit) * 1e6) / pop.input().value, 0);
    push({ ...common, status: 'value', title: `${title}, ${pop.kind === 'census' ? 'census 2019 count' : `population projection for ${pop.year}`}`,
      inputs, calc, result: evaluate(calc, inputs),
      comparability_notes: [
        `Population is a ${pop.kind === 'census' ? 'census count (KNBS 2019, as reproduced in the CIDP)' : `projection for ${pop.year} as printed in a county plan`}; census-based and projection-based per-capita values are not the same kind of figure.`,
        `Nominal per-capita expenditure: KSh ${nominal} per person.`,
        pick.equivalents.length ? `Same figure at other rounding in the same document: ${pick.equivalents.join(', ')}.` : 'One reading in this document.',
        `Source kind: ${exp.source_kind}. Other sources for the same year are separate records and are not averaged.`,
      ],
      flags: { population_kind: pop.kind, source_kind: exp.source_kind } });
  });
});

// =====================================================================================================================
// A2. Transfer dependency. (equitable share received + conditional grants/additional allocations received) / (the same
// two + own-source revenue collected), all three from ONE source document for one fiscal year. The repository holds no
// printed "total revenue" for Siaya, so the denominator is the sum of the three published receipt streams; balances
// brought forward, loans and other receipts are not in it.
// =====================================================================================================================
const A2_MEASURES = { equitable_share_received: 'transfer', conditional_grants_received: 'transfer', osr_total_actual: 'own_source' };
L.years.forEach((fy) => {
  sourcesFor(Object.keys(A2_MEASURES), fy).forEach((sid) => {
    const key = `SIA-A2-${slug(fy)}-${slug(sid)}`;
    const common = { calc_id: key, family: 'A2', title: `Transfer dependency, FY ${fy} (${sid})`, unit: '% of the three published receipt streams', period: `FY ${fy}`,
      formula: '(Equitable share received + conditional grants or additional allocations received) divided by (equitable share received + conditional grants received + own-source revenue collected, including FIF/A-i-A where the source includes it), times 100. All three from the same document.',
      caveat: 'Not a share of total county revenue as printed: the denominator leaves out balances brought forward and any other receipts. Own-source revenue coverage of health facility revenue (FIF/A-i-A) changes between years and sources.' };
    const parts = {}; const missing = []; const conflicts = []; const eq = [];
    Object.keys(A2_MEASURES).forEach((m) => {
      const p = pickSameSource(ledgerBy(m, fy, sid));
      if (p.none) missing.push(m); else if (p.conflict) conflicts.push(`${m}: ${p.ids.join(', ')} (${p.values_ksh_m.join(' vs ')} KSh million)`); else { parts[m] = p.id; eq.push(...p.equivalents); }
    });
    const have = Object.values(parts).map((id) => ledgerIn(id, A2_MEASURES[obsById[id].measure]));
    if (conflicts.length) return push({ ...common, status: 'gap', inputs: have, gap_reason: `Within-document conflict, no value chosen: ${conflicts.join('; ')}.` });
    if (missing.length) return push({ ...common, status: 'gap', inputs: have, gap_reason: `This document does not give ${missing.join(', ')} for FY ${fy}. Components are never taken from another source to complete the ratio.` });
    const inputs = Object.keys(A2_MEASURES).map((m) => ledgerIn(parts[m], A2_MEASURES[m]));
    const calc = { op: 'ratio_pct', to_unit: 'KSh million', dp: 2, numerator_roles: ['transfer'], denominator_roles: ['transfer', 'own_source'] };
    const osr = inputs[2];
    push({ ...common, status: 'value', inputs, calc, result: evaluate(calc, inputs),
      comparability_notes: [
        `Source kind: ${inputs[0].source_kind}. Controller of Budget and county figures for the same year are separate records; they are never combined.`,
        `Own-source revenue basis as recorded: ${osr.basis || 'not stated'}.`,
        eq.length ? `Same figures at other rounding in the same document: ${eq.join(', ')}.` : 'One reading per component in this document.',
      ],
      flags: { source_kind: inputs[0].source_kind } });
  });
});

// =====================================================================================================================
// A3. Execution (absorption) rates: expenditure / budget x 100 for recurrent, development and total, computed only from
// a budget and an expenditure figure in the same document (so the same budget version and the same full fiscal year).
// Where a document gives two budget versions, each gets its own rate. Printed rates are shown beside the calculated rate;
// a difference of more than 1 percentage point is flagged.
// Revenue-side budget figures ("approved revenue estimates including balance brought forward") are not expenditure
// budgets and are not used as denominators.
// =====================================================================================================================
const PRINTED = {
  recurrent: [(fy, sid) => printedHist(fy, 'recurrent_absorption_pct', sid), (fy, sid) => printedCob(fy, 'recurrent_absorption_pct', sid)],
  development: [(fy, sid) => printedHist(fy, 'development_absorption_pct', sid), (fy, sid) => printedCob(fy, 'development_absorption_pct', sid)],
  total: [(fy, sid) => printedCob(fy, 'overall_absorption_pct', sid)],
};
function printedHist(fy, field, sid) {
  const y = H.years.find((r) => r.fy === fy);
  if (!y || typeof y[field] !== 'number') return null;
  const p = (y.provenance || {})[field];
  if (!p || p.source_id !== sid) return null;
  return historyYearIn(fy, field, 'printed_rate');
}
function printedCob(fy, field, sid) {
  const y = COB.years.find((r) => r.fy === fy);
  if (!y || y.source_id !== sid) return null;
  const c = y.counties.find((r) => r.code === 41);
  if (!c[field] || typeof c[field].value !== 'number') return null;
  return cobIn(fy, field, 'printed_rate');
}
const revenueSide = (id) => /^Approved revenue estimates/.test(obsById[id].basis || '');
L.years.forEach((fy) => {
  const sids = sourcesFor(['budget_total', 'budget_recurrent', 'budget_development', 'expenditure_total', 'expenditure_recurrent', 'expenditure_development'], fy);
  // CoB years where only printed rates exist (no budget held), e.g. FY 2013/14.
  H.years.filter((y) => y.fy === fy && typeof y.recurrent_absorption_pct === 'number').forEach((y) => {
    const sid = (y.provenance.recurrent_absorption_pct || {}).source_id;
    if (sid && !sids.includes(sid)) sids.push(sid);
  });
  sids.sort().forEach((sid) => {
    ['recurrent', 'development', 'total'].forEach((comp) => {
      const bIds = ledgerBy(`budget_${comp}`, fy, sid).filter((id) => !revenueSide(id));
      const eIds = ledgerBy(`expenditure_${comp}`, fy, sid);
      const printed = PRINTED[comp].map((f) => f(fy, sid)).filter(Boolean);
      if (!bIds.length && !eIds.length && !printed.length) return;
      const versions = [...new Set(bIds.map((id) => obsById[id].budget_version || 'not stated'))].sort();
      const base = `SIA-A3-${slug(fy)}-${slug(sid)}-${comp}`;
      const common = { family: 'A3', unit: '% of budget', period: `FY ${fy}`,
        formula: `${comp === 'total' ? 'Total' : comp[0].toUpperCase() + comp.slice(1)} expenditure divided by the ${comp} budget of the same version, times 100, both from the same document.`,
        caveat: 'Absorption shows spending against the budget; it says nothing about what the spending delivered. Rates from different documents use different budget versions and cut-off dates and are separate records.' };
      if (!versions.length) {
        return push({ ...common, calc_id: base, status: 'gap', title: `Execution rate, ${comp}, FY ${fy} (${sid})`, inputs: eIds.map((id) => ledgerIn(id, 'expenditure')), beside: printed,
          gap_reason: `No ${comp} expenditure-side budget is held from this document for FY ${fy}${bIds.length === 0 && ledgerBy(`budget_${comp}`, fy, sid).length ? ' (only revenue-side estimates including balances brought forward, which are not used as a denominator)' : ''}; the rate is not calculated${printed.length ? '. The printed rate is shown beside' : ''}.` });
      }
      versions.forEach((ver) => {
        const calcId = versions.length > 1 ? `${base}-${slug(ver)}` : base;
        const title = `Execution rate, ${comp}, FY ${fy} (${sid}${versions.length > 1 ? `, ${ver} budget` : ''})`;
        const vb = bIds.filter((id) => (obsById[id].budget_version || 'not stated') === ver);
        let bId; let eId; const notes = [];
        const sameTable = vb.flatMap((b) => eIds.filter((e) => obsById[e].table && obsById[e].table === obsById[b].table).map((e) => [b, e]));
        if (sameTable.length) {
          [bId, eId] = sameTable.sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]))[0];
          notes.push(`Budget and expenditure read from the same table (${obsById[bId].table}).`);
          const otherE = eIds.filter((e) => e !== eId);
          if (otherE.length) notes.push(`Other expenditure readings in the same document: ${otherE.map((e) => `${e} (${round(toMillion(obsById[e].value, obsById[e].unit), 2)} KSh million)`).join(', ')}.`);
        } else {
          const pb = pickSameSource(vb); const pe = pickSameSource(eIds);
          if (pe.none) return push({ ...common, calc_id: calcId, status: 'gap', title, inputs: [ledgerIn(pb.id || vb[0], 'budget')], beside: printed, gap_reason: `No ${comp} expenditure is held from this document for FY ${fy}.` });
          if (pb.conflict || pe.conflict) {
            const c = pb.conflict ? pb : pe;
            return push({ ...common, calc_id: calcId, status: 'gap', title, inputs: [], beside: printed, gap_reason: `Within-document conflict, no value chosen: ${c.ids.join(', ')} (${c.values_ksh_m.join(' vs ')} KSh million).` });
          }
          bId = pb.id; eId = pe.id;
          if (pb.equivalents.length || pe.equivalents.length) notes.push(`Same figures at other rounding in the same document: ${[...pb.equivalents, ...pe.equivalents].join(', ')}.`);
        }
        const inputs = [ledgerIn(eId, 'expenditure'), ledgerIn(bId, 'budget')];
        const scopes = inputs.map((i) => i.scope || 'not stated');
        if (scopes.some((s) => /^not stated/.test(s))) {
          return push({ ...common, calc_id: calcId, status: 'gap', title, inputs, beside: printed, gap_reason: `The document does not state the scope of one input (${scopes.join(' / ')}), so the budget and the expenditure may not cover the same entities.` });
        }
        const calc = { op: 'ratio_pct', to_unit: 'KSh million', dp: 2, numerator_roles: ['expenditure'], denominator_roles: ['budget'], budget_version: ver };
        const result = evaluate(calc, inputs);
        const checks = printed.map((p) => {
          const diff = round(result - p.value, 2);
          return { type: 'printed_rate', printed_value: p.value, printed_dataset: p.dataset, printed_record: p.record, printed_field: p.field, difference_points: diff, flag_gt_1_point: Math.abs(diff) > 1 };
        });
        const expNote = obsById[eId].basis ? [`Expenditure basis as recorded: ${obsById[eId].basis}.`] : [];
        push({ ...common, calc_id: calcId, status: 'value', title, inputs, beside: printed, calc, result, checks,
          comparability_notes: [`Budget version: ${ver}. Source kind: ${inputs[0].source_kind}.`, ...notes, ...expNote, printed.length ? 'Printed rate(s) shown beside; the printed rate is never replaced by the calculated one.' : 'No printed rate from this document is held in the repository.'],
          flags: { budget_version: ver, printed_mismatch_gt_1_point: checks.some((c) => c.flag_gt_1_point), source_kind: inputs[0].source_kind } });
      });
    });
  });
});

// =====================================================================================================================
// A4. Pending bills. (a) Every reported stock with its date and source. (b) Changes between two dates, only within one
// document or within one declared series (same publisher, same basis, same scope). (c) Roll-forward residual where a
// report publishes opening, new bills, payments and closing. Payments settle bills; they are not the same as a fall in
// total liabilities, because new bills are added in the same period.
// =====================================================================================================================
const PB_SETTLE = 'Payments settle individual bills; the stock can rise in the same year because new bills are added, and reported stocks depend on what each source counts (executive only or whole county, verified or unverified, with or without the year\'s new bills).';
L.observations.filter((o) => o.measure === 'pending_bills_close').sort((a, b) => a.fy.localeCompare(b.fy) || a.id.localeCompare(b.id)).forEach((o) => {
  const inputs = [ledgerIn(o.id, 'stock')];
  const calc = { op: 'linear', to_unit: 'KSh million', dp: 2, coefficients: { stock: 1 } };
  push({ calc_id: `SIA-A4-stock-${slug(o.fy)}-${o.id}`, family: 'A4', status: 'value', title: `Pending bills stock at ${fyEndDate(o.fy)} (${o.source_id}, ${o.id})`,
    formula: 'Reported stock as printed, converted to KSh million.', inputs, calc, result: evaluate(calc, inputs), unit: 'KSh million', period: `stock at ${fyEndDate(o.fy)}`,
    comparability_notes: [`Basis: ${o.basis || 'not stated'}.`, `Scope: ${o.scope || 'not stated'}.`, `Stock point: ${o.stock_point === 'opening_of_next_year' ? 'printed as the opening stock of the next year' : 'printed as the closing stock of the year'}.`],
    caveat: PB_SETTLE, flags: { source_kind: o.source_kind, stock_point: o.stock_point || null } });
});
// (b) declared pairs and series
const PB_SAME_DOC = [
  { key: 'cob-2021-22-table-3-251', open: 'L244', close: 'L245', note: 'Controller of Budget FY 2021/22 report, Table 3.251 columns A and E.' },
  { key: 'cob-2022-23-county-chapter', open: 'L246', close: 'L247', note: 'Controller of Budget FY 2022/23 county chapter (opening and closing in the same passage).' },
  { key: 'cob-2024-25-table-3-457', open: 'L250', close: 'L251', exclude: 'Table 3.457 leaves the column for bills incurred in FY 2024/25 blank, so its closing stock is the opening stock less payments. Closing minus opening equals minus the payments and is not a change in the total owed.' },
  { key: 'county-q4-2023-24', open: 'L270', close: 'L271', note: 'County Q4 FY 2023/24 report, section 2.3: closing includes new bills of the year.' },
  { key: 'county-q4-2024-25', open: 'L272', close: 'L273', exclude: 'The county Q4 FY 2024/25 report states its closing figure as opening stock less payments with no new bills added, so the difference only repeats the payments and is not a change in the total owed.' },
];
const PB_SERIES = [
  { key: 'cob-county-chapter-parts', ids: ['L239', 'L240', 'L241', 'L242', 'L243'], note: 'Controller of Budget annual county chapters: sum of the published recurrent and development parts, one report per year.' },
  { key: 'cob-cross-county-table', ids: ['L253', 'L254', 'L255', 'L256'], exclude_ids: { L255: 'The FY 2023/24 cross-county table excludes bills incurred in FY 2023/24 (the report says so), so it is not the full stock and is not compared with other dates.' }, note: 'Controller of Budget cross-county pending bills table, grand total (County Executive and County Assembly), one report per year.' },
  { key: 'audited-fs-management-statement', ids: ['L260', 'L261', 'L265', 'L268', 'L269'], note: 'County Executive management statement printed inside the audited financial statements (not an audit finding), one set of statements per year.' },
  { key: 'auditor-general-annex-total', ids: ['L262', 'L263', 'L266'], note: 'Auditor-General citing the pending bills annex of the County Executive financial statements.' },
];
function pbChange(key, a, b, note, excludeReason, seriesKey) {
  const oa = obsById[a]; const ob = obsById[b];
  const id = `SIA-A4-change-${key}-${slug(oa.fy)}-to-${slug(ob.fy)}`;
  const title = `Change in reported pending bills stock, ${fyEndDate(oa.fy)} to ${fyEndDate(ob.fy)} (${seriesKey ? `series ${key}` : `${oa.source_id}`})`;
  const inputs = [ledgerIn(a, 'earlier'), ledgerIn(b, 'later')];
  const common = { calc_id: id, family: 'A4', title, unit: 'KSh million', period: `${fyEndDate(oa.fy)} to ${fyEndDate(ob.fy)}`,
    formula: 'Later reported stock minus earlier reported stock, same document or same declared series (same publisher, basis and scope).', caveat: PB_SETTLE };
  if (excludeReason) return push({ ...common, status: 'gap', inputs, gap_reason: excludeReason });
  const yrs = fyStart(ob.fy) - fyStart(oa.fy);
  const calc = { op: 'linear', to_unit: 'KSh million', dp: 2, coefficients: { later: 1, earlier: -1 }, series: seriesKey ? key : null };
  push({ ...common, status: 'value', inputs, calc, result: evaluate(calc, inputs),
    comparability_notes: [note, yrs > 1 ? `Interval of ${yrs} years: no comparable stock is held for the year(s) between.` : 'Consecutive year ends.', 'A change in the stock is the net of new bills, payments and any write-offs or reclassifications; it is not the amount paid.'],
    flags: { source_kind: oa.source_kind, series: seriesKey ? key : null, same_document: oa.source_id === ob.source_id } });
}
PB_SAME_DOC.forEach((p) => pbChange(p.key, p.open, p.close, p.note, p.exclude, false));
PB_SERIES.forEach((s) => {
  const ids = [...s.ids].sort((x, y) => obsById[x].fy.localeCompare(obsById[y].fy));
  for (let i = 0; i + 1 < ids.length; i += 1) {
    const ex = (s.exclude_ids || {})[ids[i]] || (s.exclude_ids || {})[ids[i + 1]];
    pbChange(s.key, ids[i], ids[i + 1], s.note, ex, true);
  }
});
// (c) roll-forward residual from history.json pending_rollforward (Controller of Budget tables)
H.pending_rollforward.years.forEach((y) => {
  const terms = ['opening', 'new_bills', 'payments', 'closing'];
  const id = `SIA-A4-rollforward-${slug(y.fy)}`;
  const mk = (t) => ({ role: t, dataset: 'data/history.json', record: `pending_rollforward.years[fy=${y.fy}].${t}`, field: 'value', value: y[t].value, unit: 'KSh million',
    measure: `pending_bills_${t}`, period: `FY ${y.fy}`, source_id: y[t].source_id, source_kind: 'controller_of_budget', source_title: (H.reports[y.fy] || {}).title || null,
    source_publication_date: null, table: y[t].note || null, pdf_page: y[t].page ?? null, printed_page: y[t].printed_page ?? null, basis: y[t].note || null, scope: null,
    confidence: (H.reports[y.fy] || {}).confidence ?? null });
  const have = terms.filter((t) => typeof (y[t] || {}).value === 'number');
  const common = { calc_id: id, family: 'A4', title: `Pending bills roll-forward residual, FY ${y.fy} (${y.source_id || 'no report'})`, unit: 'KSh million', period: `FY ${y.fy}`,
    formula: 'Opening stock + new bills - payments - closing stock, all from one report. A non-zero residual is the part of the change the report does not explain (write-offs, reclassifications or inconsistent figures).',
    caveat: `${PB_SETTLE} Payments are shown as published; they are not a measure of the change in what the county owes.` };
  if (have.length < 4) {
    const miss = terms.filter((t) => !have.includes(t));
    return push({ ...common, status: 'gap', inputs: have.map(mk), gap_reason: `The report does not publish ${miss.join(', ')} for this year${y.new_bills && y.new_bills.note ? ` (${y.new_bills.note})` : ''}; the residual is not calculated and no term is filled.` });
  }
  const inputs = terms.map(mk);
  const calc = { op: 'linear', to_unit: 'KSh million', dp: 2, coefficients: { opening: 1, new_bills: 1, payments: -1, closing: -1 } };
  push({ ...common, status: 'value', inputs, calc, result: evaluate(calc, inputs),
    comparability_notes: ['All four terms from the same Controller of Budget report and table.', 'Adjustments or write-offs are not published in this table.'], flags: { source_kind: 'controller_of_budget' } });
});

// =====================================================================================================================
// A5. Audit recurrence (data/siaya-audits.json). Findings by category per entity and year (category assigned in the
// tracker); findings the report itself says date from an earlier year; findings the next year's report lists as
// unresolved; named items reported in more than one year.
// =====================================================================================================================
const ENT = AUD.meta.entities;
const entYears = [...new Set(AUD.findings.map((f) => `${f.entity}|${f.fy}`))].sort();
const AUD_CAVEAT = 'Findings are the auditor\'s findings, not legal conclusions. Counts depend on how each report splits paragraphs, so a change in a count is not by itself evidence of a change in practice. FY 2024/25 reports use transitional accrual IPSAS; earlier years are cash basis.';
entYears.forEach((ey) => {
  const [entity, fy] = ey.split('|');
  const fs_ = AUD.findings.filter((f) => f.entity === entity && f.fy === fy).sort((a, b) => a.id.localeCompare(b.id));
  [...new Set(fs_.map((f) => f.category))].sort().forEach((cat) => {
    const inputs = fs_.filter((f) => f.category === cat).map((f) => findingIn(f, 'category', null, 'item'));
    const calc = { op: 'count', match: cat };
    push({ calc_id: `SIA-A5-category-${slug(entity)}-${slug(fy)}-${slug(cat)}`, family: 'A5', status: 'value', title: `Audit findings in category "${cat}", ${ENT[entity]}, FY ${fy}`,
      formula: 'Number of findings in the tracker with this entity, year and category.', inputs, calc, result: evaluate(calc, inputs), unit: 'findings', period: `FY ${fy}`,
      comparability_notes: ['Categories are assigned by the Takwimu tracker from the report paragraph, not by the auditor.', `Reports read for this entity and year: ${[...new Set(fs_.map((f) => f.doc_id))].join(', ')}.`],
      caveat: AUD_CAVEAT, flags: { entity, fy, count_kind: 'category', category: cat } });
  });
  const prior = fs_.filter((f) => f.unresolved_prior_year.flag).map((f) => findingIn(f, 'flag', 'unresolved_prior_year', 'item'));
  const calcT = { op: 'count', match: true };
  push({ calc_id: `SIA-A5-stated-prior-year-${slug(entity)}-${slug(fy)}`, family: 'A5', status: 'value', title: `Findings the report states date from an earlier year, ${ENT[entity]}, FY ${fy}`,
    formula: 'Number of findings whose report says the matter dates from an earlier year (unresolved_prior_year.flag = true).', inputs: prior, calc: calcT, result: evaluate(calcT, prior),
    unit: 'findings', period: `FY ${fy}`, comparability_notes: [`Out of ${fs_.length} findings recorded for this entity and year.`, 'Zero means no report paragraph says so; it does not show that no matter was carried forward.'], caveat: AUD_CAVEAT, flags: { entity, fy, count_kind: 'stated_prior_year' } });
  const listed = fs_.filter((f) => f.listed_unresolved_next_year).map((f) => findingIn(f, 'listed_unresolved_next_year', null, 'item'));
  const listedCommon = { calc_id: `SIA-A5-listed-unresolved-next-year-${slug(entity)}-${slug(fy)}`, family: 'A5', title: `Findings the next year's report lists as unresolved, ${ENT[entity]}, FY ${fy}`,
    formula: 'Number of findings that the following year\'s audit report lists as unresolved (listed_unresolved_next_year = true).', unit: 'findings', period: `FY ${fy}`, caveat: AUD_CAVEAT, flags: { entity, fy, count_kind: 'listed_unresolved_next_year' } };
  if (!listed.length) {
    return push({ ...listedCommon, status: 'gap', gap_reason: 'The tracker records the next report\'s list of unresolved matters only for FY 2023/24 (FY 2024/25 Executive Appendix 1 and Assembly report). For this year the next report is missing or its follow-up list has not been transcribed, so a count of zero would be unsupported.' });
  }
  push({ ...listedCommon, status: 'value', inputs: listed, calc: calcT, result: evaluate(calcT, listed), comparability_notes: [`Out of ${fs_.length} findings recorded for this entity and year.`] });
});
AUD.same_items.forEach((s) => {
  const inputs = s.finding_ids.map((id) => findingIn(AUD.findings.find((f) => f.id === id), 'same_item', null, 'item'));
  const calc = { op: 'count', match: s.key };
  push({ calc_id: `SIA-A5-same-item-${s.key}`, family: 'A5', status: 'value', title: `Named item reported in more than one audit year: ${s.key}`, formula: 'Number of findings linked to the same named contract or requirement (same_item).',
    inputs, calc, result: evaluate(calc, inputs), unit: 'findings (one per year)', period: `FY ${s.years[0]} to FY ${s.years[s.years.length - 1]}`,
    comparability_notes: [`Link basis: ${s.basis}.`, `Years: ${s.years.join(', ')}.`], caveat: AUD_CAVEAT, flags: { entity: s.entity, count_kind: 'same_item' } });
});

// =====================================================================================================================
// A6. Budget-to-service context. Sector spending beside a service indicator for the same year, only where both exist.
// A calendar-year indicator Y is paired with the fiscal year that starts in July of Y. Context, not causation.
// =====================================================================================================================
const CTX = 'Context, not causation: spending in a year is shown beside a service indicator for the same year. It does not show that the spending caused the indicator, or that the indicator reflects the spending.';
(function education() {
  const ins = [eduIn('abs-edu-dept-rec-exp', 'part'), eduIn('abs-edu-dept-dev-exp', 'part')];
  const calc = { op: 'linear', to_unit: 'KSh million', dp: 2, coefficients: { part: 1 } };
  push({ calc_id: 'SIA-A6-education-2014-15', family: 'A6', status: 'value', title: 'Education department expenditure FY 2014/15 beside ECDE enrolment and centres in 2014',
    formula: 'Recurrent + development expenditure of the county education department (KSh million), same table; shown beside 2014 pre-primary (ECDE) enrolment and centres from the same publication.',
    inputs: ins, beside: [eduIn('abs-ecde-enrol-2014', 'service_indicator'), eduIn('abs-ecde-centres-total', 'service_indicator')], calc, result: evaluate(calc, ins),
    unit: 'KSh million', period: 'FY 2014/15 (spending); 2014 (indicator)',
    comparability_notes: ['The department also covers youth affairs, culture and social services, so its spending is not ECDE spending; no per-pupil figure is calculated.', 'Expenditure is provisional (marked * by KNBS); recurrent spending is printed above its approved estimate.', 'ECDE enrolment includes private centres, which the county does not fund.'],
    caveat: CTX, flags: { context_not_causation: true, sector: 'education' } });
}());
(function water() {
  const ins = [climateIn('cbrop-water-dept-total-expenditure-2024-25', 'part')];
  const calc = { op: 'linear', to_unit: 'KSh million', dp: 2, coefficients: { part: 1 } };
  push({ calc_id: 'SIA-A6-water-2024-25', family: 'A6', status: 'value', title: 'Water department expenditure FY 2024/25 beside WASREB water coverage FY 2024/25',
    formula: 'Actual expenditure of the water, irrigation, environment, climate change and natural resources department (KSh million); shown beside WASREB Impact 18 coverage figures for the same year.',
    inputs: ins, beside: [climateIn('wasreb18-siaya-county-served-by-wsps', 'service_indicator'), climateIn('wasreb18-sibo-water-coverage', 'service_indicator')], calc, result: evaluate(calc, ins),
    unit: 'KSh million', period: 'FY 2024/25',
    comparability_notes: ['The department covers irrigation, environment, climate change and natural resources as well as water.', 'WASREB measures service by formal water service providers (34% of the county population; 62% within the SIBOWASCO service area); people outside it may still have water from other sources. The 34% is read from a chart label (confidence 2).', 'Department spending and utility coverage are different organisations\' figures; no ratio is calculated.'],
    caveat: CTX, flags: { context_not_causation: true, sector: 'water' } });
}());
push({ calc_id: 'SIA-A6-water-2025-26', family: 'A6', status: 'gap', title: 'Water department expenditure FY 2025/26 beside a water service indicator', formula: 'As SIA-A6-water-2024-25.',
  inputs: [climateIn('q4-water-dept-rec-expenditure-2025-26', 'part'), climateIn('q4-water-dept-dev-expenditure-2025-26', 'part')], unit: 'KSh million', period: 'FY 2025/26', caveat: CTX,
  gap_reason: 'No water service indicator for FY 2025/26 is held (WASREB Impact 18 covers FY 2024/25; KDHS 2022 and the CIDP baseline are for 2022).', flags: { context_not_causation: true, sector: 'water' } });
push({ calc_id: 'SIA-A6-water-2022-23', family: 'A6', status: 'gap', title: 'Water department expenditure FY 2022/23 beside KDHS 2022 water access', formula: 'As SIA-A6-water-2024-25.',
  beside: [climateIn('kdhs22-water-basic', 'service_indicator')], unit: 'KSh million', period: 'FY 2022/23 (spending); 2022 (indicator)', caveat: CTX,
  gap_reason: 'No water department expenditure for FY 2022/23 is held in the repository datasets.', flags: { context_not_causation: true, sector: 'water' } });
push({ calc_id: 'SIA-A6-education-2019-20', family: 'A6', status: 'gap', title: 'Education/ECDE expenditure FY 2019/20 beside 2019 pre-primary enrolment', formula: 'As SIA-A6-education-2014-15.',
  beside: [eduIn('b19-pp-enrol-public', 'service_indicator')], unit: 'KSh million', period: 'FY 2019/20 (spending); 2019 (indicator)', caveat: CTX,
  gap_reason: 'No education or ECDE department expenditure for FY 2019/20 is held; the FY 2024/25 and FY 2025/26 bursary amounts are plan figures, not spending.', flags: { context_not_causation: true, sector: 'education' } });
const healthMoney = HEA.observations.filter((o) => /KSh/i.test(String(o.unit || '')));
push({ calc_id: 'SIA-A6-health', family: 'A6', status: 'gap', title: 'Health sector spending beside a health service indicator', formula: 'Health department expenditure beside a same-year health indicator (e.g. facility delivery, immunisation).',
  unit: 'KSh million', period: 'any year', caveat: CTX,
  gap_reason: `No health department allocation or expenditure is held in data/siaya-health.json (${healthMoney.length} money values) or the fiscal ledger, so no year has both. Health indicators exist for 2014 and 2022 (KDHS) and CIDP baselines.`,
  flags: { context_not_causation: true, sector: 'health' } });

// =====================================================================================================================
// A7. Climate financing beside risk. PCRA (2023) wards with a flood or drought hotspot printed, beside FLLoCA allocations
// for FY 2023/24 (the fiscal year that starts in 2023). Allocation, receipt and expenditure are kept apart.
// =====================================================================================================================
const pcra = CLI.observations.filter((o) => ['pcra-ward-flood', 'pcra-ward-drought'].includes(o.series) && o.ward_register_name).sort((a, b) => a.id.localeCompare(b.id));
const hotspot = (o) => o.hotspots_as_printed && o.hotspots_as_printed !== 'none printed';
const flloca2324 = [climateIn('cbrop-flloca-ccri-estimate-2023-24', 'allocation'), climateIn('cbrop-flloca-ccis-estimate-2023-24', 'allocation')];
const A7_CAVEAT = 'Financing is shown beside risk; it is not evidence of resilience or of where money was spent. FLLoCA allocations are county-wide and not assigned to wards in the documents held. Allocation, receipt and expenditure are different stages and are never added together.';
[['any', ['pcra-ward-flood', 'pcra-ward-drought'], 'a flood or drought hotspot'], ['flood', ['pcra-ward-flood'], 'a flood hotspot'], ['drought', ['pcra-ward-drought'], 'a drought hotspot']].forEach(([k, series, words]) => {
  const inputs = pcra.filter((o) => series.includes(o.series) && hotspot(o)).map((o) => climateIn(o.id, 'item', 'ward_register_name'));
  const calc = { op: 'count_distinct', filter: { series, hotspots_as_printed_not: 'none printed' } };
  push({ calc_id: `SIA-A7-pcra-hotspot-wards-${k}-2023`, family: 'A7', status: 'value', title: `PCRA wards with ${words} printed (2023), beside FLLoCA allocations FY 2023/24`,
    formula: `Number of distinct wards (CIDP ward register names) whose PCRA ward table lists ${words} with at least one named place; shown beside the FY 2023/24 FLLoCA grant allocations.`,
    inputs, beside: flloca2324, calc, result: evaluate(calc, inputs), unit: 'wards (of 30)', period: 'PCRA 2023; allocations FY 2023/24',
    comparability_notes: ['The PCRA prints no severity ranking by ward; a hotspot is a place named by ward participants, not a measured exposure.', 'Seven wards have no PCRA ward table (Usonga, West Alego, North Ugenya, East Ugenya, Ukwala, Central Sakwa, West Asembo); they are not counted.', 'Beside: FLLoCA CCRI estimate KSh 137.5m and CCIS estimate KSh 11.0m for FY 2023/24 (allocations, not receipts or spending).'],
    caveat: A7_CAVEAT, flags: { allocation_receipt_expenditure_kept_separate: true } });
});
push({ calc_id: 'SIA-A7-flloca-receipt-2023-24', family: 'A7', status: 'gap', title: 'FLLoCA receipts FY 2023/24 beside PCRA hotspot wards', formula: 'FLLoCA grant cash received in FY 2023/24, shown beside the PCRA hotspot ward count.',
  unit: 'KSh', period: 'FY 2023/24', caveat: A7_CAVEAT, gap_reason: 'FLLoCA FY 2023/24 receipts were not found in the documents read (data/siaya-climate.json gaps).', flags: { allocation_receipt_expenditure_kept_separate: true } });
push({ calc_id: 'SIA-A7-flloca-expenditure-2023-24', family: 'A7', status: 'gap', title: 'FLLoCA expenditure FY 2023/24 beside PCRA hotspot wards', formula: 'FLLoCA project expenditure in FY 2023/24, shown beside the PCRA hotspot ward count.',
  unit: 'KSh', period: 'FY 2023/24', caveat: A7_CAVEAT, gap_reason: 'No FLLoCA project expenditure is published in the documents read; the FY 2025/26 fund disbursement is a transfer into the county fund, not spending.', flags: { allocation_receipt_expenditure_kept_separate: true } });
push({ calc_id: 'SIA-A7-climate-tagged-allocation', family: 'A7', status: 'gap', title: 'County-wide climate-tagged allocation beside PCRA risk', formula: 'All climate-tagged budget lines across departments, beside PCRA hotspot wards.',
  unit: 'KSh', period: 'FY 2023/24', caveat: A7_CAVEAT, gap_reason: 'No climate budget tagging is published in the CBROP FY 2024/25 or the FY 2025/26 quarterly reports; only FLLoCA grant lines are climate-specific. Department totals are sector allocations, not climate tags.', flags: { allocation_receipt_expenditure_kept_separate: true } });
push({ calc_id: 'SIA-A7-pcra-other-years', family: 'A7', status: 'gap', title: 'PCRA hotspot wards beside FLLoCA allocations for FY 2024/25 and FY 2025/26', formula: 'As SIA-A7-pcra-hotspot-wards-any-2023.',
  beside: [climateIn('cbrop-flloca-ccri-estimate-2024-25', 'allocation'), climateIn('q4-flloca-fund-budget-2025-26', 'allocation')], unit: 'wards', period: 'FY 2024/25 and FY 2025/26', caveat: A7_CAVEAT,
  gap_reason: 'The only ward risk assessment held is the 2023 PCRA; it is not paired with later years\' financing.', flags: { allocation_receipt_expenditure_kept_separate: true } });


// =====================================================================================================================
// A8. Own-source revenue composition (owner request, sweep D24): ordinary own-source revenue and health Facility
// Improvement Financing (FIF) / appropriations-in-aid, by fiscal year and source document, and the FIF share of total
// own-source revenue for all 47 counties (Controller of Budget Table 2.1, FY 2023/24 and FY 2024/25). FIF is lawful
// own-source revenue (Facility Improvement Financing Act, 2023); the share describes composition only.
// =====================================================================================================================
const A8_CAVEAT = 'Describes how own-source revenue is made up; it is not a judgement of collection. What FIF and A-i-A are: Learn, own-source revenue (defined once there). Sources differ in what they put in each part; each document is a separate record.';
L.years.forEach((fy) => {
  sourcesFor(['osr_fif_aia_actual', 'osr_total_actual', 'osr_ordinary_actual'], fy).forEach((sid) => {
    const key = `SIA-A8-${slug(fy)}-${slug(sid)}`;
    const common = { calc_id: key, family: 'A8', title: `FIF/A-i-A share of own-source revenue, FY ${fy} (${sid})`, unit: '% of own-source revenue', period: `FY ${fy}`,
      formula: 'FIF/A-i-A collected divided by (ordinary own-source revenue + FIF/A-i-A) from the same document, times 100; where the document gives no ordinary figure, FIF/A-i-A divided by its printed total own-source revenue.', caveat: A8_CAVEAT };
    const fifIds = ledgerBy('osr_fif_aia_actual', fy, sid); const ordIds = ledgerBy('osr_ordinary_actual', fy, sid); const totIds = ledgerBy('osr_total_actual', fy, sid);
    if (!fifIds.length) return push({ ...common, status: 'gap', inputs: totIds.length ? [ledgerIn(pickSameSource(totIds).id || totIds[0], 'total')] : [],
      gap_reason: 'This document prints one own-source revenue figure for the year and does not give health FIF/A-i-A separately, so its composition cannot be stated.' });
    const picks = [pickSameSource(fifIds), pickSameSource(ordIds), pickSameSource(totIds)];
    const bad = picks.find((x) => x.conflict);
    if (bad) return push({ ...common, status: 'gap', gap_reason: `The same document gives different figures for one part (${bad.ids.join(', ')}: ${bad.values_ksh_m.join(' vs ')} KSh million); no figure is chosen.` });
    const [fp, op, tp] = picks;
    const fif = ledgerIn(fp.id, 'fif');
    let inputs; let calc; const beside = []; const notes = [];
    if (!op.none) {
      const ord = ledgerIn(op.id, 'ordinary');
      inputs = [ord, fif]; calc = { op: 'ratio_pct', numerator_roles: ['fif'], denominator_roles: ['ordinary', 'fif'], to_unit: 'KSh million', dp: 2 };
      notes.push(`Ordinary own-source revenue KSh ${round(toMillion(ord.value, ord.unit), 2)} million; FIF/A-i-A KSh ${round(toMillion(fif.value, fif.unit), 2)} million.`);
      if (!tp.none) {
        const tot = ledgerIn(tp.id, 'printed_total'); beside.push(tot);
        const diff = round(toMillion(ord.value, ord.unit) + toMillion(fif.value, fif.unit) - toMillion(tot.value, tot.unit), 2);
        notes.push(`Printed total KSh ${round(toMillion(tot.value, tot.unit), 2)} million; the two parts add to ${diff === 0 ? 'the printed total' : `${diff > 0 ? '+' : ''}${diff} million against the printed total`}.`);
      }
    } else if (!tp.none) {
      const tot = ledgerIn(tp.id, 'total');
      inputs = [fif, tot]; calc = { op: 'ratio_pct', numerator_roles: ['fif'], denominator_roles: ['total'], to_unit: 'KSh million', dp: 2 };
      notes.push(`This document gives no ordinary own-source revenue figure; the denominator is its printed total of KSh ${round(toMillion(tot.value, tot.unit), 2)} million.`);
    } else {
      return push({ ...common, status: 'gap', inputs: [fif], gap_reason: 'This document gives FIF/A-i-A but neither ordinary own-source revenue nor a total for the same year.' });
    }
    [fp, op, tp].forEach((x) => { if (x.equivalents && x.equivalents.length) notes.push(`Same figure at other rounding in the same document: ${x.equivalents.join(', ')}.`); });
    if (fif.basis) notes.push(`What the FIF/A-i-A part covers, as the source states it: ${fif.basis}.`);
    notes.push(`Source kind: ${fif.source_kind}. Other documents for the same year are separate records and are not averaged.`);
    push({ ...common, status: 'value', inputs, beside, calc, result: evaluate(calc, inputs), comparability_notes: notes, flags: { source_kind: fif.source_kind, denominator: calc.denominator_roles.join('+') } });
  });
});
// FY 2024/25: the Controller of Budget (Table 2.1, 436.68) and the county's Q4 report (Table 4, 757.57) differ (case
// osr-2024-25-county-statement). Differences between the two documents, part by part; no figure is combined or chosen.
[['total', 'osr_total_actual', 'L153', 'L166'], ['ordinary', 'osr_ordinary_actual', 'L154', 'L167'], ['fif', 'osr_fif_aia_actual', 'L155', 'L168']].forEach(([part, measure, cobId, ctyId]) => {
  const a = ledgerIn(cobId, 'cob'); const b = ledgerIn(ctyId, 'county');
  if (a.measure !== measure || b.measure !== measure || a.period !== 'FY 2024/25' || b.period !== 'FY 2024/25') throw new Error(`A8 gap decomposition: ${cobId}/${ctyId} are not ${measure} FY 2024/25`);
  const calc = { op: 'linear', coefficients: { county: 1, cob: -1 }, to_unit: 'KSh million', dp: 2 };
  const words = { total: 'total own-source revenue', ordinary: 'ordinary own-source revenue', fif: 'FIF/A-i-A (hospital and health facility receipts)' }[part];
  push({ calc_id: `SIA-A8-2024-25-difference-${part}`, family: 'A8', status: 'value', title: `Difference in ${words}, FY 2024/25: county Q4 report minus Controller of Budget`,
    formula: `County Q4 report (Table 4) ${words} minus the Controller of Budget Table 2.1 figure for the same year, KSh million. A difference between two documents, not a combined figure.`,
    inputs: [b, a], calc, result: evaluate(calc, [b, a]), unit: 'KSh million', period: 'FY 2024/25',
    comparability_notes: [`Controller of Budget KSh ${a.value} million (PDF p. ${a.pdf_page}); county Q4 report KSh ${round(b.value, 2)} million (PDF p. ${b.pdf_page}).`, 'See conflict case osr-2024-25-county-statement: both figures are kept and neither is chosen.'],
    caveat: A8_CAVEAT, flags: { comparison_across_documents: true, part, conflict_case: 'osr-2024-25-county-statement' } });
});
// All 47 counties: FIF/A-i-A share of total own-source revenue, Controller of Budget Table 2.1, and Siaya's place in it.
['2023/24', '2024/25'].forEach((fy) => {
  const y = COB.years.find((r) => r.fy === fy);
  const inputs = []; const excluded = [];
  [...y.counties].sort((a, b) => a.code - b.code).forEach((c) => {
    const f = c.fif_aia_actual; const tot = c.total_osr_actual; const ord = c.ordinary_osr_actual;
    if (!f || typeof f.value !== 'number' || !tot || typeof tot.value !== 'number' || tot.value <= 0) return excluded.push(`${c.name}: ${!f || typeof f.value !== 'number' ? `FIF/A-i-A ${f ? f.status || 'not read' : 'not read'}` : `total ${tot ? tot.status || 'not read' : 'not read'}`}`);
    if (ord && typeof ord.value === 'number' && Math.abs(ord.value + f.value - tot.value) > Math.max(0.01 * tot.value, 0.02)) return excluded.push(`${c.name}: printed parts (${ord.value} + ${f.value}) do not add to the printed total ${tot.value} within 1%`);
    inputs.push({ ...cobIn2(fy, c.code, 'fif_aia_actual', 'fif') }, { ...cobIn2(fy, c.code, 'total_osr_actual', 'total') });
  });
  const calc = { op: 'share_rank', target_code: 41, dp: 0, order: 'highest share first' };
  const table = shareTable(inputs); const n = table.length; const me = table.find((r) => r.code === 41);
  const sorted = table.map((r) => r.share).sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : round((sorted[n / 2 - 1] + sorted[n / 2]) / 2, 2);
  const below = table.filter((r) => r.share < me.share).length;
  push({ calc_id: `SIA-A8-counties-${slug(fy)}-fif-share-rank`, family: 'A8', status: 'value', title: `Siaya's place among ${n} counties by FIF/A-i-A share of own-source revenue, FY ${fy}`,
    formula: 'For each county in Controller of Budget Table 2.1: FIF/A-i-A actual divided by total own-source revenue actual, times 100 (2 decimals). Counties are ordered from the highest share; the result is Siaya\'s position (1 = highest share).',
    inputs, calc, result: evaluate(calc, inputs), unit: `position of ${n} (1 = highest FIF share)`, period: `FY ${fy}`,
    comparability_notes: [
      `Siaya: FIF/A-i-A ${me.share}% of own-source revenue. Middle value (median) across the ${n} counties: ${median}%. ${below} of the other counties have a lower share.`,
      excluded.length ? `Not ranked (no usable printed value): ${excluded.join('; ')}.` : 'All 47 counties have printed values.',
      'Counties record different things as FIF/A-i-A (some include SHA/SHIF reimbursements, others only facility fees); the table prints what each county reported.',
    ],
    caveat: A8_CAVEAT, flags: { n_counties: n, siaya_share_pct: me.share, median_share_pct: median, counties_with_lower_share: below, excluded_counties: excluded.length } });
});

// ---------- assemble ----------
records.sort((a, b) => a.calc_id.localeCompare(b.calc_id));
// A calculation has no page: derived_from names the records it is computed from (lib/derived-from.js).
records.forEach((r) => { r.derived_from = require('../lib/derived-from').derivedFrom(r); });
const out = {
  meta: {
    title: 'Siaya County: analytical measures calculated from published figures',
    county: 'Siaya', county_code: 41, schema_version: '1.0', label: LABEL, generated_by: 'scripts/build-siaya-analysis.js',
    rule: 'Every result is arithmetic on values already in the repository; each input names its dataset, record, value, unit, source and page. Numerator and denominator come from the same source document. Values are never averaged across sources, a missing or non-comparable input gives a gap record with its reason, and nothing is filled. No verdicts: rates and counts are shown with their caveats.',
    families: {
      A1: 'Real per-capita county expenditure (FY 2024/25 prices; census count and projections kept distinct)',
      A2: 'Transfer dependency per fiscal year and source document',
      A3: 'Execution (absorption) rates, same document and budget version, beside printed rates (R-002)',
      A4: 'Pending bills: stocks by date, changes within one document or declared series, roll-forward residuals (R-003)',
      A5: 'Audit recurrence: findings by category, stated carry-overs, next-year unresolved lists, repeated named items',
      A6: 'Budget-to-service context (context, not causation)',
      A7: 'Climate financing beside PCRA risk; allocation, receipt and expenditure kept separate (R-005)',
      A8: 'Own-source revenue composition: ordinary OSR and health FIF/A-i-A by source document, and the FIF share for all 47 counties (sweep D24)',
    },
    conventions: {
      money: 'Results in KSh million unless the unit says otherwise; KSh billion inputs are multiplied by 1,000 and KSh inputs divided by 1,000,000.',
      rounding: 'Percentages and KSh million to 2 decimals; per-capita KSh to whole shillings. The test allows a tolerance of half a unit in the last decimal.',
      fiscal_year_matching: 'A calendar-year figure for year Y is paired only with the fiscal year that starts in July of Y (FY Y/Y+1).',
      same_document: 'Readings of one measure in one document that agree within 1% are the same figure at different rounding: the most precise (table reading first) is used and the others are listed. Readings that differ by more than 1% are a conflict and give a gap.',
      deflator: `data/cpi.json fiscal-year index; base FY ${CPI_BASE} = 100 (approximate: average of two calendar years).`,
      not_used: 'data/siaya-economy.json (Gross County Product) and data/siaya-agriculture.json were read but no requested measure uses them.',
    },
    input_files: Object.fromEntries(INPUT_FILES.map((f) => [f, crypto.createHash('sha256').update(raw[f]).digest('hex')])),
    counts: {
      records: records.length,
      values: records.filter((r) => r.status === 'value').length,
      gaps: records.filter((r) => r.status === 'gap').length,
      by_family: Object.fromEntries(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'].map((f) => [f, { values: records.filter((r) => r.family === f && r.status === 'value').length, gaps: records.filter((r) => r.family === f && r.status === 'gap').length }])),
      printed_rate_mismatches_gt_1_point: records.filter((r) => r.flags && r.flags.printed_mismatch_gt_1_point).length,
    },
    notes_file: 'docs/siaya-analysis-notes.md',
  },
  records,
};
const text = `${JSON.stringify(out, null, 1)}\n`;
if (process.argv.includes('--stdout')) process.stdout.write(text);
else { fs.writeFileSync(path.join(root, 'data/siaya-analysis.json'), text); console.log(`Wrote data/siaya-analysis.json: ${out.meta.counts.values} values, ${out.meta.counts.gaps} gaps.`); }
