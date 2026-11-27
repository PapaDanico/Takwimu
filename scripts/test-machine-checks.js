#!/usr/bin/env node
// Machine cross-checks and review packs (owner item 1, 23 Nov 2026). Fails the build when:
//  - a record in data/reviews.json cites the machine cross-checks as its basis (a machine reading is not review);
//  - a machine check could change any value's state: no value may be APPROVED without an approved review record of
//    its own, lib/review-status.js must not read data/machine-checks.json, and the page label of a machine check is
//    never "Approved";
//  - data/machine-checks.json does not cover exactly the Siaya-scope values, or its counts do not add up;
//  - the review packs are stale, or a pack template has a decision or a reviewer role filled in.
// Run: node scripts/test-machine-checks.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const rs = require('../lib/review-status');
const pack = require('../lib/review-pack');
const ed = require('../lib/editorial');

const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };

// 1. No review record may rest on a machine check.
const CITES_MACHINE = /machine[\s-]*(cross[\s-]*)?check|machine-checks(\.json)?|machine reading|second machine|automated cross-check|tesseract|pdftotext/i;
const citesMachine = (r) => CITES_MACHINE.test(JSON.stringify(r));
ok(citesMachine({ rationale: 'Agrees with the machine cross-check (data/machine-checks.json).' }) && citesMachine({ basis: 'machine-checks' }) && !citesMachine({ rationale: 'Approved budget total on PDF page 510 matches the stored value.' }), 'the machine-citation detector no longer behaves as expected (not vacuous)');
read('data/reviews.json').decisions.forEach((r) => ok(!citesMachine(r), `${r.id}: a review record may not cite the machine cross-checks as its basis`));

