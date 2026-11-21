// Data access for the Explore pages (datasets, Kenya dashboard, compare, trends, stories) and the build's
// static downloads. Server and build only: it loads the full data files, so client components receive compact
// props built from it instead of importing it. CommonJS so scripts/build-data.js and Next.js share it.
// Values are read as published; nothing here fills, rounds or recomputes a stored value. Display rounding is
// done by the pages, and downloads keep the full value.
const nat = require('../data/national.json');
const cob = require('../data/counties-cob.json');
const hist = require('../data/history.json');
const cpi = require('../data/cpi.json');
const manifest = require('../data/source-manifest.json');

const SECTORS = { economy: 'Economy', people: 'People', health: 'Health', education: 'Education', infrastructure: 'Infrastructure', 'public finance': 'Public finance' };
const docById = Object.fromEntries(manifest.documents.map((d) => [d.id, d]));

// ---- National indicators (World Bank WDI) ----
// Display settings only: a short name, a scale for large numbers and decimals. The stored value is unchanged.
const NAT_META = {
  'NY.GDP.MKTP.KD.ZG': { slug: 'gdp-growth', short: 'GDP growth', div: 1, unit: '% a year', dec: 1, basis: 'Real: measured at constant prices' },
  'NY.GDP.PCAP.CD': { slug: 'gdp-per-person', short: 'GDP per person', div: 1, unit: 'US$', dec: 0, basis: 'Nominal: current US dollars, not adjusted for prices' },
  'FP.CPI.TOTL.ZG': { slug: 'inflation', short: 'Inflation', div: 1, unit: '% a year', dec: 1 },
  'SL.UEM.TOTL.ZS': { slug: 'unemployment', short: 'Unemployment (modelled estimate)', div: 1, unit: '% of labour force', dec: 1 },
  'BX.TRF.PWKR.CD.DT': { slug: 'remittances', short: 'Remittances received', div: 1e9, unit: 'US$ billion', dec: 2, basis: 'Nominal: current US dollars, not adjusted for prices' },
  'SP.POP.TOTL': { slug: 'population', short: 'Population', div: 1e6, unit: 'million people', dec: 2 },
  'SP.URB.TOTL.IN.ZS': { slug: 'urban-share', short: 'Share living in urban areas', div: 1, unit: '% of population', dec: 1 },
  'SI.POV.DDAY': { slug: 'poverty-3-dollars', short: 'Poverty at $3.00 a day (2021 prices)', div: 1, unit: '% of population', dec: 1, method: 'Survey-based (World Bank Poverty and Inequality Platform), so only some years have values. The World Bank now measures this series at $3.00 a day in 2021 prices; older publications used $2.15 a day in 2017 prices, so their figures are not comparable with these.' },
  'SH.DYN.MORT': { slug: 'under-5-mortality', short: 'Under-5 mortality', div: 1, unit: 'per 1,000 live births', dec: 1 },
  'SP.DYN.LE00.IN': { slug: 'life-expectancy', short: 'Life expectancy at birth', div: 1, unit: 'years', dec: 1 },
  'SE.PRM.ENRR': { slug: 'primary-gross-enrolment', short: 'Primary school enrolment (gross)', div: 1, unit: '% of age group', dec: 1, note: 'Gross enrolment counts every pupil, whatever their age, against the official age group, so it can be above 100.' },
  'SE.PRM.NENR': { slug: 'primary-net-enrolment', short: 'Primary school enrolment (net)', div: 1, unit: '% of age group', dec: 1 },
  'EG.ELC.ACCS.ZS': { slug: 'electricity-access', short: 'Access to electricity', div: 1, unit: '% of population', dec: 1 },
  'GC.DOD.TOTL.GD.ZS': { slug: 'central-government-debt', short: 'Central government debt', div: 1, unit: '% of GDP', dec: 1 },
};
const MISSING_NOTE = 'No value for this year from the World Bank API on the retrieval date';
const natIndicators = nat.indicators.map((x) => {
  const m = NAT_META[x.code] || { slug: x.code.toLowerCase().replace(/\./g, '-'), short: x.name, div: 1, unit: x.unit, dec: 1 };
  const withValues = x.series.filter((p) => p.value !== null);
  // unit stays the World Bank's unit for the stored (raw) values; dispUnit goes with value / div on the pages.
  return { ...x, ...m, unit: x.unit, dispUnit: m.unit, sectorLabel: SECTORS[x.sector] || x.sector, hasValues: withValues.length > 0, first: withValues[0] || null, last: withValues[withValues.length - 1] || null };
});
const natBySlug = (slug) => natIndicators.find((x) => x.slug === slug);

