#!/usr/bin/env node
// Builds data/siaya-analysis-layers.json: five analytical layers calculated by Takwimu Kenya from figures already in
// the repository (sweep of 27 Nov 2026, docs/research/sweep-2026-11-27/analytical-layers.md, layers L1 to L4 and L6):
//   B1 wage bill as a share of total revenue, beside the 35 per cent ceiling (and the Auditor-General's own ratios)
//   B2 development share of the budget and of spending, beside the 30 per cent floor
//   B3 own-source revenue against target, in real terms and per person, one series per source (never blended)
//   B4 absorption by department (actual divided by the final budget, same CBROP table)
//   B5 pending bills as a share of total revenue, beside the 20 per cent limit (and the Auditor-General's ratio)
// Rules (as data/siaya-analysis.json): numerator and denominator come from the same document; nothing is averaged
// across sources; a missing or non-comparable input gives a gap record with its reason. Each input names its
// dataset and record (lib/review-status.js inputRef), so a rejected input withholds the result. Deterministic (no
// clock): a re-run reproduces the committed file byte for byte.
// Run: node scripts/build-analysis-layers.js   |   node scripts/build-analysis-layers.js --stdout (used by the test)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const L = load('data/siaya-fiscal-ledger.json');
const H = load('data/history.json');
const CPI = load('data/cpi.json');
const D = load('data/siaya-budget-departments.json');
const S = load('data/siaya-county-series.json');
const AUD = load('data/siaya-audits.json');

const LABEL = 'Calculated by Takwimu Kenya from published figures';
const CPI_BASE = '2024/25';
const round = (x, dp) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
const toM = (v, unit) => (unit === 'KSh million' ? v : unit === 'KSh billion' ? v * 1000 : unit === 'KSh' ? v / 1e6 : (() => { throw new Error(`unit ${unit}`); })());
const fyc = (fy) => fy.replace('/', '-');
const THRESHOLD = {
  B1: { value: 35, unit: '%', kind: 'ceiling', rule: 'Public Finance Management (County Governments) Regulations, 2015, regulation 25(1)(b): expenditure on wages and benefits not to exceed 35 per cent of the county government\'s total revenue. Ceiling as quoted by the Commission on Revenue Allocation (April 2016, source CRA-SENATE-CEILINGS-2016-17); the gazetted regulations are not held. The Act (s. 107(2)(c), LAW-PFM-ACT-2012) leaves the percentage to regulations.' },
  B2: { value: 30, unit: '%', kind: 'floor', rule: 'Public Finance Management Act, 2012, section 107(2)(b): over the medium term, at least 30 per cent of the county budget allocated to development expenditure. The floor applies to the budget; spending is shown for contrast. Wording read in the Act (LAW-PFM-ACT-2012, s. 107(2)(b)).' },
  B5: { value: 20, unit: '%', kind: 'limit', rule: 'The Auditor-General tests total liabilities against 20 per cent of revenue (FY 2024/25 report on the County Executive); the limit as the auditor applies it, not a ratio defined in this repository.' },
};

