#!/usr/bin/env node
// Checks data/siaya-education.json (Siaya education and human development by source and vintage):
// schema; every value has a source, table, page, period and function; pages fall inside the source;
// no duplicate values; devolved/national labels follow the level; published ratios agree with their
// published numerator and denominator (unless listed as a conflict); components sum to printed totals;
// gaps are never filled. Run: node scripts/test-education.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siaya-education.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', 'siaya-education.schema.json'), 'utf8'));
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

// ---- schema (same subset as scripts/validate-data.js) ----
function checkSchema(s, value, where, out) {
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: ${value} is below minimum ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: ${value} is above maximum ${s.maximum}`);
  }
  if (typeof value === 'string') {
    if (s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
    if (s.minLength !== undefined && value.length < s.minLength) out.push(`${where}: shorter than ${s.minLength}`);
  }
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems) out.push(`${where}: needs at least ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => checkSchema(s.items, v, `${where}[${i}]`, out));
  }
  if (kind(value) === 'object') {
    (s.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = s.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') checkSchema(s.additionalProperties, v, `${where}.${k}`, out);
    });
  }
}
const schemaErrors = [];
checkSchema(schema, data, 'siaya-education', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.source_id, s]));
const obs = data.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));

// ---- identity ----
ok(Object.keys(sources).length === data.sources.length, 'two sources share a source_id');
ok(new Set(data.sources.map((s) => s.sha256)).size === data.sources.length, 'two sources point at the same file (sha256)');
ok(Object.keys(byId).length === obs.length, 'duplicate observation id');

// ---- every value: source, table, page, period, function ----
obs.forEach((o) => {
  const s = sources[o.source_id];
  ok(Boolean(s), `${o.id}: unknown source ${o.source_id}`);
  if (!s) return;
  ok(typeof o.table === 'string' && o.table.trim().length >= 3, `${o.id}: table missing`);
  ok(Number.isInteger(o.pdf_page) && o.pdf_page >= 1 && o.pdf_page <= s.pdf_pages, `${o.id}: pdf_page ${o.pdf_page} outside the document (${s.pdf_pages} pages)`);
  ok(s.printed_page_offset === null ? o.printed_page === null : o.printed_page === o.pdf_page - s.printed_page_offset, `${o.id}: printed_page does not follow the source offset`);
  ok(typeof o.period === 'string' && /\d{4}|not stated/.test(o.period), `${o.id}: period missing a year`);
  ok(['devolved', 'national'].includes(o.function), `${o.id}: function missing`);
  ok(typeof o.unit === 'string' && o.unit.length > 0, `${o.id}: unit missing`);
  ok(o.confidence > 2 || (o.note && o.note.length > 20), `${o.id}: confidence ${o.confidence} needs a note`);
  ok(o.value_type !== 'survey_estimate' || o.confidence <= 4, `${o.id}: survey estimates carry sampling error (confidence at most 4)`);
});

// ---- gaps never filled: a missing printed value stays null ----
obs.forEach((o) => {
  if (o.value === null) ok(typeof o.printed_value === 'string' && o.note && /not converted|not available|\.\./i.test(o.note), `${o.id}: null value needs the printed symbol and a note`);
  else ok(typeof o.value === 'number' && Number.isFinite(o.value), `${o.id}: value is not a number`);
  if ('printed_value' in o) ok(o.value === null, `${o.id}: printed_value is only for values not converted to numbers`);
});

// ---- devolved vs national follows the level ----
const levelFunction = { 'pre-primary': 'devolved', vtc: 'devolved', finance: 'devolved', primary: 'national', secondary: 'national', tvet: 'national', attainment: 'national', population: 'national', labour: 'national' };
obs.forEach((o) => {
  if (o.level === 'bursary') ok(/^cdf_/.test(o.indicator) ? o.function === 'national' : /^county_/.test(o.indicator) && o.function === 'devolved', `${o.id}: CDF bursaries are national, county bursaries devolved`);
  else ok(levelFunction[o.level] === o.function, `${o.id}: level ${o.level} must be ${levelFunction[o.level]}`);
  if (/^kcse_/.test(o.indicator)) ok(o.unit === 'candidates' && /aggregate/i.test(o.note || ''), `${o.id}: KCSE only as a published county aggregate`);
  if (o.value_type === 'plan_target' || o.value_type === 'projection') ok(!/^(actual)$/.test(o.value_type), `${o.id}: target or projection labelled actual`);
});

