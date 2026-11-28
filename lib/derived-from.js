// derived_from of a Takwimu calculation (data/siaya-analysis.json, data/siaya-analysis-layers.json; census 28 Nov 2026):
// a calculation has no page of its own, so it names the records it is computed from instead. Each entry is
// "<dataset>:<id>" for an itemised observation (lib/review-status.js inputRef; that record carries the page), or
// "<file>#<record>[.<field>]" for an input that is not itemised (CPI, county profile, roll-forward). Sorted, no repeats.
// A calculation with no input (a gap) has derived_from [] and its gap_reason says why. Validators accept a non-empty
// derived_from in place of a page (scripts/test-siaya-analysis.js, scripts/test-analysis-layers.js, scripts/census.js).
const { inputRef } = require('./review-status');

// A count of audit findings (family A5, calc.op "count") is taken over every finding of its entity and year, so those
// findings are what it derives from, including when the count is zero and no finding is listed as an input.
let FINDINGS = null;
const findingsOf = (entity, fy) => {
  if (!FINDINGS) FINDINGS = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'siaya-audits.json'), 'utf8')).findings;
  return FINDINGS.filter((f) => f.entity === entity && f.fy === fy).map((f) => `siaya-audits:${f.id}`);
};

function derivedFrom(rec) {
  const refs = (rec.inputs || []).map((i) => {
    const r = inputRef(i);
    if (r) return `${r.dataset}:${r.id}`;
    const file = String(i.dataset || '').replace(/^data\//, '');
    return `${file}#${i.record || ''}${i.field ? `.${i.field}` : ''}`;
  });
  if (rec.calc && rec.calc.op === 'count' && rec.flags && rec.flags.entity && rec.flags.fy) refs.push(...findingsOf(rec.flags.entity, rec.flags.fy));
  return [...new Set(refs)].sort();
}

// Problems with a record's derived_from: it must equal derivedFrom(rec), each itemised entry must be an observation
// (items: { dataset: Set(ids) }), and an empty list needs a gap with a reason.
function derivedFromProblems(rec, items) {
  const out = [];
  const want = derivedFrom(rec);
  if (!Array.isArray(rec.derived_from) || JSON.stringify(rec.derived_from) !== JSON.stringify(want)) out.push(`derived_from is not ${JSON.stringify(want)}`);
  want.filter((x) => !x.includes('#')).forEach((x) => { const [ds, ...rest] = x.split(':'); if (!(items[ds] && items[ds].has(rest.join(':')))) out.push(`derived_from ${x} is not an observation`); });
  if (!want.length && !(rec.status === 'gap' && rec.result === null && String(rec.gap_reason || rec.caveat || '').trim())) out.push('no input and no gap reason');
  return out;
}

module.exports = { derivedFrom, derivedFromProblems };