// ---------- inputs ----------
const led = Object.fromEntries(L.observations.map((o) => [o.id, o]));
const ledgerIn = (id, role) => { const o = led[id]; const s = L.sources[o.source_id] || {}; return { role, dataset: 'data/siaya-fiscal-ledger.json', record: `observations[id=${id}]`, field: 'value', value: o.value, unit: o.unit, measure: o.measure, period: `FY ${o.fy}`, source_id: o.source_id, source_title: s.title || null, table: o.table || null, pdf_page: o.pdf_page, printed_page: o.printed_page ?? null, basis: o.basis || null, scope: o.scope || null, confidence: o.confidence }; };
const dep = Object.fromEntries(D.observations.map((o) => [o.id, o]));
const depIn = (id, role) => { const o = dep[id]; return { role, dataset: 'data/siaya-budget-departments.json', record: `observations[id=${id}]`, field: 'value', value: o.value, unit: o.unit, measure: `${o.class} ${o.measure}${o.budget_version ? ` (${o.budget_version})` : ''}`, period: `FY ${o.fy}`, source_id: o.source_id, source_title: (D.sources.find((s) => s.source_id === o.source_id) || {}).title || null, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, basis: o.includes_balance_bf === true ? 'includes balances brought forward' : o.includes_balance_bf === false ? 'excludes balances brought forward' : 'balances brought forward not stated', scope: o.dept_code === 'TOTAL' ? 'whole county government' : o.dept_code, confidence: o.confidence }; };
const ser = Object.fromEntries(S.observations.map((o) => [o.id, o]));
const serIn = (id, role) => { const o = ser[id]; return { role, dataset: 'data/siaya-county-series.json', record: `observations[id=${id}]`, field: 'value', value: o.value, unit: o.unit, measure: o.measure, period: `FY ${o.fy}`, source_id: o.source_id, source_title: (S.sources.find((s) => s.source_id === o.source_id) || {}).title || null, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, basis: o.basis, scope: o.series, confidence: o.confidence }; };
const histIn = (fy, field, role) => { const y = H.years.find((x) => x.fy === fy); const p = (y.provenance || {})[field] || {}; return { role, dataset: 'data/history.json', record: `years[fy=${fy}]`, field, value: y[field], unit: /_m$/.test(field) ? 'KSh million' : 'KSh billion', measure: field, period: `FY ${fy}`, source_id: p.source_id || null, source_title: null, table: null, pdf_page: p.page ?? null, printed_page: p.printed_page ?? null, basis: null, scope: 'county government (executive and assembly)', confidence: (H.reports[y.report] || {}).confidence ?? null }; };
const popIn = (year) => { const p = H.population.points.find((x) => x.year === year); return p && { role: 'population', dataset: 'data/history.json', record: `population.points[year=${year}]`, field: 'value', value: p.value, unit: 'persons', measure: `population (${p.kind})`, period: String(year), source_id: null, source_title: p.source, table: null, pdf_page: p.pdf_page ?? null, printed_page: p.printed_page ?? null, basis: p.kind, scope: 'Siaya County', confidence: p.confidence }; };
const cpiIn = (fy, role) => ({ role, dataset: 'data/cpi.json', record: 'fiscal_year', field: fy, value: CPI.fiscal_year[fy], unit: 'index (2010 = 100)', measure: 'CPI, fiscal-year average', period: `FY ${fy}`, source_id: 'worldbank-wdi-api', source_title: CPI.meta.source, table: null, pdf_page: null, printed_page: null, basis: CPI.meta.method, scope: 'Kenya', confidence: CPI.meta.confidence });
const findingIn = (id) => { const f = AUD.findings.find((x) => x.id === id); return f && { role: 'auditor_reported', dataset: 'data/siaya-audits.json', record: `findings[id=${id}]`, field: 'title', value: f.title, unit: 'text', measure: 'Auditor-General finding (ratio as the auditor reports it)', period: `FY ${f.fy}`, source_id: f.doc_id, source_title: null, table: f.report_heading || null, pdf_page: f.page ?? f.pdf_page ?? null, printed_page: null, basis: 'The auditor\'s own ratio and denominator; not recomputed here.', scope: f.entity, confidence: f.confidence ?? null }; };

const minConf = (ins) => { const c = ins.map((i) => i.confidence).filter((x) => typeof x === 'number'); return c.length ? Math.min(...c) : null; };
const records = [];
function rec(r) {
  const ins = r.inputs || [];
  const out = {
    calc_id: r.calc_id, family: r.family, status: r.result === null || r.result === undefined ? 'gap' : 'value', title: r.title, formula: r.formula, calc: r.calc || null,
    inputs: ins, beside: r.beside || [], result: r.result ?? null, unit: r.unit, period: r.period,
    source_ids: [...new Set(ins.map((i) => i.source_id).filter(Boolean))], comparability_notes: r.notes || [], caveat: r.caveat || null,
    threshold: r.threshold || null, flags: r.flags || {}, ...(r.gap_reason ? { gap_reason: r.gap_reason } : {}), confidence: minConf(ins), label: LABEL,
  };
  if (records.some((x) => x.calc_id === out.calc_id)) throw new Error(`duplicate ${out.calc_id}`);
  records.push(out);
}
const pct = (num, den) => round((num / den) * 100, 2);
const sumM = (ins, roles) => ins.filter((i) => roles.includes(i.role)).reduce((a, i) => a + toM(i.value, i.unit), 0);
const vsThreshold = (fam, v) => { const t = THRESHOLD[fam]; return t.kind === 'floor' ? { below_floor: v < t.value } : t.kind === 'ceiling' ? { above_ceiling: v > t.value } : { above_limit: v > t.value }; };

