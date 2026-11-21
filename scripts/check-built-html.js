// Fails the build if any exported HTML page contains "NaN" (a chart coordinate or figure computed from a
// missing value). Missing values must render as gaps. Run after `next build`: node scripts/check-built-html.js dist
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const pages = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(p);
});
walk(root);
const bad = pages.filter((p) => /\bNaN\b/.test(fs.readFileSync(p, 'utf8')));
if (!pages.length) { console.error(`No HTML found under ${root}`); process.exit(1); }
if (bad.length) {
  console.error(`"NaN" found in ${bad.length} built page(s):\n- ` + bad.map((p) => path.relative(root, p)).join('\n- '));
  process.exit(1);
}
console.log(`Built HTML check passed (${pages.length} pages, no NaN).`);
