// Review packs (docs/editorial/packs/, data/review-packs.json): for every Siaya-scope value, what a reviewer needs to
// check it against the source in one place: the record id, the stored value, unit and period, the source document
// (title, address, SHA-256, PDF and printed page), the text as printed or read by OCR, the other sources' values for
// the same measure and period, and a review-record template with the decision and role left blank.
// A pack is preparation for review, not review: nothing here changes a value's state (lib/review-status.js), and the
// template is never copied into data/reviews.json by a script. Server and build only.
const rs = require('./review-status');

const read = (f) => require(`../data/${f}`);
const cleanId = (s) => String(s).replace(/\s*\(.*\)\s*$/, '').trim();

// ---- Source documents: title, address and hash from every register that names them ----
const DOCS = {};
const put = (id, d) => {
  if (!id) return;
  const e = DOCS[id] || (DOCS[id] = { id, title: null, url: null, file_url: null, sha256: null, publication_date: null });
  ['title', 'url', 'file_url', 'sha256', 'publication_date'].forEach((k) => { if (!e[k] && d[k]) e[k] = d[k]; });
};
read('source-manifest.json').documents.forEach((d) => put(d.id, { ...d, publication_date: d.publication_date || d.retrieved && null }));
read('source-library.json').documents.forEach((d) => put(d.document_id, { title: d.title, url: d.source_url || d.url, sha256: d.sha256, publication_date: d.publication_date }));
Object.entries(read('siaya-fiscal-ledger.json').sources).forEach(([id, s]) => put(id, s));
read('siaya-audits.json').documents.forEach((d) => put(d.doc_id, { title: d.title, url: d.url, sha256: d.sha256, publication_date: d.report_date }));
read('siaya-health.json').sources.forEach((s) => put(s.id, s));
read('siaya-climate.json').sources.forEach((s) => put(s.id, s));
read('siaya-programmes.json').sources.forEach((s) => put(s.id, s));
read('siaya-projects.json').documents.forEach((d) => put(d.doc_id, { ...d, publication_date: d.published }));
['siaya-education', 'siaya-agriculture', 'siaya-governance'].forEach((f) => read(`${f}.json`).sources.forEach((s) => put(s.source_id, s)));
read('siaya-economy.json').sources.forEach((s) => { put(s.vintage, s); put(s.document_id, s); });
read('counties-cob.json').years.forEach((y) => put(y.source_id, y.source || {}));
const doc = (id) => DOCS[id] || { id, title: id, url: null, file_url: null, sha256: null, publication_date: null };

// ---- Scope: every dataset about Siaya; the 47-county file only for Siaya's rows; IMF (national) is out ----
const SCOPE = rs.DATASET_IDS.filter((d) => d !== 'imf');
const inScope = (dataset, id) => (dataset === 'counties-cob' ? id.split(':')[1] === 'siaya' : true);

