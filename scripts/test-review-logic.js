#!/usr/bin/env node
// Unit tests for the editorial review resolver (lib/review-status.js) and the libraries and report rules that read it.
// Each case loads the libraries afresh against an in-memory review register (data/reviews.json is never written) or
// with synthetic rejections in the environment (TAKWIMU_SYNTHETIC_REJECTIONS), and checks one rule:
// rejections hold whatever the hash, approval needs a matching hash and approved inputs, disputed stays disputed,
// derived values follow their inputs, withdrawn values are not shown or counted anywhere they are summarised.
// Run: node scripts/test-review-logic.js
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.join(__dirname, '..');
const REVIEWS = require.resolve('../data/reviews.json');
const realReviews = JSON.parse(fs.readFileSync(REVIEWS, 'utf8'));
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };
const ZERO = '0'.repeat(64);

// Load a module from lib/ or components/ against a given register and synthetic rejections.
function fresh({ decisions = [], synthetic = [] } = {}) {
  Object.keys(require.cache).forEach((k) => {
    if (k === REVIEWS || k.startsWith(path.join(root, 'lib') + path.sep) || k.startsWith(path.join(root, 'components') + path.sep)) delete require.cache[k];
  });
  const m = new Module(REVIEWS);
  m.filename = REVIEWS; m.loaded = true; m.exports = { ...realReviews, decisions };
  require.cache[REVIEWS] = m;
  process.env.TAKWIMU_SYNTHETIC_REJECTIONS = JSON.stringify(synthetic);
  return (mod) => require(path.join(root, mod));
}
let n = 0;
const rec = (dataset, ids, source, sha, decision, extra = {}) => ({ id: `REV-2026-${String(++n).padStart(3, '0')}`, dataset, record_ids: ids, source_document_id: source, source_sha256: sha, reviewer_role: 'editor', reviewer_is_not_extractor: true, decision, rationale: 'Unit test record.', date: '2026-11-21', supersedes: [], ...extra });

const base = fresh()('lib/review-status.js');
const section = (name, fn) => { try { fn(); } catch (e) { ok(false, `${name}: ${e.message.split('\n')[0]}`); } };

// 2. A rejection holds whatever the hash (fail closed); only approval needs the hash to match.
section('2', () => {
  const id = 'years:2016/17:approved';
  const rs = fresh({ decisions: [rec('history', [id], 'cob-report-2016-17', ZERO, 'rejected')] })('lib/review-status.js');
  ok(rs.stateOf('history', id).state === 'REJECTED', `2: a rejection with a different source hash must stay REJECTED (got ${rs.stateOf('history', id).state})`);
  const ds = base.DATASET_IDS.find((d) => base.observations(d).some((i) => i.sources.length && i.sources.every((s) => !base.sourceHash(d, s))));
  const un = ds && base.observations(ds).find((i) => i.sources.length && i.sources.every((s) => !base.sourceHash(ds, s)));
  ok(Boolean(un), '2: test needs an observation whose sources have no stored hash');
  if (un) {
    const rs2 = fresh({ decisions: [rec(ds, [un.id], un.sources[0], null, 'rejected')] })('lib/review-status.js');
    ok(rs2.stateOf(ds, un.id).state === 'REJECTED', `2: a rejection of an unanchored value (${ds} ${un.id}) must hold (got ${rs2.stateOf(ds, un.id).state})`);
    const rs3 = fresh({ decisions: [rec(ds, [un.id], un.sources[0], null, 'approved')] })('lib/review-status.js');
    ok(rs3.stateOf(ds, un.id).state !== 'APPROVED', '2: an unanchored value can never be approved');
  }
  const rs4 = fresh({ decisions: [rec('history', [id], 'cob-report-2016-17', ZERO, 'approved')] })('lib/review-status.js');
  ok(rs4.stateOf('history', id).state === 'REVIEW_PENDING', '2: an approval with a different hash goes back to the queue');
});

// 3. A document listed twice keeps the hash, whichever list names it first.
section('3', () => ['siaya-brop-2019-20', 'senate-fiduciary-annexes-2018'].forEach((doc) => {
  const lib = require('../data/source-library.json').documents.find((d) => d.document_id === doc);
  ok(Boolean(lib && lib.sha256) && base.sourceHash('history', doc) === lib.sha256, `3: ${doc} has a stored hash in the source library, but the resolver holds ${base.sourceHash('history', doc)}`);
}));