// ---------- the Controller of Budget's own-year report: revenue = equitable share + grants + OSR ----------
const own = (fy) => `cob-report-${fy.replace('/', '-')}`;
const ownObs = (measure, fy) => L.observations.filter((o) => o.measure === measure && o.fy === fy && o.source_id === own(fy));
// One reading per measure: readings within 1% are the same figure (most precise kept, table first); more than 1% apart gives a gap.
function oneReading(list) {
  if (!list.length) return { gap: 'not printed in the year\'s own report' };
  const v = list.map((o) => toM(o.value, o.unit));
  if (Math.max(...v) > Math.min(...v) * 1.01) return { gap: `the report prints ${list.length} readings more than 1 per cent apart (${list.map((o) => `${o.id} ${o.value} ${o.unit}`).join('; ')})` };
  const best = list.slice().sort((a, b) => (Boolean(b.table) - Boolean(a.table)) || (String(b.value).length - String(a.value).length) || a.id.localeCompare(b.id))[0];
  return { o: best, others: list.filter((x) => x !== best).map((x) => x.id) };
}
const COB_FYS = [...new Set(L.observations.filter((o) => /^cob-report-/.test(o.source_id)).map((o) => o.fy))].sort();
function revenueInputs(fy) {
  const parts = [['equitable_share_received', 'revenue'], ['conditional_grants_received', 'revenue'], ['osr_total_actual', 'revenue']].map(([m, role]) => [m, role, oneReading(ownObs(m, fy))]);
  const gap = parts.find(([, , r]) => r.gap);
  if (gap) return { gap: `${gap[0]}: ${gap[2].gap}` };
  return { inputs: parts.map(([, role, r]) => ledgerIn(r.o.id, role)), others: parts.flatMap(([, , r]) => r.others) };
}

// ---------- B1 wage bill share ----------
const OAG_WAGE = { '2022/23': 'audit-2022-23-15', '2024/25': 'audit-2024-25-33' };
COB_FYS.forEach((fy) => {
  const base = { family: 'B1', calc_id: `SIA-B1-${fyc(fy)}-${own(fy)}`, title: `Wage bill as a share of total revenue, FY ${fy} (${own(fy)})`, formula: 'Wage bill (compensation of employees) divided by total revenue received (equitable share + conditional grants or additional allocations + own-source revenue), times 100. All from the Controller of Budget\'s report for the year.', unit: '%', period: `FY ${fy}`, threshold: THRESHOLD.B1, caveat: 'Revenue here is what the Controller of Budget reports as received; it leaves out balances brought forward. The Auditor-General\'s ratios use the auditor\'s own denominator (receipts or revenue of the County Executive) and are shown beside, not combined.' };
  const beside = OAG_WAGE[fy] ? [findingIn(OAG_WAGE[fy])].filter(Boolean) : [];
  const w = oneReading(ownObs('wage_bill', fy));
  const r = revenueInputs(fy);
  if (w.gap || r.gap) return rec({ ...base, inputs: [...(w.o ? [ledgerIn(w.o.id, 'wage_bill')] : []), ...(r.inputs || [])], beside, result: null, gap_reason: w.gap ? `wage bill: ${w.gap}` : r.gap });
  const inputs = [ledgerIn(w.o.id, 'wage_bill'), ...r.inputs];
  const v = pct(sumM(inputs, ['wage_bill']), sumM(inputs, ['revenue']));
  rec({ ...base, inputs, beside, calc: { op: 'ratio_pct', numerator_roles: ['wage_bill'], denominator_roles: ['revenue'], dp: 2 }, result: v, flags: vsThreshold('B1', v), notes: [...(w.others.length || r.others.length ? [`Other readings of the same figures in the report: ${[...w.others, ...r.others].join(', ')}.`] : []), ...(/basis not defined/.test(led[w.o.id].basis || '') ? ['The report\'s "wage bill" figure does not say what it counts.'] : [])] });
});
// The Auditor-General's FY 2019/20 ratio has no Controller of Budget report to set beside (the FY 2019/20 report is missing).

