// Build script: generates static JSON data files for Cloudflare Pages
// Run before `next build` — `npm run build` triggers this automatically

const fs = require('fs');
const path = require('path');

// Inline data (same as lib/data.js but in Node-compatible format)
const SOURCES = {
  knbs: { name: "KNBS", tier: 1, full: "Kenya National Bureau of Statistics", url: "https://knbs.or.ke" },
  cbk: { name: "CBK", tier: 1, full: "Central Bank of Kenya", url: "https://cbk.go.ke" },
  treasury: { name: "Treasury", tier: 1, full: "National Treasury", url: "https://treasury.go.ke" },
  ppdc: { name: "PPDC", tier: 1, full: "Public Procurement & Disposal", url: "https://ppdc.go.ke" },
  gazette: { name: "Gazette", tier: 1, full: "Kenya Gazette", url: "https://gazette.go.ke" },
  controller: { name: "CoB", tier: 1, full: "Controller of Budget", url: "https://cob.go.ke" },
  iebc: { name: "IEBC", tier: 1, full: "Independent Electoral & Boundaries Commission", url: "https://iebc.or.ke" },
  imf: { name: "IMF", tier: 2, full: "International Monetary Fund — WEO April 2026", url: "https://imf.org/external/datamapper/profile/KEN" },
  worldbank: { name: "World Bank", tier: 2, full: "World Bank Open Data", url: "https://data.worldbank.org/country/kenya" },
  afdb: { name: "AFDB", tier: 2, full: "African Development Bank", url: "https://afdb.org" },
  aims: { name: "AIMS", tier: 2, full: "Agricultural Information Management System", url: "https://aims.go.ke" },
  kmd: { name: "KMD", tier: 2, full: "Kenya Meteorological Department", url: "https://meteo.go.ke" },
  china_bri: { name: "China BRI", tier: 2, full: "Belt & Road Initiative Portal (China)", url: "https://eng.yidaiyilu.gov.cn" },
  xinhua: { name: "Xinhua", tier: 3, full: "Xinhua News Agency", url: "https://xinhuanet.com" },
  medor: { name: "Med-Or", tier: 3, full: "Med-Or Foundation", url: "https://med-or.org" },
  bga: { name: "BGA", tier: 3, full: "BowerGroupAsia", url: "https://bowergroupasia.com" },
};

const MACRO_DATA = {
  gdp_growth: { value: 4.6, unit: "%", year: 2025, sources: ["knbs", "imf"], confidence: 5, sheng: "Economy iko aje", en: "GDP Growth" },
  gdp_current: { value: 147.26, unit: "B USD", year: 2026, sources: ["imf"], confidence: 4, sheng: "GDP ya Kenya", en: "GDP (current USD)" },
  gdp_per_capita: { value: 2362.9, unit: "USD", year: 2025, sources: ["worldbank"], confidence: 4, sheng: "Pesa per msee", en: "GDP Per Capita" },
  inflation: { value: 5.2, unit: "%", year: 2026, month: "Aug", sources: ["knbs", "cbk"], confidence: 5, sheng: "Bei ya vitu", en: "Inflation (YoY)" },
  inflation_imf_proj: { value: 5.9, unit: "%", year: 2026, sources: ["imf"], confidence: 4, sheng: "Bei projection", en: "Inflation (IMF Proj)" },
  public_debt: { value: 11.4, unit: "T KSh", year: 2026, sources: ["treasury", "cbk", "worldbank"], confidence: 5, sheng: "Deni ya serikali", en: "Public Debt" },
  debt_gdp: { value: 67, unit: "%", year: 2026, sources: ["treasury", "imf"], confidence: 4, sheng: "Deni vs GDP", en: "Debt-to-GDP" },
  debt_service: { value: 851, unit: "B KSh", year: 2026, sources: ["treasury"], confidence: 4, sheng: "Kulipa deni", en: "Debt Service" },
  cbk_rate: { value: 9.0, unit: "%", year: 2026, sources: ["cbk"], confidence: 5, sheng: "CBK rate", en: "Central Bank Rate" },
  lending_rate: { value: 14.82, unit: "%", year: 2026, sources: ["cbk"], confidence: 5, sheng: "Bank interest", en: "Commercial Lending Rate" },
  fx_usd: { value: 128.4, unit: "KSh/USD", year: 2026, sources: ["cbk"], confidence: 5, sheng: "Bei ya dollar", en: "USD/KES Exchange Rate" },
  reserves: { value: 8.9, unit: "B USD", year: 2026, sources: ["cbk", "imf"], confidence: 4, sheng: "Dollar reserve", en: "Foreign Reserves" },
  reserves_months: { value: 4.2, unit: "months", year: 2026, sources: ["cbk"], confidence: 4, sheng: "Reserve cover", en: "Import Cover (months)" },
  population: { value: 54.269, unit: "M", year: 2026, sources: ["knbs", "imf"], confidence: 5, sheng: "Watu", en: "Population" },
  poverty: { value: 39.8, unit: "%", year: 2022, sources: ["knbs"], confidence: 5, sheng: "Umaskini", en: "Poverty Rate" },
  hdi: { value: 0.628, unit: "index", year: 2022, sources: ["worldbank"], confidence: 4, sheng: "HDI", en: "Human Development Index" },
  gini: { value: 0.377, unit: "index", year: 2022, sources: ["knbs"], confidence: 4, sheng: "Ubaguzi", en: "Gini Coefficient" },
  current_account: { value: -120.9, unit: "B KSh", year: 2026, q: "Q1", sources: ["knbs"], confidence: 4, sheng: "Balance of Payments", en: "Current Account Balance" },
};

