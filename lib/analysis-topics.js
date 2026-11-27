// Siaya analysis topic pages (design review P1-2, 27 Nov 2026). /counties/siaya/analysis/ was one 140,000px page;
// it is now a short index and one page per topic under /counties/siaya/analysis/<slug>/. `sections` are the old in-page
// anchors each topic now holds: the index keeps an element with each of those ids linking to the new page, and its
// inline script forwards any old anchor in `ids` (sections and the tables inside them) to the same anchor there.
const BASE = '/counties/siaya/analysis/';

const ANALYSIS_TOPICS = [
  {
    slug: 'latest', title: 'Latest year', nav: 'Latest year',
    summary: 'Three spending findings for the most recent years and the latest budget by part, each figure with its document and page.',
    sections: [['latest', 'Latest year']],
    ids: ['latest', 'latest-h', 'pulse-findings', 'pulse-total', 'pulse-development', 'pulse-recurrent', 'spending-chart-link', 'latest-parts'],
  },
  {
    slug: 'spending', title: 'Spending and share of budget spent', nav: 'Spending',
    summary: 'Share of budget spent over ten years, unspent budget, growth after prices, printed beside recalculated rates, the wage bill, development share and absorption by department.',
    sections: [['spent', 'Share of budget spent'], ['unspent', 'Unspent budget'], ['growth', 'Growth'], ['an-a3', 'Printed and recalculated'], ['an-b1', 'Wage bill'], ['an-b2', 'Development share'], ['an-b4', 'Absorption by department']],
    ids: ['spent', 'spent-h', 'spread', 'spread-table', 'unspent', 'unspent-h', 'growth', 'growth-h', 'growth-table', 'an-a3', 'exec-side', 'calc-a3', 'an-b1', 'b1-table', 'calc-b1', 'an-b2', 'b2-table', 'calc-b2', 'an-b4', 'b4-inputs'],
  },
  {
    slug: 'revenue', title: 'Revenue: transfers and own-source revenue', nav: 'Revenue',
    summary: 'Dependence on national transfers by kind of document, and the make-up of own-source revenue (ordinary revenue and health facility receipts), with all 47 counties.',
    sections: [['an-a2', 'Transfers'], ['an-a8', 'Own-source revenue parts']],
    ids: ['an-a2', 'calc-a2', 'an-a8', 'osr-composition', 'osr-parts', 'osr-dispute-parts', 'calc-a8'],
  },
  {
    slug: 'pending-bills', title: 'Pending bills', nav: 'Pending bills',
    summary: 'Ten years of unpaid bills at year end, the roll-forward, stocks and changes by source, and pending bills as a share of revenue.',
    sections: [['pending', 'Pending bills, ten years'], ['an-a4', 'Pending bills by source'], ['an-b5', 'Pending bills burden']],
    ids: ['pending', 'pending-h', 'pending-disputed', 'rollforward', 'rollforward-h', 'pending-2025-sources', 'pending-2025-summary', 'an-a4', 'calc-a4-stock', 'calc-a4-change', 'an-b5', 'b5-table', 'b5-oag', 'calc-b5'],
  },
  {
    slug: 'audit-findings', title: 'Audit findings that recur', nav: 'Audit recurrence',
    summary: 'Audit findings by category, entity and year, and the findings carried over, unresolved or repeated.',
    sections: [['an-a5', 'Audit recurrence']],
    ids: ['an-a5', 'audit-matrix', 'calc-a5'],
  },
  {
    slug: 'per-person', title: 'Per person, services and climate finance', nav: 'Per person',
    summary: 'Real spending per person, sector budgets beside service indicators (context, not causation), and climate finance beside hotspot wards.',
    sections: [['an-a1', 'Per person'], ['an-a6', 'Budget beside services'], ['an-a7', 'Climate finance']],
    ids: ['an-a1', 'calc-a1', 'an-a6', 'context-not-causation', 'calc-a6', 'an-a7', 'calc-a7'],
  },
  {
    slug: 'gaps', title: 'Gaps and their reasons', nav: 'Gaps',
    summary: 'Every calculation that has no value, with the reason: nothing is filled or averaged.',
    sections: [['an-gaps', 'Gaps']],
    ids: ['an-gaps', 'gap-list'],
  },
];

const topicHref = (slug, id) => `${BASE}${slug}/${id ? `#${id}` : ''}`;
const topicOf = (slug) => ANALYSIS_TOPICS.find((t) => t.slug === slug);
// Old anchor -> new URL, for every id a topic holds.
const MOVED_ANCHORS = Object.fromEntries(ANALYSIS_TOPICS.flatMap((t) => t.ids.map((id) => [id, topicHref(t.slug, id)])));

module.exports = { ANALYSIS_BASE: BASE, ANALYSIS_TOPICS, topicHref, topicOf, MOVED_ANCHORS };
