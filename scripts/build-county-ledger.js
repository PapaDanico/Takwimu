#!/usr/bin/env node
// Recomputes the derived parts of a county fiscal ledger (lib/county-registry.js): the discrepancy cases (every pair
// of values for the same measure and year that differ by more than the threshold) and the completeness matrix,
// keeping the gap reasons already written. Fails when a missing cell has no reason: a gap is listed, never filled.
// Deterministic. Run: node scripts/build-county-ledger.js --county kisumu   Check only: add --check
const fs = require('fs');
const path = require('path');
const counties = require('../lib/county-registry');
const { computeDiscrepancies, computeCompleteness } = require('./test-fiscal-ledger');

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const slug = arg('--county');
if (!slug || slug === 'siaya') { console.error('usage: node scripts/build-county-ledger.js --county <slug> (Siaya\'s ledger is built by its own scripts)'); process.exit(2); }
const file = counties.abs(counties.file(slug, 'ledger'));
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const measures = Object.keys(data.measures);
data.discrepancies = computeDiscrepancies(data.observations, data.meta.threshold_pct);
const comp = computeCompleteness(data.observations, measures, data.years);
const missingReason = [];
measures.forEach((m) => data.years.forEach((fy) => {
  const old = (data.completeness[m] || {})[fy] || {};
  const c = comp[m][fy];
  if (c.missing) { if (old.reason) c.reason = old.reason; else missingReason.push(`${m} ${fy}`); }
}));
data.completeness = comp;
if (missingReason.length) { console.error(`build-county-ledger: gaps without a reason (write one in completeness): ${missingReason.join(', ')}`); process.exit(1); }
const out = `${JSON.stringify(data, null, 1)}\n`;
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file, 'utf8') !== out) { console.error(`build-county-ledger: ${path.relative(counties.ROOT, file)} is out of date (run without --check)`); process.exit(1); }
  console.log(`build-county-ledger [${slug}]: up to date`);
} else {
  fs.writeFileSync(file, out);
  console.log(`build-county-ledger [${slug}]: ${data.observations.length} values, ${data.discrepancies.length} discrepancy cases, ${measures.length} measures x ${data.years.length} years`);
}
