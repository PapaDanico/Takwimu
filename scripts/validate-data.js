// Fails the build when a figure lacks provenance. Run: npm run validate
const fs = require('fs');
// A third-reading row: its first six amounts are the printed budget and spending (rec, dev, total; rec, dev, total) and the
// last three numbers are the printed absorption rates; each must equal the stored amounts and reproduce the rates (0.5 points).
function rowConsistent(row, text) {
  const n = (text.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((t) => Number(t.replace(/,/g, '')));
  if (n.length < 9) return false;
  const [rb, db, tb, re, de, te] = n.slice(0, 6); const [rp, dp, tp] = n.slice(-3);
  const keys = ['recurrent_budget', 'development_budget', 'approved_budget_total', 'recurrent_expenditure', 'development_expenditure', 'expenditure_total'];
  if (keys.some((k, i) => !row[k] || Math.abs(row[k].value - [rb, db, tb, re, de, te][i]) > 0.01)) return false;
  return Math.abs((re / rb) * 100 - rp) <= 0.5 && Math.abs((de / db) * 100 - dp) <= 0.5 && Math.abs((te / tb) * 100 - tp) <= 0.5;
}
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
    if (!((typeof v.value === 'number' || (typeof v.value === 'string' && v.value.trim())) && v.label && /^https:\/\//.test(v.url))) fail(`conflicts ${c.id} value ${i}: needs a number (or a text value for a label, citation or licence case), a label and an https url`);
    if (typeof v.value === 'string' && !c.values.every((x) => typeof x.value === 'string')) fail(`conflicts ${c.id}: values must be all numbers or all text`);
  });
  if (c.values && c.values.length >= 2 && c.values[0].value === c.values[1].value) fail(`conflicts ${c.id}: the values do not differ`);
});
reg.conflicts.forEach((c) => {
  if (!['resolved_by_source', 'unresolved_no_reviewer', 'reviewed'].includes(c.verification_state)) fail(`conflicts ${c.id}: verification_state missing or unknown`);
  if (c.verification_state === 'reviewed' && !(c.reviewer && c.reviewed_on)) fail(`conflicts ${c.id}: a reviewed case needs reviewer and reviewed_on`);
  if (typeof c.page_image_checked !== 'boolean') fail(`conflicts ${c.id}: page_image_checked must be true or false`);
  // Machine re-readings never stand in for a person viewing the page, and a case they resolve says so.
  if (c.reread && (c.reread.page_image_checked || c.page_image_checked)) fail(`conflicts ${c.id}: a machine re-read cannot set page_image_checked`);
  if (c.reread && c.status === 'resolved' && c.verification_state !== 'resolved_by_source') fail(`conflicts ${c.id}: resolved by re-reading must be resolved_by_source`);
});
// Every conflict flagged in the history file must appear in the register.
const required = ['osr-2023-24', 'osr-2015-16', 'pending-2021', 'pending-2023', 'pending-2024'];
((hist.osr_series && hist.osr_series.points) || []).forEach((pt) => {
  if (pt.alternate && !ids.has(`osr-${pt.fy.replace('/', '-')}`)) fail(`conflicts: OSR alternate for ${pt.fy} has no register entry`);
});
required.forEach((id) => { if (!ids.has(id)) fail(`conflicts: ${id} is missing from the register`); });

// In-year figures: partial-year values must never enter the ten-year series, and their conflicts must be registered.
if (hist.in_year) {
  const iy = hist.in_year;
  if (hist.years.some((y) => y.fy === iy.fy)) fail(`history in_year: ${iy.fy} must not also be a full year in years`);
  iy.conflicts.forEach((id) => { if (!ids.has(id)) fail(`history in_year: conflict ${id} is not in the register`); });
  iy.periods.forEach((p) => {
    const ms = p.figures.map((f) => f.measure);
    if (new Set(ms).size !== ms.length) fail(`history in_year ${p.id}: duplicate measure`);
    p.figures.filter((f) => f.unit === '%').forEach((f) => { if (f.value > 100) fail(`history in_year ${p.id} ${f.measure}: not a percentage`); });
  });
}

