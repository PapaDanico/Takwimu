#!/usr/bin/env node
// Checks data/siaya-programmes.json (Siaya NGO, CSO and donor programme atlas, handover WP8 and R-006):
// schema; every record has an implementing organisation, a funder entry, a geography class, an evidence type and at
// least one source with page and locator that resolves to the source list; amounts and beneficiary counts on
// multi-county or national records are pooled=true and never enter the Siaya totals; Siaya totals recompute and
// reconcile to the printed county subtotals; no personal names or contacts (honorifics, phone, e-mail); ward names
// resolve against data/siaya-geography.json or carry a flag; outcomes on pooled records are not attributed to Siaya.
// Run: node scripts/test-programmes.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const raw = fs.readFileSync(path.join(root, 'data/siaya-programmes.json'), 'utf8');
const data = JSON.parse(raw);
const schema = read('schemas/siaya-programmes.schema.json');
const geoReg = read('data/siaya-geography.json');
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

// ---- schema (same subset as scripts/validate-data.js, with local $ref) ----
function checkSchema(s, value, where, out) {
  if (s.$ref) {
    const target = s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], schema);
    if (!target) { out.push(`${where}: unresolved $ref ${s.$ref}`); return; }
    checkSchema(target, value, where, out);
    return;
  }
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
    if (s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value.slice(0, 60)}" does not match ${s.pattern}`);
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
checkSchema(schema, data, 'siaya-programmes', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
const progs = data.programmes;
const byId = Object.fromEntries(progs.map((p) => [p.id, p]));
ok(Object.keys(sources).length === data.sources.length, 'duplicate source id');
ok(Object.keys(byId).length === progs.length, 'duplicate programme id');
const POOLED = new Set(['multi_county_including_siaya', 'national']);
const SIAYA = new Set(['siaya_specific', 'siaya_wards_listed']);

// ---- source references ----
function checkRef(ref, where) {
  ok(ref && filled(ref.source_id) && sources[ref.source_id], `${where}: source_id ${ref && ref.source_id} not in sources`);
  ok(ref && (Number.isInteger(ref.page) ? ref.page > 0 : filled(ref.page)), `${where}: page missing`);
  ok(ref && filled(ref.locator), `${where}: locator missing`);
}

// ---- ward register (names and aliases) ----
const wardLookup = new Map();
geoReg.wards.forEach((w) => {
  wardLookup.set(w.name.toLowerCase(), w.id);
  (w.aliases || []).forEach((a) => wardLookup.set(a.name.toLowerCase(), w.id));
});

progs.forEach((p) => {
  const w = p.id;
  ok(filled(p.implementing_organisation), `${w}: implementing organisation missing`);
  ok(filled(p.funder) && filled(p.funder_basis), `${w}: funder or funder_basis missing`);
  ok(p.geography && filled(p.geography.class), `${w}: geography class missing`);
  ok(['planned', 'self_reported', 'independently_evaluated'].includes(p.evidence_type), `${w}: evidence type missing`);
  ok(p.sources.length > 0, `${w}: no source`);
  p.sources.forEach((s, i) => checkRef(s, `${w}.sources[${i}]`));
  ok(p.period && (p.period.start || p.period.end), `${w}: period has neither start nor end`);
  if (p.period.start && p.period.end) ok(p.period.start <= p.period.end, `${w}: period start after end`);
  if (p.parent_programme) {
    ok(byId[p.parent_programme], `${w}: parent ${p.parent_programme} not found`);
    ok(p.parent_programme !== w, `${w}: is its own parent`);
  }

  const pooledRecord = POOLED.has(p.geography.class);
  // amounts and beneficiaries: pooled flag follows geography class
  p.amounts.forEach((a, i) => {
    const at = `${w}.amounts[${i}]`;
    checkRef(a.source, at);
    if (pooledRecord) ok(a.pooled === true && a.scope === 'pooled_total', `${at}: amount on a ${p.geography.class} record must be pooled=true`);
    else ok(a.pooled === false && a.scope === 'siaya_specific', `${at}: amount on a Siaya record must be pooled=false`);
    if (a.value === null) ok(filled(a.note) && filled(a.value_as_printed), `${at}: null value needs a note and value_as_printed`);
    if (a.value === 0) ok(filled(a.value_as_printed), `${at}: zero must be printed in the source, not filled`);
  });
  p.beneficiaries.forEach((b, i) => {
    const at = `${w}.beneficiaries[${i}]`;
    checkRef(b.source, at);
    if (pooledRecord) ok(b.pooled === true && b.scope === 'pooled_total', `${at}: beneficiary count on a ${p.geography.class} record must be pooled=true`);
    else ok(b.pooled === false && b.scope === 'siaya_specific', `${at}: beneficiary count on a Siaya record must be pooled=false`);
  });
  // R-006: no Siaya attribution of outcomes on pooled records
  p.outputs_outcomes_as_stated.forEach((o, i) => {
    checkRef(o.source, `${w}.outputs_outcomes_as_stated[${i}]`);
    if (pooledRecord) ok(o.attributable_to_siaya === false, `${w}.outputs_outcomes_as_stated[${i}]: pooled record outcome attributed to Siaya`);
  });
  if (p.evidence_type === 'independently_evaluated') {
    ok(p.evaluation && filled(p.evaluation.by) && filled(p.evaluation.scope), `${w}: independently_evaluated needs an evaluation entry`);
    if (p.evaluation) checkRef(p.evaluation.source, `${w}.evaluation`);
    if (p.evaluation && pooledRecord) ok(p.evaluation.siaya_disaggregated === false || p.outputs_outcomes_as_stated.every((o) => !o.attributable_to_siaya), `${w}: evaluation scope inconsistent`);
  } else ok(p.evaluation === null, `${w}: evaluation present but evidence type is ${p.evidence_type}`);

  // geography consistency and ward resolution
  if (p.geography.class === 'siaya_wards_listed') ok(p.geography.wards_as_printed.length > 0, `${w}: siaya_wards_listed without wards`);
  if (p.geography.class === 'multi_county_including_siaya') ok(p.geography.other_counties_as_printed.length > 0 || filled(p.geography.note), `${w}: multi-county record names no other county and has no note`);
  ok(p.geography.ward_resolution.length === p.geography.wards_as_printed.length, `${w}: ward_resolution does not cover every ward`);
  p.geography.wards_as_printed.forEach((name, i) => {
    const r = p.geography.ward_resolution[i] || {};
    const id = wardLookup.get(name.toLowerCase());
    ok(r.name_as_printed === name, `${w}: ward_resolution[${i}] name mismatch`);
    if (id) ok(r.ward_id === id && r.flag === null, `${w}: ward "${name}" resolves to ${id} but record says ${r.ward_id}`);
    else ok(r.ward_id === null && filled(r.flag), `${w}: ward "${name}" not in register and not flagged`);
  });
});

// ---- Siaya totals: recompute; no pooled record or pooled amount included ----
const recomputed = new Map();
progs.forEach((p) => {
  if (!SIAYA.has(p.geography.class)) return;
  p.amounts.forEach((a) => {
    if (a.pooled || a.currency !== 'KES' || a.value === null || !/^FY \d{4}\/\d{2}$/.test(a.period)) return;
    const k = `${a.period}|${a.kind}`;
    const t = recomputed.get(k) || { total: 0, ids: new Set() };
    t.total += a.value; t.ids.add(p.id); recomputed.set(k, t);
  });
});
const stored = data.summary.siaya_development_partner_grants_kes;
ok(stored.length === recomputed.size, `summary has ${stored.length} total rows, recomputed ${recomputed.size}`);
stored.forEach((t) => {
  const r = recomputed.get(`${t.period}|${t.kind}`);
  ok(r && Math.abs(r.total - t.total) < 0.5, `summary ${t.period} ${t.kind}: stored ${t.total}, recomputed ${r && r.total}`);
  t.record_ids.forEach((id) => {
    ok(byId[id] && SIAYA.has(byId[id].geography.class), `summary ${t.period} ${t.kind}: ${id} is not a Siaya record`);
    ok(byId[id] && byId[id].amounts.every((a) => !a.pooled), `summary ${t.period} ${t.kind}: ${id} carries pooled amounts`);
  });
  if (r) ok(r.ids.size === t.record_ids.length && t.record_ids.every((id) => r.ids.has(id)), `summary ${t.period} ${t.kind}: record_ids differ from recomputation`);
});
// reconciliation: printed county subtotal minus excluded non-partner lines equals the Siaya total
data.summary.reconciliation.forEach((rc) => {
  checkRef(rc.source, `reconciliation ${rc.period} ${rc.kind}`);
  const excl = rc.excluded_lines.reduce((s, l) => s + l.value, 0);
  const t = stored.find((x) => x.period === rc.period && x.kind === rc.kind);
  ok(t && Math.abs(rc.printed_total - excl - t.total) < 0.5, `reconciliation ${rc.period} ${rc.kind}: printed ${rc.printed_total} - excluded ${excl} != ${t && t.total}`);
});
ok(data.summary.record_count === progs.length, 'summary record_count wrong');
['siaya_specific', 'siaya_wards_listed', 'multi_county_including_siaya', 'national'].forEach((c) => ok(data.summary.by_geography_class[c] === progs.filter((p) => p.geography.class === c).length, `summary by_geography_class ${c} wrong`));
['planned', 'self_reported', 'independently_evaluated'].forEach((e) => ok(data.summary.by_evidence_type[e] === progs.filter((p) => p.evidence_type === e).length, `summary by_evidence_type ${e} wrong`));

// ---- data protection: no personal names or contacts anywhere in the file ----
const honorific = /\b(Mr|Mrs|Ms|Miss|Dr|Prof|Hon|Rev|Eng|Sen|H\.\s?E)\.?\s+[A-Z][a-z]+/;
const phone = /(\+?254[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3})|\b0[17]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b|\(\d{3}\)\s?\d{3}[\s-]\d{4}/;
const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const strings = [];
(function walk(v, where) {
  if (typeof v === 'string') strings.push([where, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${where}.${k}`));
})(data, 'data');
strings.forEach(([where, s]) => {
  if (/sha256$/.test(where) || /^https:\/\//.test(s)) return;
  ok(!honorific.test(s), `${where}: honorific with a name: "${(s.match(honorific) || [''])[0]}"`);
  ok(!phone.test(s), `${where}: phone-number pattern: "${(s.match(phone) || [''])[0]}"`);
  ok(!email.test(s), `${where}: e-mail pattern: "${(s.match(email) || [''])[0]}"`);
});
// URLs may only point at documents or services, never at a mailto: or tel: target
strings.forEach(([where, s]) => ok(!/^(mailto|tel):/i.test(s), `${where}: contact link`));

if (errors.length) {
  console.error(`test-programmes: ${errors.length} failure(s) in ${checks} checks`);
  errors.slice(0, 50).forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-programmes: ${checks} checks passed (${progs.length} programmes, ${progs.filter((p) => POOLED.has(p.geography.class)).length} pooled-geography records)`);