const HIST_UNIT = (k) => (/_pct$/.test(k) ? '%' : /_m$/.test(k) ? 'KSh million' : 'KSh billion');
const READ_KIND = (r) => {
  const s = String(r || '').toLowerCase();
  if (!s) return null;
  if (/ocr|rapid|tesseract/.test(s)) return 'ocr';
  if (/text/.test(s)) return 'text';
  return null;
};
const first = (o, keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return null; };
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// One entry per value: what was stored and where it was read.
function entry(dataset, item) {
  const [o, repl] = item.ref || [{}, {}];
  const e = {
    dataset, id: item.id, label: item.label, kind: item.kind, priority: item.priority, value: null, unit: null, period: null,
    sources: item.sources.map(cleanId), pdf_page: null, printed_page: null, printed_text: null, read: null, scope: null, note: null,
  };
  const valueKey = Object.keys(repl || {}).find((k) => ['value', 'result', 'opinion'].includes(k)) || Object.keys(repl || {})[0];
  e.value = valueKey && o ? (typeof o[valueKey] === 'function' ? null : o[valueKey]) : null;
  e.unit = first(o, ['unit']);
  e.period = o && o.fy ? `FY ${o.fy}` : first(o, ['period', 'year', 'edition']);
  e.pdf_page = first(o, ['pdf_page', 'page', 'page_pdf']);
  e.printed_page = first(o, ['printed_page']);
  e.printed_text = first(o, ['original_text', 'quote', 'value_as_printed', 'as_printed', 'raw', 'value_text', 'printed']);
  e.read = first(o, ['read_method', 'read']);
  e.scope = first(o, ['scope', 'geography', 'entity']);
  e.note = first(o, ['note', 'basis', 'page_note', 'opinion_note']);
  if (dataset === 'history' && /^years:/.test(item.id)) {
    const k = item.id.split(':')[2];
    const p = (o.provenance || {})[k] || {};
    e.value = o[k]; e.unit = HIST_UNIT(k); e.period = `FY ${o.fy}`; e.pdf_page = p.page ?? null; e.printed_page = p.printed_page ?? null; e.read = p.read || null; e.note = p.page_note || null; e.printed_text = p.as_printed || null;
  }
  if (dataset === 'history' && /^health:/.test(item.id)) {
    e.value = Object.fromEntries(Object.keys(o).filter((k) => /^v\d{4}$/.test(k)).map((k) => [k.slice(1), o[k]]));
    e.period = Object.keys(e.value).join(', ');
  }
  if (dataset === 'siaya-audits' && /^opinion:/.test(item.id)) { e.value = o.opinion; e.unit = 'opinion (text)'; }
  if (dataset === 'siaya-audits' && !/^opinion:/.test(item.id)) { e.value = (o.amounts || []).map((a) => ({ value: a.value, unit: a.unit, label: a.label })); e.unit = 'amounts listed'; e.printed_text = o.title; }
  if (dataset === 'siaya-projects' || dataset === 'siaya-programmes') {
    e.value = (o.amounts || []).map((a) => ({ value: a.value, unit: a.unit || a.currency, label: a.label || a.kind || a.basis }));
    e.unit = 'amounts listed';
    const ev = (o.evidence || o.sources || [])[0] || {};
    e.pdf_page = first(ev, ['page', 'pdf_page']);
  }
  if (dataset === 'siaya-analysis') { e.value = o.result; e.read = 'calculation by Takwimu'; e.note = o.formula; }
  if (dataset === 'counties-cob') { e.printed_text = o.raw; e.read = o.read; }
  if (typeof e.pdf_page === 'string' && /^\d+$/.test(e.pdf_page)) e.pdf_page = Number(e.pdf_page);
  e.read_kind = READ_KIND(e.read);
  e.source = e.sources.map((s) => { const d = doc(s); return { id: s, title: d.title || s, url: d.file_url || d.url, sha256: rs.sourceHash(dataset, s) || d.sha256 || null, publication_date: d.publication_date }; });
  e.state = rs.review(dataset, item.id).label;
  return e;
}

// History years reused by the ledger: the same measure and year in the ledger are the "other sources" of a history value.
const LEDGER = read('siaya-fiscal-ledger.json');
const LEDGER_OF_HISTORY = {};
LEDGER.observations.forEach((o) => { if (o.reused_from && o.reused_from.file === 'data/history.json') { const [, fy, field] = o.reused_from.path; LEDGER_OF_HISTORY[`${fy.fy}:${field}`] = o; } });

let CACHE = null;
function all() {
  if (CACHE) return CACHE;
  const out = [];
  SCOPE.forEach((ds) => rs.observations(ds).filter((i) => inScope(ds, i.id)).forEach((i) => out.push(entry(ds, i))));
  // Others: same dataset and same label (measure and period), or for history the ledger values of the same measure and year.
  const groups = {};
  out.forEach((e) => { const k = `${e.dataset}|${e.label}`; (groups[k] || (groups[k] = [])).push(e); });
  const ledgerEntries = out.filter((e) => e.dataset === 'siaya-fiscal-ledger');
  out.forEach((e) => {
    let others = (groups[`${e.dataset}|${e.label}`] || []).filter((x) => x !== e);
    if (e.dataset === 'history' && /^years:/.test(e.id)) {
      const [, fy, k] = e.id.split(':');
      const l = LEDGER_OF_HISTORY[`${fy}:${k}`];
      if (l) others = ledgerEntries.filter((x) => x.label === `${l.measure}, FY ${l.fy}` && x.id !== l.id);
    }
    e.others = others.map((x) => ({ dataset: x.dataset, id: x.id, value: x.value, unit: x.unit, source: x.sources.join(', '), pdf_page: x.pdf_page }));
  });
  CACHE = out;
  return out;
}

// The review-record template: everything a reviewer must not have to look up; decision and role left blank.
function template(e) {
  return {
    id: 'REV-YYYY-NNN',
    dataset: e.dataset,
    record_ids: [e.id],
    source_document_id: e.sources[0] || null,
    source_sha256: (e.source[0] && e.source[0].sha256) || null,
    pages_checked: typeof e.pdf_page === 'number' ? [e.pdf_page] : [],
    reviewer_role: '',
    reviewer_is_not_extractor: true,
    decision: '',
    rationale: '',
    date: '',
    supersedes: [],
  };
}

const scopeCount = () => Object.fromEntries(SCOPE.map((d) => [d, all().filter((e) => e.dataset === d).length]));

module.exports = { all, template, doc, SCOPE, inScope, scopeCount, READ_KIND };
