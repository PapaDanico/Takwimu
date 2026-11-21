#!/usr/bin/env node
// Checks data/siaya-analysis.json (Siaya analytical measures):
// 1. reproducible: re-running scripts/build-siaya-analysis.js gives the committed file byte for byte;
// 2. schema (same subset as scripts/validate-data.js, with local $ref);
// 3. every input (and every value shown beside a result) resolves to the cited record in its dataset, with the same value,
//    source and page;
// 4. every result recomputes from its listed inputs (independent re-implementation of each operation);
// 5. no numerator and denominator from different sources; pending-bill changes stay within one document or declared series;
//    census counts and projections are not mixed; allocation, receipt and expenditure are not combined;
// 6. counts agree with the source datasets; printed-rate differences and >1 point flags are right;
// 7. gaps have reasons and no value; every record carries the label; no verdict wording.
// Run: node scripts/test-siaya-analysis.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const committed = fs.readFileSync(path.join(root, 'data/siaya-analysis.json'), 'utf8');
const data = JSON.parse(committed);
const schema = read('schemas/siaya-analysis.schema.json');
const LABEL = 'Calculated by Takwimu Kenya from published figures';
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

// ---- 1. reproducible ----
const rebuilt = execFileSync(process.execPath, [path.join(root, 'scripts/build-siaya-analysis.js'), '--stdout'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
ok(rebuilt === committed, 'data/siaya-analysis.json is not what scripts/build-siaya-analysis.js produces now: re-run the build and commit the result');

// ---- 2. schema ----
function checkSchema(s, value, where, out) {
  if (s.$ref) return checkSchema(s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], schema), value, where, out);
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return undefined; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: ${value} is below minimum ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: ${value} is above maximum ${s.maximum}`);
  }
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value.slice(0, 60)}" does not match ${s.pattern}`);
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
  return undefined;
}
const schemaErrors = [];
checkSchema(schema, data, 'siaya-analysis', schemaErrors);
schemaErrors.forEach((e) => ok(false, `schema: ${e}`));

// ---- 3. resolve inputs in their datasets ----
const cache = {};
const dataset = (f) => { if (!cache[f]) cache[f] = read(f); return cache[f]; };
function chain(ds, recordPath) {
  const tokens = recordPath.match(/[^.[\]]+(\[[^\]]*\])?/g) || [];
  const out = []; let cur = dataset(ds);
  for (const t of tokens) {
    const m = t.match(/^([^[]+)(?:\[([^=\]]+)=([^\]]*)\])?$/);
    if (!m || cur == null) return null;
    cur = cur[m[1]];
    if (m[2] !== undefined) { if (!Array.isArray(cur)) return null; cur = cur.find((x) => String(x[m[2]]) === m[3]); }
    if (cur === undefined) return null;
    out.push(cur);
  }
  return out;
}
function anchor(inp, ch) {
  const rec = ch[ch.length - 1];
  if (inp.dataset === 'data/history.json' && rec.provenance && rec.provenance[inp.field]) return { source_id: rec.provenance[inp.field].source_id, page: rec.provenance[inp.field].page ?? null };
  if (rec.pages && rec.pages[inp.field]) return { source_id: null, page: rec.pages[inp.field].pdf_page };
  let source = null; let page = null;
  ch.forEach((o) => {
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      if (o.source_id || o.doc_id) source = o.source_id || o.doc_id;
      if (o.pdf_page !== undefined || o.page !== undefined) page = o.pdf_page ?? o.page ?? null;
    }
  });
  return { source_id: source, page };
}
const toMillion = (v, unit) => {
  if (unit === 'KSh million') return v;
  if (unit === 'KSh billion') return v * 1000;
  if (unit === 'KSh') return v / 1e6;
  return NaN;
};
function checkInput(inp, where) {
  const ch = chain(inp.dataset, inp.record);
  ok(ch && ch.length, `${where}: record ${inp.record} not found in ${inp.dataset}`);
  if (!ch || !ch.length) return;
  const rec = ch[ch.length - 1];
  ok(rec[inp.field] === inp.value, `${where}: ${inp.dataset} ${inp.record}.${inp.field} is ${JSON.stringify(rec[inp.field])}, input says ${JSON.stringify(inp.value)}`);
  const a = anchor(inp, ch);
  if (a.source_id) ok(a.source_id === inp.source_id, `${where}: source ${inp.source_id} but the record cites ${a.source_id}`);
  if (a.page !== null && a.page !== undefined) ok(a.page === inp.pdf_page, `${where}: page ${inp.pdf_page} but the record cites ${a.page}`);
  else ok(inp.pdf_page === null && typeof inp.page_note === 'string', `${where}: the dataset gives no page, so pdf_page must be null with a page_note`);
  if (rec.unit !== undefined && inp.field === 'value') ok(rec.unit === inp.unit, `${where}: unit ${inp.unit} but the record says ${rec.unit}`);
  ok(typeof inp.source_title === 'string' && inp.source_title.length > 3, `${where}: input has no source title`);
}

