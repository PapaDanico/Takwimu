#!/usr/bin/env node
// Checks data/siaya-fiscal-ledger.json (Siaya fiscal reconciliation ledger, FY 2013/14 to FY 2025/26):
// schema; every value has a source and a PDF page; no zero or null stands for a missing value; discrepancy
// cases are exactly the pairs that differ by more than the threshold, with differences computed correctly;
// the completeness matrix matches the observations; values reused from data/history.json and
// data/counties-cob.json equal those files exactly. Run: node scripts/test-fiscal-ledger.js
const fs = require('fs');
const path = require('path');

const toMillion = (o) => (o.unit === 'KSh billion' ? o.value * 1000 : o.value);
const round2 = (x) => Math.round(x * 100) / 100;
const EXPLICIT_VERSIONS = ['original', 'supplementary'];

function basisMismatch(a, b) {
  const out = [];
  if (a.source_id === b.source_id) out.push('Both values are in the same document (internal inconsistency).');
  if (a.source_kind !== b.source_kind) out.push(`Different publishers: ${a.source_kind} against ${b.source_kind}.`);
  if (a.scope !== b.scope) out.push(`Scope differs: ${a.scope} against ${b.scope}.`);
  if ((a.budget_version || null) !== (b.budget_version || null)) out.push(`Budget version differs: ${a.budget_version} against ${b.budget_version}.`);
  if ((a.stock_point || null) !== (b.stock_point || null)) out.push(`Stock point differs: ${a.stock_point} against ${b.stock_point} (same date, different report).`);
  if ((a.basis || null) !== (b.basis || null) && (a.basis || b.basis)) out.push(`Basis as stated: A "${a.basis || 'not stated'}"; B "${b.basis || 'not stated'}".`);
  if (a.confidence <= 2 || b.confidence <= 2) out.push('At least one reading has confidence 2 or lower (chart label or garbled text).');
  return out.length ? out : ['None identified from the documents.'];
}

// Every pair of values for the same measure and year that differ by more than threshold per cent of the smaller.
function computeDiscrepancies(observations, threshold = 1) {
  const groups = new Map();
  for (const o of observations) {
    const k = `${o.measure}|${o.fy}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  }
  const cases = [];
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (EXPLICIT_VERSIONS.includes(a.budget_version) && EXPLICIT_VERSIONS.includes(b.budget_version) && a.budget_version !== b.budget_version) continue;
        const va = toMillion(a);
        const vb = toMillion(b);
        const pct = (Math.abs(va - vb) / Math.min(Math.abs(va), Math.abs(vb))) * 100;
        if (!(pct > threshold)) continue;
        cases.push({
          case_id: `D-${a.id}-${b.id}`,
          indicator_id: a.measure,
          period: `FY ${a.fy}`,
          claim_a: { observation_id: a.id, value_ksh_m: round2(va), printed: a.original_text || null },
          claim_b: { observation_id: b.id, value_ksh_m: round2(vb), printed: b.original_text || null },
          source_a: { source_id: a.source_id, pdf_page: a.pdf_page },
          source_b: { source_id: b.source_id, pdf_page: b.pdf_page },
          difference: { absolute_ksh_m: round2(Math.abs(va - vb)), pct_of_smaller: round2(pct), b_minus_a_ksh_m: round2(vb - va) },
          possible_basis_mismatch: basisMismatch(a, b),
          status: 'open',
          resolution: null,
          reviewer: null,
          reviewed_at: null,
        });
      }
    }
  }
  return cases;
}

function computeCompleteness(observations, measures, years) {
  const m = {};
  for (const me of measures) {
    m[me] = {};
    for (const fy of years) {
      const list = observations.filter((o) => o.measure === me && o.fy === fy);
      const srcs = [...new Set(list.map((o) => o.source_id))];
      const kinds = [...new Set(list.map((o) => o.source_kind))].sort();
      m[me][fy] = { n_values: list.length, n_sources: srcs.length, source_kinds: kinds, missing: list.length === 0 };
    }
  }
  return m;
}

module.exports = { computeDiscrepancies, computeCompleteness, toMillion };

// ---------------------------------------------------------------- tests
let ROOT_SCHEMA = null;
function checkSchema(s, value, where, out) {
  if (s.$ref) s = s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], ROOT_SCHEMA);
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: ${value} is below minimum ${s.minimum}`);
    if (s.exclusiveMinimum !== undefined && value <= s.exclusiveMinimum) out.push(`${where}: ${value} is not above ${s.exclusiveMinimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: ${value} is above maximum ${s.maximum}`);
  }
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
  if (typeof value === 'string' && s.minLength !== undefined && value.length < s.minLength) out.push(`${where}: shorter than ${s.minLength}`);
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

