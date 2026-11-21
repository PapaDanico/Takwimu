#!/usr/bin/env node
// Checks data/siaya-climate.json (Siaya climate, water and resilience evidence by source):
// schema; every value has source, page, period, unit and kind; allocation, receipt, transfer and expenditure are never
// mixed in one series; hazard entries carry the hazard and the ranking as printed (or say none is printed); ward
// names match the ward register or carry a spelling note; no duplicates; comparisons and FLLoCA sums are consistent.
// Run: node scripts/test-climate.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-climate.json');
const schema = read('schemas/siaya-climate.schema.json');
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

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
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
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
checkSchema(schema, data, 'siaya-climate', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
const obs = data.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
ok(Object.keys(sources).length === data.sources.length, 'duplicate source id');
ok(new Set(data.sources.map((s) => s.sha256)).size === data.sources.length, 'two sources share one sha256');
ok(Object.keys(byId).length === obs.length, 'duplicate observation id');

// ---- ward register ----
const reg = data.ward_register;
const wardNames = new Set(reg.wards.map((w) => w.name));
ok(reg.wards.length === 30 && wardNames.size === 30, 'ward register must list 30 distinct wards');
ok(Boolean(sources[reg.source_id]), `ward register: unknown source ${reg.source_id}`);
const perSub = reg.wards.reduce((m, w) => ({ ...m, [w.sub_county]: (m[w.sub_county] || 0) + 1 }), {});
const expectSub = { 'Alego Usonga': 6, Gem: 6, Ugenya: 4, Ugunja: 3, Bondo: 6, Rarieda: 5 };
Object.entries(expectSub).forEach(([s, n]) => ok(perSub[s] === n, `ward register: ${s} has ${perSub[s]} wards, expected ${n}`));

// ---- every value: source + page + period + unit + kind ----
const numericKinds = new Set(['allocation', 'receipt', 'transfer', 'expenditure', 'outcome', 'coverage']);
obs.forEach((o) => {
  const s = sources[o.source_id];
  ok(Boolean(s), `${o.id}: unknown source ${o.source_id}`);
  if (!s) return;
  ok(Number.isInteger(o.pdf_page) && o.pdf_page >= 1 && o.pdf_page <= s.pdf_pages, `${o.id}: pdf_page outside ${s.id} (1-${s.pdf_pages})`);
  ok(o.printed_page === null || (Number.isInteger(o.printed_page) && o.printed_page <= o.pdf_page), `${o.id}: printed_page after pdf_page`);
  ok(filled(o.period), `${o.id}: period missing`);
  ok(filled(o.kind), `${o.id}: kind missing`);
  ok(filled(o.table) && filled(o.quote) && filled(o.definition) && filled(o.measure), `${o.id}: table, quote, definition or measure missing`);
  ok(o.confidence >= 4 || filled(o.note) || /not (stated|clear|defined)|ambiguous|perception|narrative|no scoring/i.test(o.definition), `${o.id}: confidence below 4 needs a note or a stated reason`);
  if (numericKinds.has(o.kind)) {
    ok(typeof o.value === 'number' && Number.isFinite(o.value), `${o.id}: ${o.kind} needs a numeric value (gaps go in gaps[], never 0 or null)`);
    ok(filled(o.unit), `${o.id}: unit missing`);
    ok(o.hazard === null && o.rank_as_printed === null, `${o.id}: hazard fields set on a ${o.kind} value`);
  } else {
    ok(o.value === null && o.unit === null, `${o.id}: hazard entries carry no number (rank goes in rank_as_printed)`);
    ok(filled(o.hazard) && filled(o.rank_as_printed), `${o.id}: hazard or rank_as_printed missing`);
    ok(filled(o.hotspots_as_printed), `${o.id}: hotspots_as_printed missing (write "none printed")`);
  }
  if (['allocation', 'receipt', 'transfer', 'expenditure'].includes(o.kind)) ok(/^KSh/.test(o.unit), `${o.id}: money value without a KSh unit`);
  if (o.kind === 'coverage') ok(filled(o.definition) && !/^KSh/.test(o.unit), `${o.id}: coverage needs a definition and a non-money unit`);
  if (o.unit && /percent/.test(o.unit)) ok(o.value >= 0 && o.value <= 100, `${o.id}: percent outside 0-100`);
});

// ---- allocation / receipt / transfer / expenditure never mixed in one series; one unit per series ----
const series = {};
obs.forEach((o) => { (series[o.series] = series[o.series] || []).push(o); });
Object.entries(series).forEach(([id, list]) => {
  const kinds = new Set(list.map((o) => o.kind));
  const units = new Set(list.map((o) => o.unit));
  ok(kinds.size === 1, `series ${id} mixes kinds: ${[...kinds].join(', ')}`);
  ok(units.size === 1, `series ${id} mixes units: ${[...units].join(', ')}`);
  ok(new Set(list.map((o) => o.source_id)).size === 1 || kinds.has('hazard ranking') === false, `series ${id}: hazard lists from several sources`);
  const k = [...kinds][0];
  if (k === 'allocation') ok(!/expenditure|receipt|spend/.test(id), `series ${id}: allocation series named like spending`);
  if (k === 'expenditure') ok(!/allocation|budget/.test(id), `series ${id}: expenditure series named like an allocation`);
  if (['receipt', 'transfer'].includes(k)) ok(!/allocation|expenditure/.test(id), `series ${id}: ${k} series named like allocation or expenditure`);
  // one period per series entry
  const periods = list.map((o) => `${o.period}|${o.area_as_printed}|${o.measure}|${o.hazard}`);
  ok(new Set(periods).size === periods.length, `series ${id}: two values for one period and area`);
});
obs.forEach((o) => {
  if (o.kind === 'allocation') ok(!/actual|receipt|expenditure|disburse|spent/i.test(o.measure), `${o.id}: allocation measure reads like money received or spent`);
  if (o.kind === 'expenditure') ok(!/budget|allocation|estimate|target/i.test(o.measure), `${o.id}: expenditure measure reads like an allocation`);
  ok(o.kind === 'outcome' || !/outcome|resilience improved/i.test(o.measure), `${o.id}: ${o.kind} value labelled as an outcome`);
});

// ---- hazards: ward names match the register or carry a spelling note ----
obs.filter((o) => o.kind === 'hazard ranking').forEach((o) => {
  ok(!/^\d+$/.test(o.rank_as_printed) || filled(o.note), `${o.id}: bare numeric rank without context`);
  if (o.series.startsWith('pcra-ward-')) {
    ok(o.geography === 'ward', `${o.id}: ward hazard not at ward level`);
    ok(wardNames.has(o.ward_register_name), `${o.id}: ward ${o.ward_register_name} not in the register`);
    const printed = o.area_as_printed.replace(/ WARD$/, '').toLowerCase();
    const regName = (o.ward_register_name || '').toLowerCase();
    const asPrintedInCidp = (reg.wards.find((w) => w.name === o.ward_register_name) || {}).as_printed || '';
    ok(printed === regName || filled(o.spelling_note) || printed === asPrintedInCidp.toLowerCase(), `${o.id}: printed ward '${o.area_as_printed}' differs from register '${o.ward_register_name}' without a spelling note`);
    if (asPrintedInCidp && asPrintedInCidp !== o.ward_register_name) ok(filled(o.spelling_note), `${o.id}: CIDP prints '${asPrintedInCidp}', spelling note needed`);
  }
  if (/Sigomre/.test(o.area_as_printed)) ok(filled(o.spelling_note), `${o.id}: 'Sigomre' needs a spelling note`);
});

// ---- no duplicates ----
const keyOf = (o) => [o.measure, o.period, o.source_id, o.area_as_printed, o.hazard, o.kind].join('|');
const seen = new Map();
obs.forEach((o) => {
  const k = keyOf(o);
  ok(!seen.has(k), `${o.id}: duplicate of ${seen.get(k)}`);
  seen.set(k, o.id);
});

// ---- comparisons point at real values ----
data.comparisons.forEach((c) => c.observation_ids.forEach((id) => ok(Boolean(byId[id]), `comparison ${c.id}: unknown observation ${id}`)));

// ---- FLLoCA FY 2025/26: the report's own figures reconcile (checked within each kind, never across) ----
const v = (id) => (byId[id] ? byId[id].value : NaN);
ok(v('q4-flloca-development-target-2025-26') + v('q4-flloca-recurrent-target-2025-26') + v('q4-flloca-grant-2025-26-target-2025-26') === v('q4-flloca-fund-budget-2025-26'),
  'FLLoCA FY 2025/26: three revenue targets do not add to the fund allocation');
ok(v('q4-flloca-development-receipt-2025-26') + v('q4-flloca-recurrent-receipt-2025-26') + v('q4-flloca-grant-2025-26-receipt-2025-26') === v('q4-flloca-fund-disbursed-2025-26'),
  'FLLoCA FY 2025/26: three receipts do not add to the fund disbursement');
['q4-flloca-fund-budget-2025-26', 'q4-flloca-fund-disbursed-2025-26'].forEach((id) => ok(Boolean(byId[id]), `${id} missing`));
// receipts never exceed their own allocation line
obs.filter((o) => o.kind === 'receipt' && o.id.startsWith('q4-')).forEach((o) => {
  const a = byId[o.id.replace('-receipt-', '-target-')];
  ok(Boolean(a) && a.kind === 'allocation' && o.value <= a.value, `${o.id}: no matching allocation line or receipt above allocation`);
});
// CBROP: water department totals = recurrent + development as printed in the definition
const tot = byId['cbrop-water-dept-total-budget-2024-25'];
ok(Boolean(tot) && 88208148 + v('cbrop-water-dept-dev-budget-2024-25') === tot.value, 'CBROP FY 2024/25: water department recurrent + development does not equal total budget');
ok(v('cbrop-water-dept-dev-expenditure-2024-25') <= v('cbrop-water-dept-total-expenditure-2024-25'), 'CBROP FY 2024/25: development expenditure above total expenditure');

// ---- gaps are listed; aggregates only ----
ok(data.gaps.length > 0 && data.gaps.every((g) => filled(g.topic) && filled(g.reason)), 'gaps must be listed with a reason');
const banned = /national_id|phone|email|date_of_birth|participant/i;
ok(!banned.test(Object.keys(Object.assign({}, ...obs)).join(' ')), 'observation fields look like individual-level data');
ok(!/\b07\d{8}\b|\b07\d{2} \d{3} \d{3}\b/.test(JSON.stringify(data)), 'file contains something that looks like a phone number');

if (errors.length) {
  errors.forEach((m) => console.error(`FAIL ${m}`));
  console.error(`test-climate: ${errors.length} failure(s) in ${checks} checks`);
  process.exit(1);
}
const byKind = obs.reduce((m, o) => ({ ...m, [o.kind]: (m[o.kind] || 0) + 1 }), {});
console.log(`test-climate: ${checks} checks passed (${obs.length} values from ${data.sources.length} sources; ${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ')}; ${Object.keys(series).length} series, ${data.gaps.length} gaps)`);
