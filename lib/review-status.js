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

// An input of a Takwimu calculation (data/siaya-analysis.json inputs[].dataset and .record) as { dataset, id } of
// lib/review-status.js, or null when the input is not an itemised observation (CPI, county profile, roll-forward).
const COB_SLUG = {};
read('counties-cob.json').years.forEach((y) => y.counties.forEach((c) => { COB_SLUG[c.code] = c.slug; }));
function inputRef(i) {
  const file = String(i.dataset || '').replace(/^data\//, '').replace(/\.json$/, '');
  const rec = String(i.record || '');
  let m;
  if ((m = rec.match(/^(?:observations|findings)\[id=([^\]]+)\]/))) return { dataset: file, id: m[1] };
  if (file === 'history' && (m = rec.match(/^years\[fy=([^\]]+)\]/)) && i.field) return { dataset: file, id: `years:${m[1]}:${i.field}` };
  if (file === 'history' && (m = rec.match(/^population\.points\[year=(\d+)\]/))) return { dataset: file, id: `population:${m[1]}` };
  if (file === 'counties-cob' && (m = rec.match(/^years\[fy=([^\]]+)\]\.counties\[code=(\d+)\]\.(\w+)/))) return { dataset: file, id: `${m[1]}:${COB_SLUG[m[2]]}:${m[3]}` };
  return null;
}

// Replacement for a list of amounts: entries kept (so tables keep their rows), values removed.
const nullValues = (list) => (list || []).map((a) => ({ ...a, value: null, ...('value_as_printed' in a ? { value_as_printed: null } : {}) }));