// ---- JSON Schema (schemas/*.schema.json) ----
// Minimal hand-written checker for the subset the schemas use: type (incl. integer and type lists), required,
// properties, additionalProperties (false or a schema), items, minItems, enum, minimum, maximum, pattern, local $ref, allOf.
function checkSchema(schema, value, where, root, out) {
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], root);
    if (!target) { out.push(`${where}: unresolved $ref ${schema.$ref}`); return; }
    return checkSchema(target, value, where, root, out);
  }
  if (schema.allOf) schema.allOf.forEach((sub) => checkSchema(sub, value, where, root, out));
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (schema.type) {
    const types = [].concat(schema.type);
    const ok = types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t));
    if (!ok) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (schema.enum && !schema.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${where}: ${value} is below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${where}: ${value} is above maximum ${schema.maximum}`);
  }
  if (typeof value === 'string' && schema.pattern && !new RegExp(schema.pattern).test(value)) out.push(`${where}: "${value.slice(0, 60)}" does not match ${schema.pattern}`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${where}: has ${value.length} items, needs at least ${schema.minItems}`);
    if (schema.items) value.forEach((v, i) => checkSchema(schema.items, v, `${where}[${i}]`, root, out));
  }
  if (kind(value) === 'object') {
    (schema.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = schema.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, root, out);
      else if (schema.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') checkSchema(schema.additionalProperties, v, `${where}.${k}`, root, out);
    });
  }
}
['history', 'conflicts', 'subcounties', 'county', 'national', 'counties-cob', 'cbk', 'derived', 'ngo', 'political', 'source-library', 'siaya-economy', 'siaya-governance', 'siaya-audits', 'siaya-fiscal-ledger', 'siaya-health', 'siaya-education', 'siaya-agriculture', 'siaya-geography', 'siaya-climate', 'siaya-wards-geo', 'siaya-analysis', 'siaya-projects', 'siaya-programmes', 'reviews', 'imf'].forEach((name) => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', `${name}.schema.json`), 'utf8'));
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', `${name}.json`), 'utf8'));
  const out = [];
  checkSchema(schema, data, name, schema, out);
  out.forEach((m) => fail(`schema ${m}`));
});

const manifest0 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'source-manifest.json'), 'utf8'));
// ---- Siaya Source Library (data/source-library.json): rules beyond the schema ----
{
  const lib = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'source-library.json'), 'utf8'));
  const docs = lib.documents || [];
  const ids = new Set(); const urls = new Map();
  // The 27 sources of the research programme register (section 2), IDs kept as published.
  const PROGRAMME = ['GOV-01', 'GOV-02', 'GOV-03', 'GOV-04', 'GOV-05', 'COB-01', 'OAG-01', 'OAG-02', 'KNBS-01', 'KNBS-02', 'KNBS-03', 'IBP-01', 'IBP-02', 'APRM-01', 'CLIM-01', 'CLIM-02', 'HEALTH-01', 'HEALTH-02', 'HEALTH-03', 'HEALTH-04', 'NGO-01', 'NGO-02', 'NGO-03', 'UN-01', 'UN-02', 'UN-03', 'MEDIA-01'];
  docs.forEach((d) => {
    const tag = `source-library ${d.document_id}`;
    if (ids.has(d.document_id)) fail(`${tag}: duplicate document_id`);
    ids.add(d.document_id);
    [d.source_url, ...(d.also_at || [])].forEach((u) => { if (urls.has(u)) fail(`${tag}: address ${u} is already record ${urls.get(u)}`); else urls.set(u, d.document_id); });
    const dl = d.retrieval_status === 'downloaded';
    if (dl !== (typeof d.sha256 === 'string')) fail(`${tag}: sha256 must be present if and only if the document was downloaded`);
    if (dl !== Number.isInteger(d.bytes)) fail(`${tag}: bytes must be present if and only if the document was downloaded`);
    if (dl && !d.file_type) fail(`${tag}: a downloaded document needs its file_type`);
    if (/not stated/i.test(d.licence) && d.redistribution_allowed !== false) fail(`${tag}: licence not stated, so redistribution_allowed must be false`);
    if (d.redistribution_allowed && /not confirmed/i.test(d.licence)) fail(`${tag}: an unconfirmed licence cannot allow redistribution`);
    if (d.redistribution_allowed && !d.redistribution_conditions) fail(`${tag}: say the conditions under which redistribution is allowed`);
    if (!d.retrieval_note.trim()) fail(`${tag}: retrieval_note must say what happened`);
    if (d.origin === 'programme register' && !PROGRAMME.includes(d.document_id)) fail(`${tag}: only the 27 register IDs may have origin "programme register"`);
  });
  docs.forEach((d) => { if (d.parent_id && !ids.has(d.parent_id)) fail(`source-library ${d.document_id}: parent_id ${d.parent_id} is not a record`); });
  PROGRAMME.forEach((id) => { if (!ids.has(id)) fail(`source-library: programme source ${id} is missing`); });
  manifest0.documents.forEach((d) => { if (!ids.has(d.id)) fail(`source-library: manifest document ${d.id} is missing`); });
  // A manifest document keeps the hash recorded when its figures were read.
  manifest0.documents.forEach((d) => { const r = docs.find((x) => x.document_id === d.id); if (r && d.sha256 && r.sha256 !== d.sha256) fail(`source-library ${d.id}: sha256 differs from source-manifest.json`); });
}