// 4. Calculations resolve the documents of every dataset; source ids are clean document ids.
section('4', () => {
  const items = base.observations('siaya-analysis');
  const ids = [...new Set(items.flatMap((i) => i.sources))];
  ok(ids.every((s) => !/[()]/.test(s) && s === s.trim()), `4: malformed source ids in siaya-analysis: ${ids.filter((s) => /[()]/.test(s)).join(', ')}`);
  ok(ids.includes('GOV-01'), '4: "GOV-01 (CIDP 2023-2027)" resolves to GOV-01');
  const others = base.DATASET_IDS.filter((d) => d !== 'siaya-analysis');
  ids.forEach((s) => {
    const h = others.map((d) => base.sourceHash(d, s)).find(Boolean);
    if (h) ok(base.sourceHash('siaya-analysis', s) === h, `4: siaya-analysis cannot see the hash of ${s} held by another dataset`);
  });
});

// 5. Derived history values are withheld with their inputs.
section('5', () => {
  const fy = '2016/17';
  const rs = fresh({ synthetic: [`history|years:${fy}:recurrent_spent`, `history|years:${fy}:development_budget`] })('lib/review-status.js');
  const y = rs.masked('history').years.find((x) => x.fy === fy);
  ok(y.recurrent_absorption_pct === null && rs.stateOf('history', `years:${fy}:recurrent_absorption_pct`).state === 'REJECTED', '5: recurrent absorption is withheld when recurrent spending is rejected');
  ok(y.recurrent_budget === null && y.development_absorption_pct === null, '5: recurrent budget (approved minus development) and development absorption are withheld when the development budget is rejected');
  ok(y.approved !== null && y.spent !== null, '5: other values of the year stay');
});

// 12. A calculation is approved only when every input is approved.
section('12', () => {
  const calc = base.observations('siaya-analysis').find((i) => i.inputs.length && i.sources.some((s) => base.sourceHash('siaya-analysis', s)));
  const src = calc.sources.find((s) => base.sourceHash('siaya-analysis', s));
  const rs = fresh({ decisions: [rec('siaya-analysis', [calc.id], src, base.sourceHash('siaya-analysis', src), 'approved')] })('lib/review-status.js');
  ok(rs.stateOf('siaya-analysis', calc.id).state !== 'APPROVED', `12: ${calc.id} is approved although its inputs are pending`);
  const inputs = calc.inputs.map((x) => { const it = base.observations(x.dataset).find((o) => o.id === x.id); const s = it.sources.find((q) => base.sourceHash(x.dataset, q)); return rec(x.dataset, [x.id], s, base.sourceHash(x.dataset, s), 'approved'); });
  const rs2 = fresh({ decisions: [rec('siaya-analysis', [calc.id], src, base.sourceHash('siaya-analysis', src), 'approved'), ...inputs] })('lib/review-status.js');
  ok(rs2.stateOf('siaya-analysis', calc.id).state === 'APPROVED', `12: ${calc.id} with every input approved is approved (got ${rs2.stateOf('siaya-analysis', calc.id).state})`);
});

// 13. A value the data file marks disputed stays disputed when its record no longer matches the source.
section('13', () => {
  const item = base.observations('siaya-fiscal-ledger').find((i) => i.disputed);
  const rs = fresh({ decisions: [rec('siaya-fiscal-ledger', [item.id], item.sources[0], ZERO, 'approved')] })('lib/review-status.js');
  ok(rs.stateOf('siaya-fiscal-ledger', item.id).state === 'DISPUTED', `13: disputed ${item.id} became ${rs.stateOf('siaya-fiscal-ledger', item.id).state} after a hash mismatch`);
});

// 10. The provisional tag stays until every value is approved.
section('10', () => ok(typeof base.isProvisional === 'function' && base.isProvisional({ total: 3, approved: 0, pending: 0, rejected: 3 }) && base.isProvisional({ total: 3, approved: 2, pending: 1, rejected: 0 }) && !base.isProvisional({ total: 2, approved: 2, pending: 0, rejected: 0 }), '10: isProvisional(counts) is true while approved < total'));

