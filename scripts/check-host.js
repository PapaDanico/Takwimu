#!/usr/bin/env node
// Fails the build if any published file still names the old host (takwimu.netlify.app) instead of the primary domain
// (lib/site-url.js, owner 28 Nov 2026). Scans every text file in dist (HTML, sitemap, robots, route payloads, data,
// scripts, styles, manifest) and every PDF: raw bytes (link annotations) and, where poppler's pdftotext is installed,
// the extracted text. Historical docs (provenance, research logs) are not in dist and are not checked.
// Run after `next build`: node scripts/check-host.js dist
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SITE_URL } = require('../lib/site-url');
const { OLD_HOST } = require('./lib/old-host');

const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const TEXT = new Set(['.html', '.xml', '.txt', '.json', '.js', '.css', '.webmanifest', '.csv', '.svg', '.md', '.geojson', '.ics']);
const needle = OLD_HOST.toLowerCase();
const hasOld = (s) => s.toLowerCase().includes(needle);

let pdftotext = true;
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); } catch { pdftotext = false; }

// Not vacuous: the old host must be caught in a sample, the primary domain must pass.
if (!hasOld(`<a href="https://${OLD_HOST}/data/">`) || hasOld(`<a href="${SITE_URL}/data/">`) || SITE_URL.includes(OLD_HOST)) {
  console.error('check-host: self-test failed'); process.exit(1);
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dist);
const bad = [];
let text = 0, pdfs = 0;
for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  if (TEXT.has(ext)) { text++; if (hasOld(fs.readFileSync(f, 'utf8'))) bad.push(path.relative(dist, f)); continue; }
  if (ext !== '.pdf') continue;
  pdfs++;
  if (hasOld(fs.readFileSync(f).toString('latin1'))) { bad.push(`${path.relative(dist, f)} (link)`); continue; }
  if (pdftotext && hasOld(execFileSync('pdftotext', [f, '-']).toString())) bad.push(`${path.relative(dist, f)} (text)`);
}
for (const req of ['sitemap.xml', 'robots.txt']) {
  const p = path.join(dist, req);
  if (!fs.existsSync(p) || !fs.readFileSync(p, 'utf8').includes(SITE_URL)) bad.push(`${req} does not use ${SITE_URL}`);
}
if (bad.length) {
  console.error(`check-host: ${bad.length} published file(s) still name ${OLD_HOST} (use SITE_URL from lib/site-url.js):`);
  bad.slice(0, 30).forEach((b) => console.error(`  - ${b}`));
  process.exit(1);
}
console.log(`check-host: ${text} text files and ${pdfs} PDFs${pdftotext ? '' : ' (links only; pdftotext not installed)'} name only ${SITE_URL}`);