// Dataset catalogue (lib/explore.js): status vocabulary, version stamp and files, against schemas/catalogue.schema.json.
{
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'catalogue.schema.json'), 'utf8'));
  const out = [];
  checkSchema(schema, require('../lib/explore').catalogue(), 'catalogue', schema, out);
  out.forEach((m) => fail(`schema ${m}`));
}

// ---- Source manifest: every document history.json cites is listed; hashes are real or explicitly absent ----
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'source-manifest.json'), 'utf8'));
const listed = new Map((manifest.documents || []).map((d) => [d.url, d]));
Object.entries(hist.reports).forEach(([k, r]) => { if (!listed.has(r.url)) fail(`source-manifest: report ${k} (${r.url}) is not listed`); });
hist.audits.points.forEach((a) => { if (!listed.has(a.url)) fail(`source-manifest: audit ${a.fy} (${a.url}) is not listed`); });
if (hist.in_year) hist.in_year.periods.forEach((p) => { if (!listed.has(p.report.url)) fail(`source-manifest: in-year ${p.id} (${p.report.url}) is not listed`); });
if (hist.supplementary) hist.supplementary.documents.forEach((d) => { if (!listed.has(d.url)) fail(`source-manifest: supplementary ${d.id} (${d.url}) is not listed`); });
const mids = new Set();
(manifest.documents || []).forEach((d) => {
  const tag = `source-manifest ${d.id}`;
  if (mids.has(d.id)) fail(`${tag}: duplicate id`);
  mids.add(d.id);
  ['id', 'kind', 'fiscal_year', 'title', 'url', 'retrieved', 'access'].forEach((k) => { if (!d[k]) fail(`${tag}: missing ${k}`); });
  if (!/^https:\/\//.test(d.url || '')) fail(`${tag}: url must be https`);
  if (d.sha256 === null) {
    // Null hash: either the file could not be fetched, or it was fetched from a site that publishes no checksum to verify it against.
    if (!/^unavailable on \d{4}-\d{2}-\d{2}$|^downloaded \d{4}-\d{2}-\d{2}; not hashed: .{10,}$/.test(d.access || '')) fail(`${tag}: a null sha256 needs access "unavailable on <date>" or "downloaded <date>; not hashed: <reason>"`);
  } else {
    if (!/^[0-9a-f]{64}$/.test(d.sha256 || '')) fail(`${tag}: sha256 must be 64 hex characters or null`);
    // The Parliament library publishes an MD5 for each file; other publishers do not, so md5_library is required only there.
    const lib = /libraryir\.parliament\.go\.ke/.test(d.url || '');
    if (d.access !== 'downloaded' || !d.hashed_on || !(d.bytes > 0) || (lib && !/^[0-9a-f]{32}$/.test(d.md5_library || ''))) fail(`${tag}: a hash needs access "downloaded", hashed_on, bytes${lib ? ' and md5_library' : ''}`);
  }
});

// ---- Per-observation provenance: every figure names a manifest document and a page (or says it was not located) ----
const byId = new Map((manifest.documents || []).map((d) => [d.id, d]));
const checkRef = (r, where, url) => {
  if (!r || !r.source_id) return fail(`provenance ${where}: missing source_id`);
  const d = byId.get(r.source_id);
  if (!d) return fail(`provenance ${where}: source_id ${r.source_id} is not in data/source-manifest.json`);
  if (url && d.url !== url) fail(`provenance ${where}: source_id ${r.source_id} is ${d.url}, but the observation cites ${url}`);
  if (r.page === null && r.page_note !== 'not located') fail(`provenance ${where}: page null needs page_note "not located"`);
  if (r.page !== null && !(Number.isInteger(r.page) && r.page >= 1)) fail(`provenance ${where}: page must be a positive integer or null`);
  if (r.printed_page !== undefined && r.page === null) fail(`provenance ${where}: printed_page without a PDF page`);
};
const META = new Set(['fy', 'report', 'caveat', 'field_source', 'derived', 'provenance']);
hist.years.forEach((y) => {
  const pv = y.provenance || {};
  Object.keys(y).filter((k) => !META.has(k)).forEach((k) => {
    const rep = hist.reports[(y.field_source && y.field_source[k]) || y.report];
    checkRef(pv[k], `${y.fy} ${k}`, rep && rep.url);
  });
  Object.keys(pv).forEach((k) => { if (y[k] === undefined) fail(`provenance ${y.fy}: entry for ${k}, which has no value (gaps are never filled)`); });
});
hist.audits.points.forEach((a) => checkRef(a, `audit ${a.fy}`, a.url));
hist.osr_series.points.forEach((p) => { checkRef(p, `osr ${p.fy}`); if (p.alternate) checkRef(p.alternate, `osr ${p.fy} alternate`); });
if (hist.in_year) hist.in_year.periods.forEach((p) => {
  checkRef({ source_id: p.source_id, page: 1 }, `in-year ${p.id}`, p.report.url);
  p.figures.forEach((f) => { if (!Number.isInteger(f.pdf_page)) fail(`provenance in-year ${p.id} ${f.measure}: missing pdf_page`); });
});
if (hist.supplementary) hist.supplementary.documents.forEach((d) => checkRef({ source_id: d.source_id, page: 1 }, `supplementary ${d.id}`, d.url));

// ---- Pending-bills roll-forward: a term is either published (value, document, page) or "not published"; never filled ----
if (hist.pending_rollforward) hist.pending_rollforward.years.forEach((r) => {
  const rep = hist.reports[r.fy];
  if (r.source_id !== null) {
    const d = byId.get(r.source_id);
    if (!d) fail(`rollforward ${r.fy}: source_id ${r.source_id} is not in the manifest`);
    else if (!rep || d.url !== rep.url) fail(`rollforward ${r.fy}: source_id ${r.source_id} is not the year's report`);
  } else if (rep) fail(`rollforward ${r.fy}: the year has a report but no source_id`);
  ['opening', 'new_bills', 'payments', 'adjustments', 'closing'].forEach((k) => {
    const t = r[k];
    const where = `rollforward ${r.fy} ${k}`;
    if (t.status === 'not published') {
      if (t.value !== undefined || t.page !== undefined) fail(`${where}: a "not published" term must have no value or page`);
      return;
    }
    if (typeof t.value !== 'number') return fail(`${where}: needs a value or status "not published"`);
    if (t.source_id !== r.source_id) fail(`${where}: source_id must be the year's report (${r.source_id})`);
    if (!Number.isInteger(t.page)) fail(`${where}: a published term needs its page`);
    if (t.parts) {
      const sum = Object.values(t.parts).reduce((s, v) => s + v, 0);
      if (Math.abs(sum - t.value) > 0.011) fail(`${where}: parts add to ${sum.toFixed(2)}, not ${t.value}`);
    }
  });
});

// ---- 47-county comparison (counties-cob.json): every value has its table and page; sums and rows add up ----
const cob = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'counties-cob.json'), 'utf8'));
const { COUNTIES } = require('../lib/counties');
const AMOUNT_SUMS = ['ordinary_osr_target', 'fif_aia_target', 'total_osr_target', 'ordinary_osr_actual', 'fif_aia_actual', 'total_osr_actual',
  'recurrent_budget', 'development_budget', 'approved_budget_total', 'recurrent_expenditure', 'development_expenditure', 'expenditure_total',
  'pb_exec_recurrent', 'pb_exec_development', 'pb_exec_subtotal', 'pb_assembly_recurrent', 'pb_assembly_development', 'pb_assembly_subtotal', 'pb_grand_total'];