// ---- 47-county tables (Controller of Budget) ----
const COB_FIELDS = [
  { key: 'approved_budget_total', label: 'Approved budget', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'recurrent_budget', label: 'Recurrent budget', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'development_budget', label: 'Development budget', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'expenditure_total', label: 'Total spending', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'recurrent_expenditure', label: 'Recurrent spending', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'development_expenditure', label: 'Development spending', unit: 'KSh million', kind: 'amount', group: 'budget' },
  { key: 'overall_absorption_pct', label: 'Share of the whole budget spent', unit: '%', kind: 'pct', group: 'absorption' },
  { key: 'recurrent_absorption_pct', label: 'Share of the recurrent budget spent', unit: '%', kind: 'pct', group: 'absorption' },
  { key: 'development_absorption_pct', label: 'Share of the development budget spent', unit: '%', kind: 'pct', group: 'absorption' },
  { key: 'ordinary_osr_actual', label: 'Own-source revenue collected, ordinary', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'fif_aia_actual', label: 'Own-source revenue collected, FIF and A-i-A', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'total_osr_actual', label: 'Own-source revenue collected', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'ordinary_osr_target', label: 'Own-source revenue target, ordinary', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'fif_aia_target', label: 'Own-source revenue target, FIF and A-i-A', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'total_osr_target', label: 'Own-source revenue target', unit: 'KSh million', kind: 'amount', group: 'osr' },
  { key: 'osr_performance_pct', label: 'Own-source revenue collected as a share of target', unit: '%', kind: 'pct', group: 'osr' },
  { key: 'pb_exec_recurrent', label: 'Pending bills, County Executive, recurrent', unit: 'KSh million', kind: 'amount', group: 'pb' },
  { key: 'pb_exec_development', label: 'Pending bills, County Executive, development', unit: 'KSh million', kind: 'amount', group: 'pb' },
  { key: 'pb_exec_subtotal', label: 'Pending bills, County Executive', unit: 'KSh million', kind: 'amount', group: 'pb' },
  { key: 'pb_assembly_subtotal', label: 'Pending bills, County Assembly', unit: 'KSh million', kind: 'amount', group: 'pb' },
  { key: 'pb_grand_total', label: 'Pending bills at year end', unit: 'KSh million', kind: 'amount', group: 'pb' },
];
const cobField = (key) => COB_FIELDS.find((f) => f.key === key);
const COB_YEARS = cob.years.map((y) => y.fy).sort();
const cobYear = (fy) => cob.years.find((y) => y.fy === fy);
const NOTE_BY_STATUS = { blank: 'Not available: the cell is blank in the published table', doubtful: 'Not available: the OCR reading does not agree with the printed amounts' };
// One county's value for one field, with everything needed to show or download it.
function cobCell(fy, row, key) {
  const y = cobYear(fy);
  const c = row[key] || {};
  return {
    value: typeof c.value === 'number' ? c.value : null,
    status: c.value === null || c.value === undefined ? (c.status || 'blank') : 'read',
    note: c.note || '',
    raw: c.raw || '',
    table: c.table || '',
    pdf_page: c.pdf_page || null,
    printed_page: c.printed_page || null,
    read: c.read === 'ocr' ? 'OCR (RapidOCR)' : c.read || '',
    ocr_conf: c.ocr_conf === undefined ? null : c.ocr_conf,
    source_id: y.source_id,
  };
}
const cobRows = (fy, key) => cobYear(fy).counties.map((row) => ({ code: row.code, name: row.name, slug: row.slug, ...cobCell(fy, row, key) }));
const cobTotal = (fy, key) => cobCell(fy, cobYear(fy).total_row, key);
const cobSource = (fy) => { const y = cobYear(fy); return { title: y.source.title, url: y.source.library_url, tables: y.source.tables, offset: y.printed_page_offset, source_id: y.source_id }; };

