const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const SITEMAP = [...require('fs').readFileSync(require('path').join(process.argv[2], 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const pages = SITEMAP;
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    const t = f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'text/html';
    res.writeHead(200, { 'content-type': t }); res.end(d);
  });
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch();
  const bad = [];
  for (const w of [320, 360, 768, 900, 1024, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    const pg = await ctx.newPage();
    for (const u of pages) {
      await pg.goto(`http://localhost:${port}${u}`, { waitUntil: 'load' });
      const r = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      console.log(w, u, r.sw > r.iw ? `OVERFLOW ${r.sw}>${r.iw}` : 'ok');
      if (w === 360) {
        const hrefs = await pg.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
        for (const h of hrefs) {
          if (!h.startsWith('/')) continue;
          const [pathPart, hash] = h.split('?')[0].split('#');
          const f = path.join(root, pathPart.endsWith('/') ? pathPart + 'index.html' : pathPart);
          if (!fs.existsSync(f)) bad.push(`${u} -> ${h} (missing file)`);
          else if (hash) {
            const html = fs.readFileSync(f, 'utf8');
            if (!html.includes(`id="${hash}"`)) bad.push(`${u} -> ${h} (missing anchor)`);
          }
        }
      }
    }
    await ctx.close();
  }
  console.log(bad.length ? 'BROKEN LINKS:\n' + [...new Set(bad)].join('\n') : 'internal links ok');
  await b.close();
  srv.close();
});
