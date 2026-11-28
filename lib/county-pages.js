// View models for the county pages that come from the registry (app/counties/[slug]/: hub, ledger, audits, people,
// sources), for every county whose state is "published" in lib/county-states.js and whose files live under
// data/counties/<slug>/. Siaya keeps its own pages and libraries. Nothing here reads a file kind that the county's
// `public_kinds` allowlist does not list (fail closed). The ledger view reuses lib/ledger.js with the county's own
// review badges (lib/county-review.js), machine checks and correction notes; every value keeps its public review
// label ("Provisional: awaiting editorial review" until a record in data/reviews.json says otherwise), source,
// publication date, period, unit, confidence and page. Server and build only.
const counties = require('./county-registry');
const cr = require('./county-review');
const { bySlug } = require('./counties');
const { ledger: buildLedger, pageUrlIn, READ } = require('./ledger');
const { machineBadgeFrom } = require('./machine-badge');
const { notesFor } = require('./correction-notes');
const { CLASS_ORDER } = require('./editorial');

const PAGE_TITLES = { '': 'County hub', ledger: 'Fiscal reconciliation', audits: 'Audit opinions', people: 'Population', sources: 'Sources' };

function guard(slug, kind) {
  if (!counties.ON_PAGES.includes(slug)) throw new Error(`county-pages: ${slug} is not published (lib/county-states.js)`);
  if (kind && !counties.isPublicKind(slug, kind)) throw new Error(`county-pages: ${slug} ${kind} is not in public_kinds`);
}
const load = (slug, kind) => { guard(slug, kind); return counties.has(slug, kind) ? counties.load(slug, kind) : null; };

const meta = (slug) => { guard(slug); const c = bySlug(slug); return { slug, name: c.name, code: c.code, code3: String(c.code).padStart(3, '0'), pages: counties.pages(slug) }; };
const nav = (slug) => meta(slug).pages.map((p) => [`/counties/${slug}/${p ? `${p}/` : ''}`, PAGE_TITLES[p] || p]);

const MC = {};
const machine = (slug) => {
  if (!MC[slug]) { let f = { checks: [] }; try { f = JSON.parse(require('fs').readFileSync(counties.abs(counties.COUNTY_DATA[slug].review.machine_checks), 'utf8')); } catch (e) { /* none yet */ } MC[slug] = machineBadgeFrom(f); }
  return MC[slug];
};

// Conflict register of the county (data/counties/<slug>/conflicts.json): both values side by side, never chosen.
// The "effect" field is an internal note written before publication and is not shown.
function conflicts(slug) {
  const C = load(slug, 'conflicts');
  if (!C) return [];
  return C.conflicts.map((c) => ({ id: c.id, measure: c.measure, unit: c.unit, values: c.values, definitions: c.definitions, hypothesis: c.hypothesis, status: c.status, page_image_checked: Boolean(c.page_image_checked), ledger_cases: c.ledger_cases || [] }));
}

function ledger(slug) {
  const L = load(slug, 'ledger');
  const dataset = cr.datasetName(slug, 'ledger');
  const mb = machine(slug);
  const BY_LEDGER = {};
  conflicts(slug).forEach((c) => c.ledger_cases.forEach((id) => { (BY_LEDGER[id] = BY_LEDGER[id] || []).push(c.id); }));
  const h = {
    dataset, L, pageUrl: pageUrlIn(L),
    badge: (id) => cr.badge(slug, dataset, id), machine: (id) => mb(dataset, id), notes: (id) => notesFor(dataset, id),
    classOf: {}, curated: (id) => BY_LEDGER[id] || [],
    classCounts: () => Object.fromEntries(CLASS_ORDER.map((k) => [k, k === 'open' ? L.discrepancies.length : 0])),
    // Shown beside each value on the county pages (components/LedgerTables.js reads these only when present).
    extra: (o) => {
      const b = cr.badge(slug, dataset, o.id) || {};
      const s = L.sources[o.source_id] || {};
      return { refDataset: dataset, state_label: b.label, disputed: Boolean(b.disputed), needs_page_check: Boolean(o.needs_page_check), published: s.publication_date || 'not stated', period: `FY ${o.fy}`, conflictHref: `/counties/${slug}/ledger/#conflicts` };
    },
  };
  const l = buildLedger(h);
  return { ...l, dataset, conflictBase: `/counties/${slug}/ledger/` };
}

