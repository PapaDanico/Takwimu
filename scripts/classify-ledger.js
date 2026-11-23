#!/usr/bin/env node
// Classification of every open discrepancy case in data/siaya-fiscal-ledger.json (owner item 2, 23 Nov 2026).
// Writes data/ledger-classes.json: one entry per case with a class, a one-line reason and the evidence it rests on.
//   definitional           the two values count different things (FIF in or out, revenue estimates against the
//                          expenditure budget, County Executive against the whole county government, bills of the
//                          year left out), as the documents themselves state
//   period or version      a different date, budget version or vintage (a later report restating the year)
//   probable source error  one document, one date, two figures, and the document itself does not reconcile them
//   resolved by source     a printed source settles which figure is internally consistent (logged in
//                          data/conflicts.json and tested in scripts/test-reconciliation.js)
//   open                   nothing printed explains the difference yet
// A class is Takwimu's reading of the documents, not an editorial decision: both values stay as printed, the case
// stays open in the ledger, and no value changes state. Run: node scripts/classify-ledger.js (deterministic).
const fs = require('fs');
const path = require('path');

const L = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-fiscal-ledger.json'), 'utf8'));
const by = Object.fromEntries(L.observations.map((o) => [o.id, o]));
const CLASSES = ['definitional', 'period or version', 'probable source error', 'resolved by source', 'open'];

const ev = (o) => `${o.id}: ${o.source_id} PDF p. ${o.pdf_page}${o.original_text ? ` ("${o.original_text.slice(0, 140)}")` : o.basis ? ` (${o.basis.slice(0, 140)})` : ''}`;
const has = (o, re) => re.test(`${o.basis || ''} ${o.note || ''}`);
const cobYear = (o) => (o.source_id.match(/^cob-report-(\d{4}-\d{2})$/) || [])[1];
const scopeOf = (o) => (/^county executive$/.test(o.scope) ? 'exec' : /executive and assembly/.test(o.scope) && !/not stated/.test(o.scope) ? 'all' : /County Executive only/.test(o.scope) ? 'exec' : null);

