// Editorial review status of every observation (handover section 5, evidence state machine; section 6, review_decisions).
// The state is derived, never typed by hand: each value Takwimu transcribed or computed starts as REVIEW_PENDING
// (machine-extracted and passed the build checks, which is RECONCILED, but not yet checked by a person), and only a
// record in data/reviews.json can move it on. A value is APPROVED only when a record says so AND the SHA-256 in that
// record equals the hash of the source document as the site holds it now; if the document changes, the value goes back
// to REVIEW_PENDING. There is no path from EXTRACTED to PUBLISHED without a review record.
// Reviewers are named by role only (docs/data-protection-policy.md). Server and build only.
const reviews = require('../data/reviews.json');

const STATES = ['DISCOVERED', 'ACCESS_CHECKED', 'ACQUIRED', 'PARSED', 'EXTRACTED', 'RECONCILED', 'REVIEW_PENDING', 'APPROVED', 'PUBLISHED'];
const SIDE_STATES = ['INACCESSIBLE', 'LICENCE_RESTRICTED', 'DISPUTED', 'SUPERSEDED', 'RETRACTED', 'REJECTED'];
const DECISIONS = ['approved', 'rejected', 'disputed', 'superseded'];
const ROLES = reviews.meta.reviewer_roles;

// What a reader sees for each state. Only APPROVED says "Approved".
const PUBLIC_LABEL = {
  REVIEW_PENDING: 'Provisional: awaiting editorial review',
  APPROVED: 'Approved',
  REJECTED: 'Withdrawn after editorial review',
  DISPUTED: 'Disputed: see the conflict register',
  SUPERSEDED: 'Superseded',
};
const CONFLICT_REGISTER = '/data/#conflicts';

// ---- Source documents and their current hash ----
const read = (f) => require(`../data/${f}`);
const GLOBAL = {};
const put = (map, id, sha, title) => { if (id && !(id in map)) map[id] = { sha256: sha || null, title: title || id }; };
read('source-manifest.json').documents.forEach((d) => put(GLOBAL, d.id, d.sha256, d.title));
read('source-library.json').documents.forEach((d) => put(GLOBAL, d.document_id, d.sha256, d.title));
const BY_URL = {};
read('source-manifest.json').documents.forEach((d) => { if (d.url) BY_URL[d.url] = d.id; });
read('source-library.json').documents.forEach((d) => { if (d.source_url && !BY_URL[d.source_url]) BY_URL[d.source_url] = d.document_id; });
Object.entries(read('siaya-fiscal-ledger.json').sources).forEach(([id, s]) => put(GLOBAL, id, s.sha256, s.title));

// ---- Observations, per dataset (data file stem) ----
// Each item: { id, sources: [source ids], priority: 1..5, kind, label }.
// Priority (scripts/review-queue.js): 1 fiscal discrepancies, 2 audit findings, 3 health indicators, 4 other fiscal, 5 the rest.
function localSources(list, key) { const m = {}; (list || []).forEach((s) => put(m, s[key], s.sha256, s.title)); return m; }

