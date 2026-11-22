// Renders the built brief page (dist/counties/siaya/brief/index.html) to public/reports/siaya-fiscal-brief.pdf
// with Chromium's print engine, then checks that the PDF is one A4 page with extractable text.
// Playwright is NOT a project dependency: run with the global install, after `npm run build`:
//   NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js
// Then run `npm run build` again so dist/ carries the new PDF (and the fallback copy at /briefs/; scripts/build-data.js). Needs pdfinfo and pdftotext (poppler-utils).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'public', 'reports', 'siaya-fiscal-brief.pdf');
const route = '/counties/siaya/brief/';
if (!fs.existsSync(path.join(dist, route, 'index.html'))) { console.error('Build first: dist/counties/siaya/brief/index.html is missing.'); process.exit(1); }

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

srv.listen(0, async () => {
  let code = 0;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await page.goto(`http://localhost:${srv.address().port}${route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true });

    const info = execFileSync('pdfinfo', [out]).toString();
    const pages = Number((info.match(/^Pages:\s+(\d+)/m) || [])[1]);
    const size = (info.match(/^Page size:\s+(.+)$/m) || [])[1] || '';
    const text = execFileSync('pdftotext', ['-layout', out, '-']).toString();
    // While the brief's figures are unreviewed the page carries the DRAFT and provisional notice; so must the PDF.
    const draft = /data-draft="true"/.test(fs.readFileSync(path.join(dist, route, 'index.html'), 'utf8'));
    const must = ['Siaya County fiscal brief', 'Headline figures', 'Ten years of spending', 'Audit opinions', 'Key caveats', 'Sources.', '2024/25', ...(draft ? ['DRAFT', 'Provisional: awaiting editorial review'] : [])];
    const missing = must.filter((s) => !text.toLowerCase().includes(s.toLowerCase()));
    console.log(`Wrote ${path.relative(root, out)}: ${pages} page(s), ${size}, ${text.length} characters of text.`);
    if (pages !== 1) { console.error('FAIL: the brief must fit on one page.'); code = 1; }
    if (!/\(A4\)/.test(size)) { console.error('FAIL: page is not A4 (595 x 842 pt).'); code = 1; }
    if (missing.length) { console.error(`FAIL: text not extractable for: ${missing.join(', ')}`); code = 1; }
  } finally {
    await browser.close();
    srv.close();
  }
  process.exit(code);
});
