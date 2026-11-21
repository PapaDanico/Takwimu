#!/usr/bin/env node
/*
 * Checks the research deliverables in docs/research/.
 *
 *   node scripts/test-research-deliverables.js
 *
 * 1. Re-runs the export twice into temporary folders; both runs and the
 *    committed files must be byte-identical (deterministic, up to date).
 * 2. CSVs parse as RFC 4180 (CRLF, consistent column count, no BOM, UTF-8).
 * 3. Row counts equal the source record counts.
 * 4. PROJECT_REGISTER has no contractor column and no withheld contractor name.
 * 5. No personal-data patterns (honorifics before a name, phone numbers, e-mail).
 * 6. No cell starts with a spreadsheet formula character (= + - @).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'research');
const SCRIPT = path.join(__dirname, 'export-research-deliverables.js');
const FILES = ['SOURCE_REGISTER.csv', 'COVERAGE_MATRIX.csv', 'INDICATOR_DICTIONARY.md', 'RECONCILIATION_LEDGER.csv', 'NGO_PROGRAMME_REGISTER.csv', 'PROJECT_REGISTER.csv'];

let failures = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes++;
  else {
    failures++;
    console.log('FAIL ' + name + (detail ? ': ' + detail : ''));
  }
}
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

// RFC 4180 parser (strict: CRLF record separator, quoted fields may hold CR/LF).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let i = 0;
  let field = '';
  let quoted = false;
  let started = false;
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"' && !started) { quoted = true; started = true; i++; continue; }
    if (ch === '"') throw new Error('bare quote at offset ' + i);
    if (ch === ',') { row.push(field); field = ''; started = false; i++; continue; }
    if (ch === '\r') {
      if (text[i + 1] !== '\n') throw new Error('CR without LF at offset ' + i);
      row.push(field); rows.push(row); row = []; field = ''; started = false; i += 2; continue;
    }
    if (ch === '\n') throw new Error('bare LF at offset ' + i);
    field += ch; started = true; i++;
  }
  if (field !== '' || row.length) throw new Error('last record not terminated by CRLF');
  return rows;
}

// 1. determinism and freshness
const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), 'takwimu-research-a-'));
const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), 'takwimu-research-b-'));
const stdout = execFileSync(process.execPath, [SCRIPT, tmpA], { encoding: 'utf8' });
execFileSync(process.execPath, [SCRIPT, tmpB], { encoding: 'utf8' });
const counts = JSON.parse(stdout.slice(stdout.indexOf('{')));
for (const f of FILES) {
  const a = fs.readFileSync(path.join(tmpA, f));
  const b = fs.readFileSync(path.join(tmpB, f));
  check(f + ' deterministic across runs', a.equals(b));
  const committed = path.join(OUT, f);
  check(f + ' committed copy matches a fresh export', fs.existsSync(committed) && a.equals(fs.readFileSync(committed)), 'run node scripts/export-research-deliverables.js');
}

// 2. CSV structure
const parsed = {};
const texts = {};
for (const f of FILES) {
  const buf = fs.readFileSync(path.join(tmpA, f));
  texts[f] = buf.toString('utf8');
  check(f + ' no BOM', !(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf));
  check(f + ' valid UTF-8', Buffer.from(texts[f], 'utf8').equals(buf));
  if (!f.endsWith('.csv')) continue;
  let rows;
  try {
    rows = parseCsv(texts[f]);
  } catch (e) {
    check(f + ' parses as RFC 4180', false, e.message);
    continue;
  }
  const width = rows[0].length;
  const bad = rows.findIndex((r) => r.length !== width);
  check(f + ' every record has ' + width + ' fields', bad === -1, 'record ' + bad);
  parsed[f] = { header: rows[0], rows: rows.slice(1) };
  const formula = [];
  for (const r of rows) for (const c of r) if (/^[=+\-@\t\r]/.test(c)) formula.push(c.slice(0, 40));
  check(f + ' no formula-leading cells', formula.length === 0, formula.slice(0, 3).join(' | '));
}

// 3. row counts
const lib = load('source-library.json');
const ledger = load('siaya-fiscal-ledger.json');
const conflicts = load('conflicts.json');
const programmes = load('siaya-programmes.json');
const projects = load('siaya-projects.json');
const n = (f) => (parsed[f] ? parsed[f].rows.length : -1);
const eq = (name, got, want) => check(name + ' (' + got + ' = ' + want + ')', got === want);
eq('SOURCE_REGISTER rows = source-library documents', n('SOURCE_REGISTER.csv'), lib.documents.length);
eq('RECONCILIATION_LEDGER rows = ledger discrepancies + conflicts', n('RECONCILIATION_LEDGER.csv'), ledger.discrepancies.length + conflicts.conflicts.length);
eq('NGO_PROGRAMME_REGISTER rows = programmes', n('NGO_PROGRAMME_REGISTER.csv'), programmes.programmes.length);
eq('PROJECT_REGISTER rows = projects', n('PROJECT_REGISTER.csv'), projects.projects.length);

function col(f, name) {
  const p = parsed[f];
  const i = p ? p.header.indexOf(name) : -1;
  return i < 0 ? [] : p.rows.map((r) => r[i]);
}
const uniq = (a) => new Set(a).size === a.length;
check('SOURCE_REGISTER ids unique', uniq(col('SOURCE_REGISTER.csv', 'document_id')));
check('RECONCILIATION_LEDGER case ids unique', uniq(col('RECONCILIATION_LEDGER.csv', 'register').map((r, i) => r + col('RECONCILIATION_LEDGER.csv', 'case_id')[i])));
check('RECONCILIATION_LEDGER holds the OSR FY 2023/24 case', col('RECONCILIATION_LEDGER.csv', 'case_id').includes('osr-2023-24'));
check('NGO_PROGRAMME_REGISTER has pooled and evidence_type', parsed['NGO_PROGRAMME_REGISTER.csv'] && ['pooled', 'evidence_type'].every((c) => parsed['NGO_PROGRAMME_REGISTER.csv'].header.includes(c)));
const pooledWant = programmes.programmes.map((p) => String((p.amounts || []).concat(p.beneficiaries || []).some((x) => x.pooled === true)));
check('NGO_PROGRAMME_REGISTER pooled flag matches source', JSON.stringify(col('NGO_PROGRAMME_REGISTER.csv', 'pooled')) === JSON.stringify(pooledWant.map((v, i) => [programmes.programmes[i].id, v]).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((x) => x[1])));
check('PROJECT_REGISTER has status and verification_type', parsed['PROJECT_REGISTER.csv'] && ['status', 'verification_type'].every((c) => parsed['PROJECT_REGISTER.csv'].header.includes(c)));

const cov = parsed['COVERAGE_MATRIX.csv'];
if (cov) {
  const sum = (name) => col('COVERAGE_MATRIX.csv', name).reduce((s, v) => s + Number(v), 0);
  eq('COVERAGE_MATRIX observations total = normalised observations', sum('observations'), counts.observations);
  eq('COVERAGE_MATRIX gaps total = normalised gaps', sum('gaps'), counts.gaps);
  for (const c of ['sector', 'year', 'geography', 'source_type', 'observations', 'gaps']) check('COVERAGE_MATRIX has column ' + c, cov.header.includes(c));
}
const dict = texts['INDICATOR_DICTIONARY.md'] || '';
const missing = [];
for (const m of new Set(ledger.observations.map((o) => o.measure))) if (!dict.includes('| `' + m + '` |')) missing.push(m);
for (const name of ['agriculture', 'economy', 'education']) for (const o of load('siaya-' + name + '.json').observations) if (!dict.includes('| `' + o.indicator + '` |')) missing.push(o.indicator);
for (const o of load('siaya-health.json').observations) if (!dict.includes('| `' + o.measure + '` |')) missing.push(o.measure);
for (const y of load('counties-cob.json').years) for (const c of y.counties) for (const [k, v] of Object.entries(c)) if (v && typeof v === 'object' && v.value != null && !dict.includes('| `' + k + '` |')) missing.push(k);
check('INDICATOR_DICTIONARY covers every measure key', missing.length === 0, [...new Set(missing)].slice(0, 5).join(', '));

// 4. contractor exclusion
const pr = parsed['PROJECT_REGISTER.csv'];
check('PROJECT_REGISTER has no contractor column', pr && !pr.header.some((h) => /contractor/i.test(h)), pr && pr.header.join(','));
const withheld = [];
for (const p of projects.projects) {
  const c = p.contract && p.contract.contractor;
  if (c) withheld.push(typeof c === 'string' ? c : c.name);
  if (p.contract && p.contract.contractor_note) withheld.push(p.contract.contractor_note);
}
const leaked = withheld.filter((w) => w && texts['PROJECT_REGISTER.csv'].includes(w));
check('PROJECT_REGISTER holds no withheld contractor name or note', leaked.length === 0, leaked.join(' | '));

// 5. personal-data patterns
const patterns = [
  ['honorific before a name', /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr|Hon|Prof|Rev|Sen|Eng)\.?\s+[A-Z][a-z]+/],
  ['e-mail address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/],
  ['phone number', /(?:\+|\b00)254[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b|\b0[17]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/],
];
for (const f of FILES) {
  for (const [label, re] of patterns) {
    const m = texts[f].match(re);
    check(f + ' has no ' + label, !m, m && m[0]);
  }
}

fs.rmSync(tmpA, { recursive: true, force: true });
fs.rmSync(tmpB, { recursive: true, force: true });
console.log((failures ? 'FAILED' : 'PASSED') + ': ' + passes + ' checks passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
