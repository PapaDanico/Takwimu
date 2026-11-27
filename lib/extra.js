// Central Bank of Kenya statistics, derived measures (the Analysis layer), Commission on Revenue Allocation and
// International Budget Partnership figures, and IEBC registered voters. Server and build only (CommonJS), used by
// lib/explore.js for the datasets catalogue, the Kenya dashboard, the trend explorer and the compare page.
// Values are read as published; nothing here fills or estimates. Derived measures come from data/derived.json,
// where each has its formula and inputs; they are always labelled as derived.
const cbk = require('../data/cbk.json');
const der = require('../data/derived.json');
const ngo = require('../data/ngo.json');
const pol = require('../data/political.json');
const { COUNTIES } = require('./counties');

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
const countyOf = (name) => COUNTIES.find((c) => norm(c.name) === norm(name)) || null;
const { yearsBetween } = require('./siaya-years');
const S = cbk.series;

// ---- CBK: one annual reading per series for the dashboard and trend explorer (monthly values go in downloads) ----
// basis says which published reading is used each year; none of these is computed.
const dec = (k) => (y) => (S[k].annual_december ? S[k].annual_december[y] : S[k].monthly[`${y}-12`]);
const CBK_SERIES = [
  { key: 'kes_usd_end_period', slug: 'cbk-ksh-per-usd', short: 'KSh per US dollar (end of December)', unit: 'KSh per US$', div: 1, dec: 2, get: dec('kes_usd_end_period'), basis: 'December, end of period' },
  { key: 'central_bank_rate', slug: 'cbk-central-bank-rate', short: 'Central Bank Rate (December)', unit: '% a year', div: 1, dec: 2, get: dec('central_bank_rate'), basis: 'Rate in December' },
  { key: 'tbill_91_day', slug: 'cbk-91-day-tbill', short: '91-day Treasury bill rate (December)', unit: '% a year', div: 1, dec: 2, get: dec('tbill_91_day'), basis: 'December' },
  { key: 'lending_rate', slug: 'cbk-lending-rate', short: 'Commercial banks: average lending rate (December)', unit: '% a year', div: 1, dec: 2, get: dec('lending_rate'), basis: 'December; weighted average of banks' },
  { key: 'deposit_rate', slug: 'cbk-deposit-rate', short: 'Commercial banks: average deposit rate (December)', unit: '% a year', div: 1, dec: 2, get: dec('deposit_rate'), basis: 'December; weighted average of banks' },
  { key: 'inflation_annual_average', slug: 'cbk-inflation', short: 'Inflation, annual average (CBK)', unit: '% a year', div: 1, dec: 2, get: (y) => S.inflation_annual_average.annual[y], basis: 'Annual average as published' },
  { key: 'public_debt_total', slug: 'cbk-public-debt', short: 'Public debt, total (end of December)', unit: 'KSh trillion', div: 1e6, dec: 2, get: dec('public_debt_total'), basis: 'December; domestic plus external, as published' },
  { key: 'public_debt_domestic', slug: 'cbk-public-debt-domestic', short: 'Public debt, domestic (end of December)', unit: 'KSh trillion', div: 1e6, dec: 2, get: dec('public_debt_domestic'), basis: 'December' },
  { key: 'public_debt_external', slug: 'cbk-public-debt-external', short: 'Public debt, external (end of December)', unit: 'KSh trillion', div: 1e6, dec: 2, get: dec('public_debt_external'), basis: 'December' },
  { key: 'gov_total_revenue', slug: 'cbk-government-revenue', short: 'Government revenue, fiscal year', unit: 'KSh trillion', div: 1e6, dec: 2, fy: true, get: (fy) => S.gov_total_revenue.fiscal_year[fy], basis: 'Fiscal year (July to June) total' },
  { key: 'gov_total_expenditure', slug: 'cbk-government-expenditure', short: 'Government expenditure, fiscal year', unit: 'KSh trillion', div: 1e6, dec: 2, fy: true, get: (fy) => S.gov_total_expenditure.fiscal_year[fy], basis: 'Fiscal year (July to June) total' },
  { key: 'money_supply_m3', slug: 'cbk-m3', short: 'Money supply, M3 (end of December)', unit: 'KSh trillion', div: 1e6, dec: 2, get: dec('money_supply_m3'), basis: 'December' },
  { key: 'gdp_nominal', slug: 'cbk-gdp-nominal', short: 'GDP, current prices (KNBS, via CBK)', unit: 'KSh trillion', div: 1e6, dec: 2, get: (y) => S.gdp_nominal.annual[y], basis: 'Calendar year' },
  { key: 'gdp_real_growth', slug: 'cbk-gdp-growth', short: 'Real GDP growth (KNBS, via CBK)', unit: '% a year', div: 1, dec: 1, get: (y) => S.gdp_real_growth.annual[y], basis: 'Calendar year' },
  { key: 'fx_reserves_usd', slug: 'cbk-fx-reserves', short: 'CBK foreign exchange reserves (late December)', unit: 'US$ billion', div: 1e3, dec: 2, get: (y) => { const k = Object.keys(S.fx_reserves_usd.observations).find((d) => d.startsWith(`${y}-12`)); return k ? S.fx_reserves_usd.observations[k] : undefined; }, basis: 'Last weekly reading in December (usable reserves to 2024)' },
];
const FYS = yearsBetween(2010, 2025).map((y) => `${y}/${String(y + 1).slice(2)}`);
const cbkRows = (s) => {
  const keys = s.fy ? FYS : yearsBetween(2010, 2025).map(String);
  return keys.map((k) => { const v = s.get(k); return { period: s.fy ? `FY ${k}` : k, value: v === undefined || v === null ? null : v }; });
};
const cbkSrc = (k) => (Array.isArray(S[k].source) ? S[k].source[0] : S[k].source);

