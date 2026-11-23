#!/usr/bin/env node
// Independent machine cross-check of Siaya values against their source PDFs (owner item 1b, 23 Nov 2026).
// For each value with a stored copy of its source and a PDF page, the page is read again by a different method from
// the one used to extract the value: a value read from the PDF text layer is checked by tesseract OCR of the page
// rendered at 600 dpi; a value read by OCR is checked against the text layer when the page has one, otherwise by
// tesseract with a different page-segmentation mode (psm 4) from the default used before. The stored value is then
// looked for among the numbers on the page (in the unit stored, or in shillings, thousands, millions or billions).
//
// Result per value: agree (the number is on the page by the second method), disagree (the second method read the page
// but the number is not among what it read), or not checkable (no stored copy, no page, not a number, too few digits
// to match safely). This is a machine reading, never a review: it does not change any value's state, and
// scripts/test-machine-checks.js fails the build if a review record cites it.
//
// Usage: node scripts/machine-check.js --index <file of "sha256  path" lines> [--jobs 4] [--cache <dir>]
// Writes data/machine-checks.json. The PDFs are not in the repository (licences); the index points at local copies.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, execFile } = require('child_process');
const pack = require('../lib/review-pack');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const INDEX = arg('--index');
const JOBS = Number(arg('--jobs', '4'));
const CACHE = arg('--cache', path.join(os.tmpdir(), 'takwimu-machine-check'));
const TODAY = arg('--date', new Date().toISOString().slice(0, 10));
if (!INDEX) { console.error('usage: node scripts/machine-check.js --index <sha256 index>'); process.exit(2); }
fs.mkdirSync(CACHE, { recursive: true });
const FILE = {};
fs.readFileSync(INDEX, 'utf8').split('\n').filter(Boolean).forEach((l) => { const m = l.match(/^([0-9a-f]{64})\s+(.+)$/); if (m && !FILE[m[1]]) FILE[m[1]] = m[2]; });

// ---- Numbers on a page ----
// "386, 787,728" and "1 ,466,051" are joined; "Kshs.545,950,403.16" gives 545950403.16. Each token keeps its decimals.
function tokens(text) {
  // Only a comma with spaces around it is closed up ("386, 787,728"); two numbers side by side stay two numbers.
  const t = String(text).replace(/(\d) ?, ?(?=\d{3}\b)/g, '$1,');
  const out = [];
  (t.match(/\d[\d,]*(?:\.\d+)?/g) || []).forEach((s) => {
    const clean = s.replace(/,/g, '').replace(/\.$/, '');
    const v = Number(clean);
    if (!Number.isFinite(v)) return;
    const dec = (clean.split('.')[1] || '').length;
    out.push({ s, v, dec, sig: clean.replace('.', '').replace(/^0+/, '').length });
  });
  return out;
}
const decOf = (v) => { const s = String(v); return s.includes('e') ? 6 : (s.split('.')[1] || '').length; };
const SCALES = { '%': [1], 'KSh billion': [1, 1e3, 1e6, 1e9], 'KSh million': [1, 1e-3, 1e3, 1e6], KSh: [1, 1e-3, 1e-6, 1e-9] };
function match(value, unit, toks) {
  const scales = SCALES[unit] || [1, 1e3, 1e6, 1e-3, 1e-6];
  for (const s of scales) {
    const target = Math.abs(value) * s; // printed negatives may lose their sign or sit in brackets
    const tdec = Math.max(0, decOf(value) - Math.round(Math.log10(s)));
    for (const k of toks) {
      if (k.sig < 3) continue;
      const tol = Math.max(0.5 * 10 ** -k.dec, 0.5 * 10 ** -tdec) + 1e-9 * Math.abs(target);
      if (Math.abs(k.v - target) <= tol) return k.s;
    }
  }
  return null;
}