// ---- Siaya ten-year series (history.json; values exactly as plotted on the Siaya pages) ----
const BASE_FY = '2024/25';
const deflator = (fy) => (cpi.fiscal_year[fy] ? cpi.fiscal_year[BASE_FY] / cpi.fiscal_year[fy] : null);
const osrByFy = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
const SIAYA_SERIES = [
  { slug: 'siaya-approved-budget', short: 'Siaya: approved budget', unit: 'KSh billion', dec: 2, money: true, get: (y) => y.approved },
  { slug: 'siaya-spending', short: 'Siaya: total spending', unit: 'KSh billion', dec: 2, money: true, get: (y) => y.spent },
  { slug: 'siaya-development-spending', short: 'Siaya: development spending', unit: 'KSh billion', dec: 2, money: true, get: (y) => y.development_spent },
  { slug: 'siaya-own-source-revenue', short: 'Siaya: own-source revenue', unit: 'KSh million', dec: 2, money: true, get: (y) => (osrByFy[y.fy] ? osrByFy[y.fy].value : undefined), note: 'The definition widened over the period (health facility revenue is included in later years). Where two reports disagree, the plotted value is used; the other is in the conflict register.' },
  { slug: 'siaya-recurrent-absorption', short: 'Siaya: share of the recurrent budget spent', unit: '%', dec: 1, money: false, get: (y) => y.recurrent_absorption_pct },
  { slug: 'siaya-development-absorption', short: 'Siaya: share of the development budget spent', unit: '%', dec: 1, money: false, get: (y) => y.development_absorption_pct },
];
function siayaSeries(s) {
  return hist.years.map((y) => {
    const v = s.get(y);
    return { period: y.fy, value: v === undefined ? null : v, note: v === undefined ? 'Not available: no figure for this year in the source reports (see the gaps listed in history.json)' : '' };
  });
}

// ---- Dataset catalogue ----
const WB = 'World Bank WDI';
const COB = 'Controller of Budget';
const yearsBetween = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const fyYears = (fys) => [...new Set(fys.flatMap((fy) => [Number(fy.slice(0, 4)), Number(fy.slice(0, 4)) + 1]))];
const NAT_COLUMNS = ['indicator_code', 'indicator', 'year', 'value', 'unit', 'status', 'note', 'source', 'original_source', 'api_url', 'last_updated', 'retrieved', 'modelled_or_estimated'];
const COB_COLUMNS = ['fiscal_year', 'county_code', 'county', 'measure', 'measure_label', 'value', 'unit', 'status', 'note', 'raw_reading', 'table', 'pdf_page', 'printed_page', 'read', 'ocr_confidence', 'source', 'source_url', 'source_id'];

const natDataset = (x) => {
  const vals = x.series.filter((p) => p.value !== null).map((p) => p.year);
  return {
    id: `kenya-${x.slug}`,
    title: `Kenya: ${x.short}`,
    description: x.source_note,
    sector: x.sector,
    geography: 'national',
    area: 'Kenya',
    period: { from: String(x.series[0].year), to: String(x.series[x.series.length - 1].year) },
    years: vals,
    source: WB,
    source_detail: `${x.source}, indicator ${x.code}. Original source: ${x.original_source.replace(/\n/g, ' ')}`,
    source_url: x.api_url,
    unit: x.unit,
    coverage: `Kenya, ${x.series[0].year} to ${x.series[x.series.length - 1].year}; values for ${vals.length} of ${x.series.length} years${x.missing_years.length ? ` (missing: ${x.missing_years.join(', ')})` : ''}`,
    method: [(NAT_META[x.code] && NAT_META[x.code].method) || x.modelled_or_estimated_note, NAT_META[x.code] && NAT_META[x.code].note, 'Values are as served by the World Bank API; missing years are left blank.'].filter(Boolean).join(' '),
    last_updated: x.last_updated,
    retrieved: x.retrieved,
    views: [{ href: `/kenya/?i=${x.slug}#trends`, label: 'Trend on the Kenya dashboard' }],
    tags: [x.code, x.name],
    rows: () => x.series.map((p) => ({ indicator_code: x.code, indicator: x.name, year: p.year, value: p.value, unit: x.unit, status: p.value === null ? 'not available' : 'published', note: p.value === null ? MISSING_NOTE : '', source: x.source, original_source: x.original_source.replace(/\n/g, ' '), api_url: x.api_url, last_updated: x.last_updated, retrieved: x.retrieved, modelled_or_estimated: x.modelled_or_estimated_note || '' })),
    columns: NAT_COLUMNS,
  };
};