// ---- Analysis layer: derived measures, each with its formula ----
const ANALYSIS = [
  { key: 'real_lending_rate_annual', slug: 'real-lending-rate', short: 'Real lending rate', unit: 'percentage points', dec: 1, why: 'The average bank lending rate minus inflation: what borrowing costs after rising prices.' },
  { key: 'kes_usd_annual_average_yoy_pct', slug: 'ksh-usd-change', short: 'Change in KSh per US dollar (annual average)', unit: '% change', dec: 1, why: 'A rise means the shilling weakened against the dollar; a fall means it strengthened.' },
  { key: 'interest_pct_total_revenue_fy', slug: 'interest-burden', short: 'Interest payments as a share of government revenue', unit: '% of revenue', dec: 1, fy: true, why: 'How much of each shilling the government collects goes to interest on its debt.' },
  { key: 'public_debt_pct_gdp_december', slug: 'public-debt-gdp', short: 'Public debt as a share of GDP (December)', unit: '% of GDP', dec: 1, why: 'Debt compared with the size of the economy in the same year.' },
  { key: 'external_debt_share_pct_december', slug: 'external-debt-share', short: 'External share of public debt (December)', unit: '% of public debt', dec: 1, why: 'The part of public debt owed to lenders outside Kenya.' },
  { key: 'remittances_pct_gdp', slug: 'remittances-gdp', short: 'Remittances as a share of GDP', unit: '% of GDP', dec: 1, why: 'Money sent home by Kenyans abroad, compared with the economy.' },
  { key: 'm3_growth_december_yoy_pct', slug: 'm3-growth', short: 'Growth in money supply (M3, December)', unit: '% change', dec: 1, why: 'How fast broad money grew over the year.' },
].map((a) => ({ ...a, m: der.measures[a.key] }));
const analysisRows = (a) => {
  const keys = a.fy ? FYS : yearsBetween(2010, 2025).map(String);
  return keys.map((k) => ({ period: a.fy ? `FY ${k}` : k, value: a.m.values[k] === undefined ? null : a.m.values[k] }));
};

// ---- CRA and IEBC at county level (for the compare page) ----
const CRA = ngo.cra.county_allocations_fy2026_27;
const craRows = CRA.rows.map((r) => { const c = countyOf(r.county); return { ...r, slug: c.slug, name: c.name, code: c.code }; });
const VOTERS = pol.iebc_registered_voters_2022_by_constituency;
const voterCounty = VOTERS.county_totals_summed_from_constituencies.map((r) => { const c = countyOf(r.county); return { slug: c.slug, name: c.name, code: c.code, value: r.registered_voters }; });
const constituencies = VOTERS.rows.map((r) => { const c = countyOf(r.county); return { county: c.name, slug: c.slug, code: r.const_code, name: r.constituency, voters: r.registered_voters }; });

