#!/usr/bin/env node
/*
 * Export the research deliverables (handover section 16) from the data files.
 *
 *   node scripts/export-research-deliverables.js [outDir]
 *
 * Writes to docs/research/ by default:
 *   SOURCE_REGISTER.csv, COVERAGE_MATRIX.csv, INDICATOR_DICTIONARY.md,
 *   RECONCILIATION_LEDGER.csv, NGO_PROGRAMME_REGISTER.csv, PROJECT_REGISTER.csv
 *
 * Read-only on data/. Output is deterministic: rows are sorted, no timestamps
 * are written, and the same data always gives byte-identical files.
 * CSV: RFC 4180 (CRLF, double-quote escaping), UTF-8 without BOM, header row.
 * Cells beginning with = + - @ (or tab / carriage return) are prefixed with an
 * apostrophe so spreadsheets do not run them as formulas.
 * Contractor fields from data/siaya-projects.json are never exported (owner
 * decision: withheld pending review).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

// ---------- helpers ----------

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortRows(rows, keys) {
  return rows.slice().sort((x, y) => {
    for (const k of keys) {
      const c = cmp(String(x[k] == null ? '' : x[k]), String(y[k] == null ? '' : y[k]));
      if (c) return c;
    }
    return 0;
  });
}

function uniqSorted(arr) {
  return [...new Set(arr.filter((v) => v !== null && v !== undefined && v !== '').map(String))].sort(cmp);
}

function cellText(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(cellText).filter((s) => s !== '').join('; ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function csvCell(v) {
  let s = cellText(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(columns, rows) {
  const lines = [columns.map(csvCell).join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}

// Normalise a period string to: "FY yyyy/yy", "yyyy-yyyy", "yyyy" or "not stated".
function yearOf(p) {
  if (p === null || p === undefined) return 'not stated';
  if (typeof p === 'number') return String(p);
  const s = String(p);
  let m = s.match(/(?:FY\s*)?((?:19|20)\d{2})\s*\/\s*(\d{2,4})\b/);
  if (m) return 'FY ' + m[1] + '/' + m[2].slice(-2);
  m = s.match(/\b((?:19|20)\d{2})\s*[-\u2013]\s*((?:19|20)\d{2})\b/);
  if (m) return m[1] + '-' + m[2];
  m = s.match(/\b((?:19|20)\d{2})\b/);
  if (m) return m[1];
  return 'not stated';
}

function periodType(p) {
  const y = yearOf(p);
  if (y.startsWith('FY ')) return 'fiscal year';
  if (/^\d{4}-\d{4}$/.test(y)) return 'multi-year range';
  if (/^\d{4}$/.test(y)) return 'calendar year or date';
  return 'not stated';
}

function classifyPublisher(text) {
  const s = String(text || '').toLowerCase();
  if (!s) return 'not stated';
  if (/takwimu/.test(s)) return 'takwimu_calculation';
  if (/controller of budget|controller_of_budget/.test(s)) return 'controller_of_budget';
  if (/senate_quoting/.test(s)) return 'parliament';
  if (/auditor[-_ ]general|audit_report/.test(s)) return 'auditor_general';
  if (/senate|national assembly|parliament/.test(s)) return 'parliament';
  if (/county government|county treasury|county assembly|siaya county|^county$|county_/.test(s)) return 'county_government';
  if (/national bureau of statistics|knbs|dhs program|household survey/.test(s)) return 'national_statistics';
  if (/world bank|iati|united nations|unicef|usaid|undp|fao|fcdo|european union|global fund|development partner/.test(s)) return 'development_partner';
  if (/journal|university|kemri|research|sentinel/.test(s)) return 'research';
  if (/budget partnership|ibp|aprm|nepad|foundation|civil society|ngo/.test(s)) return 'civil_society_or_peer_review';
  if (/ministry|state department|national aids|syndemic|nsdcc|ntld|commission|council|regulatory|wasreb|government of kenya|modelled estimate/.test(s)) return 'national_government';
  return 'other';
}

// ---------- source index (id -> publisher text) ----------

const lib = load('source-library.json');
const manifest = load('source-manifest.json');
const ledger = load('siaya-fiscal-ledger.json');
const conflicts = load('conflicts.json');
const history = load('history.json');
const cob = load('counties-cob.json');
const programmes = load('siaya-programmes.json');
const projects = load('siaya-projects.json');
const audits = load('siaya-audits.json');
const analysis = load('siaya-analysis.json');
const governance = load('siaya-governance.json');
const sector = {};
for (const n of ['agriculture', 'climate', 'economy', 'education', 'health']) sector[n] = load('siaya-' + n + '.json');

const pubIndex = {};
function addPub(id, text) {
  if (id && text && !pubIndex[id]) pubIndex[id] = text;
}
for (const n of Object.keys(sector)) {
  for (const s of sector[n].sources) addPub(s.source_id || s.id || s.document_id, [s.publisher, s.kind].filter(Boolean).join(' '));
}
for (const [id, s] of Object.entries(ledger.sources)) addPub(id, s.kind || s.publisher);
for (const d of projects.documents) addPub(d.doc_id, d.publisher);
for (const d of audits.documents) addPub(d.doc_id, 'Office of the Auditor-General');
for (const s of programmes.sources) addPub(s.id, s.publisher);
for (const s of governance.sources) addPub(s.source_id, s.publisher);
for (const d of lib.documents) addPub(d.document_id, d.publisher);
for (const d of manifest.documents) addPub(d.id, d.kind);
for (const n of Object.keys(sector)) {
  for (const s of sector[n].sources) if (s.library_id) addPub(s.library_id, s.publisher);
}

function srcType(id, fallback) {
  if (id && pubIndex[id]) return classifyPublisher(pubIndex[id]);
  if (fallback) return classifyPublisher(fallback);
  return 'not stated';
}

// ---------- 1. SOURCE_REGISTER ----------

function sourceRegister() {
  const bySha = {};
  for (const m of manifest.documents) if (m.sha256) bySha[m.sha256] = m;
  const corpus = fs
    .readdirSync(DATA)
    .filter((f) => f.endsWith('.json') && f !== 'source-library.json' && f !== 'source-manifest.json')
    .sort(cmp)
    .map((f) => [f, fs.readFileSync(path.join(DATA, f), 'utf8')]);
  const rows = lib.documents.map((d) => {
    const m = d.sha256 ? bySha[d.sha256] : null;
    const needles = ['"' + d.document_id + '"'];
    if (d.sha256) needles.push(d.sha256);
    if (m) needles.push('"' + m.id + '"');
    const cited = corpus.filter(([, txt]) => needles.some((n) => txt.includes(n))).map(([f]) => 'data/' + f);
    return {
      document_id: d.document_id,
      title: d.title,
      publisher: d.publisher,
      source_type: classifyPublisher(d.publisher),
      document_type: d.document_type,
      origin: d.origin,
      publication_date: d.publication_date,
      reference_period: d.reference_period,
      geographic_coverage: d.geographic_coverage,
      siaya_relevance: d.siaya_relevance,
      research_use: d.research_use,
      source_url: d.source_url,
      file_url: m ? m.file_url : '',
      retrieval_status: d.retrieval_status,
      retrieval_note: d.retrieval_note,
      last_checked_at: d.last_checked_at,
      manifest_id: m ? m.id : '',
      manifest_retrieved: m ? m.retrieved : '',
      manifest_hashed_on: m ? m.hashed_on : '',
      sha256: d.sha256,
      bytes: d.bytes,
      licence: d.licence,
      redistribution_allowed: d.redistribution_allowed,
      review_status: d.review_status,
      cited_in: cited,
    };
  });
  const cols = Object.keys(rows[0] || { document_id: '' });
  return toCsv(cols, sortRows(rows, ['document_id']));
}

// ---------- normalised observations and gaps ----------

const obs = []; // {dataset, sector, subsector, key, name, unit, period, geography, source_type, source_id, method, function, denominator, definition, table}
const gaps = []; // {dataset, sector, subsector, key, period, geography}
const SIAYA = 'county: Siaya';

function O(o) {
  obs.push(Object.assign({ subsector: '', geography: SIAYA, method: '', function: '', denominator: '', definition: '', table: '', unit: '', name: '' }, o));
}
function G(g) {
  gaps.push(Object.assign({ subsector: '', geography: SIAYA, period: null, key: '' }, g));
}

// sector files
{
  const d = sector.agriculture;
  for (const o of d.observations) O({ dataset: 'siaya-agriculture', sector: 'agriculture', key: o.indicator, name: o.indicator, unit: o.unit, period: o.period, source_id: o.source_id, source_type: srcType(o.source_id), method: o.status, table: o.table });
  for (const g of d.gaps) G({ dataset: 'siaya-agriculture', sector: 'agriculture', key: g.item, period: g.period });
}
{
  const d = sector.climate;
  for (const o of d.observations) O({ dataset: 'siaya-climate', sector: 'climate_environment', key: o.series, name: o.measure, unit: o.unit, period: o.period, geography: o.geography === 'county' ? SIAYA : o.geography, source_id: o.source_id, source_type: srcType(o.source_id), method: o.kind, definition: o.definition, table: o.table });
  for (const g of d.gaps) G({ dataset: 'siaya-climate', sector: 'climate_environment', key: g.topic, period: g.period });
}
{
  const d = sector.economy;
  const srcId = (v) => (d.sources.find((s) => s.vintage === v) || {}).document_id;
  for (const o of d.observations) {
    const sid = srcId(o.vintage);
    O({ dataset: 'siaya-economy', sector: 'economy', subsector: o.sector || '', key: o.indicator, name: o.indicator, unit: o.unit + (o.price_basis ? ' (' + o.price_basis + ' prices)' : ''), period: o.period, source_id: sid, source_type: srcType(sid, 'knbs'), method: o.read_method, definition: d.meta.definitions[o.indicator] || '', table: o.table });
  }
  for (const g of d.gaps) G({ dataset: 'siaya-economy', sector: 'economy', key: g.indicator, period: g.period });
}
{
  const d = sector.education;
  for (const o of d.observations) O({ dataset: 'siaya-education', sector: 'education', key: o.indicator, name: o.indicator, unit: o.unit, period: o.period, source_id: o.source_id, source_type: srcType(o.source_id), method: o.value_type, function: o.function, table: o.table });
  for (const g of d.gaps) G({ dataset: 'siaya-education', sector: 'education', key: g.indicator, period: g.period });
}
{
  const d = sector.health;
  for (const o of d.observations) {
    const geo = o.geography === 'county' ? SIAYA : o.geography;
    O({ dataset: 'siaya-health', sector: 'health', key: o.measure, name: o.label, unit: o.unit, period: o.period, geography: geo, source_id: o.source_id, source_type: srcType(o.source_id), method: o.method, denominator: o.population || o.age_group || '', table: o.table });
  }
  for (const g of d.gaps) G({ dataset: 'siaya-health', sector: 'health', key: g.measure, period: g.period });
}

// fiscal ledger
for (const o of ledger.observations) {
  const m = ledger.measures[o.measure] || {};
  O({ dataset: 'siaya-fiscal-ledger', sector: 'public_finance', key: o.measure, name: m.label, unit: o.unit, period: 'FY ' + o.fy, source_id: o.source_id, source_type: classifyPublisher(o.source_kind), method: o.read_method, definition: m.definition, table: o.table });
}
for (const [measure, years] of Object.entries(ledger.completeness)) {
  for (const [fy, c] of Object.entries(years)) if (c.missing) G({ dataset: 'siaya-fiscal-ledger', sector: 'public_finance', key: measure, period: 'FY ' + fy });
}

// counties-cob (47 counties)
const COB_DEFS = cob.meta.fields;
function cobDef(field) {
  if (COB_DEFS[field]) return COB_DEFS[field];
  if (/_absorption_pct$/.test(field)) return COB_DEFS['*_absorption_pct'];
  if (/^total_osr_(actual|target)$/.test(field)) return COB_DEFS['total_osr_actual/target'];
  if (/^pb_/.test(field)) return COB_DEFS['pb_*'];
  return '';
}
for (const y of cob.years) {
  for (const c of y.counties) {
    for (const [f, v] of Object.entries(c)) {
      if (!v || typeof v !== 'object' || !('value' in v)) continue;
      const geo = 'county: ' + c.name;
      if (v.value === null) G({ dataset: 'counties-cob', sector: 'public_finance', key: f, period: 'FY ' + y.fy, geography: geo });
      else O({ dataset: 'counties-cob', sector: 'public_finance', key: f, name: f, unit: v.unit, period: 'FY ' + y.fy, geography: geo, source_id: y.source_id, source_type: 'controller_of_budget', method: v.read, definition: cobDef(f), table: v.table });
    }
  }
}

// history.json
{
  const H = history;
  const units = {
    spent: 'KSh billion', approved: 'KSh billion', recurrent_budget: 'KSh billion', development_budget: 'KSh billion',
    recurrent_spent: 'KSh billion', development_spent: 'KSh billion', recurrent_absorption_pct: '%', development_absorption_pct: '%',
    osr_m: 'KSh million', osr_target_m: 'KSh million', pending_development_m: 'KSh million', pending_recurrent_m: 'KSh million', pending_total_m: 'KSh million',
  };
  const skip = new Set(['fy', 'report', 'caveat', 'provenance', 'field_source', 'derived']);
  for (const y of H.years) {
    for (const [k, v] of Object.entries(y)) {
      if (skip.has(k) || typeof v !== 'number') continue;
      const prov = (y.provenance || {})[k] || {};
      O({ dataset: 'history', sector: 'public_finance', key: 'years.' + k, name: k, unit: units[k] || H.meta.unit, period: 'FY ' + y.fy, source_id: prov.source_id, source_type: srcType(prov.source_id, 'controller of budget'), method: prov.read || '', definition: 'Annual value for Siaya County; ' + H.meta.basis });
    }
  }
  for (const p of H.osr_series.points) O({ dataset: 'history', sector: 'public_finance', key: 'osr_series', name: H.osr_series.label, unit: 'KSh million', period: 'FY ' + p.fy, source_id: p.source_id, source_type: srcType(p.source_id, 'controller of budget'), method: p.read });
  for (const p of H.audits.points) O({ dataset: 'history', sector: 'audit', key: 'audits.opinion', name: H.audits.label, unit: 'opinion category', period: 'FY ' + p.fy, source_id: p.source_id, source_type: srcType(p.source_id, 'auditor-general'), method: p.read });
  for (const y of H.pending_rollforward.years) {
    for (const term of ['opening', 'new_bills', 'payments', 'adjustments', 'closing']) {
      const t = y[term] || {};
      const k = 'pending_rollforward.' + term;
      if (typeof t.value === 'number') O({ dataset: 'history', sector: 'public_finance', key: k, name: term.replace('_', ' ') + ' (pending bills)', unit: 'KSh million', period: 'FY ' + y.fy, source_id: t.source_id || y.source_id, source_type: srcType(t.source_id || y.source_id, 'controller of budget'), method: t.read || '', definition: H.pending_rollforward.identity });
      else G({ dataset: 'history', sector: 'public_finance', key: k, period: 'FY ' + y.fy });
    }
  }
  for (const i of H.health.indicators) {
    for (const [yr, k] of [[2014, 'v2014'], [2022, 'v2022']]) {
      if (typeof i[k] === 'number') O({ dataset: 'history', sector: 'health', key: 'health.' + i.id, name: i.label, unit: i.unit, period: String(yr), source_type: 'national_statistics', method: 'household survey (KDHS)' });
      else G({ dataset: 'history', sector: 'health', key: 'health.' + i.id, period: String(yr) });
    }
  }
  for (const p of H.health.hiv.points) O({ dataset: 'history', sector: 'health', key: 'health.hiv', name: H.health.hiv.label, unit: '%', period: p.year, source_type: 'national_government', method: 'modelled estimate', denominator: p.age_group ? 'adults ' + p.age_group : '' });
  for (const p of H.poverty.points) O({ dataset: 'history', sector: 'economy', subsector: 'poverty', key: 'poverty.' + p.measure, name: p.measure, unit: '%', period: p.year, source_type: classifyPublisher(p.source), method: '' });
  if (H.poverty.gap) G({ dataset: 'history', sector: 'economy', subsector: 'poverty', key: 'poverty', period: H.poverty.gap });
  for (const p of H.population.points) O({ dataset: 'history', sector: 'demography', key: 'population', name: H.population.label, unit: 'persons', period: p.year, source_type: classifyPublisher(p.source || 'knbs'), method: p.kind });
  for (const per of H.in_year.periods) {
    for (const f of per.figures) O({ dataset: 'history', sector: 'public_finance', subsector: 'in-year (partial)', key: 'in_year.' + f.measure, name: f.label, unit: f.unit, period: 'FY ' + H.in_year.fy, source_type: 'controller_of_budget', method: f.read, definition: H.in_year.comparability + ' (' + per.period + ', cumulative)' });
  }
  for (const g of H.meta.gaps) G({ dataset: 'history', sector: 'public_finance', key: 'meta.gaps', period: g });
}

// audits
for (const f of audits.findings) O({ dataset: 'siaya-audits', sector: 'audit', subsector: f.entity, key: 'finding.' + f.category, name: 'Audit finding: ' + f.category, unit: 'finding', period: 'FY ' + f.fy, source_id: f.doc_id, source_type: 'auditor_general', method: audits.meta.method || '' });
for (const o of audits.opinions) O({ dataset: 'siaya-audits', sector: 'audit', subsector: o.entity, key: 'opinion', name: 'Audit opinion', unit: 'opinion category', period: 'FY ' + o.fy, source_id: o.doc_id, source_type: srcType(o.doc_id, 'auditor-general'), method: '' });
for (const g of audits.gaps) G({ dataset: 'siaya-audits', sector: 'audit', subsector: g.entity, key: g.status, period: 'FY ' + g.fy });

// analysis (Takwimu calculations)
for (const r of analysis.records) {
  const base = { dataset: 'siaya-analysis', sector: 'analysis', subsector: r.family, key: r.family, period: r.period };
  if (r.status === 'gap') G(base);
  else {
    const op = r.calc && r.calc.op;
    const den = r.calc && r.calc.denominator_roles ? 'roles: ' + r.calc.denominator_roles.join(' + ') : /per.capita/.test(op || '') ? 'population' : '';
    O(Object.assign(base, { name: analysis.meta.families[r.family], unit: r.unit, source_id: '', source_type: 'takwimu_calculation', method: op || '', denominator: den, definition: analysis.meta.families[r.family] }));
  }
}

// governance
for (const e of governance.ibp_cbts.editions) {
  for (const i of e.items) O({ dataset: 'siaya-governance', sector: 'governance', key: 'ibp_cbts.' + i.measure, name: i.measure, unit: i.unit || 'text', period: i.year, source_id: i.source_id, source_type: 'civil_society_or_peer_review', method: 'IBP County Budget Transparency Survey', definition: governance.ibp_cbts.method_note });
}
for (const f of governance.aprm.findings) O({ dataset: 'siaya-governance', sector: 'governance', key: 'aprm.finding', name: 'APRM county review finding', unit: 'text', period: f.year, source_id: f.source_id, source_type: 'civil_society_or_peer_review', method: 'County Peer Review Mechanism', definition: governance.aprm.method_note });

// projects
const docType = {};
for (const d of projects.documents) docType[d.doc_id] = d;
function projGeo(p) {
  const l = p.location || {};
  if ((l.ward_ids || []).length) return 'ward';
  if ((l.constituency_ids || []).length) return 'constituency';
  if (l.countywide) return SIAYA + ' (countywide)';
  return 'location unresolved';
}
for (const p of projects.projects) {
  for (const a of p.amounts || []) O({ dataset: 'siaya-projects', sector: 'projects', subsector: p.sector, key: 'amount.' + a.kind, name: 'Project amount: ' + a.kind, unit: a.unit, period: a.fy ? 'FY ' + a.fy : null, geography: projGeo(p), source_id: a.doc_id, source_type: srcType(a.doc_id), method: (docType[a.doc_id] || {}).text_method || '', definition: projects.meta.amount_rule });
  O({ dataset: 'siaya-projects', sector: 'projects', subsector: p.sector, key: 'status', name: 'Project status', unit: 'status state', period: p.last_evidence_date, geography: projGeo(p), source_id: (p.status_source || {}).doc_id, source_type: srcType((p.status_source || {}).doc_id), method: (p.status_source || {}).evidence_type || '', definition: 'One of: ' + projects.meta.status_states.join(', ') });
}
for (const g of projects.gaps) G({ dataset: 'siaya-projects', sector: 'projects', key: 'gap', period: typeof g === 'string' ? g : g.topic || g.reason });

// programmes
for (const p of programmes.programmes) {
  const sid = ((p.sources || [])[0] || {}).source_id;
  const base = { dataset: 'siaya-programmes', sector: 'ngo_donor_programmes', subsector: p.sector, period: (p.period || {}).start, geography: (p.geography || {}).class, source_id: sid, source_type: srcType(sid), method: p.evidence_type };
  O(Object.assign({}, base, { key: 'programme_record', name: 'Programme record', unit: 'record' }));
  for (const a of p.amounts || []) O(Object.assign({}, base, { key: 'amount.' + a.kind, name: 'Programme amount: ' + a.kind, unit: a.currency, denominator: '', definition: a.pooled ? 'pooled total (not a Siaya figure)' : 'as published' }));
  for (const b of p.beneficiaries || []) O(Object.assign({}, base, { key: 'beneficiaries', name: 'Beneficiaries as printed', unit: b.unit, definition: b.pooled ? 'pooled total (not a Siaya figure)' : 'as published' }));
}
for (const g of programmes.gaps) G({ dataset: 'siaya-programmes', sector: 'ngo_donor_programmes', key: g.topic, period: g.detail });

// ---------- 2. COVERAGE_MATRIX ----------

function coverageMatrix() {
  const cells = new Map();
  const keyOf = (r, st) => [r.dataset, r.sector, r.subsector || '', yearOf(r.period), r.geography || '', st].join('\u0000');
  const bump = (k, field) => {
    if (!cells.has(k)) {
      const [dataset, sec, subsector, year, geography, source_type] = k.split('\u0000');
      cells.set(k, { dataset, sector: sec, subsector, year, geography, source_type, observations: 0, gaps: 0 });
    }
    cells.get(k)[field]++;
  };
  for (const o of obs) bump(keyOf(o, o.source_type || 'not stated'), 'observations');
  for (const g of gaps) bump(keyOf(g, 'gap (no source)'), 'gaps');
  const cols = ['sector', 'subsector', 'year', 'geography', 'source_type', 'dataset', 'observations', 'gaps'];
  return toCsv(cols, sortRows([...cells.values()], ['sector', 'subsector', 'year', 'geography', 'source_type', 'dataset']));
}

// ---------- 3. INDICATOR_DICTIONARY ----------

function mdCell(v) {
  return cellText(v).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}
function clip(list, n) {
  return list.length > n ? list.slice(0, n).concat(['(+' + (list.length - n) + ' more)']) : list;
}

function indicatorDictionary() {
  const groups = new Map();
  for (const o of obs) {
    const k = o.dataset + '\u0000' + o.key;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  }
  const rows = [...groups.entries()].map(([k, list]) => {
    const [dataset, key] = k.split('\u0000');
    const units = uniqSorted(list.map((o) => o.unit));
    const defs = uniqSorted(list.map((o) => o.definition));
    const tables = uniqSorted(list.map((o) => o.table));
    let definition = defs.length ? clip(defs, 2).join(' / ') : '';
    if (!definition) definition = tables.length ? 'Not defined in the data file; values as printed in: ' + clip(tables, 3).join('; ') : 'Not defined in the data file';
    const dens = uniqSorted(list.map((o) => o.denominator));
    const pct = units.some((u) => /%|percent|ratio|per /i.test(u));
    return {
      dataset,
      key,
      name: uniqSorted(list.map((o) => o.name))[0] || key,
      sector: uniqSorted(list.map((o) => o.sector)).join(', '),
      definition,
      unit: units.join('; ') || 'not stated',
      denominator: dens.length ? clip(dens, 4).join('; ') : pct ? 'not stated in the data file' : 'n/a (not a ratio)',
      period_type: uniqSorted(list.map((o) => periodType(o.period))).join('; '),
      method: clip(uniqSorted(list.map((o) => o.method)), 4).join('; ') || 'not stated',
      function: uniqSorted(list.map((o) => o.function)).join('; '),
      sources: clip(uniqSorted(list.map((o) => o.source_id)), 6).join('; '),
      n: list.length,
    };
  });
  const sorted = sortRows(rows, ['dataset', 'key']);
  const out = [];
  out.push('# Indicator dictionary');
  out.push('');
  out.push('Generated by `node scripts/export-research-deliverables.js` from the data files; do not edit by hand.');
  out.push('');
  out.push('One row per measure or indicator key, per data file: `data/siaya-*.json`, `data/history.json` and `data/counties-cob.json`. ' +
    '"Definition as used" is the definition the data file itself gives; where it gives none, the tables the values were read from are named instead. ' +
    '"Function" (devolved or national, Constitution Fourth Schedule) is filled only where the data file records it. ' +
    '"Denominator" is the population, age band or ratio roles recorded with the value; "not stated in the data file" means the value is a rate whose denominator is not recorded. ' +
    '"Obs" is the number of non-null observations; gaps are counted in COVERAGE_MATRIX.csv.');
  out.push('');
  const cols = ['Dataset', 'Key', 'Name', 'Sector', 'Definition as used', 'Unit', 'Denominator', 'Period type', 'Method', 'Function', 'Source datasets / ids', 'Obs'];
  out.push('| ' + cols.join(' | ') + ' |');
  out.push('|' + cols.map(() => '---').join('|') + '|');
  for (const r of sorted) {
    out.push('| ' + ['data/' + r.dataset + '.json', '`' + r.key + '`', r.name, r.sector, r.definition, r.unit, r.denominator, r.period_type, r.method, r.function, r.sources, r.n].map(mdCell).join(' | ') + ' |');
  }
  out.push('');
  return { text: out.join('\n'), count: sorted.length };
}

// ---------- 4. RECONCILIATION_LEDGER ----------

function reconciliationLedger() {
  const rows = [];
  for (const d of ledger.discrepancies) {
    const m = ledger.measures[d.indicator_id] || {};
    rows.push({
      register: 'data/siaya-fiscal-ledger.json',
      case_id: d.case_id,
      indicator: d.indicator_id,
      indicator_label: m.label,
      period: d.period,
      unit: 'KSh million',
      value_a: d.claim_a.value_ksh_m,
      source_a: d.source_a.source_id,
      page_a: d.source_a.pdf_page,
      observation_a: d.claim_a.observation_id,
      value_b: d.claim_b.value_ksh_m,
      source_b: d.source_b.source_id,
      page_b: d.source_b.pdf_page,
      observation_b: d.claim_b.observation_id,
      all_values: '',
      difference_abs: d.difference.absolute_ksh_m,
      difference_pct_of_smaller: d.difference.pct_of_smaller,
      explanation: d.possible_basis_mismatch,
      status: d.status,
      verification_state: '',
      resolution_or_effect: d.resolution,
      reviewer: d.reviewer,
      reviewed_at: d.reviewed_at,
      is_osr_case: /osr/.test(d.indicator_id),
    });
  }
  for (const c of conflicts.conflicts) {
    const v = c.values || [];
    const a = v[0] || {};
    const b = v[1] || {};
    let diff = '';
    let pct = '';
    if (typeof a.value === 'number' && typeof b.value === 'number') {
      diff = Math.round(Math.abs(a.value - b.value) * 100) / 100;
      const small = Math.min(Math.abs(a.value), Math.abs(b.value));
      pct = small ? Math.round((diff / small) * 10000) / 100 : '';
    }
    rows.push({
      register: 'data/conflicts.json',
      case_id: c.id,
      indicator: c.measure,
      indicator_label: c.measure,
      period: yearOf(c.measure + ' ' + c.id),
      unit: c.unit,
      value_a: a.value,
      source_a: a.label,
      page_a: a.url,
      observation_a: '',
      value_b: b.value,
      source_b: b.label,
      page_b: b.url,
      observation_b: '',
      all_values: v.map((x) => x.label + ': ' + cellText(x.value)),
      difference_abs: diff,
      difference_pct_of_smaller: pct,
      explanation: [c.definitions, c.hypothesis ? 'Hypothesis: ' + c.hypothesis : ''].filter(Boolean),
      status: c.status,
      verification_state: c.verification_state,
      resolution_or_effect: c.effect,
      reviewer: '',
      reviewed_at: '',
      is_osr_case: /osr|own-source/i.test(c.id + ' ' + c.measure),
    });
  }
  const cols = Object.keys(rows[0]);
  return toCsv(cols, sortRows(rows, ['register', 'case_id']));
}

// ---------- 5. NGO_PROGRAMME_REGISTER ----------

function programmeRegister() {
  const rows = programmes.programmes.map((p) => {
    const amounts = p.amounts || [];
    const bens = p.beneficiaries || [];
    const outs = p.outputs_outcomes_as_stated || [];
    const pooled = amounts.concat(bens).some((x) => x.pooled === true);
    const g = p.geography || {};
    const ev = p.evaluation;
    return {
      id: p.id,
      title: p.title,
      implementing_organisation: p.implementing_organisation,
      implementing_organisation_type: p.implementing_organisation_type,
      funder: p.funder,
      funder_basis: p.funder_basis,
      sector: p.sector,
      geography_class: g.class,
      wards_as_printed: g.wards_as_printed,
      areas_as_printed: g.areas_as_printed,
      other_counties_as_printed: g.other_counties_as_printed,
      period_start: (p.period || {}).start,
      period_end: (p.period || {}).end,
      status: p.status,
      evidence_type: p.evidence_type,
      tier: p.tier,
      pooled: pooled,
      amounts: amounts.map((a) => [a.kind, cellText(a.value), a.currency, a.period, a.pooled ? 'pooled' : 'not pooled'].filter(Boolean).join(' ')),
      beneficiaries: bens.map((b) => [cellText(b.value), b.unit, b.pooled ? 'pooled' : 'not pooled'].filter(Boolean).join(' ')),
      outcomes_stated: outs.length,
      outcomes_attributable_to_siaya: outs.filter((o) => o.attributable_to_siaya === true).length,
      evaluation: ev ? [ev.by, ev.date, ev.rating_as_published, 'scope: ' + ev.scope, 'Siaya disaggregated: ' + ev.siaya_disaggregated].filter(Boolean).join('; ') : '',
      parent_programme: p.parent_programme,
      source_ids: uniqSorted((p.sources || []).map((s) => s.source_id)),
      source_locators: (p.sources || []).map((s) => [s.source_id, s.page, s.locator].filter(Boolean).join(' ')),
    };
  });
  const cols = Object.keys(rows[0]);
  return toCsv(cols, sortRows(rows, ['id']));
}

// ---------- 6. PROJECT_REGISTER (no contractor fields) ----------

function projectRegister() {
  const indep = new Set(projects.meta.independent_evidence_types);
  const rows = projects.projects.map((p) => {
    const ev = p.evidence || [];
    const types = uniqSorted(ev.map((e) => e.evidence_type));
    const indepEv = ev.filter((e) => indep.has(e.evidence_type));
    const verified = ev.some((e) => indep.has(e.evidence_type) && e.verifies_completion === true);
    let verification;
    if (verified) verification = 'independent: completion verified';
    else if (indepEv.some((e) => e.evidence_type === 'audit_physical_verification')) verification = 'independent: physical verification';
    else if (indepEv.length) verification = 'independent: documentary review';
    else if (types.some((t) => t !== 'county_development_plan')) verification = 'county-reported only';
    else verification = 'plan only';
    const c = p.contract || {};
    const l = p.location || {};
    const ss = p.status_source || {};
    return {
      id: p.id,
      name: p.name,
      sector: p.sector,
      implementing_entity: p.implementing_entity,
      status: p.status,
      verification_type: verification,
      status_source: [ss.doc_id, ss.page ? 'p. ' + ss.page : '', ss.evidence_type, ss.as_at].filter(Boolean).join(' '),
      last_evidence_date: p.last_evidence_date,
      evidence_types: types,
      independent_evidence_count: indepEv.length,
      evidence_count: ev.length,
      ward_ids: l.ward_ids,
      constituency_ids: l.constituency_ids,
      countywide: l.countywide,
      location_unresolved: (l.unresolved || []).map((u) => u.text),
      contract_reference: c.reference,
      contract_signed: c.signed,
      contract_start: c.start,
      expected_completion: c.expected_completion,
      amounts: (p.amounts || []).map((a) => [a.kind, cellText(a.value), a.unit, a.fy ? 'FY ' + a.fy : '', a.doc_id].filter(Boolean).join(' ')),
      audit_finding_ids: p.audit_finding_ids,
      conflict_fields: (p.conflicts || []).map((x) => x.field),
      related_project_ids: p.related_project_ids,
      source_doc_ids: uniqSorted(ev.map((e) => e.doc_id).concat((p.amounts || []).map((a) => a.doc_id))),
      status_note: p.status_note,
    };
  });
  const cols = Object.keys(rows[0]);
  if (cols.some((k) => /contractor/i.test(k))) throw new Error('contractor column in PROJECT_REGISTER');
  return toCsv(cols, sortRows(rows, ['id']));
}

// ---------- main ----------

function exportAll(outDir) {
  const dict = indicatorDictionary();
  const files = {
    'SOURCE_REGISTER.csv': sourceRegister(),
    'COVERAGE_MATRIX.csv': coverageMatrix(),
    'INDICATOR_DICTIONARY.md': dict.text,
    'RECONCILIATION_LEDGER.csv': reconciliationLedger(),
    'NGO_PROGRAMME_REGISTER.csv': programmeRegister(),
    'PROJECT_REGISTER.csv': projectRegister(),
  };
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), text, 'utf8');
  return {
    files: Object.keys(files),
    counts: {
      observations: obs.length,
      gaps: gaps.length,
      indicators: dict.count,
      sources: lib.documents.length,
      reconciliation: ledger.discrepancies.length + conflicts.conflicts.length,
      programmes: programmes.programmes.length,
      projects: projects.projects.length,
    },
  };
}

module.exports = { exportAll, toCsv, csvCell, yearOf };

if (require.main === module) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'docs', 'research'));
  const r = exportAll(out);
  console.log('Wrote ' + r.files.length + ' files to ' + path.relative(ROOT, out) + ': ' + JSON.stringify(r.counts));
}
