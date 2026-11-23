#!/usr/bin/env node
// Netlify redirects with force = true run before static files. A redirect whose source is a built page
// is allowed only when that page is a meta-refresh stub to the same target; anything else hides a real page
// (the /corrections/ register was hidden this way on 23 Nov 2026).
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

if (errors.length) {
  console.error(`check-redirects: ${errors.length} redirect(s) hide or disagree with built pages`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`check-redirects: ${blocks.length} redirects, ${checked} over built files, all stubs agree`);
