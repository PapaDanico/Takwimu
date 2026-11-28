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

const PAGE_TITLES = { '': 'County hub', ledger: 'Fiscal reconciliation', audits: 'Audit opinions', people: 'Population', indicators: 'Social and economic indicators', health: 'Health', wards: 'Wards and constituencies', sources: 'Sources' };

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
    classCounts: () => Object.fromEntries(CLASS_ORDER.map((k) => [k, k === 'unexplained' ? L.discrepancies.length : 0])),
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

// Indicators (poverty, household survey, water utility, statistical abstract, agriculture, fisheries): one table per
// domain, every value as printed with its kind (survey estimate, official statistic, publisher claim, proposed target),
// denominator, comparator and cell reference. Conflicts in the file are shown side by side; gaps are listed.
const DOMAIN_ORDER = ['poverty', 'household survey', 'statistical abstract', 'water utility', 'agriculture', 'fisheries'];
const DOMAIN_TITLE = { poverty: 'Poverty', 'household survey': 'Household survey (KDHS 2022)', 'statistical abstract': 'County Statistical Abstract', 'water utility': 'Water and sanitation utility', agriculture: 'Agriculture', fisheries: 'Fisheries' };
function indicators(slug) {
  const I = load(slug, 'indicators');
  const dataset = cr.datasetName(slug, 'indicators');
  const mb = machine(slug);
  const src = Object.fromEntries(I.sources.map((x) => [x.source_id, x]));
  const inConflict = {};
  I.conflicts.forEach((c) => c.observations.forEach((id) => { (inConflict[id] = inConflict[id] || []).push(c.id); }));
  const rows = I.observations.map((o) => {
    const s = src[o.source_id] || {};
    const b = cr.badge(slug, dataset, o.id) || {};
    return { ...o, src_title: s.title || o.source_id, src_url: s.url || null, publisher: s.publisher || '', published: s.publication_date || 'not stated', src_note: s.note || '', review: b, state_label: b.label, machine: mb(dataset, o.id), conflicts: inConflict[o.id] || [] };
  });
  const domains = [...new Set(rows.map((r) => r.domain))].sort((a, b) => (DOMAIN_ORDER.indexOf(a) + 99) % 99 - (DOMAIN_ORDER.indexOf(b) + 99) % 99 || a.localeCompare(b))
    .map((d) => ({ key: d, title: DOMAIN_TITLE[d] || d, rows: rows.filter((r) => r.domain === d) }));
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const conflictsList = I.conflicts.map((c) => ({ ...c, values: c.observations.map((id) => byId[id]).filter(Boolean) }));
  return { dataset, meta: I.meta, domains, conflicts: conflictsList, gaps: I.gaps, sources: I.sources.length };
}

// Wards and constituencies: the IEBC registry, the two boundary layers (ward polygons; constituencies as the union of
// their wards), registered voters by constituency (IEBC) and, apart, the 2019 census by KNBS sub-county. No county total is
// ever shared out to wards; a ward or sub-county without a reported value shows as not available.
function wards(slug) {
  const g = load(slug, 'geography');
  const fs = require('fs');
  const geo = counties.COUNTY_DATA[slug].geo;
  const rd = (f) => JSON.parse(fs.readFileSync(counties.abs(f), 'utf8'));
  const P = counties.isPublicKind(slug, 'population') ? load(slug, 'population') : null;
  const sub = P && P.by_sub_county ? P.by_sub_county : null;
  // KNBS sub-county figures stay keyed to the KNBS list (including Kadibo, printed ".."); they are never drawn on the
  // IEBC constituency map. Registered voters (IEBC) are keyed to the constituencies, the same hierarchy as the map.
  const census = sub ? { label: `Population, ${sub.year} census`, unit: 'persons', rows: g.knbs_sub_counties.map((k) => ({ ...k, value: sub.values[k.slug] ?? null })), source: P.sources[sub.source.source_id], ref: sub.source, note: sub.note } : null;
  const voters = { label: 'Registered voters, 2022', unit: 'persons', values: Object.fromEntries(g.constituencies.map((c) => [c.id, c.registered_voters_2022.value])), source: g.sources.find((s) => s.id === 'IEBC-ROV-2022') };
  return { g, wardsGeo: rd(geo.wards), consGeo: rd(geo.constituencies), census, voters };
}

