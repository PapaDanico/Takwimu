// The five report templates as data. Each builder returns sections made of blocks; every number is a fig
// (see model.js) or a count of records listed in the same report. Findings and interpretation are kept in
// separate blocks so the renderer can print them under separate headings. No contractor names, no personal data.
import {
  DATA, P, get, find, each, fig, registry, snapshot, dataDate, ECON_SRC, source, held,
} from './model';
import { badge } from '../../lib/review-status';
import { CATEGORY as AUDIT_CATEGORY } from '../../lib/audits';
import { latestOpinion, smallCountSentence } from './rules';
import { MOVED_ANCHORS } from '../../lib/analysis-topics';

const L = DATA['siaya-fiscal-ledger.json'];
const ECON = DATA['siaya-economy.json'];
const HEALTH = DATA['siaya-health.json'];
const EDU = DATA['siaya-education.json'];
const AGRI = DATA['siaya-agriculture.json'];
const CLIM = DATA['siaya-climate.json'];
const PROJ = DATA['siaya-projects.json'];
const GOV = DATA['siaya-governance.json'];
const PROG = DATA['siaya-programmes.json'];
const AUD = DATA['siaya-audits.json'];
const AN = DATA['siaya-analysis.json'];
const HIST = DATA['history.json'];
const COB = DATA['counties-cob.json'];
const LAY = DATA['siaya-analysis-layers.json'];
const SER = DATA['siaya-county-series.json'];

const FYS = L.years;
const fyLabel = (fy) => (fy ? `FY ${fy}` : fy);
const words = (s) => String(s || '').replace(/_/g, ' ');
const cap = (s) => { const w = words(s); return w.charAt(0).toUpperCase() + w.slice(1); };
// Reader terminology (UX sweep U4): "share of budget spent (absorption rate)", never "execution rate"; "own-source
// revenue", never "OSR" (quoted source table names keep their wording: notes are not passed through this).
const term = (t) => String(t || '').replace(/\bexecution rate\b/gi, (m) => (m[0] === 'E' ? 'Share of budget spent (absorption rate)' : 'share of budget spent (absorption rate)')).replace(/\bOSR\b/g, 'own-source revenue');
const minConf = (xs) => { const n = xs.map((x) => x && x.confidence).filter((c) => typeof c === 'number'); return n.length ? Math.min(...n) : null; };
const obsAt = (file, arrPath, id) => { const hit = each(file, arrPath, (o) => o.id === id)[0]; return hit ? { file, ptr: hit[1], rec: hit[0] } : null; };

// Canonical topic pages (UX sweep U1/U6): each report section cites the site page that holds the full series.
const TOPIC = {
  people: { href: '/counties/siaya/people/', label: 'Siaya people (population, poverty, demographics)' },
  economy: { href: '/counties/siaya/economy/', label: 'Siaya economy' },
  analysis: { href: '/counties/siaya/analysis/', label: 'Siaya fiscal analysis (share of budget spent, pending bills, real per-capita spending)' },
  ledger: { href: '/counties/siaya/ledger/', label: 'Siaya fiscal ledger (every source value, own-source revenue)' },
  audits: { href: '/counties/siaya/audits/', label: 'Siaya audits' },
  projects: { href: '/counties/siaya/projects/', label: 'Siaya project register' },
  health: { href: '/counties/siaya/health/', label: 'Siaya health' },
  education: { href: '/counties/siaya/education/', label: 'Siaya education' },
  agriculture: { href: '/counties/siaya/agriculture/', label: 'Siaya agriculture and fisheries' },
  climate: { href: '/counties/siaya/climate/', label: 'Siaya climate, water and environment' },
  wards: { href: '/counties/siaya/wards/', label: 'Siaya wards and sub-counties' },
  governance: { href: '/counties/siaya/governance/', label: 'Siaya governance' },
  programmes: { href: '/counties/siaya/programmes/', label: 'Siaya programmes (NGO, CSO and donor)' },
  compare: { href: '/compare/', label: 'Compare counties' },
};
const topics = (...keys) => keys.map((k) => TOPIC[k]);
export { TOPIC };

// ---------- Figure builders, one per data file shape ----------
const ledgerFig = (o, ptr) => fig('siaya-fiscal-ledger.json', `${ptr}/value`, {
  label: L.measures[o.measure].label, period: fyLabel(o.fy),
  notes: [o.budget_version ? `Budget version: ${o.budget_version}` : null, o.scope ? `Scope: ${o.scope}` : null, o.read_method ? `Read: ${o.read_method}` : null],
});
const ledgerRows = (measure) => each('siaya-fiscal-ledger.json', '/observations', (o) => o.measure === measure)
  .sort((a, b) => FYS.indexOf(a[0].fy) - FYS.indexOf(b[0].fy))
  .map(([o, ptr]) => ({ f: ledgerFig(o, ptr) }));
// One value per year for a chart: the first Controller of Budget value, in KSh million.
const ledgerSeries = (measure) => FYS.map((fy) => {
  const hit = each('siaya-fiscal-ledger.json', '/observations', (o) => o.measure === measure && o.fy === fy && o.source_kind === 'controller_of_budget')[0];
  if (!hit) return null;
  const [o, ptr] = hit;
  return { ...ledgerFig(o, ptr), scale: o.unit === 'KSh billion' ? 1000 : 1 };
});

const healthFig = (o, ptr, extra = {}) => fig('siaya-health.json', `${ptr}/value`, {
  label: `${o.label}${o.age_group ? ` (${o.age_group})` : ''}${o.geography_detail ? `, ${o.geography_detail}` : ''}`,
  notes: [o.method, o.status, o.sentinel_site ? 'Sentinel site: not county-representative' : null],
  suppressSmall: true, ...extra,
});
const healthRows = (pred) => each('siaya-health.json', '/observations', pred).map(([o, ptr]) => ({ f: healthFig(o, ptr) }));

const econFig = (o, ptr, label) => fig('siaya-economy.json', `${ptr}/value`, {
  label: label || `${o.indicator === 'gcp_total' ? 'Gross County Product' : cap(o.indicator)}${o.sector_label ? `: ${o.sector_label}` : ''} (${words(o.price_basis)} prices, ${o.vintage})`,
  source: ECON_SRC[o.vintage], notes: [o.table, o.provisional ? 'KNBS marks the year provisional' : null],
});

const eduFig = (o, ptr) => fig('siaya-education.json', `${ptr}/value`, {
  label: `${cap(o.indicator)}${o.level ? `, ${o.level}` : ''}${o.sex && o.sex !== 'total' ? `, ${o.sex}` : ''}${o.sector && o.sector !== 'all' ? `, ${o.sector}` : ''}`,
  notes: [o.table, o.value_type === 'unclear' ? null : o.value_type],
  // D21: a value the file marks "unclear" (cidp-ecde-enrol-end equals the plan's projected 3-5 population, case
  // edu-c07) is never printed as an enrolment.
  ...(o.value_type === 'unclear' ? { display: 'Unclear: equals the projected 3-5 population; not shown as enrolment' } : {}),
});
const agriFig = (o, ptr) => fig('siaya-agriculture.json', `${ptr}/value`, {
  label: `${cap(o.indicator)}${o.commodity ? `: ${words(o.commodity)}` : ''}${o.status === 'target' ? ' (target)' : ''}`,
  unit: words(o.unit), notes: [o.table],
});
const climFig = (o, ptr) => fig('siaya-climate.json', `${ptr}/value`, {
  label: `${cap(o.measure)}${o.geography ? `, ${o.geography}` : ''}${o.area_as_printed ? ` (${o.area_as_printed})` : ''}`, note: o.definition || o.table,
});
// A calculation carries the page of its first input and the lowest confidence of its inputs (D9).
const analysisFig = (r, ptr) => fig('siaya-analysis.json', `${ptr}/result`, {
  label: term(r.title), source: r.source_ids[0], page: r.inputs[0] ? r.inputs[0].pdf_page : null, printed: r.inputs[0] ? r.inputs[0].printed_page : null,
  confidence: minConf(r.inputs), notes: [term(r.label), `Formula: ${r.formula}`, 'Confidence: the lowest of its inputs'],
});
// Layers B1 to B5 (data/siaya-analysis-layers.json): like analysisFig, with the threshold and its legal source.
const LAYF = 'siaya-analysis-layers.json';
const layerFig = (r, ptr) => fig(LAYF, `${ptr}/result`, {
  label: term(r.title), source: r.source_ids[0], page: r.inputs[0] ? r.inputs[0].pdf_page : null, printed: r.inputs[0] ? r.inputs[0].printed_page : null,
  confidence: minConf(r.inputs), notes: [term(r.label), `Formula: ${r.formula}`, r.threshold ? `Reference: ${r.threshold.value} per cent ${r.threshold.kind}. ${r.threshold.rule}` : null, 'Confidence: the lowest of its inputs'],
});
const layerRows = (pred) => each(LAYF, '/records', (r) => pred(r) && r.status === 'value').map(([r, ptr]) => ({ f: layerFig(r, ptr) }));
const layerFy = (r) => (String(r.period).match(/\d{4}\/\d{2}/) || [''])[0];
// One figure per fiscal year for a chart: the first record of the year that passes pred (null for a gap).
const layerSeries = (pred) => FYS.map((fy) => { const hit = each(LAYF, '/records', (r) => r.status === 'value' && layerFy(r) === fy && pred(r))[0]; return hit ? layerFig(hit[0], hit[1]) : null; });
const layerGaps = () => LAY.records.filter((r) => r.status === 'gap').map((r) => ({ topic: r.title, reason: r.gap_reason }));
// The Auditor-General's own ratio, shown beside a layer result (a finding title in data/siaya-audits.json).
const oagRatioRows = (family) => {
  const ids = [...new Set(LAY.records.filter((r) => r.family === family).flatMap((r) => (r.beside || []).filter((b) => b.role === 'auditor_reported').map((b) => (b.record.match(/id=([^\]]+)/) || [])[1])).filter(Boolean))];
  return ids.map((id) => { const i = AUD.findings.findIndex((f) => f.id === id); const f = AUD.findings[i]; const op = AUD.opinions.find((o) => o.doc_id === f.doc_id);
    return { f: fig('siaya-audits.json', P('findings', i, 'title'), { label: 'Auditor-General’s own ratio, as the auditor reports it (its own denominator)', unit: 'text', period: fyLabel(f.fy), source: f.doc_id, page: f.page, confidence: op && typeof op.confidence === 'number' ? op.confidence : 'as printed', rec: f }) }; });
};
// County and audited series (data/siaya-county-series.json): own-source revenue by publisher, KSh, charted in millions.
const SERF = 'siaya-county-series.json';
const SER_LABEL = { 'county-cbrop': 'County Treasury review (CBROP)', 'oag-ror-table': 'County Treasury table in an Auditor-General report', 'oag-ror': 'Auditor-General audited statement' };
const serFig = (o, ptr) => fig(SERF, `${ptr}/value`, { label: `${SER_LABEL[o.series] || o.series}: ${words(o.measure)}`, period: fyLabel(o.fy), notes: [o.basis, o.table, o.read_method ? `Read: ${o.read_method}` : null] });
const serRows = (pred) => each(SERF, '/observations', pred).sort((a, b) => a[0].fy.localeCompare(b[0].fy)).map(([o, ptr]) => ({ f: serFig(o, ptr) }));
const serSeries = (pred) => FYS.map((fy) => { const hit = each(SERF, '/observations', (o) => o.fy === fy && pred(o))[0]; return hit ? { ...serFig(hit[0], hit[1]), scale: 1e-6 } : null; });

