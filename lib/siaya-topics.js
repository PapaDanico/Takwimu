// Siaya topic datasets (health, education, agriculture, geography, climate, analysis): catalogue entries for
// /datasets/ and the downloads, built from the validated data files. Values are as stored; nothing is filled,
// rounded or recomputed. Every dataset here was transcribed or calculated by Takwimu and has not been checked by
// a reviewer, so lib/dataset-status.js gives each the status "provisional" (awaiting editorial review).
// Server and build only. Data files are read through lib/review-status.js masked(): a rejected value is never exported.
const { SITE_URL } = require('./site-url');
const rs = require('./review-status');
const health = rs.masked('siaya-health');
const edu = rs.masked('siaya-education');
const agri = rs.masked('siaya-agriculture');
const geo = require('../data/siaya-geography.json');
const clim = rs.masked('siaya-climate');
const wgeo = require('../data/siaya-wards-geo.json');
const ana = rs.masked('siaya-analysis');
const { source, pageRef } = require('./siaya-sources');
const prj = require('./projects');
const prog = rs.masked('siaya-programmes');
const dep = rs.masked('siaya-budget-departments');
const ser = rs.masked('siaya-county-series');
const lay = rs.masked('siaya-analysis-layers');
const ind = rs.masked('indicators');

// Review columns for every download row (lib/review-status.js): the public label, and the rationale when withdrawn.
const rv = (dataset, id) => { const r = rs.review(dataset, id); return r ? { review_status: r.label, review_note: r.hide ? r.reason : '' } : { review_status: '', review_note: '' }; };
const { yearsBetween } = require('./siaya-years');
const yearsOf = (periods) => [...new Set(periods.flatMap((p) => (String(p).match(/\b(19|20)\d{2}\b/g) || []).map(Number)))].sort((a, b) => a - b);
const src = (id) => { const s = source(id); return { source_title: s.title, source_url: s.url || '' }; };
const page = (o) => pageRef(o.pdf_page, o.printed_page, o.page_note);

const healthRows = () => health.observations.map((o) => ({
  id: o.id, measure: o.measure, label: o.label, value: o.value, unit: o.unit, period: o.period, vintage: o.vintage, age_group: o.age_group, sex: o.sex || '',
  geography: o.geography, geography_detail: o.geography_detail, method: o.method, status: o.status, sentinel_site: o.sentinel_site ? 'yes' : 'no', original_source: o.original_source || '',
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id), ...rv('siaya-health', o.id),
}));
const eduRows = () => edu.observations.map((o) => ({
  id: o.id, indicator: o.indicator, function: o.function, level: o.level, sex: o.sex, sector: o.sector, period: o.period, value: o.value, unit: o.unit, value_type: o.value_type,
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id), ...rv('siaya-education', o.id),
}));
const agriRows = () => agri.observations.map((o) => ({
  id: o.id, indicator: o.indicator, commodity: o.commodity, status: o.status, period: o.period, value: o.value, value_as_printed: o.value_as_printed, unit: o.unit, provisional: o.provisional ? 'yes' : 'no',
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id), ...rv('siaya-agriculture', o.id),
}));
const geoRows = () => geo.wards.map((w) => {
  const c = geo.constituencies.find((x) => x.id === w.parent);
  return { ward_id: w.id, ward: w.name, iebc_ward_code: w.iebc_ward_code, constituency: c.name, iebc_constituency_code: w.iebc_constituency_code, county: geo.county.name, iebc_county_code: geo.county.iebc_county_code, aliases: w.aliases.map((a) => `${a.name} (${a.seen_in})`).join('; '), source_names: Object.entries(w.source_names).map(([k, v]) => `${k}: ${v}`).join('; '), boundary_vintage: geo.boundary_vintage };
});
const climRows = () => clim.observations.map((o) => ({
  id: o.id, kind: o.kind, series: o.series, measure: o.measure, value: o.value, value_text: o.value_text || '', unit: o.unit || '', hazard: o.hazard || '', hotspots_as_printed: o.hotspots_as_printed || '', rank_as_printed: o.rank_as_printed || '',
  ward: o.ward_register_name || '', sub_county: o.sub_county || '', geography: o.geography, period: o.period, definition: o.definition, table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id), ...rv('siaya-climate', o.id),
}));
const indRows = () => ind.observations.map((o) => ({
  id: o.id, domain: o.domain, indicator: o.indicator, label: o.label, area: o.area, geography: o.geography, value: o.value, value_as_printed: o.value_as_printed || '', bound: o.bound ? `${o.bound.relation} ${o.bound.limit}` : '',
  standard_error: o.standard_error ?? '', unit: o.unit, period: o.period, kind: o.kind, provisional_in_source: o.provisional_in_source ? 'yes' : '', comparator: o.comparator ? `${o.comparator.label}: ${o.comparator.value_as_printed}` : '',
  table: o.table, row: o.row, column: o.column, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id,
  source_title: (ind.sources.find((s) => s.source_id === o.source_id) || {}).title || '', source_url: (ind.sources.find((s) => s.source_id === o.source_id) || {}).url || '', ...rv('indicators', o.id),
}));
const anaRows = () => ana.records.map((r) => ({
  calc_id: r.calc_id, family: r.family, status: r.status, title: r.title, result: r.result, unit: r.unit, period: r.period, formula: r.formula,
  inputs: (r.inputs || []).map((i) => `${i.role}: ${i.withheld ? 'withdrawn after editorial review' : `${i.value} ${i.unit}`} (${i.source_id}${i.pdf_page ? `, PDF p. ${i.pdf_page}` : ''})`).join('; '), gap_reason: r.gap_reason || '', caveat: r.caveat, confidence: r.confidence ?? '', label: r.label,
  ...rv('siaya-analysis', r.calc_id),
}));

