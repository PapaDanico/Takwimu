// Renders the built brief page (dist/counties/siaya/brief/index.html) to public/reports/siaya-fiscal-brief.pdf
// with Chromium's print engine, then checks (scripts/lib/brief-check.js) that the PDF has two or three A4 pages, each
// holding one whole section page of the brief, with extractable text, and that nothing in print layout is wider than
// the printed column or clipped. scripts/test-reports.js runs the same checks as a gate.
// Playwright is NOT a project dependency: run with the global install, after `npm run build`:
//   NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js
// Then run `npm run build` again so dist/ carries the new PDF (and the fallback copy at /briefs/; scripts/build-data.js). Needs pdfinfo and pdftotext (poppler-utils).
const fs = require('fs');
const path = require('path');
const { withPrintPage } = require('./lib/print-pdf');
const { BRIEFS, layoutProblems, pdfProblems } = require('./lib/brief-check');
// --county <slug> picks the brief (default siaya): node scripts/make-brief-pdf.js --county kisumu
const ci = process.argv.indexOf('--county');
const B = BRIEFS[ci > 0 ? process.argv[ci + 1] : 'siaya'];
if (!B) { console.error(`No brief for ${process.argv[ci + 1]}; known: ${Object.keys(BRIEFS).join(', ')}`); process.exit(1); }
const ROUTE = B.route;

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, B.pdf);
if (!fs.existsSync(path.join(dist, ROUTE, 'index.html'))) { console.error(`Build first: dist${ROUTE}index.html is missing.`); process.exit(1); }

withPrintPage(dist, undefined, async ({ page, port }) => {
  const url = `http://localhost:${port}${ROUTE}`;
  const layout = await layoutProblems(page, url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true });
  const { pages, size, problems, chars } = pdfProblems(out, dist, B);
  console.log(`Wrote ${path.relative(root, out)}: ${pages} page(s), ${size}, ${chars} characters of text.`);
  [...layout, ...problems].forEach((p) => console.error(`FAIL: ${p}`));
  return layout.length || problems.length ? 1 : 0;
});