const cobLongRows = (groups) => COB_YEARS.flatMap((fy) => {
  const src = cobSource(fy);
  return COB_FIELDS.filter((f) => groups.includes(f.group)).flatMap((f) => [...cobYear(fy).counties, cobYear(fy).total_row].map((row) => {
    const c = cobCell(fy, row, f.key);
    const rowNote = COB_FIELDS.filter((g) => g.group === f.group).map((g) => cobCell(fy, row, g.key)).find((x) => x.status === 'read' && x.note);
    const note = [c.note, rowNote && rowNote.note !== c.note && c.status === 'read' ? rowNote.note : ''].filter(Boolean).join(' ');
    return { fiscal_year: fy, county_code: row.code || '', county: row.name, measure: f.key, measure_label: f.label, value: c.value, unit: f.unit, status: c.status === 'read' ? 'published' : `not available (${c.status})`, note, raw_reading: c.raw, table: c.table, pdf_page: c.pdf_page, printed_page: c.printed_page, read: c.read, ocr_confidence: c.ocr_conf, source: src.title, source_url: src.url, source_id: src.source_id };
  }));
});
const TABLE_OF = { budget: 'bud', absorption: 'bud', osr: 'osr', pb: 'pb' };
const cobDataset = (id, title, groups, description, method, compare) => ({
  id, title, description,
  sector: 'public finance',
  geography: 'county',
  area: 'All 47 counties',
  period: { from: `FY ${COB_YEARS[0]}`, to: `FY ${COB_YEARS[COB_YEARS.length - 1]}` },
  years: fyYears(COB_YEARS),
  source: COB,
  source_detail: COB_YEARS.map((fy) => `${cobSource(fy).title}: ${[...new Set(groups.map((g) => cobSource(fy).tables[TABLE_OF[g]]))].join('; ')}`).join('. '),
  source_url: cobSource(COB_YEARS[COB_YEARS.length - 1]).url,
  unit: groups.includes('absorption') ? 'per cent' : 'KSh million',
  coverage: `All 47 counties and the printed total, FY ${COB_YEARS.join(' and FY ')}`,
  method: `${method} Every value was read by OCR from scanned tables and carries its table, PDF page and printed page. Blank cells and doubtful readings are left empty with the reason; nothing is filled.`,
  last_updated: '2025-08', // publication month of the latest report used (FY 2024/25, August 2025)
  retrieved: cob.meta.retrieved,
  views: [{ href: `/compare/?i=${compare}`, label: 'Compare counties' }],
  tags: groups,
  rows: () => cobLongRows(groups),
  columns: COB_COLUMNS,
});