// Cases settled or classified by reading the documents (explicit, with the reason).
const EXPLICIT = {
  'D-L231-L232': ['resolved by source', 'The paper\'s Tables 9 and 11 both print development spending of 2,762,903,388, and with recurrent spending of 6,176,645,261 they add exactly to the printed total of 8,939,548,649; the 2,674,325,435 in the text on PDF p. 22 is the figure the tables do not support.', 'conflict cbrop-development-spending-2024-25'],
  'D-L251-L275': ['probable source error', 'Same report, same date: the text before Table 3.458 gives KSh 1.12 billion "as of 30 June 2025", which is the opening stock of 1 July 2024, while Table 3.457 on the same page gives a closing balance of 545,950,403.', 'conflict pending-close-2025'],
  'D-L273-L275': ['probable source error', 'The county\'s Q4 report prints 545,950,403.16 (opening stock less payments), as Table 3.457 of the Controller of Budget report does; the same CoB page\'s text gives 1.12 billion for 30 June 2025, the opening figure of the year.', 'conflict pending-close-2025'],
  'D-L256-L275': ['probable source error', 'Same report, same date, two different stocks: Table 2.9 prints 1,890.0 million for the County Executive and the county chapter text prints 1.12 billion; the report does not reconcile them.', 'conflict pending-close-2025'],
  'D-L251-L256': ['open', 'Same report, same date: Table 3.457 (545.95, opening less payments, new-bills column blank) against Table 2.9 (1,890.0, recurrent plus development). Leaving out new bills may explain it; the report does not say so.', 'conflict pending-close-2025'],
  'D-L256-L273': ['open', 'The county\'s Q4 figure (opening less payments, no new bills added) against the Controller of Budget\'s Table 2.9 stock; neither document explains the gap.', 'conflict pending-close-2025'],
  'D-L251-L274': ['definitional', 'The FY 2025/26 Q1 report\'s 1,473.85 at 1 July 2025 adds the County Assembly\'s KSh 81 million and includes bills of FY 2024/25; Table 3.457\'s 545.95 is the County Executive\'s opening stock less payments, with no new bills added.', 'L274 basis; L251 note'],
  'D-L273-L274': ['definitional', 'Same county, two reports: the Q4 figure is the opening stock less payments with no new bills added; the next quarter\'s 1,473,850,073 is Executive 1,392,002,915 plus the Assembly, new bills included.', 'L273 and L274 printed text'],
  'D-L025-L047': ['definitional', 'The county Q4 report states that its 10,542,130,283 are revenue estimates including a balance brought forward of KSh 1,568,905,262; the Controller of Budget figure is the expenditure budget, which the same county report gives as 9,761,123,387 (PDF p. 6).', 'L047, L048'],
  'D-L037-L047': ['definitional', 'Revenue estimates including the balance brought forward (L047) against the expenditure budget (L037, which matches the county\'s own 9,761,123,387 on PDF p. 6).', 'L047, L048'],
  'D-L047-L048': ['definitional', 'Same report: page 2 gives revenue estimates including the balance brought forward; page 6 gives the expenditure (planned) budget.', 'L047, L048'],
  'D-L093-L101': ['definitional', 'The Controller of Budget figure (874.01) equals the county\'s "expected receipts at 30 June 2024" (874,012,300, Q4 PDF p. 3); 950,205,559 is the approved revenue estimate.', 'L102'],
  'D-L093-L105': ['definitional', 'Expected receipts (874.01, as in the county Q4 report) against the approved baseline estimate of 950,205,559 printed in the FY 2024/25 paper.', 'L102, L105'],
  'D-L101-L102': ['definitional', 'Same report: approved revenue estimates (p. 2) against expected receipts at 30 June 2024 (p. 3).', 'L101, L102'],
  'D-L102-L105': ['definitional', 'Expected receipts at 30 June 2024 against the approved baseline estimate.', 'L102, L105'],
  'D-L263-L264': ['probable source error', 'The Auditor-General reports that the county\'s Annex II (818,803,232) and its supporting schedules (738,755,483) do not agree, on the same page of the audit report.', 'audit-2021-22 PDF p. 48'],
  'D-L266-L267': ['probable source error', 'The Auditor-General reports that the county\'s Annex 2 (741,559,698) and its supporting schedules (766,110,894) do not agree, on the same page of the audit report.', 'audit-2022-23 PDF p. 44'],
  'D-L145-L149': ['open', 'Case osr-2023-24: the later report does not give a split, and the gap is not explained by facility income alone (610.74 minus 388.63 is 222.11, not 427.95).', 'conflict osr-2023-24'],
  'D-L138-L145': ['open', 'Case osr-2023-24: the FY 2024/25 report quotes 427.95 for the prior year without a split; the gap is not explained by facility income alone.', 'conflict osr-2023-24'],
  'D-L145-L159': ['open', 'Case osr-2023-24: the county\'s 601.68 includes FIF, Linda Mama and NHIF capitation; the later CoB figure of 427.95 gives no basis.', 'conflict osr-2023-24'],
  'D-L145-L174': ['open', 'Case osr-2023-24: the county\'s later chart gives 610.74, as the year\'s own CoB report does; the 427.95 in the next CoB report is unexplained.', 'conflict osr-2023-24'],
  'D-L159-L174': ['period or version', 'The county\'s FY 2025/26 Q4 report restates FY 2023/24 as 610.74, the Controller of Budget\'s figure, in place of the 601.68 in its own FY 2023/24 Q4 report.', 'L159, L174'],
  'D-L132-L171': ['definitional', 'The county\'s later chart is a total series of own-source revenue plus A-i-A, FIF and health income; the Controller of Budget\'s FY 2020/21 figure does not say what it includes.', 'L171 basis'],
  'D-L123-L143': ['period or version', 'A later Controller of Budget report (FY 2018/19 chart) restates FY 2015/16 own-source revenue.', 'L143; conflict osr-2015-16'],
  'D-L131-L144': ['open', 'Case osr-2019-20: the Controller of Budget and the county\'s Budget Review and Outlook Paper differ by 2.7 per cent; neither explains it.', 'conflict osr-2019-20'],
  'D-L044-L045': ['definitional', 'Different entity scope: the county paper gives the whole county government\'s final budget; the Senate committee quotes the County Executive\'s final budget from the audit.', 'L044, L045 scope'],
  'D-L117-L119': ['period or version', 'Different budget versions: supplementary budget targets against the original approved budget.', 'L117, L119'],
  'D-L178-L179': ['period or version', 'Different budget versions: supplementary budget against the original approved budget.', 'L178, L179'],
  'D-L165-L169': ['period or version', 'Different budget versions in county documents: original estimates against the supplementary estimates column.', 'L165, L169'],
  'D-L156-L165': ['open', 'The Controller of Budget\'s target (927.34) matches neither the county\'s original estimates (1,044.06) nor its supplementary estimates (1,669.37).', 'L156, L165, L169; conflict budget-financing-osr-2024-25'],
  'D-L156-L169': ['open', 'The Controller of Budget\'s target matches neither county estimates column; budget version not stated by the CoB.', 'L156, L165, L169; conflict budget-financing-osr-2024-25'],
  'D-L289-L290': ['period or version', 'The next year\'s Controller of Budget report quotes a different FY 2021/22 compensation figure from the year\'s own report.', 'L289, L290'],
  'D-L297-L298': ['period or version', 'The county\'s FY 2025/26 report quotes FY 2024/25 compensation a year later (3,340) against the Budget Review and Outlook Paper\'s 3,402.98.', 'L297, L298'],
  'D-L162-L170': ['period or version', 'The county\'s FY 2025/26 report quotes FY 2024/25 own-source revenue a year later (712.82) against 757.57 in its earlier documents.', 'L162, L170'],
  'D-L166-L170': ['period or version', 'The county\'s FY 2025/26 report quotes FY 2024/25 own-source revenue a year later (712.82) against 757.57 in its Q4 report.', 'L166, L170'],
  'D-L243-L244': ['period or version', 'The FY 2021/22 report restates the stock at 30 June 2021 as its opening balance (602.08) against 1,060.92 in the FY 2020/21 report.', 'L243, L244; conflict pending-2021'],
  'D-L245-L246': ['period or version', 'The FY 2022/23 report restates the stock at 30 June 2022 as its opening balance (840.67) against 705.38 in the year\'s own report.', 'L245, L246; conflict pending-2022'],
  'D-L247-L248': ['period or version', 'The FY 2023/24 report restates the stock at 30 June 2023 (761.29) against 873.38 in the year\'s own report.', 'L247, L248; conflict pending-2023'],
};