const ROWS = [['recurrent_budget', 'development_budget', 'approved_budget_total'], ['recurrent_expenditure', 'development_expenditure', 'expenditure_total'],
  ['ordinary_osr_target', 'fif_aia_target', 'total_osr_target'], ['ordinary_osr_actual', 'fif_aia_actual', 'total_osr_actual'],
  ['pb_exec_recurrent', 'pb_exec_development', 'pb_exec_subtotal'], ['pb_assembly_recurrent', 'pb_assembly_development', 'pb_assembly_subtotal'], ['pb_exec_subtotal', 'pb_assembly_subtotal', 'pb_grand_total'],
  ['pb_exec_recurrent', 'pb_exec_development', 'pb_assembly_recurrent', 'pb_assembly_development', 'pb_grand_total']];
// Printed percentage against the printed amounts (tolerance covers whole-number rounding in the tables).
const PCTS = [['recurrent_absorption_pct', 'recurrent_expenditure', 'recurrent_budget'], ['development_absorption_pct', 'development_expenditure', 'development_budget'],
  ['overall_absorption_pct', 'expenditure_total', 'approved_budget_total'], ['osr_performance_pct', 'total_osr_actual', 'total_osr_target']];
const cellsOf = (row) => Object.entries(row).filter(([k, v]) => v && typeof v === 'object' && k !== 'derived');
const val = (row, k) => (row[k] && typeof row[k].value === 'number' ? row[k].value : null);
cob.years.forEach((yr) => {
  const tag = `counties-cob ${yr.fy}`;
  const doc = byId.get(yr.source_id);
  if (!doc) fail(`${tag}: source_id ${yr.source_id} is not in data/source-manifest.json`);
  else {
    if (doc.url !== yr.source.library_url) fail(`${tag}: library_url differs from the manifest`);
    if (doc.sha256 !== yr.source.sha256) fail(`${tag}: sha256 differs from the manifest`);
    if (doc.fiscal_year !== yr.fy) fail(`${tag}: manifest document is for ${doc.fiscal_year}`);
  }
  if (yr.counties.length !== 47) fail(`${tag}: expected 47 counties, found ${yr.counties.length}`);
  yr.counties.forEach((c) => {
    const k = COUNTIES.find((x) => x.code === c.code);
    if (!k || k.name !== c.name || k.slug !== c.slug) fail(`${tag}: county ${c.code} ${c.name} does not match lib/counties.js`);
  });
  [...yr.counties, yr.total_row].forEach((row) => {
    const rt = `${tag} ${row.name}`;
    cellsOf(row).forEach(([k, cell]) => {
      if (!Object.values(yr.source.tables).includes(cell.table)) fail(`${rt} ${k}: table "${cell.table}" is not one of the year's tables`);
      if (cell.printed_page !== cell.pdf_page - yr.printed_page_offset) fail(`${rt} ${k}: printed page ${cell.printed_page} is not PDF page ${cell.pdf_page} - ${yr.printed_page_offset}`);
      if (cell.value === null) {
        if (!cell.status || !cell.note) fail(`${rt} ${k}: a null value needs a status and a note (gaps are never filled)`);
        if (cell.status === 'doubtful' && !cell.raw) fail(`${rt} ${k}: a doubtful value must keep its raw OCR reading`);
      } else {
        if (cell.status) fail(`${rt} ${k}: a value with status ${cell.status}`);
        if (!cell.raw) fail(`${rt} ${k}: missing the raw printed reading`);
      }
      // A re-read value is accepted only when both readings agree with it and with the printed amounts (0.5 points).
      if (cell.reread) {
        const r = cell.reread; const digits = (t) => (/^[\d.,]+$/.test(t) ? Number(t.replace(/\D/g, '')) : null);
        const accepted = r.outcome.startsWith('accepted');
        if (accepted !== (cell.value !== null)) fail(`${rt} ${k}: re-read outcome "${r.outcome}" does not match value ${cell.value}`);
        if (accepted) {
          // Two agreeing readings, or a third reading by a different engine whose full printed row reproduces the row's printed percentages.
          const byTwo = digits(r.method_a.reading) === cell.value && digits(r.method_b.reading) === cell.value;
          const byThird = r.method_c && Number(r.method_c.reading) === cell.value && rowConsistent(row, r.method_c.row);
          if (!byTwo && !byThird) fail(`${rt} ${k}: accepted value ${cell.value} is not what both readings give, nor confirmed by a consistent third reading`);
          const pc = PCTS.find(([p]) => p === k);
          if (!pc) fail(`${rt} ${k}: re-read is only defined for percentages`);
          else if (Math.abs((val(row, pc[1]) / val(row, pc[2])) * 100 - cell.value) > 0.5) fail(`${rt} ${k}: accepted re-read ${cell.value} is more than 0.5 points from the printed amounts`);
        }
      }
    });
    // Identities whose parts are not in that year's table are skipped (nothing is computed to stand in for them).
    ROWS.forEach((ids) => {
      const t = ids[ids.length - 1]; const ps = ids.slice(0, -1);
      if (val(row, t) === null || ps.some((k) => row[k] && row[k].status === 'not_in_table')) return;
      // The four-part pending-bills identity is for years whose table prints no subtotals.
      if (ps.length === 4 && !(row.pb_exec_subtotal && row.pb_exec_subtotal.status === 'not_in_table')) return;
      const parts = ps.reduce((sum, k) => sum + (val(row, k) || 0), 0);
      if (Math.abs(parts - val(row, t)) > 0.15) fail(`${rt}: ${ps.join(' + ')} = ${parts.toFixed(2)}, but ${t} is ${val(row, t)}`);
    });
    PCTS.forEach(([p, num0, den0]) => {
      // Own-source revenue performance is printed against ordinary revenue in years whose table has no total.
      const [num, den] = p === 'osr_performance_pct' && val(row, den0) === null ? ['ordinary_osr_actual', 'ordinary_osr_target'] : [num0, den0];
      if (val(row, p) === null || !val(row, den)) return;
      const calc = (val(row, num) / val(row, den)) * 100;
      if (Math.abs(calc - val(row, p)) > 1.5) fail(`${rt}: printed ${p} ${val(row, p)} but the printed amounts give ${calc.toFixed(1)}`);
    });
  });
  Object.keys(yr.total_row).filter((k) => yr.total_row[k] && yr.total_row[k].status === 'not_in_table').forEach((k) => {
    if (yr.counties.some((c) => !c[k] || c[k].status !== 'not_in_table')) fail(`${tag}: ${k} is not in the table for the total but has values for some counties`);
  });
  yr.counties.forEach((c) => cellsOf(c).forEach(([k, cell]) => { if (cell.status === 'not_in_table' && yr.total_row[k].status !== 'not_in_table') fail(`${tag} ${c.name} ${k}: not_in_table must cover the whole column`); }));
  AMOUNT_SUMS.forEach((k) => {
    const t = val(yr.total_row, k);
    if (t === null) return;
    const sum = yr.counties.reduce((s, c) => s + (val(c, k) || 0), 0);
    if (Math.abs(sum - t) > 0.5) fail(`${tag}: ${k} of the 47 counties sums to ${sum.toFixed(2)}, the printed total is ${t}`);
  });
});
// Siaya rows: equal to history.json within rounding, or the difference is in the conflict register.
const siayaCob = (fy) => cob.years.find((y) => y.fy === fy).counties.find((c) => c.slug === 'siaya');
const regHas = (id, v) => reg.conflicts.some((c) => c.id === id && c.values.some((x) => Math.abs(x.value - v) < 1e-9));
[['2024/25', [['approved', 'approved_budget_total', 1000, 'budget-2024-25'], ['recurrent_budget', 'recurrent_budget', 1000], ['development_budget', 'development_budget', 1000],
  ['spent', 'expenditure_total', 1000], ['recurrent_spent', 'recurrent_expenditure', 1000], ['development_spent', 'development_expenditure', 1000],
  ['recurrent_absorption_pct', 'recurrent_absorption_pct', 1, 'recurrent-absorption-2024-25'], ['development_absorption_pct', 'development_absorption_pct', 1], ['osr_m', 'total_osr_actual', 1]]],
['2023/24', [['approved', 'approved_budget_total', 1000], ['recurrent_budget', 'recurrent_budget', 1000], ['development_budget', 'development_budget', 1000],
  ['spent', 'expenditure_total', 1000], ['recurrent_spent', 'recurrent_expenditure', 1000], ['development_spent', 'development_expenditure', 1000],
  ['recurrent_absorption_pct', 'recurrent_absorption_pct', 1, 'recurrent-absorption-2023-24'], ['development_absorption_pct', 'development_absorption_pct', 1, 'development-absorption-2023-24'],
  ['osr_m', 'total_osr_actual', 1], ['osr_target_m', 'total_osr_target', 1]]],
...['2022/23', '2021/22'].map((fy) => [fy, [['approved', 'approved_budget_total', 1000], ['recurrent_budget', 'recurrent_budget', 1000], ['development_budget', 'development_budget', 1000],
  ['spent', 'expenditure_total', 1000], ['recurrent_spent', 'recurrent_expenditure', 1000], ['development_spent', 'development_expenditure', 1000],
  ['recurrent_absorption_pct', 'recurrent_absorption_pct', 1], ['development_absorption_pct', 'development_absorption_pct', 1],
  // FY 2022/23 Table 2.2 prints ordinary revenue (FIF excluded); FY 2021/22 prints one undivided figure.
  ['osr_m', fy === '2022/23' ? 'ordinary_osr_actual' : 'total_osr_actual', 1], ['osr_target_m', fy === '2022/23' ? 'ordinary_osr_target' : 'total_osr_target', 1]]])].forEach(([fy, pairs]) => {
  const h = hist.years.find((y) => y.fy === fy);
  const s = siayaCob(fy);
  pairs.forEach(([hk, ck, div, caseId]) => {
    const a = h[hk]; const b = val(s, ck) / div;
    // Same value when the table figure rounds to the history figure at its own precision.
    const dec = (String(a).split('.')[1] || '').length;
    if (Number(b.toFixed(dec)) === a || Math.abs(a - b) < 1e-9) return;
    if (!caseId) return fail(`counties-cob ${fy} Siaya ${ck} ${val(s, ck)} differs from history.json ${hk} ${a} and no conflict case is named`);
    if (!regHas(caseId, a) || !regHas(caseId, Number((val(s, ck) / div).toFixed(5)))) fail(`counties-cob ${fy} Siaya ${ck}: conflict ${caseId} must list both ${a} and ${b}`);
  });
});
if (!regHas('pending-close-2025', val(siayaCob('2024/25'), 'pb_grand_total'))) fail('counties-cob 2024/25 Siaya pending bills (Table 2.9) must be listed in conflict pending-close-2025');
if (!regHas('pending-2024', Number(val(siayaCob('2023/24'), 'pb_grand_total').toFixed(2)))) fail('counties-cob 2023/24 Siaya pending bills (Table 2.5) must be listed in conflict pending-2024');
if (!regHas('pending-2023', Number(val(siayaCob('2022/23'), 'pb_grand_total').toFixed(2)))) fail('counties-cob 2022/23 Siaya pending bills (Table 2.6) must be listed in conflict pending-2023');
if (!regHas('pending-close-2022', Number(val(siayaCob('2021/22'), 'pb_grand_total').toFixed(2)))) fail('counties-cob 2021/22 Siaya pending bills (Table 2.6) must be listed in conflict pending-close-2022');
if (!regHas('budget-financing-osr-2024-25', val(siayaCob('2024/25'), 'total_osr_target'))) fail('counties-cob 2024/25 Siaya own-source revenue target (Table 2.1) must be listed in conflict budget-financing-osr-2024-25');

