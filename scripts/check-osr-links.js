#!/usr/bin/env node
// Every built page that shows own-source revenue or FIF links the explainer at /learn/#own-source-revenue (owner item 5,
// 23 Nov 2026), so a reader can see why the CoB, county, Auditor-General and KNBS totals differ.
// Run after `next build`: node scripts/check-osr-links.js dist
const fs = require('fs');
const path = require('path');
const { textOf } = require('./check-built-html');

const MENTIONS = /own[- ]source revenue|\bFIF\b|Facility Improvement Financ/i;
const LINK = /href="\/learn\/#own-source-revenue"/;
function osrPagesMissingLink(root) {
  const out = []; let n = 0;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '_next') walk(p); return; }
    if (!e.name.endsWith('.html')) return;
    const rel = `/${path.relative(root, p).replace(/index\.html$/, '').replace(/\\/g, '/')}`;
    if (rel === '/learn/' || /^\/(404|_not-found)/.test(rel)) return;
    const html = fs.readFileSync(p, 'utf8');
    const main = (html.match(/<main[\s\S]*<\/main>/) || [html])[0];
    if (!MENTIONS.test(textOf(main))) return;
    n += 1;
    if (!LINK.test(main)) out.push(rel);
  });
  walk(root);
  return { missing: out, pages: n };
}
module.exports = { osrPagesMissingLink };
if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
  const { missing, pages } = osrPagesMissingLink(root);
  if (missing.length) { console.error(`check-osr-links: ${missing.length} of ${pages} pages mention own-source revenue or FIF without linking /learn/#own-source-revenue:\n- ${missing.join('\n- ')}`); process.exit(1); }
  console.log(`check-osr-links: ${pages} pages mention own-source revenue or FIF; each links /learn/#own-source-revenue`);
}
