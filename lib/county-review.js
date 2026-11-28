// Review state and review-pack entries for the counties in lib/county-registry.js other than Siaya (Siaya's values go
// through lib/review-status.js and lib/review-pack.js, which this file does not change). Dataset names are
// "<slug>-fiscal-ledger", "<slug>-audits" and "<slug>-population". The rule is the same as for Siaya: every value is
// REVIEW_PENDING ("Provisional: awaiting editorial review") until a record in data/reviews.json says otherwise, a
// value in an open conflict case is DISPUTED, and APPROVED needs a record whose SHA-256 equals the source document's
// hash as held now. Nothing here writes data/reviews.json. Server and build only.
const counties = require('./county-registry');
const rs = require('./review-status');

const KINDS = ['ledger', 'audits', 'population', 'indicators', 'abstract'];
const IND_KINDS = ['indicators', 'abstract'];
const datasetName = (slug, kind) => `${slug}-${kind === 'ledger' ? 'fiscal-ledger' : kind}`;
const datasets = (slug) => KINDS.filter((k) => counties.has(slug, k)).map((k) => datasetName(slug, k));

function sources(slug) {
  const m = {};
  if (counties.has(slug, 'ledger')) Object.entries(counties.load(slug, 'ledger').sources).forEach(([id, s]) => { m[id] = { id, title: s.title, url: s.url, sha256: s.sha256, publication_date: s.publication_date }; });
  if (counties.has(slug, 'audits')) counties.load(slug, 'audits').documents.forEach((d) => { m[d.doc_id] = { id: d.doc_id, title: d.title, url: d.url, sha256: d.sha256, publication_date: d.report_date }; });
  if (counties.has(slug, 'population')) Object.entries(counties.load(slug, 'population').sources).forEach(([id, s]) => { m[id] = { id, title: s.title, url: s.url, sha256: s.sha256, publication_date: s.publication_date }; });
  IND_KINDS.filter((k) => counties.has(slug, k)).forEach((k) => counties.load(slug, k).sources.forEach((s) => { m[s.source_id] = { id: s.source_id, title: s.title, url: s.url, sha256: s.sha256, publication_date: s.publication_date }; }));
  return m;
}

const READ = { text: 'PDF text layer', 'ocr-tesseract': 'OCR (tesseract)', 'ocr-rapidocr': 'OCR (RapidOCR)' };
const READ_KIND = { text: 'text', 'ocr-tesseract': 'ocr', 'ocr-rapidocr': 'ocr' };

// One entry per value, in the shape of lib/review-pack.js entries.
function items(slug) {
  const out = [];
  const src = sources(slug);
  const conflicts = counties.has(slug, 'conflicts') ? counties.load(slug, 'conflicts').conflicts : [];
  const disputed = new Set(conflicts.filter((c) => c.status === 'open').flatMap((c) => c.observations || []));
  const mk = (dataset, id, o) => ({ dataset, id, ...o, source: o.sources.map((s) => src[s] || { id: s, title: s, url: null, sha256: null }), disputed: disputed.has(`${dataset}|${id}`) });
  if (counties.has(slug, 'ledger')) {
    const L = counties.load(slug, 'ledger');
    L.observations.forEach((o) => out.push(mk(datasetName(slug, 'ledger'), o.id, {
      label: `${o.measure}, FY ${o.fy}`, kind: 'fiscal value', sources: [o.source_id], value: o.value, unit: o.unit, period: `FY ${o.fy}`, scope: o.scope,
      pdf_page: o.pdf_page, printed_page: o.printed_page, read: READ[o.read_method], read_kind: READ_KIND[o.read_method], printed_text: o.original_text,
      note: [o.note, o.basis && `Basis: ${o.basis}`, o.second_reading && `Second reading (${o.second_reading.method}): ${o.second_reading.agrees ? 'agrees' : 'differs'}. ${o.second_reading.note}`, o.needs_page_check && 'Needs a look at the page image.'].filter(Boolean).join(' ') || null,
      needs_page_check: Boolean(o.needs_page_check),
    })));
  }
  if (counties.has(slug, 'audits')) {
    counties.load(slug, 'audits').opinions.forEach((o) => out.push(mk(datasetName(slug, 'audits'), `opinion:${o.entity}:${o.fy}`, {
      label: `${o.entity}, FY ${o.fy}: ${o.opinion}`, kind: o.tier === 'secondary' ? 'audit opinion (secondary summary)' : 'audit opinion', sources: [o.doc_id], value: o.opinion, unit: 'opinion (text)', period: `FY ${o.fy}`, scope: o.entity,
      pdf_page: o.page, printed_page: null, read: READ[o.read_method] || null, read_kind: READ_KIND[o.read_method] || null, printed_text: o.quote || null, note: o.opinion_note, needs_page_check: Boolean(o.needs_page_check),
    })));
  }
  if (counties.has(slug, 'population')) {
    counties.load(slug, 'population').points.forEach((p) => out.push(mk(datasetName(slug, 'population'), p.id, {
      label: `Population, ${p.year} (${p.kind})`, kind: 'population', sources: [p.source.source_id], value: p.value, unit: 'persons', period: String(p.year), scope: 'county',
      pdf_page: p.source.pdf_page, printed_page: p.source.printed_page, read: READ[p.source.read_method], read_kind: READ_KIND[p.source.read_method], printed_text: p.source.as_printed, note: p.note, needs_page_check: false,
    })));
  }
  IND_KINDS.filter((k) => counties.has(slug, k)).forEach((kind) => {
    const I = counties.load(slug, kind);
    const own = new Set(I.conflicts.filter((c) => c.status === 'open').flatMap((c) => c.observations));
    I.observations.forEach((o) => out.push(mk(datasetName(slug, kind), o.id, {
      label: `${o.label}, ${o.area}, ${o.period}`, kind: `${o.domain} (${o.kind})`, sources: [o.source_id], value: o.value === null ? o.value_as_printed : o.value, unit: o.unit, period: o.period, scope: o.area,
      pdf_page: o.pdf_page, printed_page: o.printed_page, read: o.read_method, read_kind: /HTML/.test(o.read_method) ? null : 'text', printed_text: o.value_as_printed,
      note: [o.note, own.has(o.id) && `In an open conflict case in the ${kind} file.`].filter(Boolean).join(' ') || null, needs_page_check: false,
    })));
  });
  return out;
}

