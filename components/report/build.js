// The five report templates as data. Each builder returns sections made of blocks; every number is a fig
// (see model.js) or a count of records listed in the same report. Findings and interpretation are kept in
// separate blocks so the renderer can print them under separate headings. No contractor names, no personal data.
import {
  DATA, P, get, find, each, fig, registry, snapshot, dataDate, ECON_SRC, source, held,
} from './model';

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

const FYS = L.years;
const fyLabel = (fy) => (fy ? `FY ${fy}` : fy);
const words = (s) => String(s || '').replace(/_/g, ' ');
const cap = (s) => { const w = words(s); return w.charAt(0).toUpperCase() + w.slice(1); };

// ---------- Figure builders, one per data file shape ----------
const ledgerFig = (o, ptr) => fig('siaya-fiscal-ledger.json', `${ptr}/value`, {
  label: L.measures[o.measure].label, period: fyLabel(o.fy),
  note: [o.budget_version ? `Budget version: ${o.budget_version}` : null, o.scope ? `Scope: ${o.scope}` : null, o.read_method ? `Read: ${o.read_method}` : null].filter(Boolean).join('. '),
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
  note: [o.method, o.status, o.sentinel_site ? 'Sentinel site: not county-representative' : null].filter(Boolean).join('. '),
  suppressSmall: true, ...extra,
});
const healthRows = (pred) => each('siaya-health.json', '/observations', pred).map(([o, ptr]) => ({ f: healthFig(o, ptr) }));

const econFig = (o, ptr, label) => fig('siaya-economy.json', `${ptr}/value`, {
  label: label || `${o.indicator === 'gcp_total' ? 'Gross County Product' : cap(o.indicator)}${o.sector_label ? `: ${o.sector_label}` : ''} (${words(o.price_basis)} prices, ${o.vintage})`,
  source: ECON_SRC[o.vintage], note: [o.table, o.provisional ? 'KNBS marks the year provisional' : null].filter(Boolean).join('. '),
});

const eduFig = (o, ptr) => fig('siaya-education.json', `${ptr}/value`, {
  label: `${cap(o.indicator)}${o.level ? `, ${o.level}` : ''}${o.sex && o.sex !== 'total' ? `, ${o.sex}` : ''}${o.sector && o.sector !== 'all' ? `, ${o.sector}` : ''}`,
  note: [o.table, o.value_type].filter(Boolean).join('. '),
});
const agriFig = (o, ptr) => fig('siaya-agriculture.json', `${ptr}/value`, {
  label: `${cap(o.indicator)}${o.commodity ? `: ${words(o.commodity)}` : ''}${o.status === 'target' ? ' (target)' : ''}`,
  unit: words(o.unit), note: o.table,
});
const climFig = (o, ptr) => fig('siaya-climate.json', `${ptr}/value`, {
  label: `${cap(o.measure)}${o.geography ? `, ${o.geography}` : ''}${o.area_as_printed ? ` (${o.area_as_printed})` : ''}`, note: o.definition || o.table,
});
const analysisFig = (r, ptr) => fig('siaya-analysis.json', `${ptr}/result`, {
  label: r.title, source: r.source_ids[0], page: r.inputs[0] ? r.inputs[0].pdf_page : null,
  note: `${r.label}. Formula: ${r.formula}`,
});
const analysisRows = (pred) => each('siaya-analysis.json', '/records', (r) => pred(r) && r.status === 'value').map(([r, ptr]) => ({ f: analysisFig(r, ptr) }));
const analysisGaps = (pred) => each('siaya-analysis.json', '/records', (r) => pred(r) && r.status === 'gap')
  .map(([r]) => ({ topic: r.title, reason: r.gap_reason, file: 'siaya-analysis.json' }));

const progAmountFig = (p, i, a, j) => fig('siaya-programmes.json', P('programmes', i, 'amounts', j, 'value'), {
  rec: a, label: `${p.title}: ${words(a.kind)}${a.pooled ? ' (pooled total, not a Siaya figure)' : ''}`,
  unit: a.currency, period: a.period, source: a.source && a.source.source_id, page: a.source && a.source.page,
  confidence: `tier ${p.tier}`, note: [a.scope ? `Scope: ${words(a.scope)}` : null, a.note].filter(Boolean).join('. '),
});
const progFig = (ptr, label, o = {}) => fig('siaya-programmes.json', ptr, { label, source: 'Takwimu programme atlas summary (data/siaya-programmes.json)', confidence: 'compiled count', ...o });

