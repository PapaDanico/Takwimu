// Record-level leak scanner for county data that must not reach the built site (handover E04): held counties
// (draft / reviewable) and, for a published county, every file kind outside its `public_kinds` allowlist and every
// value rejected in editorial review. A sentinel is a string that exists only in the held records:
//   - "<dataset>:<record>" and "<dataset>|<record>" for every held record (the keys pages and payloads carry);
//   - the text each record says was printed on the page (original_text, quote, as_printed), when it is long and
//     distinctive (24+ characters of plain text, so HTML and JSON escaping cannot hide it);
//   - source ids, conflict ids and file titles that no shared all-county file holds.
// Generic record ids alone ("K001") are never sentinels: they would match unrelated text.
// scan() reads every text file in a directory (HTML, RSC payloads, JSON, CSV, JS, XML, Markdown, SVG) and the text
// layer of every PDF (pdftotext). It fails closed: when anything is held, a PDF it cannot read (or no pdftotext) is a
// failure, not a skip. With nothing held there is nothing to find. A build host without pdftotext (Netlify) accepts a
// PDF only when data/pdf-leak-scan.json records that exact file as scanned clean against the exact current held set.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const counties = require('../lib/county-registry');
const cr = require('../lib/county-review');

const TEXT = /\.(html|txt|json|js|csv|xml|md|svg|webmanifest)$/i;
const PLAIN = /^[A-Za-z0-9 .,:;%()/\-]+$/;
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const norm = (t) => t.replace(/&amp;/g, '&').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');

// Ids every county shares (all-county documents in data/source-manifest.json), never sentinels.
const SHARED = new Set(JSON.parse(fs.readFileSync(path.join(counties.ROOT, 'data', 'source-manifest.json'), 'utf8')).documents.map((d) => d.id));

const printedOf = (o) => [o.original_text, o.quote, o.as_printed, o.source && o.source.as_printed].filter((t) => typeof t === 'string');
const distinctive = (t) => { const x = norm(t).trim(); return x.length >= 24 && PLAIN.test(x) && /\d/.test(x) ? x : null; };

// Sentinels for the given file kinds of a county; `only` limits records to a set of "<dataset>|<id>" keys.
function sentinelsFor(slug, kinds, only = null) {
  const S = new Map();
  const add = (s, why) => { if (s && !S.has(s)) S.set(s, why); };
  const keep = (ds, id) => !only || only.has(`${ds}|${id}`);
  const rec = (ds, id, o) => { if (!keep(ds, id)) return; add(`${ds}:${id}`, `record ${ds}|${id}`); add(`${ds}|${id}`, `record ${ds}|${id}`); printedOf(o).map(distinctive).forEach((t) => add(t, `printed text of ${ds}|${id}`)); };
  kinds.filter((k) => counties.has(slug, k)).forEach((kind) => {
    const d = counties.load(slug, kind);
    if (kind === 'ledger') {
      const ds = cr.datasetName(slug, 'ledger');
      d.observations.forEach((o) => rec(ds, o.id, o));
      if (!only) { Object.keys(d.sources).filter((id) => !SHARED.has(id)).forEach((id) => add(id, `source id ${id}`)); add(d.meta.title, 'ledger title'); d.discrepancies.forEach((x) => add(x.case_id, `ledger case ${x.case_id}`)); }
    } else if (kind === 'audits') {
      const ds = cr.datasetName(slug, 'audits');
      d.opinions.forEach((o) => rec(ds, `opinion:${o.entity}:${o.fy}`, o));
      if (!only) { d.documents.filter((x) => !SHARED.has(x.doc_id)).forEach((x) => add(x.doc_id, `audit document ${x.doc_id}`)); add(d.meta.title, 'audits title'); }
    } else if (kind === 'population') {
      const ds = cr.datasetName(slug, 'population');
      d.points.forEach((p) => rec(ds, p.id, p));
      if (!only) add(d.meta.title, 'population title');
    } else if (kind === 'findings') {
      const ds = cr.datasetName(slug, 'findings');
      d.findings.forEach((f) => rec(ds, f.id, f));
      if (!only) add(d.meta.title, 'findings title');
    } else if (kind === 'conflicts') {
      if (!only) d.conflicts.forEach((x) => add(x.id, `conflict case ${x.id}`));
    } else if (kind === 'indicators' || kind === 'abstract') {
      // Source ids the published Siaya/regional indicators file also cites (shared documents) are not sentinels.
      const ds = cr.datasetName(slug, kind);
      const pub = new Set(JSON.parse(fs.readFileSync(path.join(counties.ROOT, 'data', 'indicators.json'), 'utf8')).sources.map((x) => x.source_id));
      d.observations.forEach((o) => rec(ds, o.id, o));
      // An abstract file shares its source with the county's indicators file, so only its record ids are sentinels.
      if (!only && kind === 'indicators') { d.sources.filter((x) => !SHARED.has(x.source_id) && !pub.has(x.source_id)).forEach((x) => add(x.source_id, `indicator source ${x.source_id}`)); add(d.meta.title, 'indicators title'); d.conflicts.forEach((x) => add(x.id, `indicator conflict ${x.id}`)); }
    }
  });
  // Short ids make poor sentinels; drop anything under 8 characters.
  [...S.keys()].filter((s) => s.length < 8).forEach((s) => S.delete(s));
  return S;
}

