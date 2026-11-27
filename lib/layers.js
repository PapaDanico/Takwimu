// Siaya analytical layers B1 to B5 (data/siaya-analysis-layers.json), department budgets (data/siaya-budget-
// departments.json) and the county and audited series (data/siaya-county-series.json), prepared for the pages that
// show them: B1, B2, B4 and B5 on /counties/siaya/analysis/, B3 and the series comparison on /counties/siaya/ledger/,
// department budgets on /counties/siaya/departments/, and the brief. Every file is read through lib/review-status.js
// masked(), so a value rejected in editorial review is already null here. Nothing is filled, averaged or chosen
// between sources: each series stays separate and a missing value is a gap with its reason. Server and build only.
const rs = require('./review-status');

const LAY = rs.masked('siaya-analysis-layers');
const DEP = rs.masked('siaya-budget-departments');
const SER = rs.masked('siaya-county-series');

const fyOf = (r) => (String(r.period).match(/\d{4}\/\d{2}/) || [r.period])[0];
const uniq = (xs) => [...new Set(xs)];
const fam = (f) => LAY.records.filter((r) => r.family === f);
const years = (rs0) => uniq(rs0.map(fyOf)).sort();
const val = (r) => (r && r.status === 'value' && typeof r.result === 'number' ? r.result : null);
const lnum = (r) => Number((r.calc_id.match(/-L(\d+)$/) || [])[1] || 0);

// The threshold of a family and its legal source, as the data file words it (one per family).
const threshold = (f) => (fam(f).find((r) => r.threshold) || {}).threshold || null;
// The Auditor-General's own ratio, shown beside our result and never combined with it.
const oagBeside = (r) => (r.beside || []).filter((b) => b.role === 'auditor_reported');

// ---- B1: wage bill as a share of total revenue (Controller of Budget, own-year report) ----
function b1() {
  const rs0 = fam('B1');
  const ys = years(rs0);
  return {
    records: rs0, years: ys, threshold: threshold('B1'),
    series: [{ name: 'Wage bill, % of total revenue (Controller of Budget report for the year)', color: 1, values: ys.map((y) => val(rs0.find((r) => fyOf(r) === y))) }],
    above: rs0.filter((r) => r.flags && r.flags.above_ceiling).map(fyOf),
    valued: rs0.filter((r) => r.status === 'value').length,
    oag: rs0.flatMap((r) => oagBeside(r).map((b) => ({ fy: fyOf(r), calc_id: r.calc_id, ...b }))),
  };
}

// ---- B2: development share of the budget and of actual spending, by kind of document ----
const B2_KINDS = [
  ['budget-cob', 'Budget, Controller of Budget report', (id) => /-budget-cob-report-/.test(id)],
  ['budget-pbb', 'Budget, programme-based budget (original estimates)', (id) => /-budget-pbb-original/.test(id)],
  ['budget-pbb-supp', 'Budget, programme-based budget (supplementary)', (id) => /-budget-pbb-supplementary/.test(id)],
  ['budget-cbrop', 'Final budget, County Treasury review (CBROP)', (id) => /-budget-cbrop/.test(id)],
  ['actual-cob', 'Actual spending, Controller of Budget report', (id) => /-actual-cob-report-/.test(id)],
  ['actual-cbrop', 'Actual spending, County Treasury review (CBROP)', (id) => /-actual-cbrop$/.test(id)],
];
function b2() {
  const rs0 = fam('B2');
  const ys = years(rs0);
  const kindOf = (r) => (B2_KINDS.find(([, , t]) => t(r.calc_id)) || [])[0];
  const cell = (y, k) => rs0.filter((r) => fyOf(r) === y && kindOf(r) === k);
  // Chart: one line per kind of document; where a document gives two readings (with and without balances brought
  // forward) the chart leaves the year out and the table shows both.
  const one = (y, k) => { const c = cell(y, k).filter((r) => r.status === 'value'); return c.length === 1 ? c[0].result : null; };
  return {
    records: rs0, years: ys, kinds: B2_KINDS.map(([k, label]) => ({ k, label })), cell, threshold: threshold('B2'),
    series: [['budget-cob', 1, false], ['budget-pbb', 2, true], ['actual-cob', 3, false]].map(([k, color, dash]) => ({ name: B2_KINDS.find((x) => x[0] === k)[1], color, dash, values: ys.map((y) => one(y, k)) })),
    budgetBelow: uniq(rs0.filter((r) => /-budget-/.test(r.calc_id) && r.flags && r.flags.below_floor).map(fyOf)),
    budgetValued: uniq(rs0.filter((r) => /-budget-/.test(r.calc_id) && r.status === 'value').map(fyOf)),
  };
}