// ---- no duplicates: one value per source, indicator, breakdown, period and table ----
const seen = new Map();
obs.forEach((o) => {
  const key = [o.source_id, o.indicator, o.level, o.sex, o.sector, o.period, o.table].join('|');
  ok(!seen.has(key), `${o.id}: same value recorded twice (${seen.get(key)})`);
  seen.set(key, o.id);
});
// same source and breakdown in two tables: equal values are duplicates; different values must be a listed conflict
const conflictObs = new Set(data.conflicts.flatMap((c) => c.observations));
const loose = new Map();
obs.forEach((o) => {
  const key = [o.source_id, o.indicator, o.level, o.sex, o.sector, o.period].join('|');
  if (loose.has(key)) {
    const other = byId[loose.get(key)];
    ok(other.value !== o.value, `${o.id}: duplicates ${other.id} (same value from another table of the same source)`);
    ok(other.value === o.value || (conflictObs.has(o.id) && conflictObs.has(other.id)), `${o.id} and ${other.id}: same metric, different values, not listed as a conflict`);
  } else loose.set(key, o.id);
});

// ---- conflicts point at real observations ----
data.conflicts.forEach((c) => c.observations.forEach((id) => ok(Boolean(byId[id]), `${c.id}: unknown observation ${id}`)));
ok(new Set(data.conflicts.map((c) => c.id)).size === data.conflicts.length, 'duplicate conflict id');

// ---- ratios agree with their published numerator and denominator ----
const flaggedRatios = new Set(data.conflicts.filter((c) => c.type === 'published_ratio_inconsistent').map((c) => c.observations[0]));
let ratioCount = 0;
obs.filter((o) => o.check).forEach((o) => {
  const n = byId[o.check.numerator];
  const d = byId[o.check.denominator];
  ok(Boolean(n && d), `${o.id}: ratio check names an unknown observation`);
  if (!n || !d) return;
  ok(n.source_id === o.source_id && d.source_id === o.source_id, `${o.id}: numerator and denominator must be published by the same source`);
  ok(n.period === o.period && d.period === o.period, `${o.id}: numerator, denominator and ratio must share a period`);
  const computed = Number(((n.value / d.value) * o.check.scale).toFixed(o.check.decimals));
  const tol = 0.5 * 10 ** -o.check.decimals + 1e-9;
  const agrees = Math.abs(n.value / d.value * o.check.scale - o.value) <= tol;
  ratioCount += 1;
  if (flaggedRatios.has(o.id)) ok(!agrees, `${o.id}: listed as an inconsistent ratio but it agrees (${computed})`);
  else ok(agrees, `${o.id}: printed ${o.value}, but ${n.value} / ${d.value} gives ${computed}`);
});
ok(ratioCount >= 10, `only ${ratioCount} ratio checks ran`);
flaggedRatios.forEach((id) => ok(Boolean(byId[id] && byId[id].check), `${id}: flagged ratio has no check`));

// ---- components sum to the printed total (or 100 for percent distributions) ----
data.sum_checks.forEach((sc) => {
  const parts = sc.parts.map((id) => byId[id]);
  ok(parts.every(Boolean), `${sc.id}: unknown part`);
  if (!parts.every(Boolean)) return;
  const sum = parts.reduce((a, p) => a + p.value, 0);
  const target = sc.total === null ? 100 : (byId[sc.total] || {}).value;
  ok(typeof target === 'number', `${sc.id}: unknown total`);
  ok(Math.abs(sum - target) <= sc.tolerance + 1e-9, `${sc.id}: parts sum to ${Number(sum.toFixed(3))}, printed total ${target}`);
  const src = new Set(parts.map((p) => p.source_id).concat(sc.total ? [byId[sc.total].source_id] : []));
  ok(src.size === 1, `${sc.id}: a sum check must stay inside one source`);
});

// ---- gaps listed ----
ok(data.gaps.length > 0, 'no gaps listed');
data.gaps.forEach((g, i) => ok(g.reason.length > 20, `gap ${i}: reason too short`));

if (errors.length) {
  console.error(`test-education: ${errors.length} problem(s) in ${checks} checks`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-education: ${checks} checks passed (${obs.length} values, ${ratioCount} ratio checks, ${data.sum_checks.length} sum checks, ${data.conflicts.length} conflicts, ${data.gaps.length} gaps)`);
