#!/usr/bin/env node
// One test per conflict case for every county other than Siaya in lib/county-registry.js (Siaya's register is tested
// by scripts/test-reconciliation.js). For each case: the register entry is schema-valid; it names the observations it
// compares (dataset|id) and each exists; every value in the register equals its observation (KSh billion converted to
// KSh million); the values differ; both values are kept (nothing chosen silently); the ledger cases it cites exist and
// compare exactly those observations; a case is not marked reviewed or page-checked without a reviewer. Also: every
// open discrepancy in the county's fiscal ledger is covered by a register case. Run: node scripts/test-county-reconciliation.js
const counties = require('../lib/county-registry');
const { check } = require('./lib-schema-check');

const results = [];
const test = (name, fn) => { try { fn(); results.push([name, null]); } catch (e) { results.push([name, e.message]); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
const toM = (o) => (o.unit === 'KSh billion' ? o.value * 1000 : o.value);

counties.withKind('conflicts').filter((s) => s !== 'siaya').forEach((slug) => {
  const reg = counties.load(slug, 'conflicts');
  const ledger = counties.has(slug, 'ledger') ? counties.load(slug, 'ledger') : { observations: [], discrepancies: [] };
  const pop = counties.has(slug, 'population') ? counties.load(slug, 'population') : { points: [], print_differences: [] };
  const audits = counties.has(slug, 'audits') ? counties.load(slug, 'audits') : { opinions: [] };
  const L = Object.fromEntries(ledger.observations.map((o) => [o.id, o]));
  const D = Object.fromEntries(ledger.discrepancies.map((d) => [d.case_id, d]));
  // dataset|id -> a comparable number
  const value = (ref) => {
    const [ds, id] = ref.split('|');
    if (ds === `${slug}-fiscal-ledger`) { ok(L[id], `${ref}: no such ledger observation`); return toM(L[id]); }
    if (ds === `${slug}-population`) {
      if (id.startsWith('print_differences:')) { const p = pop.print_differences.find((x) => x.point === id.split(':')[1]); ok(p, `${ref}: no such print difference`); return p.as_printed; }
      const p = pop.points.find((x) => x.id === id); ok(p, `${ref}: no such population point`); return p.value;
    }
    if (ds === `${slug}-audits`) { const o = audits.opinions.find((x) => `${x.entity}:${x.fy}` === id); ok(o, `${ref}: no such opinion`); return o.opinion; }
    throw new Error(`${ref}: unknown dataset`);
  };
  test(`${slug} conflicts: schema`, () => { const out = check(counties.schema('conflicts'), reg, `${slug}-conflicts`); ok(out.length === 0, out.slice(0, 5).join('; ')); });
  test(`${slug} conflicts: ids are unique`, () => { const ids = reg.conflicts.map((c) => c.id); ok(new Set(ids).size === ids.length, 'duplicate case id'); });
  reg.conflicts.forEach((c) => test(`${slug} conflict ${c.id}`, () => {
    ok(Array.isArray(c.observations) && c.observations.length === c.values.length, 'observations must name one record per value, in order');
    const vals = c.observations.map(value);
    c.values.forEach((v, i) => ok(typeof v.value === 'number' && near(v.value, vals[i]), `value ${i} (${v.value}) differs from ${c.observations[i]} (${vals[i]})`));
    ok(new Set(c.values.map((v) => v.value)).size >= 2, 'the values do not differ');
    ok(c.values.every((v) => /^https:\/\//.test(v.url) && v.label.length > 5), 'every value needs a label and a source address');
    ok(!c.page_image_checked, 'page_image_checked: no person has viewed the pages yet');
    ok(c.verification_state !== 'reviewed' || (c.reviewer && c.reviewed_on), 'reviewed without a reviewer');
    if (c.status === 'resolved') ok(c.verification_state === 'resolved_by_source' && c.register, 'a resolved case must be resolved by the source and say what it changed');
    // Ledger cases: exist, and compare exactly two of this case's observations.
    (c.ledger_cases || []).forEach((k) => {
      ok(D[k], `ledger case ${k} is not in the fiscal ledger`);
      const pair = [D[k].claim_a.observation_id, D[k].claim_b.observation_id].map((x) => `${slug}-fiscal-ledger|${x}`);
      ok(pair.every((x) => c.observations.includes(x)), `ledger case ${k} compares observations outside this case`);
    });
    // Same measure and year within a fiscal case.
    const lo = c.observations.filter((x) => x.startsWith(`${slug}-fiscal-ledger|`)).map((x) => L[x.split('|')[1]]);
    if (lo.length) ok(lo.every((o) => o.measure === lo[0].measure && o.fy === lo[0].fy), 'a fiscal case mixes measures or years');
  }));
  test(`${slug} conflicts: every open ledger discrepancy is in the register`, () => {
    const covered = new Set(reg.conflicts.flatMap((c) => c.ledger_cases || []));
    const missing = ledger.discrepancies.filter((d) => !covered.has(d.case_id)).map((d) => d.case_id);
    ok(missing.length === 0, `not in the register: ${missing.join(', ')}`);
  });
});

const failed = results.filter(([, e]) => e);
failed.forEach(([n, e]) => console.error(`  FAIL ${n}: ${e}`));
if (failed.length) { console.error(`test-county-reconciliation: ${failed.length} of ${results.length} tests failed`); process.exit(1); }
console.log(`test-county-reconciliation: ${results.length} tests passed (one per conflict case, counties: ${counties.withKind('conflicts').filter((s) => s !== 'siaya').join(', ')})`);