// ---- 4. recompute ----
const round = (x, dp) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
function recompute(calc, inputs) {
  const val = (i) => (calc.to_unit === 'KSh million' ? toMillion(i.value, i.unit) : i.value);
  const sum = (roles) => inputs.filter((i) => roles.includes(i.role)).map(val).reduce((a, b) => a + b, 0);
  switch (calc.op) {
    case 'linear': return inputs.map((i) => (calc.coefficients[i.role] || 0) * val(i)).reduce((a, b) => a + b, 0);
    case 'ratio_pct': return (sum(calc.numerator_roles) / sum(calc.denominator_roles)) * 100;
    case 'real_per_capita': {
      const by = (r) => inputs.filter((i) => i.role === r);
      if (by('expenditure').length !== 1 || by('population').length !== 1 || by('cpi_period').length !== 1 || by('cpi_base').length !== 1) return NaN;
      const e = by('expenditure')[0];
      return (toMillion(e.value, e.unit) * 1e6 / by('population')[0].value) * (by('cpi_base')[0].value / by('cpi_period')[0].value);
    }
    case 'count': return inputs.filter((i) => i.role === 'item' && i.value === calc.match).length;
    case 'share_rank': { const t = shares(inputs); return t.findIndex((x) => x.code === calc.target_code) + 1; }
    case 'count_distinct': return new Set(inputs.filter((i) => i.role === 'item').map((i) => i.value)).size;
    default: return NaN;
  }
}

// Independent re-implementation for A8 (FIF share of own-source revenue per county, highest first, ties by code).
function shares(inputs) {
  const by = new Map();
  inputs.forEach((i) => { if (!by.has(i.county_code)) by.set(i.county_code, {}); by.get(i.county_code)[i.role] = i.value; });
  return [...by.entries()].map(([code, v]) => ({ code, share: round((v.fif / v.total) * 100, 2) })).sort((a, b) => b.share - a.share || a.code - b.code);
}
const ids = new Set();
const audits = read('data/siaya-audits.json');
const climate = read('data/siaya-climate.json');
const ledger = read('data/siaya-fiscal-ledger.json');
const obsLedger = Object.fromEntries(ledger.observations.map((o) => [o.id, o]));
const VERDICT = /\b(corrupt\w*|fraud\w*|theft|stole\w*|embezzl\w*|misappropriat\w*|looted|fail(ed|ure|ing)?|success\w*|improv\w*|worse\w*|better|good|bad|poor(ly)?|mismanag\w*|wasted?)\b|reduction in (total )?liabilit/i;
// The name of the Act and of the fund ("Facility Improvement Financing", "Facility Improvement Fund") is not a verdict.
const textOf = (r) => [r.title, r.formula, r.caveat, r.gap_reason || '', ...r.comparability_notes].join(' \n ').replace(/Facility Improvement (Financing|Fund)/g, 'FIF');

