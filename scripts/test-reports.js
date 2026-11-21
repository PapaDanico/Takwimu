// Checks the five report pages and their PDFs (handover section 9, PDF quality gates; section 14).
// Run after `npm run build` and the PDF script:
//   NODE_PATH=$(npm root -g) node scripts/test-reports.js [distDir]
// For each report: the PDF exists, is A4, has a page count in the expected range, embeds every font, and its text
// contains the snapshot ID (recomputed here from the data files, so a stale PDF fails), the source appendix and,
// while any figure is unreviewed, the DRAFT mark; neither the PDF nor the page shows "NaN" or "undefined"; no
// withheld contractor name appears; in print layout no table, cell or chart is wider than the printed column; every
// figure on the HTML page resolves to a record in its data file with the same value; every citation link resolves.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const registry = require('../components/report/reports.json');

const root = path.join(__dirname, '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const fails = [];
const fail = (slug, msg) => fails.push(`${slug}: ${msg}`);

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const snapshotOf = (inputs) => sha([...inputs].sort().map((f) => `data/${f}:${sha(fs.readFileSync(path.join(root, 'data', f)))}`).join('\n')).slice(0, 12);
const dataCache = {};
// Figures resolve against the data as published: through lib/review-status.js masked(), so a value rejected in
// editorial review must appear withheld (null) on the page, never with its old value.
const rs = require('../lib/review-status');
const data = (f) => (dataCache[f] = dataCache[f] || (rs.DATASET_IDS.includes(f.replace(/\.json$/, '')) ? rs.masked(f.replace(/\.json$/, '')) : JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'))));
const resolve = (file, ptr) => {
  let v = data(file);
  for (const raw of ptr.split('/').slice(1)) {
    const k = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (v == null || !(k in Object(v))) return { ok: false };
    v = v[k];
  }
  return { ok: true, v };
};
const asData = (v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
// Contractor names recorded but withheld (owner decision): they must not appear in any report.
// A public body that a funder names as a programme's implementing agency (data/siaya-programmes.json) is not
// named as a contractor there, so such names are allowed in the programme atlas only.
const implementers = data('siaya-programmes.json').programmes.map((p) => p.implementing_organisation || '').join('\n');
const banned = data('siaya-projects.json').projects.map((p) => p.contract && p.contract.contractor).filter(Boolean)
  .map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
const bannedFor = (slug) => banned.filter((b) => !(slug === 'siaya-programme-atlas' && implementers.includes(b)));
// "undefined" as English in a source's own note is allowed; any other occurrence is a rendering bug. The allowed
// uses are the word with its preceding word, as they occur in the data files.
const allowedUndefined = new Set();
fs.readdirSync(path.join(root, 'data')).filter((f) => f.endsWith('.json')).forEach((f) => {
  (fs.readFileSync(path.join(root, 'data', f), 'utf8').match(/[A-Za-z,]+ undefined\b/g) || []).forEach((m) => allowedUndefined.add(m));
});
const strayUndefined = (text) => (text.replace(/\s+/g, ' ').match(/[A-Za-z,]+ undefined\b|^undefined\b|[^A-Za-z, ]undefined\b/g) || []).filter((m) => !allowedUndefined.has(m));

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dist, path.normalize(p));
  if (!f.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
});

function checkPdf(r, expectSnap, draft) {
  const pdf = path.join(root, 'public', 'reports', `${r.slug}.pdf`);
  if (!fs.existsSync(pdf)) { fail(r.slug, `missing ${path.relative(root, pdf)} (run scripts/make-reports-pdf.js)`); return null; }
  const info = execFileSync('pdfinfo', [pdf]).toString();
  const pages = Number((info.match(/^Pages:\s+(\d+)/m) || [])[1]);
  if (!/\(A4\)/.test(info)) fail(r.slug, 'PDF is not A4');
  const [lo, hi] = r.pages;
  if (!(pages >= lo && pages <= hi)) fail(r.slug, `PDF has ${pages} pages; expected ${lo} to ${hi}`);
  const fonts = execFileSync('pdffonts', [pdf]).toString().split('\n').slice(2).filter(Boolean);
  const notEmbedded = fonts.filter((l) => !/\syes\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l));
  if (!fonts.length) fail(r.slug, 'PDF lists no fonts (text not extractable)');
  if (notEmbedded.length) fail(r.slug, `fonts not embedded: ${notEmbedded.join('; ')}`);
  const text = execFileSync('pdftotext', ['-layout', pdf, '-']).toString();
  if (!text.includes(expectSnap)) fail(r.slug, `PDF text lacks the current snapshot ID ${expectSnap} (stale PDF?)`);
  if (!/Bibliography and document versions/.test(text) || !/SHA-256/.test(text)) fail(r.slug, 'PDF lacks the source appendix (bibliography with SHA-256)');
  if (!/Snapshot, method and licence/.test(text)) fail(r.slug, 'PDF lacks the licence appendix');
  if (draft && !/\bDRAFT\b/.test(text)) fail(r.slug, 'PDF lacks the DRAFT watermark text');
  if (draft && !text.includes('Provisional: awaiting editorial review')) fail(r.slug, 'PDF lacks the provisional label');
  if (!new RegExp(`Page 1 of ${pages}\\b`).test(text)) fail(r.slug, 'PDF lacks page numbers');
  if (/\bNaN\b/.test(text)) fail(r.slug, 'PDF text contains "NaN"');
  const rawText = execFileSync('pdftotext', [pdf, '-']).toString();
  const stray = strayUndefined(rawText);
  if (stray.length) fail(r.slug, `PDF text contains "undefined" (${stray.slice(0, 3).join(' | ')})`);
  bannedFor(r.slug).forEach((b) => { if (text.includes(b)) fail(r.slug, 'PDF names a withheld contractor'); });
  return pages;
}

srv.listen(0, async () => {
  const browser = await chromium.launch();
  const summary = [];
  try {
    const page = await browser.newPage({ viewport: { width: 688, height: 1000 } });
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    for (const r of registry.reports) {
      const file = path.join(dist, 'reports', r.slug, 'index.html');
      if (!fs.existsSync(file)) { fail(r.slug, `missing built page ${path.relative(root, file)}`); continue; }
      await page.goto(`http://localhost:${srv.address().port}/reports/${r.slug}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const dom = await page.evaluate(() => {
        const main = document.querySelector('main.rp');
        if (!main) return null;
        const right = main.getBoundingClientRect().right;
        const wide = [];
        main.querySelectorAll('table, svg, .rp-chart').forEach((el, i) => {
          const b = el.getBoundingClientRect();
          if (b.right > right + 0.5 || (el.scrollWidth && el.scrollWidth > el.clientWidth + 1)) wide.push(`${el.tagName.toLowerCase()} #${i} (${(el.querySelector && el.querySelector('caption') ? el.querySelector('caption').textContent : '').slice(0, 60)})`);
        });
        main.querySelectorAll('td, th').forEach((el) => {
          if (el.scrollWidth > el.clientWidth + 1) wide.push(`cell "${el.textContent.slice(0, 40)}" overflows`);
        });
        const ids = new Set([...main.querySelectorAll('[id]')].map((e) => e.id));
        const deadLinks = [...main.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((h) => !ids.has(h));
        const figs = [...main.querySelectorAll('.fig')].map((e) => ({ file: e.dataset.file, ptr: e.dataset.ptr, value: e.dataset.value, suppressed: e.dataset.suppressed === 'true', text: e.textContent }));
        const bareValues = [...main.querySelectorAll('td.v')].filter((td) => !td.querySelector('.fig')).length;
        return { snapshot: main.dataset.snapshot, draft: main.dataset.draft === 'true', wide, deadLinks, figs, bareValues, text: main.innerText, watermark: !!main.querySelector('.rp-watermark') };
      });
      if (!dom) { fail(r.slug, 'no <main class="rp"> on the page'); continue; }
      const expectSnap = snapshotOf(r.inputs);
      if (dom.snapshot !== expectSnap) fail(r.slug, `page snapshot ${dom.snapshot} differs from the data files (${expectSnap}); rebuild`);
      dom.wide.slice(0, 10).forEach((w) => fail(r.slug, `wider than the print width: ${w}`));
      if (dom.wide.length > 10) fail(r.slug, `${dom.wide.length - 10} more elements wider than the print width`);
      dom.deadLinks.slice(0, 5).forEach((h) => fail(r.slug, `citation link #${h} has no target`));
      if (dom.bareValues) fail(r.slug, `${dom.bareValues} value cells hold no traceable figure`);
      if (!dom.figs.length) fail(r.slug, 'no figures found');
      let bad = 0;
      dom.figs.forEach((f) => {
        const res = f.file && f.ptr ? resolve(f.file, f.ptr) : { ok: false };
        if (!res.ok) { bad += 1; if (bad <= 5) fail(r.slug, `figure ${f.file}#${f.ptr} does not resolve to a data record`); return; }
        if (!f.suppressed && asData(res.v) !== f.value) { bad += 1; if (bad <= 5) fail(r.slug, `figure ${f.file}#${f.ptr} shows ${f.value}, data has ${asData(res.v)}`); }
      });
      if (dom.draft && !dom.watermark) fail(r.slug, 'draft report without the DRAFT watermark');
      if (/\bNaN\b/.test(dom.text)) fail(r.slug, 'page text contains "NaN"');
      const stray = strayUndefined(dom.text);
      if (stray.length) fail(r.slug, `page text contains "undefined" (${stray.slice(0, 3).join(' | ')})`);
      bannedFor(r.slug).forEach((b) => { if (dom.text.includes(b)) fail(r.slug, 'page names a withheld contractor'); });
      const pages = checkPdf(r, expectSnap, dom.draft);
      summary.push(`${r.letter} ${r.slug}: ${pages} pages, ${dom.figs.length} figures resolved, snapshot ${expectSnap}${dom.draft ? ', DRAFT' : ''}`);
    }
  } finally {
    await browser.close();
    srv.close();
  }
  if (fails.length) {
    console.error(`Report checks failed (${fails.length}):\n- ${fails.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Report checks passed:\n  ${summary.join('\n  ')}`);
});
