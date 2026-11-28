// Renders the print editions of the five reports (dist/reports/<slug>/print/index.html; the web pages link instead of repeating) to public/reports/<slug>.pdf with
// Chromium's print engine: A4, white background, page numbers, snapshot ID and (while any figure is unreviewed)
// a DRAFT header on every page (the provisional label itself is printed once, on the cover). Fonts are the site's self-hosted web fonts, embedded by Chromium.
// Playwright is NOT a project dependency: run with the global install, after `npm run build`:
//   NODE_PATH=$(npm root -g) node scripts/make-reports-pdf.js [distDir]
// Then run `npm run build` again so dist/ carries the new PDFs. Needs pdfinfo and pdffonts (poppler-utils).
const fs = require('fs');
const path = require('path');
const { withPrintPage, pdfInfo } = require('./lib/print-pdf');
const registry = require('../components/report/reports.json');

const { SITE_URL } = require('../lib/site-url');

const root = path.join(__dirname, '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const outDir = path.join(root, 'public', 'reports');
const missing = registry.reports.filter((r) => !fs.existsSync(path.join(dist, 'reports', r.slug, 'print', 'index.html')));
if (missing.length) { console.error(`Build first: missing ${missing.map((r) => `dist/reports/${r.slug}/print/`).join(', ')}`); process.exit(1); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const band = 'font-family: Helvetica, Arial, sans-serif; font-size: 7pt; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; gap: 12px;';

async function render(page, port, r) {
  await page.goto(`http://localhost:${port}/reports/${r.slug}/print/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300); // charts measure their container once mounted
  const info = await page.evaluate(() => {
    const m = document.querySelector('main.rp');
    return { snapshot: m.dataset.snapshot, draft: m.dataset.draft === 'true' };
  });
  // Site links (topic pages, /reports/method/) point at the published site in the PDF, not at this local server.
  await page.evaluate((site) => {
    document.querySelectorAll('main.rp a[href^="/"]').forEach((a) => a.setAttribute('href', site + a.getAttribute('href')));
  }, SITE_URL);
  const out = path.join(outDir, `${r.slug}.pdf`);
  await page.pdf({
    path: out, format: 'A4', printBackground: true, tagged: true, outline: true,
    margin: { top: '17mm', bottom: '16mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="${band} color: ${info.draft ? '#B91C1C' : '#31445F'};"><span>${info.draft ? 'DRAFT · not yet reviewed (see the notice on page 1)' : 'Reviewed edition'}</span><span>Takwimu Kenya · Report ${r.letter}: ${esc(r.title)}</span></div>`,
    footerTemplate: `<div style="${band} color: #31445F;"><span>Snapshot ${info.snapshot} · ${esc(registry.edition)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  const { pages, size } = pdfInfo(out);
  return { out, pages, size, ...info };
}

// A4 width less the 14 mm side margins, so charts size themselves to the printed column.
withPrintPage(dist, { viewport: { width: 688, height: 1000 } }, async ({ page, port }) => {
  let code = 0;
  fs.mkdirSync(outDir, { recursive: true });
  for (const r of registry.reports) {
    const res = await render(page, port, r);
    console.log(`Wrote ${path.relative(root, res.out)}: ${res.pages} pages, ${res.size}, snapshot ${res.snapshot}${res.draft ? ', DRAFT' : ''}.`);
    if (!/\(A4\)/.test(res.size)) { console.error(`FAIL: ${r.slug} is not A4.`); code = 1; }
  }
  return code;
});
