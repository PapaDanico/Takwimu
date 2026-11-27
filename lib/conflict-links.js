// Links between the two discrepancy registers (duplication sweep D03). data/conflicts.json is the curated register
// (shown on /data/#conflicts); data/siaya-fiscal-ledger.json "discrepancies" are machine-classified pairs of ledger
// observations (shown on /counties/siaya/ledger/). A ledger case "touches" a curated case when both of its values,
// in KSh million, are values of that case (or its one value, when the case holds only one amount). Each curated
// case lists the ledger cases it covers in `ledger_cases`; scripts/test-reconciliation.js fails when a touching
// ledger case is not listed, or a listed one does not exist. The ledger file is not edited: its link back to the
// curated register is this reverse lookup.
const conflicts = require('../data/conflicts.json');
const ledger = require('../data/siaya-fiscal-ledger.json');

const r2 = (v) => Math.round(v * 100) / 100;
const toM = (c) => (/billion/i.test(c.unit || '') ? 1000 : /^KSh$/.test(c.unit || '') ? 1e-6 : 1);
const amounts = (c) => c.values.map((v) => v.value).filter((v) => typeof v === 'number').map((v) => r2(v * toM(c)));
const near = (xs, v) => xs.some((x) => Math.abs(x - v) < 0.006);

function touching(c) {
  if (!/^KSh/.test(c.unit || '')) return [];
  const xs = amounts(c);
  if (!xs.length) return [];
  return ledger.discrepancies.filter((d) => {
    const n = [d.claim_a.value_ksh_m, d.claim_b.value_ksh_m].filter((v) => typeof v === 'number' && near(xs, r2(v))).length;
    return n === 2 || (n === 1 && xs.length === 1);
  }).map((d) => d.case_id);
}

// ledger case id -> curated case ids that list it
const BY_LEDGER = {};
conflicts.conflicts.forEach((c) => (c.ledger_cases || []).forEach((id) => { (BY_LEDGER[id] = BY_LEDGER[id] || []).push(c.id); }));
const curatedFor = (ledgerCaseId) => BY_LEDGER[ledgerCaseId] || [];

module.exports = { touching, curatedFor };
