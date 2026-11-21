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

// ---- sub-counties and county profile ----
const sc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'subcounties.json'), 'utf8'));
const co = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'county.json'), 'utf8'));
['source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
  if (!sc[k]) fail(`subcounties: missing ${k}`);
  if (!co[k]) fail(`county: missing ${k}`);
});
const subs = sc.sub_counties || [];
if (subs.length !== 6) fail('subcounties: expected 6 sub-counties');
const total = (f) => subs.reduce((sum, x) => sum + f(x), 0);
const expectEq = (label, got, want) => { if (got !== want) fail(`${label}: sums to ${got}, expected ${want}`); };
expectEq('subcounties population 2019', total((x) => x.population['2019']), co.population.census_2019);
expectEq('subcounties population 2022', total((x) => x.population['2022']), co.population.projection_2022);
expectEq('subcounties wards', total((x) => x.wards), 30);
expectEq('subcounties villages', total((x) => x.villages), 98);
expectEq('subcounties hospitals', total((x) => x.facilities.hospitals), 10);
expectEq('subcounties maternity beds', total((x) => x.facilities.maternity_beds), 196);
expectEq('subcounties youth friendly centres', total((x) => x.facilities.youth_friendly_centres), 7);
expectEq('subcounties eligible voters', total((x) => x.eligible_voters_2022), 533595);
subs.forEach((x) => {
  ['2019', '2022'].forEach((y) => {
    const calc = x.population[y] / x.area_km2;
    if (Math.abs(calc - x.density_per_km2[y]) > 1.5) fail(`${x.name}: density ${y} is ${x.density_per_km2[y]}, population over area gives ${calc.toFixed(1)}`);
  });
  if (!(x.population['2027'] > x.population['2025'] && x.population['2025'] > x.population['2022'] && x.population['2022'] > x.population['2019'])) fail(`${x.name}: population projections must increase`);
});
expectEq('county sex split 2019', co.population.male_2019 + co.population.female_2019 + co.population.intersex_2019, co.population.census_2019);
expectEq('county urban centres', co.population.urban_centres.reduce((a, b) => a + b.population, 0), co.population.urban_2022);
const pctOk = (label, v) => { if (!(v >= 0 && v <= 100)) fail(`county ${label}: ${v} is not a percentage`); };
['monetary_poverty_pct', 'multidimensional_poverty_pct'].forEach((k) => { pctOk(k + ' siaya', co.poverty_2020[k].siaya); pctOk(k + ' kenya', co.poverty_2020[k].kenya); });
['hiv_prevalence_pct', 'antenatal_4th_visit_pct', 'facility_deliveries_pct', 'contraceptive_use_women_15_49_pct', 'full_immunisation_coverage_pct'].forEach((k) => { pctOk(k + ' siaya', co.health_2022[k].siaya); pctOk(k + ' kenya', co.health_2022[k].kenya); });