// ---------- B2 development share ----------
// (a) budgets in the programme-based budgets: printed Total rows, same table version and balance basis
const tot = D.observations.filter((o) => o.dept_code === 'TOTAL' && o.measure === 'budget');
tot.filter((o) => o.class === 'development').forEach((dv) => {
  const t = tot.find((o) => o.class === 'total' && o.source_id === dv.source_id && o.budget_version === dv.budget_version && o.includes_balance_bf === dv.includes_balance_bf);
  const tag = `${dv.document_kind === 'CBROP' ? 'cbrop-dept-tables' : 'pbb'}-${dv.budget_version}${dv.includes_balance_bf === null ? '' : dv.includes_balance_bf ? '-bf' : '-nobf'}`;
  const base = { family: 'B2', calc_id: `SIA-B2-${fyc(dv.fy)}-budget-${tag}`, title: `Development share of the ${dv.budget_version} budget, FY ${dv.fy} (${dv.document_kind === 'PBB' ? 'programme-based budget' : 'Budget Review and Outlook Paper'}${dv.includes_balance_bf ? ', with balances brought forward' : dv.includes_balance_bf === false ? ', without balances brought forward' : ''})`, formula: 'Development budget divided by total budget, times 100; both printed Total rows of the same document, version and balance basis.', unit: '%', period: `FY ${dv.fy}`, threshold: THRESHOLD.B2, caveat: 'Budget version and whether balances brought forward are included are part of the label; versions are never mixed.' };
  if (!t) return rec({ ...base, inputs: [depIn(dv.id, 'development')], result: null, gap_reason: 'The document prints no total budget for the same version and balance basis.' });
  const inputs = [depIn(dv.id, 'development'), depIn(t.id, 'total')];
  const v = pct(sumM(inputs, ['development']), sumM(inputs, ['total']));
  rec({ ...base, inputs, calc: { op: 'ratio_pct', numerator_roles: ['development'], denominator_roles: ['total'], dp: 2 }, result: v, flags: vsThreshold('B2', v) });
});
// (b) the County Treasury's final budget and actual spending (CBROP economic classification)
S.observations.filter((o) => o.series === 'county-cbrop' && /^(budget|actual)_development$/.test(o.measure)).forEach((dv) => {
  const kind = dv.measure.split('_')[0];
  const t = S.observations.find((o) => o.source_id === dv.source_id && o.fy === dv.fy && o.measure === `${kind}_total`);
  const inputs = [serIn(dv.id, 'development'), serIn(t.id, 'total')];
  const v = pct(sumM(inputs, ['development']), sumM(inputs, ['total']));
  rec({ family: 'B2', calc_id: `SIA-B2-${fyc(dv.fy)}-${kind}-cbrop`, title: `Development share of ${kind === 'budget' ? 'the final budget' : 'actual spending'}, FY ${dv.fy} (County Budget Review and Outlook Paper)`, formula: `Development ${kind} divided by total ${kind}, times 100; the same table of the County Treasury's review of the year.`, unit: '%', period: `FY ${dv.fy}`, threshold: THRESHOLD.B2, caveat: kind === 'actual' ? 'The 30 per cent floor applies to the budget; the share of actual spending is shown for contrast.' : 'Final budget after supplementary budgets, as the review of the year prints it.', inputs, calc: { op: 'ratio_pct', numerator_roles: ['development'], denominator_roles: ['total'], dp: 2 }, result: v, flags: vsThreshold('B2', v) });
});
// (c) the Controller of Budget's own-year report: budget and spending
COB_FYS.forEach((fy) => {
  [['budget', 'budget_development', 'budget_total'], ['actual', 'expenditure_development', 'expenditure_total']].forEach(([kind, dm, tm]) => {
    const d = oneReading(ownObs(dm, fy)); const t = oneReading(ownObs(tm, fy));
    const base = { family: 'B2', calc_id: `SIA-B2-${fyc(fy)}-${kind}-${own(fy)}`, title: `Development share of ${kind === 'budget' ? 'the approved budget' : 'actual spending'}, FY ${fy} (${own(fy)})`, formula: `Development ${kind === 'budget' ? 'budget' : 'spending'} divided by total ${kind === 'budget' ? 'budget' : 'spending'}, times 100; the Controller of Budget's report for the year.`, unit: '%', period: `FY ${fy}`, threshold: THRESHOLD.B2, caveat: kind === 'actual' ? 'The 30 per cent floor applies to the budget; spending is shown for contrast.' : null };
    if (d.gap || t.gap) return rec({ ...base, inputs: [...(d.o ? [ledgerIn(d.o.id, 'development')] : []), ...(t.o ? [ledgerIn(t.o.id, 'total')] : [])], result: null, gap_reason: d.gap ? `development: ${d.gap}` : `total: ${t.gap}` });
    const inputs = [ledgerIn(d.o.id, 'development'), ledgerIn(t.o.id, 'total')];
    const v = pct(sumM(inputs, ['development']), sumM(inputs, ['total']));
    rec({ ...base, inputs, calc: { op: 'ratio_pct', numerator_roles: ['development'], denominator_roles: ['total'], dp: 2 }, result: v, flags: vsThreshold('B2', v) });
  });
});

