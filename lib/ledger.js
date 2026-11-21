// Fiscal reconciliation (/counties/siaya/ledger/): every source's value for each measure and year, side by side,
// from data/siaya-fiscal-ledger.json. Values are shown in the unit their source printed; nothing is averaged,
// chosen or filled. Discrepancy cases and the completeness matrix are read as stored (scripts/test-fiscal-ledger.js
// recomputes both). Server and build only.
const led = require('../data/siaya-fiscal-ledger.json');
const manifest = require('../data/source-manifest.json');

const KIND = { controller_of_budget: 'Controller of Budget', county: 'County Government', auditor_general: 'Auditor-General', senate_quoting_auditor_general: 'Senate committee (quoting the Auditor-General)' };
const KINDS = Object.keys(KIND);
const READ = { text: 'PDF text layer', 'ocr-tesseract': 'OCR (tesseract)', 'ocr-rapidocr': 'OCR (RapidOCR)' };
const fileOf = Object.fromEntries(manifest.documents.map((d) => [d.id, d.file_url]));
// A link that opens the page: the publisher's PDF file with #page= where the file address is known.
const pageUrl = (sourceId, page) => {
  const s = led.sources[sourceId] || {};
  const file = fileOf[sourceId] || (/cgdp_download|\.pdf($|\?)/i.test(s.url || '') ? s.url : null);
  return file ? (page ? `${file}#page=${page}` : file) : s.url;
};

function observation(o) {
  const s = led.sources[o.source_id] || {};
  return {
    id: o.id, fy: o.fy, value: o.value, unit: o.unit, kind: o.source_kind, source: s.title || o.source_id, publisher: s.publisher || '',
    pdf_page: o.pdf_page, printed_page: o.printed_page, url: pageUrl(o.source_id, o.pdf_page), read: READ[o.read_method] || o.read_method,
    confidence: o.confidence, table: o.table || '', printed: o.original_text || '', basis: o.basis || '', version: o.budget_version || '',
    stock: o.stock_point || '', note: o.note || '', reused: o.reused_from ? o.reused_from.file : '',
  };
}

function ledger() {
  const obs = led.observations.map(observation);
  const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
  const measureOf = Object.fromEntries(led.observations.map((o) => [o.id, o.measure]));
  const measures = Object.entries(led.measures).map(([key, m]) => ({ key, ...m, n: obs.filter((o) => measureOf[o.id] === key).length }));
  const values = Object.fromEntries(measures.map((m) => [m.key, led.years.map((fy) => ({ fy, byKind: KINDS.map((k) => obs.filter((o) => measureOf[o.id] === m.key && o.fy === fy && o.kind === k)) }))]));
  const cases = led.discrepancies.map((d) => ({
    id: d.case_id, measure: d.indicator_id, period: d.period, status: d.status, a: byId[d.claim_a.observation_id], b: byId[d.claim_b.observation_id],
    a_m: d.claim_a.value_ksh_m, b_m: d.claim_b.value_ksh_m, diff: d.difference.absolute_ksh_m, pct: d.difference.pct_of_smaller, basis: d.possible_basis_mismatch,
  }));
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
  return { meta: led.meta, years: led.years, measures, values, cases, completeness, reasons, kinds: KINDS.map((k) => ({ key: k, label: KIND[k] })), threshold: led.meta.threshold_pct };
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
    };
  });
}

module.exports = { ledger, datasetRows, led, KIND };