// ---- B3: own-source revenue against target, in real terms and per person, one series per source ----
const B3_SERIES = [
  ['cob', 'Controller of Budget reports'],
  ['cbrop', 'County Treasury review (CBROP)'],
  ['oag-table-2024', 'County Treasury table in the Auditor-General’s FY 2023/24 report'],
  ['oag-table-2025', 'County Treasury table in the Auditor-General’s FY 2024/25 report'],
  ['oag-cash-23-24', 'Auditor-General, audited statement FY 2023/24 (cash)'],
  ['oag-cash-24-25', 'Auditor-General, audited statement FY 2024/25 (cash)'],
  ['oag-cash', 'Auditor-General, audited statement FY 2024/25 (cash)'],
  ['oag-accrual', 'Auditor-General, audited statement FY 2024/25 (accrual)'],
];
function b3() {
  const rs0 = fam('B3');
  const ys = years(rs0);
  const parse = (r) => { const m = r.calc_id.match(/^SIA-B3-\d{4}-\d{2}-(perf|real|capita)-(.+)$/); return m ? { kind: m[1], series: m[2] } : {}; };
  const of = (kind, series, y) => rs0.find((r) => fyOf(r) === y && parse(r).kind === kind && parse(r).series === series);
  const line = (kind, series, color, dash) => ({ name: B3_SERIES.find((s) => s[0] === series)[1], color, dash, values: ys.map((y) => val(of(kind, series, y))) });
  return {
    records: rs0, years: ys, parse, of, SERIES: B3_SERIES,
    perfSeries: [line('perf', 'cob', 1, false), line('perf', 'cbrop', 2, true), line('perf', 'oag-table-2025', 3, false)],
    realSeries: [line('real', 'cob', 1, false), line('real', 'cbrop', 2, true), line('real', 'oag-table-2025', 3, false)],
  };
}

