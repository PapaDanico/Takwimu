// Renders the built brief page (dist/counties/siaya/brief/index.html) to public/reports/siaya-fiscal-brief.pdf
// with Chromium's print engine, then checks that the PDF is one A4 page with extractable text.
// Playwright is NOT a project dependency: run with the global install, after `npm run build`:
//   NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js
// Then run `npm run build` again so dist/ carries the new PDF (and the fallback copy at /briefs/; scripts/build-data.js). Needs pdfinfo and pdftotext (poppler-utils).
const fs = require('fs');
const path = require('path');
const { withPrintPage, pdfInfo, pdfText } = require('./lib/print-pdf');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'public', 'reports', 'siaya-fiscal-brief.pdf');
const route = '/counties/siaya/brief/';
if (!fs.existsSync(path.join(dist, route, 'index.html'))) { console.error('Build first: dist/counties/siaya/brief/index.html is missing.'); process.exit(1); }

withPrintPage(dist, undefined, async ({ page, port }) => {
  let code = 0;
  await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true });

  const { pages, size } = pdfInfo(out);
  const text = pdfText(out);
  // While the brief's figures are unreviewed the page carries the DRAFT and provisional notice; so must the PDF.
  const draft = /data-draft="true"/.test(fs.readFileSync(path.join(dist, route, 'index.html'), 'utf8'));
  const must = ['Siaya County fiscal brief', 'Headline figures', 'Ten years of spending', 'Audit opinions', 'Key caveats', 'Sources.', '2024/25', ...(draft ? ['DRAFT', 'Provisional: awaiting editorial review'] : [])];
  const missing = must.filter((s) => !text.toLowerCase().includes(s.toLowerCase()));
  console.log(`Wrote ${path.relative(root, out)}: ${pages} page(s), ${size}, ${text.length} characters of text.`);
  if (pages !== 1) { console.error('FAIL: the brief must fit on one page.'); code = 1; }
  if (!/\(A4\)/.test(size)) { console.error('FAIL: page is not A4 (595 x 842 pt).'); code = 1; }
  if (missing.length) { console.error(`FAIL: text not extractable for: ${missing.join(', ')}`); code = 1; }
  return code;
});