const DATASETS = [
  ...natIndicators.filter((x) => x.hasValues).map(natDataset),
  cobDataset('counties-budget-spending', "Counties' budgets and spending", ['budget'], 'Approved budget and actual spending of every county government, split into recurrent (salaries and running costs) and development (projects).', 'Approved budget is the budget estimates total in the table (recurrent plus development).', 'approved_budget_total'),
  cobDataset('counties-absorption', "Counties' budget absorption", ['absorption'], 'The share of each county’s budget that was spent in the year, as printed in the Controller of Budget table.', 'Percentages are as printed; where the OCR reading did not agree with the printed amounts it is left empty. A share computed from the amounts is never used in its place.', 'development_absorption_pct'),
  cobDataset('counties-own-source-revenue', "Counties' own-source revenue", ['osr'], 'Revenue each county collected itself (ordinary revenue, and facility improvement fund and appropriations-in-aid), against its target.', 'Totals include the Facility Improvement Fund (FIF) and appropriations-in-aid (A-i-A). FY 2023/24 amounts were printed in whole shillings and are shown in KSh million.', 'total_osr_actual'),
  cobDataset('counties-pending-bills', "Counties' pending bills", ['pb'], 'Unpaid bills owed by each County Executive and County Assembly at the end of the financial year.', 'Many County Assembly cells are blank in the tables; the grand total then covers the County Executive only. Narok did not submit FY 2024/25 data. Nandi’s FY 2023/24 figure is at 31 March 2024, as the report notes.', 'pb_grand_total'),
  {
    id: 'siaya-ten-year-history', title: 'Siaya County: ten-year fiscal history', sector: 'public finance', geography: 'county', area: 'Siaya County',
    description: 'Budget, spending, absorption, own-source revenue, pending bills and audit opinions for Siaya County, FY 2013/14 to FY 2024/25, with in-year figures for FY 2025/26.',
    period: { from: 'FY 2013/14', to: 'FY 2024/25' }, years: yearsBetween(2013, 2025), source: COB, source_detail: 'Controller of Budget annual county reports and Auditor-General reports (each year names its report and page)',
    source_url: 'https://libraryir.parliament.go.ke/', unit: 'KSh billion; KSh million for revenue and pending bills', coverage: 'Siaya County, 12 fiscal years; FY 2019/20 is mostly a gap',
    method: 'Nominal values from each year’s report, with page references. Gaps are listed, never filled; disagreements are in the conflict register.', last_updated: hist.meta.retrieved, retrieved: hist.meta.retrieved,
    views: [{ href: '/insights/', label: 'Siaya insights' }, { href: '/kenya/?i=siaya-spending#trends', label: 'Trend' }], tags: ['Siaya', 'audit'], files: { csv: '/data/history.csv', json: '/data/history.json' },
  },
  {
    id: 'source-conflicts', title: 'Where sources disagree (conflict register)', sector: 'public finance', geography: 'county', area: 'Siaya County',
    description: 'Every case where two official documents, or two readings of one document, give different values for the same measure, with both values, definitions and a labelled hypothesis.',
    period: { from: 'FY 2013/14', to: 'FY 2025/26' }, years: yearsBetween(2013, 2026), source: 'Takwimu register', source_detail: 'Compiled by Takwimu from the documents in the source manifest',
    source_url: 'https://takwimu.netlify.app/data/#conflicts', unit: 'as stated per case', coverage: 'Siaya County figures', method: 'Both values are kept; none is averaged or chosen without evidence. No case has been checked by a reviewer yet.',
    last_updated: require('../data/conflicts.json').meta.updated, retrieved: require('../data/conflicts.json').meta.updated, views: [{ href: '/data/#conflicts', label: 'Data page' }], tags: ['conflicts'],
    files: { csv: '/data/datasets/source-conflicts.csv', json: '/data/conflicts.json' },
    rows: () => require('../data/conflicts.json').conflicts.flatMap((c) => c.values.map((v) => ({ case_id: c.id, measure: c.measure, unit: c.unit, value: v.value, value_label: v.label, url: v.url, status: c.status, verification_state: c.verification_state, definitions: c.definitions, hypothesis: c.hypothesis, effect: c.effect }))),
  },
  {
    id: 'siaya-sub-counties', title: 'Siaya County: sub-counties', sector: 'people', geography: 'county', area: 'Siaya County',
    description: 'Population (2019 census and projections to 2027), area, density, wards, health facilities and voters for the six sub-counties of Siaya.',
    period: { from: '2019', to: '2027' }, years: yearsBetween(2019, 2027), source: 'Siaya County (CIDP)', source_detail: 'Siaya County Integrated Development Plan 2023 to 2027',
    source_url: 'https://maarifa.cog.go.ke/sites/default/files/2024-06/SIAYA%20CIDP-2023-2027.pdf', unit: 'people, km², counts', coverage: 'Six sub-counties', method: 'As printed in the plan; projections are the plan’s own.',
    last_updated: '2024-06', retrieved: require('../data/subcounties.json').retrieved, views: [{ href: '/subcounties/', label: 'Sub-counties' }], tags: ['Siaya', 'population'],
    files: { csv: '/data/datasets/siaya-sub-counties.csv', json: '/data/subcounties.json' },
    rows: () => require('../data/subcounties.json').sub_counties.map((x) => ({ sub_county: x.name, population_2019: x.population['2019'], population_2022: x.population['2022'], population_2025: x.population['2025'], population_2027: x.population['2027'], area_km2: x.area_km2, density_2019: x.density_per_km2['2019'], density_2022: x.density_per_km2['2022'], wards: x.wards, villages: x.villages, eligible_voters_2022: x.eligible_voters_2022 })),
  },
  {
    id: 'kenya-cpi', title: 'Kenya: consumer price index (for real terms)', sector: 'economy', geography: 'national', area: 'Kenya',
    description: 'Consumer price index (2010 = 100) by calendar year, and the fiscal-year averages used to show money in real terms.',
    period: { from: '2010', to: '2025' }, years: yearsBetween(2010, 2025), source: WB, source_detail: cpi.meta.source, source_url: cpi.meta.source_url, unit: 'index, 2010 = 100',
    coverage: 'Kenya, calendar years 2010 to 2025 and fiscal years 2013/14 to 2024/25', method: cpi.meta.method, last_updated: cpi.meta.retrieved, retrieved: cpi.meta.retrieved,
    views: [{ href: '/kenya/?i=siaya-spending&basis=real#trends', label: 'Real-terms trend' }], tags: ['CPI', 'prices', 'deflator'],
    files: { csv: '/data/datasets/kenya-cpi.csv', json: '/data/cpi.json' },
    rows: () => [...Object.entries(cpi.calendar_year).map(([k, v]) => ({ period: k, kind: 'calendar year', index_2010_100: v })), ...Object.entries(cpi.fiscal_year).map(([k, v]) => ({ period: `FY ${k}`, kind: 'fiscal-year average (derived)', index_2010_100: v }))],
  },
].map((d) => ({ files: { csv: `/data/datasets/${d.id}.csv`, json: `/data/datasets/${d.id}.json` }, ...d, sectorLabel: SECTORS[d.sector] }));