// ---- National indicators (national.json): the API source is in the manifest; missing years are listed, never filled ----
const nat = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'national.json'), 'utf8'));
if (!byId.has(nat.meta.source_id)) fail(`national: source_id ${nat.meta.source_id} is not in the manifest`);
const natCodes = new Set();
nat.indicators.forEach((x) => {
  const tag = `national ${x.code}`;
  if (natCodes.has(x.code)) fail(`${tag}: duplicate code`);
  natCodes.add(x.code);
  if (!byId.has(x.source_id)) fail(`${tag}: source_id ${x.source_id} is not in the manifest`);
  if (!x.api_url.includes(`/indicator/${x.code}?`)) fail(`${tag}: api_url does not name the indicator`);
  const years = x.series.map((p) => p.year);
  years.forEach((y, i) => { if (i && y !== years[i - 1] + 1) fail(`${tag}: years must run one by one (${years[i - 1]} then ${y})`); });
  const nulls = x.series.filter((p) => p.value === null).map((p) => p.year);
  const listed = new Set(x.missing_years);
  nulls.forEach((y) => { if (!listed.has(y)) fail(`${tag}: ${y} has no value but is not in missing_years`); });
  x.missing_years.forEach((y) => { const p = x.series.find((q) => q.year === y); if (p && p.value !== null) fail(`${tag}: ${y} is listed as missing but has a value`); });
  x.series.forEach((p) => { if (p.value !== null && !Number.isFinite(p.value)) fail(`${tag} ${p.year}: not a finite number`); });
  if (/%/.test(x.unit) && !/change|gross|negative/.test(x.unit)) x.series.forEach((p) => { if (p.value !== null && (p.value < 0 || p.value > 100)) fail(`${tag} ${p.year}: ${p.value} is not a percentage`); });
});