// Audit opinions, one row per fiscal year and one column per audited entity, as printed; secondary summaries say so.
function audits(slug) {
  const A = load(slug, 'audits');
  const dataset = cr.datasetName(slug, 'audits');
  const mb = machine(slug);
  const docs = Object.fromEntries(A.documents.map((d) => [d.doc_id, d]));
  const entityKeys = Object.keys(A.meta.entities).filter((k) => A.opinions.some((o) => o.entity === k) || A.gaps.some((g) => g.entity === k));
  const opinions = A.opinions.map((o) => {
    const d = docs[o.doc_id] || {};
    const id = `opinion:${o.entity}:${o.fy}`;
    const b = cr.badge(slug, dataset, id) || {};
    return {
      id, entity: o.entity, fy: o.fy, opinion: o.opinion, tier: o.tier, quote: o.quote || '', note: o.opinion_note || '', page: o.page, confidence: o.confidence,
      read: READ[o.read_method] || o.read_method || 'not recorded', needs_page_check: Boolean(o.needs_page_check), doc: d.title || o.doc_id, url: d.url || null,
      issuer: d.issuer || '', report_date: d.report_date || null, date_note: d.date_note || '', period: d.period || `FY ${o.fy}`,
      review: b, state_label: b.label, machine: mb(dataset, id),
    };
  });
  const years = [...new Set([...opinions.map((o) => o.fy), ...A.gaps.map((g) => g.fy)])].sort();
  return { dataset, meta: A.meta, entities: entityKeys.map((k) => ({ key: k, label: A.meta.entities[k] })), years, opinions, gaps: A.gaps, caveats: A.caveats, documents: A.documents.length };
}

function people(slug) {
  const P = load(slug, 'population');
  const dataset = cr.datasetName(slug, 'population');
  const mb = machine(slug);
  const src = P.sources;
  const points = P.points.map((p) => {
    const s = src[p.source.source_id] || {};
    const b = cr.badge(slug, dataset, p.id) || {};
    return { ...p, src_title: s.title || p.source.source_id, src_url: s.url || null, publisher: s.publisher || '', published: s.publication_date || 'not stated', read: READ[p.source.read_method] || p.source.read_method, review: b, state_label: b.label, machine: mb(dataset, p.id), also: (p.also_printed_in || []).map((x) => ({ ...x, title: (src[x.source_id] || {}).title || x.source_id, url: (src[x.source_id] || {}).url || null })) };
  });
  const sub = P.by_sub_county ? { ...P.by_sub_county, src_title: (src[P.by_sub_county.source.source_id] || {}).title, src_url: (src[P.by_sub_county.source.source_id] || {}).url, published: (src[P.by_sub_county.source.source_id] || {}).publication_date || 'not stated' } : null;
  return { dataset, meta: P.meta, points, sub, denominator: P.denominator || null, print_differences: P.print_differences || [], gaps: P.gaps || [] };
}

// Every document cited on the county's pages, with its hash where held.
function sources(slug) {
  guard(slug);
  const out = {};
  const add = (id, s, kinds) => { if (!out[id]) out[id] = { id, title: s.title || id, publisher: s.publisher || s.issuer || '', published: s.publication_date || s.report_date || 'not stated', period: s.reference_period || s.period || '', url: s.url || null, sha256: s.sha256 || null, licence: s.licence || '', used_on: new Set() }; kinds.forEach((k) => out[id].used_on.add(k)); };
  const L = load(slug, 'ledger');
  if (L) { const used = new Set(L.observations.map((o) => o.source_id)); Object.entries(L.sources).filter(([id]) => used.has(id)).forEach(([id, s]) => add(id, s, ['ledger'])); }
  const A = load(slug, 'audits');
  if (A) { const used = new Set(A.opinions.map((o) => o.doc_id)); A.documents.filter((d) => used.has(d.doc_id)).forEach((d) => add(d.doc_id, { ...d, publisher: d.issuer }, ['audits'])); }
  const P = load(slug, 'population');
  if (P) Object.entries(P.sources).forEach(([id, s]) => add(id, s, ['people']));
  return Object.values(out).map((s) => ({ ...s, used_on: [...s.used_on] })).sort((a, b) => a.title.localeCompare(b.title));
}

const counts = (slug) => { guard(slug); return cr.counts(slug); };
const datasets = (slug) => { guard(slug); return cr.datasets(slug); };

module.exports = { meta, nav, ledger, audits, people, sources, conflicts, counts, datasets, PAGE_TITLES, ON_PAGES: counties.ON_PAGES };
