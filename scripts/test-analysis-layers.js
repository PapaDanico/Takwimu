#!/usr/bin/env node
// Checks data/siaya-analysis-layers.json (layers B1 to B5): schema; the committed file equals a fresh run of
// scripts/build-analysis-layers.js (reproducible); every input value equals the value now stored at the record it
// names; every result recomputes from its inputs; numerator and denominator come from one document; a gap has a
// reason and no result; threshold flags follow from the result; every itemised input resolves for lib/review-status.js
// (so a rejected input withholds the result) and no result is approved while its inputs are pending.
// Run: node scripts/test-analysis-layers.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { check } = require('./lib-schema-check');
const rs = require('../lib/review-status');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const file = fs.readFileSync(path.join(root, 'data', 'siaya-analysis-layers.json'), 'utf8');
const data = JSON.parse(file);
const schema = read('schemas/siaya-analysis-layers.schema.json');
const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };
const near = (a, b, t) => Math.abs(a - b) <= t;

check(schema, data, 'siaya-analysis-layers').forEach((m) => ok(false, `schema ${m}`));
const fresh = execFileSync(process.execPath, [path.join(__dirname, 'build-analysis-layers.js'), '--stdout'], { encoding: 'utf8', maxBuffer: 256 << 20 });
ok(fresh === file, 'data/siaya-analysis-layers.json differs from a fresh run of scripts/build-analysis-layers.js (run it)');

// ---- inputs equal the stored values ----
const cache = {};
const ds = (f) => cache[f] || (cache[f] = read(f));
function stored(i) {
  const d = ds(i.dataset);
  let m;
  if ((m = i.record.match(/^observations\[id=([^\]]+)\]$/))) { const o = d.observations.find((x) => x.id === m[1]); return o && o[i.field]; }
  if ((m = i.record.match(/^findings\[id=([^\]]+)\]$/))) { const o = d.findings.find((x) => x.id === m[1]); return o && o[i.field]; }
  if ((m = i.record.match(/^years\[fy=([^\]]+)\]$/))) { const y = d.years.find((x) => x.fy === m[1]); return y && y[i.field]; }
  if ((m = i.record.match(/^population\.points\[year=(\d+)\]$/))) { const p = d.population.points.find((x) => x.year === Number(m[1])); return p && p.value; }
  if (i.record === 'fiscal_year') return d.fiscal_year[i.field];
  return undefined;
}
const toM = (v, u) => (u === 'KSh million' ? v : u === 'KSh billion' ? v * 1000 : u === 'KSh' ? v / 1e6 : NaN);
const sumM = (ins, roles) => ins.filter((x) => roles.includes(x.role)).reduce((a, x) => a + toM(x.value, x.unit), 0);
const fams = {};
data.records.forEach((r) => {
  const tag = r.calc_id;
  [...r.inputs, ...r.beside].forEach((i) => ok(stored(i) === i.value, `${tag}: input ${i.record}.${i.field} is ${JSON.stringify(i.value)}, the dataset holds ${JSON.stringify(stored(i))}`));
  ok((r.status === 'gap') === (r.result === null) && (r.status === 'gap') === Boolean(r.gap_reason), `${tag}: a gap has a reason and no result; a value has no gap reason`);
  if (r.status === 'value') {
    fams[r.family] = (fams[r.family] || 0) + 1;
    const c = r.calc;
    let v;
    if (c.op === 'ratio_pct') {
      v = (sumM(r.inputs, c.numerator_roles) / sumM(r.inputs, c.denominator_roles)) * 100;
      const docs = new Set(r.inputs.map((i) => i.source_id));
      ok(docs.size === 1, `${tag}: numerator and denominator must come from one document (${[...docs].join(', ')})`);
    } else if (c.op === 'deflate') {
      const g = (role) => r.inputs.find((i) => i.role === role);
      v = (toM(g(c.value_role).value, g(c.value_role).unit) * g(c.base_role).value) / g(c.year_role).value;
    } else if (c.op === 'per_capita') {
      const g = (role) => r.inputs.find((i) => i.role === role);
      v = (toM(g(c.value_role).value, g(c.value_role).unit) * 1e6) / g(c.population_role).value;
    } else ok(false, `${tag}: unknown op ${c.op}`);
    ok(near(v, r.result, 0.5 * 10 ** -c.dp + 1e-9), `${tag}: result ${r.result}, recomputed ${v}`);
    if (r.threshold) {
      const t = r.threshold.value;
      const want = r.threshold.kind === 'floor' ? { below_floor: r.result < t } : r.threshold.kind === 'ceiling' ? { above_ceiling: r.result > t } : { above_limit: r.result > t };
      ok(JSON.stringify(want) === JSON.stringify(r.flags), `${tag}: threshold flags should be ${JSON.stringify(want)}`);
    }
  }
  // review-status: itemised inputs resolve, and a result is never approved while an input is not
  r.inputs.filter((i) => !/cpi\.json$/.test(i.dataset)).forEach((i) => {
    const ref = rs.inputRef(i);
    ok(ref && rs.observations(ref.dataset).some((x) => x.id === ref.id), `${tag}: input ${i.dataset} ${i.record} does not resolve to a reviewable value`);
  });
  const st = rs.review('siaya-analysis-layers', r.calc_id);
  ok(st && !st.approved, `${tag}: must not be approved (no review records)`);
});
['B1', 'B2', 'B3', 'B4', 'B5'].forEach((f) => ok(fams[f] > 0, `family ${f} has no value`));
const cnt = {};
data.records.forEach((r) => { const c = cnt[r.family] || (cnt[r.family] = { values: 0, gaps: 0 }); c[r.status === 'value' ? 'values' : 'gaps'] += 1; });
ok(JSON.stringify(cnt) === JSON.stringify(data.meta.counts), 'meta.counts do not match the records');
// The Auditor-General's own ratios are beside, never inputs.
data.records.forEach((r) => ok(!r.inputs.some((i) => /siaya-audits/.test(i.dataset)), `${r.calc_id}: an audit finding may only be beside a result`));
ok(data.records.some((r) => r.family === 'B1' && r.beside.length) && data.records.some((r) => r.family === 'B5' && r.beside.length), 'the Auditor-General\'s wage-bill and liabilities ratios must be shown beside');

// ---- derived_from: a calculation names its input records in place of a page (lib/derived-from.js) ----
{
  const { derivedFromProblems } = require('../lib/derived-from');
  const rsx = require('../lib/review-status');
  const items = Object.fromEntries(rsx.DATASET_IDS.map((d) => [d, new Set(rsx.observations(d).map((i) => i.id))]));
  data.records.forEach((r) => derivedFromProblems(r, items).forEach((p) => ok(false, `${r.calc_id}: ${p}`)));
  ok(derivedFromProblems({ ...data.records.find((r) => r.derived_from.length), derived_from: [] }, items).length > 0, 'derived_from check is vacuous: an emptied list must fail');
}

if (errors.length) {
  console.error(`test-analysis-layers: ${errors.length} of ${checks} checks failed:\n- ${errors.slice(0, 40).join('\n- ')}`);
  process.exit(1);
}
console.log(`test-analysis-layers: ${checks} checks passed (${data.records.length} records: ${Object.entries(cnt).map(([k, v]) => `${k} ${v.values} values/${v.gaps} gaps`).join(', ')}); reproducible`);
