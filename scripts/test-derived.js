// Recomputes the derived measures shown on the Kenya dashboard (Analysis) from the published series, so a derived
// value can never drift from its formula. Run: node scripts/test-derived.js (part of npm run validate and the build).
const cbk = require('../data/cbk.json');
const der = require('../data/derived.json');
const { ANALYSIS } = require('../lib/extra');
const S = cbk.series; const M = der.measures;
const errors = []; let n = 0;
const eq = (name, y, got, want, tol) => {
  n += 1;
  if (want === null || got === null) { if (want !== got && !(want === null && got === null)) errors.push(`${name} ${y}: stored ${got}, recomputed ${want}`); return; }
  if (Math.abs(got - want) > tol) errors.push(`${name} ${y}: stored ${got}, recomputed ${want.toFixed(4)}`);
};
const months = (k, y) => Array.from({ length: 12 }, (_, i) => S[k].monthly[`${y}-${String(i + 1).padStart(2, '0')}`]);
const mean = (xs) => (xs.some((v) => typeof v !== 'number') ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
const dec = (k, y) => (S[k].annual_december ? S[k].annual_december[y] : S[k].monthly[`${y}-12`]);
for (let y = 2010; y <= 2025; y += 1) {
  const fx = mean(months('kes_usd_monthly_average', y));
  eq('kes_usd_annual_average', y, M.kes_usd_annual_average.values[y], fx, 0.001);
  const fx0 = mean(months('kes_usd_monthly_average', y - 1));
  if (y > 2010) eq('kes_usd_annual_average_yoy_pct', y, M.kes_usd_annual_average_yoy_pct.values[y], fx0 ? (fx / fx0 - 1) * 100 : null, 0.01);
  const real = months('lending_rate', y).map((v, i) => (typeof v === 'number' && typeof months('inflation_12_month', y)[i] === 'number' ? v - months('inflation_12_month', y)[i] : null));
  eq('real_lending_rate_annual', y, M.real_lending_rate_annual.values[y], mean(real), 0.001);
  eq('public_debt_pct_gdp_december', y, M.public_debt_pct_gdp_december.values[y], (dec('public_debt_total', y) / S.gdp_nominal.annual[y]) * 100, 0.01);
  eq('external_debt_share_pct_december', y, M.external_debt_share_pct_december.values[y], (dec('public_debt_external', y) / dec('public_debt_total', y)) * 100, 0.01);
  if (y > 2010) eq('m3_growth_december_yoy_pct', y, M.m3_growth_december_yoy_pct.values[y], (dec('money_supply_m3', y) / dec('money_supply_m3', y - 1) - 1) * 100, 0.01);
  const rem = mean(months('diaspora_remittances_total', y)); // mean x 12 = sum
  eq('remittances_pct_gdp', y, M.remittances_pct_gdp.values[y], rem === null ? null : ((rem * 12 * 1000 * fx) / (S.gdp_nominal.annual[y] * 1e6)) * 100, 0.001);
}
Object.entries(S.gov_total_revenue.fiscal_year).forEach(([fy, rev]) => {
  if (!(fy in M.interest_pct_total_revenue_fy.values)) return;
  const i = S.gov_domestic_interest.fiscal_year[fy] + S.gov_foreign_interest.fiscal_year[fy];
  eq('interest_pct_total_revenue_fy', fy, M.interest_pct_total_revenue_fy.values[fy], (i / rev) * 100, 0.01);
  eq('interest_pct_tax_revenue_fy', fy, M.interest_pct_tax_revenue_fy.values[fy], (i / S.gov_total_tax_revenue.fiscal_year[fy]) * 100, 0.01);
});
ANALYSIS.forEach((a) => { if (!a.m || !a.m.formula || a.m.derived !== true) errors.push(`${a.key}: shown on the dashboard without a formula or derived flag`); });
if (errors.length) { console.error('Derived measure tests failed:\n- ' + errors.slice(0, 30).join('\n- ')); process.exit(1); }
console.log(`Derived measure tests passed (${n} values recomputed).`);
