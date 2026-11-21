// Data stories: every number in a story is computed here from the data files, so the text cannot drift from
// the data. Server and build only. Wording is neutral: figures describe, they do not judge.
const { median } = require('./analytics');
const { cobRows, cobTotal, cobSource, COB_YEARS, natIndicators } = require('./explore');

const latest = COB_YEARS[COB_YEARS.length - 1];
const prev = COB_YEARS[0];
const withVals = (rows) => rows.filter((r) => r.value !== null);
const spread = (fy, key) => {
  const rows = cobRows(fy, key);
  const v = withVals(rows);
  const sorted = [...v].sort((a, b) => a.value - b.value);
  return { n: v.length, of: rows.length, missing: rows.filter((r) => r.value === null), median: median(v.map((r) => r.value)), lo: sorted[0], hi: sorted[sorted.length - 1], rows };
};

function absorption() {
  const dev = spread(latest, 'development_absorption_pct');
  const rec = spread(latest, 'recurrent_absorption_pct');
  const all = spread(latest, 'overall_absorption_pct');
  const devPrev = spread(prev, 'development_absorption_pct');
  const recPrev = spread(prev, 'recurrent_absorption_pct');
  const under50 = withVals(dev.rows).filter((r) => r.value < 50).length;
  return { latest, prev, dev, rec, all, devPrev, recPrev, under50, src: cobSource(latest), srcPrev: cobSource(prev) };
}

function population() {
  const pop = natIndicators.find((x) => x.code === 'SP.POP.TOTL');
  const urb = natIndicators.find((x) => x.code === 'SP.URB.TOTL.IN.ZS');
  const p0 = pop.first; const p1 = pop.last; const u0 = urb.first; const u1 = urb.last;
  const years = p1.year - p0.year;
  const cagr = (Math.pow(p1.value / p0.value, 1 / years) - 1) * 100;
  const urban0 = (p0.value * u0.value) / 100; const urban1 = (p1.value * u1.value) / 100;
  return { pop, urb, p0, p1, u0, u1, years, cagr, urban0, urban1, sameYears: p0.year === u0.year && p1.year === u1.year };
}

function ownRevenue() {
  const t = (fy, k) => cobTotal(fy, k).value;
  const share = (fy) => (t(fy, 'total_osr_actual') / t(fy, 'total_osr_target')) * 100;
  const perf = spread(latest, 'osr_performance_pct');
  const atTarget = withVals(perf.rows).filter((r) => r.value >= 100).length;
  const act = cobRows(latest, 'total_osr_actual');
  const top = [...withVals(act)].sort((a, b) => b.value - a.value);
  const nairobi = act.find((r) => r.slug === 'nairobi-city');
  const fif = (t(latest, 'fif_aia_actual') / t(latest, 'total_osr_actual')) * 100;
  return {
    latest, prev, actual: t(latest, 'total_osr_actual'), target: t(latest, 'total_osr_target'), share: share(latest),
    actualPrev: t(prev, 'total_osr_actual'), targetPrev: t(prev, 'total_osr_target'), sharePrev: share(prev), printedTotalPct: cobTotal(latest, 'osr_performance_pct'),
    perf, atTarget, top5: top.slice(0, 5).reduce((s, r) => s + r.value, 0), nairobiShare: (nairobi.value / t(latest, 'total_osr_actual')) * 100,
    budget: t(latest, 'approved_budget_total'), fif, src: cobSource(latest), srcPrev: cobSource(prev),
  };
}

const STORIES = [
  { slug: 'county-budget-absorption', title: 'How much of their budgets counties spent', blurb: 'Counties spent most of their recurrent budgets and a smaller share of their development budgets. The spread between counties is wide.', datasets: ['counties-absorption', 'counties-budget-spending'] },
  { slug: 'population-and-towns', title: "Kenya's population and its towns", blurb: 'How many people live in Kenya, how fast the number has grown since 2010, and how many live in urban areas.', datasets: ['kenya-population', 'kenya-urban-share'] },
  { slug: 'own-source-revenue', title: 'What counties collect themselves', blurb: 'Counties raise part of their money locally. How much they collected against their targets, and how concentrated collection is.', datasets: ['counties-own-source-revenue'] },
];

module.exports = { STORIES, absorption, population, ownRevenue };