const DATASETS = {
  'siaya-fiscal-ledger': () => {
    const d = read('siaya-fiscal-ledger.json');
    const open = new Set();
    d.discrepancies.filter((x) => x.status === 'open').forEach((x) => { open.add(x.claim_a.observation_id); open.add(x.claim_b.observation_id); });
    return { local: {}, items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: open.has(o.id) ? 1 : 4, kind: open.has(o.id) ? 'fiscal discrepancy (open case in the ledger)' : 'fiscal value', label: `${o.measure}, FY ${o.fy}`, disputed: open.has(o.id) })) };
  },
  'siaya-audits': () => {
    const d = read('siaya-audits.json');
    return {
      local: localSources(d.documents, 'doc_id'),
      items: [
        ...d.opinions.map((o) => ({ id: `opinion:${o.entity}:${o.fy}`, sources: [o.doc_id], priority: 2, kind: 'audit opinion', label: `${o.entity}, FY ${o.fy}: ${o.opinion}` })),
        ...d.findings.map((f) => ({ id: f.id, sources: [f.doc_id], priority: 2, kind: 'audit finding', label: `${f.entity}, FY ${f.fy}: ${f.title}` })),
      ],
    };
  },
  'siaya-health': () => {
    const d = read('siaya-health.json');
    const disputed = new Set(d.conflicts.flatMap((c) => c.observation_ids || []));
    return { local: localSources(d.sources, 'id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 3, kind: 'health indicator', label: `${o.label || o.measure}, ${o.period}`, disputed: disputed.has(o.id) })) };
  },
  'siaya-projects': () => {
    const d = read('siaya-projects.json');
    return { local: localSources(d.documents, 'doc_id'), items: d.projects.map((p) => ({ id: p.id, sources: [...new Set((p.evidence || []).map((e) => e.doc_id))], priority: (p.conflicts || []).length ? 1 : 4, kind: (p.conflicts || []).length ? 'fiscal discrepancy (project amounts differ between documents)' : 'project record', label: p.name, disputed: (p.conflicts || []).length > 0 })) };
  },
  'counties-cob': () => {
    const d = read('counties-cob.json');
    const items = [];
    const local = {};
    d.years.forEach((y) => {
      put(local, y.source_id, (y.source && y.source.sha256) || (GLOBAL[y.source_id] || {}).sha256, y.source && y.source.title);
      y.counties.forEach((c) => Object.entries(c).forEach(([k, v]) => {
        if (!v || typeof v !== 'object' || !('value' in v)) return;
        const siaya = c.slug === 'siaya';
        items.push({ id: `${y.fy}:${c.slug}:${k}`, sources: [y.source_id], priority: siaya ? 1 : 4, kind: siaya ? 'fiscal discrepancy (Siaya row against data/history.json)' : 'county fiscal value (OCR)', label: `${c.name}, ${k}, FY ${y.fy}` });
      }));
    });
    return { local, items };
  },
  history: () => {
    const d = read('history.json');
    const items = [];
    d.years.forEach((y) => Object.entries(y.provenance || {}).forEach(([k, p]) => items.push({ id: `years:${y.fy}:${k}`, sources: [p.source_id], priority: 1, kind: 'fiscal value (ten-year series; register cases)', label: `${k}, FY ${y.fy}` })));
    d.audits.points.forEach((a) => items.push({ id: `audits:${a.fy}`, sources: [a.source_id], priority: 2, kind: 'audit opinion', label: `Audit opinion, FY ${a.fy}: ${a.opinion}` }));
    d.osr_series.points.forEach((p) => items.push({ id: `osr:${p.fy}`, sources: [p.source_id], priority: 4, kind: 'fiscal value', label: `Own-source revenue, FY ${p.fy}` }));
    d.health.indicators.forEach((h) => items.push({ id: `health:${h.id}`, sources: (h.sources || []).map((u) => BY_URL[u] || u), priority: 3, kind: 'health indicator', label: h.label }));
    (d.health.hiv.points || []).forEach((p) => items.push({ id: `hiv:${p.year}`, sources: [BY_URL[p.url] || p.url], priority: 3, kind: 'health indicator', label: `Adult HIV prevalence, ${p.year}` }));
    d.population.points.forEach((p) => items.push({ id: `population:${p.year}`, sources: [], priority: 5, kind: 'population', label: `Population, ${p.year} (${p.kind})` }));
    (d.poverty.points || []).forEach((p) => items.push({ id: `poverty:${p.year}:${p.measure}`, sources: [], priority: 5, kind: 'poverty', label: `${p.measure}, ${p.year}` }));
    (d.in_year ? d.in_year.periods : []).forEach((p) => p.figures.forEach((f) => items.push({ id: `in_year:${p.id}:${f.measure}`, sources: [BY_URL[p.report.url] || p.report.url], priority: 4, kind: 'fiscal value (in-year)', label: `${f.label}, ${p.label}` })));
    return { local: {}, items };
  },
  'siaya-analysis': () => {
    const d = read('siaya-analysis.json');
    return { local: {}, items: d.records.map((r) => ({ id: r.calc_id, sources: r.source_ids || [], priority: 4, kind: 'calculation by Takwimu', label: r.title })) };
  },
  'siaya-economy': () => {
    const d = read('siaya-economy.json');
    const local = {};
    d.sources.forEach((s) => { put(local, s.vintage, s.sha256, s.title); put(local, s.document_id, s.sha256, s.title); });
    return { local, items: d.observations.map((o) => ({ id: o.id, sources: [o.vintage], priority: 5, kind: 'economic statistic', label: `${o.indicator}, ${o.sector_label || o.sector}, ${o.period}` })) };
  },
  'siaya-governance': () => {
    const d = read('siaya-governance.json');
    return {
      local: localSources(d.sources, 'source_id'),
      items: [
        ...d.ibp_cbts.editions.flatMap((e) => e.items.map((i) => ({ id: i.id, sources: [i.source_id], priority: 5, kind: 'governance score', label: `${i.measure}, ${i.edition}` }))),
        ...d.aprm.findings.map((f) => ({ id: f.id, sources: [f.source_id], priority: 5, kind: 'governance finding', label: `APRM: ${f.theme}, ${f.section}` })),
      ],
    };
  },
  'siaya-education': () => {
    const d = read('siaya-education.json');
    const disputed = new Set(d.conflicts.flatMap((c) => c.observations || []));
    return { local: localSources(d.sources, 'source_id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'education statistic', label: `${o.indicator}, ${o.period}`, disputed: disputed.has(o.id) })) };
  },
  'siaya-agriculture': () => {
    const d = read('siaya-agriculture.json');
    const disputed = new Set(d.conflicts.flatMap((c) => c.values || []));
    return { local: localSources(d.sources, 'source_id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'agriculture statistic', label: `${o.indicator}, ${o.commodity}, ${o.period}`, disputed: disputed.has(o.id) })) };
  },
  'siaya-climate': () => {
    const d = read('siaya-climate.json');
    return { local: localSources(d.sources, 'id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'climate and water statistic', label: `${o.measure || o.series}, ${o.period}` })) };
  },
  'siaya-programmes': () => {
    const d = read('siaya-programmes.json');
    return { local: localSources(d.sources, 'id'), items: d.programmes.map((p) => ({ id: p.id, sources: [...new Set((p.sources || []).map((s) => s.source_id))], priority: 5, kind: 'programme record', label: p.title })) };
  },
};
// Data files with no itemised observations: registers and map layers, not measured values.
const NOT_ITEMISED = {
  'siaya-geography': 'A register of names and codes (county, constituencies, wards), not measured values.',
  'siaya-wards-geo': 'A boundary map layer, checked as one file (resource hash in the file).',
  'siaya-boundaries': 'A simplified boundary drawing for the map, not measured values.',
};
const DATASET_IDS = Object.keys(DATASETS);

// ---- Resolution ----
const cache = {};
function load(dataset) {
  if (!DATASETS[dataset]) return null;
  if (!cache[dataset]) {
    const { local, items } = DATASETS[dataset]();
    const src = (id) => (local[id] || GLOBAL[id] || null);
    cache[dataset] = { src, items, byId: Object.fromEntries(items.map((i) => [i.id, i])) };
  }
  return cache[dataset];
}
// Current hash of a source document as the site holds it (null when not downloaded or not identified).
function sourceHash(dataset, sourceId) { const d = load(dataset); const s = d && d.src(sourceId); return s ? s.sha256 : null; }

// Records that are still in force: a record named in a later record's `supersedes` no longer counts.
const replaced = new Set(reviews.decisions.flatMap((r) => r.supersedes || []));
const inForce = reviews.decisions.filter((r) => !replaced.has(r.id));
const recordFor = {};
inForce.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).forEach((r) => r.record_ids.forEach((id) => { recordFor[`${r.dataset}|${id}`] = r; }));

function stateOf(dataset, id) {
  const d = load(dataset);
  const item = d && d.byId[id];
  if (!item) return null;
  const anchored = item.sources.some((s) => sourceHash(dataset, s));
  const base = { state: item.disputed ? 'DISPUTED' : 'REVIEW_PENDING', anchored, record: null, reason: item.disputed ? 'The data file itself records a conflict for this value; both readings are kept.' : 'Machine-extracted or transcribed by Takwimu; no review record yet.' };
  const r = recordFor[`${dataset}|${id}`];
  if (!r) return base;
  const current = sourceHash(dataset, r.source_document_id);
  if (!current || current !== r.source_sha256) return { ...base, state: 'REVIEW_PENDING', record: r.id, reason: `Reviewed against a different version of ${r.source_document_id}; the source has changed since, so the value is back in the queue.` };
  const state = { approved: 'APPROVED', rejected: 'REJECTED', disputed: 'DISPUTED', superseded: 'SUPERSEDED' }[r.decision];
  return { state, anchored, record: r.id, reason: r.rationale };
}

// What a page shows for one value: label, whether to hide the value, the rationale, and a link when disputed.
function review(dataset, id) {
  const s = stateOf(dataset, id);
  if (!s) return null;
  return {
    ...s,
    label: PUBLIC_LABEL[s.state],
    approved: s.state === 'APPROVED',
    hide: s.state === 'REJECTED',
    href: s.state === 'DISPUTED' ? CONFLICT_REGISTER : null,
    fromRecord: Boolean(s.record) && s.state !== 'REVIEW_PENDING',
  };
}

function observations(dataset) { const d = load(dataset); return d ? d.items : []; }

// Counts per state for a dataset, optionally only items whose id passes `filter`.
function counts(dataset, filter) {
  // pending: no review record in force (values the data file itself marks as disputed are included, and also counted in
  // disputed); disputed: every value in the DISPUTED state; unanchored: no source document with a hash, so it cannot be approved.
  const c = { total: 0, approved: 0, pending: 0, rejected: 0, disputed: 0, superseded: 0, unanchored: 0 };
  observations(dataset).filter((i) => !filter || filter(i.id)).forEach((i) => {
    const s = stateOf(dataset, i.id);
    c.total += 1;
    if (!s.anchored) c.unanchored += 1;
    if (s.state === 'APPROVED') c.approved += 1;
    else if (s.state === 'REJECTED') c.rejected += 1;
    else if (s.state === 'SUPERSEDED') c.superseded += 1;
    else if (s.state === 'DISPUTED' && s.record) c.disputed += 1;
    else { c.pending += 1; if (s.state === 'DISPUTED') c.disputed += 1; }
  });
  return c;
}

// Catalogue dataset id -> { dataset, filter } (lib/dataset-status.js uses this for the review counts).
const COB_GROUP = {
  'counties-own-source-revenue': (k) => /osr|fif_aia/.test(k),
  'counties-absorption': (k) => /absorption_pct$/.test(k),
  'counties-pending-bills': (k) => /^pb_/.test(k),
  'counties-budget-spending': (k) => /_budget$|^approved_budget_total$|_expenditure$|^expenditure_total$/.test(k),
};
const CATALOGUE = {
  'siaya-ten-year-history': 'history', 'siaya-economy': 'siaya-economy', 'siaya-governance': 'siaya-governance', 'siaya-audit-findings': 'siaya-audits',
  'siaya-fiscal-ledger': 'siaya-fiscal-ledger', 'siaya-health': 'siaya-health', 'siaya-education': 'siaya-education', 'siaya-agriculture': 'siaya-agriculture',
  'siaya-climate': 'siaya-climate', 'siaya-analysis': 'siaya-analysis', 'siaya-projects': 'siaya-projects', 'siaya-programmes': 'siaya-programmes',
};
function catalogueCounts(catalogueId) {
  if (COB_GROUP[catalogueId]) return counts('counties-cob', (id) => COB_GROUP[catalogueId](id.split(':')[2]));
  return CATALOGUE[catalogueId] ? counts(CATALOGUE[catalogueId]) : null;
}
const plural = (n, w) => `${n.toLocaleString('en-US')} ${w}${n === 1 ? '' : 's'}`;
function countsSentence(c) {
  const n = (x) => x.toLocaleString('en-US');
  return `Editorial review of ${plural(c.total, 'value')}: ${n(c.approved)} approved, ${n(c.pending)} pending, ${n(c.rejected)} rejected`
    + `${c.superseded ? `, ${n(c.superseded)} superseded` : ''}.${c.disputed ? ` ${n(c.disputed)} ${c.disputed === 1 ? 'is' : 'are'} disputed between sources (both readings kept).` : ''}`;
}

module.exports = { STATES, SIDE_STATES, DECISIONS, ROLES, PUBLIC_LABEL, CONFLICT_REGISTER, DATASET_IDS, NOT_ITEMISED, observations, sourceHash, stateOf, review, counts, catalogueCounts, countsSentence, reviews, inForce };
