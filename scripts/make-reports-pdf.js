// Renders the five built report pages (dist/reports/<slug>/index.html) to public/reports/<slug>.pdf with
// Chromium's print engine: A4, white background, page numbers, snapshot ID and (while any figure is unreviewed)
// a DRAFT header on every page. Fonts are the site's self-hosted web fonts, embedded by Chromium.
// Playwright is NOT a project dependency: run with the global install, after `npm run build`:
//   NODE_PATH=$(npm root -g) node scripts/make-reports-pdf.js [distDir]
// Then run `npm run build` again so dist/ carries the new PDFs. Needs pdfinfo and pdffonts (poppler-utils).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const registry = require('../components/report/reports.json');

const root = path.join(__dirname, '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const outDir = path.join(root, 'public', 'reports');
const missing = registry.reports.filter((r) => !fs.existsSync(path.join(dist, 'reports', r.slug, 'index.html')));
if (missing.length) { console.error(`Build first: missing ${missing.map((r) => `dist/reports/${r.slug}/`).join(', ')}`); process.exit(1); }

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
const serve = (dir) => http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, path.normalize(p));
  if (!f.startsWith(dir)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
});

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const band = 'font-family: Helvetica, Arial, sans-serif; font-size: 7pt; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; gap: 12px;';

async function render(page, port, r) {
  await page.goto(`http://localhost:${port}/reports/${r.slug}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300); // charts measure their container once mounted
  const info = await page.evaluate(() => {
    const m = document.querySelector('main.rp');
    return { snapshot: m.dataset.snapshot, draft: m.dataset.draft === 'true' };
  });
  const out = path.join(outDir, `${r.slug}.pdf`);
  await page.pdf({
    path: out, format: 'A4', printBackground: true, tagged: true, outline: true,
    margin: { top: '17mm', bottom: '16mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="${band} color: ${info.draft ? '#B91C1C' : '#31445F'};"><span>${info.draft ? 'DRAFT · Provisional: awaiting editorial review' : 'Reviewed edition'}</span><span>Takwimu Kenya · Report ${r.letter}: ${esc(r.title)}</span></div>`,
    footerTemplate: `<div style="${band} color: #31445F;"><span>Snapshot ${info.snapshot} · ${esc(registry.edition)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  const pdfInfo = execFileSync('pdfinfo', [out]).toString();
  const pages = Number((pdfInfo.match(/^Pages:\s+(\d+)/m) || [])[1]);
  const size = (pdfInfo.match(/^Page size:\s+(.+)$/m) || [])[1] || '';
  return { out, pages, size, ...info };
}

const srv = serve(dist);
srv.listen(0, async () => {
  let code = 0;
  const browser = await chromium.launch();
  try {
    // A4 width less the 14 mm side margins, so charts size themselves to the printed column.
    const page = await browser.newPage({ viewport: { width: 688, height: 1000 } });
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    fs.mkdirSync(outDir, { recursive: true });
    for (const r of registry.reports) {
      const res = await render(page, srv.address().port, r);
      console.log(`Wrote ${path.relative(root, res.out)}: ${res.pages} pages, ${res.size}, snapshot ${res.snapshot}${res.draft ? ', DRAFT' : ''}.`);
      if (!/\(A4\)/.test(res.size)) { console.error(`FAIL: ${r.slug} is not A4.`); code = 1; }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  process.exit(code);
});