// Ten-year history: every year must trace to a report, budget parts must add up, absorption must match the arithmetic.
const hist = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'history.json'), 'utf8'));
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const seen = new Set();
hist.years.forEach((y) => {
  const tag = `history ${y.fy}`;
  if (seen.has(y.fy)) fail(`${tag}: duplicate year`);
  seen.add(y.fy);
  if (!hist.reports[y.report]) fail(`${tag}: report ${y.report} is not in the reports list`);
  if (y.approved !== undefined) {
    if (!near(y.recurrent_budget + y.development_budget, y.approved, 0.02)) fail(`${tag}: budget parts ${y.recurrent_budget} + ${y.development_budget} do not add to ${y.approved}`);
    if (!near(y.recurrent_spent + y.development_spent, y.spent, 0.02)) fail(`${tag}: spending parts do not add to ${y.spent}`);
    const dev = (y.development_spent / y.development_budget) * 100;
    if (y.development_absorption_pct !== undefined && !near(dev, y.development_absorption_pct, 1.5)) fail(`${tag}: development absorption ${y.development_absorption_pct} but arithmetic gives ${dev.toFixed(1)}`);
    const rec = (y.recurrent_spent / y.recurrent_budget) * 100;
    if (y.recurrent_absorption_pct !== undefined && !near(rec, y.recurrent_absorption_pct, 1.5) && !y.caveat) fail(`${tag}: recurrent absorption ${y.recurrent_absorption_pct} but arithmetic gives ${rec.toFixed(1)}`);
  }
  if (y.osr_m !== undefined && y.osr_target_m !== undefined && y.osr_m > y.osr_target_m * 1.2) fail(`${tag}: own-source revenue is far above its target`);
});
hist.osr_series.points.forEach((p) => { if (!(p.value > 0) || !p.report) fail(`history OSR ${p.fy}: needs a positive value and a report`); });
if (hist.osr_series.points.length < 10) fail('history: own-source revenue series is shorter than ten years');
hist.audits.points.forEach((a) => {
  if (!['Unqualified', 'Qualified', 'Adverse', 'Disclaimer'].includes(a.opinion)) fail(`history audit ${a.fy}: unknown opinion ${a.opinion}`);
  if (!/^https:\/\//.test(a.url)) fail(`history audit ${a.fy}: missing source url`);
});
const p09 = hist.population.by_sub_county_2009.values;
expectEq('history 2009 sub-counties add to the county census', Object.values(p09).reduce((a, b) => a + b, 0), hist.population.points.find((p) => p.year === 2009).value);
subs.forEach((x) => { if (p09[x.id] === undefined) fail(`history: no 2009 population for ${x.id}`); });
expectEq('history 2019 point matches county census', hist.population.points.find((p) => p.year === 2019).value, co.population.census_2019);
Object.entries(hist.reports).forEach(([k, r]) => { if (!/^https:\/\//.test(r.url)) fail(`history report ${k}: missing https url`); });

// Source conflict register: every conflict needs two sourced values, a status, a labelled explanation and an effect.
const reg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'conflicts.json'), 'utf8'));
const ids = new Set();
reg.conflicts.forEach((c) => {
  if (ids.has(c.id)) fail(`conflicts: duplicate id ${c.id}`);
  ids.add(c.id);
  ['measure', 'unit', 'definitions', 'hypothesis', 'status', 'effect'].forEach((k) => { if (!c[k]) fail(`conflicts ${c.id}: missing ${k}`); });
  if (!['open', 'resolved'].includes(c.status)) fail(`conflicts ${c.id}: status must be open or resolved`);
  if (!Array.isArray(c.values) || c.values.length < 2) fail(`conflicts ${c.id}: needs at least two values`);
  (c.values || []).forEach((v, i) => {
    if (!(typeof v.value === 'number' && v.label && /^https:\/\//.test(v.url))) fail(`conflicts ${c.id} value ${i}: needs a number, a label and an https url`);
  });
  if (c.values && c.values.length >= 2 && c.values[0].value === c.values[1].value) fail(`conflicts ${c.id}: the values do not differ`);
});
reg.conflicts.forEach((c) => {
  if (!['resolved_by_source', 'unresolved_no_reviewer', 'reviewed'].includes(c.verification_state)) fail(`conflicts ${c.id}: verification_state missing or unknown`);
  if (c.verification_state === 'reviewed' && !(c.reviewer && c.reviewed_on)) fail(`conflicts ${c.id}: a reviewed case needs reviewer and reviewed_on`);
  if (typeof c.page_image_checked !== 'boolean') fail(`conflicts ${c.id}: page_image_checked must be true or false`);
});
// Every conflict flagged in the history file must appear in the register.
const required = ['osr-2023-24', 'osr-2015-16', 'pending-2021', 'pending-2023', 'pending-2024'];
((hist.osr_series && hist.osr_series.points) || []).forEach((pt) => {
  if (pt.alternate && !ids.has(`osr-${pt.fy.replace('/', '-')}`)) fail(`conflicts: OSR alternate for ${pt.fy} has no register entry`);
});
required.forEach((id) => { if (!ids.has(id)) fail(`conflicts: ${id} is missing from the register`); });

if (errors.length) {
  console.error('Data validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Data validation passed.');