function classify(d) {
  const a = by[d.claim_a.observation_id];
  const b = by[d.claim_b.observation_id];
  if (EXPLICIT[d.case_id]) { const [cls, reason, evidence] = EXPLICIT[d.case_id]; return { cls, reason, evidence: [evidence, ev(a), ev(b)] }; }
  const out = (cls, reason) => ({ cls, reason, evidence: [ev(a), ev(b)] });
  // Bills of the year left out (the FY 2023/24 report says so).
  const excl = [a, b].find((o) => has(o, /Excludes bills incurred|excluding bills incurred|excludes bills incurred/i));
  if (excl && d.indicator_id === 'pending_bills_close') return out('definitional', `${excl.id} excludes bills incurred during the year, as the FY 2023/24 report states (PDF p. ${excl.pdf_page}); the other value is a full stock.`);
  // FIF / A-i-A in or out (county documents add hospital income the Controller of Budget counts separately).
  if (/^osr_/.test(d.indicator_id) && [a, b].some((o) => has(o, /A-i-A|A-I-A|SHA|SHIF|Linda Mama|NHIF/)) && a.source_kind !== b.source_kind) {
    return out('definitional', 'The county figure counts all appropriations-in-aid, including hospital receipts from SHA/SHIF, Linda Mama and NHIF capitation; the Controller of Budget counts own-source revenue with its narrower FIF/A-i-A line.');
  }
  // Entity scope stated and different (County Executive only against the whole county government).
  const sa = scopeOf(a); const sb = scopeOf(b);
  const scopeText = (o) => (/County Executive only/.test(o.scope) ? 'the County Executive only (the quarterly lines of the county report; its chapter heading says Executive and Assembly)' : o.scope === 'county executive' ? 'the County Executive only' : 'the whole county government (Executive and Assembly)');
  if (sa && sb && sa !== sb) return out('definitional', `Different entity scope: ${a.id} covers ${scopeText(a)}; ${b.id} covers ${scopeText(b)}.`);
  // A label the document does not define ("wage bill" in a key-issues paragraph).
  if ([a, b].some((o) => has(o, /basis not defined/))) return out('open', 'One value is a "wage bill" figure in a key-issues paragraph that does not say what it counts; the other is personnel emoluments spent. Nothing printed reconciles them.');
  // A later Controller of Budget report restating the year.
  if (cobYear(a) && cobYear(b) && cobYear(a) !== cobYear(b)) return out('period or version', `Two Controller of Budget reports of different years give the same date different values (FY ${cobYear(a).replace('-', '/')} and FY ${cobYear(b).replace('-', '/')} reports); the later report restates it.`);
  // Management statements inside the audited financial statements count something they do not define.
  if ([a, b].some((o) => has(o, /County management statement/))) return out('open', 'One value is the county management\'s own statement inside the audited financial statements, which does not say what it counts; nothing printed reconciles it with the other figure.');
  // Same document, one scope stated (Executive and Assembly) and the other not stated.
  if (a.source_id === b.source_id && (sa || sb) && !(sa && sb)) return out('open', `Both are printed in ${a.source_id} (PDF p. ${a.pdf_page} and p. ${b.pdf_page}); one covers ${scopeText(sa ? a : b)} and the other does not state its scope, so the difference may be one of scope. Not confirmed.`);
  // One document, one date, two figures, no basis difference given.
  if (a.source_id === b.source_id && a.measure === b.measure && !(a.budget_version && b.budget_version && a.budget_version !== b.budget_version)) {
    return out('probable source error', `Both values are printed in ${a.source_id} for the same measure and year (PDF p. ${a.pdf_page} and p. ${b.pdf_page}), and the document does not reconcile them.`);
  }
  return out('open', `${({ controller_of_budget: 'Controller of Budget', county: 'County Government', auditor_general: 'Auditor-General', senate_quoting_auditor_general: 'Senate committee' })[a.source_kind]} against ${({ controller_of_budget: 'Controller of Budget', county: 'County Government', auditor_general: 'Auditor-General', senate_quoting_auditor_general: 'Senate committee' })[b.source_kind]}; neither document states a basis that explains a ${d.difference.pct_of_smaller} per cent difference.`);
}