// Statistical abstract tables (kind abstract), rebuilt as printed: one table per table_id, rows and columns in print
// order, each cell the value as printed with its review state and page. Only records the registry makes public
// (public_tables) are read; a table id outside the allowlist throws (fail closed).
function abstractTables(slug, tableIds) {
  const A = load(slug, 'abstract');
  const dataset = cr.datasetName(slug, 'abstract');
  const src = Object.fromEntries(A.sources.map((x) => [x.source_id, x]));
  return tableIds.map((t) => {
    const recs = A.observations.filter((o) => o.table_id === t);
    if (!recs.length || !recs.every((o) => counties.isPublicRecord(slug, 'abstract', o.id))) throw new Error(`county-pages: abstract table ${t} is not public for ${slug}`);
    const cols = [...new Set(recs.map((o) => o.column))];
    // A row label printed more than once (a "Total" after each sub-county's wards) is keyed by its occurrence in print
    // order and labelled with the sub-county of the rows above it; a repeat that cannot be placed throws.
    const knbs = Object.fromEntries(((counties.has(slug, 'geography') ? counties.load(slug, 'geography').knbs_sub_counties : []) || []).map((k) => [k.slug, k.name]));
    const rowKey = {};
    const rowLabel = {};
    const rows = [];
    cols.forEach((c) => {
      const seen = {};
      let group = null;
      recs.filter((o) => o.column === c).forEach((o) => {
        seen[o.row] = (seen[o.row] || 0) + 1;
        const key = `${o.row}#${seen[o.row]}`;
        rowKey[o.id] = key;
        if (o.sub_county) group = o.sub_county;
        if (!(key in rowLabel)) {
          const repeated = recs.filter((x) => x.column === c && x.row === o.row).length > 1;
          if (repeated && !/^total$/i.test(o.row)) throw new Error(`county-pages: ${t} repeats row "${o.row}" without a recorded dimension`);
          rowLabel[key] = repeated ? `${o.row}, ${knbs[group] || group || 'county'}` : o.row;
          rows.push(key);
        }
      });
    });
    const cell = {};
    recs.forEach((o) => {
      const b = cr.badge(slug, dataset, o.id) || {};
      cell[`${rowKey[o.id]}\u0000${o.column}`] = { id: o.id, v: o.value_as_printed ?? (o.value == null ? null : String(o.value)), review: b, state_label: b.label, needs_page_check: !/checked against the page image/.test(o.read_method || ''), page: o.pdf_page };
    });
    const s = src[recs[0].source_id] || {};
    const pages = [...new Set(recs.map((o) => o.pdf_page))].sort((a, b) => a - b);
    const printed = [...new Set(recs.map((o) => o.printed_page).filter(Boolean))].sort((a, b) => a - b);
    const notes = [...new Set(recs.map((o) => o.note).filter(Boolean))];
    return { id: t, title: recs[0].table, unit: recs[0].unit, kind: recs[0].kind, rows, rowLabel, cols, cell, src_title: s.title, src_url: s.url, published: s.publication_date || 'not stated', pages, printed, confidence: Math.min(...recs.map((o) => o.confidence)), read: [...new Set(recs.map((o) => o.read_method))].join('; '), notes, n: recs.length, sectorOf: recs[0].sector };
  });
}
const sectorTables = (slug, sector) => {
  const A = load(slug, 'abstract');
  return [...new Set(A.observations.filter((o) => o.sector === sector && counties.isPublicRecord(slug, 'abstract', o.id)).map((o) => o.table_id))];
};

// Registered voters by ward (KNBS abstract Table 1.7.1, a reproduction of IEBC figures), joined to the ward map by
// the IEBC ward slug only from that ward-level table; a ward the table does not print stays "not available".
function wardVoters(slug, year) {
  if (!counties.isPublicRecord(slug, 'abstract', `csa24-t1-7-1-kisumu-east-kolwa-east-${year}-male`)) return null;
  const A = load(slug, 'abstract');
  const recs = A.observations.filter((o) => o.table_id === 'csa24-1.7.1' && o.column === `${year}: Total`);
  const values = {};
  const unmatched = [];
  recs.forEach((o) => { if (o.ward_slug) values[o.ward_slug] = o.value; else unmatched.push({ row: o.row, value: o.value_as_printed }); });
  const src = A.sources.find((x) => x.source_id === recs[0].source_id) || {};
  return { values, unmatched, label: `Registered voters, ${year} (KNBS reproduction of IEBC figures)`, unit: 'persons', src_title: src.title, src_url: src.url, published: src.publication_date, table: recs[0].table, pdf_page: recs[0].pdf_page, printed_page: recs[0].printed_page, note: recs[0].note };
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
  const G = counties.isPublicKind(slug, 'geography') ? load(slug, 'geography') : null;
  if (G) G.sources.filter((s) => s.url).forEach((s) => add(s.id, { ...s, publication_date: s.published }, ['wards']));
  const AB = counties.isPublicKind(slug, 'abstract') ? load(slug, 'abstract') : null;
  if (AB) { const used = new Set(AB.observations.filter((o) => counties.isPublicRecord(slug, 'abstract', o.id)).map((o) => o.source_id)); AB.sources.filter((x) => used.has(x.source_id)).forEach((x) => add(x.source_id, x, ['health'])); }
  const I = counties.isPublicKind(slug, 'indicators') ? load(slug, 'indicators') : null;
  if (I) I.sources.forEach((s) => add(s.source_id, s, ['indicators']));
  return Object.values(out).map((s) => ({ ...s, used_on: [...s.used_on] })).sort((a, b) => a.title.localeCompare(b.title));
}

// Counts cover the kinds this county publishes (public_kinds); held kinds (e.g. indicators) are not on its pages.
const KIND_OF_DATASET = { 'fiscal-ledger': 'ledger', audits: 'audits', population: 'population', indicators: 'indicators', abstract: 'abstract' };
const counts = (slug) => {
  guard(slug);
  const c = { total: 0, approved: 0, pending: 0, disputed: 0, rejected: 0, needs_page_check: 0 };
  cr.entries(slug).filter((e) => counties.isPublicRecord(slug, KIND_OF_DATASET[e.dataset.slice(slug.length + 1)], e.id)).forEach((e) => {
    c.total += 1; if (e.state_code === 'APPROVED') c.approved += 1; else if (e.state_code === 'REJECTED') c.rejected += 1; else c.pending += 1;
    if (e.state_code === 'DISPUTED') c.disputed += 1; if (e.needs_page_check) c.needs_page_check += 1;
  });
  return c;
};
const datasets = (slug) => { guard(slug); return cr.datasets(slug); };

module.exports = { meta, nav, ledger, audits, people, indicators, wards, abstractTables, sectorTables, wardVoters, sources, conflicts, counts, datasets, PAGE_TITLES, ON_PAGES: counties.ON_PAGES };