// 2. A machine check never moves a value to APPROVED.
const src = fs.readFileSync(path.join(ROOT, 'lib', 'review-status.js'), 'utf8');
ok(!/machine-checks|machine-badge|machineBadge|editorial'\)/.test(src), 'lib/review-status.js must not read the machine cross-checks');
const approvedRecords = new Set(rs.inForce.filter((r) => r.decision === 'approved').flatMap((r) => r.record_ids.map((id) => `${r.dataset}|${id}`)));
const mc = read('data/machine-checks.json');
mc.checks.forEach((c) => {
  const s = rs.stateOf(c.dataset, c.id);
  ok(s, `${c.dataset} ${c.id}: machine check for a value that does not exist`);
  if (s && s.state === 'APPROVED') ok(approvedRecords.has(`${c.dataset}|${c.id}`), `${c.dataset} ${c.id}: APPROVED without an approved review record of its own`);
  const b = ed.machineBadge(c.dataset, c.id);
  ok(!b || !/approv/i.test(`${b.label} ${b.title}`.replace(/not editorial review/i, '')), `${c.dataset} ${c.id}: machine-check label must not say approved`);
  ok(!b || /not editorial review/.test(b.title), `${c.dataset} ${c.id}: machine-check label must say it is not editorial review`);
});

// 3. Coverage and counts.
const scope = pack.all();
const keys = new Set(scope.map((e) => `${e.dataset}|${e.id}`));
const mkeys = new Set(mc.checks.map((c) => `${c.dataset}|${c.id}`));
ok(mkeys.size === mc.checks.length, 'machine-checks: duplicate entries');
ok([...keys].every((k) => mkeys.has(k)), `machine-checks: ${[...keys].filter((k) => !mkeys.has(k)).length} Siaya-scope values have no entry (run node scripts/machine-check.js)`);
ok([...mkeys].every((k) => keys.has(k)), 'machine-checks: entries for values outside the Siaya scope or removed');
const cnt = mc.checks.reduce((c, x) => { c[x.result] = (c[x.result] || 0) + 1; return c; }, {});
ok(JSON.stringify(Object.keys(cnt).sort().map((k) => [k, cnt[k]])) === JSON.stringify(Object.keys(mc.meta.counts).sort().map((k) => [k, mc.meta.counts[k]])), 'machine-checks: meta.counts do not match the checks');
mc.checks.forEach((c) => {
  if (c.result === 'not checkable') ok(c.reason, `${c.id}: not checkable without a reason`);
  else ok(c.method && c.source_sha256 && c.pdf_page && c.original_method && c.method !== c.original_method, `${c.id}: a check needs a method different from the original, the document hash and the page`);
  if (c.result === 'agree') ok(c.matched, `${c.id}: agree without the string found`);
  // The second method differs from the first: text layer -> OCR, OCR -> text layer or another OCR mode.
  if (c.result !== 'not checkable' && /^PDF text layer/.test(c.original_method)) ok(/^tesseract/.test(c.method), `${c.id}: a text-layer value must be checked by OCR`);
  if (c.result !== 'not checkable' && /^OCR/.test(c.original_method)) ok(/^(pdf-text-layer|tesseract-600dpi-psm4|tesseract-(300|200)dpi-)/.test(c.method), `${c.id}: an OCR value must be checked by the text layer or another OCR mode`);
  // A sum of printed parts agrees only with every part found and the parts adding up (23 Nov 2026).
  if (c.parts) ok(c.result === 'agree' && c.parts.length >= 2 && c.matched === c.parts.join(' + '), `${c.id}: parts listed without an agreeing sum`);
});
// Values the check disagrees with lead the review queue.
const queue = fs.readFileSync(path.join(ROOT, 'docs', 'editorial', 'REVIEW_QUEUE.md'), 'utf8');
const firstH2 = (queue.match(/^## .*$/m) || [''])[0];
ok(/machine cross-check disagrees/.test(firstH2), 'REVIEW_QUEUE.md: the machine-check disagreements must be the first section');
mc.checks.filter((c) => c.result === 'disagree').forEach((c) => ok(queue.indexOf(`\`${c.id}\``) > -1 && queue.indexOf(`\`${c.id}\``) < queue.indexOf('## Counts per dataset'), `REVIEW_QUEUE.md: ${c.id} (machine check disagrees) is not at the top`));

// 4. Review packs: up to date, one per dataset in scope, templates blank where a person must decide.
const { build } = require('./review-packs');
const out = build();
ok(fs.existsSync(path.join(ROOT, 'data', 'review-packs.json')) && fs.readFileSync(path.join(ROOT, 'data', 'review-packs.json'), 'utf8') === out.json, 'data/review-packs.json is out of date: run node scripts/review-packs.js');
Object.entries(out.md).forEach(([ds, t]) => { const f = path.join(ROOT, 'docs', 'editorial', 'packs', `${ds}.md`); ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8') === t, `docs/editorial/packs/${ds}.md is out of date: run node scripts/review-packs.js`); });
const packs = JSON.parse(out.json);
ok(packs.entries.length === scope.length, 'review packs: not one entry per Siaya-scope value');
packs.entries.forEach((e) => {
  ok(e.template.decision === '' && e.template.reviewer_role === '' && e.template.rationale === '' && e.template.date === '', `${e.record_id}: a pack template may not carry a decision, role, rationale or date`);
  ok(e.template.reviewer_is_not_extractor === true, `${e.record_id}: template must carry reviewer_is_not_extractor`);
  ok(e.source.length > 0 || ['history', 'siaya-analysis', 'siaya-analysis-layers'].includes(e.dataset), `${e.record_id}: no source listed`);
});
const h = packs.meta.counts.history;
ok(h === rs.counts('history').total, 'review packs: history count differs from the review counts');

if (errors.length) {
  console.error(`test-machine-checks: ${errors.length} of ${checks} checks failed`);
  errors.slice(0, 40).forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-machine-checks: ${checks} checks passed (${mc.checks.length} values: ${cnt.agree || 0} agree, ${cnt.disagree || 0} disagree, ${cnt['not checkable'] || 0} not checkable; ${packs.entries.length} pack entries; no review record cites a machine check)`);