const cases = L.discrepancies.map((d) => { const c = classify(d); return { case_id: d.case_id, measure: d.indicator_id, period: d.period, classification: c.cls, reason: c.reason, evidence: c.evidence }; });
cases.forEach((c) => { if (!CLASSES.includes(c.classification)) throw new Error(`${c.case_id}: bad class`); });
Object.keys(EXPLICIT).forEach((k) => { if (!L.discrepancies.some((d) => d.case_id === k)) throw new Error(`EXPLICIT ${k} is not a ledger case`); });
const counts = Object.fromEntries(CLASSES.map((k) => [k, cases.filter((c) => c.classification === k).length]));
const out = {
  meta: {
    title: 'Classification of the open discrepancy cases in the Siaya fiscal ledger',
    rule: 'One entry per case in data/siaya-fiscal-ledger.json discrepancies. The class is Takwimu\'s reading of what the documents print, with the reason and the pages it rests on; it is not an editorial decision. Both values stay as printed, the case stays in the ledger, and no value changes review state. A case is "resolved by source" only when a printed source settles it; each such case is logged in data/conflicts.json and tested in scripts/test-reconciliation.js.',
    classes: {
      definitional: 'The two values count different things (for example FIF in or out, revenue estimates against the expenditure budget, County Executive against the whole county government, bills of the year left out), as the documents themselves state.',
      'period or version': 'A different date, budget version or vintage: for example a later report restating the year, or the original against the supplementary budget.',
      'probable source error': 'One document gives two figures for the same thing and date and does not reconcile them, or the auditor reports that the county\'s records disagree.',
      'resolved by source': 'A printed source settles which figure is internally consistent.',
      open: 'Nothing printed explains the difference yet.',
    },
    generated_by: 'scripts/classify-ledger.js',
    updated: '2026-11-23',
    counts,
    total: cases.length,
  },
  cases,
};
fs.writeFileSync(path.join(__dirname, '..', 'data', 'ledger-classes.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log('classify-ledger:', JSON.stringify(counts), 'total', cases.length);