// ---- Page readings (cached) ----
const key = (sha, page, m) => path.join(CACHE, `${sha.slice(0, 16)}-p${page}-${m}.txt`);
function textLayer(sha, page) {
  const f = key(sha, page, 'text');
  if (!fs.existsSync(f)) { let t = ''; try { t = execFileSync('pdftotext', ['-layout', '-f', String(page), '-l', String(page), FILE[sha], '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) { t = ''; } fs.writeFileSync(f, t); }
  return fs.readFileSync(f, 'utf8');
}
function ocr(sha, page, psm) {
  const f = key(sha, page, `tess600-psm${psm}`);
  if (fs.existsSync(f)) return Promise.resolve(fs.readFileSync(f, 'utf8'));
  const base = path.join(CACHE, `${sha.slice(0, 16)}-p${page}-r600`);
  const png = `${base}.png`;
  return new Promise((resolve) => {
    const run = () => execFile('tesseract', [png, 'stdout', '--psm', String(psm)], { maxBuffer: 64 << 20, env: { ...process.env, OMP_THREAD_LIMIT: '1' } }, (err, out) => { const t = err ? '' : out; fs.writeFileSync(f, t); resolve(t); });
    if (fs.existsSync(png)) return run();
    execFile('pdftoppm', ['-r', '600', '-gray', '-singlefile', '-png', '-f', String(page), '-l', String(page), FILE[sha], base], { maxBuffer: 64 << 20 }, () => run());
  });
}
const digits = (t) => (String(t).match(/\d/g) || []).length;

// ---- Plan ----
const entries = pack.all();
const plan = entries.map((e) => {
  const s = e.source[0];
  const base = { dataset: e.dataset, id: e.id };
  if (e.dataset === 'siaya-analysis') return { ...base, result: 'not checkable', reason: 'Calculation by Takwimu: its inputs are checked where they are stored.' };
  if (typeof e.value !== 'number') return { ...base, result: 'not checkable', reason: 'Not a single number (text, a list of amounts or a series).' };
  if (!s || !s.sha256) return { ...base, result: 'not checkable', reason: 'No stored copy of the source document (no SHA-256).' };
  if (!FILE[s.sha256]) return { ...base, result: 'not checkable', reason: 'The stored copy was not available to the check.' };
  if (typeof e.pdf_page !== 'number') return { ...base, result: 'not checkable', reason: 'No PDF page recorded.' };
  if (!tokens(String(Math.abs(e.value))).some((k) => k.sig >= 3)) return { ...base, result: 'not checkable', reason: 'Fewer than three significant digits: too short to match safely on a page.' };
  return { ...base, sha: s.sha256, source_id: s.id, page: e.pdf_page, value: e.value, unit: e.unit, read_kind: e.read_kind, original: e.read };
});

async function main() {
  const todo = plan.filter((p) => p.sha);
  // Decide the second method per value.
  todo.forEach((p) => {
    const layer = textLayer(p.sha, p.page);
    const hasLayer = digits(layer) >= 20;
    if (p.read_kind === 'text') p.method = 'tesseract-600dpi-psm6';
    else if (p.read_kind === 'ocr') p.method = hasLayer ? 'pdf-text-layer' : 'tesseract-600dpi-psm4';
    else p.method = hasLayer ? 'tesseract-600dpi-psm6' : 'tesseract-600dpi-psm4';
    p.original_method = p.read_kind === 'text' ? 'PDF text layer' : p.read_kind === 'ocr' ? `OCR (${p.original})` : hasLayer ? 'not recorded (page has a text layer; taken as text layer)' : 'not recorded (page has no text layer; taken as OCR)';
  });
  // Fallback when the first second-method reading does not show the value: tesseract in segmentation mode 4 (or 6 when
  // mode 4 was the first), still a different method from the original extraction.
  const firstText = (p) => (p.method === 'pdf-text-layer' ? textLayer(p.sha, p.page) : null);
  todo.forEach((p) => { p.fallback = p.method === 'tesseract-600dpi-psm4' ? (p.read_kind === 'text' || /taken as text layer/.test(p.original_method) ? 'tesseract-600dpi-psm6' : null) : 'tesseract-600dpi-psm4'; });
  const needs = (p) => { const t = firstText(p); return p.method !== 'pdf-text-layer' || !(digits(t) && match(p.value, p.unit, tokens(t))); };
  const jobs = [...new Set(todo.flatMap((p) => [p.method.startsWith('tesseract') ? `${p.sha}|${p.page}|${p.method.slice(-1)}` : null, p.fallback && needs(p) ? `${p.sha}|${p.page}|${p.fallback.slice(-1)}` : null]).filter(Boolean))];
  let done = 0;
  const queue = jobs.slice();
  async function worker() { while (queue.length) { const [sha, page, psm] = queue.shift().split('|'); await ocr(sha, Number(page), Number(psm)); done += 1; if (done % 10 === 0) console.error(`ocr ${done}/${jobs.length}`); } }
  await Promise.all(Array.from({ length: JOBS }, worker));
  const results = await Promise.all(plan.map(async (p) => {
    if (!p.sha) return { dataset: p.dataset, id: p.id, result: p.result, method: null, reason: p.reason };
    const read1 = async (m) => (m === 'pdf-text-layer' ? textLayer(p.sha, p.page) : ocr(p.sha, p.page, Number(m.slice(-1))));
    let text = await read1(p.method);
    let m = digits(text) ? match(p.value, p.unit, tokens(text)) : null;
    let method = p.method;
    if (!m && p.fallback) {
      const t2 = await read1(p.fallback);
      const m2 = digits(t2) ? match(p.value, p.unit, tokens(t2)) : null;
      if (m2) { m = m2; method = p.fallback; } else { method = `${p.method}+${p.fallback.replace('tesseract-600dpi-', '')}`; text = `${text}\n${t2}`; }
    }
    const out = { dataset: p.dataset, id: p.id, source_id: p.source_id, source_sha256: p.sha, pdf_page: p.page, original_method: p.original_method, method, checked_on: TODAY };
    if (!digits(text)) return { ...out, result: 'not checkable', reason: 'The second method read no digits on the page.' };
    return m ? { ...out, result: 'agree', matched: m } : { ...out, result: 'disagree', reason: `The second method read the page but did not find ${p.value} (${p.unit || 'unit not stated'}) in any scale.` };
  }));
  const counts = results.reduce((c, r) => { c[r.result] = (c[r.result] || 0) + 1; return c; }, {});
  const out = {
    meta: {
      title: 'Machine cross-checks of Siaya values (independent second reading)',
      rule: 'A machine reading by a different method from the original extraction. It is not editorial review: it never approves a value, it is shown on pages only as "machine cross-checked", and no record in data/reviews.json may cite it. Values where the check disagrees go to the top of docs/editorial/REVIEW_QUEUE.md.',
      methods: {
        'tesseract-600dpi-psm6': 'Page rendered at 600 dpi greyscale (pdftoppm) and read by tesseract 5, page segmentation mode 6, for values first read from the PDF text layer.',
        'tesseract-600dpi-psm4': 'Page rendered at 600 dpi greyscale and read by tesseract 5 in segmentation mode 4 (a different mode from the first OCR), for OCR values on pages with no text layer.',
        'pdf-text-layer': 'The PDF text layer of the page (pdftotext), for values first read by OCR.',
        fallback: 'When the first second-method reading does not show the value, the page is read again by tesseract in the other segmentation mode (4 or 6) at 600 dpi; a method written "a+psmN" means neither reading found it.',
      },
      match_rule: 'agree: the stored value appears among the numbers read on the page, in the stored unit or scaled to shillings, thousands, millions or billions, to the precision printed; numbers with fewer than three significant digits are not used.',
      checked_on: TODAY,
      counts,
    },
    checks: results,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'machine-checks.json'), `${JSON.stringify(out, null, 1)}\n`);
  console.log('machine-check:', JSON.stringify(counts));
}
main();