let PDFTOTEXT = null;
const hasPdftotext = () => { if (PDFTOTEXT === null) { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); PDFTOTEXT = true; } catch (e) { PDFTOTEXT = false; } } return PDFTOTEXT; };
function pdfText(f) {
  if (!hasPdftotext()) throw new Error('pdftotext is not installed: PDFs cannot be checked (fail closed)');
  return execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
}

const crypto = require('crypto');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// One hash for a sentinel set: a PDF scanned clean against it stays clean while neither changes.
const sentinelsHash = (S) => sha([...S.keys()].sort().join('\n'));

// { hits: [{ file, sentinel, why }], files, pdfs, recorded, errors, pdfHashes }
// recorded: { "<path in dir>": sha256 } of PDFs scanned clean against this sentinel set on a host with pdftotext
// (data/pdf-leak-scan.json). Without pdftotext a PDF passes only if its hash is recorded; any other PDF is an error.
function scan(dir, sentinels, recorded = null) {
  const out = { hits: [], files: 0, pdfs: 0, recorded: 0, errors: [], pdfHashes: {} };
  if (!sentinels.size) return out;
  const list = [...sentinels.entries()];
  walk(dir).forEach((f) => {
    let t = null;
    if (TEXT.test(f)) { t = fs.readFileSync(f, 'utf8'); out.files += 1; } else if (/\.pdf$/i.test(f)) {
      const rel = path.relative(dir, f).split(path.sep).join('/');
      const h = sha(fs.readFileSync(f));
      out.pdfHashes[rel] = h;
      if (!hasPdftotext() && recorded && recorded[rel] === h) { out.recorded += 1; return; }
      try { t = pdfText(f); out.pdfs += 1; } catch (e) { out.errors.push(`${rel}: ${e.message}${hasPdftotext() ? '' : ' and its hash is not in data/pdf-leak-scan.json for the current held set (run the local gates: node scripts/test-unpublished-counties.js dist --record-pdfs)'}`); return; }
    } else return;
    const n = norm(t);
    list.forEach(([s, why]) => { if (n.includes(s)) out.hits.push({ file: path.relative(dir, f), sentinel: s, why }); });
  });
  return out;
}

// A minimal one-page PDF whose text layer holds `text` (for the deliberate-leak fixture).
function makePdf(text) {
  const esc = String(text).replace(/[\\()]/g, (c) => `\\${c}`);
  const stream = `BT /F1 10 Tf 20 100 Td (${esc}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(body.length); body += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

module.exports = { sentinelsFor, scan, makePdf, walk, norm, distinctive, hasPdftotext, sentinelsHash };
