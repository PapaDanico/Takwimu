// Fails the build when a figure lacks provenance. Run: npm run validate
const fs = require('fs');
const path = require('path');
const errors = [];
const fail = (m) => errors.push(m);

const siaya = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya.json'), 'utf8'));
const osr = siaya.own_source_revenue;
if (!osr.observations || osr.observations.length < 1) fail('siaya: no OSR observations');
(osr.observations || []).forEach((o, i) => {
  ['value', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (o[k] === undefined || o[k] === '') fail(`siaya OSR observation ${i}: missing ${k}`);
  });
  if (typeof o.value !== 'number' || o.value <= 0) fail(`siaya OSR observation ${i}: value must be a positive number`);
  if (!(o.confidence >= 1 && o.confidence <= 5)) fail(`siaya OSR observation ${i}: confidence must be 1-5`);
  if (o.source_url && !/^https:\/\//.test(o.source_url)) fail(`siaya OSR observation ${i}: source_url must be https`);
});
if (!Array.isArray(siaya.sub_counties) || siaya.sub_counties.length !== 6) fail('siaya: expected 6 sub-counties');

if (osr.previous_year) {
  ['fiscal_year', 'value', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (osr.previous_year[k] === undefined || osr.previous_year[k] === '') fail(`siaya OSR previous_year: missing ${k}`);
  });
  const growth = ((osr.observations[0].value / osr.previous_year.value) - 1) * 100;
  if (growth < 0 || growth > 5) fail(`siaya OSR: growth over previous year is ${growth.toFixed(1)}%, expected about 2% per the Controller of Budget report`);
}
if (osr.trend) {
  const pts = osr.trend.points || [];
  if (pts.length < 2) fail('siaya OSR trend: needs at least 2 points');
  if (!osr.trend.caveat) fail('siaya OSR trend: missing caveat about comparability');
  pts.forEach((p, i) => {
    ['fiscal_year', 'value', 'source', 'source_url', 'confidence'].forEach((k) => {
      if (p[k] === undefined || p[k] === '') fail(`siaya OSR trend point ${i}: missing ${k}`);
    });
    if (!(p.value > 0)) fail(`siaya OSR trend point ${i}: value must be positive`);
    if (p.components && Math.abs(p.components.reduce((s, v) => s + v, 0) - p.value) > 0.02) fail(`siaya OSR trend point ${i}: components do not sum to value`);
    if (i > 0 && p.fiscal_year <= pts[i - 1].fiscal_year) fail(`siaya OSR trend point ${i}: years must increase`);
  });
  const last = pts[pts.length - 1];
  if (last && last.value !== osr.observations[0].value) fail('siaya OSR trend: last point must equal the headline observation');
}
if (osr.share_of_annual_target_pct !== undefined && !(osr.share_of_annual_target_pct > 0 && osr.share_of_annual_target_pct <= 100)) fail('siaya OSR: share_of_annual_target_pct must be between 0 and 100');
if (osr.target) {
  ['value', 'description', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (osr.target[k] === undefined || osr.target[k] === '') fail(`siaya OSR target: missing ${k}`);
  });
}

const budget = siaya.budget;
if (!budget) fail('siaya: missing budget block');
else {
  ['fiscal_year', 'source', 'source_url', 'retrieved', 'confidence', 'status', 'approved_total', 'total_spent'].forEach((k) => {
    if (budget[k] === undefined || budget[k] === '') fail(`siaya budget: missing ${k}`);
  });
  (budget.categories || []).forEach((c, i) => {
    if (!(c.budget > 0) || !(c.spent >= 0) || c.spent > c.budget) fail(`siaya budget category ${i}: spent must be between 0 and budget`);
    const pct = Math.round((c.spent / c.budget) * 100);
    if (Math.abs(pct - c.absorption_pct) > 1) fail(`siaya budget category ${i}: absorption_pct ${c.absorption_pct} does not match spent/budget (${pct})`);
  });
  const sp = budget.stalled_projects;
  if (sp && (!(sp.count > 0) || !(sp.estimated_value_million > 0) || sp.paid_million > sp.estimated_value_million)) fail('siaya budget: stalled_projects needs count, value, and paid not above value');
  const budgetSum = (budget.categories || []).reduce((sum, c) => sum + c.budget, 0);
  if (Math.abs(budgetSum - budget.approved_total) > 0.02) fail(`siaya budget: category budgets ${budgetSum.toFixed(2)} do not sum to approved_total ${budget.approved_total}`);
  const spentSum = (budget.categories || []).reduce((s, c) => s + c.spent, 0);
  if (Math.abs(spentSum - budget.total_spent) > 0.05) fail(`siaya budget: category spending ${spentSum.toFixed(2)} does not sum to total_spent ${budget.total_spent}`);
}

const audit = siaya.audit;
if (!audit) fail('siaya: missing audit block');
else {
  ['fiscal_year', 'entity', 'opinion', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (audit[k] === undefined || audit[k] === '') fail(`siaya audit: missing ${k}`);
  });
  if (!['Unqualified', 'Qualified', 'Adverse', 'Disclaimer'].includes(audit.opinion)) fail('siaya audit: opinion must be Unqualified, Qualified, Adverse or Disclaimer');
  (audit.findings || []).forEach((f, i) => {
    if (!f.label || typeof f.amount_kes !== 'number' || f.amount_kes <= 0) fail(`siaya audit finding ${i}: needs label and positive amount_kes`);
  });
}

if (errors.length) {
  console.error('Data validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Data validation passed.');