const LABOUR_DATA = {
  formal_employment: { value: 3.31, unit: "M", year: 2026, sources: ["knbs"], confidence: 5, sheng: "Kazi za ofisi", en: "Formal Employment" },
  informal_employment: { value: 18.1, unit: "M", year: 2026, sources: ["knbs"], confidence: 5, sheng: "Wasee wa mjengo", en: "Informal Employment" },
  informal_share: { value: 83.8, unit: "%", year: 2026, sources: ["knbs"], confidence: 5, sheng: "Wasee wa mjengo %", en: "Informal Sector Share" },
  youth_unemployment: { value: 30, unit: "%", year: 2026, sources: ["afdb", "knbs"], confidence: 4, sheng: "Vijana hawana job", en: "Youth Unemployment" },
  total_unemployment: { value: 13.9, unit: "%", year: 2026, sources: ["afdb"], confidence: 4, sheng: "Hawana kazi", en: "Total Unemployment" },
  new_jobs_2024: { value: 782300, unit: "jobs", year: 2024, sources: ["knbs"], confidence: 5, sheng: "Kazi mpya", en: "New Jobs (2024)" },
  new_jobs_2023: { value: 848100, unit: "jobs", year: 2023, sources: ["knbs"], confidence: 5, sheng: "Kazi mpya 2023", en: "New Jobs (2023)" },
  real_wage_index: { value: 85.84, unit: "index", base: "Jun 2009=100", year: 2026, sources: ["knbs"], confidence: 5, sheng: "Mshahara wa kweli", en: "Real Wage Index" },
};

const SECTOR_DATA = {
  construction_growth: { value: 6.8, unit: "%", year: 2025, sources: ["knbs"], confidence: 5, sheng: "Ujenzi", en: "Construction Growth" },
  mining_growth: { value: 14.9, unit: "%", year: 2025, sources: ["knbs"], confidence: 5, sheng: "Mining", en: "Mining Growth" },
  agriculture_growth: { value: 3.1, unit: "%", year: 2025, sources: ["knbs"], confidence: 5, sheng: "Kilimo", en: "Agriculture Growth" },
  financial_services: { value: 4.2, unit: "%", year: 2025, sources: ["knbs"], confidence: 5, sheng: "Banking", en: "Financial Services Growth" },
  tourism_growth: { value: 5.4, unit: "%", year: 2025, sources: ["knbs"], confidence: 4, sheng: "Utalii", en: "Tourism Growth" },
};

const CHINA_BRI_DATA = {
  sgr_loan: { value: 3.2, unit: "B USD", year: 2014, sources: ["china_bri", "xinhua"], confidence: 4, sheng: "Deni ya SGR", en: "SGR Loan (China EximBank)" },
  sgr_jobs_created: { value: 30000, unit: "jobs", year: 2017, sources: ["china_bri"], confidence: 4, sheng: "Jobs za SGR", en: "SGR Jobs Created" },
  sgr_passengers_annual: { value: 5.4, unit: "M", year: 2017, sources: ["china_bri"], confidence: 4, sheng: "Watu SGR", en: "SGR Passengers (annual)" },
  sgr_cargo_teus: { value: 1.3, unit: "M TEUs", year: 2017, sources: ["china_bri"], confidence: 4, sheng: "Cargo SGR", en: "SGR Cargo (TEUs)" },
  sgr_losses_3yr: { value: 200, unit: "M USD", year: 2020, sources: ["china_bri"], confidence: 3, sheng: "Hasara SGR", en: "SGR Losses (3 years)" },
  chinese_projects_count: { value: 172, unit: "countries", year: 2026, sources: ["china_bri"], confidence: 4, sheng: "Nchi za BRI", en: "BRI Countries" },
  chinese_infrastructure_share: { value: 70, unit: "%", year: 2020, sources: ["china_bri"], confidence: 3, sheng: "Miradi ya China", en: "Chinese Infrastructure Share" },
  china_kenya_grants: { value: 102, unit: "M USD", year: 2020, sources: ["china_bri"], confidence: 3, sheng: "Grants za China", en: "China Grants to Kenya" },
  china_kenya_loans: { value: 8545, unit: "M USD", year: 2020, sources: ["china_bri"], confidence: 3, sheng: "Loans za China", en: "China Loans to Kenya" },
  konza_technopolis: { value: 14.5, unit: "B USD", year: 2026, sources: ["china_bri"], confidence: 3, sheng: "Konza", en: "Konza Technopolis (planned)" },
  huawei_safaricom: { value: 1, unit: "partnership", year: 2020, sources: ["china_bri"], confidence: 4, sheng: "Huawei + Safaricom", en: "Huawei-Safaricom Partnership" },
  sino_africa_research: { value: 1, unit: "centre", year: 2020, sources: ["china_bri"], confidence: 4, sheng: "Sino-Africa Research", en: "Sino-Africa Joint Research Center" },
};