// Review state, as lib/review-status.js computes it for Siaya.
function stateOf(e) {
  const r = rs.inForce.filter((x) => x.dataset === e.dataset && x.record_ids.includes(e.id)).sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
  const anchored = e.source.some((s) => s.sha256);
  const base = { state: e.disputed ? 'DISPUTED' : 'REVIEW_PENDING', anchored, record: null };
  if (!r) return base;
  if (r.decision !== 'approved') return { state: { rejected: 'REJECTED', disputed: 'DISPUTED', superseded: 'SUPERSEDED' }[r.decision], anchored, record: r.id };
  const current = (e.source.find((s) => s.id === r.source_document_id) || {}).sha256;
  if (!current || current !== r.source_sha256) return { ...base, record: r.id };
  return { state: 'APPROVED', anchored, record: r.id };
}

let CACHE = {};
function entries(slug) {
  if (CACHE[slug]) return CACHE[slug];
  const all = items(slug).map((e) => { const s = stateOf(e); return { ...e, state: rs.PUBLIC_LABEL[s.state], state_code: s.state, anchored: s.anchored }; });
  // Others: the same dataset, measure and period (side by side, nothing chosen).
  const groups = {};
  all.forEach((e) => { const k = `${e.dataset}|${e.label}`; (groups[k] || (groups[k] = [])).push(e); });
  all.forEach((e) => { e.others = (groups[`${e.dataset}|${e.label}`] || []).filter((x) => x !== e).map((x) => ({ dataset: x.dataset, id: x.id, value: x.value, unit: x.unit, source: x.sources.join(', '), pdf_page: x.pdf_page })); });
  CACHE[slug] = all;
  return all;
}
const counts = (slug) => {
  const c = { total: 0, approved: 0, pending: 0, disputed: 0, rejected: 0, needs_page_check: 0 };
  entries(slug).forEach((e) => { c.total += 1; if (e.state_code === 'APPROVED') c.approved += 1; else if (e.state_code === 'REJECTED') c.rejected += 1; else c.pending += 1; if (e.state_code === 'DISPUTED') c.disputed += 1; if (e.needs_page_check) c.needs_page_check += 1; });
  return c;
};

// What a page may receive about one value, in the shape of lib/review-status.js badge(): the public label and
// whether to withhold it. fromRecord is true only when a record in data/reviews.json set the state; a value in an
// open conflict case carries `disputed` instead (the page shows the case beside it).
function badge(slug, dataset, id) {
  const e = entries(slug).find((x) => x.dataset === dataset && x.id === id);
  if (!e) return null;
  const s = stateOf(e);
  // Without a record a disputed value is still unreviewed: its label stays provisional and `disputed` adds the case.
  const shown = s.record ? s.state : (s.state === 'DISPUTED' ? 'REVIEW_PENDING' : s.state);
  return {
    key: `${dataset}:${id}`, state: shown.toLowerCase(), label: rs.PUBLIC_LABEL[shown], reason: s.record ? `See review record ${s.record}.` : null,
    hide: s.state === 'REJECTED', approved: s.state === 'APPROVED', href: null, fromRecord: Boolean(s.record) && s.state !== 'REVIEW_PENDING',
    disputed: e.disputed, needs_page_check: e.needs_page_check,
  };
}

module.exports = { entries, counts, datasets, datasetName, sources, badge };