function resolve(obj, steps) {
  let cur = obj;
  for (const step of steps) {
    if (cur === undefined || cur === null) return undefined;
    cur = typeof step === 'object' ? (Array.isArray(cur) ? cur.find((x) => Object.entries(step).every(([k, v]) => x[k] === v)) : undefined) : cur[step];
  }
  return cur;
}

function main() {
  const root = path.join(__dirname, '..');
  const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
  const data = read('data/siaya-fiscal-ledger.json');
  const schema = read('schemas/siaya-fiscal-ledger.schema.json');
  const library = read('data/source-library.json');
  const reused = { 'data/history.json': read('data/history.json'), 'data/counties-cob.json': read('data/counties-cob.json') };
  const errors = [];
  let checks = 0;
  const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

  // schema
  const se = [];
  ROOT_SCHEMA = schema;
  checkSchema(schema, data, 'ledger', se);
  ok(se.length === 0, `schema: ${se.slice(0, 10).join('; ')}`);

  const measures = Object.keys(data.measures);
  const libIds = new Set(library.documents.map((d) => d.document_id));
  const ids = new Set();
  for (const o of data.observations) {
    const w = `${o.id} (${o.measure} ${o.fy})`;
    ok(!ids.has(o.id), `${w}: duplicate id`); ids.add(o.id);
    ok(measures.includes(o.measure), `${w}: unknown measure`);
    ok(data.years.includes(o.fy), `${w}: fiscal year not in years`);
    // source and page
    ok(typeof o.source_id === 'string' && o.source_id in data.sources, `${w}: source ${o.source_id} not in sources`);
    ok(libIds.has(o.source_id), `${w}: source ${o.source_id} not in data/source-library.json`);
    ok(Number.isInteger(o.pdf_page) && o.pdf_page > 0, `${w}: missing PDF page`);
    // no zero or null standing for missing
    ok(typeof o.value === 'number' && Number.isFinite(o.value), `${w}: value is not a number`);
    ok(o.value !== 0, `${w}: zero value (missing values must be absent, not zero)`);
    ok(o.value > 0, `${w}: non-positive value`);
    ok(o.unit === 'KSh million' || o.unit === 'KSh billion', `${w}: unit ${o.unit}`);
    ok(o.confidence >= 1 && o.confidence <= 5, `${w}: confidence out of range`);
    ok(o.source_kind === data.sources[o.source_id]?.kind, `${w}: source_kind does not match the source registry`);
    if (o.measure.startsWith('budget_')) ok(['original', 'supplementary', 'not stated'].includes(o.budget_version), `${w}: budget_version missing`);
    if (o.measure === 'pending_bills_close') ok(['closing', 'opening_of_next_year'].includes(o.stock_point), `${w}: stock_point missing`);
    // new readings must say what was printed; reused values must match their file exactly
    if (o.reused_from) {
      const src = reused[o.reused_from.file];
      ok(!!src, `${w}: reused_from file ${o.reused_from.file} not allowed`);
      if (src) {
        const v = resolve(src, o.reused_from.path);
        ok(v === o.value, `${w}: value ${o.value} differs from ${o.reused_from.file} ${JSON.stringify(o.reused_from.path)} = ${v}`);
      }
    } else {
      ok(typeof o.original_text === 'string' && o.original_text.length > 0, `${w}: new reading without original_text`);
      ok(typeof o.table === 'string' && o.table.length > 0, `${w}: new reading without table or section`);
    }
  }
  // no null-valued observations hiding as placeholders anywhere
  ok(!JSON.stringify(data.observations).includes('"value":null'), 'an observation has value null');

  // cross-check: every overlapping value in history.json and counties-cob.json that the ledger cites matches (done above);
  // also, for each counties-cob Siaya field the ledger maps, the ledger must hold it (nothing silently dropped).
  const cobMap = { approved_budget_total: 'budget_total', recurrent_budget: 'budget_recurrent', development_budget: 'budget_development', total_osr_actual: 'osr_total_actual', ordinary_osr_actual: 'osr_ordinary_actual', fif_aia_actual: 'osr_fif_aia_actual', total_osr_target: 'osr_total_target', expenditure_total: 'expenditure_total', recurrent_expenditure: 'expenditure_recurrent', development_expenditure: 'expenditure_development', pb_grand_total: 'pending_bills_close' };
  for (const yr of reused['data/counties-cob.json'].years) {
    const s = yr.counties.find((c) => c.slug === 'siaya');
    for (const [f, m] of Object.entries(cobMap)) {
      if (!s[f] || s[f].value === null) continue;
      ok(data.observations.some((o) => o.measure === m && o.fy === yr.fy && o.reused_from && o.reused_from.file === 'data/counties-cob.json' && o.value === s[f].value), `counties-cob ${yr.fy} ${f} = ${s[f].value} is not in the ledger`);
    }
  }
  const histMap = { approved: 'budget_total', recurrent_budget: 'budget_recurrent', development_budget: 'budget_development', spent: 'expenditure_total', recurrent_spent: 'expenditure_recurrent', development_spent: 'expenditure_development' };
  for (const y of reused['data/history.json'].years) {
    for (const [f, m] of Object.entries(histMap)) {
      if (y[f] === undefined) continue;
      ok(data.observations.some((o) => o.measure === m && o.fy === y.fy && o.reused_from && o.reused_from.file === 'data/history.json' && o.value === y[f]), `history ${y.fy} ${f} = ${y[f]} is not in the ledger`);
    }
  }

  // discrepancies
  const expected = computeDiscrepancies(data.observations, data.meta.threshold_pct);
  ok(JSON.stringify(expected) === JSON.stringify(data.discrepancies), `discrepancies: stored ${data.discrepancies.length} cases do not match the ${expected.length} recomputed from observations`);
  const byId = Object.fromEntries(data.observations.map((o) => [o.id, o]));
  for (const d of data.discrepancies) {
    const a = byId[d.claim_a.observation_id];
    const b = byId[d.claim_b.observation_id];
    ok(a && b && a.measure === b.measure && a.fy === b.fy, `${d.case_id}: claims are not the same measure and year`);
    if (a && b) {
      const diff = Math.abs(toMillion(a) - toMillion(b));
      ok(Math.abs(d.difference.absolute_ksh_m - round2(diff)) < 1e-9, `${d.case_id}: absolute difference wrong`);
      ok(d.difference.pct_of_smaller > data.meta.threshold_pct, `${d.case_id}: below threshold`);
    }
    ok(d.status === 'open', `${d.case_id}: status must be open`);
  }

  // completeness
  const comp = computeCompleteness(data.observations, measures, data.years);
  for (const m of measures) for (const fy of data.years) {
    const c = data.completeness[m] && data.completeness[m][fy];
    ok(!!c, `completeness ${m} ${fy} missing`);
    if (!c) continue;
    const e = comp[m][fy];
    ok(c.n_values === e.n_values && c.n_sources === e.n_sources && c.missing === e.missing && JSON.stringify(c.source_kinds) === JSON.stringify(e.source_kinds), `completeness ${m} ${fy} does not match observations`);
    if (c.missing) ok(typeof c.reason === 'string' && c.reason.length > 0, `completeness ${m} ${fy}: missing without a reason`);
  }

  // Case classes (data/ledger-classes.json, scripts/classify-ledger.js): every case classed once, none stale.
  const cls = read('data/ledger-classes.json');
  const CLS = ['definitional', 'period or version', 'probable source error', 'resolved by source', 'open'];
  const caseIds = new Set(data.discrepancies.map((d) => d.case_id));
  const clsIds = cls.cases.map((c) => c.case_id);
  ok(clsIds.length === new Set(clsIds).size, 'ledger-classes: a case is classed twice');
  data.discrepancies.forEach((d) => ok(clsIds.includes(d.case_id), `ledger-classes: ${d.case_id} is not classed (run node scripts/classify-ledger.js)`));
  cls.cases.forEach((c) => {
    ok(caseIds.has(c.case_id), `ledger-classes: ${c.case_id} is not a ledger case`);
    ok(CLS.includes(c.classification), `ledger-classes: ${c.case_id} has class ${c.classification}`);
    ok(typeof c.reason === 'string' && c.reason.length >= 20 && Array.isArray(c.evidence) && c.evidence.length > 0, `ledger-classes: ${c.case_id} needs a reason and evidence`);
  });
  CLS.forEach((k) => ok(cls.meta.counts[k] === cls.cases.filter((c) => c.classification === k).length, `ledger-classes: count for ${k} is stale`));
  // Pending bills: every stock states its date and accounting basis (owner item 4).
  data.observations.filter((o) => o.measure === 'pending_bills_close').forEach((o) => ok(/^\d{4}-(06-30|07-01)$/.test(o.as_at || '') && ['cash', 'accrual', 'eligible-verified', 'as reported'].includes(o.accounting_basis), `${o.id}: pending-bills stock needs as_at (30 June or 1 July) and accounting_basis`));
  // The KSh 545.95 million closing stock (30 June 2025) is held with its printed sources.
  ['L251', 'L273'].forEach((id) => { const o = byId[id]; ok(o && Math.abs(o.value - 545.95) < 0.01 && o.as_at === '2025-06-30', `${id}: the 545.95 million stock at 30 June 2025 must be held`); });

  if (errors.length) {
    console.error(`test-fiscal-ledger: ${errors.length} of ${checks} checks failed`);
    errors.slice(0, 40).forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log(`test-fiscal-ledger: ${checks} checks passed (${data.observations.length} values, ${data.discrepancies.length} open discrepancy cases)`);
}

if (require.main === module) main();
