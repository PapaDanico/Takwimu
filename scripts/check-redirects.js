#!/usr/bin/env node
// Netlify redirects with force = true run before static files. A redirect whose source is a built page
// is allowed only when that page is a meta-refresh stub to the same target; anything else hides a real page
// (the old corrections register was hidden this way on 23 Nov 2026; /corrections/ is now a moved stub).
const fs = require('fs');
const path = require('path');

const dist = process.argv[2] || 'dist';
const toml = fs.readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8');
const blocks = toml.split('[[redirects]]').slice(1);
const errors = [];
let checked = 0;

for (const b of blocks) {
  const from = (b.match(/from\s*=\s*"([^"]+)"/) || [])[1];
  const to = (b.match(/to\s*=\s*"([^"]+)"/) || [])[1];
  if (!from || !to) continue;
  const base = from.replace(/\*$/, '');
  const candidates = [path.join(dist, base), path.join(dist, base, 'index.html')];
  const file = candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) continue;
  checked++;
  if (!file.endsWith('.html')) continue; // a byte-identical fallback copy (e.g. the moved brief PDF)
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i);
  if (!m) errors.push(`${from} redirects to ${to} but ${path.relative(dist, file)} is a real page`);
  else if (m[1] !== to) errors.push(`${from}: redirect goes to ${to}, the page's refresh goes to ${m[1]}`);
}

// No sitemap URL may be a redirect source (duplication sweep D22).
const sources = new Set(blocks.map((b) => (b.match(/from\s*=\s*"([^"]+)"/) || [])[1]).filter(Boolean).map((f) => f.replace(/\/?$/, '/')));
const smFile = path.join(dist, 'sitemap.xml');
let smUrls = 0;
if (fs.existsSync(smFile)) {
  const locs = [...fs.readFileSync(smFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  smUrls = locs.length;
  locs.filter((u) => sources.has(u.replace(/\/?$/, '/'))).forEach((u) => errors.push(`sitemap lists ${u}, which is a redirect source in netlify.toml`));
} else errors.push('dist/sitemap.xml is missing');

if (errors.length) {
  console.error(`check-redirects: ${errors.length} redirect(s) hide or disagree with built pages`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`check-redirects: ${blocks.length} redirects, ${checked} over built files, all stubs agree; ${smUrls} sitemap URLs, none a redirect source`);
