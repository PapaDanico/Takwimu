// Checks of the Siaya fiscal brief PDF (public/reports/siaya-fiscal-brief.pdf), shared by scripts/make-brief-pdf.js
// (right after printing) and scripts/test-reports.js (gate): two or three A4 pages, each printed page holding one
// whole .brief-page of the web brief (its heading on that page, nothing spilling onto an extra page), text extractable,
// the DRAFT and provisional notice while figures are unreviewed, and in print layout no element wider than the
// printed column or clipped inside its box.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pdfInfo, pdfText } = require('./print-pdf');

// One entry per county brief: its route, PDF, the heading each printed page must carry in order (page 1 headlines,
// page 2 trends, page 3 audit and sources) and text that must be extractable from the PDF.
const BRIEFS = {
  siaya: { route: '/counties/siaya/brief/', pdf: 'public/reports/siaya-fiscal-brief.pdf', heads: ['Headline figures', 'Trends, FY', 'Audit opinions'],
    must: ['Siaya County fiscal brief', 'What the figures mean', 'Spending and absorption', 'Own-source revenue as each publisher prints it', 'Wage bill, development share and pending bills', 'Open questions', 'Data gaps', 'Sources and how to read', 'Sources.', '2024/25'] },
  kisumu: { route: '/counties/kisumu/brief/', pdf: 'public/reports/kisumu-fiscal-brief.pdf', heads: ['Headline figures', 'Trends and comparisons', 'Audit opinions'],
    must: ['Kisumu County fiscal brief', 'What the figures mean', 'Budget, spending and absorption', 'Spending per person', 'beside Siaya and all 47 counties', 'Open questions', 'Data gaps', 'Sources and how to read'] },
};
const ROUTE = BRIEFS.siaya.route;
const PAGE_HEADS = BRIEFS.siaya.heads;
const MUST = BRIEFS.siaya.must;

// A4 printable box of the @page brief rule (9 mm by 11 mm margins), in CSS pixels at 96 dpi.
const MM = 96 / 25.4;
const BOX = { w: Math.floor((210 - 22) * MM), h: Math.floor((297 - 18) * MM) };

// Layout checks in print media at the printable width: returns a list of problems.
async function layoutProblems(page, url) {
  await page.setViewportSize({ width: BOX.w, height: BOX.h });
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((box) => {
    const out = [];
    const sheet = document.querySelector('.brief-sheet');
    if (!sheet) return ['no .brief-sheet on the page'];
    const right = sheet.getBoundingClientRect().right + 0.5;
    const pages = [...sheet.querySelectorAll('.brief-page')];
    if (pages.length < 2 || pages.length > 3) out.push(`${pages.length} .brief-page blocks; expected 2 or 3`);
    pages.forEach((p, i) => { const h = p.getBoundingClientRect().height; if (h > box.h) out.push(`page ${i + 1} is ${Math.round(h)}px tall; the A4 printable height is ${box.h}px`); });
    sheet.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || el.closest('.sr-only')) return;
      const tag = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}`;
      if (r.right > right) out.push(`${tag} extends ${Math.round(r.right - right)}px past the printed column`);
      const cs = getComputedStyle(el);
      if (/(hidden|auto|scroll|clip)/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) out.push(`${tag} clips its content (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`);
    });
    return [...new Set(out)].slice(0, 20);
  }, BOX);
}

// PDF checks: returns { pages, size, problems }.
function pdfProblems(pdf, dist, b = BRIEFS.siaya) {
  const problems = [];
  if (!fs.existsSync(pdf)) return { pages: 0, size: '', problems: [`missing ${pdf}`] };
  const { pages, size } = pdfInfo(pdf);
  if (pages < 2 || pages > 3) problems.push(`the brief has ${pages} page(s); it must have 2 or 3`);
  if (!/\(A4\)/.test(size)) problems.push('page is not A4 (595 x 842 pt)');
  const text = pdfText(pdf);
  const draft = /data-draft="true"/.test(fs.readFileSync(path.join(dist, b.route, 'index.html'), 'utf8'));
  const missing = [...b.must, ...(draft ? ['DRAFT', 'Provisional: awaiting editorial review'] : [])].filter((s) => !text.replace(/\s+/g, ' ').toLowerCase().includes(s.toLowerCase()));
  if (missing.length) problems.push(`text not extractable for: ${missing.join(', ')}`);
  // Each printed page carries its own section heading: a page that spilled over would push a heading to the next page.
  b.heads.slice(0, pages).forEach((h, i) => {
    const t = execFileSync('pdftotext', ['-f', String(i + 1), '-l', String(i + 1), '-layout', pdf, '-']).toString();
    if (!t.toLowerCase().includes(h.toLowerCase())) problems.push(`page ${i + 1} does not carry "${h}" (content spilled onto the wrong page)`);
    if (draft && !/\bDRAFT\b/.test(t)) problems.push(`page ${i + 1} lacks the DRAFT mark`);
  });
  return { pages, size, problems, chars: text.length };
}

module.exports = { BRIEFS, ROUTE, BOX, layoutProblems, pdfProblems };