// ---- Datasets for the catalogue ----
const CBK_GROUPS = [
  ['cbk-exchange-rates', 'Kenya: exchange rates (CBK)', 'money and banking', ['kes_usd_monthly_average', 'kes_usd_end_period'], 'Kenya shilling per US dollar, monthly average and end of month.'],
  ['cbk-interest-rates', 'Kenya: interest rates (CBK)', 'money and banking', ['central_bank_rate', 'interbank_rate', 'tbill_91_day', 'tbill_182_day', 'tbill_364_day', 'cash_reserve_ratio', 'deposit_rate', 'savings_rate', 'lending_rate', 'overdraft_rate'], 'Central Bank Rate, interbank and Treasury bill rates, cash reserve ratio, and commercial banks’ weighted average deposit, savings, lending and overdraft rates, monthly.'],
  ['cbk-public-debt', 'Kenya: public debt, domestic and external (CBK)', 'public finance', ['public_debt_domestic', 'public_debt_external', 'public_debt_total'], 'Government public debt at the end of each month, domestic and external, in KSh million.'],
  ['cbk-government-finance', 'Kenya: government revenue, interest and expenditure (CBK)', 'public finance', ['gov_total_tax_revenue', 'gov_total_revenue', 'gov_domestic_interest', 'gov_foreign_interest', 'gov_total_recurrent_expenditure', 'gov_total_expenditure'], 'National government revenue, interest payments and expenditure, cumulative from July each month; the June value is the fiscal-year total.'],
  ['cbk-money-supply', 'Kenya: money supply M2 and M3 (CBK)', 'money and banking', ['money_supply_m2', 'money_supply_m3'], 'Broad money at the end of each month, from the Depository Corporation Survey.'],
  ['cbk-gdp', 'Kenya: GDP, nominal and real (KNBS, via CBK)', 'economy', ['gdp_nominal', 'gdp_real', 'gdp_real_growth'], 'Gross domestic product by calendar year as republished by the CBK. Use the growth rates: the real level appears to use a different base year from the nominal one, and the file does not state it.'],
  ['cbk-inflation', 'Kenya: inflation, monthly (CBK)', 'economy', ['inflation_12_month', 'inflation_annual_average'], '12-month and annual-average consumer price inflation, monthly.'],
  ['cbk-remittances', 'Kenya: diaspora remittances (CBK)', 'money and banking', ['diaspora_remittances_total'], 'Money sent home by Kenyans abroad, monthly, in US$ thousand.'],
  ['cbk-fx-reserves', 'Kenya: foreign exchange reserves (CBK weekly bulletins)', 'money and banking', ['fx_reserves_usd', 'fx_reserves_months_import_cover'], 'CBK foreign exchange reserves and months of import cover: the last weekly reading of each December from 2016, and the latest bulletin.'],
];
const seriesPoints = (k) => {
  const s = S[k];
  const obj = s.monthly || s.monthly_cumulative || s.annual || s.observations;
  return Object.entries(obj).map(([period, value]) => ({ period, value }));
};
const CBK_COLUMNS = ['series', 'series_name', 'period', 'value', 'unit', 'frequency', 'definition', 'location', 'source_url', 'sha256', 'source_id', 'retrieved'];
const cbkDataset = ([id, title, sector, keys, description]) => {
  const first = keys.map((k) => S[k]);
  const periods = keys.flatMap((k) => seriesPoints(k).map((p) => p.period));
  const from = periods.reduce((a, b) => (a < b ? a : b)); const to = periods.reduce((a, b) => (a > b ? a : b));
  return {
    id, title, description, sector, geography: 'national', area: 'Kenya',
    period: { from, to }, years: yearsBetween(Number(from.slice(0, 4)), Number(to.slice(0, 4))),
    source: 'Central Bank of Kenya', source_detail: [...new Set(keys.map((k) => cbkSrc(k).url))].length > 3 ? `CBK files listed per row (${keys.length} series)` : [...new Set(keys.map((k) => cbkSrc(k).url))].join('; '),
    source_url: cbkSrc(keys[0]).landing_page || cbkSrc(keys[0]).url,
    unit: [...new Set(first.map((s) => s.unit))].join('; '),
    coverage: keys.map((k) => `${S[k].name}: ${S[k].coverage ? `${S[k].coverage.first} to ${S[k].coverage.last}` : 'see rows'}`).join('; '),
    method: 'As published by the CBK on the retrieval date; each row names the file, its SHA-256 and the column. Blank cells stay empty.',
    last_updated: cbk.meta.retrieved, retrieved: cbk.meta.retrieved,
    views: [{ href: '/kenya/#cbk', label: 'Central Bank of Kenya on the Kenya dashboard' }], tags: ['CBK', ...keys],
    rows: () => keys.flatMap((k) => {
      const s = S[k]; const many = Array.isArray(s.source);
      return seriesPoints(k).map((p) => {
        const src = many ? (s.source.find((x) => x.date === p.period) || {}) : s.source;
        return { series: k, series_name: s.name, period: p.period, value: p.value, unit: s.unit, frequency: s.frequency, definition: s.definition || '', location: s.location || src.table_row_text || '', source_url: src.url || '', sha256: src.sha256 || '', source_id: src.source_id || '', retrieved: src.retrieved || cbk.meta.retrieved };
      });
    }),
    columns: CBK_COLUMNS,
  };
};
const EXTRA_DATASETS = [
  ...CBK_GROUPS.map(cbkDataset),
  {
    id: 'kenya-derived-measures', title: 'Kenya: derived measures (Analysis)', sector: 'economy', geography: 'national', area: 'Kenya',
    description: 'Measures computed by Takwimu from the published series: real interest rates, exchange-rate change, interest burden, debt to GDP, remittances share and others. Each row gives the formula and the inputs.',
    period: { from: '2010', to: '2026' }, years: yearsBetween(2010, 2026), source: 'Takwimu (derived)', source_detail: 'Computed from data/cbk.json, data/national.json and data/ngo.json; formula per row',
    source_url: 'https://takwimu.netlify.app/kenya/#analysis', unit: 'as stated per measure', coverage: `${Object.keys(der.measures).length} measures`, method: `${der.meta.rule} Null where an input is missing or the year is incomplete; nothing is filled.`,
    last_updated: der.meta.retrieved, retrieved: der.meta.retrieved, views: [{ href: '/kenya/#analysis', label: 'Analysis on the Kenya dashboard' }], tags: ['derived', 'analysis'],
    rows: () => Object.entries(der.measures).flatMap(([k, m]) => Object.entries(m.values).map(([period, value]) => ({ measure: k, name: m.name, period, value, unit: m.unit, derived: 'yes', formula: m.formula, inputs: m.inputs.join('; '), note: m.note || m.null_reason || '' }))),
  },
  {
    id: 'cra-county-allocations-2026-27', title: 'Counties: equitable share recommended by the CRA, FY 2026/27', sector: 'public finance', geography: 'county', area: 'All 47 counties',
    description: 'The Commission on Revenue Allocation’s recommended allocation to each county for FY 2026/27 (baseline plus the Fourth Basis share), with the FY 2025/26 allocation. A recommendation to Parliament, not the enacted County Allocation of Revenue Act.',
    period: { from: 'FY 2025/26', to: 'FY 2026/27' }, years: [2025, 2026], source: 'Commission on Revenue Allocation', source_detail: `${CRA.source.title}, ${CRA.source.location}`,
    source_url: CRA.source.url, unit: 'KSh million (factor: per cent)', coverage: 'All 47 counties',
    method: `The CRA is a constitutional commission. ${CRA.source.status_note} The 47 rows add to the published total of KSh 458,940 million; baseline plus Fourth Basis equals the total in every row.`,
    last_updated: '2026-02', retrieved: CRA.source.retrieved, views: [{ href: '/compare/#cra', label: 'Map on the compare page' }], tags: ['CRA', 'equitable share', 'recommendation'],
    rows: () => craRows.map((r) => ({ county_code: r.code, county: r.name, allocation_2025_26: r.allocation_2025_26, baseline_2026_27: r.baseline_2026_27, fourth_basis_factor_pct: r.fourth_basis_allocation_factor_pct, fourth_basis_allocation_2026_27: r.fourth_basis_allocation_2026_27, total_allocation_2026_27: r.total_allocation_2026_27, status: 'recommendation, not enacted', source: CRA.source.title, source_url: CRA.source.url, sha256: CRA.source.sha256 })),
  },
  {
    id: 'cra-revenue-sharing', title: 'Kenya: revenue sharing between national and county governments, and the Equalisation Fund (CRA)', sector: 'public finance', geography: 'national', area: 'Kenya',
    description: 'Ordinary revenue and its division between the national and county governments, FY 2013/14 to FY 2026/27, and the Equalisation Fund by year, as tabulated by the CRA.',
    period: { from: 'FY 2013/14', to: 'FY 2026/27' }, years: yearsBetween(2013, 2026), source: 'Commission on Revenue Allocation', source_detail: `${ngo.cra.vertical_sharing_fy2013_14_to_2026_27.source.location}; ${ngo.cra.equalisation_fund_fy2013_14_to_2026_27.source.location}`,
    source_url: CRA.source.url, unit: 'KSh billion', coverage: 'FY 2013/14 to FY 2026/27', method: 'As tabulated in the CRA recommendation; later years are projections (flag column). The Equalisation Fund is 0.5 per cent of the last audited revenue in every year.',
    last_updated: '2026-02', retrieved: CRA.source.retrieved, views: [{ href: '/kenya/#governance', label: 'Kenya dashboard' }], tags: ['CRA', 'Equalisation Fund'],
    rows: () => Object.entries(ngo.cra.vertical_sharing_fy2013_14_to_2026_27.rows).map(([fy, r]) => ({ fiscal_year: fy, ...r, equalisation_fund_ksh_bn: (ngo.cra.equalisation_fund_fy2013_14_to_2026_27.rows[fy] || {}).equalisation_fund_ksh_bn ?? null, audited_revenue_ksh_bn: (ngo.cra.equalisation_fund_fy2013_14_to_2026_27.rows[fy] || {}).audited_accounts_revenue_ksh_bn ?? null, audited_accounts_fy: (ngo.cra.equalisation_fund_fy2013_14_to_2026_27.rows[fy] || {}).fy_of_audited_accounts ?? null, source_url: CRA.source.url })),
  },
  {
    id: 'ibp-open-budget-survey-kenya', title: 'Kenya: Open Budget Survey scores (International Budget Partnership)', sector: 'governance', geography: 'national', area: 'Kenya',
    description: 'How much budget information Kenya’s national government publishes (Open Budget Index), and scores for oversight and public participation, from 2006.',
    period: { from: '2006', to: '2025' }, years: ngo.ibp_open_budget_survey_kenya.rows.map((r) => r.Year), source: 'International Budget Partnership', source_detail: `${ngo.ibp_open_budget_survey_kenya.source.title}. Cite as: ${ngo.ibp_open_budget_survey_kenya.source.citation_requested}`,
    source_url: ngo.ibp_open_budget_survey_kenya.source.landing_page, unit: 'score, 0 to 100', coverage: 'Kenya, survey years 2006 to 2025',
    method: `Scores for the national government as an institution, not individuals. ${ngo.ibp_open_budget_survey_kenya.comparability} Citation requested by IBP: ${ngo.ibp_open_budget_survey_kenya.source.citation_requested} No other reuse terms are stated in the workbook.`,
    last_updated: '2026-09', retrieved: ngo.ibp_open_budget_survey_kenya.source.retrieved, views: [{ href: '/kenya/#governance', label: 'Kenya dashboard' }], tags: ['IBP', 'Open Budget Index', 'transparency'],
    rows: () => ngo.ibp_open_budget_survey_kenya.rows.map((r) => ({ year: r.Year, obi_unrounded: r['OBI (unrounded)'], obi_rounded: r['OBI (rounded)'], obi_category: r['OBI Category'], legislative_oversight: r['Legislative Oversight'], sai_oversight: r['SAI Oversight'], oversight_overall: r['Oversight (Overall)'], public_participation: r['Public Participation'], citation: ngo.ibp_open_budget_survey_kenya.source.citation_requested, source_url: ngo.ibp_open_budget_survey_kenya.source.url })),
  },
  {
    id: 'iebc-registered-voters-2022', title: 'Registered voters by constituency, 2022 general election (IEBC)', sector: 'governance', geography: 'constituency', area: '290 constituencies in 47 counties',
    description: 'Registered voters in each of the 290 constituencies for the August 2022 general election; county totals are the sum of their constituencies.',
    period: { from: '2022', to: '2022' }, years: [2022], source: 'IEBC', source_detail: `${VOTERS.source.title}, ${VOTERS.source.location}`,
    source_url: VOTERS.source.url, unit: 'registered voters', coverage: '290 constituencies; they sum to the file’s total of 22,102,532',
    method: `County totals are derived (sum of constituency rows). The file’s total, 22,102,532, differs from the 22,120,458 IEBC cites elsewhere; both are in the conflict register. Licence: ${pol.licence_terms.IEBC}`,
    last_updated: '2022', retrieved: VOTERS.source.retrieved, views: [{ href: '/compare/#voters', label: 'Map and constituency table' }], tags: ['IEBC', 'voters', 'no reuse licence stated'],
    rows: () => constituencies.map((r) => ({ county: r.county, constituency_code: r.code, constituency: r.name, registered_voters: r.voters, source_url: VOTERS.source.url, sha256: VOTERS.source.sha256 })),
  },
  {
    id: 'iebc-candidates-2022', title: 'Candidates by elective position, 2022 general election (IEBC)', sector: 'governance', geography: 'national', area: 'Kenya',
    description: 'Number of candidates for each elective position in 2022, party-sponsored and independent. Counts only; no individual is named or scored.',
    period: { from: '2022', to: '2022' }, years: [2022], source: 'IEBC', source_detail: `${pol.iebc_candidates_2022_by_position.source.title}, ${pol.iebc_candidates_2022_by_position.source.location}`,
    source_url: pol.iebc_candidates_2022_by_position.source.url, unit: 'candidates', coverage: 'Six elective positions and the total',
    method: `As printed; the rows add to the printed total (16,106). Licence: ${pol.licence_terms.IEBC}`,
    last_updated: '2023', retrieved: pol.iebc_candidates_2022_by_position.source.retrieved, views: [{ href: '/kenya/#governance', label: 'Kenya dashboard' }], tags: ['IEBC', 'candidates', 'no reuse licence stated'],
    rows: () => pol.iebc_candidates_2022_by_position.rows.map((r) => ({ position: r.position, party_sponsored: r.party_sponsored, independent: r.independent, total: r.total, note: r.note || '', source_url: pol.iebc_candidates_2022_by_position.source.url })),
  },
];

