// Fiscal reconciliation (/counties/siaya/ledger/): every source's value for each measure and year, side by side,
// from data/siaya-fiscal-ledger.json. Values are shown in the unit their source printed; nothing is averaged,
// chosen or filled. Discrepancy cases and the completeness matrix are read as stored (scripts/test-fiscal-ledger.js
// recomputes both). Server and build only.
// Read through lib/review-status.js: a value rejected in editorial review is already removed (masked) here.
const rs = require('./review-status');
const led = rs.masked('siaya-fiscal-ledger');
const manifest = require('../data/source-manifest.json');
const ed = require('./editorial');
const links = require('./conflict-links');
const { notesFor } = require('./correction-notes');

const KIND = { controller_of_budget: 'Controller of Budget', county: 'County Government', auditor_general: 'Auditor-General', senate_quoting_auditor_general: 'Senate committee (quoting the Auditor-General)', other: 'Other official (KNBS compilation)' };
const KINDS = Object.keys(KIND);
const READ = { text: 'PDF text layer', 'ocr-tesseract': 'OCR (tesseract)', 'ocr-rapidocr': 'OCR (RapidOCR)' };
const fileOf = Object.fromEntries(manifest.documents.map((d) => [d.id, d.file_url]));
// A link that opens the page: the publisher's PDF file with #page= where the file address is known.
const pageUrlIn = (L) => (sourceId, page) => {
  const s = L.sources[sourceId] || {};
  const file = fileOf[sourceId] || (/cgdp_download|\.pdf($|\?)/i.test(s.url || '') ? s.url : null);
  return file ? (page ? `${file}#page=${page}` : file) : s.url;
};
const pageUrl = pageUrlIn(led);

// Siaya's hooks: review badges, machine checks, correction notes and case classes for siaya-fiscal-ledger. Another
// county's ledger (lib/county-pages.js) passes its own; the shape of the result is the same.
const SIAYA = {
  dataset: 'siaya-fiscal-ledger', L: led, pageUrl,
  badge: (id) => rs.badge('siaya-fiscal-ledger', id), machine: (id) => ed.machineBadge('siaya-fiscal-ledger', id),
  notes: (id) => notesFor('siaya-fiscal-ledger', id), classOf: ed.classOf, curated: links.curatedFor,
  classCounts: ed.classCounts, extra: () => ({}),
};

function observation(o, h = SIAYA) {
  const s = h.L.sources[o.source_id] || {};
  return {
    id: o.id, fy: o.fy, value: o.value, unit: o.unit, kind: o.source_kind, source: s.title || o.source_id, publisher: s.publisher || '',
    pdf_page: o.pdf_page, printed_page: o.printed_page, url: h.pageUrl(o.source_id, o.pdf_page), read: READ[o.read_method] || o.read_method,
    confidence: o.confidence, table: o.table || '', printed: o.original_text || '', basis: o.basis || '', version: o.budget_version || '',
    stock: o.stock_point || '', note: o.note || '', reused: o.reused_from ? o.reused_from.file : '',
    review: h.badge(o.id),
    source_error: o.source_error || null, machine: h.machine(o.id),
    // A value withheld after editorial review has no correction footnote (it would restate the value).
    cor: (h.badge(o.id) || {}).hide ? null : h.notes(o.id),
    as_at: o.as_at || '', accounting_basis: o.accounting_basis || '', scope: o.scope || '',
    ...h.extra(o),
  };
}

function ledger(h = SIAYA) {
  const led = h.L;
  const obs = led.observations.map((o) => observation(o, h));
  const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
  const measureOf = Object.fromEntries(led.observations.map((o) => [o.id, o.measure]));
  const measures = Object.entries(led.measures).map(([key, m]) => ({ key, ...m, n: obs.filter((o) => measureOf[o.id] === key).length }));
  const values = Object.fromEntries(measures.map((m) => [m.key, led.years.map((fy) => ({ fy, byKind: KINDS.map((k) => obs.filter((o) => measureOf[o.id] === m.key && o.fy === fy && o.kind === k)) }))]));
  // A case whose claim was rejected in review keeps its listing but not its amounts.
  const cases = led.discrepancies.map((d) => {
    const a = byId[d.claim_a.observation_id]; const b = byId[d.claim_b.observation_id];
    const withheld = [a, b].find((x) => x.review && x.review.hide);
    return {
      id: d.case_id, measure: d.indicator_id, period: d.period, status: d.status, a, b, withheld: withheld ? withheld.review : null,
      cls: (h.classOf[d.case_id] || {}).classification || 'unexplained', cls_reason: (h.classOf[d.case_id] || {}).reason || '', cls_evidence: (h.classOf[d.case_id] || {}).evidence || [],
      a_m: withheld ? null : d.claim_a.value_ksh_m, b_m: withheld ? null : d.claim_b.value_ksh_m, diff: withheld ? null : d.difference.absolute_ksh_m, pct: withheld ? null : d.difference.pct_of_smaller, basis: d.possible_basis_mismatch,
      curated: h.curated(d.case_id),
    };
  });
  // Completeness: one cell per measure and year; missing cells point at a numbered reason listed under the table.
  const reasons = [];
  const completeness = measures.map((m) => ({
    key: m.key, label: m.label,
    cells: led.years.map((fy) => {
      const c = (led.completeness[m.key] || {})[fy] || { n_values: 0, n_sources: 0, missing: true, reason: 'Not recorded.' };
      let r = -1;
      if (c.missing) { r = reasons.indexOf(c.reason); if (r < 0) { reasons.push(c.reason); r = reasons.length - 1; } }
      return { fy, n: c.n_values, sources: c.n_sources, missing: c.missing, reason: r };
    }),
  }));
  return { meta: led.meta, years: led.years, measures, values, cases, completeness, reasons, kinds: KINDS.map((k) => ({ key: k, label: KIND[k] })), threshold: led.meta.threshold_pct, classCounts: h.classCounts(), classOrder: ed.CLASS_ORDER, classDefs: ed.classes.meta.classes };
}

// Dataset rows for the catalogue CSV: one row per value, with its source, pages, how it was read and its open cases.
function datasetRows() {
  const open = (id) => led.discrepancies.filter((d) => d.status === 'open' && (d.claim_a.observation_id === id || d.claim_b.observation_id === id)).map((d) => d.case_id).join('; ');
  return led.observations.map((o) => {
    const x = observation(o);
    return {
      observation_id: o.id, measure: o.measure, measure_label: led.measures[o.measure].label, fiscal_year: o.fy, value: o.value, unit: o.unit,
      source_id: o.source_id, source: x.source, publisher_kind: KIND[o.source_kind] || o.source_kind, pdf_page: o.pdf_page, printed_page: o.printed_page ?? '',
      table: x.table, read_method: x.read, original_text: x.printed, confidence: o.confidence, basis: x.basis, budget_version: x.version, stock_point: x.stock,
      scope: o.scope || '', reused_from: x.reused, note: x.note, open_cases: open(o.id),
      review_status: x.review.label, review_note: x.review.hide ? x.review.reason : '',
      source_error: o.source_error ? `${o.source_error.issue} Quote (PDF p. ${o.source_error.page}): "${o.source_error.quote}"` : '', as_at: o.as_at || '', accounting_basis: o.accounting_basis || '',
    };
  });
}

module.exports = { ledger, datasetRows, led, KIND, READ, pageUrlIn };