// ---------- B3 own-source revenue: against target, real, per person; one series per source ----------
const realRec = (fam, id, title, valueIn, fy, note) => {
  const base = { family: fam, calc_id: id, title, formula: `Own-source revenue (KSh million) multiplied by CPI(FY ${CPI_BASE}) / CPI(FY ${fy}).`, unit: `KSh million at FY ${CPI_BASE} prices`, period: `FY ${fy}`, caveat: 'Deflated with the national CPI (World Bank WDI, fiscal-year average of two calendar years; approximate).', notes: note ? [note] : [] };
  if (!CPI.fiscal_year[fy]) return rec({ ...base, inputs: [valueIn], result: null, gap_reason: `No CPI for FY ${fy}.` });
  const inputs = [valueIn, cpiIn(CPI_BASE, 'cpi_base'), cpiIn(fy, 'cpi_year')];
  rec({ ...base, inputs, calc: { op: 'deflate', value_role: valueIn.role, base_role: 'cpi_base', year_role: 'cpi_year', dp: 2 }, result: round(toM(valueIn.value, valueIn.unit) * CPI.fiscal_year[CPI_BASE] / CPI.fiscal_year[fy], 2) });
};
const capitaRec = (fam, id, title, valueIn, fy, note) => {
  const year = Number(fy.slice(0, 4));
  const p = popIn(year);
  const base = { family: fam, calc_id: id, title, formula: 'Own-source revenue (KSh) divided by the population of the calendar year in which the fiscal year starts.', unit: 'KSh per person (current prices)', period: `FY ${fy}`, caveat: 'Census counts and county projections are kept distinct (input basis); no year is interpolated.', notes: note ? [note] : [] };
  if (!p) return rec({ ...base, inputs: [valueIn], result: null, gap_reason: `No population figure for calendar year ${year} is held (held: ${H.population.points.map((x) => `${x.year} ${x.kind}`).join(', ')}); none is interpolated.` });
  const inputs = [valueIn, p];
  rec({ ...base, inputs, calc: { op: 'per_capita', value_role: valueIn.role, population_role: 'population', dp: 0 }, result: round(toM(valueIn.value, valueIn.unit) * 1e6 / p.value, 0) });
};
const perfRec = (id, title, aIn, tIn, fy, note) => {
  const inputs = [aIn, tIn];
  rec({ family: 'B3', calc_id: id, title, formula: 'Own-source revenue collected divided by the target, times 100; both from the same document.', unit: '%', period: `FY ${fy}`, caveat: 'What the target and the actual include is as the document states (see each input\'s basis).', notes: note ? [note] : [], inputs, calc: { op: 'ratio_pct', numerator_roles: ['osr_actual'], denominator_roles: ['osr_target'], dp: 2 }, result: pct(sumM(inputs, ['osr_actual']), sumM(inputs, ['osr_target'])) });
};
// Controller of Budget (history.json, the ten-year series)
H.years.filter((y) => typeof y.osr_m === 'number').forEach((y) => {
  const a = histIn(y.fy, 'osr_m', 'osr_actual');
  const same = y.provenance && y.provenance.osr_target_m && y.provenance.osr_m && y.provenance.osr_target_m.source_id === y.provenance.osr_m.source_id;
  if (typeof y.osr_target_m === 'number' && same) perfRec(`SIA-B3-${fyc(y.fy)}-perf-cob`, `Own-source revenue against target, FY ${y.fy} (Controller of Budget)`, a, histIn(y.fy, 'osr_target_m', 'osr_target'), y.fy);
  else rec({ family: 'B3', calc_id: `SIA-B3-${fyc(y.fy)}-perf-cob`, title: `Own-source revenue against target, FY ${y.fy} (Controller of Budget)`, formula: 'Own-source revenue collected divided by the target, times 100; both from the same document.', unit: '%', period: `FY ${y.fy}`, inputs: [a], result: null, gap_reason: typeof y.osr_target_m === 'number' ? 'The target and the actual come from different reports.' : 'No target is recorded for the year in data/history.json.' });
  realRec('B3', `SIA-B3-${fyc(y.fy)}-real-cob`, `Own-source revenue in real terms, FY ${y.fy} (Controller of Budget)`, a, y.fy);
  capitaRec('B3', `SIA-B3-${fyc(y.fy)}-capita-cob`, `Own-source revenue per person, FY ${y.fy} (Controller of Budget)`, a, y.fy);
});
// County Treasury (CBROP) and the Auditor-General's reports
const SER = [
  ['county-cbrop', null, 'cbrop', 'County Treasury, Budget Review and Outlook Paper'],
  ['oag-ror-table', 'OAG-ROR-2024-25', 'oag-table-2025', 'County Treasury table in the Auditor-General\'s FY 2024/25 Receiver of Revenue report'],
  ['oag-ror-table', 'OAG-ROR-2023-24', 'oag-table-2024', 'County Treasury table in the Auditor-General\'s FY 2023/24 Receiver of Revenue report'],
];
SER.forEach(([series, doc, tag, label]) => {
  S.observations.filter((o) => o.series === series && (!doc || o.source_id === doc) && o.measure === 'osr_actual' && !/-text$/.test(o.id)).forEach((a) => {
    const t = S.observations.find((o) => o.series === series && o.source_id === a.source_id && o.fy === a.fy && o.measure === 'osr_target');
    if (t) perfRec(`SIA-B3-${fyc(a.fy)}-perf-${tag}`, `Own-source revenue against target, FY ${a.fy} (${label})`, serIn(a.id, 'osr_actual'), serIn(t.id, 'osr_target'), a.fy);
    if (tag !== 'oag-table-2024') {
      realRec('B3', `SIA-B3-${fyc(a.fy)}-real-${tag}`, `Own-source revenue in real terms, FY ${a.fy} (${label})`, serIn(a.id, 'osr_actual'), a.fy);
      capitaRec('B3', `SIA-B3-${fyc(a.fy)}-capita-${tag}`, `Own-source revenue per person, FY ${a.fy} (${label})`, serIn(a.id, 'osr_actual'), a.fy);
    }
  });
});
// Audited statements (cash receipts): real and per person only (the statements print no target)
S.observations.filter((o) => o.series === 'oag-ror' && o.measure === 'osr_receipts_cash').forEach((a) => {
  const tag = `oag-cash-${a.source_id.slice(-5)}`;
  realRec('B3', `SIA-B3-${fyc(a.fy)}-real-${tag}`, `Own-source receipts in real terms, FY ${a.fy} (Auditor-General, audited cash statement, ${a.source_id})`, serIn(a.id, 'osr_actual'), a.fy, 'Cash receipts, including hospital fees.');
  capitaRec('B3', `SIA-B3-${fyc(a.fy)}-capita-${tag}`, `Own-source receipts per person, FY ${a.fy} (Auditor-General, audited cash statement, ${a.source_id})`, serIn(a.id, 'osr_actual'), a.fy, 'Cash receipts, including hospital fees.');
});
// FY 2024/25 on three bases, from one audited report: cash receipts and accrual revenue against the target
{
  const tgt = serIn('CS-ROR25-T1-2425-osr_target', 'osr_target');
  [['CS-ROR25-CASH-TOTAL', 'cash'], ['CS-ROR25-ACCRUAL-TOTAL', 'accrual']].forEach(([id, basis]) => perfRec(`SIA-B3-2024-25-perf-oag-${basis}`, `Own-source revenue against target, FY 2024/25, ${basis} basis (Auditor-General, Receiver of Revenue FY 2024/25)`, serIn(id, 'osr_actual'), tgt, '2024/25', basis === 'accrual' ? 'Accrual revenue includes amounts billed but not received; the target is the County Treasury\'s (Table 1, PDF p. 10).' : 'Cash receipts from the audited statement of cash flows; the target is the County Treasury\'s (Table 1, PDF p. 10).'));
}