// ---- Trend explorer series ----
function extraTrendSeries() {
  const out = [];
  CBK_SERIES.forEach((s) => {
    const rows = cbkRows(s); const src = cbkSrc(s.key);
    out.push({
      slug: s.slug, group: 'Kenya: Money and banking (Central Bank of Kenya)', short: s.short, unit: s.unit, dec: s.dec,
      labels: rows.map((r) => r.period), values: rows.map((r) => (r.value === null ? null : r.value / s.div)),
      missing: rows.filter((r) => r.value === null).map((r) => r.period), missingNote: 'Not published by the CBK for this period on the retrieval date',
      basis: /KSh|US\$/.test(s.unit) && !/per US/.test(s.unit) ? 'Nominal: money of each year' : null, real: null,
      note: `${s.basis}. ${S[s.key].definition || ''}`.trim(), source: `Central Bank of Kenya, ${S[s.key].name} (retrieved ${cbk.meta.retrieved})`, sourceUrl: src.landing_page || src.url,
      dataset: (CBK_GROUPS.find((g) => g[3].includes(s.key)) || [])[0],
    });
  });
  ANALYSIS.forEach((a) => {
    const rows = analysisRows(a);
    out.push({
      slug: a.slug, group: 'Kenya: Analysis (derived by Takwimu)', short: `${a.short} (derived)`, unit: a.unit, dec: a.dec,
      labels: rows.map((r) => r.period), values: rows.map((r) => r.value),
      missing: rows.filter((r) => r.value === null).map((r) => r.period), missingNote: 'An input is missing or the year is incomplete',
      basis: null, real: null, note: `Derived: ${a.m.formula}. Inputs: ${a.m.inputs.join('; ')}.`, source: 'Takwimu, from Central Bank of Kenya series (data/derived.json)', sourceUrl: 'https://takwimu.netlify.app/kenya/#analysis', dataset: 'kenya-derived-measures',
    });
  });
  return out;
}

module.exports = { cbk, der, ngo, pol, CBK_SERIES, cbkRows, cbkSrc, ANALYSIS, analysisRows, CRA, craRows, VOTERS, voterCounty, constituencies, EXTRA_DATASETS, extraTrendSeries, countyOf };
