// Editorial registers read by pages and tests (owner items 1, 2, 4, 6 and 7, 23 Nov 2026):
//  - ledger case classes (data/ledger-classes.json, scripts/classify-ledger.js)
//  - pending bills at one date, every source side by side, with scope, date and accounting basis
//  - source-document errors: every record that carries a source_error field, kept as published
//  - our corrections (resolved register cases with a correction record and the data corrections log) and, separately,
//    source errors (not our corrections); both are shown beside the value (lib/correction-notes.js, SourceErrorFlag)
//    and checked by scripts/test-corrections.js; the register page was retired (owner, 27 Nov 2026)
//  - machine cross-checks (data/machine-checks.json), shown only as "machine cross-checked", never as approved
// Nothing here changes a value or its review state. Server and build only.
const { fmtNum } = require('./format');
const classes = require('../data/ledger-classes.json');
const conflicts = require('../data/conflicts.json');
const corrLog = require('../data/corrections.json');
const ledger = require('../data/siaya-fiscal-ledger.json');
const hist = require('../data/history.json');
const health = require('../data/siaya-health.json');
const county = require('../data/county.json');
const manifest = require('../data/source-manifest.json');
const { machine, machineBadge, machineCounts } = require('./machine-badge');

// ---- Ledger case classes ----
const CLASS_ORDER = ['definitional', 'period or version', 'probable source error', 'resolved by source', 'unexplained'];
const CLASS_TONE = { definitional: 'good', 'period or version': 'good', 'probable source error': 'warn', 'resolved by source': 'good', unexplained: 'warn' };
const classOf = Object.fromEntries(classes.cases.map((c) => [c.case_id, c]));
const classCounts = () => Object.fromEntries(CLASS_ORDER.map((k) => [k, classes.cases.filter((c) => c.classification === k).length]));

// ---- Pending bills at one date ----
const SRC = ledger.sources;
const KIND = { controller_of_budget: 'Controller of Budget', county: 'County Government', auditor_general: 'Auditor-General', senate_quoting_auditor_general: 'Senate committee (quoting the Auditor-General)' };
const fileOf = Object.fromEntries(manifest.documents.map((d) => [d.id, d.file_url]));
const pageUrl = (sid, page) => { const s = SRC[sid] || {}; const f = fileOf[sid] || (/cgdp_download|\.pdf($|\?)/i.test(s.url || '') ? s.url : null); return f ? `${f}#page=${page}` : s.url; };
const SCOPE = (s) => (/^county executive$/.test(s) ? 'County Executive' : /executive and assembly/.test(s) && !/not stated/.test(s) ? 'County Executive and County Assembly' : 'Not stated');
// Every ledger value of the closing pending-bills stock for one fiscal year (the stock at 30 June, or the same stock
// given as the next year's opening balance on 1 July), largest last.
function pendingAt(fy) {
  return ledger.observations.filter((o) => o.measure === 'pending_bills_close' && o.fy === fy).map((o) => {
    const s = SRC[o.source_id] || {};
    return {
      id: o.id, value: o.unit === 'KSh billion' ? o.value * 1000 : o.value, as_at: o.as_at, accounting_basis: o.accounting_basis, scope: SCOPE(o.scope || ''),
      publisher: KIND[o.source_kind] || o.source_kind, source_id: o.source_id, title: s.title || o.source_id, published: s.publication_date || 'not stated',
      pdf_page: o.pdf_page, printed_page: o.printed_page, url: pageUrl(o.source_id, o.pdf_page), basis: o.basis || o.note || '', printed: o.original_text || '',
      read: o.read_method, source_error: o.source_error || null,
      cases: ledger.discrepancies.filter((d) => d.claim_a.observation_id === o.id || d.claim_b.observation_id === o.id).map((d) => d.case_id),
    };
  }).sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
}
const range = (rows) => ({ min: Math.min(...rows.map((r) => r.value)), max: Math.max(...rows.map((r) => r.value)) });

