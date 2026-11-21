// Siaya's economy (/counties/siaya/economy/): Gross County Product from data/siaya-economy.json (KNBS GCP 2025 and
// GCP 2024 editions, kept as separate vintages). Values are as printed; nothing is derived except the revision
// differences already recorded in the file. Server and build only.
const eco = require('../data/siaya-economy.json');

const EDITION = { GCP2025: 'GCP 2025 edition', GCP2024: 'GCP 2024 edition' };
const VINTAGES = ['GCP2025', 'GCP2024'];
const src = Object.fromEntries(eco.sources.map((s) => [s.vintage, s]));
const obs = eco.observations;
const find = (q) => obs.filter((o) => Object.entries(q).every(([k, v]) => o[k] === v));
const one = (q) => find(q)[0] || null;

// "Table 8, PDF p. 33 (printed p. 19)": the citation shown beside every figure.
const pageRef = (o) => `PDF p. ${o.pdf_page}${o.printed_page_shown && o.printed_page ? ` (printed p. ${o.printed_page})` : ''}`;
const cite = (o) => ({ edition: EDITION[o.vintage], table: o.table, page: pageRef(o), confidence: o.confidence, read: /^ocr/.test(o.read_method) ? 'OCR of a chart label' : 'PDF text layer', url: src[o.vintage].file_url });

// Short names for chart axes; the table view and the dataset keep KNBS's full labels.
const SHORT = {
  agriculture_forestry_fishing: 'Agriculture', mining_quarrying: 'Mining', manufacturing: 'Manufacturing', electricity_supply: 'Electricity',
  water_supply_waste: 'Water, waste', construction: 'Construction', wholesale_retail_trade: 'Trade', transport_storage: 'Transport',
  accommodation_food: 'Hotels, food', information_communication: 'ICT', financial_insurance: 'Finance', real_estate: 'Real estate',
  professional_technical: 'Professional', administrative_support: 'Admin support', public_administration_defence: 'Public admin',
  education: 'Education', human_health_social_work: 'Health', other_service_activities: 'Other services',
};
const years = [...new Set(find({ indicator: 'gcp_total' }).map((o) => o.period))].sort();

function totalSeries(basis) {
  return VINTAGES.map((v) => {
    const pts = years.map((y) => one({ vintage: v, indicator: 'gcp_total', price_basis: basis, period: y }));
    const any = pts.find(Boolean);
    return { vintage: v, name: EDITION[v], values: pts.map((o) => (o ? o.value : null)), provisional: pts.filter((o) => o && o.provisional).map((o) => o.period), cite: cite(any) };
  });
}

function economy() {
  const latestYear = find({ vintage: 'GCP2025', indicator: 'gva_by_activity' }).map((o) => o.period).sort().pop();
  const sectorObs = find({ vintage: 'GCP2025', indicator: 'gva_by_activity', period: latestYear });
  const activities = sectorObs.filter((o) => o.value >= 0).sort((a, b) => b.value - a.value).map((o) => ({ ...o, short: SHORT[o.sector] || o.sector_label }));
  const fisim = sectorObs.find((o) => o.value < 0) || null;
  const annex = one({ vintage: 'GCP2025', indicator: 'gcp_annex_total', period: latestYear });
  const latestTotal = one({ vintage: 'GCP2025', indicator: 'gcp_total', price_basis: 'current', period: latestYear });
  const share = VINTAGES.map((v) => find({ vintage: v, indicator: 'share_of_county_gva_total' }).find((o) => o.period.includes('-')));
  const growth = VINTAGES.map((v) => one({ vintage: v, indicator: 'real_growth_avg' }));
  const revisions = eco.revisions.filter((r) => r.indicator === 'gcp_total').map((r) => ({
    ...r, earlier: cite(obs.find((o) => o.id === r.earlier_id)), later: cite(obs.find((o) => o.id === r.later_id)),
  })).sort((a, b) => (a.price_basis === b.price_basis ? a.period.localeCompare(b.period) : a.price_basis === 'current' ? -1 : 1));
  const rev2023 = eco.revisions.filter((r) => r.indicator === 'gva_by_activity' && r.period === '2023').sort((a, b) => a.difference - b.difference).slice(0, 4)
    .map((r) => ({ label: eco.sectors.find((s) => s.code === r.sector).label, difference: r.difference }));
  // Annex citation for one edition and year; GCP 2024 annexes run over two facing pages.
  const annexCite = (v, y) => {
    const c = cite(one({ vintage: v, indicator: 'gcp_annex_total', period: y }));
    const pages = [...new Set(find({ vintage: v, indicator: 'gva_by_activity', period: y }).map((o) => o.pdf_page))].sort((a, b) => a - b);
    return pages.length > 1 ? { ...c, page: `PDF pp. ${pages[0]}-${pages[pages.length - 1]}` } : c;
  };
  const rev2023Src = { later: annexCite('GCP2025', '2023'), earlier: annexCite('GCP2024', '2023') };
  return {
    years, current: totalSeries('current'), constant: totalSeries('constant_2016'),
    latestYear, latestTotal, latestCite: cite(latestTotal), activities, fisim, annex, sectorCite: annexCite('GCP2025', latestYear),
    share: share.map((o) => ({ ...o, cite: cite(o) })), growth: growth.map((o) => ({ ...o, cite: cite(o) })),
    revisions, rev2023, rev2023Src, gaps: eco.gaps, sources: eco.sources, EDITION,
  };
}

// Dataset rows for the catalogue CSV (/datasets/): one row per printed value, with its edition, table and page.
const datasetRows = () => obs.map((o) => ({
  edition: EDITION[o.vintage], vintage: o.vintage, indicator: o.indicator, sector: o.sector || '', sector_label: o.sector_label || '', isic_section: o.isic_section || '',
  period: o.period, value: o.value, unit: o.unit, price_basis: o.price_basis, provisional: o.provisional ? 'yes' : 'no', table: o.table, pdf_page: o.pdf_page,
  printed_page: o.printed_page_shown ? o.printed_page : '', read_method: o.read_method, confidence: o.confidence, note: o.note || '',
  source: src[o.vintage].title, source_url: src[o.vintage].file_url, sha256: src[o.vintage].sha256,
}));

module.exports = { economy, datasetRows, EDITION, eco };
