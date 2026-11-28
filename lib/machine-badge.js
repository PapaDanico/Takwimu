// What a page may say about a machine cross-check (data/machine-checks.json): "Machine cross-checked" when a second
// machine reading by a different method found the value on the page, "Machine check differs" when it did not, or
// nothing. Never "Approved": a machine reading is not editorial review (scripts/test-machine-checks.js). Server and build only.
let machine = { checks: [] };
try { machine = require('../data/machine-checks.json'); } catch (e) { /* not generated yet */ }
const MC = {};
(machine.checks || []).forEach((c) => { MC[`${c.dataset}|${c.id}`] = c; });
function badgeOf(c) {
  if (!c || c.result === 'not checkable') return null;
  return {
    result: c.result,
    label: c.result === 'agree' ? 'Machine cross-checked' : 'Machine check differs',
    method: c.method,
    title: c.result === 'agree'
      ? `A second machine reading (${c.method}) of PDF p. ${c.pdf_page} found this value. This is not editorial review.`
      : `A second machine reading (${c.method}) of PDF p. ${c.pdf_page} did not find this value; it is first in the review queue. This is not editorial review.`,
  };
}
function machineBadge(dataset, id) { return badgeOf(MC[`${dataset}|${id}`]); }
// The same badge from another county's machine-check file (lib/county-registry.js review.machine_checks).
function machineBadgeFrom(file) {
  const m = {};
  ((file && file.checks) || []).forEach((c) => { m[`${c.dataset}|${c.id}`] = c; });
  return (dataset, id) => badgeOf(m[`${dataset}|${id}`]);
}
const machineCounts = () => (machine.checks || []).reduce((c, x) => { c[x.result] = (c[x.result] || 0) + 1; return c; }, {});
module.exports = { machine, machineBadge, machineBadgeFrom, machineCounts };
