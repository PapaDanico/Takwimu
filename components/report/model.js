// Report data model: every figure in a report is a pointer into one of the repo's data files, read at build time.
// A figure (fig) carries the file, a JSON Pointer to the value, the value itself and the record's own source, page,
// period, unit and confidence. Nothing is typed in by hand: scripts/test-reports.js resolves every pointer on the
// built HTML page against the data file and fails if the value differs. Server and build only.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import history from '../../data/history.json';
import ledger from '../../data/siaya-fiscal-ledger.json';
import economy from '../../data/siaya-economy.json';
import health from '../../data/siaya-health.json';
import education from '../../data/siaya-education.json';
import agriculture from '../../data/siaya-agriculture.json';
import climate from '../../data/siaya-climate.json';
import projects from '../../data/siaya-projects.json';
import governance from '../../data/siaya-governance.json';
import programmes from '../../data/siaya-programmes.json';
import audits from '../../data/siaya-audits.json';
import analysis from '../../data/siaya-analysis.json';
import geography from '../../data/siaya-geography.json';
import cob from '../../data/counties-cob.json';
import library from '../../data/source-library.json';
import registry from './reports.json';

export const DATA = {
  'history.json': history, 'siaya-fiscal-ledger.json': ledger, 'siaya-economy.json': economy, 'siaya-health.json': health,
  'siaya-education.json': education, 'siaya-agriculture.json': agriculture, 'siaya-climate.json': climate,
  'siaya-projects.json': projects, 'siaya-governance.json': governance, 'siaya-programmes.json': programmes,
  'siaya-audits.json': audits, 'siaya-analysis.json': analysis, 'siaya-geography.json': geography,
  'counties-cob.json': cob, 'source-library.json': library,
};
export { registry };

// JSON Pointer (RFC 6901): "/observations/3/value". Keys containing "/" (fiscal years) are escaped as "~1".
const esc = (k) => String(k).replace(/~/g, '~0').replace(/\//g, '~1');
export const P = (...parts) => `/${parts.map(esc).join('/')}`;
export function get(file, ptr) {
  let v = DATA[file];
  if (v === undefined) throw new Error(`Unknown data file ${file}`);
  for (const raw of ptr.split('/').slice(1)) {
    const k = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (v == null || !(k in Object(v))) throw new Error(`Pointer ${file}#${ptr} does not resolve`);
    v = v[k];
  }
  return v;
}
// Pointer to the first element of file[arrPath] that matches pred.
export function find(file, arrPath, pred) {
  const arr = get(file, arrPath);
  const i = arr.findIndex(pred);
  if (i < 0) throw new Error(`No record in ${file}#${arrPath} matches`);
  return `${arrPath}/${i}`;
}
export const each = (file, arrPath, pred = () => true) => get(file, arrPath).map((r, i) => [r, `${arrPath}/${i}`]).filter(([r]) => pred(r));

// A figure is reviewed only when its record carries an approval with a reviewer and a date (owner rule,
// 21 Nov 2026). No record in the data files has one yet, so every figure is provisional.
export const isReviewed = (rec) => !!(rec && rec.review && rec.review.decision === 'approved' && rec.review.reviewer && rec.review.reviewed_at);
export const PROVISIONAL = 'Provisional: awaiting editorial review';

// fig(file, pointer-to-value, overrides). Metadata comes from the record that holds the value unless overridden.
export function fig(file, ptr, o = {}) {
  const segs = ptr.split('/');
  const recPtr = segs.slice(0, -1).join('/');
  const rec = o.rec || (recPtr ? get(file, recPtr) : DATA[file]);
  const value = get(file, ptr);
  const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== '');
  return {
    file, ptr, value,
    label: o.label,
    unit: pick(o.unit, rec.unit, null),
    period: pick(o.period, rec.period, rec.fy, rec.year, null),
    source: pick(o.source, rec.source_id, rec.doc_id, null),
    page: pick(o.page, rec.pdf_page, rec.page_pdf, rec.page, null),
    printed: pick(o.printed, rec.printed_page, rec.page_printed, null),
    confidence: pick(o.confidence, rec.confidence, null),
    note: o.note || null,
    suppress: !!(o.suppressSmall && typeof value === 'number' && value < 10 && /^(persons|people|patients|cases|deaths|children|youth|students|pupils|trainees|women|men|beneficiaries)/i.test(String(pick(o.unit, rec.unit, '')))),
    reviewed: isReviewed(o.reviewRec || rec),
  };
}

// Source index: every source, document or library entry the data files describe, keyed by its id.
const SRC = {};
const addSrc = (id, s, file, extra = {}) => {
  if (!id || !s) return;
  const n = {
    id, file,
    title: s.title || s.name || id,
    publisher: s.publisher || s.issuer || null,
    date: s.publication_date || s.published || s.report_date || s.cover_date || (s.year ? String(s.year) : null),
    period: s.reference_period || s.period_assessed || s.period || null,
    url: s.url || s.file_url || s.source_url || s.library_url || null,
    sha256: s.sha256 || null,
    licence: s.licence || null,
    ...extra,
  };
  const prev = SRC[id];
  if (!prev || (!prev.sha256 && n.sha256)) SRC[id] = { ...prev, ...Object.fromEntries(Object.entries(n).filter(([, v]) => v != null)) };
};
library.documents.forEach((d) => addSrc(d.document_id, d, 'source-library.json'));
Object.entries(ledger.sources).forEach(([id, s]) => addSrc(id, s, 'siaya-fiscal-ledger.json'));
cob.years.forEach((y) => addSrc(y.source_id, y.source, 'counties-cob.json'));
audits.documents.forEach((d) => addSrc(d.doc_id, d, 'siaya-audits.json'));
projects.documents.forEach((d) => addSrc(d.doc_id, d, 'siaya-projects.json'));
programmes.sources.forEach((d) => addSrc(d.id, d, 'siaya-programmes.json'));
health.sources.forEach((d) => addSrc(d.id, d, 'siaya-health.json'));
climate.sources.forEach((d) => addSrc(d.id, d, 'siaya-climate.json'));
education.sources.forEach((d) => addSrc(d.source_id, d, 'siaya-education.json'));
agriculture.sources.forEach((d) => addSrc(d.source_id, d, 'siaya-agriculture.json'));
economy.sources.forEach((d) => addSrc(d.document_id, d, 'siaya-economy.json'));
governance.sources.forEach((d) => addSrc(d.source_id, d, 'siaya-governance.json'));
geography.sources.forEach((d) => addSrc(d.id, d, 'siaya-geography.json'));
export const source = (id) => SRC[id] || null;
export const ECON_SRC = Object.fromEntries(economy.sources.map((s) => [s.vintage, s.document_id]));

// Snapshot ID: SHA-256 over the names and SHA-256 digests of the report's input files, first 12 hex digits.
// The same data gives the same ID on every build; any change to an input file changes it.
const fileHash = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(), 'data', f))).digest('hex');
export function snapshot(inputs) {
  const files = [...inputs].sort().map((f) => ({ file: `data/${f}`, sha256: fileHash(f) }));
  const id = crypto.createHash('sha256').update(files.map((x) => `${x.file}:${x.sha256}`).join('\n')).digest('hex').slice(0, 12);
  return { id, files };
}
// Report date: the latest compile or retrieval date recorded in the input files (not the clock, so builds repeat).
export function dataDate(inputs) {
  const ds = inputs.map((f) => {
    const m = DATA[f].meta || {};
    return m.retrieved || m.compiled || m.extracted || m.updated || DATA[f].generated || null;
  }).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ''));
  return ds.sort().pop() || null;
}