// Web edition: a Takwimu calculation (data/siaya-analysis.json family A<n>) is shown in full, with formula and inputs,
// on Siaya analysis; the report's web page links there (components/report/web.js).
const ANALYSIS_HOME = (n, label) => ({ href: MOVED_ANCHORS[`an-${n}`], label: `Siaya analysis, ${label}` });
const analysisRows = (pred) => each('siaya-analysis.json', '/records', (r) => pred(r) && r.status === 'value').map(([r, ptr]) => ({ f: analysisFig(r, ptr) }));
const analysisGaps = (pred) => each('siaya-analysis.json', '/records', (r) => pred(r) && r.status === 'gap')
  .map(([r]) => ({ topic: r.title, reason: r.gap_reason, file: 'siaya-analysis.json' }));

const progAmountFig = (p, i, a, j) => fig('siaya-programmes.json', P('programmes', i, 'amounts', j, 'value'), {
  rec: a, label: `${p.title}: ${words(a.kind)}${a.pooled ? ' (pooled total, not a Siaya figure)' : ''}`,
  unit: a.currency, period: a.period, source: a.source && a.source.source_id, page: a.source && a.source.page,
  confidence: `tier ${p.tier}`, notes: [a.scope ? `Scope: ${words(a.scope)}` : null, a.note],
});
const progFig = (ptr, label, o = {}) => fig('siaya-programmes.json', ptr, { label, source: 'Takwimu programme atlas summary (data/siaya-programmes.json)', confidence: 'compiled count', ...o });

const auditOpinionRows = () => each('siaya-audits.json', '/opinions').map(([o, ptr]) => ({
  f: fig('siaya-audits.json', `${ptr}/opinion`, { label: `Audit opinion, ${words(o.entity)}`, period: fyLabel(o.fy), notes: [o.opinion_note || (o.history ? `Matches earlier record: ${o.history}` : '')] }),
}));

// Conflict groups: an id list resolved against an observation array, all values shown together.
const groupFigs = (file, ids, mk) => ids.map((id) => {
  const hit = each(file, '/observations', (o) => o.id === id)[0];
  return hit ? mk(hit[0], hit[1]) : null;
}).filter(Boolean);
const healthConflicts = () => HEALTH.conflicts.map((c) => ({ topic: c.measure, note: c.note, figs: groupFigs('siaya-health.json', c.observation_ids, healthFig) }));
const eduConflicts = () => EDU.conflicts.map((c) => ({ topic: `${c.id}: ${words(c.type)}`, note: `${c.description} Handling: ${c.handling}`, figs: groupFigs('siaya-education.json', c.observations, eduFig) }));
const agriConflicts = () => AGRI.conflicts.map((c) => ({ topic: c.topic, note: c.note, figs: groupFigs('siaya-agriculture.json', c.values, agriFig) }));
const climConflicts = () => CLIM.comparisons.map((c) => ({ topic: c.topic, note: c.note, figs: groupFigs('siaya-climate.json', c.observation_ids, climFig) }));
// D9: each side of a pair carries the page and confidence of the observation it repeats.
const fromObs = (h) => (h ? { obs: { file: h.file, ptr: h.ptr }, page: h.rec.pdf_page ?? h.rec.page_pdf ?? h.rec.page, printed: h.rec.printed_page ?? h.rec.page_printed, confidence: h.rec.confidence } : {});
const econRevisions = (pred = () => true) => each('siaya-economy.json', '/revisions', pred).map(([r, ptr]) => {
  const ea = obsAt('siaya-economy.json', '/observations', r.earlier_id);
  const la = obsAt('siaya-economy.json', '/observations', r.later_id);
  return {
    label: `${r.indicator === 'gcp_total' ? 'Gross County Product' : cap(r.indicator)}${r.sector ? `: ${words(r.sector)}` : ''} (${words(r.price_basis)})`,
    period: r.period,
    a: fig('siaya-economy.json', `${ptr}/earlier_value`, { label: r.earlier_vintage, source: ECON_SRC[r.earlier_vintage], period: r.period, ...fromObs(ea) }),
    b: fig('siaya-economy.json', `${ptr}/later_value`, { label: r.later_vintage, source: ECON_SRC[r.later_vintage], period: r.period, ...fromObs(la) }),
    diff: fig('siaya-economy.json', `${ptr}/difference_pct`, { unit: '%', label: 'Revision', period: r.period, source: ECON_SRC[r.later_vintage], confidence: minConf([ea && ea.rec, la && la.rec]) }),
  };
});
const ledgerPairs = (pred = () => true) => each('siaya-fiscal-ledger.json', '/discrepancies', pred).map(([d, ptr]) => {
  const oa = obsAt('siaya-fiscal-ledger.json', '/observations', d.claim_a.observation_id);
  const ob = obsAt('siaya-fiscal-ledger.json', '/observations', d.claim_b.observation_id);
  return {
    label: L.measures[d.indicator_id] ? L.measures[d.indicator_id].label : d.indicator_id,
    period: d.period,
    a: fig('siaya-fiscal-ledger.json', `${ptr}/claim_a/value_ksh_m`, { unit: 'KSh million', period: d.period, source: d.source_a.source_id, ...fromObs(oa), page: d.source_a.pdf_page ?? (oa && oa.rec.pdf_page) }),
    b: fig('siaya-fiscal-ledger.json', `${ptr}/claim_b/value_ksh_m`, { unit: 'KSh million', period: d.period, source: d.source_b.source_id, ...fromObs(ob), page: d.source_b.pdf_page ?? (ob && ob.rec.pdf_page) }),
    diff: fig('siaya-fiscal-ledger.json', `${ptr}/difference/pct_of_smaller`, { unit: '% of the smaller value', period: d.period, source: d.source_b.source_id, page: d.source_b.pdf_page, confidence: minConf([oa && oa.rec, ob && ob.rec]) }),
    note: (d.possible_basis_mismatch || []).join(' '),
    id: d.case_id, // not printed; the web edition checks that the ledger page holds the case
  };
});

