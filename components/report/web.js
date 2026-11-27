// Web edition of a report (duplication sweep D13, D23, D24; owner decision 27 Nov 2026). The PDF and the print route
// (/reports/<slug>/print/) keep the full, standalone report. The web page shows only what is unique to the report:
//  - a table that a Siaya sector page holds in full (records, conflicting values, side-by-side pairs) becomes a
//    one-line summary and a link to that page, which is the canonical home of the table and of its research notes;
//  - a block that another report also prints is shown once, in the report that owns it (specialist reports B to E
//    before the compendium A), and the others link to it;
//  - gap lists whose full text is on a sector page or on /method/ become a count and a link (scripts/test-reports.js
//    checks that the linked page lists every one of them);
//  - the bibliography lists only the documents cited by the figures still on the page.
// Nothing is recalculated: kept blocks are the same objects the print edition renders.
import registry from './reports.json';
import { buildReport, SLUGS, figsOf, reviewState } from './build';
import { source } from './model';

const OWNER_ORDER = ['B', 'C', 'D', 'E', 'A'];
// Tables whose full version lives on a sector page (the section's first canonical topic page).
const SECTOR_TYPES = new Set(['records', 'conflicts', 'pairs']);
// Gap lists printed in full on a site page (checked against the built page by scripts/test-reports.js).
export const GAP_HOME = {
  'history.json': { href: '/method/#known-gaps', label: 'Method, known gaps' },
  'siaya-health.json': { href: '/counties/siaya/health/#hl-gaps', label: 'Siaya health, gaps' },
  'siaya-education.json': { href: '/counties/siaya/education/#ed-gaps', label: 'Siaya education, gaps' },
  'siaya-agriculture.json': { href: '/counties/siaya/agriculture/#ag-gaps', label: 'Siaya agriculture, gaps' },
  'siaya-climate.json': { href: '/counties/siaya/climate/#cl-gaps', label: 'Siaya climate, gaps' },
  'siaya-economy.json': { href: '/counties/siaya/economy/#eco-gaps', label: 'Siaya economy, gaps' },
  'siaya-programmes.json': { href: '/counties/siaya/programmes/#pg-gaps', label: 'Siaya programmes, gaps' },
  'siaya-projects.json': { href: '/counties/siaya/projects/#pr-gaps', label: 'Siaya projects, gaps' },
  'siaya-audits.json': { href: '/counties/siaya/audits/#aud-gaps', label: 'Siaya audits, years with no report' },
  'siaya-fiscal-ledger.json': { href: '/counties/siaya/ledger/#gap-reasons', label: 'Siaya ledger, missing values' },
};

const ptrs = (b) => figsOf([b]).map((f) => `${f.file}#${f.ptr}`);
const plain = (parts) => (parts || []).map((p) => (p && typeof p === 'object' ? `#${p.file}${p.ptr}` : String(p))).join('');
function keyOf(b) {
  switch (b.type) {
    case 'p': return `p|${b.text}`;
    case 'list': return `list|${b.items.map(plain).join('\n')}`;
    case 'records': return `records|${b.caption}|${JSON.stringify(b.rows.map((r) => (r[0] && typeof r[0] === 'object' ? ptrs({ r }) : String(r[0]))))}|${ptrs(b)}`;
    case 'conflicts': return `conflicts|${b.groups.map((g) => g.topic).join('|')}|${ptrs(b)}`;
    // Tables and charts: the same figures are the same block, whatever the caption.
    default: return `${b.type === 'chart' ? 'chart' : 'figs'}|${ptrs(b).sort().join(',')}`;
  }
}
// Texts the linked page must also show (scripts/test-reports.js): row keys, case topics or the note itself.
function checkTexts(b) {
  if (b.check) return b.check;
  if (b.type === 'records') return b.rows.map((r) => r[0]).filter((c) => typeof c === 'string');
  const head = (t) => String(t || '').trim().slice(0, 60);
  if (b.type === 'conflicts') return b.groups.map((g) => head(g.note)).filter((t) => t.length > 20);
  if (b.type === 'pairs') return b.rows.map((r) => r.id).filter(Boolean);
  if (b.type === 'p') return [b.text];
  return figsOf([b]).map((f) => f.value).filter((v) => typeof v === 'string' && v.length > 3);
}
const countOf = (b) => (b.type === 'conflicts' ? `${b.groups.length} ${b.groups.length === 1 ? 'case' : 'cases'}` : `${b.rows.length} ${b.rows.length === 1 ? 'row' : 'rows'}`);

let INDEX = null;
// key -> [{ letter, slug, sectionId, sectionNo, sectionTitle }] over the print editions of all five reports.
function index() {
  if (INDEX) return INDEX;
  INDEX = new Map();
  SLUGS.forEach((slug) => {
    const r = buildReport(slug);
    r.sections.forEach((s, i) => s.findings.forEach((b) => {
      const k = keyOf(b);
      if (!INDEX.has(k)) INDEX.set(k, []);
      INDEX.get(k).push({ letter: r.meta.letter, slug, sectionId: s.id, sectionNo: i + 1, sectionTitle: s.title });
    }));
  });
  return INDEX;
}
const ownerOf = (k) => [...(index().get(k) || [])].sort((a, b) => OWNER_ORDER.indexOf(a.letter) - OWNER_ORDER.indexOf(b.letter))[0];

function webBlock(b, s, letter) {
  const what = b.caption || b.title || '';
  if (SECTOR_TYPES.has(b.type) && s.topics && s.topics.length) {
    const t = b.home || s.topics[0];
    return { type: 'moved', text: `${what}: ${countOf(b)}`, href: t.href, label: t.label, check: checkTexts(b) };
  }
  const o = ownerOf(keyOf(b));
  if (o && o.letter !== letter) {
    return { type: 'moved', text: b.type === 'p' ? 'Shared note' : `${what}${b.rows ? `: ${countOf(b)}` : ''}`, href: `/reports/${o.slug}/#${o.sectionId}`, label: `Report ${o.letter}, section ${o.sectionNo} (${o.sectionTitle})`, check: checkTexts(b) };
  }
  return b;
}

const CACHE = {};
export function buildWebReport(slug) {
  if (CACHE[slug]) return CACHE[slug];
  const r = buildReport(slug);
  if (!r) return null;
  const sections = r.sections.map((s) => ({ ...s, findings: s.findings.map((b) => webBlock(b, s, r.meta.letter)) }));
  const shown = sections.map((s) => ({ ...s, findings: s.findings.filter((b) => b.type !== 'moved') }));
  const figs = figsOf(shown);
  const ids = [...new Set(figs.map((f) => f.source).filter(Boolean))].sort();
  const gapGroups = [];
  r.gaps.forEach((g) => {
    let grp = gapGroups.find((x) => x.file === g.file);
    if (!grp) { grp = { file: g.file, home: GAP_HOME[g.file] || null, rows: [] }; gapGroups.push(grp); }
    grp.rows.push(g);
  });
  CACHE[slug] = {
    ...r,
    edition: r.edition,
    web: true,
    sections,
    figs,
    bibliography: ids.filter((id) => source(id)).map((id) => source(id)),
    described: ids.filter((id) => !source(id)),
    gapGroups,
    moved: sections.reduce((n, s) => n + s.findings.filter((b) => b.type === 'moved').length, 0),
    reviewState: reviewState(figs),
    draft: r.draft,
  };
  return CACHE[slug];
}

export const REPORT_LETTERS = registry.reports.map((x) => x.letter);
