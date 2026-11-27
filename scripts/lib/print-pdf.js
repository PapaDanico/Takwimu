// Shared scaffolding for the PDF scripts (make-brief-pdf.js, make-reports-pdf.js, test-reports.js):
// a static server over the built site, a print-media Chromium page, and poppler readers.
// Each script keeps its own checks (one A4 page for the brief; DRAFT header and fonts for the reports).
// Playwright is not a project dependency: callers run with NODE_PATH=$(npm root -g).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };

// Static file server for a built directory (index.html for folder URLs, nothing outside dir).
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

// Serves dir on a free port, opens one light print-media page, runs fn({ page, port, browser }) and exits with
// the code fn returns (0 when it returns nothing). Browser and server are always closed.
function withPrintPage(dir, pageOptions, fn) {
  const { chromium } = require('playwright');
  const srv = serve(dir);
  srv.listen(0, async () => {
    let code = 0;
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage(pageOptions);
      await page.emulateMedia({ media: 'print', colorScheme: 'light' });
      code = (await fn({ page, port: srv.address().port, browser })) || 0;
    } finally {
      await browser.close();
      srv.close();
    }
    process.exit(code);
  });
}

// pdfinfo: page count, page size line and the raw output.
function pdfInfo(file) {
  const info = execFileSync('pdfinfo', [file]).toString();
  return { info, pages: Number((info.match(/^Pages:\s+(\d+)/m) || [])[1]), size: (info.match(/^Page size:\s+(.+)$/m) || [])[1] || '' };
}
const pdfText = (file, layout = true) => execFileSync('pdftotext', [...(layout ? ['-layout'] : []), file, '-']).toString();
const pdfFonts = (file) => execFileSync('pdffonts', [file]).toString().split('\n').slice(2).filter(Boolean);

module.exports = { TYPES, serve, withPrintPage, pdfInfo, pdfText, pdfFonts };