// ---------- B4 absorption by department (same CBROP table) ----------
D.observations.filter((o) => o.measure === 'actual').forEach((a) => {
  const b = D.observations.find((o) => o.measure === 'budget' && o.source_id === a.source_id && o.table === a.table && o.dept_code === a.dept_code && o.class === a.class);
  const base = { family: 'B4', calc_id: `SIA-B4-${fyc(a.fy)}-${a.dept_code}-${a.class}`, title: `Absorption, ${a.dept_code === 'TOTAL' ? 'whole county' : a.printed_name}, ${a.class}, FY ${a.fy}`, formula: 'Actual spending divided by the final budget, times 100; the same table of the County Treasury\'s review of the year.', unit: '%', period: `FY ${a.fy}`, caveat: 'Department names change between years; compare across years only through the crosswalk codes and the comparability notes in data/siaya-budget-departments.json.' };
  if (!b || b.value === null || a.value === null) return rec({ ...base, inputs: [depIn(a.id, 'actual')], result: null, gap_reason: 'No final budget in the same table, or a value printed as "-".' });
  const inputs = [depIn(a.id, 'actual'), depIn(b.id, 'budget')];
  const v = pct(sumM(inputs, ['actual']), sumM(inputs, ['budget']));
  const cw = D.crosswalk.find((c) => c.code === a.dept_code);
  rec({ ...base, inputs, calc: { op: 'ratio_pct', numerator_roles: ['actual'], denominator_roles: ['budget'], dp: 2 }, result: v, flags: { above_100: v > 100 }, notes: [...(a.note ? [a.note] : []), ...(cw && !/^Same function/.test(cw.comparability) ? [cw.comparability] : [])] });
});