const DATASETS = {
  'siaya-fiscal-ledger': (d = read('siaya-fiscal-ledger.json')) => {
    const open = new Set();
    d.discrepancies.filter((x) => x.status === 'open').forEach((x) => { open.add(x.claim_a.observation_id); open.add(x.claim_b.observation_id); });
    return { local: {}, items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: open.has(o.id) ? 1 : 4, kind: open.has(o.id) ? 'fiscal discrepancy (open case in the ledger)' : 'fiscal value', label: `${o.measure}, FY ${o.fy}`, disputed: open.has(o.id), ref: [o, { value: null, original_text: null }] })) };
  },
  'siaya-audits': (d = read('siaya-audits.json')) => {
    return {
      local: localSources(d.documents, 'doc_id'),
      items: [
        ...d.opinions.map((o) => ({ id: `opinion:${o.entity}:${o.fy}`, sources: [o.doc_id], priority: 2, kind: 'audit opinion', label: `${o.entity}, FY ${o.fy}: ${o.opinion}`, ref: [o, { opinion: null, opinion_note: null }] })),
        ...d.findings.map((f) => ({ id: f.id, sources: [f.doc_id], priority: 2, kind: 'audit finding', label: `${f.entity}, FY ${f.fy}: ${f.title}`, ref: [f, { amounts: [], report_heading: null, note: null }] })),
      ],
    };
  },
  'siaya-health': (d = read('siaya-health.json')) => {
    const disputed = new Set(d.conflicts.flatMap((c) => c.observation_ids || []));
    return { local: localSources(d.sources, 'id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 3, kind: 'health indicator', label: `${o.label || o.measure}, ${o.period}`, disputed: disputed.has(o.id), ref: [o, { value: null }] })) };
  },
  'siaya-projects': (d = read('siaya-projects.json')) => {
    return { local: localSources(d.documents, 'doc_id'), items: d.projects.map((p) => ({ id: p.id, sources: [...new Set((p.evidence || []).map((e) => e.doc_id))], priority: (p.conflicts || []).length ? 1 : 4, kind: (p.conflicts || []).length ? 'fiscal discrepancy (project amounts differ between documents)' : 'project record', label: p.name, disputed: (p.conflicts || []).length > 0, ref: [p, { amounts: nullValues, evidence: (ev) => ev.map((e) => ({ ...e, summary: 'Withdrawn after editorial review.', reported_completion_pct: null })), conflicts: [], status_note: null }] })) };
  },
  'counties-cob': (d = read('counties-cob.json')) => {
    const items = [];
    const local = {};
    d.years.forEach((y) => {
      put(local, y.source_id, (y.source && y.source.sha256) || (GLOBAL[y.source_id] || {}).sha256, y.source && y.source.title);
      y.counties.forEach((c) => Object.entries(c).forEach(([k, v]) => {
        if (!v || typeof v !== 'object' || !('value' in v)) return;
        const siaya = c.slug === 'siaya';
        items.push({ id: `${y.fy}:${c.slug}:${k}`, sources: [y.source_id], priority: siaya ? 1 : 4, kind: siaya ? 'fiscal discrepancy (Siaya row against data/history.json)' : 'county fiscal value (OCR)', label: `${c.name}, ${k}, FY ${y.fy}`, ref: [v, { value: null, raw: null }] });
      }));
    });
    return { local, items };
  },
  history: (d = read('history.json')) => {
    const items = [];
    d.years.forEach((y) => Object.entries(y.provenance || {}).forEach(([k, p]) => items.push({ id: `years:${y.fy}:${k}`, sources: [p.source_id], priority: 1, kind: 'fiscal value (ten-year series; register cases)', label: `${k}, FY ${y.fy}`, ref: [y, { [k]: null }] })));
    d.audits.points.forEach((a) => items.push({ id: `audits:${a.fy}`, sources: [a.source_id], priority: 2, kind: 'audit opinion', label: `Audit opinion, FY ${a.fy}: ${a.opinion}`, ref: [a, { opinion: null, reasons: null }] }));
    d.osr_series.points.forEach((p) => items.push({ id: `osr:${p.fy}`, sources: [p.source_id], priority: 4, kind: 'fiscal value', label: `Own-source revenue, FY ${p.fy}`, ref: [p, { value: null }] }));
    d.health.indicators.forEach((h) => items.push({ id: `health:${h.id}`, sources: (h.sources || []).map((u) => BY_URL[u] || u), priority: 3, kind: 'health indicator', label: h.label, ref: [h, Object.fromEntries(Object.keys(h).filter((k) => /^v\d{4}$/.test(k)).map((k) => [k, null]))] }));
    (d.health.hiv.points || []).forEach((p) => items.push({ id: `hiv:${p.year}`, sources: [BY_URL[p.url] || p.url], priority: 3, kind: 'health indicator', label: `Adult HIV prevalence, ${p.year}`, ref: [p, { value: null }] }));
    d.population.points.forEach((p) => items.push({ id: `population:${p.year}`, sources: [], priority: 5, kind: 'population', label: `Population, ${p.year} (${p.kind})`, ref: [p, { value: null }] }));
    (d.poverty.points || []).forEach((p) => items.push({ id: `poverty:${p.year}:${p.measure}`, sources: [], priority: 5, kind: 'poverty', label: `${p.measure}, ${p.year}`, ref: [p, { value: null }] }));
    (d.in_year ? d.in_year.periods : []).forEach((p) => p.figures.forEach((f) => items.push({ id: `in_year:${p.id}:${f.measure}`, sources: [BY_URL[p.report.url] || p.report.url], priority: 4, kind: 'fiscal value (in-year)', label: `${f.label}, ${p.label}`, ref: [f, { value: null }] })));
    return { local: {}, items };
  },
  'siaya-analysis': (d = read('siaya-analysis.json')) => {
    // inputs: the observations each calculation uses (lib/review-status inputRef); a rejected input withholds the result.
    return { local: {}, items: d.records.map((r) => ({ id: r.calc_id, sources: r.source_ids || [], priority: 4, kind: 'calculation by Takwimu', label: r.title, inputs: (r.inputs || []).map(inputRef).filter(Boolean), ref: [r, { result: null, calc: null }], parts: [...(r.inputs || []), ...(r.beside || [])] })) };
  },
  'siaya-economy': (d = read('siaya-economy.json')) => {
    const local = {};
    d.sources.forEach((s) => { put(local, s.vintage, s.sha256, s.title); put(local, s.document_id, s.sha256, s.title); });
    return { local, items: d.observations.map((o) => ({ id: o.id, sources: [o.vintage], priority: 5, kind: 'economic statistic', label: `${o.indicator}, ${o.sector_label || o.sector}, ${o.period}`, ref: [o, { value: null }] })) };
  },
  'siaya-governance': (d = read('siaya-governance.json')) => {
    return {
      local: localSources(d.sources, 'source_id'),
      items: [
        ...d.ibp_cbts.editions.flatMap((e) => e.items.map((i) => ({ id: i.id, sources: [i.source_id], priority: 5, kind: 'governance score', label: `${i.measure}, ${i.edition}`, ref: [i, { value: null, scores: [], series: [], published: [], not_published: [], quote: null }] }))),
        ...d.aprm.findings.map((f) => ({ id: f.id, sources: [f.source_id], priority: 5, kind: 'governance finding', label: `APRM: ${f.theme}, ${f.section}`, ref: [f, { quote: null, value: null, rows: null, also: null }] })),
      ],
    };
  },
  'siaya-education': (d = read('siaya-education.json')) => {
    const disputed = new Set(d.conflicts.flatMap((c) => c.observations || []));
    return { local: localSources(d.sources, 'source_id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'education statistic', label: `${o.indicator}, ${o.period}`, disputed: disputed.has(o.id), ref: [o, { value: null }] })) };
  },
  'siaya-agriculture': (d = read('siaya-agriculture.json')) => {
    const disputed = new Set(d.conflicts.flatMap((c) => c.values || []));
    return { local: localSources(d.sources, 'source_id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'agriculture statistic', label: `${o.indicator}, ${o.commodity}, ${o.period}`, disputed: disputed.has(o.id), ref: [o, { value: null, value_as_printed: null }] })) };
  },
  'siaya-climate': (d = read('siaya-climate.json')) => {
    return { local: localSources(d.sources, 'id'), items: d.observations.map((o) => ({ id: o.id, sources: [o.source_id], priority: 5, kind: 'climate and water statistic', label: `${o.measure || o.series}, ${o.period}`, ref: [o, { value: null, value_text: null, rank_as_printed: null, hotspots_as_printed: null, quote: null }] })) };
  },
  'siaya-programmes': (d = read('siaya-programmes.json')) => {
    return { local: localSources(d.sources, 'id'), items: d.programmes.map((p) => ({ id: p.id, sources: [...new Set((p.sources || []).map((s) => s.source_id))], priority: 5, kind: 'programme record', label: p.title, ref: [p, { amounts: nullValues }] })) };
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

// Synthetic rejections, for scripts/test-reviews.js only: TAKWIMU_SYNTHETIC_REJECTIONS holds a JSON list of
// "dataset|id" keys. They live in the environment of one test build and are never written to data/reviews.json.
const SYNTHETIC_RATIONALE = 'Synthetic rejection injected by scripts/test-reviews.js to prove that a rejected value is withheld everywhere; not a real review.';
const SYNTHETIC = new Set((() => { try { return JSON.parse(process.env.TAKWIMU_SYNTHETIC_REJECTIONS || '[]'); } catch (e) { return []; } })());
SYNTHETIC.forEach((k) => { const [dataset, ...rest] = k.split('|'); recordFor[k] = { id: 'SYNTHETIC-TEST', dataset, record_ids: [rest.join('|')], decision: 'rejected', rationale: SYNTHETIC_RATIONALE, synthetic: true }; });

const stateCache = {};
function stateOf(dataset, id) {
  const key = `${dataset}|${id}`;
  if (!(key in stateCache)) stateCache[key] = computeState(dataset, id);
  return stateCache[key];
}
function computeState(dataset, id) {
  const d = load(dataset);
  const item = d && d.byId[id];
  if (!item) return null;
  const anchored = item.sources.some((s) => sourceHash(dataset, s));
  const base = { state: item.disputed ? 'DISPUTED' : 'REVIEW_PENDING', anchored, record: null, reason: item.disputed ? 'The data file itself records a conflict for this value; both readings are kept.' : 'Machine-extracted or transcribed by Takwimu; no review record yet.' };
  const r = recordFor[`${dataset}|${id}`];
  // A calculation is withheld when any of its inputs was rejected (its own record, if any, cannot override that).
  if (!(r && r.decision === 'rejected')) {
    const bad = (item.inputs || []).map((x) => ({ ...x, s: stateOf(x.dataset, x.id) })).find((x) => x.s && x.s.state === 'REJECTED');
    if (bad) return { state: 'REJECTED', anchored, record: bad.s.record, input: `${bad.dataset}:${bad.id}`, reason: `Withheld: an input of this calculation (${bad.dataset} ${bad.id}) was withdrawn after editorial review. ${bad.s.reason}` };
  }
  if (!r) return base;
  if (r.synthetic) return { state: 'REJECTED', anchored, record: r.id, reason: r.rationale, synthetic: true };
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
// Items of a parsed copy of a data file with their refs ([object, { field: replacement }]), for tests.
const refsOf = (dataset, data) => (DATASETS[dataset] ? DATASETS[dataset](data).items : []);

// What a client component may receive about one value: the public label and what to do, no data.
function badge(dataset, id) {
  const r = review(dataset, id);
  if (!r) return null;
  return { key: `${dataset}:${id}`, state: r.state.toLowerCase(), label: r.label, reason: r.reason, hide: r.hide, approved: r.approved, href: r.href, fromRecord: r.fromRecord };
}
const hidden = (dataset, id) => { const s = stateOf(dataset, id); return Boolean(s && s.state === 'REJECTED'); };

// A deep copy of a data file with every rejected value replaced (each item's ref says which fields hold the value and
// what to put in their place). Inputs of calculations that were rejected lose their value too. When nothing in the
// file is rejected the original object is returned, so the published output is unchanged byte for byte.
const MASKED = {};
function masked(dataset) {
  if (dataset in MASKED) return MASKED[dataset];
  const file = `${dataset}.json`;
  const original = read(file);
  const anyHidden = DATASETS[dataset] && observations(dataset).some((i) => hidden(dataset, i.id) || (i.parts || []).some((p) => { const x = inputRef(p); return x && hidden(x.dataset, x.id); }));
  if (!anyHidden) { MASKED[dataset] = original; return original; }
  const copy = JSON.parse(JSON.stringify(original));
  DATASETS[dataset](copy).items.forEach((i) => {
    if (hidden(dataset, i.id) && i.ref) Object.entries(i.ref[1]).forEach(([k, v]) => { if (k in i.ref[0]) i.ref[0][k] = typeof v === 'function' ? v(i.ref[0][k]) : Array.isArray(v) ? [] : v; });
    (i.parts || []).forEach((p) => { const x = inputRef(p); if (x && hidden(x.dataset, x.id)) { p.value = null; p.withheld = true; } });
  });
  // Derived pairs in the same file lose their amounts when either value is rejected.
  if (dataset === 'siaya-fiscal-ledger') copy.discrepancies.forEach((x) => { const a = hidden(dataset, x.claim_a.observation_id); const b = hidden(dataset, x.claim_b.observation_id); if (a || b) { if (a) { x.claim_a.value_ksh_m = null; x.claim_a.withheld = true; } if (b) { x.claim_b.value_ksh_m = null; x.claim_b.withheld = true; } x.difference = { ...x.difference, absolute_ksh_m: null, pct_of_smaller: null, withheld: true }; x.withheld = true; } });
  if (dataset === 'siaya-economy') copy.revisions.forEach((x) => { const e = hidden(dataset, x.earlier_id); const l = hidden(dataset, x.later_id); if (e || l) { [...(e ? ['earlier_value'] : []), ...(l ? ['later_value'] : []), 'difference', 'difference_pct'].forEach((k) => { if (k in x) x[k] = null; }); x.withheld = true; } });
  MASKED[dataset] = copy;
  return copy;
}

// The published copy of a data file (public/data/<dataset>.json): masked, with the review state of every value that
// is not simply pending, and the counts.
function publishedCopy(dataset) {
  const m = masked(dataset);
  const values = {};
  observations(dataset).forEach((i) => { const r = review(dataset, i.id); if (r.fromRecord || r.state !== 'REVIEW_PENDING') values[i.id] = { state: r.state, label: r.label, ...(r.fromRecord ? { record: r.record, reason: r.reason } : {}) }; });
  return { ...m, editorial_review: { rule: `Every value not listed here is "${PUBLIC_LABEL.REVIEW_PENDING}". Rejected values are removed (null) and listed with the rationale. Register: data/reviews.json; procedure: docs/editorial/review-sop.md.`, counts: counts(dataset), values } };
}

// Review state of the values that cite one source document (the source library shows this per document).
let SOURCE_INDEX = null;
function bySource(sourceId) {
  if (!SOURCE_INDEX) {
    SOURCE_INDEX = {};
    DATASET_IDS.forEach((ds) => observations(ds).forEach((i) => i.sources.forEach((sid) => {
      const e = SOURCE_INDEX[sid] || (SOURCE_INDEX[sid] = { total: 0, approved: 0, pending: 0, rejected: 0, disputed: 0, superseded: 0, withdrawn: [] });
      const st = stateOf(ds, i.id);
      e.total += 1;
      if (st.state === 'APPROVED') e.approved += 1;
      else if (st.state === 'REJECTED') { e.rejected += 1; e.withdrawn.push({ key: `${ds}:${i.id}`, reason: st.reason }); }
      else if (st.state === 'SUPERSEDED') e.superseded += 1;
      else if (st.state === 'DISPUTED' && st.record) e.disputed += 1;
      else e.pending += 1;
    })));
  }
  return SOURCE_INDEX[sourceId] || null;
}

// Review id of the record a JSON Pointer into a data file points into (components/report uses this), or null.
function idAt(file, ptr) {
  const dataset = String(file).replace(/\.json$/, '');
  if (!DATASETS[dataset]) return null;
  const segs = ptr.split('/').slice(1).map((k) => k.replace(/~1/g, '/').replace(/~0/g, '~'));
  const d = read(`${dataset}.json`);
  const at = (...ks) => ks.reduce((o, k) => (o == null ? o : o[k]), d);
  const [a, b, c, e, f] = segs;
  switch (dataset) {
    case 'siaya-fiscal-ledger':
      if (a === 'discrepancies' && at(a, b) && (c === 'claim_a' || c === 'claim_b')) return at(a, b, c).observation_id;
      return a === 'observations' && at(a, b) ? at(a, b).id : null;
    case 'siaya-economy':
      if (a === 'revisions' && at(a, b) && /^earlier/.test(c)) return at(a, b).earlier_id;
      if (a === 'revisions' && at(a, b) && /^later/.test(c)) return at(a, b).later_id;
      return a === 'observations' && at(a, b) ? at(a, b).id : null;
    case 'siaya-health': case 'siaya-education': case 'siaya-agriculture': case 'siaya-climate':
      return a === 'observations' && at(a, b) ? at(a, b).id : null;
    case 'siaya-audits':
      if (a === 'findings' && at(a, b)) return at(a, b).id;
      if (a === 'opinions' && at(a, b)) return `opinion:${at(a, b).entity}:${at(a, b).fy}`;
      return null;
    case 'siaya-projects': return a === 'projects' && at(a, b) ? at(a, b).id : null;
    case 'siaya-programmes': return a === 'programmes' && at(a, b) ? at(a, b).id : null;
    case 'siaya-analysis': return a === 'records' && at(a, b) ? at(a, b).calc_id : null;
    case 'siaya-governance':
      if (a === 'ibp_cbts' && b === 'editions' && at(a, b, c, e, f)) return at(a, b, c, e, f).id;
      if (a === 'aprm' && b === 'findings' && at(a, b, c)) return at(a, b, c).id;
      return null;
    case 'counties-cob': return a === 'years' && at(a, b, c, e) && f ? `${at(a, b).fy}:${at(a, b, c, e).slug}:${f}` : null;
    case 'history':
      if (a === 'years' && at(a, b) && c) return `years:${at(a, b).fy}:${c}`;
      if (a === 'audits' && at(a, b, c)) return `audits:${at(a, b, c).fy}`;
      if (a === 'osr_series' && at(a, b, c)) return `osr:${at(a, b, c).fy}`;
      if (a === 'population' && at(a, b, c)) return `population:${at(a, b, c).year}`;
      if (a === 'health' && b === 'indicators' && at(a, b, c)) return `health:${at(a, b, c).id}`;
      if (a === 'health' && b === 'hiv' && at(a, b, c, e)) return `hiv:${at(a, b, c, e).year}`;
      return null;
    default: return null;
  }
}

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

// The data file as held, without masking (report builders use it only to decide which rows exist).
const original = (dataset) => read(`${dataset}.json`);

module.exports = { original, refsOf, bySource, badge, masked, publishedCopy, idAt, inputRef, SYNTHETIC, SYNTHETIC_RATIONALE, STATES, SIDE_STATES, DECISIONS, ROLES, PUBLIC_LABEL, CONFLICT_REGISTER, DATASET_IDS, NOT_ITEMISED, observations, sourceHash, stateOf, review, counts, catalogueCounts, countsSentence, reviews, inForce };