// Gap lists, kept as each file words them.
const GAPS = {
  'siaya-health.json': () => HEALTH.gaps.map((g) => ({ topic: g.measure, reason: `${g.reason} Next step: ${g.next_step}` })),
  'siaya-education.json': () => EDU.gaps.map((g) => ({ topic: g.indicator, reason: g.reason })),
  'siaya-agriculture.json': () => AGRI.gaps.map((g) => ({ topic: g.item, reason: g.reason })),
  'siaya-climate.json': () => CLIM.gaps.map((g) => ({ topic: g.topic, reason: g.reason })),
  'siaya-economy.json': () => ECON.gaps.map((g) => ({ topic: `${cap(g.indicator)} (${g.vintage}, ${g.period})`, reason: g.reason })),
  'siaya-audits.json': () => AUD.gaps.map((g) => ({ topic: `Audit, ${words(g.entity)}, FY ${g.fy}: ${g.status}`, reason: g.reason })),
  'siaya-programmes.json': () => PROG.gaps.map((g) => ({ topic: `${g.topic} (${g.status})`, reason: g.detail })),
  'siaya-projects.json': () => PROJ.gaps.map((g) => ({ topic: 'Project register', reason: typeof g === 'string' ? g : JSON.stringify(g) })),
  'siaya-fiscal-ledger.json': () => Object.entries(L.completeness).flatMap(([m, ys]) => Object.entries(ys).filter(([, c]) => c.missing)
    .map(([fy, c]) => ({ topic: `${L.measures[m].label}, FY ${fy}`, reason: c.reason || 'No value held.' }))),
  'siaya-analysis-layers.json': () => layerGaps(),
  'siaya-county-series.json': () => SER.meta.gaps.map((g) => ({ topic: `${SER_LABEL[g.series] || g.series}, FY ${g.fy}`, reason: g.reason })),
  'history.json': () => (HIST.meta.gaps || []).map((g) => (typeof g === 'string' ? { topic: 'Ten-year history', reason: g } : { topic: g.item || g.topic || g.series || 'Ten-year history', reason: g.reason || g.note || JSON.stringify(g) })),
};
const gapsOf = (files) => files.filter((f) => GAPS[f]).flatMap((f) => GAPS[f]().map((g) => ({ ...g, file: f })));

// Project rows: name, sector, status and its source; no contractor field is read.
const projectRows = (pred) => PROJ.projects.map((p, i) => [p, i]).filter(([p]) => pred(p)).map(([p, i]) => {
  const budget = p.amounts.map((a, j) => [a, j]).filter(([a]) => /budget|contract_sum|estimate/.test(a.kind)).pop();
  // D9: the grade of the evidence entry for the same document and page.
  const evConf = (doc, page) => { const e = (p.evidence || []).find((x) => x.doc_id === doc && x.page === page) || (p.evidence || []).find((x) => x.doc_id === doc); return e ? e.confidence : null; };
  const ss = p.status_source || {};
  return [
    p.id, p.name, words(p.sector),
    fig('siaya-projects.json', P('projects', i, 'status'), { label: 'Status', source: ss.doc_id, page: ss.page, period: p.last_evidence_date, confidence: evConf(ss.doc_id, ss.page) }),
    budget ? fig('siaya-projects.json', P('projects', i, 'amounts', budget[1], 'value'), { rec: budget[0], label: words(budget[0].kind), unit: budget[0].unit, period: fyLabel(budget[0].fy), source: budget[0].doc_id, page: budget[0].page, confidence: evConf(budget[0].doc_id, budget[0].page) }) : 'None held',
  ];
});
const PROJECT_COLS = ['ID', 'Project (as printed)', 'Sector', 'Status (evidence)', 'Latest budget or contract amount'];

// ---------- Report A: Evidence Compendium ----------
function reportA() {
  const pop = each('history.json', '/population/points').map(([p, ptr]) => fig('history.json', `${ptr}/value`, {
    label: `Population (${p.kind})`, period: String(p.year), unit: 'persons', source: p.source || 'KNBS census and county plans (as reproduced in the county plans)', note: p.note || p.kind,
  }));
  const gcpYears = ['2020', '2021', '2022', '2023', '2024'];
  const gcpS = (vintage, basis) => gcpYears.map((y) => {
    const h = each('siaya-economy.json', '/observations', (o) => o.indicator === 'gcp_total' && o.vintage === vintage && o.price_basis === basis && o.period === y)[0];
    return h ? econFig(h[0], h[1]) : null;
  });
  const shares = each('siaya-economy.json', '/observations', (o) => o.indicator === 'share_of_county_gva_total' && o.vintage === 'GCP2025').map(([o, p]) => ({ f: econFig(o, p) }));
  const latestBudget = ledgerSeries('budget_total');
  const latestSpend = ledgerSeries('expenditure_total');
  const osr = ledgerSeries('osr_total_actual');
  const pend = ledgerSeries('pending_bills_close');
  const lastI = FYS.indexOf('2024/25');
  const opinions = auditOpinionRows();
  const census2019 = pop.find((f) => f.period === '2019');
  const gcp24 = gcpS('GCP2025', 'current')[4];
  const kdhs = each('siaya-health.json', '/observations', (o) => o.source_id && /^KDHS/.test(o.source_id));
  const hazards = each('siaya-climate.json', '/observations', (o) => /pcra-ward-(flood|drought)/.test(o.series));
  const sum = PROG.summary;
  return [
    { id: 'summary', title: 'Executive summary', topics: topics('economy', 'ledger', 'audits', 'programmes'), findings: [
      { type: 'list', items: [
        ['Population at the 2019 census: ', census2019, ' (KNBS, as reproduced in the county plan). Projections are listed separately and are not census counts.'],
        ['Gross County Product in 2024 at current prices: ', gcp24, ' (KNBS GCP 2025; KNBS marks 2024 provisional).'],
        ['Approved budget for FY 2024/25 as the Controller of Budget reports it: ', latestBudget[lastI], '; total expenditure in the same report: ', latestSpend[lastI], '.'],
        ['Own-source revenue for FY 2024/25 in the Controller of Budget report: ', osr[lastI], '. Other documents give different totals for the same year; all are listed in section 3 and in Report B.'],
        ['Latest audit opinion held for the County Executive: ', opinions[latestOpinion(AUD.opinions, 'county_executive')].f, '.'],
        ['Programme records in the partner atlas: ', progFig('/summary/record_count', 'Programme records', { unit: 'records' }), ', of which ', progFig('/summary/by_geography_class/siaya_specific', 'Siaya-specific records', { unit: 'records' }), ' are Siaya-specific.'],
      ] },
    ], interpretation: [
      'The documents held describe a county whose budget is financed mostly by national transfers, with a large and disputed pending-bills stock and repeated audit findings. Service indicators come from surveys and plans of different vintages, so they show direction more reliably than levels.',
    ] },
    { id: 'demography', title: 'Demographics and economy', topics: topics('people', 'wards'), findings: [
      { type: 'figs', caption: 'Population: census counts and official projections (projections are not counts)', rows: pop.map((f) => ({ f })) },
      { type: 'chart', kind: 'line', title: 'Gross County Product, KSh million, by price basis (KNBS GCP 2025)', unit: 'KSh million', labels: gcpYears,
        series: [{ name: 'Current prices', figs: gcpS('GCP2025', 'current') }, { name: 'Constant 2016 prices', figs: gcpS('GCP2025', 'constant_2016') }] },
      { type: 'figs', caption: 'Share of the sum of county gross value added (not a share of GDP; see data gaps)', rows: shares },
      { type: 'pairs', caption: 'Gross County Product revisions between the 2024 and 2025 editions (both kept)', aLabel: 'GCP 2024 edition', bLabel: 'GCP 2025 edition', rows: econRevisions((r) => r.indicator === 'gcp_total') },
    ], interpretation: [
      'KNBS revises earlier years in each edition; the two editions are kept side by side and the later one is used only where a single series is needed. A share of county GVA is not a share of national GDP.',
    ] },
    { id: 'finance', title: 'Public finance', topics: topics('analysis', 'ledger'), findings: [
      { type: 'chart', kind: 'column', title: 'Approved budget and total expenditure, KSh million (Controller of Budget reports)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Approved budget', figs: latestBudget }, { name: 'Total expenditure', figs: latestSpend }] },
      { type: 'chart', kind: 'line', title: 'Own-source revenue and closing pending bills, KSh million (Controller of Budget reports)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Own-source revenue', figs: osr }, { name: 'Pending bills at year end', figs: pend }] },
      { type: 'p', text: 'Every source value for these measures, the open discrepancy cases and the audit evidence are in Report B (Fiscal Accountability and Budget Execution).' },
    ], interpretation: [
      'Spending has stayed below the approved budget in every year held. Own-source revenue remains small beside the budget. The pending-bills stock depends on which document and which date is used.',
    ] },
    { id: 'health', title: 'Health', topics: topics('health'), findings: [
      { type: 'figs', caption: 'Household survey indicators (KDHS 2014 and 2022): sample estimates without confidence intervals', rows: kdhs.map(([o, p]) => ({ f: healthFig(o, p) })) },
      { type: 'p', text: 'Disease burden, staffing, community health units and conflicting HIV estimates are in Report C.' },
    ], interpretation: ['Survey indicators for maternal care improved between the two surveys. They are samples, so small changes should not be over-read.'] },
    { id: 'education', title: 'Education', topics: topics('education'), findings: [
      { type: 'figs', home: TOPIC.education, caption: 'Enrolment and teachers (Ministry of Education booklets, KNBS abstracts and county plan)', rows: each('siaya-education.json', '/observations', (o) => /^(primary_enrolment|secondary_enrolment|pre_primary_enrolment|gross_enrolment_rate|net_enrolment_rate|pupil_teacher_ratio)$/.test(o.indicator) && (!o.sex || o.sex === 'total')).map(([o, p]) => ({ f: eduFig(o, p) })) },
      { type: 'conflicts', caption: 'Education: inconsistencies kept side by side', groups: eduConflicts() },
    ], interpretation: ['Pre-primary education is devolved to the county; primary and secondary are national functions, so county budgets explain only the pre-primary and vocational figures.'] },
    { id: 'agriculture', title: 'Agriculture and fisheries', topics: topics('agriculture'), findings: [
      { type: 'figs', home: TOPIC.agriculture, caption: 'Crop production, fish landings and aquaculture as printed', rows: each('siaya-agriculture.json', '/observations', (o) => /^(production|fish_landed_quantity|aquaculture_quantity|fish_production)$/.test(o.indicator)).map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'conflicts', caption: 'Agriculture: conflicting values', groups: agriConflicts() },
    ], interpretation: ['Production figures come from two sources ten years apart with different units; they are not a trend.'] },
    { id: 'climate', title: 'Climate, water and environment', topics: topics('climate'), findings: [
      { type: 'figs', caption: 'Water and sanitation coverage (each figure uses its own definition)', rows: each('siaya-climate.json', '/observations', (o) => o.kind === 'coverage').map(([o, p]) => ({ f: climFig(o, p) })) },
      { type: 'conflicts', caption: 'Water access: figures with different definitions', groups: climConflicts() },
    ], interpretation: ['Water access ranges widely because the documents measure different things (households, population, utility service areas).'] },
    { id: 'infrastructure', title: 'Infrastructure and project delivery', topics: topics('projects'), findings: [
      { type: 'records', caption: 'Projects with an Auditor-General finding (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => p.audit_finding_ids.length) },
    ], interpretation: ['Status is the latest status any document records; only one project has independent verification of completion.'] },
    { id: 'governance', title: 'Governance and audit', topics: topics('governance', 'audits'), findings: [
      { type: 'figs', caption: 'County Budget Transparency Survey (IBP Kenya)', rows: GOV.ibp_cbts.editions.flatMap((e, i) => e.items.map((it, j) => [it, j]).filter(([, j]) => typeof held('siaya-governance.json', P('ibp_cbts', 'editions', i, 'items', j, 'value')) === 'number').map(([it, j]) => ({ f: fig('siaya-governance.json', P('ibp_cbts', 'editions', i, 'items', j, 'value'), { label: `${it.measure} (${it.edition})`, period: String(it.year), confidence: it.confidence }) }))) },
      { type: 'figs', home: TOPIC.audits, caption: 'Auditor-General opinions', rows: opinions },
    ], interpretation: ['Transparency scores are document-availability scores, not measures of budget quality. Audit opinions describe the accounts, not individuals.'] },
    { id: 'partners', title: 'NGO, CSO and donor ecosystem', topics: topics('programmes'), findings: [
      { type: 'figs', caption: 'Programme records by geography and evidence type', rows: [
        ...Object.keys(sum.by_geography_class).map((k) => ({ f: progFig(P('summary', 'by_geography_class', k), `Records: ${words(k)}`, { unit: 'records' }) })),
        ...Object.keys(sum.by_evidence_type).map((k) => ({ f: progFig(P('summary', 'by_evidence_type', k), `Records: ${words(k)}`, { unit: 'records' }) })),
      ] },
      { type: 'p', text: 'Report E lists every programme record. Multi-county and national totals are never attributed to Siaya.' },
    ], interpretation: ['Most programme records are self-reported by the implementer; few have an independent evaluation.'] },
    { id: 'wards', title: 'Ward and sub-county disparities', topics: topics('wards', 'health', 'climate'), findings: [
      { type: 'figs', caption: 'People per health worker by sub-county, 2022 (county plan)', rows: healthRows((o) => /^population-per-/.test(o.measure)) },
      { type: 'records', caption: 'Wards where the 2023 climate risk assessment prints a flood or drought hotspot', columns: ['Ward', 'Hazard listed', 'Hotspots as printed'],
        rows: hazards.map(([o, p]) => [o.ward_register_name || o.area_as_printed, o.measure, fig('siaya-climate.json', `${p}/hotspots_as_printed`, { label: o.measure, period: o.period, confidence: o.confidence })]) },
    ], interpretation: ['Staffing ratios differ several-fold between sub-counties. Hazard lists are ward participation outputs, not measured risk.'] },
    { id: 'opportunities', title: 'Investment opportunities', topics: topics('economy', 'agriculture'), findings: [
      { type: 'p', text: 'Report D sets out the evidence on sectors, service gaps and infrastructure constraints. No returns, market sizes or project financials are estimated because none is published in the documents held.' },
    ], interpretation: ['Sectors with a large share of county output and visible service gaps are candidates for further study, not investment recommendations.'] },
  ];
}