// ---------- B5 pending bills burden ----------
COB_FYS.forEach((fy) => {
  const stocks = ownObs('pending_bills_close', fy);
  const r = revenueInputs(fy);
  const beside = fy === '2024/25' ? [findingIn('audit-2024-25-34')].filter(Boolean) : [];
  if (!stocks.length) return rec({ family: 'B5', calc_id: `SIA-B5-${fyc(fy)}-${own(fy)}`, title: `Pending bills as a share of total revenue, FY ${fy} (${own(fy)})`, formula: 'Pending bills at 30 June divided by total revenue received in the year, times 100; same report.', unit: '%', period: `FY ${fy}`, threshold: THRESHOLD.B5, inputs: r.inputs || [], beside, result: null, gap_reason: 'The year\'s own report prints no closing stock of pending bills.' });
  stocks.forEach((s) => {
    const base = { family: 'B5', calc_id: `SIA-B5-${fyc(fy)}-${own(fy)}-${s.id}`, title: `Pending bills as a share of total revenue, FY ${fy} (${own(fy)}, ${s.id})`, formula: 'Pending bills at 30 June (own-year report) divided by total revenue received in the year (equitable share + grants + own-source revenue, same report), times 100.', unit: '%', period: `FY ${fy}`, threshold: THRESHOLD.B5, beside, caveat: 'Each stock the report prints is a separate record (scope and the bills of the year as the report states them); the Auditor-General\'s ratio counts total liabilities against the auditor\'s own revenue figure. Ageing (share older than a year) needs the Auditor-General\'s annexes, not yet transcribed.' };
    if (r.gap) return rec({ ...base, inputs: [ledgerIn(s.id, 'pending')], result: null, gap_reason: r.gap });
    const inputs = [ledgerIn(s.id, 'pending'), ...r.inputs];
    const v = pct(sumM(inputs, ['pending']), sumM(inputs, ['revenue']));
    rec({ ...base, inputs, calc: { op: 'ratio_pct', numerator_roles: ['pending'], denominator_roles: ['revenue'], dp: 2 }, result: v, flags: vsThreshold('B5', v), notes: s.scope && !/executive and assembly/.test(s.scope) ? [`Stock scope: ${s.scope}.`] : [] });
  });
});