// 6. A withdrawn project shows no status anywhere, and is not counted by status.
section('6', () => {
  const id = 'SIA-P-001';
  const req = fresh({ synthetic: [`siaya-projects|${id}`] });
  const pr = req('lib/projects.js');
  const row = pr.projectRows().find((p) => p.id === id);
  const ds = pr.datasetRows().find((p) => p.id === id);
  ok(row.status === '' && row.status_source.doc === '' && ds.status === '' && ds.status_doc === '', '6: a withdrawn project still exposes its status (rows or CSV)');
  ok(pr.STATES.reduce((s, x) => s + x.count, 0) === pr.pub.projects.length - 1, '6: status counts include a withdrawn project');
});

// 7. A withdrawn audit finding: the title is the value; masked, and left out of every count.
section('7', () => {
  const all = require('../data/siaya-audits.json').findings;
  const f = all.find((x) => x.entity === 'county_executive');
  const req = fresh({ synthetic: [`siaya-audits|${f.id}`] });
  const au = req('lib/audits.js');
  const rs = req('lib/review-status.js');
  const a = au.audits();
  const row = a.findings.find((x) => x.id === f.id);
  ok(row.title !== f.title && /withdrawn after editorial review/i.test(row.title) && row.category === null, `7: withdrawn finding ${f.id} still shows its title or category`);
  ok(rs.masked('siaya-audits').findings.find((x) => x.id === f.id).title === null, '7: published copy keeps the withdrawn title');
  const cell = a.opinions.find((o) => o.fy === f.fy).executive;
  const kept = all.filter((x) => x.entity === 'county_executive' && x.fy === f.fy).length - 1;
  ok(cell.findings === kept && cell.withdrawn === 1, `7: opinion cell counts ${cell.findings} findings (expected ${kept}) and ${cell.withdrawn} withdrawn`);
  const orig = require('../data/siaya-audits.json').recurrence_by_category.county_executive[f.category][f.fy] || 0;
  const m = (a.matrix.county_executive[f.category] || {})[f.fy] || 0;
  ok(m === orig - 1, `7: category matrix still counts the withdrawn finding (${m}, held ${orig})`);
  const d = au.datasetRows().find((x) => x.finding_id === f.id);
  ok(d.title === '' && d.category === '', '7: dataset row keeps the withdrawn title or category');
  ok(typeof au.withdrawnText === 'function' && au.withdrawnText(1) === '1 finding withdrawn after review' && au.withdrawnText(2) === '2 findings withdrawn after review' && au.withdrawnText(0) === '', '7: withdrawnText(n) says "1 finding withdrawn after review"');
});

// 8. Economy: the largest activity is named from the data; a withdrawn activity stays in the list, marked.
section('8', () => {
  const eco = require('../data/siaya-economy.json');
  const latest = eco.observations.filter((o) => o.vintage === 'GCP2025' && o.indicator === 'gva_by_activity').map((o) => o.period).sort().pop();
  const top = eco.observations.filter((o) => o.vintage === 'GCP2025' && o.indicator === 'gva_by_activity' && o.period === latest && o.value >= 0).sort((x, y) => y.value - x.value);
  const e0 = fresh()('lib/economy.js').economy();
  ok(e0.largest && e0.largest.id === top[0].id, '8: economy() names the largest activity (largest)');
  const e = fresh({ synthetic: [`siaya-economy|${top[0].id}`] })('lib/economy.js').economy();
  ok(e.largest && e.largest.id === top[1].id, `8: with ${top[0].sector} withdrawn the largest shown is ${top[1].sector} (got ${e.largest && e.largest.sector})`);
  const w = e.activities.find((x) => x.id === top[0].id);
  ok(Boolean(w) && w.withdrawn === true && w.value === null, '8: a withdrawn activity stays in the chart and table, marked withdrawn');
});

// 9. Programme grant totals are withheld when any record they sum is withdrawn.
section('9', () => {
  const g = require('../data/siaya-programmes.json').summary.siaya_development_partner_grants_kes;
  const rs = fresh({ synthetic: [`siaya-programmes|${g[0].record_ids[0]}`] })('lib/review-status.js');
  const m = rs.masked('siaya-programmes').summary.siaya_development_partner_grants_kes;
  ok(m.every((x, i) => (g[i].record_ids.includes(g[0].record_ids[0]) ? x.total === null && x.withheld === true : x.total === g[i].total)), '9: a grant total that sums a withdrawn programme is not withheld in the published copy');
});