// Reader labels for the Controller of Budget 47-county table fields (counties-cob.json meta.fields words them tersely).
const COB_LABEL = {
  approved_budget_total: 'budget estimates total (recurrent and development)', expenditure_total: 'total expenditure',
  total_osr_actual: 'own-source revenue, actual (including facility improvement fund and appropriations-in-aid)',
  overall_absorption_pct: 'share of budget spent (absorption rate), overall, as printed', pb_grand_total: 'pending bills at year end, County Executive and County Assembly',
};

// ---------- Report B: Fiscal Accountability ----------
function reportB() {
  const series = (m) => ledgerSeries(m);
  const execRows = analysisRows((r) => r.family === 'A3');
  const transferRows = analysisRows((r) => r.family === 'A2');
  const pendingRows = analysisRows((r) => r.family === 'A4');
  const siayaCob = COB.years.flatMap((y, yi) => {
    const ci = y.counties.findIndex((c) => c.slug === 'siaya');
    const c = y.counties[ci];
    return ['approved_budget_total', 'expenditure_total', 'total_osr_actual', 'overall_absorption_pct', 'pb_grand_total'].filter((k) => c[k] && c[k].value !== undefined).flatMap((k) => {
      const mk = (base, label) => {
        const rec = base.includes('total_row') ? y.total_row[k] : c[k];
        return fig('counties-cob.json', `${base}/${k}/value`, {
          label, period: fyLabel(y.fy), source: y.source_id, rec, note: rec.table,
          confidence: rec.read === 'ocr' ? `OCR${rec.ocr_conf != null ? ` (score ${rec.ocr_conf})` : ''}` : (rec.read || 'not graded'),
        });
      };
      const out = [{ f: mk(P('years', yi, 'counties', ci), `Siaya: ${COB_LABEL[k]}`) }];
      if (y.total_row && y.total_row[k] && y.total_row[k].value !== undefined) out.push({ f: mk(P('years', yi, 'total_row'), `All 47 counties: ${COB_LABEL[k]}`) });
      return out;
    });
  });
  // Layers B1 to B5 (27 Nov 2026): wage bill, development share, own-source revenue by publisher, department
  // absorption and pending bills burden, each beside its threshold and the Auditor-General's own ratio.
  const fam = (f) => LAY.records.filter((r) => r.family === f);
  const valued = (f) => fam(f).filter((r) => r.status === 'value');
  const b1Above = valued('B1').filter((r) => r.flags.above_ceiling).length;
  const b2Act = valued('B2').filter((r) => /-actual-cob-report-/.test(r.calc_id));
  const b2Bud = valued('B2').filter((r) => /-budget-/.test(r.calc_id));
  const b4 = valued('B4');
  const b4Latest = b4.map(layerFy).sort().pop();
  const b4Over = b4.filter((r) => r.flags.above_100).length;
  const b5Above = valued('B5').filter((r) => r.flags.above_limit);
  const cmpWide = SER.comparisons.filter((c) => c.spread_pct_of_smallest > 10).map((c) => fyLabel(c.fy));
  const thr = (f) => (fam(f).find((r) => r.threshold) || {}).threshold;
  const findingCats = Object.entries(AUD.recurrence_by_category.county_executive || {});
  // D9: a cross-tab count cites the pages of the findings it counts (the findings carry no grade of their own; the
  // report's own grade is the audit opinion's, so the cell says "count, not graded").
  const auditCell = (cat, fy) => {
    const doc = (AUD.documents.find((d) => d.fy === fy && d.entity === 'county_executive') || {}).doc_id;
    const fs = AUD.findings.filter((f) => f.category === cat && f.fy === fy && f.entity !== 'county_assembly' && (!doc || f.doc_id === doc));
    const pages = [...new Set(fs.map((f) => f.page).filter((x) => x != null))].sort((a, b) => a - b);
    const op = AUD.opinions.find((o) => o.fy === fy && o.doc_id === doc);
    return { source: doc || (fs[0] && fs[0].doc_id), page: pages.length ? `PDF ${pages.length > 1 ? 'pp.' : 'p.'} ${pages.join(', ')}` : null, confidence: op && typeof op.confidence === 'number' ? op.confidence : 'count compiled by Takwimu' };
  };
  return [
    { id: 'summary', title: 'Summary', topics: topics('analysis', 'ledger', 'audits'), findings: [
      { type: 'list', items: [
        ['Approved budget, FY 2024/25 (Controller of Budget): ', series('budget_total')[FYS.indexOf('2024/25')], '.'],
        ['Total expenditure, FY 2024/25 (Controller of Budget): ', series('expenditure_total')[FYS.indexOf('2024/25')], '.'],
        ['Wage bill above the 35 per cent ceiling in ', String(b1Above), ' of ', String(valued('B1').length), ' years with a value (Takwimu calculation; section “Wage bill beside the 35 per cent ceiling”).'],
        ['Open discrepancy cases in the ledger are listed in the section “Open discrepancy cases”; each pair of values is shown side by side and none has been resolved.'],
      ] },
    ], interpretation: ['This report makes no recommendations about named individuals.'] },
    { id: 'trends', title: 'Annual budget and expenditure', topics: topics('ledger', 'analysis'), findings: [
      { type: 'chart', kind: 'column', title: 'Budget and expenditure, KSh million (Controller of Budget values)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Approved budget', figs: series('budget_total') }, { name: 'Total expenditure', figs: series('expenditure_total') }, { name: 'Development expenditure', figs: series('expenditure_development') }] },
      ...['budget_total', 'budget_recurrent', 'budget_development', 'expenditure_total', 'expenditure_recurrent', 'expenditure_development', 'wage_bill']
        .map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
    ], interpretation: ['Budget values differ between the Controller of Budget, county documents and the Senate because they use different budget versions and scopes. The version is shown on each row.'] },
    { id: 'execution', title: 'Share of budget spent (absorption rate)', topics: topics('analysis'), findings: [
      { type: 'figs', home: ANALYSIS_HOME('a3', 'share of budget spent'), check: ['Share of budget spent: printed and recalculated'], caption: 'Share of budget spent (absorption rate), calculated by Takwimu from one document and one budget version', rows: execRows },
    ], interpretation: ['The share of the development budget spent is consistently lower than the share of the recurrent budget spent in the documents held.'] },
    { id: 'wage-bill', title: 'Wage bill beside the 35 per cent ceiling', topics: topics('analysis', 'audits'), findings: [
      { type: 'chart', home: { href: '/counties/siaya/analysis/spending/#an-b1', label: 'Siaya analysis, wage bill' }, check: ['Wage bill as a share of total revenue'], kind: 'line', title: 'Wage bill as a share of total revenue, per cent (Takwimu calculation from the Controller of Budget report for each year)', unit: '%', labels: FYS.map(fyLabel),
        series: [{ name: 'Wage bill, % of total revenue', figs: layerSeries((r) => r.family === 'B1') }] },
      { type: 'figs', home: { href: '/counties/siaya/analysis/spending/#an-b1', label: 'Siaya analysis, wage bill' }, caption: 'The Auditor-General’s own ratios (its own denominator; shown beside, not combined)', rows: oagRatioRows('B1') },
    ], interpretation: [
      `What the figures mean: in ${b1Above} of the ${valued('B1').length} years with a value, staff costs took more than ${thr('B1').value} per cent of the revenue the county received. ${thr('B1').rule}`,
      'Trend and context: the share rose from about a third in FY 2015/16 to around 40 per cent from FY 2016/17 and fell back towards the ceiling in FY 2024/25 as revenue grew faster than the wage bill. The Auditor-General’s ratios are higher because they divide by the County Executive’s receipts, not the whole county’s revenue; neither ratio is a finding about any person.',
    ] },
    { id: 'development-share', title: 'Development share beside the 30 per cent floor', topics: topics('analysis'), findings: [
      { type: 'chart', home: { href: '/counties/siaya/analysis/spending/#an-b2', label: 'Siaya analysis, development share' }, check: ['Development share of the budget and of spending'], kind: 'line', title: 'Development share of the budget and of actual spending, per cent (Controller of Budget reports; Takwimu calculation)', unit: '%', labels: FYS.map(fyLabel),
        series: [{ name: 'Share of the budget', figs: layerSeries((r) => /-budget-cob-report-/.test(r.calc_id)) }, { name: 'Share of actual spending', figs: layerSeries((r) => /-actual-cob-report-/.test(r.calc_id)) }] },
      { type: 'figs', home: { href: '/counties/siaya/analysis/spending/#an-b2', label: 'Siaya analysis, development share' }, check: ['Development share of the budget and of spending'], caption: 'Development share from the county’s own documents (programme-based budgets and budget review papers), kept apart from the Controller of Budget', rows: layerRows((r) => r.family === 'B2' && !/cob-report/.test(r.calc_id)) },
    ], interpretation: [
      `What the figures mean: ${b2Bud.filter((r) => r.flags.below_floor).length ? `${b2Bud.filter((r) => r.flags.below_floor).length} budget shares are below the floor` : 'every budget share held meets the 30 per cent floor'}, but the share of actual spending that went to development was below ${thr('B2').value} per cent in ${b2Act.filter((r) => r.flags.below_floor).length} of ${b2Act.length} years in the Controller of Budget reports. ${thr('B2').rule}`,
      'Context: the gap between budgeted and spent development money is the same pattern as the low share of the development budget spent (section 3). Budget versions differ between documents, so a share from one document is compared only with a share from the same kind of document.',
    ] },
    { id: 'department-absorption', title: 'Absorption by department', topics: topics('analysis'), findings: [
      { type: 'chart', home: { href: '/counties/siaya/analysis/spending/#an-b4', label: 'Siaya analysis, absorption by department' }, check: ['Absorption by department'], kind: 'column', title: `Share of the final development budget spent by department, FY ${b4Latest} (County Treasury review; Takwimu calculation)`, unit: '%', labels: b4.filter((r) => layerFy(r) === b4Latest && /-development$/.test(r.calc_id) && !/-TOTAL-/.test(r.calc_id)).map((r) => r.title.replace(/^Absorption, /, '').replace(/, development, FY .*$/, '')),
        series: [{ name: 'Development absorption', figs: each(LAYF, '/records', (r) => r.family === 'B4' && r.status === 'value' && layerFy(r) === b4Latest && /-development$/.test(r.calc_id) && !/-TOTAL-/.test(r.calc_id)).map(([r, ptr]) => layerFig(r, ptr)) }] },
      { type: 'figs', home: { href: '/counties/siaya/analysis/spending/#an-b4', label: 'Siaya analysis, absorption by department' }, check: ['Absorption by department'], caption: 'Whole-county absorption in each County Treasury review (printed Total rows)', rows: layerRows((r) => r.family === 'B4' && /-TOTAL-/.test(r.calc_id)) },
    ], interpretation: [
      `What the figures mean: ${b4.length} department ratios are held for ${new Set(b4.map(layerFy)).size} years; ${b4Over} are above 100 per cent, meaning the review prints spending above the final budget beside it. Department names change between budgets, so a department is followed across years only through the crosswalk on the department budgets page.`,
      'Caution: in the FY 2023/24 review every department except the County Assembly prints the same 95.4 per cent absorption of compensation of employees, which suggests the staff-cost actuals were allocated in proportion; those rows are not read as department performance.',
    ] },
    { id: 'osr', title: 'Own-source revenue reconciliation', topics: topics('ledger'), findings: [
      { type: 'chart', kind: 'line', title: 'Own-source revenue: target and actual, KSh million (Controller of Budget values)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Target', figs: series('osr_total_target') }, { name: 'Actual', figs: series('osr_total_actual') }] },
      ...['osr_total_target', 'osr_total_actual', 'osr_ordinary_actual', 'osr_fif_aia_actual'].map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
    ], interpretation: ['Whether facility improvement fund and appropriations-in-aid are counted explains much of the spread between own-source revenue totals for the same year.'] },
    { id: 'osr-publishers', title: 'Own-source revenue by publisher: county, Controller of Budget and Auditor-General', topics: topics('ledger'), findings: [
      { type: 'chart', home: { href: '/counties/siaya/ledger/#osr-series', label: 'Siaya ledger, own-source revenue by publisher' }, check: ['Own-source revenue by publisher'], kind: 'line', title: 'Own-source revenue by publisher, KSh million (never blended)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Controller of Budget', figs: series('osr_total_actual') }, { name: 'County Treasury review (CBROP)', figs: serSeries((o) => o.series === 'county-cbrop' && o.measure === 'osr_actual') },
          { name: 'County Treasury table, Auditor-General FY 2024/25 report', figs: serSeries((o) => o.series === 'oag-ror-table' && o.measure === 'osr_actual' && o.source_id === 'OAG-ROR-2024-25') }, { name: 'Auditor-General audited statement (cash)', figs: serSeries((o) => o.series === 'oag-ror' && o.measure === 'osr_receipts_cash') }] },
      { type: 'figs', caption: 'Auditor-General audited statements and County Revenue Fund: every value held', rows: serRows((o) => o.series === 'oag-ror' || o.series === 'oag-crf') },
      { type: 'figs', home: { href: '/counties/siaya/ledger/#osr-b3', label: 'Siaya ledger, own-source revenue against target' }, check: ['Own-source revenue against target, in real terms and per person'], caption: 'Own-source revenue against target, in real terms and per person, by publisher (Takwimu calculation)', rows: layerRows((r) => r.family === 'B3') },
    ], interpretation: [
      `What the figures mean: the publishers agree within 10 per cent in most years; the spread is wider in ${cmpWide.join(', ')}. ${SER.meta.bases.treasury_table} ${SER.meta.bases.cash} ${SER.meta.bases.accrual}`,
      'Context: the county’s revenue grew in nominal and real terms over the decade, but against its own targets it collected between about two-fifths and all of the target, depending on the year and the publisher. Comparisons with other counties use only Controller of Budget figures (section on all 47 counties), because the other publishers do not cover every county.',
    ] },
    { id: 'transfers', title: 'Transfers', topics: topics('ledger', 'analysis'), findings: [
      ...['equitable_share_budgeted', 'equitable_share_received', 'conditional_grants_budgeted', 'conditional_grants_received'].map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
      { type: 'figs', home: ANALYSIS_HOME('a2', 'dependence on national transfers'), check: ['Dependence on national transfers'], caption: 'Transfer dependency calculated by Takwimu', rows: transferRows },
    ], interpretation: ['National transfers finance most of the county budget in every year held.'] },
    { id: 'pending', title: 'Pending bills', topics: topics('analysis'), findings: [
      { type: 'figs', caption: `${L.measures.pending_bills_close.label}: every source value held`, rows: ledgerRows('pending_bills_close') },
      { type: 'figs', home: ANALYSIS_HOME('a4', 'pending bills stocks and changes'), check: ['Pending bills: stocks and changes by source'], caption: 'Pending-bill changes and roll-forward residuals calculated by Takwimu', rows: pendingRows },
    ], interpretation: ['Pending-bill stocks for the same date differ by document and by whether the County Assembly is included; a roll-forward residual means the published figures do not reconcile.'] },
    { id: 'pending-burden', title: 'Pending bills as a share of revenue', topics: topics('analysis', 'ledger'), findings: [
      { type: 'chart', home: { href: '/counties/siaya/analysis/pending-bills/#an-b5', label: 'Siaya analysis, pending bills burden' }, check: ['Pending bills as a share of total revenue'], kind: 'line', title: 'Pending bills at 30 June as a share of total revenue, per cent (Controller of Budget report for each year; Takwimu calculation)', unit: '%', labels: FYS.map(fyLabel),
        series: [{ name: 'Stock in the county chapter', figs: layerSeries((r) => r.family === 'B5' && !/^Cross-county/.test(((r.inputs || []).find((i) => i.role === 'pending') || {}).basis || '')) },
          { name: 'Cross-county table grand total', figs: layerSeries((r) => r.family === 'B5' && /^Cross-county/.test(((r.inputs || []).find((i) => i.role === 'pending') || {}).basis || '')) }] },
      { type: 'figs', home: { href: '/counties/siaya/analysis/pending-bills/#an-b5', label: 'Siaya analysis, pending bills burden' }, caption: 'The Auditor-General’s own ratio (total liabilities of the County Executive against its revenue)', rows: oagRatioRows('B5') },
    ], interpretation: [
      `What the figures mean: ${b5Above.length ? `${b5Above.length} reading${b5Above.length === 1 ? ' is' : 's are'} above the ${thr('B5').value} per cent limit (${b5Above.map((r) => r.period).join(', ')})` : `no reading is above the ${thr('B5').value} per cent limit`}. ${thr('B5').rule} Which stock of bills is the right one for a date is an open discrepancy in the ledger, so each reading keeps its own ratio.`,
      'Trend: unpaid bills grew faster than revenue to FY 2020/21, fell to their lowest share in FY 2023/24 and rose again in FY 2024/25 on the wider definitions.',
    ] },
    { id: 'audit', title: 'Audit opinions and issues', topics: topics('audits'), findings: [
      { type: 'figs', home: TOPIC.audits, caption: 'Auditor-General opinions', rows: auditOpinionRows() },
      { type: 'records', check: findingCats.map(([cat]) => AUDIT_CATEGORY[cat] || cap(cat)), caption: 'Audit findings by category and year, County Executive (count of findings recorded)', columns: ['Category', ...AUD.findings.reduce((a, f) => (a.includes(f.fy) ? a : [...a, f.fy]), []).sort().map(fyLabel)],
        rows: findingCats.map(([cat]) => {
          const yrs = AUD.findings.reduce((a, f) => (a.includes(f.fy) ? a : [...a, f.fy]), []).sort();
          return [cap(cat), ...yrs.map((fy) => (AUD.recurrence_by_category.county_executive[cat][fy] !== undefined
            ? fig('siaya-audits.json', P('recurrence_by_category', 'county_executive', cat, fy), { label: `${cap(cat)} findings`, period: fyLabel(fy), unit: 'findings', ...auditCell(cat, fy), rec: {} })
            : '–'))];
        }) },
    ], interpretation: ['Findings are the auditor’s findings about the accounts, not legal conclusions about any person.'] },
    { id: 'projects', title: 'Project evidence', topics: topics('projects'), findings: [
      { type: 'records', caption: 'Projects with an Auditor-General finding (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => p.audit_finding_ids.length) },
    ], interpretation: ['A project marked completed by the county is not independently verified unless an audit or inspection says so.'] },
    { id: 'comparison', title: 'Comparison with all 47 counties', topics: topics('compare'), findings: [
      { type: 'figs', caption: 'Siaya beside the 47-county total (Controller of Budget tables, read by OCR)', rows: siayaCob },
    ], interpretation: ['These values were read by OCR from scanned tables and can differ from the ledger values for the same year.'] },
    { id: 'discrepancies', title: 'Open discrepancy cases', topics: topics('ledger'), findings: [
      { type: 'pairs', caption: 'Pairs of values for the same measure and year that differ by more than the ledger threshold', aLabel: 'Value A', bLabel: 'Value B', rows: ledgerPairs((d) => d.status === 'open') },
    ], interpretation: ['None of these cases has been reviewed. Both values remain in the record until a reviewer decides, with reasons.'] },
    { id: 'scenarios', title: 'Scenario sensitivities', findings: [
      { type: 'p', text: 'Not produced. Scenario tables need reviewed inputs; while every input is provisional and many years have open discrepancies, a scenario would compound unreviewed values. This section will be filled once the inputs are reviewed.' },
    ], interpretation: [] },
  ];
}