records.sort((a, b) => (a.family + a.calc_id < b.family + b.calc_id ? -1 : 1));
// A calculation has no page: derived_from names the records it is computed from (lib/derived-from.js).
records.forEach((r) => { r.derived_from = require('../lib/derived-from').derivedFrom(r); });
const counts = {};
records.forEach((r) => { const c = counts[r.family] || (counts[r.family] = { values: 0, gaps: 0 }); c[r.status === 'value' ? 'values' : 'gaps'] += 1; });
const out = {
  meta: {
    title: 'Siaya County: further analytical layers calculated from published figures (wage bill, development share, own-source revenue on three bases, department absorption, pending bills burden)',
    county: 'Siaya', county_code: 41, schema_version: '1.0', label: LABEL, generated_by: 'scripts/build-analysis-layers.js',
    rule: 'Every result is arithmetic on values already in the repository; each input names its dataset, record, value, unit, source and page, so a rejected input withholds the result (lib/review-status.js). Numerator and denominator come from the same document; series from different sources are never blended or averaged; a missing or non-comparable input gives a gap record with its reason. Thresholds are shown beside results as facts about the ratio, not verdicts.',
    families: {
      B1: 'Wage bill as a share of total revenue (Controller of Budget, own-year report), beside the 35 per cent ceiling; the Auditor-General\'s own ratios beside, separate',
      B2: 'Development share of the budget (programme-based budgets, the County Treasury\'s review, the Controller of Budget) and of actual spending, beside the 30 per cent floor',
      B3: 'Own-source revenue against target, in real terms (FY 2024/25 prices) and per person, one series per source; FY 2024/25 on cash and accrual bases',
      B4: 'Absorption by department: actual spending over the final budget, same CBROP table',
      B5: 'Pending bills as a share of total revenue (Controller of Budget, own-year report), beside the 20 per cent limit the Auditor-General applies; the auditor\'s ratio beside',
    },
    conventions: { money: 'KSh million unless the unit says otherwise; KSh inputs divided by 1,000,000 and KSh billion multiplied by 1,000.', rounding: 'Percentages and KSh million to 2 decimals; per-person KSh to whole shillings.', fiscal_year_matching: 'A calendar-year population for year Y is paired only with FY Y/Y+1; nothing is interpolated.', deflator: `data/cpi.json fiscal-year index; base FY ${CPI_BASE}.`, same_document: 'Readings of one measure in one document within 1 per cent are the same figure (the most precise is used, the others listed); more than 1 per cent apart gives a gap.' },
    review: 'Provisional: awaiting editorial review. A result is approved only when it and every input are approved (lib/review-status.js).',
    counts,
  },
  records,
};
const text = `${JSON.stringify(out, null, 1)}\n`;
if (process.argv.includes('--stdout')) process.stdout.write(text);
else { fs.writeFileSync(path.join(root, 'data', 'siaya-analysis-layers.json'), text); console.log('analysis layers:', JSON.stringify(counts)); }