// ---- Source-document errors ----
// Every record carrying source_error, with what a reader needs to find it. Kept as published; not our corrections.
// Record key of the county urban/rural 2022 source error: one stable token (no comma or space), used by the people page.
const COUNTY_POP_SE = 'population.urban_rural_2022';
const SE_PAGES = { 'siaya-fiscal-ledger': ['/counties/siaya/ledger/'], 'siaya-health': ['/counties/siaya/health/'], history: ['/data/'], county: ['/counties/siaya/people/'] };
function sourceErrors() {
  const out = [];
  ledger.observations.filter((o) => o.source_error).forEach((o) => out.push({
    dataset: 'siaya-fiscal-ledger', record: o.id, label: `${(ledger.measures[o.measure] || {}).label || o.measure}, FY ${o.fy}`, value: `${fmtNum(o.value)} ${o.unit}`,
    source_id: o.source_id, source: (SRC[o.source_id] || {}).title || o.source_id, url: pageUrl(o.source_id, o.source_error.page), ...o.source_error, pages: SE_PAGES['siaya-fiscal-ledger'],
  }));
  health.observations.filter((o) => o.source_error).forEach((o) => { const s = health.sources.find((x) => x.id === o.source_id) || {}; out.push({ dataset: 'siaya-health', record: o.id, label: `${o.label}, ${o.period}`, value: `${o.value}${o.unit}`, source_id: o.source_id, source: s.title || o.source_id, url: s.url ? `${s.url}#page=${o.source_error.page}` : null, ...o.source_error, pages: SE_PAGES['siaya-health'] }); });
  (hist.health.hiv.points || []).filter((p) => p.source_error).forEach((p) => out.push({ dataset: 'history', record: `hiv:${p.year}`, label: `Adult HIV prevalence, ${p.year}`, value: `${p.value}%`, source_id: 'SCASP-2015', source: p.document, url: `${p.url}#page=${p.source_error.page}`, ...p.source_error, pages: ['/counties/siaya/health/'] }));
  hist.years.forEach((y) => Object.entries(y.provenance || {}).filter(([, p]) => p.source_error).forEach(([k, p]) => {
    const d = manifest.documents.find((x) => x.id === p.source_id) || {};
    out.push({ dataset: 'history', record: `years:${y.fy}:${k}`, label: `${k === 'recurrent_spent' ? 'Recurrent spending' : k.replace(/_/g, ' ')}, FY ${y.fy}`, value: `${y[k]}${/_pct$/.test(k) ? '%' : /_m$/.test(k) ? ' KSh million' : ' KSh billion'}`, source_id: p.source_id, source: d.title || p.source_id, url: d.file_url ? `${d.file_url}#page=${p.source_error.page}` : d.url, ...p.source_error, pages: SE_PAGES.history });
  }));
  if (county.population.source_error) out.push({ dataset: 'county', record: COUNTY_POP_SE, label: 'Urban and rural population, 2022 (CIDP projection)', value: `${fmtNum(county.population.urban_2022)} and ${fmtNum(county.population.rural_2022)}`, source_id: 'CIDP 2023-2027', source: county.source, url: `${county.source_url}#page=${county.population.source_error.page}`, ...county.population.source_error, pages: SE_PAGES.county });
  return out;
}

// ---- Corrections register ----
// Our corrections: resolved register cases with register "our_correction", and the data corrections log.
function corrections() {
  const fromRegister = conflicts.conflicts.filter((c) => c.status === 'resolved' && c.register === 'our_correction').map((c) => ({ id: c.id, origin: 'conflict register', measure: c.measure, ...c.correction, case_href: `/data/#${c.id}` }));
  const fromLog = (corrLog.entries || []).map((e) => ({ origin: 'data corrections log', case_href: null, ...e }));
  return [...fromRegister, ...fromLog].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id)));
}
// Source-error cases in the register (resolved as errors in the document, not ours).
const registerSourceErrors = () => conflicts.conflicts.filter((c) => c.status === 'resolved' && c.register === 'source_error');

module.exports = { COUNTY_POP_SE, classes, classOf, classCounts, CLASS_ORDER, CLASS_TONE, pendingAt, range, sourceErrors, corrections, registerSourceErrors, machine, machineBadge, machineCounts, corrLog };