// ---------- Report C: Health and community services ----------
function reportC() {
  const kdhs = HIST.health.indicators;
  const grp = (re) => healthRows((o) => re.test(o.measure));
  const staffMeasures = ['population-per-doctor', 'population-per-nurse', 'population-per-clinical-officer'];
  const subs = [...new Set(HEALTH.observations.filter((o) => o.measure === 'population-per-doctor').map((o) => o.geography_detail))];
  const staffSeries = staffMeasures.map((m) => ({ name: cap(m.replace('population-per-', 'People per ')), figs: subs.map((s) => {
    const h = each('siaya-health.json', '/observations', (o) => o.measure === m && o.geography_detail === s)[0];
    return h ? healthFig(h[0], h[1]) : null;
  }) }));
  const kdhsFig = (i, k) => fig('history.json', P('health', 'indicators', i, k), { label: `${kdhs[i].label} (${k === 'v2014' ? 'KDHS 2014' : 'KDHS 2022'})`, period: k === 'v2014' ? '2014' : '2022', source: k === 'v2014' ? 'KDHS-2014' : 'KDHS-2022-KIR', unit: kdhs[i].unit });
  const health = PROG.programmes.map((p, i) => [p, i]).filter(([p]) => p.sector === 'health');
  const sections = [
    { id: 'summary', title: 'Summary', topics: topics('health'), findings: [
      { type: 'chart', kind: 'column', title: 'Maternal and child health indicators, KDHS 2014 and 2022 (per cent)', unit: '%', labels: kdhs.map((k) => k.label),
        series: [{ name: 'KDHS 2014', figs: kdhs.map((k, i) => (held('history.json', P('health', 'indicators', i, 'v2014')) != null ? kdhsFig(i, 'v2014') : null)) }, { name: 'KDHS 2022', figs: kdhs.map((k, i) => (held('history.json', P('health', 'indicators', i, 'v2022')) != null ? kdhsFig(i, 'v2022') : null)) }] },
    ], interpretation: ['Survey indicators moved in the expected direction between the two surveys. Routine annual health data were not retrievable, so year-to-year trends cannot be shown.'] },
    { id: 'disease', title: 'Disease trends', topics: topics('health'), findings: [
      { type: 'figs', caption: 'HIV: prevalence, incidence, new infections and treatment (model vintages are not comparable)', rows: grp(/^(hiv|art)-/) },
      { type: 'figs', caption: 'Tuberculosis', rows: grp(/^tb-/) },
      { type: 'figs', caption: 'Malaria and prevention', rows: grp(/^(malaria|itn|iptp)/) },
    ], interpretation: ['HIV estimates come from different model vintages and age bands; national guidance says they should not be joined into a trend line.'] },
    { id: 'access', title: 'Facility access and maternal and child care', topics: topics('health'), findings: [
      { type: 'figs', caption: 'Antenatal care, delivery and immunisation', rows: grp(/^(skilled|facility|immunisation)/) },
      { type: 'figs', caption: 'Nutrition', rows: grp(/^stunting/) },
    ], interpretation: ['Facility delivery in surveys and in county routine data are different measures; the survey figure is shown.'] },
    { id: 'staffing', title: 'Staffing', topics: topics('health', 'wards'), findings: [
      { type: 'chart', kind: 'column', title: 'People per health worker by sub-county, 2022 (county plan)', unit: 'people per worker', labels: subs, series: staffSeries },
    ], interpretation: ['Doctor coverage varies most between sub-counties; nurses are more evenly spread.'] },
    { id: 'chu', title: 'Community health units', topics: topics('health'), findings: [
      { type: 'figs', caption: 'Community health units and committee functionality (baseline assessment, September 2026)', rows: grp(/^(chu|chc)-/) },
    ], interpretation: ['A small share of committees assessed were fully functional at baseline.'] },
    { id: 'financing', title: 'Financing', topics: topics('analysis', 'health'), findings: [
      { type: 'figs', home: ANALYSIS_HOME('a6', 'budget beside services'), check: ['Budget beside services: context, not causation'], caption: 'Budget-to-service context calculated by Takwimu (context, not causation)', rows: analysisRows((r) => r.family === 'A6') },
      { type: 'p', text: 'Health department budget and expenditure by year are not in the fiscal ledger; see data gaps.' },
    ], interpretation: [] },
    { id: 'programmes', title: 'NGO and donor health programmes', topics: topics('programmes'), findings: [
      { type: 'records', caption: 'Health programme records (evidence type shown; pooled totals are not Siaya figures)', columns: ['ID', 'Programme', 'Implementer', 'Funder', 'Geography', 'Evidence type'],
        rows: health.map(([p, i]) => [p.id, p.title, p.implementing_organisation, p.funder, words(p.geography.class), fig('siaya-programmes.json', P('programmes', i, 'evidence_type'), { label: 'Evidence type', source: p.sources[0] && p.sources[0].source_id, page: p.sources[0] && p.sources[0].page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` })]) },
    ], interpretation: ['Self-reported results are the implementer’s own account; only independently evaluated outcomes are treated as evaluated.'] },
    { id: 'equity', title: 'Geographic equity and small cells', topics: topics('health', 'wards'), findings: [
      { type: 'p', text: '' }, // set below from the figures of this report
    ], interpretation: [] },
    { id: 'conflicts', title: 'Conflicting values', topics: topics('health'), findings: [{ type: 'conflicts', caption: 'Health: values that disagree, shown together', groups: healthConflicts() }], interpretation: [] },
  ];
  sections.find((x) => x.id === 'equity').findings[0].text = smallCountSentence(figsOf(sections));
  return sections;
}

// ---------- Report D: Development and investment opportunities ----------
function reportD() {
  const latest = (vintage, year) => each('siaya-economy.json', '/observations', (o) => o.indicator === 'gva_by_activity' && o.vintage === vintage && o.period === year).map(([o, p]) => ({ f: econFig(o, p) }));
  const constraintStatuses = /^(delayed|suspended|cancelled|unknown)$/;
  return [
    { id: 'scope', title: 'Scope and limits', topics: topics('economy'), findings: [
      { type: 'p', text: 'This report lists only what the documents held say about sectors, service gaps and infrastructure constraints. It does not estimate market sizes, returns, costs or project financials: none of these is published in the documents held, and inventing them would mislead. Where evidence is absent, the report says so.' },
    ], interpretation: [] },
    { id: 'sectors', title: 'Economic sectors (Gross County Product)', topics: topics('economy'), findings: [
      { type: 'figs', caption: 'Gross value added by activity, 2024, current prices (KNBS GCP 2025; 2024 provisional)', rows: latest('GCP2025', '2024') },
      { type: 'figs', caption: 'Growth', rows: each('siaya-economy.json', '/observations', (o) => o.indicator === 'real_growth_avg').map(([o, p]) => ({ f: econFig(o, p) })) },
      { type: 'pairs', caption: 'Revisions to gross value added by activity between editions', aLabel: 'GCP 2024 edition', bLabel: 'GCP 2025 edition', rows: econRevisions((r) => r.indicator === 'gva_by_activity' && Math.abs(held('siaya-economy.json', `/revisions/${ECON.revisions.indexOf(r)}/difference_pct`) || 0) >= 5) },
    ], interpretation: [`${largestActivity('GCP2025', '2024')} Sector size alone says nothing about profitability or investability.`] },
    { id: 'value-chains', title: 'Value chains: agriculture, livestock and fisheries', topics: topics('agriculture'), findings: [
      { type: 'figs', caption: 'Production, area and value as printed (two sources, different years and units)', rows: each('siaya-agriculture.json', '/observations', (o) => o.status === 'observed').map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'figs', caption: 'County plan targets (plans, not outcomes)', rows: each('siaya-agriculture.json', '/observations', (o) => o.status === 'target').map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'conflicts', caption: 'Agriculture: conflicting values', groups: agriConflicts() },
    ], interpretation: ['Yields, prices and margins are not published in the sources held, so no value chain can be ranked by return.'] },
    { id: 'service-gaps', title: 'Service gaps', topics: topics('climate', 'health', 'education'), findings: [
      { type: 'figs', caption: 'Water and sanitation coverage', rows: each('siaya-climate.json', '/observations', (o) => o.kind === 'coverage').map(([o, p]) => ({ f: climFig(o, p) })) },
      { type: 'figs', caption: 'Health staffing by sub-county, 2022', rows: healthRows((o) => /^population-per-/.test(o.measure)) },
      { type: 'figs', caption: 'Pre-primary and vocational training indicators (devolved functions)', rows: each('siaya-education.json', '/observations', (o) => o.function === 'devolved' && /enrolment|teachers_required|pupil_teacher|centres/.test(o.indicator) && (!o.sex || o.sex === 'total')).map(([o, p]) => ({ f: eduFig(o, p) })) },
    ], interpretation: ['Among the indicators held, doctor coverage varies most between sub-counties, and the water-access figures depend heavily on which definition a document uses.'] },
    { id: 'infrastructure', title: 'Infrastructure constraints', topics: topics('projects', 'climate'), findings: [
      { type: 'records', caption: 'Projects recorded as delayed, suspended, cancelled or of unknown status (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => constraintStatuses.test(p.status)) },
      { type: 'figs', home: ANALYSIS_HOME('a7', 'climate finance beside hotspot wards'), check: ['Climate finance beside hotspot wards'], caption: 'Climate hazard exposure calculated by Takwimu', rows: analysisRows((r) => r.family === 'A7') },
    ], interpretation: ['Stalled public works and ward-level flood and drought hotspots are constraints any investment would have to plan around.'] },
    { id: 'not-assessed', title: 'Investability screening, market size and returns', findings: [
      { type: 'p', text: 'Not assessed. The documents held publish no market sizes, prices, costs, returns or project financial models for Siaya. An investability screen would need them. This section is left empty on purpose rather than filled with assumptions.' },
    ], interpretation: [] },
    { id: 'risks', title: 'Risk register (evidence risks)', topics: topics('climate'), findings: [
      { type: 'p', text: 'The risks listed here are risks to the evidence itself: conflicting values and missing data that any decision based on this report would carry. They are taken from the data gaps and conflicts recorded in the data files; no commercial risk is rated.' },
      { type: 'conflicts', caption: 'Water access: figures with different definitions', groups: climConflicts() },
    ], interpretation: [] },
  ];
}

// The largest activity among the values held (a withdrawn value is null in the masked data and never named).
function largestActivity(vintage, year) {
  const rows = ECON.observations.filter((o) => o.indicator === 'gva_by_activity' && o.vintage === vintage && o.period === year && o.sector !== 'fisim');
  const top = rows.filter((o) => typeof o.value === 'number').sort((a, b) => b.value - a.value)[0];
  if (!top) return '';
  return `${rows.some((o) => (badge('siaya-economy', o.id) || {}).hide) ? 'Among the values shown, ' : ''}${top.sector_label} is the largest activity in the county accounts.`;
}

// ---------- Report E: Programme atlas ----------
function reportE() {
  const rows = PROG.programmes.map((p, i) => [p, i]);
  const evFig = (p, i) => fig('siaya-programmes.json', P('programmes', i, 'evidence_type'), { label: 'Evidence type', source: p.sources[0] && p.sources[0].source_id, page: p.sources[0] && p.sources[0].page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` });
  // A total that sums a programme record withdrawn in editorial review is withheld (the masked total is null), as on
  // the programmes page.
  const grantSource = (g) => {
    const rc = (PROG.summary.reconciliation || []).find((x) => x.period === g.period && x.kind === g.kind);
    return rc && rc.source ? { source: rc.source.source_id, page: rc.source.page } : { source: null, page: null };
  };
  const grantHeld = (g) => g.record_ids.map((id) => badge('siaya-programmes', id)).find((b) => b && b.hide) || null;
  const grants = PROG.summary.siaya_development_partner_grants_kes.map((g, i) => ({ f: progFig(P('summary', 'siaya_development_partner_grants_kes', i, 'total'), `Development partner grants to the county, ${g.kind}`, {
    // D10: cite the reconciliation record for the same period and kind (its own document and page), not GOV-03 for all.
    unit: g.currency, period: g.period, ...grantSource(g), notes: [`Sum of ${g.record_ids.length} Siaya-specific records (${g.record_ids.join(', ')})`],
    review: grantHeld(g) ? { ...grantHeld(g), key: `siaya-programmes:summary-grants-${i}`, reason: `Withheld: record ${grantHeld(g).key.split(':')[1]}, which this total sums, was withdrawn after editorial review. ${grantHeld(g).reason}` } : undefined,
  }) }));
  const evals = rows.filter(([p]) => p.evaluation && p.evaluation.by);
  const outcomes = (ev) => rows.filter(([p]) => p.evidence_type === ev).flatMap(([p, i]) => (p.outputs_outcomes_as_stated || []).map((s, j) => [p.id, p.title, words(s.kind),
    fig('siaya-programmes.json', P('programmes', i, 'outputs_outcomes_as_stated', j, 'text'), { label: 'Statement', source: s.source && s.source.source_id, page: s.source && s.source.page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` }),
    s.attributable_to_siaya ? 'Yes' : 'No']));
  return [
    { id: 'summary', title: 'Summary', topics: topics('programmes'), findings: [
      { type: 'figs', caption: 'Programme records by geography and evidence type', rows: [
        { f: progFig('/summary/record_count', 'Programme records', { unit: 'records' }) },
        ...Object.keys(PROG.summary.by_geography_class).map((k) => ({ f: progFig(P('summary', 'by_geography_class', k), `Records: ${words(k)}`, { unit: 'records' }) })),
        ...Object.keys(PROG.summary.by_evidence_type).map((k) => ({ f: progFig(P('summary', 'by_evidence_type', k), `Records: ${words(k)}`, { unit: 'records' }) })),
      ] },
      { type: 'figs', caption: 'Development partner grants in the county budget (Siaya-specific records only)', rows: grants },
    ], interpretation: ['Pooled multi-county and national amounts are shown on their own records and are never summed into a Siaya total.'] },
    { id: 'register', title: 'Programme register', topics: topics('programmes'), findings: [
      { type: 'records', caption: 'All programme records', columns: ['ID', 'Programme', 'Implementer', 'Funder', 'Sector', 'Geography', 'Evidence type'],
        rows: rows.map(([p, i]) => [p.id, p.title, p.implementing_organisation, p.funder || 'Not stated', words(p.sector), words(p.geography.class), evFig(p, i)]) },
    ], interpretation: [] },
    { id: 'amounts', title: 'Disclosed amounts', topics: topics('programmes'), findings: [
      { type: 'figs', caption: 'Amounts as disclosed (pooled totals labelled; blank or dash printed values are shown as not published)', rows: rows.flatMap(([p, i]) => p.amounts.map((a, j) => ({ f: progAmountFig(p, i, a, j) }))) },
    ], interpretation: [] },
    { id: 'reach', title: 'Beneficiaries and geographic reach', topics: topics('programmes'), findings: [
      { type: 'figs', caption: 'Beneficiary counts as stated by the source', rows: rows.flatMap(([p, i]) => p.beneficiaries.map((b, j) => ({ f: fig('siaya-programmes.json', P('programmes', i, 'beneficiaries', j, 'value'), { label: `${p.title}: ${b.as_printed || 'beneficiaries'}${b.pooled ? ' (pooled, not a Siaya figure)' : ''}`, unit: b.unit, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, source: b.source && b.source.source_id, page: b.source && b.source.page, confidence: `tier ${p.tier}`, suppressSmall: true }) }))) },
    ], interpretation: [] },
    { id: 'evaluations', title: 'Evaluations', topics: topics('programmes'), findings: [
      { type: 'records', caption: 'Independent evaluations (rating as published; Siaya results only where disaggregated)', columns: ['ID', 'Programme', 'Evaluated by', 'Rating as published', 'Scope', 'Siaya disaggregated'],
        rows: evals.map(([p, i]) => [p.id, p.title, p.evaluation.by, fig('siaya-programmes.json', P('programmes', i, 'evaluation', 'rating_as_published'), { label: 'Rating', period: p.evaluation.date, source: p.evaluation.source && p.evaluation.source.source_id, page: p.evaluation.source && p.evaluation.source.page, confidence: `tier ${p.tier}` }), p.evaluation.scope || 'Not stated', p.evaluation.siaya_disaggregated ? 'Yes' : 'No']) },
      { type: 'records', caption: 'Results stated in independently evaluated records', columns: ['ID', 'Programme', 'Kind', 'Statement as published', 'Siaya-specific'], rows: outcomes('independently_evaluated') },
      { type: 'records', caption: 'Results self-reported by the implementer or publisher (not evaluated)', columns: ['ID', 'Programme', 'Kind', 'Statement as published', 'Siaya-specific'], rows: outcomes('self_reported') },
    ], interpretation: ['Self-reported achievements are the implementer’s own account and are listed apart from independently evaluated outcomes.'] },
    { id: 'screened', title: 'Documents screened out', topics: topics('programmes'), findings: [
      { type: 'records', caption: 'Documents checked and not used, with the reason', columns: ['Source', 'Title', 'Finding'], rows: PROG.screened_out.map((s) => [s.source_id, s.title, s.finding]) },
    ], interpretation: [] },
  ];
}

// Indicator dictionary (Report A): definitions as the data files record them.
function dictionary() {
  const seen = new Set();
  const out = [];
  const add = (label, unit, definition) => { if (seen.has(label)) return; seen.add(label); out.push({ label, unit: unit || '–', definition: definition || 'As printed in the source; no separate definition recorded.' }); };
  Object.values(L.measures).forEach((m) => add(m.label, m.unit, m.definition));
  ECON.sectors.forEach((s) => add(`Gross value added: ${s.label}`, 'KSh million', `KNBS Gross County Product, ISIC section ${s.isic_section}.`));
  HEALTH.observations.forEach((o) => add(o.label, o.unit, o.method));
  EDU.observations.forEach((o) => add(cap(o.indicator), o.unit, `${o.function === 'devolved' ? 'Devolved (county) function' : 'National function'}; ${o.value_type || 'value'} as printed.`));
  return out;
}

const BUILDERS = { A: reportA, B: reportB, C: reportC, D: reportD, E: reportE };

// Walk blocks for every fig (bibliography, draft status, tests).
export function figsOf(sections) {
  const out = [];
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (v.ptr && v.file && 'value' in v) { out.push(v); return; }
    (Array.isArray(v) ? v : Object.values(v)).forEach(walk);
  };
  walk(sections);
  return out;
}

// Counts of the review states of the figures printed (the cover states them once; scripts/test-reports.js checks
// them against the page and the PDF). A figure without a register entry is provisional.
export function reviewState(figs) {
  const n = { provisional: 0, approved: 0, disputed: 0, superseded: 0, withdrawn: 0 };
  figs.forEach((f) => {
    const s = f.review ? f.review.state : 'review_pending';
    if (s === 'approved') n.approved += 1; else if (s === 'disputed') n.disputed += 1; else if (s === 'superseded') n.superseded += 1;
    else if (s === 'rejected') n.withdrawn += 1; else n.provisional += 1;
  });
  return n;
}

export function buildReport(slug) {
  const meta = registry.reports.find((r) => r.slug === slug);
  if (!meta) return null;
  const sections = BUILDERS[meta.letter]();
  const gaps = gapsOf(meta.inputs);
  const figs = figsOf(sections);
  const ids = [...new Set(figs.map((f) => f.source).filter(Boolean))].sort();
  const bibliography = ids.filter((id) => source(id)).map((id) => source(id));
  const described = ids.filter((id) => !source(id));
  const periods = figs.map((f) => String(f.period || '')).map((p) => (p.match(/(19|20)\d{2}/g) || [])).flat().map(Number).sort((a, b) => a - b);
  return {
    meta, sections, gaps, figs, bibliography, described,
    dictionary: meta.letter === 'A' ? dictionary() : [],
    edition: registry.edition,
    date: dataDate(meta.inputs),
    referencePeriod: periods.length ? `${periods[0]} to ${periods[periods.length - 1]} (earliest and latest years in the figures shown)` : 'Not stated',
    snapshot: snapshot(meta.inputs),
    draft: figs.some((f) => !f.reviewed),
    unreviewed: figs.filter((f) => !f.reviewed).length,
    reviewState: reviewState(figs),
  };
}
export const SLUGS = registry.reports.map((r) => r.slug);
export { get, find };