data.records.forEach((r) => {
  const w = r.calc_id;
  ok(!ids.has(w), `${w}: duplicate calc_id`); ids.add(w);
  ok(r.label === LABEL, `${w}: label missing or wrong`);
  ok(!VERDICT.test(textOf(r)), `${w}: verdict wording (${(textOf(r).match(VERDICT) || [])[0]})`);
  r.inputs.forEach((inp, i) => checkInput(inp, `${w} input ${i}`));
  r.beside.forEach((inp, i) => checkInput(inp, `${w} beside ${i}`));
  if (r.status === 'gap') {
    ok(r.result === null, `${w}: a gap must not carry a result`);
    ok(typeof r.gap_reason === 'string' && r.gap_reason.length >= 20, `${w}: gap without a reason`);
    return;
  }
  ok(r.gap_reason === null, `${w}: a value record must not carry a gap reason`);
  ok(r.calc && typeof r.result === 'number' && Number.isFinite(r.result), `${w}: value record without calc or numeric result`);
  if (!r.calc) return;
  ok(r.inputs.length > 0 || r.calc.op === 'count', `${w}: value record without inputs`);
  const want = recompute(r.calc, r.inputs);
  const dp = r.calc.dp ?? 0;
  ok(Number.isFinite(want) && Math.abs(want - r.result) <= 0.5 * 10 ** -dp + 1e-9, `${w}: stored ${r.result}, recomputed ${want}`);
  const fiscal = r.inputs.filter((i) => !['population', 'cpi_period', 'cpi_base'].includes(i.role));
  const sources = new Set(fiscal.map((i) => i.source_id));
  // ---- 5. no mixed sources ----
  if (r.calc.op === 'ratio_pct') ok(sources.size === 1, `${w}: numerator and denominator come from different sources (${[...sources].join(', ')})`);
  if (r.calc.op === 'real_per_capita') {
    ok(fiscal.length === 1, `${w}: real per-capita must have exactly one fiscal input`);
    const pop = r.inputs.find((i) => i.role === 'population');
    const ch = chain(pop.dataset, pop.record); const rec = ch[ch.length - 1];
    const kind = pop.dataset === 'data/history.json' ? rec.kind : (pop.field.startsWith('census') ? 'census' : 'projection');
    ok(kind === pop.population_kind && r.flags.population_kind === kind && r.calc.population_kind === kind, `${w}: population kind not stated consistently (${kind})`);
    ok(r.title.includes(kind === 'census' ? 'census' : 'projection'), `${w}: title does not say whether the population is a census count or a projection`);
    ok(r.inputs.find((i) => i.role === 'cpi_base').field === r.calc.cpi_base_fy, `${w}: CPI base input is not the stated base year`);
    ok(r.inputs.find((i) => i.role === 'cpi_period').field === r.period.replace('FY ', ''), `${w}: CPI period does not match the record period`);
    ok(Number(r.period.slice(3, 7)) === Number(pop.period), `${w}: population year ${pop.period} is not the start year of ${r.period}`);
  }
  if (r.family === 'A2') {
    ok(r.inputs.length === 3 && r.inputs.filter((i) => i.role === 'transfer').length === 2 && r.inputs.filter((i) => i.role === 'own_source').length === 1, `${w}: needs two transfer inputs and one own-source input`);
    ok(new Set(r.inputs.map((i) => i.period)).size === 1, `${w}: inputs from different years`);
  }
  if (r.family === 'A3') {
    const b = r.inputs.find((i) => i.role === 'budget');
    ok(b && !/^Approved revenue estimates/.test(b.basis || ''), `${w}: revenue-side estimate used as an expenditure denominator`);
    ok((obsLedger[b.record.match(/id=([^\]]+)/)[1]].budget_version || 'not stated') === r.calc.budget_version, `${w}: budget version not as stated`);
    ok(new Set(r.inputs.map((i) => i.period)).size === 1, `${w}: budget and expenditure for different periods`);
    r.checks.forEach((c) => {
      const d = round(r.result - c.printed_value, 2);
      ok(Math.abs(d - c.difference_points) < 1e-9 && c.flag_gt_1_point === (Math.abs(d) > 1), `${w}: printed-rate check wrong (${c.difference_points}, flag ${c.flag_gt_1_point})`);
      ok(r.beside.some((p) => p.record === c.printed_record && p.value === c.printed_value), `${w}: printed rate not shown beside`);
    });
    ok(r.flags.printed_mismatch_gt_1_point === r.checks.some((c) => c.flag_gt_1_point), `${w}: mismatch flag wrong`);
    const printedSources = new Set(r.beside.map((p) => p.source_id));
    ok([...printedSources].every((s) => sources.has(s)), `${w}: printed rate from a different document than the calculation`);
  }
  if (r.family === 'A4' && r.calc.op === 'linear' && r.inputs.length >= 2) {
    if (!r.calc.series) ok(sources.size === 1, `${w}: change mixes documents (${[...sources].join(', ')})`);
    else {
      ok(new Set(fiscal.map((i) => i.source_kind)).size === 1 && new Set(fiscal.map((i) => i.scope)).size === 1, `${w}: series change mixes publishers or scopes`);
    }
    if (r.inputs.some((i) => i.role === 'payments')) ok(sources.size === 1, `${w}: roll-forward terms from different reports`);
  }
  // ---- 6. counts agree with the source datasets ----
  if (r.family === 'A5') {
    const { entity: ent, fy, count_kind: k, category } = r.flags;
    const fsAll = audits.findings.filter((f) => f.entity === ent && f.fy === fy);
    let want2;
    if (k === 'category') want2 = fsAll.filter((f) => f.category === category).length;
    if (k === 'stated_prior_year') want2 = fsAll.filter((f) => f.unresolved_prior_year.flag === true).length;
    if (k === 'listed_unresolved_next_year') want2 = fsAll.filter((f) => f.listed_unresolved_next_year === true).length;
    if (k === 'same_item') want2 = audits.findings.filter((f) => f.same_item === r.calc.match).length;
    ok(want2 === r.result, `${w}: dataset gives ${want2}, record says ${r.result}`);
    if (k === 'category') {
      const stored = ((audits.recurrence_by_category[ent] || {})[category] || {})[fy];
      ok(stored === r.result, `${w}: disagrees with recurrence_by_category (${stored})`);
    }
  }
  if (r.family === 'A7' && r.calc.op === 'count_distinct') {
    const want3 = new Set(climate.observations.filter((o) => r.calc.filter.series.includes(o.series) && o.ward_register_name && o.hotspots_as_printed && o.hotspots_as_printed !== r.calc.filter.hotspots_as_printed_not).map((o) => o.ward_register_name)).size;
    ok(want3 === r.result, `${w}: dataset gives ${want3} wards, record says ${r.result}`);
    ok(r.beside.every((b) => b.kind === 'allocation'), `${w}: allocation, receipt or expenditure mixed in the financing shown beside`);
  }
  if (r.family === 'A8' && r.calc.op === 'share_rank') {
    const t = shares(r.inputs); const me = t.find((x) => x.code === 41);
    ok(sources.size === 1, `${w}: the 47-county table must come from one report`);
    ok(r.inputs.every((i) => i.dataset === 'data/counties-cob.json' && Number.isInteger(i.county_code) && new RegExp(`counties\\[code=${i.county_code}\\]`).test(i.record)), `${w}: every input names its county row`);
    ok(t.every((x) => r.inputs.filter((i) => i.county_code === x.code).length === 2), `${w}: each county needs one FIF and one total input`);
    const sorted = t.map((x) => x.share).sort((a, b) => a - b); const n = t.length;
    const median = n % 2 ? sorted[(n - 1) / 2] : round((sorted[n / 2 - 1] + sorted[n / 2]) / 2, 2);
    ok(r.flags.n_counties === n && r.flags.siaya_share_pct === me.share && r.flags.median_share_pct === median && r.flags.counties_with_lower_share === t.filter((x) => x.share < me.share).length, `${w}: flags do not recompute`);
    ok(n + r.flags.excluded_counties === 47, `${w}: ranked plus excluded counties must be 47`);
  }
  if (r.family === 'A8' && r.calc.op === 'ratio_pct') ok(r.calc.numerator_roles.join() === 'fif' && (r.calc.denominator_roles.join() === 'ordinary,fif' || r.calc.denominator_roles.join() === 'total'), `${w}: FIF share must be FIF over ordinary+FIF, or over the printed total`);
  if (r.family === 'A6') ok(r.flags.context_not_causation === true && /not causation/i.test(r.caveat), `${w}: missing the context-not-causation flag`);
});