const depRows = () => dep.observations.map((o) => ({
  id: o.id, fy: o.fy, dept_code: o.dept_code, printed_name: o.printed_name, measure: o.measure, class: o.class, budget_version: o.budget_version || '', includes_balance_bf: o.includes_balance_bf === null || o.includes_balance_bf === undefined ? 'not stated' : o.includes_balance_bf ? 'yes' : 'no',
  value: o.value, unit: o.unit, original_text: o.original_text, document_kind: o.document_kind, table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), read_method: o.read_method, confidence: o.confidence, source_id: o.source_id, ...src(o.source_id), ...rv('siaya-budget-departments', o.id),
}));
const serRows = () => ser.observations.map((o) => ({
  id: o.id, series: o.series, fy: o.fy, measure: o.measure, value: o.value, unit: o.unit, original_text: o.original_text || '', basis: o.basis || '', table: o.table || '', pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), read_method: o.read_method || '', confidence: o.confidence ?? '',
  needs_human_check: o.needs_human_check ? 'yes' : 'no', source_id: o.source_id, ...src(o.source_id), ...rv('siaya-county-series', o.id),
}));
const layRows = () => lay.records.map((r) => ({
  calc_id: r.calc_id, family: r.family, status: r.status, title: r.title, result: r.result, unit: r.unit, period: r.period, formula: r.formula,
  inputs: (r.inputs || []).map((i) => `${i.role}: ${i.withheld ? 'withdrawn after editorial review' : `${i.value} ${i.unit}`} (${i.source_id}${i.pdf_page ? `, PDF p. ${i.pdf_page}` : ''})`).join('; '),
  shown_beside: (r.beside || []).map((i) => `${i.role}: ${i.value} (${i.source_id}${i.pdf_page ? `, PDF p. ${i.pdf_page}` : ''})`).join('; '),
  threshold: r.threshold ? `${r.threshold.value}${r.threshold.unit} ${r.threshold.kind}` : '', threshold_source: r.threshold ? r.threshold.rule : '', flags: Object.entries(r.flags || {}).filter(([, v]) => v === true).map(([k]) => k).join('; '),
  gap_reason: r.gap_reason || '', caveat: r.caveat || '', confidence: r.confidence ?? '', label: r.label, ...rv('siaya-analysis-layers', r.calc_id),
}));