// 15. A withdrawn county cell reads "withdrawn", not "(blank)".
section('15', () => {
  const cr = fresh()('lib/compare-rows.js');
  ok(typeof cr.rawText === 'function' && cr.rawText({ st: 'withdrawn', raw: '' }) === 'withdrawn' && cr.rawText({ st: 'read', raw: '' }) === '(blank)' && cr.rawText({ st: 'unverified', raw: 'x' }) === 'Not yet verified' && cr.rawText({ st: 'read', raw: '12' }) === '12', '15: rawText(cell) says "withdrawn" for a withdrawn cell');
});

// 14, 16, 17. Report rules (components/report/rules.js).
section('14, 16, 17', () => {
  const rules = fresh()('components/report/rules.js');
  const pend = { label: 'Provisional: awaiting editorial review', approved: false, hide: false };
  const appr = { label: 'Approved', approved: true, hide: false, state: 'approved' };
  const rej = { label: 'Withdrawn after editorial review', approved: false, hide: true, state: 'rejected' };
  ok(/provisional/i.test(rules.conflictNote([{ review: pend }, { review: null }])) && !/provisional/i.test(rules.conflictNote([{ review: appr }, { review: appr }])) && /withdrawn/i.test(rules.conflictNote([{ review: appr }, { review: rej }])), '14: the conflict note follows the review states of its rows');
  const ops = [{ entity: 'county_assembly', fy: '2024/25' }, { entity: 'county_executive', fy: '2023/24' }, { entity: 'county_executive', fy: '2019/20' }];
  ok(rules.latestOpinion(ops, 'county_executive') === 1 && rules.latestOpinion(ops, 'county_assembly') === 0 && rules.latestOpinion([], 'county_executive') === -1, '16: latestOpinion() picks the latest year for one entity, not the last array entry');
  ok(/none of the values held/i.test(rules.smallCountSentence([{ suppress: false }])) && /suppressed/i.test(rules.smallCountSentence([{ suppress: true }])) && !/none of the values held/i.test(rules.smallCountSentence([{ suppress: false }, { suppress: true }])), '17: the small-count sentence is computed from the figures');
});

// 1. The report snapshot covers the review register and the documents it is checked against.
section('1', () => {
  const snap = fresh()('components/report/snapshot.js');
  const a = snap.snapshot(['siaya-programmes.json'], root);
  ok(['data/reviews.json', 'data/source-manifest.json', 'data/source-library.json'].every((f) => a.files.some((x) => x.file === f)) && a.files.some((x) => /review state/.test(x.file)), '1: snapshot lists reviews.json, source-manifest.json, source-library.json and the review state');
  const prog = require('../data/siaya-programmes.json').programmes[0].id;
  const b = fresh({ synthetic: [`siaya-programmes|${prog}`] })('components/report/snapshot.js').snapshot(['siaya-programmes.json'], root);
  ok(a.id !== b.id, '1: the snapshot ID changes when a review state changes');
});

// 19. history.csv uses the shared CSV cell (formula guard; numbers stay numeric).
section('19', () => {
  const csv = require('../lib/csv');
  ok(typeof csv.cell === 'function' && csv.cell('=1+1') === '"\'=1+1"' && csv.cell(-1.5) === '"-1.5"' && csv.cell('-2') === '"-2"' && csv.cell(null) === '', '19: lib/csv.js cell() guards formulas and keeps numbers');
  const src = fs.readFileSync(path.join(root, 'scripts/build-data.js'), 'utf8');
  const body = src.slice(src.indexOf('function writeHistoryCsv'), src.indexOf('}());', src.indexOf('function writeHistoryCsv')));
  ok(/require\('\.\.\/lib\/csv'\)\.cell/.test(body) && !/const q = \(v\) => \(v === undefined/.test(body), '19: history.csv quotes cells with lib/csv.js cell(), not its own unguarded quoting');
});

fresh();
delete process.env.TAKWIMU_SYNTHETIC_REJECTIONS;
if (errors.length) {
  console.error(`test-review-logic: ${errors.length} problem(s)`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-review-logic: OK (${checks} checks)`);