const auditOpinionRows = () => each('siaya-audits.json', '/opinions').map(([o, ptr]) => ({
  f: fig('siaya-audits.json', `${ptr}/opinion`, { label: `Audit opinion, ${words(o.entity)}`, period: fyLabel(o.fy), note: o.opinion_note || (o.history ? `Matches earlier record: ${o.history}` : '') }),
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
const econRevisions = (pred = () => true) => each('siaya-economy.json', '/revisions', pred).map(([r, ptr]) => ({
  label: `${r.indicator === 'gcp_total' ? 'Gross County Product' : cap(r.indicator)}${r.sector ? `: ${words(r.sector)}` : ''} (${words(r.price_basis)})`,
  period: r.period,
  a: fig('siaya-economy.json', `${ptr}/earlier_value`, { label: r.earlier_vintage, source: ECON_SRC[r.earlier_vintage], period: r.period, confidence: null }),
  b: fig('siaya-economy.json', `${ptr}/later_value`, { label: r.later_vintage, source: ECON_SRC[r.later_vintage], period: r.period, confidence: null }),
  diff: fig('siaya-economy.json', `${ptr}/difference_pct`, { unit: '%', label: 'Revision', period: r.period, source: ECON_SRC[r.later_vintage] }),
}));
const ledgerPairs = (pred = () => true) => each('siaya-fiscal-ledger.json', '/discrepancies', pred).map(([d, ptr]) => ({
  label: L.measures[d.indicator_id] ? L.measures[d.indicator_id].label : d.indicator_id,
  period: d.period,
  a: fig('siaya-fiscal-ledger.json', `${ptr}/claim_a/value_ksh_m`, { unit: 'KSh million', period: d.period, source: d.source_a.source_id, page: d.source_a.pdf_page, confidence: null, reviewRec: d }),
  b: fig('siaya-fiscal-ledger.json', `${ptr}/claim_b/value_ksh_m`, { unit: 'KSh million', period: d.period, source: d.source_b.source_id, page: d.source_b.pdf_page, confidence: null, reviewRec: d }),
  diff: fig('siaya-fiscal-ledger.json', `${ptr}/difference/pct_of_smaller`, { unit: '% of the smaller value', period: d.period, source: d.source_b.source_id, page: d.source_b.pdf_page, reviewRec: d }),
  note: (d.possible_basis_mismatch || []).join(' '),
}));

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
  'history.json': () => (HIST.meta.gaps || []).map((g) => (typeof g === 'string' ? { topic: 'Ten-year history', reason: g } : { topic: g.item || g.topic || g.series || 'Ten-year history', reason: g.reason || g.note || JSON.stringify(g) })),
};
const gapsOf = (files) => files.filter((f) => GAPS[f]).flatMap((f) => GAPS[f]().map((g) => ({ ...g, file: f })));

// Project rows: name, sector, status and its source; no contractor field is read.
const projectRows = (pred) => PROJ.projects.map((p, i) => [p, i]).filter(([p]) => pred(p)).map(([p, i]) => {
  const budget = p.amounts.map((a, j) => [a, j]).filter(([a]) => /budget|contract_sum|estimate/.test(a.kind)).pop();
  return [
    p.id, p.name, words(p.sector),
    fig('siaya-projects.json', P('projects', i, 'status'), { label: 'Status', source: p.status_source && p.status_source.doc_id, page: p.status_source && p.status_source.page, period: p.last_evidence_date, confidence: null }),
    budget ? fig('siaya-projects.json', P('projects', i, 'amounts', budget[1], 'value'), { rec: budget[0], label: words(budget[0].kind), unit: budget[0].unit, period: fyLabel(budget[0].fy), source: budget[0].doc_id, page: budget[0].page, confidence: null }) : 'None held',
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
    { id: 'summary', title: 'Executive summary', findings: [
      { type: 'list', items: [
        ['Population at the 2019 census: ', census2019, ' (KNBS, as reproduced in the county plan). Projections are listed separately and are not census counts.'],
        ['Gross County Product in 2024 at current prices: ', gcp24, ' (KNBS GCP 2025; KNBS marks 2024 provisional).'],
        ['Approved budget for FY 2024/25 as the Controller of Budget reports it: ', latestBudget[lastI], '; total expenditure in the same report: ', latestSpend[lastI], '.'],
        ['Own-source revenue for FY 2024/25 in the Controller of Budget report: ', osr[lastI], '. Other documents give different totals for the same year; all are listed in section 3 and in Report B.'],
        ['Latest audit opinion held: ', opinions[opinions.length - 1].f, '.'],
        ['Programme records in the partner atlas: ', progFig('/summary/record_count', 'Programme records', { unit: 'records' }), ', of which ', progFig('/summary/by_geography_class/siaya_specific', 'Siaya-specific records', { unit: 'records' }), ' are Siaya-specific.'],
      ] },
    ], interpretation: [
      'The documents held describe a county whose budget is financed mostly by national transfers, with a large and disputed pending-bills stock and repeated audit findings. Service indicators come from surveys and plans of different vintages, so they show direction more reliably than levels.',
      'Every figure in this compendium is provisional until an editor reviews it against the page image. Where documents disagree, all values are shown and none is chosen.',
    ] },
    { id: 'demography', title: 'Demographics and economy', findings: [
      { type: 'figs', caption: 'Population: census counts and official projections (projections are not counts)', rows: pop.map((f) => ({ f })) },
      { type: 'chart', kind: 'line', title: 'Gross County Product, KSh million, by price basis (KNBS GCP 2025)', unit: 'KSh million', labels: gcpYears,
        series: [{ name: 'Current prices', figs: gcpS('GCP2025', 'current') }, { name: 'Constant 2016 prices', figs: gcpS('GCP2025', 'constant_2016') }] },
      { type: 'figs', caption: 'Share of the sum of county gross value added (not a share of GDP; see data gaps)', rows: shares },
      { type: 'pairs', caption: 'Gross County Product revisions between the 2024 and 2025 editions (both kept)', aLabel: 'GCP 2024 edition', bLabel: 'GCP 2025 edition', rows: econRevisions((r) => r.indicator === 'gcp_total') },
    ], interpretation: [
      'KNBS revises earlier years in each edition; the two editions are kept side by side and the later one is used only where a single series is needed. A share of county GVA is not a share of national GDP.',
    ] },
    { id: 'finance', title: 'Public finance', findings: [
      { type: 'chart', kind: 'column', title: 'Approved budget and total expenditure, KSh million (Controller of Budget reports)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Approved budget', figs: latestBudget }, { name: 'Total expenditure', figs: latestSpend }] },
      { type: 'chart', kind: 'line', title: 'Own-source revenue and closing pending bills, KSh million (Controller of Budget reports)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Own-source revenue', figs: osr }, { name: 'Pending bills at year end', figs: pend }] },
      { type: 'p', text: 'Every source value for these measures, the open discrepancy cases and the audit evidence are in Report B (Fiscal Accountability and Budget Execution).' },
    ], interpretation: [
      'Spending has stayed below the approved budget in every year held. Own-source revenue remains small beside the budget. The pending-bills stock depends on which document and which date is used.',
    ] },
    { id: 'health', title: 'Health', findings: [
      { type: 'figs', caption: 'Household survey indicators (KDHS 2014 and 2022): sample estimates without confidence intervals', rows: kdhs.map(([o, p]) => ({ f: healthFig(o, p) })) },
      { type: 'p', text: 'Disease burden, staffing, community health units and conflicting HIV estimates are in Report C.' },
    ], interpretation: ['Survey indicators for maternal care improved between the two surveys. They are samples, so small changes should not be over-read.'] },
    { id: 'education', title: 'Education', findings: [
      { type: 'figs', caption: 'Enrolment and teachers (Ministry of Education booklets, KNBS abstracts and county plan)', rows: each('siaya-education.json', '/observations', (o) => /^(primary_enrolment|secondary_enrolment|pre_primary_enrolment|gross_enrolment_rate|net_enrolment_rate|pupil_teacher_ratio)$/.test(o.indicator) && (!o.sex || o.sex === 'total')).map(([o, p]) => ({ f: eduFig(o, p) })) },
      { type: 'conflicts', caption: 'Education: inconsistencies kept side by side', groups: eduConflicts() },
    ], interpretation: ['Pre-primary education is devolved to the county; primary and secondary are national functions, so county budgets explain only the pre-primary and vocational figures.'] },
    { id: 'agriculture', title: 'Agriculture and fisheries', findings: [
      { type: 'figs', caption: 'Crop production, fish landings and aquaculture as printed', rows: each('siaya-agriculture.json', '/observations', (o) => /^(production|fish_landed_quantity|aquaculture_quantity|fish_production)$/.test(o.indicator)).map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'conflicts', caption: 'Agriculture: conflicting values', groups: agriConflicts() },
    ], interpretation: ['Production figures come from two sources ten years apart with different units; they are not a trend.'] },
    { id: 'climate', title: 'Climate, water and environment', findings: [
      { type: 'figs', caption: 'Water and sanitation coverage (each figure uses its own definition)', rows: each('siaya-climate.json', '/observations', (o) => o.kind === 'coverage').map(([o, p]) => ({ f: climFig(o, p) })) },
      { type: 'conflicts', caption: 'Water access: figures with different definitions', groups: climConflicts() },
    ], interpretation: ['Water access ranges widely because the documents measure different things (households, population, utility service areas).'] },
    { id: 'infrastructure', title: 'Infrastructure and project delivery', findings: [
      { type: 'records', caption: 'Projects with an Auditor-General finding (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => p.audit_finding_ids.length) },
    ], interpretation: ['Status is the latest status any document records; only one project has independent verification of completion.'] },
    { id: 'governance', title: 'Governance and audit', findings: [
      { type: 'figs', caption: 'County Budget Transparency Survey (IBP Kenya)', rows: GOV.ibp_cbts.editions.flatMap((e, i) => e.items.map((it, j) => [it, j]).filter(([, j]) => typeof held('siaya-governance.json', P('ibp_cbts', 'editions', i, 'items', j, 'value')) === 'number').map(([it, j]) => ({ f: fig('siaya-governance.json', P('ibp_cbts', 'editions', i, 'items', j, 'value'), { label: `${it.measure} (${it.edition})`, period: String(it.year), confidence: it.confidence }) }))) },
      { type: 'figs', caption: 'Auditor-General opinions', rows: opinions },
    ], interpretation: ['Transparency scores are document-availability scores, not measures of budget quality. Audit opinions describe the accounts, not individuals.'] },
    { id: 'partners', title: 'NGO, CSO and donor ecosystem', findings: [
      { type: 'figs', caption: 'Programme records by geography and evidence type', rows: [
        ...Object.keys(sum.by_geography_class).map((k) => ({ f: progFig(P('summary', 'by_geography_class', k), `Records: ${words(k)}`, { unit: 'records' }) })),
        ...Object.keys(sum.by_evidence_type).map((k) => ({ f: progFig(P('summary', 'by_evidence_type', k), `Records: ${words(k)}`, { unit: 'records' }) })),
      ] },
      { type: 'p', text: 'Report E lists every programme record. Multi-county and national totals are never attributed to Siaya.' },
    ], interpretation: ['Most programme records are self-reported by the implementer; few have an independent evaluation.'] },
    { id: 'wards', title: 'Ward and sub-county disparities', findings: [
      { type: 'figs', caption: 'People per health worker by sub-county, 2022 (county plan)', rows: healthRows((o) => /^population-per-/.test(o.measure)) },
      { type: 'records', caption: 'Wards where the 2023 climate risk assessment prints a flood or drought hotspot', columns: ['Ward', 'Hazard listed', 'Hotspots as printed'],
        rows: hazards.map(([o, p]) => [o.ward_register_name || o.area_as_printed, o.measure, fig('siaya-climate.json', `${p}/hotspots_as_printed`, { label: o.measure, period: o.period, confidence: o.confidence })]) },
    ], interpretation: ['Staffing ratios differ several-fold between sub-counties. Hazard lists are ward participation outputs, not measured risk.'] },
    { id: 'opportunities', title: 'Investment opportunities', findings: [
      { type: 'p', text: 'Report D sets out the evidence on sectors, service gaps and infrastructure constraints. No returns, market sizes or project financials are estimated because none is published in the documents held.' },
    ], interpretation: ['Sectors with a large share of county output and visible service gaps are candidates for further study, not investment recommendations.'] },
  ];
}

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
      const out = [{ f: mk(P('years', yi, 'counties', ci), `Siaya: ${COB.meta.fields[k] || words(k)}`) }];
      if (y.total_row && y.total_row[k] && y.total_row[k].value !== undefined) out.push({ f: mk(P('years', yi, 'total_row'), `All 47 counties: ${COB.meta.fields[k] || words(k)}`) });
      return out;
    });
  });
  const findingCats = Object.entries(AUD.recurrence_by_category.county_executive || {});
  return [
    { id: 'summary', title: 'Summary', findings: [
      { type: 'list', items: [
        ['Approved budget, FY 2024/25 (Controller of Budget): ', series('budget_total')[FYS.indexOf('2024/25')], '.'],
        ['Total expenditure, FY 2024/25 (Controller of Budget): ', series('expenditure_total')[FYS.indexOf('2024/25')], '.'],
        ['Open discrepancy cases in the ledger are listed in the section “Open discrepancy cases”; each pair of values is shown side by side and none has been resolved.'],
      ] },
    ], interpretation: ['Findings in this report are the values the documents print. Interpretation paragraphs are Takwimu’s reading and are not findings. This report makes no recommendations about named individuals.'] },
    { id: 'trends', title: 'Annual budget and expenditure', findings: [
      { type: 'chart', kind: 'column', title: 'Budget and expenditure, KSh million (Controller of Budget values)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Approved budget', figs: series('budget_total') }, { name: 'Total expenditure', figs: series('expenditure_total') }, { name: 'Development expenditure', figs: series('expenditure_development') }] },
      ...['budget_total', 'budget_recurrent', 'budget_development', 'expenditure_total', 'expenditure_recurrent', 'expenditure_development', 'wage_bill']
        .map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
    ], interpretation: ['Budget values differ between the Controller of Budget, county documents and the Senate because they use different budget versions and scopes. The version is shown on each row.'] },
    { id: 'execution', title: 'Spending execution', findings: [
      { type: 'figs', caption: 'Execution (absorption) rates calculated by Takwimu from one document and one budget version', rows: execRows },
    ], interpretation: ['Development execution is consistently lower than recurrent execution in the documents held.'] },
    { id: 'osr', title: 'Own-source revenue reconciliation', findings: [
      { type: 'chart', kind: 'line', title: 'Own-source revenue: target and actual, KSh million (Controller of Budget values)', unit: 'KSh million', labels: FYS.map(fyLabel),
        series: [{ name: 'Target', figs: series('osr_total_target') }, { name: 'Actual', figs: series('osr_total_actual') }] },
      ...['osr_total_target', 'osr_total_actual', 'osr_ordinary_actual', 'osr_fif_aia_actual'].map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
    ], interpretation: ['Whether facility improvement fund and appropriations-in-aid are counted explains much of the spread between OSR totals for the same year.'] },
    { id: 'transfers', title: 'Transfers', findings: [
      ...['equitable_share_budgeted', 'equitable_share_received', 'conditional_grants_budgeted', 'conditional_grants_received'].map((m) => ({ type: 'figs', caption: `${L.measures[m].label}: every source value held`, rows: ledgerRows(m) })),
      { type: 'figs', caption: 'Transfer dependency calculated by Takwimu', rows: transferRows },
    ], interpretation: ['National transfers finance most of the county budget in every year held.'] },
    { id: 'pending', title: 'Pending bills', findings: [
      { type: 'figs', caption: `${L.measures.pending_bills_close.label}: every source value held`, rows: ledgerRows('pending_bills_close') },
      { type: 'figs', caption: 'Pending-bill changes and roll-forward residuals calculated by Takwimu', rows: pendingRows },
    ], interpretation: ['Pending-bill stocks for the same date differ by document and by whether the County Assembly is included; a roll-forward residual means the published figures do not reconcile.'] },
    { id: 'audit', title: 'Audit opinions and issues', findings: [
      { type: 'figs', caption: 'Auditor-General opinions', rows: auditOpinionRows() },
      { type: 'records', caption: 'Audit findings by category and year, County Executive (count of findings recorded)', columns: ['Category', ...AUD.findings.reduce((a, f) => (a.includes(f.fy) ? a : [...a, f.fy]), []).sort().map(fyLabel)],
        rows: findingCats.map(([cat]) => {
          const yrs = AUD.findings.reduce((a, f) => (a.includes(f.fy) ? a : [...a, f.fy]), []).sort();
          return [cap(cat), ...yrs.map((fy) => (AUD.recurrence_by_category.county_executive[cat][fy] !== undefined
            ? fig('siaya-audits.json', P('recurrence_by_category', 'county_executive', cat, fy), { label: `${cap(cat)} findings`, period: fyLabel(fy), unit: 'findings', source: (AUD.documents.find((d) => d.fy === fy && d.entity === 'county_executive') || {}).doc_id, confidence: null, rec: {} })
            : '–'))];
        }) },
    ], interpretation: ['Findings are the auditor’s findings about the accounts, not legal conclusions about any person.'] },
    { id: 'projects', title: 'Project evidence', findings: [
      { type: 'records', caption: 'Projects with an Auditor-General finding (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => p.audit_finding_ids.length) },
    ], interpretation: ['A project marked completed by the county is not independently verified unless an audit or inspection says so.'] },
    { id: 'comparison', title: 'Comparison with all 47 counties', findings: [
      { type: 'figs', caption: 'Siaya beside the 47-county total (Controller of Budget tables, read by OCR)', rows: siayaCob },
    ], interpretation: ['These values were read by OCR from scanned tables and can differ from the ledger values for the same year.'] },
    { id: 'discrepancies', title: 'Open discrepancy cases', findings: [
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
  return [
    { id: 'summary', title: 'Summary', findings: [
      { type: 'chart', kind: 'column', title: 'Maternal and child health indicators, KDHS 2014 and 2022 (per cent)', unit: '%', labels: kdhs.map((k) => k.label),
        series: [{ name: 'KDHS 2014', figs: kdhs.map((k, i) => (held('history.json', P('health', 'indicators', i, 'v2014')) != null ? kdhsFig(i, 'v2014') : null)) }, { name: 'KDHS 2022', figs: kdhs.map((k, i) => (held('history.json', P('health', 'indicators', i, 'v2022')) != null ? kdhsFig(i, 'v2022') : null)) }] },
    ], interpretation: ['Survey indicators moved in the expected direction between the two surveys. Routine annual health data were not retrievable, so year-to-year trends cannot be shown.'] },
    { id: 'disease', title: 'Disease trends', findings: [
      { type: 'figs', caption: 'HIV: prevalence, incidence, new infections and treatment (model vintages are not comparable)', rows: grp(/^(hiv|art)-/) },
      { type: 'figs', caption: 'Tuberculosis', rows: grp(/^tb-/) },
      { type: 'figs', caption: 'Malaria and prevention', rows: grp(/^(malaria|itn|iptp)/) },
    ], interpretation: ['HIV estimates come from different model vintages and age bands; national guidance says they should not be joined into a trend line.'] },
    { id: 'access', title: 'Facility access and maternal and child care', findings: [
      { type: 'figs', caption: 'Antenatal care, delivery and immunisation', rows: grp(/^(skilled|facility|immunisation)/) },
      { type: 'figs', caption: 'Nutrition', rows: grp(/^stunting/) },
    ], interpretation: ['Facility delivery in surveys and in county routine data are different measures; the survey figure is shown.'] },
    { id: 'staffing', title: 'Staffing', findings: [
      { type: 'chart', kind: 'column', title: 'People per health worker by sub-county, 2022 (county plan)', unit: 'people per worker', labels: subs, series: staffSeries },
    ], interpretation: ['Doctor coverage varies most between sub-counties; nurses are more evenly spread.'] },
    { id: 'chu', title: 'Community health units', findings: [
      { type: 'figs', caption: 'Community health units and committee functionality (baseline assessment, September 2026)', rows: grp(/^(chu|chc)-/) },
    ], interpretation: ['A small share of committees assessed were fully functional at baseline.'] },
    { id: 'financing', title: 'Financing', findings: [
      { type: 'figs', caption: 'Budget-to-service context calculated by Takwimu (context, not causation)', rows: analysisRows((r) => r.family === 'A6') },
      { type: 'p', text: 'Health department budget and expenditure by year are not in the fiscal ledger; see data gaps.' },
    ], interpretation: [] },
    { id: 'programmes', title: 'NGO and donor health programmes', findings: [
      { type: 'records', caption: 'Health programme records (evidence type shown; pooled totals are not Siaya figures)', columns: ['ID', 'Programme', 'Implementer', 'Funder', 'Geography', 'Evidence type'],
        rows: health.map(([p, i]) => [p.id, p.title, p.implementing_organisation, p.funder, words(p.geography.class), fig('siaya-programmes.json', P('programmes', i, 'evidence_type'), { label: 'Evidence type', source: p.sources[0] && p.sources[0].source_id, page: p.sources[0] && p.sources[0].page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` })]) },
    ], interpretation: ['Self-reported results are the implementer’s own account; only independently evaluated outcomes are treated as evaluated.'] },
    { id: 'equity', title: 'Geographic equity and small cells', findings: [
      { type: 'p', text: 'All health figures here are aggregates for the county or a sub-county. Any count of people below 10 would be suppressed; none of the values held is a count of that size. No patient-level or facility-level personal data are held.' },
    ], interpretation: [] },
    { id: 'conflicts', title: 'Conflicting values', findings: [{ type: 'conflicts', caption: 'Health: values that disagree, shown together', groups: healthConflicts() }], interpretation: [] },
  ];
}

// ---------- Report D: Development and investment opportunities ----------
function reportD() {
  const latest = (vintage, year) => each('siaya-economy.json', '/observations', (o) => o.indicator === 'gva_by_activity' && o.vintage === vintage && o.period === year).map(([o, p]) => ({ f: econFig(o, p) }));
  const constraintStatuses = /^(delayed|suspended|cancelled|unknown)$/;
  return [
    { id: 'scope', title: 'Scope and limits', findings: [
      { type: 'p', text: 'This report lists only what the documents held say about sectors, service gaps and infrastructure constraints. It does not estimate market sizes, returns, costs or project financials: none of these is published in the documents held, and inventing them would mislead. Where evidence is absent, the report says so.' },
    ], interpretation: [] },
    { id: 'sectors', title: 'Economic sectors (Gross County Product)', findings: [
      { type: 'figs', caption: 'Gross value added by activity, 2024, current prices (KNBS GCP 2025; 2024 provisional)', rows: latest('GCP2025', '2024') },
      { type: 'figs', caption: 'Growth', rows: each('siaya-economy.json', '/observations', (o) => o.indicator === 'real_growth_avg').map(([o, p]) => ({ f: econFig(o, p) })) },
      { type: 'pairs', caption: 'Revisions to gross value added by activity between editions', aLabel: 'GCP 2024 edition', bLabel: 'GCP 2025 edition', rows: econRevisions((r) => r.indicator === 'gva_by_activity' && Math.abs(held('siaya-economy.json', `/revisions/${ECON.revisions.indexOf(r)}/difference_pct`) || 0) >= 5) },
    ], interpretation: ['Agriculture, forestry and fishing is the largest activity in the county accounts. Sector size alone says nothing about profitability or investability.'] },
    { id: 'value-chains', title: 'Value chains: agriculture, livestock and fisheries', findings: [
      { type: 'figs', caption: 'Production, area and value as printed (two sources, different years and units)', rows: each('siaya-agriculture.json', '/observations', (o) => o.status === 'observed').map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'figs', caption: 'County plan targets (plans, not outcomes)', rows: each('siaya-agriculture.json', '/observations', (o) => o.status === 'target').map(([o, p]) => ({ f: agriFig(o, p) })) },
      { type: 'conflicts', caption: 'Agriculture: conflicting values', groups: agriConflicts() },
    ], interpretation: ['Yields, prices and margins are not published in the sources held, so no value chain can be ranked by return.'] },
    { id: 'service-gaps', title: 'Service gaps', findings: [
      { type: 'figs', caption: 'Water and sanitation coverage', rows: each('siaya-climate.json', '/observations', (o) => o.kind === 'coverage').map(([o, p]) => ({ f: climFig(o, p) })) },
      { type: 'figs', caption: 'Health staffing by sub-county, 2022', rows: healthRows((o) => /^population-per-/.test(o.measure)) },
      { type: 'figs', caption: 'Pre-primary and vocational training indicators (devolved functions)', rows: each('siaya-education.json', '/observations', (o) => o.function === 'devolved' && /enrolment|teachers_required|pupil_teacher|centres/.test(o.indicator) && (!o.sex || o.sex === 'total')).map(([o, p]) => ({ f: eduFig(o, p) })) },
    ], interpretation: ['Among the indicators held, doctor coverage varies most between sub-counties, and the water-access figures depend heavily on which definition a document uses.'] },
    { id: 'infrastructure', title: 'Infrastructure constraints', findings: [
      { type: 'records', caption: 'Projects recorded as delayed, suspended, cancelled or of unknown status (contractors are not named)', columns: PROJECT_COLS, rows: projectRows((p) => constraintStatuses.test(p.status)) },
      { type: 'figs', caption: 'Climate hazard exposure calculated by Takwimu', rows: analysisRows((r) => r.family === 'A7') },
    ], interpretation: ['Stalled public works and ward-level flood and drought hotspots are constraints any investment would have to plan around.'] },
    { id: 'not-assessed', title: 'Investability screening, market size and returns', findings: [
      { type: 'p', text: 'Not assessed. The documents held publish no market sizes, prices, costs, returns or project financial models for Siaya. An investability screen would need them. This section is left empty on purpose rather than filled with assumptions.' },
    ], interpretation: [] },
    { id: 'risks', title: 'Risk register (evidence risks)', findings: [
      { type: 'p', text: 'The risks listed here are risks to the evidence itself: conflicting values and missing data that any decision based on this report would carry. They are taken from the data gaps and conflicts recorded in the data files; no commercial risk is rated.' },
      { type: 'conflicts', caption: 'Water access: figures with different definitions', groups: climConflicts() },
    ], interpretation: [] },
  ];
}

// ---------- Report E: Programme atlas ----------
function reportE() {
  const rows = PROG.programmes.map((p, i) => [p, i]);
  const evFig = (p, i) => fig('siaya-programmes.json', P('programmes', i, 'evidence_type'), { label: 'Evidence type', source: p.sources[0] && p.sources[0].source_id, page: p.sources[0] && p.sources[0].page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` });
  const grants = PROG.summary.siaya_development_partner_grants_kes.map((g, i) => ({ f: progFig(P('summary', 'siaya_development_partner_grants_kes', i, 'total'), `Development partner grants to the county, ${g.kind}`, { unit: g.currency, period: g.period, source: 'GOV-03', note: `Sum of ${g.record_ids.length} Siaya-specific records (${g.record_ids.join(', ')})` }) }));
  const evals = rows.filter(([p]) => p.evaluation && p.evaluation.by);
  const outcomes = (ev) => rows.filter(([p]) => p.evidence_type === ev).flatMap(([p, i]) => (p.outputs_outcomes_as_stated || []).map((s, j) => [p.id, p.title, words(s.kind),
    fig('siaya-programmes.json', P('programmes', i, 'outputs_outcomes_as_stated', j, 'text'), { label: 'Statement', source: s.source && s.source.source_id, page: s.source && s.source.page, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, confidence: `tier ${p.tier}` }),
    s.attributable_to_siaya ? 'Yes' : 'No']));
  return [
    { id: 'summary', title: 'Summary', findings: [
      { type: 'figs', caption: 'Programme records by geography and evidence type', rows: [
        { f: progFig('/summary/record_count', 'Programme records', { unit: 'records' }) },
        ...Object.keys(PROG.summary.by_geography_class).map((k) => ({ f: progFig(P('summary', 'by_geography_class', k), `Records: ${words(k)}`, { unit: 'records' }) })),
        ...Object.keys(PROG.summary.by_evidence_type).map((k) => ({ f: progFig(P('summary', 'by_evidence_type', k), `Records: ${words(k)}`, { unit: 'records' }) })),
      ] },
      { type: 'figs', caption: 'Development partner grants in the county budget (Siaya-specific records only)', rows: grants },
    ], interpretation: ['Pooled multi-county and national amounts are shown on their own records and are never summed into a Siaya total.'] },
    { id: 'register', title: 'Programme register', findings: [
      { type: 'records', caption: 'All programme records', columns: ['ID', 'Programme', 'Implementer', 'Funder', 'Sector', 'Geography', 'Evidence type'],
        rows: rows.map(([p, i]) => [p.id, p.title, p.implementing_organisation, p.funder || 'Not stated', words(p.sector), words(p.geography.class), evFig(p, i)]) },
    ], interpretation: [] },
    { id: 'amounts', title: 'Disclosed amounts', findings: [
      { type: 'figs', caption: 'Amounts as disclosed (pooled totals labelled; blank or dash printed values are shown as not published)', rows: rows.flatMap(([p, i]) => p.amounts.map((a, j) => ({ f: progAmountFig(p, i, a, j) }))) },
    ], interpretation: [] },
    { id: 'reach', title: 'Beneficiaries and geographic reach', findings: [
      { type: 'figs', caption: 'Beneficiary counts as stated by the source', rows: rows.flatMap(([p, i]) => p.beneficiaries.map((b, j) => ({ f: fig('siaya-programmes.json', P('programmes', i, 'beneficiaries', j, 'value'), { label: `${p.title}: ${b.as_printed || 'beneficiaries'}${b.pooled ? ' (pooled, not a Siaya figure)' : ''}`, unit: b.unit, period: p.period && `${p.period.start || '?'} to ${p.period.end || '?'}`, source: b.source && b.source.source_id, page: b.source && b.source.page, confidence: `tier ${p.tier}`, suppressSmall: true }) }))) },
    ], interpretation: [] },
    { id: 'evaluations', title: 'Evaluations', findings: [
      { type: 'records', caption: 'Independent evaluations (rating as published; Siaya results only where disaggregated)', columns: ['ID', 'Programme', 'Evaluated by', 'Rating as published', 'Scope', 'Siaya disaggregated'],
        rows: evals.map(([p, i]) => [p.id, p.title, p.evaluation.by, fig('siaya-programmes.json', P('programmes', i, 'evaluation', 'rating_as_published'), { label: 'Rating', period: p.evaluation.date, source: p.evaluation.source && p.evaluation.source.source_id, page: p.evaluation.source && p.evaluation.source.page, confidence: `tier ${p.tier}` }), p.evaluation.scope || 'Not stated', p.evaluation.siaya_disaggregated ? 'Yes' : 'No']) },
      { type: 'records', caption: 'Results stated in independently evaluated records', columns: ['ID', 'Programme', 'Kind', 'Statement as published', 'Siaya-specific'], rows: outcomes('independently_evaluated') },
      { type: 'records', caption: 'Results self-reported by the implementer or publisher (not evaluated)', columns: ['ID', 'Programme', 'Kind', 'Statement as published', 'Siaya-specific'], rows: outcomes('self_reported') },
    ], interpretation: ['Self-reported achievements are the implementer’s own account and are listed apart from independently evaluated outcomes.'] },
    { id: 'screened', title: 'Documents screened out', findings: [
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
  };
}
export const SLUGS = registry.reports.map((r) => r.slug);
export { get, find };
