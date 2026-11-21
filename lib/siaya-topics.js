// Siaya topic datasets (health, education, agriculture, geography, climate, analysis): catalogue entries for
// /datasets/ and the downloads, built from the validated data files. Values are as stored; nothing is filled,
// rounded or recomputed. Every dataset here was transcribed or calculated by Takwimu and has not been checked by
// a reviewer, so lib/dataset-status.js gives each the status "provisional" (awaiting editorial review).
// Server and build only.
const health = require('../data/siaya-health.json');
const edu = require('../data/siaya-education.json');
const agri = require('../data/siaya-agriculture.json');
const geo = require('../data/siaya-geography.json');
const clim = require('../data/siaya-climate.json');
const wgeo = require('../data/siaya-wards-geo.json');
const ana = require('../data/siaya-analysis.json');
const { source, pageRef } = require('./siaya-sources');
const prj = require('./projects');
const prog = require('../data/siaya-programmes.json');

const yearsBetween = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const yearsOf = (periods) => [...new Set(periods.flatMap((p) => (String(p).match(/\b(19|20)\d{2}\b/g) || []).map(Number)))].sort((a, b) => a - b);
const src = (id) => { const s = source(id); return { source_title: s.title, source_url: s.url || '' }; };
const page = (o) => pageRef(o.pdf_page, o.printed_page, o.page_note);

const healthRows = () => health.observations.map((o) => ({
  id: o.id, measure: o.measure, label: o.label, value: o.value, unit: o.unit, period: o.period, vintage: o.vintage, age_group: o.age_group, sex: o.sex || '',
  geography: o.geography, geography_detail: o.geography_detail, method: o.method, status: o.status, sentinel_site: o.sentinel_site ? 'yes' : 'no', original_source: o.original_source || '',
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id),
}));
const eduRows = () => edu.observations.map((o) => ({
  id: o.id, indicator: o.indicator, function: o.function, level: o.level, sex: o.sex, sector: o.sector, period: o.period, value: o.value, unit: o.unit, value_type: o.value_type,
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id),
}));
const agriRows = () => agri.observations.map((o) => ({
  id: o.id, indicator: o.indicator, commodity: o.commodity, status: o.status, period: o.period, value: o.value, value_as_printed: o.value_as_printed, unit: o.unit, provisional: o.provisional ? 'yes' : 'no',
  table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id),
}));
const geoRows = () => geo.wards.map((w) => {
  const c = geo.constituencies.find((x) => x.id === w.parent);
  return { ward_id: w.id, ward: w.name, iebc_ward_code: w.iebc_ward_code, constituency: c.name, iebc_constituency_code: w.iebc_constituency_code, county: geo.county.name, iebc_county_code: geo.county.iebc_county_code, aliases: w.aliases.map((a) => `${a.name} (${a.seen_in})`).join('; '), source_names: Object.entries(w.source_names).map(([k, v]) => `${k}: ${v}`).join('; '), boundary_vintage: geo.boundary_vintage };
});
const climRows = () => clim.observations.map((o) => ({
  id: o.id, kind: o.kind, series: o.series, measure: o.measure, value: o.value, value_text: o.value_text || '', unit: o.unit || '', hazard: o.hazard || '', hotspots_as_printed: o.hotspots_as_printed || '', rank_as_printed: o.rank_as_printed || '',
  ward: o.ward_register_name || '', sub_county: o.sub_county || '', geography: o.geography, period: o.period, definition: o.definition, table: o.table, pdf_page: o.pdf_page ?? '', printed_page: o.printed_page ?? '', page: page(o), confidence: o.confidence, note: o.note || '', source_id: o.source_id, ...src(o.source_id),
}));
const anaRows = () => ana.records.map((r) => ({
  calc_id: r.calc_id, family: r.family, status: r.status, title: r.title, result: r.result, unit: r.unit, period: r.period, formula: r.formula,
  inputs: (r.inputs || []).map((i) => `${i.role}: ${i.value} ${i.unit} (${i.source_id}${i.pdf_page ? `, PDF p. ${i.pdf_page}` : ''})`).join('; '), gap_reason: r.gap_reason || '', caveat: r.caveat, confidence: r.confidence ?? '', label: r.label,
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
    ...COMMON, id: 'siaya-analysis', title: 'Siaya County: analytical measures calculated by Takwimu Kenya from published figures', sector: 'public finance',
    description: `${ana.records.length} records (${ana.records.filter((r) => r.status === 'value').length} values, ${ana.records.filter((r) => r.status === 'gap').length} gaps with reasons): real per-capita spending, transfer dependency, execution rates beside printed rates, pending bills, audit recurrence, budget beside service context and climate finance beside hotspot wards. Each has a calc_id, a formula in words and its inputs with sources.`,
    period: { from: 'FY 2013/14', to: 'FY 2025/26' }, years: yearsBetween(2013, 2026), source: 'Takwimu Kenya (calculated)', source_detail: ana.meta.label,
    source_url: 'https://takwimu.netlify.app/counties/siaya/analysis/', unit: 'as stated per record', coverage: `Siaya County, ${ana.records.length} records`,
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
      amounts: p.amounts.map((a) => `${a.kind} ${a.value === null ? 'not printed' : a.value} ${a.currency} (${a.period}; ${a.pooled ? 'pooled total, not a Siaya figure' : 'Siaya-specific'}; ${a.source.source_id})`).join('; '), sources: p.sources.map((s) => s.source_id).join('; ') })),
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
  'siaya-projects': 'Compiled by Takwimu from county, Controller of Budget and Auditor-General reports (some pages by OCR) and not yet checked by a reviewer: awaiting editorial review. Contractor names are withheld pending that review.',
  'siaya-programmes': 'Compiled by Takwimu from county documents, the World Bank projects database and IATI files and not yet checked by a reviewer: awaiting editorial review. Registry records are self-reported by their publishers.',
};
const TOPIC_FILES = { 'siaya-health': 'siaya-health.json', 'siaya-education': 'siaya-education.json', 'siaya-agriculture': 'siaya-agriculture.json', 'siaya-wards': 'siaya-geography.json', 'siaya-ward-boundaries': 'siaya-wards-geo.json', 'siaya-climate': 'siaya-climate.json', 'siaya-analysis': 'siaya-analysis.json', 'siaya-projects': 'siaya-projects.json', 'siaya-programmes': 'siaya-programmes.json' };

module.exports = { TOPIC_DATASETS, TOPIC_STATUS, TOPIC_FILES };