// ---- Compact data for client views (only what the views show, so pages stay light) ----
// Notes repeat across cells, so each cell points at an index in a shared list.
function compareData() {
  const notes = [];
  const noteIx = (n) => { if (!n) return -1; let i = notes.indexOf(n); if (i < 0) { notes.push(n); i = notes.length - 1; } return i; };
  const pack = (c) => [c.value, c.status === 'read' ? 0 : c.status === 'doubtful' ? 2 : 1, noteIx(c.note), c.raw, c.pdf_page, c.printed_page, c.ocr_conf];
  const values = {}; const totals = {};
  COB_YEARS.forEach((fy) => {
    values[fy] = {}; totals[fy] = {};
    COB_FIELDS.forEach((f) => {
      values[fy][f.key] = cobYear(fy).counties.map((row) => {
        // A note on a published value of the same row and group (e.g. a reporting date) applies to the whole group.
        const rowNote = COB_FIELDS.filter((g) => g.group === f.group).map((g) => cobCell(fy, row, g.key)).find((c) => c.status === 'read' && c.note);
        return [...pack(cobCell(fy, row, f.key)), noteIx(rowNote ? rowNote.note : '')];
      });
      totals[fy][f.key] = pack(cobTotal(fy, f.key));
    });
  });
  const TAB = { budget: 'bud', absorption: 'bud', osr: 'osr', pb: 'pb' };
  return {
    years: COB_YEARS,
    fields: COB_FIELDS.map((f) => ({ key: f.key, label: f.label, unit: f.unit, kind: f.kind, group: f.group, tab: TAB[f.group] })),
    counties: cobYear(COB_YEARS[0]).counties.map((c) => ({ code: c.code, name: c.name, slug: c.slug })),
    sources: Object.fromEntries(COB_YEARS.map((fy) => [fy, cobSource(fy)])),
    values, totals, notes,
  };
}

