const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const SITEMAP = [...require('fs').readFileSync(require('path').join(process.argv[2], 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
// axe-core is resolved like Playwright: from NODE_PATH (global install) or a local node_modules.
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [__dirname, ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] }), 'utf8');
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    const t = f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'text/html';
    res.writeHead(200, { 'content-type': t }); res.end(d);
  });
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    for (const url of SITEMAP) {
      const ctx = await b.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
      const pg = await ctx.newPage();
      await pg.goto(`http://localhost:${port}${url}`, { waitUntil: 'load' });
      await pg.evaluate(axeSrc);
      const r = await pg.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
      console.log(scheme, url, 'violations:', r.violations.length, 'incomplete:', r.incomplete.length);
      r.violations.forEach((v) => console.log('  -', v.id, v.impact, v.nodes.length, 'nodes:', v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')));
      r.incomplete.forEach((v) => console.log('  ? incomplete', v.id, v.nodes.length, v.nodes.slice(0,6).map((n) => n.target.join(' ') + ' => ' + (n.any[0] && n.any[0].message || '').slice(0,90)).join(' || ')));
      await ctx.close();
    }
  }
  await b.close(); srv.close();
});