// ---- B4: absorption by department (actual over final budget, same CBROP table) ----
const DEPT_LABEL = Object.fromEntries(DEP.departments.map((d) => [d.code, d.label]));
DEPT_LABEL.TOTAL = 'Whole county (printed total)';
function b4() {
  const rs0 = fam('B4');
  const parse = (r) => { const m = r.calc_id.match(/^SIA-B4-(\d{4})-(\d{2})-(.+)-(\w+)$/); return { fy: `${m[1]}/${m[2]}`, dept: m[3], cls: m[4] }; };
  const ys = uniq(rs0.map((r) => parse(r).fy)).sort();
  const depts = uniq(rs0.map((r) => parse(r).dept)).sort((a, b) => (a === 'TOTAL') - (b === 'TOTAL') || DEPT_LABEL[a].localeCompare(DEPT_LABEL[b]));
  const get = (fy, dept, cls) => rs0.find((r) => { const p = parse(r); return p.fy === fy && p.dept === dept && p.cls === cls; });
  const latest = ys[ys.length - 1];
  const latestDev = depts.filter((d) => d !== 'TOTAL').map((d) => ({ dept: d, r: get(latest, d, 'development') })).filter((x) => x.r);
  return {
    records: rs0, years: ys, depts, get, parse, label: (c) => DEPT_LABEL[c] || c, latest,
    classes: ['development', 'recurrent', 'compensation', 'total'],
    latestChart: { labels: latestDev.map((x) => DEPT_LABEL[x.dept].split(/[,/(]/)[0].trim()), values: latestDev.map((x) => val(x.r)) },
    over100: rs0.filter((r) => r.flags && r.flags.above_100),
  };
}

// ---- B5: pending bills as a share of total revenue (Controller of Budget, own-year report) ----
function b5() {
  const rs0 = fam('B5');
  const ys = years(rs0);
  const basisOf = (r) => ((r.inputs || []).find((i) => i.role === 'pending') || {}).basis || '';
  const cross = (r) => /^Cross-county/.test(basisOf(r));
  // Two series that each report prints every year: the stock in the county chapter (the first one printed) and the
  // grand total of the cross-county pending bills table. Other readings are in the table only.
  const chapter = (y) => rs0.filter((r) => fyOf(r) === y && r.status === 'value' && !cross(r)).sort((a, b) => lnum(a) - lnum(b))[0];
  const table = (y) => rs0.find((r) => fyOf(r) === y && r.status === 'value' && cross(r));
  return {
    records: rs0, years: ys, threshold: threshold('B5'), basisOf, cross,
    series: [
      { name: 'Stock in the county chapter of the report', color: 1, values: ys.map((y) => val(chapter(y))) },
      { name: 'Grand total in the cross-county pending bills table', color: 2, dash: true, values: ys.map((y) => val(table(y))) },
    ],
    above: rs0.filter((r) => r.flags && r.flags.above_limit),
    oag: uniq(rs0.flatMap((r) => oagBeside(r).map((b) => JSON.stringify({ fy: fyOf(r), ...b })))).map((s) => JSON.parse(s)),
  };
}

// ---- Own-source revenue on three bases (data/siaya-county-series.json comparisons) ----
const SERIES_LABEL = {
  'controller-of-budget': 'Controller of Budget report',
  'county-cbrop': 'County Treasury review (CBROP, not audited)',
  'oag-ror-table': 'County Treasury table in an Auditor-General report (outside the audit opinion)',
  'oag-ror': 'Auditor-General, audited Receiver of Revenue statement',
};
function osrSeries() {
  const cmp = SER.comparisons;
  const cols = ['controller-of-budget', 'county-cbrop', 'oag-ror-table', 'oag-ror'];
  const ys = cmp.map((c) => c.fy);
  // Chart: one line per publisher; a year where one publisher prints two different figures is left off its line.
  const one = (c, s) => { const v = uniq(c.values.filter((x) => x.series === s).map((x) => x.value_ksh_m)); return v.length === 1 ? v[0] : null; };
  return {
    rows: cmp, cols, label: (s) => SERIES_LABEL[s] || s, years: ys, bases: SER.meta.bases,
    series: [['controller-of-budget', 1, false], ['county-cbrop', 2, true], ['oag-ror-table', 3, false], ['oag-ror', 4, true]].map(([s, color, dash]) => ({ name: SERIES_LABEL[s], color, dash, values: cmp.map((c) => one(c, s)) })),
    wide: cmp.filter((c) => c.spread_pct_of_smallest > 10),
  };
}
// A comparison cell's review key: "siaya-county-series:CS-..." or "history:osr:2013/14".
const refBadge = (ref) => { const i = String(ref || '').indexOf(':'); return i < 0 ? null : rs.badge(ref.slice(0, i), ref.slice(i + 1)); };

// ---- Department budgets (data/siaya-budget-departments.json) ----
function departments() {
  const obs = DEP.observations;
  const deptCodes = uniq(obs.map((o) => o.dept_code)).sort((a, b) => (a === 'TOTAL') - (b === 'TOTAL') || (DEPT_LABEL[a] || a).localeCompare(DEPT_LABEL[b] || b));
  // Programme-based budgets: one column per year, version and balance basis that prints a total by department.
  const pbbCols = uniq(obs.filter((o) => o.document_kind === 'PBB' && o.class === 'total').map((o) => `${o.fy}|${o.budget_version}|${o.includes_balance_bf}`)).sort();
  const pbb = (col, dept) => { const [fy, v, bf] = col.split('|'); return obs.find((o) => o.document_kind === 'PBB' && o.class === 'total' && o.fy === fy && o.budget_version === v && String(o.includes_balance_bf) === bf && o.dept_code === dept); };
  const cbropYears = (cls) => uniq(obs.filter((o) => o.document_kind === 'CBROP' && o.class === cls && o.measure === 'actual').map((o) => o.fy)).sort();
  const cbrop = (fy, dept, cls, measure) => obs.find((o) => o.document_kind === 'CBROP' && o.fy === fy && o.dept_code === dept && o.class === cls && o.measure === measure && (measure === 'actual' || o.budget_version === 'final'));
  const latestPbb = pbbCols.filter((c) => c.endsWith('|original|true') || c.endsWith('|original|false')).sort().pop();
  const latestRows = deptCodes.filter((d) => d !== 'TOTAL').map((d) => ({ dept: d, o: pbb(latestPbb, d) })).filter((x) => x.o);
  // The crosswalk, grouped by code: every printed name with the years it appears.
  const cross = deptCodes.filter((d) => d !== 'TOTAL').map((d) => ({ code: d, label: DEPT_LABEL[d] || d, names: DEP.crosswalk.filter((c) => c.code === d), note: (DEP.crosswalk.find((c) => c.code === d && c.comparability) || {}).comparability || '' }));
  const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
  const flaggedSums = DEP.sum_checks.filter((c) => c.status !== 'adds').map((c) => ({ ...c, total: byId[c.total_id] }));
  const flaggedRows = DEP.row_checks.filter((c) => c.status !== 'adds').map((c) => ({ ...c, total: byId[c.total_id], rec: byId[c.recurrent_id], dev: byId[c.development_id] }));
  return {
    meta: DEP.meta, obs, deptCodes, label: (c) => DEPT_LABEL[c] || c, pbbCols, pbb, cbropYears, cbrop, latestPbb, latestRows, cross,
    unmatched: DEP.unmatched, flaggedSums, flaggedRows, sources: DEP.sources, gaps: DEP.meta.gaps,
    flaggedIds: new Set([...flaggedSums, ...flaggedRows].filter((c) => c.status === 'does not add').map((c) => c.total_id)),
    sumChecks: DEP.sum_checks.length, rowChecks: DEP.row_checks.length,
  };
}

const gaps = () => ({
  layers: LAY.records.filter((r) => r.status === 'gap').length,
  departments: DEP.meta.gaps.length,
  series: SER.meta.gaps.length,
});

module.exports = { LAY, DEP, SER, fyOf, b1, b2, b3, b4, b5, osrSeries, refBadge, departments, gaps, DEPT_LABEL, SERIES_LABEL };
