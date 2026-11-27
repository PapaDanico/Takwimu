#!/usr/bin/env node
// NOT_YET_ON_PAGES guard (lib/county-registry.js): a county whose data layer exists but whose pages do not must not
// reach the built site, and none of its values may be approved yet.
//   Data checks (always): the county is unpublished in lib/counties.js; no route app/counties/<slug>/ exists; no page,
//   component or library module reads its files or the registry (only the build-and-test modules may); the data
//   publisher (scripts/build-data.js) copies none of its files; data/reviews.json holds no record for its datasets and
//   no value is APPROVED; every value has a review-pack entry and a machine-check result, and the packs are up to date.
//   Built-site checks (with a dist directory): no path under dist/ for the county's route or data, and no built file
//   contains a record id, source id, conflict id or file title that exists only in the county's held files.
// Run: node scripts/test-unpublished-counties.js [dist]
const fs = require('fs');
const path = require('path');
const counties = require('../lib/county-registry');
const { bySlug } = require('../lib/counties');

const ROOT = counties.ROOT;
const dist = process.argv[2] ? path.resolve(process.argv[2]) : null;
const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['node_modules', '.next', 'dist', 'dist-synthetic'].includes(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)])) : []);
const SRC = ['app', 'components', 'lib'].flatMap((d) => walk(path.join(ROOT, d))).filter((f) => /\.(js|jsx|ts|tsx|mjs)$/.test(f));
const BUILD_ONLY = new Set(['lib/county-registry.js', 'lib/county-review.js'].map((f) => path.join(ROOT, f)));
const buildData = fs.readFileSync(path.join(ROOT, 'scripts', 'build-data.js'), 'utf8');
const reviews = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'reviews.json'), 'utf8'));

counties.NOT_YET_ON_PAGES.forEach((slug) => {
  const c = counties.COUNTY_DATA[slug];
  ok(!(bySlug(slug) || {}).published, `${slug}: listed as not yet on pages but lib/counties.js marks it published`);
  ok(!fs.existsSync(path.join(ROOT, 'app', 'counties', slug)), `${slug}: app/counties/${slug}/ exists, but the county has no approved page set`);
  // Pages, components and libraries do not read the held files or the registry.
  SRC.filter((f) => !BUILD_ONLY.has(f)).forEach((f) => {
    const t = fs.readFileSync(f, 'utf8');
    ok(!/data\/counties\/|county-registry|county-review/.test(t), `${path.relative(ROOT, f)}: reads a held county file or the county registry`);
  });
  // The publisher copies none of the county's files.
  Object.values(c.files).forEach((rel) => ok(!buildData.includes(rel) && !buildData.includes(path.basename(path.dirname(rel)) + '/'), `scripts/build-data.js mentions ${rel}`));
  ok(!/data\/counties|counties\//.test(buildData), 'scripts/build-data.js refers to data/counties/');
  // Review: no record, nothing approved; every value packed and machine-checked.
  const cr = require('../lib/county-review');
  const ds = cr.datasets(slug);
  ok(!reviews.decisions.some((r) => ds.includes(r.dataset)), `${slug}: data/reviews.json holds a record for ${ds.join('/')} (Phase 1: none may exist)`);
  const entries = cr.entries(slug);
  ok(entries.length > 0, `${slug}: no values`);
  entries.forEach((e) => ok(e.state_code !== 'APPROVED' && /^(Provisional: awaiting editorial review|Disputed: see the conflict register)$/.test(e.state), `${e.dataset}|${e.id}: state ${e.state}`));
  const { build } = require('./review-packs');
  const { json, md } = build(slug);
  ok(fs.existsSync(counties.abs(c.review.packs_json)) && fs.readFileSync(counties.abs(c.review.packs_json), 'utf8') === json, `${slug}: ${c.review.packs_json} is out of date (node scripts/review-packs.js --county ${slug})`);
  Object.entries(md).forEach(([d, t]) => { const f = path.join(counties.abs(c.review.packs_md), `${d}.md`); ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8') === t, `${slug}: pack ${d}.md is out of date`); });
  let mc = { checks: [] };
  try { mc = JSON.parse(fs.readFileSync(counties.abs(c.review.machine_checks), 'utf8')); } catch (e) { ok(false, `${slug}: ${c.review.machine_checks} missing (node scripts/machine-check.js --county ${slug} --index ...)`); }
  const have = new Set(mc.checks.map((x) => `${x.dataset}|${x.id}`));
  const want = new Set(entries.map((e) => `${e.dataset}|${e.id}`));
  ok(have.size === want.size && [...want].every((k) => have.has(k)), `${slug}: machine checks cover ${have.size} values, the county holds ${want.size}`);
  ok(Object.entries(mc.meta ? mc.meta.counts : {}).reduce((a, [, v]) => a + v, 0) === mc.checks.length, `${slug}: machine-check counts do not add up`);

  if (!dist) return;
  // Built site: nothing of the county's.
  const files = walk(dist);
  ok(files.length > 0, `${dist}: empty or missing`);
  // The all-county placeholder (app/counties/[slug]/: "not yet published", no county data) is the only page allowed.
  const own = files.map((f) => path.relative(dist, f)).filter((f) => new RegExp(`(^|/)counties/${slug}(/|$)`).test(f));
  ok(own.every((f) => f === `counties/${slug}/index.html` || f === `counties/${slug}/index.txt`), `${slug}: dist/ has pages under counties/${slug}/ beyond the not-yet-published placeholder: ${own.join(', ')}`);
  ok(!files.some((f) => /(^|\/)data\/counties\//.test(path.relative(dist, f))), 'dist/ holds a data/counties/ file');
  // Sentinels: strings that exist only in the held files (not shared all-county ids such as cob-report-*).
  const manifest = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'source-manifest.json'), 'utf8')).documents.map((d) => d.id));
  const sentinels = new Set();
  const L = counties.has(slug, 'ledger') ? counties.load(slug, 'ledger') : null;
  if (L) { Object.keys(L.sources).filter((id) => !manifest.has(id)).forEach((id) => sentinels.add(id)); sentinels.add(L.meta.title); }
  if (counties.has(slug, 'audits')) { const A = counties.load(slug, 'audits'); A.documents.forEach((d) => sentinels.add(d.doc_id)); sentinels.add(A.meta.title); }
  if (counties.has(slug, 'conflicts')) counties.load(slug, 'conflicts').conflicts.forEach((x) => sentinels.add(x.id));
  if (counties.has(slug, 'population')) sentinels.add(counties.load(slug, 'population').meta.title);
  const texts = files.filter((f) => /\.(html|json|js|txt|csv|xml|md|svg)$/.test(f));
  const hits = [];
  texts.forEach((f) => { const t = fs.readFileSync(f, 'utf8'); sentinels.forEach((s) => { if (t.includes(s)) hits.push(`${path.relative(dist, f)}: ${s}`); }); });
  ok(hits.length === 0, `${slug}: held values reached the built site: ${hits.slice(0, 8).join('; ')}`);
  ok(sentinels.size > 20, `${slug}: too few sentinels (${sentinels.size}) to make the check meaningful`);
});

if (errors.length) { errors.slice(0, 40).forEach((e) => console.error(`  - ${e}`)); console.error(`test-unpublished-counties: ${errors.length} of ${n} checks failed`); process.exit(1); }
console.log(`test-unpublished-counties: ${n} checks passed (not yet on pages: ${counties.NOT_YET_ON_PAGES.join(', ') || 'none'}${dist ? `; built site ${path.relative(ROOT, dist) || dist} checked` : ''})`);