const COMMON = { geography: 'county', area: 'Siaya County', last_updated: '2026-11-21', retrieved: '2026-11-21' };
const TOPIC_DATASETS = [
  {
    ...COMMON, id: 'siaya-health', title: 'Siaya County: health indicators by source, estimate round and geography', sector: 'health',
    description: `${health.observations.length} published health values for Siaya (HIV estimates by model round, TB, malaria, maternal care, immunisation, stunting, health workforce, community health) from ${health.sources.length} sources. Each value keeps its round, age group, geography, page and confidence; ${health.conflicts.length} sets of disagreeing values are kept side by side. Sentinel-site and press figures are marked as such.`,
    period: { from: '2003', to: '2026' }, years: yearsOf(health.observations.map((o) => o.period)), source: 'NSDCC; KNBS and MoH (KDHS); County Government of Siaya; NTLD-P; KEMRI/CDC', source_detail: health.sources.map((s) => s.title).join('; '),
    source_url: health.sources.find((s) => s.id === 'NSDCC-PROFILES-2026').url, unit: 'per cent; people; rates as printed', coverage: `Siaya County (some sub-county and one sentinel-site value), ${health.observations.length} values`,
    method: `${health.meta.rule} Transcribed by Takwimu from the PDF text layers; not yet checked by a reviewer.`, views: [{ href: '/counties/siaya/health/', label: 'Health in Siaya' }], tags: ['Siaya', 'health', 'HIV', 'KDHS'],
    files: { csv: '/data/datasets/siaya-health.csv', json: '/data/siaya-health.json' }, rows: healthRows,
  },
  {
    ...COMMON, id: 'siaya-education', title: 'Siaya County: education and training (devolved and national functions kept apart)', sector: 'education',
    description: `${edu.observations.length} published values on pre-primary (ECDE), primary, secondary, vocational training, bursaries and attainment in Siaya from ${edu.sources.length} sources, each marked as a county (devolved) or national function. ${edu.conflicts.length} source inconsistencies are kept side by side.`,
    period: { from: '2013', to: '2027' }, years: yearsOf(edu.observations.map((o) => o.period)), source: 'Ministry of Education; KNBS; County Government of Siaya; KDHS', source_detail: edu.sources.map((s) => s.title).join('; '),
    source_url: edu.sources.find((s) => s.source_id === 'MOE-BESB-2019').url, unit: 'pupils; teachers; per cent; KSh as printed', coverage: `Siaya County, ${edu.observations.length} values`,
    method: `${edu.meta.rule} Transcribed by Takwimu; not yet checked by a reviewer.`, views: [{ href: '/counties/siaya/education/', label: 'Education in Siaya' }], tags: ['Siaya', 'education', 'ECDE', 'VTC'],
    files: { csv: '/data/datasets/siaya-education.csv', json: '/data/siaya-education.json' }, rows: eduRows,
  },
  {
    ...COMMON, id: 'siaya-agriculture', title: 'Siaya County: agriculture, livestock, fisheries and irrigation (observed values and plan targets kept apart)', sector: 'economy',
    description: `${agri.observations.length} printed values (${agri.observations.filter((o) => o.status === 'observed').length} observed, ${agri.observations.filter((o) => o.status !== 'observed').length} targets) on crops, livestock, fish and irrigation from the KNBS Siaya County Statistical Abstract 2015 and the CIDP 2023-2027. Targets are never shown as observed; ${agri.conflicts.length} unit and value conflicts are kept side by side.`,
    period: { from: '2013', to: '2027' }, years: yearsOf(agri.observations.map((o) => o.period)), source: 'KNBS; County Government of Siaya', source_detail: agri.sources.map((s) => s.title).join('; '),
    source_url: agri.sources[0].url, unit: 'ha; tonnes; bags; head; KSh as printed', coverage: `Siaya County, ${agri.observations.length} values`,
    method: `${agri.meta.rule} Transcribed by Takwimu; not yet checked by a reviewer.`, views: [{ href: '/counties/siaya/agriculture/', label: 'Agriculture in Siaya' }], tags: ['Siaya', 'agriculture', 'fisheries', 'livestock'],
    files: { csv: '/data/datasets/siaya-agriculture.csv', json: '/data/siaya-agriculture.json' }, rows: agriRows,
  },
  {
    ...COMMON, id: 'siaya-wards', title: 'Siaya County: constituencies and county assembly wards (IEBC codes, spellings and aliases)', sector: 'people',
    description: `The ${geo.constituencies.length} IEBC constituencies and ${geo.wards.length} county assembly wards of Siaya with their IEBC codes, the spelling in each source and recorded aliases, and the county-government and KNBS sub-county names kept as separate naming systems.`,
    period: { from: '2012', to: '2025' }, years: [2012, 2017, 2022, 2025], source: 'IEBC; County Government of Siaya', source_detail: geo.sources.map((s) => s.title).join('; '),
    source_url: geo.sources[0].url, unit: 'codes and names', coverage: `${geo.constituencies.length} constituencies, ${geo.wards.length} wards`,
    method: `${geo.official_name_rule} ${geo.boundary_vintage}`, views: [{ href: '/counties/siaya/wards/', label: 'Wards and constituencies' }], tags: ['Siaya', 'wards', 'IEBC', 'geography'],
    files: { csv: '/data/datasets/siaya-wards.csv', json: '/data/siaya-geography.json' }, rows: geoRows,
  },
  {
    ...COMMON, id: 'siaya-ward-boundaries', title: 'Siaya County: ward boundaries for display (American Red Cross via HDX, 2016)', sector: 'people',
    description: `Simplified outlines of the ${wgeo.features.length} county assembly wards of Siaya, matched one to one to the ward registry. ${wgeo.meta.attribution}. Not an official IEBC map; boundary changes since 2016 are not shown.`,
    period: { from: '2016', to: '2016' }, years: [2016], source: 'American Red Cross (HDX)', source_detail: `${wgeo.meta.dataset}, ${wgeo.meta.licence_text}`,
    source_url: wgeo.meta.dataset_url, unit: 'polygons (longitude, latitude)', coverage: `${wgeo.features.length} wards`,
    method: wgeo.meta.simplification, views: [{ href: '/counties/siaya/wards/', label: 'Ward map' }], tags: ['Siaya', 'wards', 'map', 'HDX'],
    files: { csv: '/data/datasets/siaya-ward-boundaries.csv', json: '/data/siaya-wards-geo.json' },
    rows: () => wgeo.features.map((f) => ({ ward_id: f.properties.ward_id, ward_code: f.properties.ward_code, ward: f.properties.ward_name, constituency: f.properties.constituency_name, label_lon: f.properties.label[0], label_lat: f.properties.label[1], attribution: wgeo.meta.attribution })),
  },
  {
    ...COMMON, id: 'siaya-climate', title: 'Siaya County: climate hazards, water coverage and climate finance (allocation, receipt, transfer, expenditure kept apart)', sector: 'environment',
    description: `${clim.observations.length} values: ward flood and drought hotspots as printed in the PCRA (no ward ranking is printed), water and sanitation coverage from KDHS 2022, the CIDP and WASREB with each definition, and FLLoCA and water-department money by kind. Allocation, receipt, transfer and expenditure are separate series; none is an outcome.`,
    period: { from: '2022', to: '2026' }, years: yearsOf(clim.observations.map((o) => o.period)), source: 'County Government of Siaya; KDHS; WASREB', source_detail: clim.sources.map((s) => s.title).join('; '),
    source_url: clim.sources.find((s) => s.id === 'WASREB-IMPACT-18').url, unit: 'KSh; per cent; hotspots as printed', coverage: `Siaya County and its wards, ${clim.observations.length} values`,
    method: `${clim.meta.rule} The PCRA's participant list (Annex 1) holds personal data and is never extracted or republished.`, views: [{ href: '/counties/siaya/climate/', label: 'Climate, water and resilience' }], tags: ['Siaya', 'climate', 'FLLoCA', 'water'],
    files: { csv: '/data/datasets/siaya-climate.csv', json: '/data/siaya-climate.json' }, rows: climRows,
  },
  {
    ...COMMON, id: 'siaya-indicators', title: 'Siaya County: poverty (KNBS 2022), KDHS 2022 fact sheet, Sibo water utility (WASREB) and lake fish landings', sector: 'people',
    description: `${ind.observations.length} values: food, overall and hardcore poverty for Siaya from the Kenya Poverty Report 2022 (headcount, share of the national poor, gap, severity, population and number of poor as printed, with national figures beside and standard errors where printed); KDHS 2022 county fact-sheet indicators with the Kenya figure beside; WASREB IMPACT 18 figures for the Sibo utility service area and Siaya's low-income-area budget; and lake totals of fish landed from two Economic Survey editions. Utility figures cover a service area, not the county; lake totals cover all riparian counties and are never assigned to one county.`,
    period: { from: '2019', to: '2024' }, years: yearsOf(ind.observations.map((o) => o.period)), source: 'KNBS; WASREB', source_detail: ind.sources.map((s) => s.title).join('; '),
    source_url: ind.sources[0].url, unit: 'per cent; thousand persons; rates per 1,000; KSh; tonnes', coverage: `Siaya County and Kenyan lake landings, ${ind.observations.length} values`,
    method: ind.meta.rule, last_updated: '2026-11-28', retrieved: ind.meta.extracted, views: [{ href: '/datasets/', label: 'Datasets' }], tags: ['Siaya', 'poverty', 'KNBS', 'KDHS', 'WASREB', 'water', 'fisheries', 'Lake Victoria'],
    files: { csv: '/data/datasets/siaya-indicators.csv', json: '/data/indicators.json' }, rows: indRows,
  },
  {
    ...COMMON, id: 'siaya-analysis', title: 'Siaya County: analytical measures calculated by Takwimu Kenya from published figures', sector: 'public finance',
    description: `${ana.records.length} records (${ana.records.filter((r) => r.status === 'value').length} values, ${ana.records.filter((r) => r.status === 'gap').length} gaps with reasons): real per-capita spending, transfer dependency, shares of budget spent beside printed rates, pending bills, audit recurrence, budget beside service context and climate finance beside hotspot wards. Each has a calc_id, a formula in words and its inputs with sources.`,
    period: { from: 'FY 2013/14', to: 'FY 2025/26' }, years: yearsBetween(2013, 2026), source: 'Takwimu Kenya (calculated)', source_detail: ana.meta.label,
    source_url: SITE_URL + '/counties/siaya/analysis/', unit: 'as stated per record', coverage: `Siaya County, ${ana.records.length} records`,
    method: ana.meta.rule, views: [{ href: '/counties/siaya/analysis/', label: 'Siaya analysis' }], tags: ['Siaya', 'analysis', 'calculated'],
    files: { csv: '/data/datasets/siaya-analysis.csv', json: '/data/siaya-analysis.json' }, rows: anaRows,
  },
  {
    ...COMMON, id: 'siaya-projects', title: 'Siaya County: development project register (reported and audit-found status side by side)', sector: 'public finance',
    description: `${prj.pub.projects.length} county development projects named in the CIDP, county and Controller of Budget reports and Auditor-General reports, each with a status from eight states, the document behind it, what the county reported beside what the auditor found, amounts as printed and linked audit finding ids. Only one project is independently verified as complete. Contractor names are withheld pending editorial review.`,
    period: { from: 'FY 2018/19', to: 'FY 2025/26' }, years: yearsBetween(2018, 2026), source: 'County Government of Siaya; Controller of Budget; Auditor-General', source_detail: prj.pub.documents.map((d) => d.title).join('; '),
    source_url: prj.pub.documents.find((d) => d.doc_id === 'audit-2024-25').url, unit: 'projects; KSh as printed', coverage: `${prj.pub.projects.length} projects from ${prj.pub.documents.length} documents (not exhaustive)`,
    method: `${prj.pub.meta.status_rules.join(' ')} Contractor company names are withheld from the public data pending editorial review.`, views: [{ href: '/counties/siaya/projects/', label: 'Development project register' }], tags: ['Siaya', 'projects', 'audit', 'stalled projects'],
    files: { csv: '/data/datasets/siaya-projects.csv', json: '/data/siaya-projects.json' }, rows: prj.datasetRows,
  },
  {
    ...COMMON, id: 'siaya-programmes', title: 'Siaya County: NGO and development partner programme atlas (Siaya-specific and pooled kept apart)', sector: 'governance',
    description: `${prog.programmes.length} programmes active since 2016 that name Siaya: ${prog.summary.by_geography_class.siaya_specific + prog.summary.by_geography_class.siaya_wards_listed} Siaya-specific and ${prog.summary.by_geography_class.multi_county_including_siaya + prog.summary.by_geography_class.national} multi-county or national. Pooled amounts are marked and never added to Siaya totals; evidence type is given for each record; screened-out reports are listed.`,
    period: { from: '2016', to: '2026' }, years: yearsBetween(2016, 2026), source: 'County Government of Siaya; World Bank; IATI publishers', source_detail: prog.sources.map((s) => s.title).join('; '),
    source_url: prog.sources.find((s) => s.id === 'GOV-03').url, unit: 'as published (KES, USD); records', coverage: `${prog.programmes.length} programmes`,
    method: prog.meta.rules.join(' '), views: [{ href: '/counties/siaya/programmes/', label: 'NGO and development partner atlas' }], tags: ['Siaya', 'NGO', 'donors', 'development partners'],
    files: { csv: '/data/datasets/siaya-programmes.csv', json: '/data/siaya-programmes.json' },
    rows: () => prog.programmes.map((p) => ({ id: p.id, title: p.title, implementing_organisation: p.implementing_organisation, funder: p.funder || '', funder_basis: p.funder_basis, sector: p.sector, geography_class: p.geography.class, start: p.period.start || '', end: p.period.end || '', evidence_type: p.evidence_type,
      amounts: rs.review('siaya-programmes', p.id).hide ? '' : p.amounts.map((a) => `${a.kind} ${a.value === null ? 'not printed' : a.value} ${a.currency} (${a.period}; ${a.pooled ? 'pooled total, not a Siaya figure' : 'Siaya-specific'}; ${a.source.source_id})`).join('; '), sources: p.sources.map((s) => s.source_id).join('; '), ...rv('siaya-programmes', p.id) })),
  },
  {
    ...COMMON, last_updated: '2026-11-27', retrieved: dep.meta.retrieved, id: 'siaya-budget-departments', title: 'Siaya County: budgets and spending by department (programme-based budgets and budget review papers)', sector: 'public finance',
    description: `${dep.observations.length} printed values: department budgets from ${dep.sources.filter((s) => s.kind === 'PBB').length} programme-based budgets and final budget against actual spending by department from ${dep.sources.filter((s) => s.kind === 'CBROP').length} County Budget Review and Outlook Papers, with a crosswalk of ${dep.crosswalk.length} printed department names. Budget versions and balances brought forward are kept apart; ${dep.sum_checks.filter((c) => c.status === 'does not add').length + dep.row_checks.filter((c) => c.status === 'does not add').length} printed totals that do not add up are flagged, never corrected.`,
    period: { from: 'FY 2014/15', to: 'FY 2025/26' }, years: yearsBetween(2014, 2026), source: 'County Government of Siaya (County Treasury), via the KIPPRA repository', source_detail: dep.sources.map((s) => s.title).join('; '),
    source_url: dep.sources[0].url, unit: 'KSh (whole shillings as printed)', coverage: `Siaya County departments, ${dep.observations.length} values`,
    method: `${dep.meta.rule} ${dep.meta.read_method}`, views: [{ href: '/counties/siaya/departments/', label: 'Department budgets and spending' }, { href: '/counties/siaya/analysis/spending/#an-b4', label: 'Absorption by department' }], tags: ['Siaya', 'budget', 'departments', 'PBB', 'CBROP'],
    files: { csv: '/data/datasets/siaya-budget-departments.csv', json: '/data/siaya-budget-departments.json' }, rows: depRows,
  },
  {
    ...COMMON, last_updated: '2026-11-27', retrieved: ser.meta.retrieved, id: 'siaya-county-series', title: 'Siaya County: County Treasury totals and Auditor-General revenue statements (cash, accrual and treasury tables kept apart)', sector: 'public finance',
    description: `${ser.observations.length} printed values: County Treasury totals by economic classification and own-source revenue (budget review papers), the Auditor-General's Receiver of Revenue tables (two report vintages) and audited statements on cash and accrual bases, and the County Revenue Fund for FY 2024/25. ${ser.comparisons.length} years of own-source revenue are compared across publishers, never blended.`,
    period: { from: 'FY 2013/14', to: 'FY 2024/25' }, years: yearsBetween(2013, 2025), source: 'County Government of Siaya (County Treasury); Office of the Auditor-General', source_detail: ser.sources.map((s) => s.title).join('; '),
    source_url: ser.sources[0].url, unit: 'KSh (as printed)', coverage: `Siaya County, ${ser.observations.length} values`,
    method: `${ser.meta.rule} ${ser.meta.ocr_rule}`, views: [{ href: '/counties/siaya/ledger/#osr-series', label: 'Own-source revenue by publisher' }], tags: ['Siaya', 'own-source revenue', 'Auditor-General', 'CBROP'],
    files: { csv: '/data/datasets/siaya-county-series.csv', json: '/data/siaya-county-series.json' }, rows: serRows,
  },
  {
    ...COMMON, last_updated: '2026-11-27', retrieved: '2026-11-27', id: 'siaya-analysis-layers', title: 'Siaya County: wage bill, development share, own-source revenue, department absorption and pending bills burden (calculated by Takwimu Kenya)', sector: 'public finance',
    description: `${lay.records.length} records (${lay.records.filter((r) => r.status === 'value').length} values, ${lay.records.filter((r) => r.status === 'gap').length} gaps with reasons): wage bill beside the 35 per cent ceiling, development share beside the 30 per cent floor, own-source revenue against target, in real terms and per person by publisher, absorption by department, and pending bills beside the 20 per cent limit the Auditor-General applies. The Auditor-General's own ratios are shown beside, not combined.`,
    period: { from: 'FY 2013/14', to: 'FY 2025/26' }, years: yearsBetween(2013, 2026), source: 'Takwimu Kenya (calculated)', source_detail: lay.meta.label,
    source_url: SITE_URL + '/counties/siaya/analysis/', unit: 'as stated per record', coverage: `Siaya County, ${lay.records.length} records`,
    method: lay.meta.rule, views: [{ href: '/counties/siaya/analysis/spending/#an-b1', label: 'Siaya analysis (B1, B2, B4, B5)' }, { href: '/counties/siaya/ledger/#osr-b3', label: 'Own-source revenue (B3)' }], tags: ['Siaya', 'analysis', 'calculated', 'wage bill', 'pending bills'],
    files: { csv: '/data/datasets/siaya-analysis-layers.csv', json: '/data/siaya-analysis-layers.json' }, rows: layRows,
  },
];

