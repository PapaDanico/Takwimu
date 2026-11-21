// Checks the five report pages and their PDFs (handover section 9, PDF quality gates; section 14).
// Run after `npm run build` and the PDF script:
//   NODE_PATH=$(npm root -g) node scripts/test-reports.js [distDir]
// For each report: the PDF exists, is A4, has a page count in a range derived from the content it prints (table rows,
// charts, sections), embeds every font, and its text contains the snapshot ID (recomputed here from the data files
// and the review state, so a stale PDF fails) and the review-state counts of the figures on the page, the source
// appendix and, while any figure is unreviewed, the DRAFT mark on every page; the provisional label is printed at
// most once per page plus once per exception (UX sweep U3); neither the PDF nor the page shows "NaN", "undefined" or
// "[object Object]";
// no company name other than a programme implementer or funder appears and no figure reads a contractor field; in
// print layout no table, cell or chart is wider than the printed column; every figure on the HTML page resolves to a
// record in its data file with the same value and carries the page and grade of its source observation (D9); every
// citation link resolves; each chart is a single tab stop.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const registry = require('../components/report/reports.json');

const root = path.join(__dirname, '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const fails = [];
const fail = (slug, msg) => fails.push(`${slug}: ${msg}`);

// The snapshot covers the input files, the review register, the documents it is checked against and the review state
// of every value (components/report/snapshot.js), so a PDF printed before a review decision fails here.
const snapshotOf = (inputs) => require('../components/report/snapshot').snapshot(inputs, root).id;
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
// Contractors (owner decision, sweep D22): the data files hold no contractor names any more, so a list built from
// them would always be empty. Instead every company-like name printed in a report (the pattern scripts/test-projects.js
// applies to the data) must be an organisation that data/siaya-programmes.json names as a programme implementer or
// funder, and must not also occur in the project or audit files; and no figure may read a contractor field.
const COMPANY = /\b[A-Z][A-Za-z&]+(?: (?:[A-Z][A-Za-z&]+|and|of|&))* (?:Limited|Ltd\.?|PLC|Company|Corporation)\b/g;
const progs = data('siaya-programmes.json').programmes;
const namedOrgs = progs.flatMap((p) => [p.implementing_organisation, p.funder]).filter((x) => typeof x === 'string').join('\n');
const projAudText = ['siaya-projects.json', 'siaya-audits.json'].map((f) => fs.readFileSync(path.join(root, 'data', f), 'utf8')).join('\n');
const companyLeaks = (text) => [...new Set(text.replace(/\s+/g, ' ').match(COMPANY) || [])]
  .filter((m) => !namedOrgs.split('\n').some((o) => o.includes(m) || m.includes(o.trim()) && o.trim().length > 6) || projAudText.includes(m));
// The check is not vacuous: it must catch a made-up contractor and pass a named implementer.
if (!companyLeaks('works by Acme Builders Limited were certified').length) { console.error('test-reports: company-name pattern no longer matches a sample contractor'); process.exit(1); }
const CONTRACTOR_FIELD = /contract(or)?(_|\/|$)/i;
// "undefined" as English in a source's own note is allowed; any other occurrence is a rendering bug. The allowed
// uses are the word with its preceding word, as they occur in the data files.
const allowedUndefined = new Set();
fs.readdirSync(path.join(root, 'data')).filter((f) => f.endsWith('.json')).forEach((f) => {
  (fs.readFileSync(path.join(root, 'data', f), 'utf8').match(/[A-Za-z,]+ undefined\b/g) || []).forEach((m) => allowedUndefined.add(m));
});
const strayUndefined = (text) => [...text.replace(/\s+/g, ' ').matchAll(/(?:([A-Za-z,]+) )?\bundefined\b/g)].map((m) => m[0]).filter((m) => !allowedUndefined.has(m));

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

function checkPdf(r, expectSnap, draft, dom) {
  const pdf = path.join(root, 'public', 'reports', `${r.slug}.pdf`);
  if (!fs.existsSync(pdf)) { fail(r.slug, `missing ${path.relative(root, pdf)} (run scripts/make-reports-pdf.js)`); return null; }
  const info = execFileSync('pdfinfo', [pdf]).toString();
  const pages = Number((info.match(/^Pages:\s+(\d+)/m) || [])[1]);
  if (!/\(A4\)/.test(info)) fail(r.slug, 'PDF is not A4');
  // Expected pages from what the page prints (fitted on Edition 1): about 22 plain table rows or 5 rows with
  // citation lines per A4 page in print layout, a third of a page per chart, plus the cover and appendix breaks.
  // The range allows for row heights to vary with text length.
  const est = 3 + dom.plainRows / 22 + dom.citeRows / 5 + dom.charts / 3;
  const lo = Math.max(2, Math.floor(est * 0.7));
  const hi = Math.ceil(est * 1.35);
  if (!(pages >= lo && pages <= hi)) fail(r.slug, `PDF has ${pages} pages; expected ${lo} to ${hi} for ${dom.plainRows} plain and ${dom.citeRows} cited table rows and ${dom.charts} charts`);
  const fonts = execFileSync('pdffonts', [pdf]).toString().split('\n').slice(2).filter(Boolean);
  const notEmbedded = fonts.filter((l) => !/\syes\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l));
  if (!fonts.length) fail(r.slug, 'PDF lists no fonts (text not extractable)');
  if (notEmbedded.length) fail(r.slug, `fonts not embedded: ${notEmbedded.join('; ')}`);
  const text = execFileSync('pdftotext', ['-layout', pdf, '-']).toString();
  if (!text.includes(expectSnap)) fail(r.slug, `PDF text lacks the current snapshot ID ${expectSnap} (stale PDF?)`);
  if (!/Bibliography and document versions/.test(text) || !/SHA-256/.test(text)) fail(r.slug, 'PDF lacks the source appendix (bibliography with SHA-256)');
  if (!/Snapshot, method and licence/.test(text)) fail(r.slug, 'PDF lacks the licence appendix');
  if (draft && (text.match(/\bDRAFT\b/g) || []).length < pages) fail(r.slug, 'PDF lacks the DRAFT mark on every page');
  if (draft && !text.includes('Provisional: awaiting editorial review')) fail(r.slug, 'PDF lacks the provisional label');
  const flat = text.replace(/\s+/g, ' ');
  const labels = (flat.match(/Provisional: awaiting editorial review/g) || []).length;
  if (labels > pages + dom.exceptions) fail(r.slug, `PDF prints the provisional label ${labels} times; at most ${pages + dom.exceptions} (pages + exceptions)`);
  const st = dom.state;
  if (!flat.includes(`Review state: ${st[0]} provisional, ${st[1]} approved, ${st[2]} disputed, ${st[3]} superseded, ${st[4]} withdrawn`)) fail(r.slug, `PDF lacks the review-state counts of the page (${st.join('/')})`);
  if (/Not stated; [^.]{0,60}confidence Not graded/.test(flat)) fail(r.slug, 'PDF prints "Not stated; … confidence Not graded"');
  if (!new RegExp(`Page 1 of ${pages}\\b`).test(text)) fail(r.slug, 'PDF lacks page numbers');
  if (/\bNaN\b/.test(text)) fail(r.slug, 'PDF text contains "NaN"');
  const rawText = execFileSync('pdftotext', [pdf, '-']).toString();
  const stray = strayUndefined(rawText);
  if (stray.length) fail(r.slug, `PDF text contains "undefined" (${stray.slice(0, 3).join(' | ')})`);
  if (rawText.includes('[object Object]')) fail(r.slug, `PDF text contains "[object Object]" ${rawText.split('[object Object]').length - 1} times`);
  companyLeaks(rawText).forEach((m) => fail(r.slug, `PDF names a company that is not a programme implementer or funder: ${m}`));
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
        const figs = [...main.querySelectorAll('.fig')].map((e) => ({ file: e.dataset.file, ptr: e.dataset.ptr, value: e.dataset.value, suppressed: e.dataset.suppressed === 'true', text: e.textContent, page: e.dataset.page, conf: e.dataset.conf, srcFile: e.dataset.srcFile, srcPtr: e.dataset.srcPtr, state: e.dataset.obsState || 'review_pending' }));
        const charts = [...main.querySelectorAll('.rp-chart')];
        const chartTabs = charts.map((c) => [c, ...c.querySelectorAll('*')].filter((el) => el.tabIndex >= 0 && (el === c || el.hasAttribute('tabindex') || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName))).length);
        const trs = [...main.querySelectorAll('tr')];
        const citeRows = trs.filter((tr) => tr.querySelector('small.cite')).length;
        const plainRows = trs.length - citeRows;
        const appendices = main.querySelectorAll('.rp-appendix').length;
        const bareValues = [...main.querySelectorAll('td.v')].filter((td) => !td.querySelector('.fig')).length;
        return { snapshot: main.dataset.snapshot, draft: main.dataset.draft === 'true', reviewState: main.dataset.reviewState, wide, deadLinks, figs, bareValues, text: main.innerText, watermark: !!main.querySelector('.rp-watermark'), charts: charts.length, chartTabs, plainRows, citeRows, appendices };
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
      // Review state (part of the snapshot): the counts on the cover are the states of the figures on the page.
      const cnt = { review_pending: 0, approved: 0, disputed: 0, superseded: 0, rejected: 0 };
      dom.figs.forEach((f) => { cnt[f.state in cnt ? f.state : 'review_pending'] += 1; });
      dom.state = [cnt.review_pending, cnt.approved, cnt.disputed, cnt.superseded, cnt.rejected];
      dom.exceptions = dom.figs.length - cnt.review_pending;
      if (dom.reviewState !== dom.state.join('/')) fail(r.slug, `cover review state ${dom.reviewState} differs from the figures on the page (${dom.state.join('/')})`);
      if (!dom.text.includes(`Review state: ${dom.state[0]} provisional, ${dom.state[1]} approved, ${dom.state[2]} disputed, ${dom.state[3]} superseded, ${dom.state[4]} withdrawn`)) fail(r.slug, 'page lacks the review-state line');
      const labels = (dom.text.match(/Provisional: awaiting editorial review/g) || []).length;
      if (labels > 1 + dom.exceptions) fail(r.slug, `page prints the provisional label ${labels} times; the cover states it once`);
      // D9: a figure taken from an observation carries that observation's page and numeric grade.
      let lost = 0;
      dom.figs.forEach((f) => {
        const recPtr = f.srcPtr || (f.ptr || '').split('/').slice(0, -1).join('/');
        const rec = recPtr ? resolve(f.srcFile || f.file, recPtr) : { ok: false };
        if (!rec.ok || !rec.v || typeof rec.v !== 'object' || Array.isArray(rec.v)) return;
        const pg = rec.v.pdf_page ?? rec.v.page_pdf ?? rec.v.page;
        const missPage = pg != null && !f.page;
        const missConf = typeof rec.v.confidence === 'number' && !f.conf;
        if (missPage || missConf) { lost += 1; if (lost <= 5) fail(r.slug, `figure ${f.file}#${f.ptr} drops the ${missPage ? 'page' : 'confidence'} of its source observation ${f.srcFile || f.file}#${recPtr}`); }
      });
      if (/Not stated; [^.\n]{0,60}confidence Not graded/.test(dom.text)) fail(r.slug, 'page prints "Not stated; … confidence Not graded"');
      dom.chartTabs.forEach((n, i) => { if (n !== 1) fail(r.slug, `chart ${i + 1} has ${n} tab stops; expected 1`); });
      // Contractors: no figure reads a contractor field, the page payload has no contractor key, and no company name
      // other than a programme implementer or funder is printed.
      dom.figs.filter((f) => CONTRACTOR_FIELD.test(f.ptr || '')).slice(0, 3).forEach((f) => fail(r.slug, `figure reads a contract field: ${f.file}#${f.ptr}`));
      if (/\\?"contractor[a-z_]*\\?"\s*:/.test(fs.readFileSync(file, 'utf8'))) fail(r.slug, 'built page carries a contractor field');
      companyLeaks(dom.text).forEach((m) => fail(r.slug, `page names a company that is not a programme implementer or funder: ${m}`));
      if (/\bNaN\b/.test(dom.text)) fail(r.slug, 'page text contains "NaN"');
      const stray = strayUndefined(dom.text);
      if (stray.length) fail(r.slug, `page text contains "undefined" (${stray.slice(0, 3).join(' | ')})`);
      if (dom.text.includes('[object Object]')) fail(r.slug, `page text contains "[object Object]" ${dom.text.split('[object Object]').length - 1} times`);
      const pages = checkPdf(r, expectSnap, dom.draft, dom);
      summary.push(`${r.letter} ${r.slug}: ${pages} pages, ${dom.figs.length} figures resolved, review state ${dom.state.join('/')}, snapshot ${expectSnap}${dom.draft ? ', DRAFT' : ''}`);
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