const IMF_DATA = {
  imf_gdp_proj_2026: { value: 4.5, unit: "%", year: 2026, sources: ["imf"], confidence: 4, sheng: "IMF GDP proj", en: "IMF GDP Projection 2026" },
  imf_inflation_proj_2026: { value: 5.9, unit: "%", year: 2026, sources: ["imf"], confidence: 4, sheng: "IMF bei proj", en: "IMF Inflation Projection 2026" },
  imf_population: { value: 54.269, unit: "M", year: 2026, sources: ["imf"], confidence: 5, sheng: "Watu (IMF)", en: "Population (IMF)" },
  imf_sdr_outstanding: { value: 2803.76, unit: "M SDR", year: 2026, sources: ["imf"], confidence: 5, sheng: "IMF deni", en: "IMF Outstanding Loans (SDR)" },
  imf_quota: { value: 542.8, unit: "M SDR", year: 2026, sources: ["imf"], confidence: 5, sheng: "IMF quota", en: "IMF Quota" },
  imf_arrangements: { value: 22, unit: "arrangements", year: 2026, sources: ["imf"], confidence: 5, sheng: "IMF deals", en: "IMF Arrangements Since 1964" },
};

const WB_DATA = {
  wb_gdp_current: { value: 135.94, unit: "B USD", year: 2025, sources: ["worldbank"], confidence: 4, sheng: "GDP (WB)", en: "GDP Current (WB)" },
  wb_gdp_per_capita: { value: 2362.9, unit: "USD", year: 2025, sources: ["worldbank"], confidence: 4, sheng: "Per capita (WB)", en: "GDP Per Capita (WB)" },
  wb_gdp_growth: { value: 4.6, unit: "%", year: 2025, sources: ["worldbank"], confidence: 4, sheng: "Growth (WB)", en: "GDP Growth (WB)" },
  wb_inflation: { value: 5.4, unit: "%", year: 2025, sources: ["worldbank"], confidence: 4, sheng: "Inflation (WB)", en: "Inflation (WB)" },
  wb_population: { value: 57532493, unit: "people", year: 2025, sources: ["worldbank"], confidence: 5, sheng: "Watu (WB)", en: "Population (WB)" },
  wb_fertility: { value: 3.3, unit: "births/woman", year: 2023, sources: ["worldbank"], confidence: 4, sheng: "Watoto per mama", en: "Fertility Rate" },
  wb_life_expectancy: { value: 64, unit: "years", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Kuishi", en: "Life Expectancy" },
  wb_mortality_under5: { value: 45.5, unit: "per 1,000", year: 2022, sources: ["worldbank"], confidence: 4, sheng: "Watoto wanaokufa", en: "Under-5 Mortality" },
  wb_net_migration: { value: -27330, unit: "people", year: 2025, sources: ["worldbank"], confidence: 3, sheng: "Watu wanaondoka", en: "Net Migration" },
  wb_control_corruption: { value: -0.4, unit: "index", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Corruption control", en: "Control of Corruption" },
  wb_gov_effectiveness: { value: 0.4, unit: "index", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Serikali inafanya kazi", en: "Government Effectiveness" },
  wb_regulatory_quality: { value: 0.4, unit: "index", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Regulation quality", en: "Regulatory Quality" },
  wb_rule_of_law: { value: -0.4, unit: "index", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Sheria", en: "Rule of Law" },
  wb_voice_accountability: { value: -0.4, unit: "index", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Sauti ya wananchi", en: "Voice & Accountability" },
  wb_ease_business: { value: 73.4, unit: "rank", year: 2024, sources: ["worldbank"], confidence: 4, sheng: "Ease of business", en: "Ease of Doing Business" },
};

const EAC_COMPARISON = [
  { country: "Rwanda", gdp_growth: 7.1, flag: "🇷🇼", rank: 1 },
  { country: "Uganda", gdp_growth: 7.5, flag: "🇺🇬", rank: 2 },
  { country: "Tanzania", gdp_growth: 6.0, flag: "🇹🇿", rank: 3 },
  { country: "Ethiopia", gdp_growth: 9.2, flag: "🇪🇹", rank: 4 },
  { country: "Burundi", gdp_growth: 4.5, flag: "🇧🇮", rank: 5 },
  { country: "DRC", gdp_growth: 4.8, flag: "🇨🇩", rank: 6 },
  { country: "Kenya", gdp_growth: 4.6, flag: "🇰🇪", rank: 7 },
  { country: "South Sudan", gdp_growth: 3.2, flag: "🇸🇸", rank: 8 },
];

const CLAIMS = [
  {
    id: "ruto_transformation_2026",
    claimant: "President William Ruto",
    claim_text: "2026 is the year of transformation — a turning point from promise to prosperity.",
    claim_date: "2026-01-01",
    category: "macro",
    status: "disputed",
    confidence: 0,
    reality: "GDP growth slowed to 4.6% in 2025, slowest since pandemic recovery. Below EAC average of 5.6%. Real wages below 2009 levels (KNBS index 85.84).",
    sources: ["knbs", "imf", "worldbank"],
    sheng: "Mseme anasema vitu zimechange, but ground iko vile ilikuwa. Bei bado juu, job bado scarce.",
    en: "Official claim of transformation contradicts verified GDP slowdown and wage stagnation.",
  },
  {
    id: "ruto_unemployment_2026",
    claimant: "President William Ruto",
    claim_text: "We will halve unemployment without crushing taxpayers and without saddling our children with unsustainable debt.",
    claim_date: "2026-01-01",
    category: "labour",
    status: "disputed",
    confidence: 0,
    reality: "Youth unemployment ~30% (AFDB). Informal sector 83.8%. Public debt KSh 11.4T (67% GDP). Debt service KSh 851B exceeds health + county transfers combined.",
    sources: ["knbs", "afdb", "treasury"],
    sheng: "Anasema atapunguza joblessness bila deni, but deni imefika 11.4 trillion. Vijana bado hawana kazi.",
    en: "Employment pledge contradicted by persistent youth unemployment and rising debt-to-GDP ratio.",
  },
  {
    id: "ruto_cbk_rates_2026",
    claimant: "Treasury/CBK narrative",
    claim_text: "The Central Bank cut rates aggressively to support growth.",
    claim_date: "2025-10-01",
    category: "monetary",
    status: "disputed",
    confidence: 2,
    reality: "CBR fell from 11.25% to 9.00%, but commercial lending rates only fell from 16.89% to 14.82%. Transmission gap of 5.82 percentage points. Private credit growth anaemic at 6.4%.",
    sources: ["cbk", "knbs"],
    sheng: "CBK imepunguza rates, but banks bado wanacharge 14.82%. Gap ya 5.8% inaenda wapi? Someone anakula hiyo difference.",
    en: "Policy rate transmission is leaking. 5.8 percentage point spread between CBR and commercial lending rate.",
  },
  {
    id: "ruto_sgr_2026",
    claimant: "President William Ruto",
    claim_text: "SGR extension to Kisumu and Malaba commencing construction.",
    claim_date: "2026-01-01",
    category: "infrastructure",
    status: "stalled",
    confidence: 2,
    reality: "Same pledge made in 2019. No verifiable ground-breaking as of August 2026. China EximBank provided $3.2B for original SGR. Re-announced, not newly launched.",
    sources: ["krc", "treasury", "china_bri"],
    sheng: "SGR ya Kisumu imesemwa tena. Tuliskia hii story 2019. Ground bado ni concrete tu. China walikopa $3.2B, sasa tunataka tena?",
    en: "Project re-announced in 2026 after identical 2019 pledge. Original $3.2B China EximBank loan. No procurement or physical progress verified.",
  },
  {
    id: "ruto_galana_2026",
    claimant: "President William Ruto",
    claim_text: "Galana Kulalu Dam — 300,000 acres commencing construction.",
    claim_date: "2026-01-01",
    category: "infrastructure",
    status: "stalled",
    confidence: 1,
    reality: "First announced 2014. Multiple delays. Re-announced January 2026. No verifiable progress. Longest-running stalled project in Kenya's infrastructure portfolio.",
    sources: ["nib", "treasury"],
    sheng: "Galana imesemwa since 2014. Sijui 2026 ndio mwaka. Tungeona mawe na cement by now. Hii ni zombie project.",
    en: "Longest-running stalled project. Re-announced without new procurement. First pledged 12 years ago.",
  },
  {
    id: "ruto_6000km_roads_2026",
    claimant: "President William Ruto",
    claim_text: "6,000km of roads tarmacked.",
    claim_date: "2026-01-01",
    category: "infrastructure",
    status: "progress",
    confidence: 3,
    reality: "Road arrears paid in 2025, stimulating construction recovery (KNBS construction +6.8%). Actual km delivered varies by county. Rironi-Mau Summit among contracted. But 6,000km figure unverified.",
    sources: ["kenha", "kura", "knbs"],
    sheng: "Barabara zimejengwa, construction sector imegrow 6.8%. But 6,000km ni number gani? County to county ina-depend.",
    en: "Construction sector grew 6.8% on road arrears payment. But 6,000km aggregate figure not independently verified.",
  },
  {
    id: "china_bri_winwin_2026",
    claimant: "China Belt & Road Portal / Xinhua",
    claim_text: "BRI is a win-win alliance accelerating Kenya's industrial growth and creating jobs.",
    claim_date: "2026-05-25",
    category: "trade",
    status: "partial",
    confidence: 3,
    reality: "SGR created 30,000 jobs and moved 5.4M passengers + 1.3M TEUs cargo. But SGR lost $200M over 3 years. 62% of Kenyans fear Chinese workers displace local labour. Kenya's debt to China significant.",
    sources: ["china_bri", "xinhua", "worldbank"],
    sheng: "China wanasema win-win. SGR ilifanya jobs 30,000. But imepoteza $200M. Wakenya 62% wanaogopa China workers. Deni kubwa.",
    en: "Mixed record. Jobs created but SGR commercially unviable. Local displacement fears. Significant debt burden.",
  },
];

const COUNTY_ABSORPTION = [
  { county: "Nairobi", absorption: 42, rank: 32, heat: "low" },
  { county: "Mombasa", absorption: 58, rank: 12, heat: "mid" },
  { county: "Kiambu", absorption: 35, rank: 41, heat: "low" },
  { county: "Kisumu", absorption: 51, rank: 18, heat: "mid" },
  { county: "Uasin Gishu", absorption: 48, rank: 22, heat: "mid" },
  { county: "Nakuru", absorption: 55, rank: 14, heat: "mid" },
  { county: "Kakamega", absorption: 44, rank: 28, heat: "low" },
  { county: "Machakos", absorption: 49, rank: 20, heat: "mid" },
  { county: "Makueni", absorption: 52, rank: 17, heat: "mid" },
  { county: "Nyeri", absorption: 46, rank: 25, heat: "mid" },
  { county: "Bungoma", absorption: 41, rank: 35, heat: "low" },
  { county: "Kajiado", absorption: 53, rank: 16, heat: "mid" },
  { county: "Kilifi", absorption: 38, rank: 38, heat: "low" },
  { county: "Kirinyaga", absorption: 61, rank: 8, heat: "high" },
  { county: "Murang'a", absorption: 59, rank: 10, heat: "high" },
];

const SOKO_DATA = [
  { commodity: "White Maize", unit: "90kg bag", price: 5200, change: -3, market: "Nyamakima, Nairobi", trend: "down" },
  { commodity: "Irish Potatoes", unit: "50kg", price: 3800, change: 7, market: "Marikiti, Mombasa", trend: "up" },
  { commodity: "Tomatoes", unit: "15kg crate", price: 1650, change: -12, market: "Muthurwa, Nairobi", trend: "down" },
  { commodity: "Beans (Rosecoco)", unit: "90kg", price: 8400, change: 5.2, market: "Kisumu Wholesale", trend: "up" },
  { commodity: "Rice (Pishori)", unit: "50kg", price: 12200, change: -2.1, market: "Mombasa Wholesale", trend: "down" },
  { commodity: "Onions (Red)", unit: "50kg", price: 4100, change: 8.4, market: "Nakuru Wholesale", trend: "up" },
  { commodity: "Petrol", unit: "per litre", price: 179.30, change: 2.1, market: "Nairobi Pump", trend: "up" },
  { commodity: "Electricity", unit: "per kWh", price: 25.40, change: 4.8, market: "Domestic Tariff", trend: "up" },
];

const AHADI_TIMELINE = [
  { title: "Hustler Fund", status: "delivered", date: "2023", desc: "Digital credit for informal sector. KSh 50B revolving fund. 20M+ registered users.", sources: ["cbk", "treasury"] },
  { title: "Affordable Housing", status: "progress", date: "2024-2026", desc: "500,000 units pledged. Construction ongoing. Levy resumed after court. Employment stimulus confirmed.", sources: ["treasury", "knbs"] },
  { title: "SGR to Kisumu/Malaba", status: "stalled", date: "2019→2026", desc: "Pledged 2019, re-announced 2026. No ground-breaking. $3.2B China EximBank loan for original phase.", sources: ["krc", "china_bri"] },
  { title: "Galana Kulalu 300K acres", status: "stalled", date: "2014→2026", desc: "Announced 2014. Multiple delays. Re-announced Jan 2026. No verifiable progress.", sources: ["nib"] },
  { title: "Talanta Sports City", status: "notstarted", date: "2026 pledge", desc: "Pledged for 2026 completion. No completion certificate or commissioning date.", sources: ["sports_ministry"] },
  { title: "JKIA Modern Terminal", status: "notstarted", date: "2026 pledge", desc: "Commencement pledged 2026. Awaiting procurement and EIA approvals.", sources: ["kaa"] },
  { title: "6,000km Roads", status: "progress", date: "2025-2026", desc: "Arrears paid 2025, construction recovered (+6.8%). Actual km varies by county.", sources: ["kenha", "kura", "knbs"] },
  { title: "Konza Technopolis", status: "progress", date: "2013→ongoing", desc: "$14.5B planned tech hub. Chinese investors targeted. 64km south of Nairobi.", sources: ["china_bri", "konza"] },
];

const POLITICAL_2027 = {
  incumbency: {
    name: "Kenya Kwanza + ODM Faction",
    leader: "William Ruto",
    deputy: "Kithure Kindiki",
    allies: ["Mudavadi", "Wetang'ula", "Joho", "Mbadi", "Wanga", "Oburu"],
    strengths: ["Incumbency", "Organised machinery", "Peripheral tribe appointments", "Pentecostal base", "Infrastructure ribbon-cuttings"],
    sheng: "Serikali ya Ruto + ODM old guard",
  },
  opposition: {
    name: "United Opposition",
    candidates: ["Kalonzo Musyoka", "Rigathi Gachagua", "Martha Karua", "Fred Matiang'i", "Eugene Wamalwa", "Edwin Sifuna / James Orengo"],
    status: "No consensus candidate. Fluid until March 2027.",
    sheng: "Opposition bila candidate moja",
  },
  genz: {
    name: "Gen-Z Third Force",
    age: "18-39",
    characteristics: ["Anti-party", "Tribeless", "Leaderless by design", "Issue-driven"],
    grievances: ["Unemployment", "Cost of living", "Corruption", "Public debt"],
    paradox: "Cohesion on issues but no cohesion on candidates",
    sheng: "Vijana bila chama, bila tribe, bila leader",
  },
  election_date: "2027-08-10",
  days_remaining: 352,
};

const GDP_TREND = [
  { year: 2021, value: 7.6, source: "knbs" },
  { year: 2022, value: 4.9, source: "knbs" },
  { year: 2023, value: 5.7, source: "knbs" },
  { year: 2024, value: 4.7, source: "knbs" },
  { year: 2025, value: 4.6, source: "knbs" },
  { year: 2026, value: 4.5, source: "imf_proj" },
];

const INFLATION_TREND = [
  { month: "Jan", value: 6.8 },
  { month: "Feb", value: 6.5 },
  { month: "Mar", value: 6.2 },
  { month: "Apr", value: 5.9 },
  { month: "May", value: 5.6 },
  { month: "Jun", value: 5.4 },
  { month: "Jul", value: 5.3 },
  { month: "Aug", value: 5.2 },
];

// Generate static JSON files
const outDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = {
  'pulse.json': {
    type: "national",
    timestamp: '2026-11-21',
    macro: {
      gdp_growth: MACRO_DATA.gdp_growth,
      inflation: MACRO_DATA.inflation,
      debt: MACRO_DATA.public_debt,
      fx: MACRO_DATA.fx_usd,
      cbk_rate: MACRO_DATA.cbk_rate,
    },
    labour: {
      youth_unemployment: LABOUR_DATA.youth_unemployment,
      informal_share: LABOUR_DATA.informal_share,
      real_wage_index: LABOUR_DATA.real_wage_index,
    },
  },
  'macro.json': { ...MACRO_DATA, _timestamp: '2026-11-21' },
  'labour.json': { ...LABOUR_DATA, _timestamp: '2026-11-21' },
  'sectors.json': { ...SECTOR_DATA, _timestamp: '2026-11-21' },
  'china-bri.json': { ...CHINA_BRI_DATA, _timestamp: '2026-11-21' },
  'imf.json': { ...IMF_DATA, _timestamp: '2026-11-21' },
  'worldbank.json': { ...WB_DATA, _timestamp: '2026-11-21' },
  'eac.json': { countries: EAC_COMPARISON, _timestamp: '2026-11-21' },
  'counties.json': { counties: COUNTY_ABSORPTION, _timestamp: '2026-11-21' },
  'soko.json': { commodities: SOKO_DATA, _timestamp: '2026-11-21' },
  'gdp-trend.json': { data: GDP_TREND, _timestamp: '2026-11-21' },
  'inflation-trend.json': { data: INFLATION_TREND, _timestamp: '2026-11-21' },
  'sources.json': { sources: SOURCES, _timestamp: '2026-11-21' },
};

// Only datasets with verified provenance are published. The remaining datasets above are
// unverified hand-typed figures and stay unpublished until each is traced to a primary source.
const PUBLISH = new Set(['sources.json']);

// Remove files from earlier builds so unverified data cannot linger in public/data.
fs.readdirSync(outDir).forEach((f) => {
  if (f.endsWith('.json')) fs.unlinkSync(path.join(outDir, f));
});

Object.entries(files)
  .filter(([filename]) => PUBLISH.has(filename))
  .forEach(([filename, data]) => {
    fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2));
    console.log(`Generated public/data/${filename}`);
  });

// Siaya data is verified-with-status and carries its own provenance fields.
['siaya.json', 'subcounties.json', 'county.json', 'history.json', 'cpi.json', 'conflicts.json', 'siaya-boundaries.json', 'source-manifest.json', 'source-library.json', 'national.json', 'counties-cob.json', 'siaya-economy.json', 'siaya-governance.json', 'siaya-audits.json', 'siaya-fiscal-ledger.json', 'siaya-health.json', 'siaya-education.json', 'siaya-agriculture.json', 'siaya-geography.json', 'siaya-climate.json', 'siaya-wards-geo.json', 'siaya-analysis.json', 'siaya-programmes.json', 'ledger-classes.json', 'corrections.json', 'machine-checks.json'].forEach((f) => {
  // Files with itemised observations are published through lib/review-status.js: rejected values removed, and an
  // editorial_review block with the state of every value that is not simply pending. The others are copied as held.
  const rs = require('../lib/review-status');
  const stem = f.replace(/\.json$/, '');
  if (rs.DATASET_IDS.includes(stem)) fs.writeFileSync(path.join(outDir, f), JSON.stringify(rs.publishedCopy(stem), null, 1) + '\n');
  // Conflict register: values from a link-and-cite source (IMF) are blanked, citation and link kept (sweep N4).
  else if (f === 'conflicts.json') fs.writeFileSync(path.join(outDir, f), JSON.stringify(require('../lib/reuse').bulkConflicts(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'))), null, 2) + '\n');
  else fs.copyFileSync(path.join(__dirname, '..', 'data', f), path.join(outDir, f));
  console.log('Generated public/data/' + f);
});

// Project register: published from lib/projects.js publicCopy(), which removes every contractor field. Owner decision
// (21 Nov 2026): contractor company names stay in data/siaya-projects.json only, pending editorial review.
(function writeProjects() {
  const { publicCopy, WITHHELD } = require('../lib/projects');
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-projects.json'), 'utf8'));
  // A public utility that is also a programme implementer in the atlas is checked by field only, not by name.
  const progText = fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-programmes.json'), 'utf8');
  const names = raw.projects.map((p) => p.contract && p.contract.contractor && p.contract.contractor.name).filter(Boolean).filter((nm) => !progText.includes(nm));
  const out = JSON.stringify({ ...publicCopy(), editorial_review: require('../lib/review-status').publishedCopy('siaya-projects').editorial_review }, null, 1) + '\n';
  // Sweep D22: the data file holds no contractor names, so `names` is normally empty; a company-name pattern on the
  // output (the one scripts/test-projects.js applies to the data) keeps the check meaningful.
  const COMPANY = /\b[A-Z][A-Za-z&]+(?: (?:[A-Z][A-Za-z&]+|and|of|&))* (?:Limited|Ltd\.?|PLC|Company|Corporation)\b/g;
  const companies = [...new Set(out.match(COMPANY) || [])].filter((nm) => !progText.includes(nm));
  const leak = WITHHELD.filter((k) => out.includes(`"${k}"`)).concat(names.filter((nm) => out.includes(nm)), companies);
  if (leak.length) throw new Error(`siaya-projects public copy still contains withheld fields or names: ${leak.join(', ')}`);
  fs.writeFileSync(path.join(outDir, 'siaya-projects.json'), out);
  console.log('Generated public/data/siaya-projects.json (contractor fields withheld)');
}());

// CSV export of the ten-year series, built from the same validated file the charts use.
(function writeHistoryCsv() {
  // Read through lib/review-status.js: a rejected value is removed, and every row says its review state.
  const rs = require('../lib/review-status');
  const hist = rs.masked('history');
  const cpi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cpi.json'), 'utf8'));
  // Same quoting as every other download (lib/csv.js): text a spreadsheet would run as a formula gets an apostrophe.
  const q = require('../lib/csv').cell;
  const rows = [['indicator', 'fiscal_year', 'value', 'unit', 'basis', 'source_report', 'source_url', 'confidence_1_to_5', 'retrieved', 'period', 'caveat', 'source_id', 'pdf_page', 'printed_page', 'page_note', 'dataset_version', 'review_status']];
  const rid = [null]; // review id of each row (lib/review-status.js), for the review_status column
  const add = (id, row) => { rows.push(row); rid.push(id); };
  // Page reference columns: the manifest document id, PDF page and printed page where the figure was read.
  const pageCols = (r) => (r ? [r.source_id, r.page === null ? '' : r.page, r.printed_page, r.page === null ? r.page_note : (r.page_note || '')] : ['', '', '', '']);
  const got = hist.meta.retrieved;
  const field = [
    ['approved_budget', 'approved', 'KSh billion'], ['recurrent_budget', 'recurrent_budget', 'KSh billion'], ['development_budget', 'development_budget', 'KSh billion'],
    ['spent', 'spent', 'KSh billion'], ['recurrent_spent', 'recurrent_spent', 'KSh billion'], ['development_spent', 'development_spent', 'KSh billion'],
    ['recurrent_budget_spent_pct_as_reported', 'recurrent_absorption_pct', 'per cent'], ['development_budget_spent_pct_as_reported', 'development_absorption_pct', 'per cent'],
    ['own_source_revenue_target', 'osr_target_m', 'KSh million'], ['pending_bills_development', 'pending_development_m', 'KSh million'], ['pending_bills_recurrent', 'pending_recurrent_m', 'KSh million'], ['pending_bills_total', 'pending_total_m', 'KSh million'],
  ];
  const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
  years.forEach((y) => {
    const period = y.fy === '2013/14' ? '16 months to 30 June 2014' : `FY ${y.fy}`;
    field.forEach(([name, key, unit]) => {
      if (y[key] === undefined) return;
      const rep = hist.reports[(y.field_source && y.field_source[key]) || y.report] || {};
      const basis = (y.derived || []).includes(key) ? 'derived (total minus development)' : 'reported';
      add(`years:${y.fy}:${key}`, [name, y.fy, y[key], unit, basis, rep.title, rep.url, rep.confidence, got, period, y.caveat, ...pageCols((y.provenance || {})[key])]);
    });
    if (y.spent !== undefined && y.spent !== null && cpi.fiscal_year[y.fy]) add(`years:${y.fy}:spent`, ['spent_real_2024_25_prices', y.fy, +(y.spent * (cpi.fiscal_year['2024/25'] / cpi.fiscal_year[y.fy])).toFixed(3), 'KSh billion', 'derived (approximate)', 'World Bank CPI, fiscal-year average', cpi.meta.source_url, '', got, period, cpi.meta.method]);
  });
  hist.osr_series.points.forEach((p) => {
    add(`osr:${p.fy}`, ['own_source_revenue', p.fy, p.value, 'KSh million', 'reported', p.report, '', '', got, `FY ${p.fy}`, '', ...pageCols(p)]);
    if (p.alternate) add(null, ['own_source_revenue', p.fy, p.alternate.value, 'KSh million', 'alternate (other report)', p.alternate.report, '', '', got, `FY ${p.fy}`, 'Reports disagree; see conflicts.json', ...pageCols(p.alternate)]);
  });
  hist.audits.points.forEach((a) => add(`audits:${a.fy}`, ['audit_opinion', a.fy, a.opinion, 'category', 'reported', a.source || 'Auditor-General report on the County Executive accounts', a.url, a.confidence, got, a.period || `FY ${a.fy}`, [a.reasons, a.caveat].filter(Boolean).join(' '), ...pageCols(a)]));
  // In-year (partial-year) figures: labelled so they are never mistaken for full-year values.
  if (hist.in_year) hist.in_year.periods.forEach((p) => p.figures.forEach((f) => add(`in_year:${p.id}:${f.measure}`, [`in_year_${f.measure}`, hist.in_year.fy, f.value, f.unit, `in-year: ${hist.in_year.comparability}`, `${p.report.title}, PDF p. ${f.pdf_page}`, p.report.url, p.confidence, got, f.as_of ? `${p.period} (at ${f.as_of})` : p.period, f.label, p.source_id, f.pdf_page, f.printed_page, ''])));
  // Figures from other documents for years whose Controller of Budget report is missing: listed, not used in the series.
  if (hist.supplementary) hist.supplementary.documents.forEach((d) => d.figures.forEach((f) => add(null, [`other_source_${f.measure}`, d.fy, f.value, f.unit, `other document (${d.kind}); not used in the series`, `${d.title}, PDF p. ${f.pdf_page}`, d.url, d.confidence, got, `FY ${d.fy}`, f.label, d.source_id, f.pdf_page, f.printed_page, ''])));
  // Every value in the conflict register, so no disagreeing figure is left out of the export.
  const conf = require('../lib/reuse').bulkConflicts(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'conflicts.json'), 'utf8')));
  conf.conflicts.forEach((c) => c.values.forEach((v) => add(null, [`conflict: ${c.measure}`, '', v.value, c.unit, v.value_withheld ? `source value (${c.status}); ${v.value_withheld}` : `source value (${c.status})`, v.label, v.url, '', got, '', c.definitions])));
  // Every row carries the version stamp of history.json (short content hash, as in the dataset catalogue).
  const ver = require('../lib/dataset-status').versionOf('history.json');
  const status = (i) => { const r = rid[i] ? rs.review('history', rid[i]) : null; return r ? (r.hide ? `${r.label}: ${r.reason}` : r.label) : ''; };
  fs.writeFileSync(path.join(outDir, 'history.csv'), rows.map((r, i) => [...r, ...Array(Math.max(0, rows[0].length - 2 - r.length)).fill(''), ...(i ? [ver, status(i)] : [])].map(q).join(',')).join('\n') + '\n');
  console.log(`Generated public/data/history.csv (${rows.length - 1} rows)`);
}());

// Dataset catalogue downloads (/datasets/): one CSV and one JSON per dataset, built from the same validated files
// the Explore pages read (lib/explore.js). Each JSON carries the dataset's metadata with its rows.
(function writeDatasets() {
  const { DATASETS, catalogue, STATUS_VOCABULARY } = require('../lib/explore');
  const { toCSV } = require('../lib/csv');
  const dir = path.join(outDir, 'datasets');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const meta = Object.fromEntries(catalogue().map((d) => [d.id, d]));
  let n = 0;
  DATASETS.forEach((d) => {
    if (!d.rows) return; // files that already exist in /data/ (history.csv, history.json)
    const rows = d.rows();
    // CSV rows carry the dataset version (short content hash of its data file) in a last column.
    if (d.files.csv.startsWith('/data/datasets/')) { fs.writeFileSync(path.join(dir, `${d.id}.csv`), toCSV(rows.map((r) => ({ ...r, dataset_version: d.version })), d.columns ? [...d.columns, 'dataset_version'] : undefined)); n += 1; }
    if (d.files.json.startsWith('/data/datasets/')) { fs.writeFileSync(path.join(dir, `${d.id}.json`), JSON.stringify({ dataset: meta[d.id], rows }, null, 1) + '\n'); n += 1; }
  });
  fs.writeFileSync(path.join(dir, 'catalogue.json'), JSON.stringify({ updated: '2026-11-21', status_vocabulary: STATUS_VOCABULARY, datasets: catalogue() }, null, 1) + '\n');
  console.log(`Generated public/data/datasets/ (${n} files and catalogue.json, ${DATASETS.length} datasets)`);
}());

// The fiscal brief PDF moved to /reports/siaya-fiscal-brief.pdf (sweep N2). netlify.toml answers the old
// /briefs/siaya-fiscal-brief.pdf with a 301; this byte-identical copy (gitignored, made from the new file on every
// build, so it can never go stale) is the fallback on hosts without the redirect.
(function briefFallback() {
  const src = path.join(__dirname, '..', 'public', 'reports', 'siaya-fiscal-brief.pdf');
  const dst = path.join(__dirname, '..', 'public', 'briefs', 'siaya-fiscal-brief.pdf');
  if (!fs.existsSync(src)) throw new Error('public/reports/siaya-fiscal-brief.pdf is missing (run scripts/make-brief-pdf.js)');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log('Generated public/briefs/siaya-fiscal-brief.pdf (fallback copy of /reports/siaya-fiscal-brief.pdf)');
}());
