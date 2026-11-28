// Which reviewed datasets (lib/review-status.js DATASET_IDS) each page renders values from, derived from the source:
// every app/**/page.js is followed through its local imports and requires, and a dataset counts when a module on that
// path imports data/<dataset>.json or names it in a review-status call (masked('x'), badge('x', ...), dataset="x").
// Used by scripts/smoke-test.js (exactly one provisional label on each such page) and runnable on its own:
//   node scripts/page-datasets.js
const fs = require('fs');
const path = require('path');
const { DATASET_IDS } = require('../lib/review-status');

const root = path.join(__dirname, '..');
const app = path.join(root, 'app');
// Not followed: the review register (reads every data file to keep the register), and the catalogue status and source
// lists, which read data files for counts, versions and document titles, not to show values.
// lib/county-pages.js builds other counties' pages with Siaya's ledger builder; it shows none of Siaya's values
// (scripts/test-unpublished-counties.js checks the label on those pages).
const SKIP = new Set(['review-status.js', 'dataset-status.js', 'siaya-sources.js', 'county-pages.js'].map((f) => path.join(root, 'lib', f)));
const CALL = /\b(?:masked|badge|counts|review|observations|publishedCopy|original|catalogueCounts|stateOf)\(\s*['"]([a-z-]+)['"]|\bdatasets?=\{?\s*\[?['"]([a-z-]+)['"]/g;
const SPEC = /(?:\bfrom\s*|\brequire\(\s*|\bimport\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

function resolveSpec(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

const memo = {};
function datasetsOf(file, seen = new Set()) {
  if (memo[file]) return memo[file];
  if (seen.has(file) || SKIP.has(file)) return new Set();
  seen.add(file);
  const out = new Set();
  if (file.endsWith('.json')) {
    const rel = path.relative(path.join(root, 'data'), file);
    const stem = rel.replace(/\.json$/, '');
    if (!rel.startsWith('..') && DATASET_IDS.includes(stem)) out.add(stem);
    return out;
  }
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(CALL)) { const d = m[1] || m[2]; if (DATASET_IDS.includes(d)) out.add(d); }
  for (const m of src.matchAll(SPEC)) {
    const f = resolveSpec(file, m[1]);
    if (f) datasetsOf(f, seen).forEach((d) => out.add(d));
  }
  memo[file] = out;
  return out;
}

// Route of a page file: app/counties/siaya/page.js -> /counties/siaya/; dynamic segments stay as [slug].
const routeOf = (file) => `/${path.relative(app, path.dirname(file)).split(path.sep).filter(Boolean).join('/')}${path.dirname(file) === app ? '' : '/'}`;

function pages() {
  const list = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith('_')) walk(p); } else if (e.name === 'page.js') list.push(p);
  });
  walk(app);
  return list.sort().map((f) => ({ file: path.relative(root, f), route: routeOf(f), datasets: [...datasetsOf(f)].sort() }));
}

// Does a concrete path (/stories/own-source-revenue/) match a route pattern (/stories/[slug]/)?
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matches = (route, url) => new RegExp(`^${route.split(/\[[^\]]+\]/).map(esc).join('[^/]+')}$`).test(url);

module.exports = { pages, matches };

if (require.main === module) pages().forEach((p) => console.log(`${p.route.padEnd(36)} ${p.datasets.join(', ') || '-'}`));