// Status reasons (lib/dataset-status.js): every one is provisional, awaiting editorial review.
const TOPIC_STATUS = {
  'siaya-health': 'Transcribed by Takwimu from the source PDFs and web pages (text layer) and not yet checked by a reviewer: awaiting editorial review. HIV estimates from different model rounds are not comparable; press figures are secondary reports.',
  'siaya-education': 'Transcribed by Takwimu from the statistical booklets, the KNBS abstract, the CIDP and KDHS and not yet checked by a reviewer: awaiting editorial review. Ten source inconsistencies are kept side by side.',
  'siaya-agriculture': 'Transcribed by Takwimu from the KNBS abstract and the CIDP and not yet checked by a reviewer: awaiting editorial review. Plan targets are marked as targets; some printed units are unreliable (confidence 1).',
  'siaya-wards': 'Compiled by Takwimu from IEBC documents and the CIDP and not yet checked by a reviewer: awaiting editorial review.',
  'siaya-ward-boundaries': 'Simplified by Takwimu from the HDX ward layer (not an official IEBC map) and not yet checked by a reviewer: awaiting editorial review.',
  'siaya-climate': 'Transcribed by Takwimu from the PCRA, CIDP, county budget reports, KDHS and WASREB and not yet checked by a reviewer: awaiting editorial review. One WASREB value is read from a chart label.',
  'siaya-analysis': 'Calculated by Takwimu Kenya from published figures and not yet checked by a reviewer: awaiting editorial review.',
  'siaya-indicators': 'Transcribed by Takwimu from the KNBS Kenya Poverty Report 2022, the KDHS 2022 Siaya fact sheet, WASREB IMPACT 18 and the Economic Surveys 2024 and 2025 (PDF text layer, checked against the page image) and not yet checked by a reviewer: awaiting editorial review. Poverty counts and rates are rounded independently, as printed.',
  'siaya-projects': 'Compiled by Takwimu from county, Controller of Budget and Auditor-General reports (some pages by OCR) and not yet checked by a reviewer: awaiting editorial review. Contractor names are withheld pending that review.',
  'siaya-programmes': 'Compiled by Takwimu from county documents, the World Bank projects database and IATI files and not yet checked by a reviewer: awaiting editorial review. Registry records are self-reported by their publishers.',
  'siaya-budget-departments': 'Transcribed by Takwimu from the County Treasury programme-based budgets and budget review papers (PDF text layer, machine cross-checked) and not yet checked by a reviewer: awaiting editorial review. Totals that do not add up are flagged as printed.',
  'siaya-county-series': 'Transcribed by Takwimu from County Treasury papers and Auditor-General reports (Auditor-General pages by OCR, each figure read by at least two of three passes) and not yet checked by a reviewer: awaiting editorial review.',
  'siaya-analysis-layers': 'Calculated by Takwimu Kenya from published figures and not yet checked by a reviewer: awaiting editorial review.',
};
const TOPIC_FILES = { 'siaya-indicators': 'indicators.json', 'siaya-health': 'siaya-health.json', 'siaya-education': 'siaya-education.json', 'siaya-agriculture': 'siaya-agriculture.json', 'siaya-wards': 'siaya-geography.json', 'siaya-ward-boundaries': 'siaya-wards-geo.json', 'siaya-climate': 'siaya-climate.json', 'siaya-analysis': 'siaya-analysis.json', 'siaya-projects': 'siaya-projects.json', 'siaya-programmes': 'siaya-programmes.json', 'siaya-budget-departments': 'siaya-budget-departments.json', 'siaya-county-series': 'siaya-county-series.json', 'siaya-analysis-layers': 'siaya-analysis-layers.json' };

module.exports = { TOPIC_DATASETS, TOPIC_STATUS, TOPIC_FILES };