// ---- CBK, derived, CRA/IBP and IEBC files: every source is in the manifest with the same hash; totals add up ----
const extraFile = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const xcbk = extraFile('cbk.json'); const xder = extraFile('derived.json'); const xngo = extraFile('ngo.json'); const xpol = extraFile('political.json');
const srcCheck = (o, where) => {
  if (Array.isArray(o)) return o.forEach((x, i) => srcCheck(x, `${where}[${i}]`));
  if (!o || typeof o !== 'object') return;
  if (o.url && o.sha256) {
    const d = byId.get(o.source_id);
    if (!d) fail(`${where}: source ${o.url} has no source_id in the manifest`);
    else if (d.sha256 !== o.sha256 || d.url !== o.url) fail(`${where}: source ${o.source_id} differs from the manifest (url or sha256)`);
  }
  Object.entries(o).forEach(([k, v]) => { if (v && typeof v === 'object') srcCheck(v, `${where}.${k}`); });
};
srcCheck(xcbk, 'cbk'); srcCheck(xngo, 'ngo'); srcCheck(xpol, 'political');
{
  const S = xcbk.series; const m = (k) => S[k].monthly;
  Object.keys(m('public_debt_total')).forEach((ym) => {
    const d = m('public_debt_domestic')[ym]; const e = m('public_debt_external')[ym]; const t = m('public_debt_total')[ym];
    if ([d, e, t].every((v) => typeof v === 'number') && Math.abs(d + e - t) > 1) fail(`cbk public debt ${ym}: domestic + external = ${(d + e).toFixed(1)}, total ${t}`);
  });
  Object.entries(S).forEach(([k, s]) => {
    const obj = s.monthly || s.monthly_cumulative;
    if (!obj) return;
    const keys = Object.keys(obj);
    keys.forEach((ym, i) => { if (i && !/^\d{4}-\d{2}$/.test(ym)) fail(`cbk ${k}: bad month ${ym}`); });
    const nulls = keys.filter((ym) => obj[ym] === null);
    const listed = (xcbk.gaps.null_cells[k] || []);
    nulls.forEach((ym) => { if (!listed.includes(ym)) fail(`cbk ${k} ${ym}: null but not listed in gaps.null_cells`); });
    if (s.fiscal_year && s.monthly_cumulative) Object.entries(s.fiscal_year).forEach(([fy, v]) => { const june = s.monthly_cumulative[`${Number(fy.slice(0, 4)) + 1}-06`]; if (june !== undefined && june !== v) fail(`cbk ${k} FY ${fy}: ${v} is not the June cumulative ${june}`); });
  });
}
Object.entries(xder.measures).forEach(([k, d]) => { if (d.derived !== true || !d.formula || !(d.inputs || []).length) fail(`derived ${k}: needs derived: true, a formula and its inputs`); });
if (Object.keys(xder.measures).some((k) => /2017/.test(k))) fail('derived: the annulled August 2017 election must not be used');
{
  const ca = xngo.cra.county_allocations_fy2026_27;
  const names = ca.rows.map((r) => r.county.toLowerCase().replace(/[^a-z]/g, ''));
  COUNTIES.forEach((c) => { if (!names.includes(c.name.toLowerCase().replace(/[^a-z]/g, ''))) fail(`ngo CRA: ${c.name} missing`); });
  ca.rows.forEach((r) => { if (Math.abs(r.baseline_2026_27 + r.fourth_basis_allocation_2026_27 - r.total_allocation_2026_27) > 1) fail(`ngo CRA ${r.county}: baseline + Fourth Basis is not the total`); });
  const tot = ca.rows.reduce((t, r) => t + r.total_allocation_2026_27, 0);
  const pub = ca.checks.column_sums_vs_published_total.find((x) => x.column === 'total_allocation_2026_27').published_total;
  if (Math.abs(tot - pub) > 0.5) fail(`ngo CRA: 47 totals add to ${tot}, published ${pub}`);
  Object.entries(xngo.cra.equalisation_fund_fy2013_14_to_2026_27.rows).forEach(([fy, r]) => { if (r.equalisation_fund_ksh_bn !== null && Math.abs(r.audited_accounts_revenue_ksh_bn * 0.005 - r.equalisation_fund_ksh_bn) > 0.06) fail(`ngo Equalisation Fund ${fy}: not 0.5 per cent of audited revenue`); });
  if (!/International Budget Partnership/.test(xngo.ibp_open_budget_survey_kenya.source.citation_requested)) fail('ngo IBP: the requested citation must be kept');
}
{
  const v = xpol.iebc_registered_voters_2022_by_constituency;
  const sum = v.rows.reduce((t, r) => t + r.registered_voters, 0);
  if (v.rows.length !== 290 || sum !== v.checks.published_total) fail(`political: ${v.rows.length} constituencies add to ${sum}, published ${v.checks.published_total}`);
  v.county_totals_summed_from_constituencies.forEach((c) => { const s2 = v.rows.filter((r) => r.county_code === c.county_code).reduce((t, r) => t + r.registered_voters, 0); if (s2 !== c.registered_voters) fail(`political ${c.county}: county total ${c.registered_voters} is not the sum ${s2}`); });
  if (new Set(v.rows.map((r) => r.county_code)).size !== 47) fail('political: constituencies must cover 47 counties');
  const cr = xpol.iebc_candidates_2022_by_position.rows; const ct = cr.find((r) => r.position === 'Total');
  ['party_sponsored', 'independent', 'total'].forEach((k) => { const s2 = cr.filter((r) => r !== ct).reduce((t, r) => t + r[k], 0); if (s2 !== ct[k]) fail(`political candidates ${k}: rows add to ${s2}, total ${ct[k]}`); });
  cr.forEach((r) => { if (r.party_sponsored + r.independent !== r.total && !(regHas('candidates-2022-woman-member', r.total) && r.total - r.party_sponsored - r.independent === 1)) fail(`political candidates ${r.position}: parts do not add up and the difference is not in the register`); });
  if (xpol.iebc_presidential_2017_aug_form34c_totals) fail('political: the annulled August 2017 results are left out by rule');
  if (!regHas('registered-voters-2022', v.checks.published_total) || !regHas('registered-voters-2022', 22120458)) fail('political: registered-voters-2022 must list both totals');
}
{
  const dep = xder.side_by_side_conflicts.deposit_rate_annual.rows['2024'];
  if (!regHas('deposit-rate-cbk-wdi', dep.a) || !regHas('deposit-rate-cbk-wdi', Number(dep.b.toFixed(2)))) fail('derived: deposit-rate-cbk-wdi must list the CBK and World Bank 2024 values');
}

if (errors.length) {
  console.error('Data validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Data validation passed.');
