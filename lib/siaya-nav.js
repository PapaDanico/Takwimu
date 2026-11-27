// Siaya page groups (owner decision U6, 21 Nov 2026). Used by the hub's link list and by the Related block on every
// Siaya page (components/SiayaRelated.js). Topic pages and reports cite each other: health <-> C, programmes <-> E,
// analysis/ledger/audits <-> B, economy/agriculture <-> D, every page <-> A.
import { ANALYSIS_TOPICS } from './analysis-topics';

const S = '/counties/siaya/';
export const SIAYA_GROUPS = [
  { label: 'Money', links: [[`${S}insights/`, 'Ten-year overview'], [`${S}analysis/`, 'Analysis: share of budget spent, pending bills, per person'], [`${S}ledger/`, 'Fiscal reconciliation and own-source revenue'], [`${S}departments/`, 'Department budgets and spending'], [`${S}audits/`, 'Audit findings'], [`${S}projects/`, 'Development projects']] },
  // Analysis topic pages (design review P1-2): the index is in Money; each topic has its own page.
  { label: 'Analysis by topic', links: ANALYSIS_TOPICS.map((t) => [`${S}analysis/${t.slug}/`, t.title]) },
  { label: 'People and services', links: [[`${S}people/`, 'People'], [`${S}health/`, 'Health'], [`${S}education/`, 'Education'], [`${S}economy/`, 'Economy'], [`${S}agriculture/`, 'Agriculture']] },
  { label: 'Places', links: [[`${S}wards/`, 'Wards, constituencies and sub-counties'], [`${S}climate/`, 'Climate, water and resilience']] },
  { label: 'Accountability', links: [[`${S}governance/`, 'Transparency and participation'], [`${S}programmes/`, 'Development partners and NGOs']] },
  { label: 'Evidence', links: [[`${S}sources/`, 'Source library'], ['/reports/', 'Publications: brief and reports']] },
];

const R = (slug, letter, title) => [`/reports/${slug}/`, `Report ${letter}: ${title}`];
const A = R('siaya-evidence-compendium', 'A', 'Evidence Compendium');
const B = R('siaya-fiscal-accountability', 'B', 'Fiscal Accountability and Budget Execution');
const C = R('siaya-health-community-services', 'C', 'Health and Community Services');
const D = R('siaya-development-opportunities', 'D', 'Development and Investment Opportunities');
const E = R('siaya-programme-atlas', 'E', 'Programme Atlas');
const P = (k) => SIAYA_GROUPS.flatMap((g) => g.links).find(([h]) => h === `${S}${k}/`);

export const SIAYA_RELATED = {
  '': [B, A, P('insights')],
  insights: [P('analysis'), P('ledger'), B, A],
  analysis: [P('ledger'), P('departments'), P('audits'), B, A],
  departments: [P('analysis'), P('ledger'), B, A],
  ledger: [P('analysis'), P('departments'), P('audits'), B, A],
  audits: [P('analysis'), P('projects'), B, A],
  projects: [P('audits'), P('wards'), A],
  people: [P('health'), P('wards'), C, A],
  health: [P('people'), P('wards'), C, A],
  education: [P('people'), P('economy'), A],
  economy: [P('agriculture'), P('people'), D, A],
  agriculture: [P('economy'), P('climate'), D, A],
  wards: [P('climate'), P('people'), A],
  climate: [P('wards'), P('agriculture'), A],
  governance: [P('audits'), P('programmes'), A],
  programmes: [P('governance'), P('projects'), E, A],
  ...Object.fromEntries(ANALYSIS_TOPICS.map((t) => [`analysis/${t.slug}`, [[`${S}analysis/`, 'Siaya analysis: all topics'], ...(t.slug === 'revenue' ? [P('ledger')] : t.slug === 'audit-findings' ? [P('audits')] : t.slug === 'spending' ? [P('departments'), P('insights')] : t.slug === 'pending-bills' ? [P('ledger')] : t.slug === 'per-person' ? [P('people'), P('climate')] : []), B, A]])),
  sources: [['/reports/', 'Publications'], A],
  brief: [['/reports/', 'Publications'], P('insights'), A],
};