// ---- whole-file checks ----
ok(data.meta.label === LABEL, 'meta.label missing');
ok(data.meta.counts.records === data.records.length, 'meta.counts.records is wrong');
['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'].forEach((f) => ok(data.records.some((r) => r.family === f), `no records for family ${f}`));
ok(data.records.every((r) => r.family !== 'A6' || r.flags.context_not_causation === true), 'A6 records must all carry context_not_causation');
// Sweep D6/D14/D24: FY 2023/24 FIF uses the printed 388.63; population inputs carry their page.
{
  const r = data.records.find((x) => x.calc_id === 'SIA-A8-2023-24-cob-report-2023-24');
  ok(r && r.status === 'value' && r.inputs.some((i) => i.role === 'fif' && i.value === 388.626776) && !committed.includes('388.53'), 'A8 FY 2023/24 CoB record must use FIF 388,626,776 (printed 388.63)');
  data.records.filter((x) => x.family === 'A1' && x.status === 'value').forEach((x) => { const pop = x.inputs.find((i) => i.role === 'population'); ok(Number.isInteger(pop.pdf_page), `${x.calc_id}: population input has no page`); });
}
const ops = new Set(data.records.filter((r) => r.calc).map((r) => r.calc.op));
ok(![...ops].some((o) => /mean|avg|average/i.test(o)), 'no averaging operation is allowed');

if (errors.length) { console.error(`Siaya analysis tests failed (${errors.length}):\n- ${errors.slice(0, 40).join('\n- ')}`); process.exit(1); }
const v = data.records.filter((r) => r.status === 'value').length;
console.log(`Siaya analysis tests passed: ${data.records.length} records (${v} values, ${data.records.length - v} gaps), ${checks} checks; reproducible.`);