// Every series the Trends page can show, as labels and values; real terms where a price adjustment applies.
function trendSeries() {
  const out = [];
  natIndicators.filter((x) => x.hasValues).forEach((x) => out.push({
    slug: x.slug, group: `Kenya: ${x.sectorLabel}`, short: x.short, unit: x.dispUnit,
    dec: x.dec, labels: x.series.map((p) => String(p.year)), values: x.series.map((p) => (p.value === null ? null : p.value / x.div)),
    missing: x.series.filter((p) => p.value === null).map((p) => String(p.year)), missingNote: MISSING_NOTE,
    basis: (NAT_META[x.code] || {}).basis || null, real: null,
    note: [(NAT_META[x.code] || {}).method || x.modelled_or_estimated_note, (NAT_META[x.code] || {}).note].filter(Boolean).join(' '),
    source: `${x.source}, ${x.code} (last updated ${x.last_updated}, retrieved ${x.retrieved})`, sourceUrl: x.api_url, dataset: `kenya-${x.slug}`,
  }));
  SIAYA_SERIES.forEach((s) => {
    const rows = siayaSeries(s);
    out.push({
      slug: s.slug, group: 'Siaya County (ten years)', short: s.short, unit: s.unit, dec: s.dec,
      labels: rows.map((r) => `FY ${r.period}`), values: rows.map((r) => r.value),
      missing: rows.filter((r) => r.value === null).map((r) => `FY ${r.period}`), missingNote: 'No figure in the source reports for this year (the FY 2019/20 report was not found; FY 2013/14 has no approved budget)',
      basis: s.money ? 'Nominal: shillings of each year' : null,
      real: s.money ? rows.map((r) => (r.value === null || !deflator(r.period) ? null : r.value * deflator(r.period))) : null,
      note: s.note || 'Values as plotted on the Siaya pages; where reports disagree, the other value is in the conflict register.',
      source: 'Controller of Budget annual county reports (each year names its report and page in history.json)', sourceUrl: 'https://libraryir.parliament.go.ke/', dataset: 'siaya-ten-year-history',
    });
  });
  [['approved_budget_total', 'All 47 counties: approved budgets'], ['expenditure_total', 'All 47 counties: total spending'], ['total_osr_actual', 'All 47 counties: own-source revenue collected'], ['pb_grand_total', 'All 47 counties: pending bills at year end']].forEach(([key, short]) => {
    const vals = COB_YEARS.map((fy) => cobTotal(fy, key).value);
    out.push({
      slug: `counties-total-${key.replace(/_/g, '-')}`, group: 'All 47 counties (two years so far)', short, unit: 'KSh million', dec: 2,
      labels: COB_YEARS.map((fy) => `FY ${fy}`), values: vals, missing: [], missingNote: '',
      basis: 'Nominal: shillings of each year',
      real: COB_YEARS.map((fy, i) => (vals[i] === null || !deflator(fy) ? null : vals[i] * deflator(fy))),
      note: 'The printed total row of the Controller of Budget table (read by OCR); the 47 county rows add up to it within rounding. Only two years are loaded so far, so this is a change between two years, not a trend.',
      source: COB_YEARS.map((fy) => `${cobSource(fy).title}, ${cobSource(fy).tables[{ approved_budget_total: 'bud', expenditure_total: 'bud', total_osr_actual: 'osr', pb_grand_total: 'pb' }[key]]}`).join('; '),
      sourceUrl: cobSource(COB_YEARS[COB_YEARS.length - 1]).url, dataset: { approved_budget_total: 'counties-budget-spending', expenditure_total: 'counties-budget-spending', total_osr_actual: 'counties-own-source-revenue', pb_grand_total: 'counties-pending-bills' }[key],
    });
  });
  return out;
}

// Metadata only (no row builders), safe to pass to client components.
const catalogue = () => DATASETS.map(({ rows, columns, ...d }) => d);

module.exports = {
  SECTORS, nat, cob, hist, cpi, docById,
  natIndicators, natBySlug, NAT_META, MISSING_NOTE,
  COB_FIELDS, cobField, COB_YEARS, cobYear, cobRows, cobTotal, cobSource, NOTE_BY_STATUS,
  BASE_FY, deflator, SIAYA_SERIES, siayaSeries,
  DATASETS, catalogue, compareData, trendSeries,
};
