#!/usr/bin/env node
// County release guard (lib/county-states.js, lib/county-registry.js; handover E03-E05). Fails closed.
//   States: every registry county has an explicit state (draft / reviewable / published); lib/counties.js marks a
//   county published exactly when its state is "published"; no county outside the registry is published.
//   Routes: only legacy counties (Siaya) have their own app/counties/<slug>/; every other published county's pages
//   come from app/counties/[slug]/ and exactly the pages its registry entry lists exist there.
//   Code: pages, components and libraries read county files only through lib/county-pages.js (which refuses held
//   counties and kinds outside `public_kinds`); scripts/build-data.js copies no data/counties/ file.
//   Review: a draft county has no review record; no value is APPROVED without a hash-matched record
//   (lib/county-review.js); every value has a review-pack entry and a machine-check result; packs are up to date.
//   Leak fixture (always): a deliberately leaked record in HTML, an RSC payload, CSV, JSON and a PDF must each be
//   caught by the record-level scanner (scripts/county-leaks.js), and a clean fixture must pass.
//   Built site (with a dist directory): a held county has only the "in preparation" page; a published county has
//   exactly its listed pages, each value of its public kinds on them with its review label, and no record of a
//   held kind or a rejected value anywhere in dist/ (HTML, RSC, CSV, JSON, PDF text).
// Run: node scripts/test-unpublished-counties.js [dist]
const fs = require('fs');
const os = require('os');
const path = require('path');
const counties = require('../lib/county-registry');
const { COUNTIES } = require('../lib/counties');
const { COUNTY_STATE, STATES } = require('../lib/county-states');
const cr = require('../lib/county-review');
const leaks = require('./county-leaks');

const ROOT = counties.ROOT;
const dist = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : null;
// --record-pdfs (with dist, on a host with pdftotext): write data/pdf-leak-scan.json for the PDFs scanned clean.
const RECORD = process.argv.includes('--record-pdfs');
const SCAN_FILE = path.join(ROOT, 'data', 'pdf-leak-scan.json');
const scanRecord = fs.existsSync(SCAN_FILE) ? JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8')) : { scans: {} };
const newRecord = { meta: { rule: 'PDFs in dist/ scanned clean with pdftotext against each county\'s held-record sentinels (scripts/test-unpublished-counties.js --record-pdfs). A build host without pdftotext accepts a PDF only when its SHA-256 is listed here under the same sentinels_sha256; anything else fails the build. The local gates check that this file is current.' }, scans: {} };
const errors = [];
let n = 0;
const ok = (c, m) => { n += 1; if (!c) errors.push(m); };
const walkSrc = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['node_modules', '.next', 'dist', 'dist-synthetic', '_held'].includes(e.name) ? [] : walkSrc(path.join(d, e.name))) : [path.join(d, e.name)])) : []);
const SRC = ['app', 'components', 'lib'].flatMap((d) => walkSrc(path.join(ROOT, d))).filter((f) => /\.(js|jsx|ts|tsx|mjs)$/.test(f));
const rel = (f) => path.relative(ROOT, f);
const buildData = fs.readFileSync(path.join(ROOT, 'scripts', 'build-data.js'), 'utf8');
const reviews = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'reviews.json'), 'utf8'));

// ---- States ----
Object.keys(COUNTY_STATE).forEach((s) => ok(STATES.includes(COUNTY_STATE[s]), `lib/county-states.js: ${s} has state "${COUNTY_STATE[s]}", not one of ${STATES.join('/')}`));
counties.slugs().forEach((s) => ok(s in COUNTY_STATE, `${s}: in lib/county-registry.js but has no explicit state in lib/county-states.js`));
COUNTIES.forEach((c) => {
  const st = counties.slugs().includes(c.slug) ? counties.state(c.slug) : 'none';
  ok(c.published === (st === 'published'), `${c.slug}: lib/counties.js published=${c.published} but its state is ${st}`);
});
counties.ON_PAGES.forEach((s) => {
  const c = counties.COUNTY_DATA[s];
  ok(Array.isArray(c.pages) && c.pages.includes(''), `${s}: published without a page list (the hub '' at least)`);
  ok(Array.isArray(c.public_kinds) && c.public_kinds.length > 0 && c.public_kinds.every((k) => counties.KINDS[k]), `${s}: published without a valid public_kinds allowlist`);
});

// ---- Routes ----
const DYN = path.join(ROOT, 'app', 'counties', '[slug]');
const dynPages = fs.readdirSync(DYN, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const listed = new Set(counties.ON_PAGES.flatMap((s) => counties.pages(s)).filter(Boolean));
dynPages.forEach((p) => ok(listed.has(p), `app/counties/[slug]/${p}/ exists but no published county lists the page "${p}"`));
listed.forEach((p) => ok(dynPages.includes(p), `a published county lists the page "${p}" but app/counties/[slug]/${p}/ does not exist`));
counties.slugs().filter((s) => !counties.legacy(s)).forEach((s) => ok(!fs.existsSync(path.join(ROOT, 'app', 'counties', s)), `${s}: app/counties/${s}/ exists; registry counties use app/counties/[slug]/ only`));

// ---- Code ----
const GATE = new Set(['lib/county-registry.js', 'lib/county-review.js', 'lib/county-pages.js'].map((f) => path.join(ROOT, f)));
SRC.filter((f) => !GATE.has(f)).forEach((f) => {
  const t = fs.readFileSync(f, 'utf8');
  ok(!/(require\(\s*|from\s+|import\(\s*)['"`][^'"`]*(data\/counties\/|county-registry|county-review)/.test(t) && !/readFileSync\([^)]*counties/.test(t), `${rel(f)}: reads a county file or the registry directly (use lib/county-pages.js)`);
});
const cpSrc = fs.readFileSync(path.join(ROOT, 'lib', 'county-pages.js'), 'utf8');
ok(/ON_PAGES\.includes\(slug\)/.test(cpSrc) && /isPublicKind\(slug, kind\)/.test(cpSrc), 'lib/county-pages.js: the state and public_kinds checks are missing');
// The gate itself refuses a held county and a kind outside the allowlist.
const cp = require('../lib/county-pages');
const refuses = (fn) => { try { fn(); return false; } catch (e) { return /county-pages:/.test(e.message); } };
ok(refuses(() => cp.meta('nakuru')), 'lib/county-pages.js serves a county that is not published');
counties.HELD.forEach((s) => ok(refuses(() => cp.ledger(s)), `lib/county-pages.js serves held county ${s}`));
ok(!/data\/counties/.test(buildData), 'scripts/build-data.js refers to data/counties/');
counties.slugs().filter((s) => !counties.legacy(s)).forEach((s) => Object.values(counties.COUNTY_DATA[s].files).forEach((f) => ok(!buildData.includes(f), `scripts/build-data.js mentions ${f}`)));

// ---- Review ----
counties.slugs().filter((s) => !counties.legacy(s)).forEach((slug) => {
  const c = counties.COUNTY_DATA[slug];
  const ds = cr.datasets(slug);
  if (counties.state(slug) === 'draft') ok(!reviews.decisions.some((r) => ds.includes(r.dataset)), `${slug}: draft county has review records (move it to reviewable first)`);
  const entries = cr.entries(slug);
  ok(entries.length > 0, `${slug}: no values`);
  entries.forEach((e) => {
    const rec = reviews.decisions.filter((r) => r.dataset === e.dataset && (r.record_ids || []).includes(e.id));
    if (e.state_code === 'APPROVED') ok(rec.some((r) => r.decision === 'approved' && r.source_sha256), `${e.dataset}|${e.id}: APPROVED without a hash-matched record`);
    else ok(['REVIEW_PENDING', 'DISPUTED', 'REJECTED', 'SUPERSEDED'].includes(e.state_code), `${e.dataset}|${e.id}: unknown state ${e.state_code}`);
  });
  const { build } = require('./review-packs');
  const { json, md } = build(slug);
  ok(fs.existsSync(counties.abs(c.review.packs_json)) && fs.readFileSync(counties.abs(c.review.packs_json), 'utf8') === json, `${slug}: ${c.review.packs_json} is out of date (node scripts/review-packs.js --county ${slug})`);
  Object.entries(md).forEach(([d, t]) => { const f = path.join(counties.abs(c.review.packs_md), `${d}.md`); ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8') === t, `${slug}: pack ${d}.md is out of date`); });
  let mc = { checks: [] };
  try { mc = JSON.parse(fs.readFileSync(counties.abs(c.review.machine_checks), 'utf8')); } catch (e) { ok(false, `${slug}: ${c.review.machine_checks} missing`); }
  const have = new Set(mc.checks.map((x) => `${x.dataset}|${x.id}`));
  const want = new Set(entries.map((e) => `${e.dataset}|${e.id}`));
  ok(have.size === want.size && [...want].every((k) => have.has(k)), `${slug}: machine checks cover ${have.size} values, the county holds ${want.size}`);
  ok(Object.entries(mc.meta ? mc.meta.counts : {}).reduce((a, [, v]) => a + v, 0) === mc.checks.length, `${slug}: machine-check counts do not add up`);
});

// ---- What must not reach dist/, per county ----
const heldKinds = (slug) => (counties.state(slug) === 'published' ? Object.keys(counties.KINDS).filter((k) => !counties.isPublicKind(slug, k)) : Object.keys(counties.KINDS));
const rejectedKeys = (slug) => new Set(cr.entries(slug).filter((e) => e.state_code === 'REJECTED').map((e) => `${e.dataset}|${e.id}`));

// ---- Leak fixture: a deliberately leaked record must be caught in every file type ----
(() => {
  const slug = counties.slugs().find((s) => !counties.legacy(s));
  const S = leaks.sentinelsFor(slug, Object.keys(counties.KINDS));
  ok(S.size > 50, `fixture: too few sentinels (${S.size}) for ${slug}`);
  const recKey = [...S.entries()].find(([, w]) => /^record /.test(w))[0];
  const printed = [...S.entries()].find(([, w]) => /^printed text/.test(w))[0];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'county-leak-'));
  const clean = path.join(tmp, 'clean'); const dirty = path.join(tmp, 'dirty');
  [clean, dirty, path.join(dirty, 'x')].forEach((d) => fs.mkdirSync(d, { recursive: true }));
  fs.writeFileSync(path.join(clean, 'index.html'), '<p>K001 KSh 7.94 billion, nothing held here</p>');
  const PDF = leaks.hasPdftotext();
  if (PDF) fs.writeFileSync(path.join(clean, 'r.pdf'), leaks.makePdf('Public text only, FY 2014/15'));
  fs.writeFileSync(path.join(dirty, 'index.html'), `<p>${printed.replace(/&/g, '&amp;')}</p>`);
  fs.writeFileSync(path.join(dirty, 'x', 'index.txt'), `1:["$","div",null,{"data-obs":"${recKey.replace('|', ':')}"}]`);
  fs.writeFileSync(path.join(dirty, 'x', 'rows.csv'), `id,value\n${recKey},1\n`);
  fs.writeFileSync(path.join(dirty, 'x', 'data.json'), JSON.stringify({ text: printed }));
  if (PDF) fs.writeFileSync(path.join(dirty, 'x', 'report.pdf'), leaks.makePdf(`Annex: ${recKey}`));
  const c = leaks.scan(clean, S);
  ok(c.hits.length === 0 && c.errors.length === 0 && c.pdfs === (PDF ? 1 : 0), `fixture: clean files flagged or PDF unread (${JSON.stringify(c.hits.slice(0, 3))} ${c.errors.join('; ')})`);
  const d = leaks.scan(dirty, S);
  ['index.html', 'x/index.txt', 'x/rows.csv', 'x/data.json', ...(PDF ? ['x/report.pdf'] : [])].forEach((f) => ok(d.hits.some((h) => h.file === f), `fixture: leaked record in ${f} was not caught`));
  ok(d.errors.length === 0, `fixture: scanner errors ${d.errors.join('; ')}`);
  // Fail closed: an unreadable PDF (or none can be read: no pdftotext) is an error, not a pass.
  fs.writeFileSync(path.join(dirty, 'broken.pdf'), 'not a pdf');
  ok(leaks.scan(dirty, S).errors.length === 1, 'fixture: an unreadable PDF did not fail the scan');
  if (!PDF) console.log('test-unpublished-counties: pdftotext not installed: the PDF leak fixture is skipped here (it runs in the local release gates); any held record would still fail this run, because PDFs in dist/ cannot be read');
  fs.rmSync(tmp, { recursive: true, force: true });
})();

if (dist) {
  const files = leaks.walk(dist);
  ok(files.length > 0, `${dist}: empty or missing`);
  const relFiles = files.map((f) => path.relative(dist, f));
  ok(!relFiles.some((f) => /(^|\/)data\/counties\//.test(f)), 'dist/ holds a data/counties/ file');
  counties.slugs().filter((s) => !counties.legacy(s)).forEach((slug) => {
    const own = relFiles.filter((f) => new RegExp(`(^|/)counties/${slug}(/|$)`).test(f));
    const allowed = counties.state(slug) === 'published' ? counties.pages(slug).flatMap((p) => [`counties/${slug}/${p ? `${p}/` : ''}index.html`, `counties/${slug}/${p ? `${p}/` : ''}index.txt`]) : [`counties/${slug}/index.html`, `counties/${slug}/index.txt`];
    own.forEach((f) => ok(allowed.includes(f), `${slug}: dist/${f} is not a page its state (${counties.state(slug)}) allows`));
    if (counties.state(slug) === 'published') {
      counties.pages(slug).forEach((p) => ok(own.includes(`counties/${slug}/${p ? `${p}/` : ''}index.html`), `${slug}: listed page "${p}" is missing from dist/`));
      // Every value of a public kind is on a page, with its review label.
      const html = counties.pages(slug).map((p) => { const f = path.join(dist, 'counties', slug, p, 'index.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; }).join('\n');
      const shown = new Set([...html.matchAll(/data-obs="([^"]+)"/g)].map((x) => x[1]));
      cr.entries(slug).filter((e) => counties.isPublicRecord(slug, (Object.entries({ ledger: 'fiscal-ledger', audits: 'audits', population: 'population', indicators: 'indicators', abstract: 'abstract' }).find(([, v]) => e.dataset === `${slug}-${v}`) || [null])[0], e.id)).forEach((e) => ok(shown.has(`${e.dataset}:${e.id}`), `${slug}: ${e.dataset}|${e.id} is not shown on any of its pages`));
      // The page label exactly once on each page that shows values while any is unreviewed (smoke-test rule N3).
      const pending = cr.counts(slug).approved < cr.counts(slug).total;
      counties.pages(slug).forEach((p) => { const f = path.join(dist, 'counties', slug, p, 'index.html'); if (!fs.existsSync(f)) return; const t = fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, ''); const k = (t.match(/Provisional: awaiting editorial review/g) || []).length; ok(p === 'sources' ? k === 0 : k === (pending ? 1 : 0), `${slug}/${p}: the provisional label appears ${k} times`); });
      const kindOfDs = (e) => (Object.entries({ ledger: 'fiscal-ledger', audits: 'audits', population: 'population', indicators: 'indicators', abstract: 'abstract' }).find(([, v]) => e.dataset === `${slug}-${v}`) || [null])[0];
      const npc = cr.entries(slug).filter((e) => e.needs_page_check && counties.isPublicRecord(slug, kindOfDs(e), e.id)).length;
      const npcShown = (html.match(/data-needs-page-check/g) || []).length;
      ok(npcShown >= npc, `${slug}: ${npc} values need a page check but only ${npcShown} labels are shown`);
    }
    // Record-level scan of everything that must stay off the site.
    const kinds = heldKinds(slug);
    // Records of a public kind outside its table allowlist (public_tables) are held too, record by record.
    const partHeld = new Set();
    Object.keys(counties.KINDS).filter((k) => counties.isPublicKind(slug, k) && counties.publicIds(slug, k) !== null).forEach((k) => {
      const ds = cr.datasetName(slug, k);
      counties.load(slug, k).observations.filter((o) => !counties.isPublicRecord(slug, k, o.id)).forEach((o) => partHeld.add(`${ds}|${o.id}`));
    });
    const S = new Map([...leaks.sentinelsFor(slug, kinds), ...leaks.sentinelsFor(slug, Object.keys(counties.KINDS), rejectedKeys(slug).size ? rejectedKeys(slug) : new Set(['none|none'])), ...(partHeld.size ? leaks.sentinelsFor(slug, Object.keys(counties.KINDS), partHeld) : [])]);
    if (partHeld.size) ok(S.size > 100, `${slug}: ${partHeld.size} held records of public kinds give only ${S.size} sentinels`);
    const sh = leaks.sentinelsHash(S);
    const rec = (scanRecord.scans[slug] && scanRecord.scans[slug].sentinels_sha256 === sh) ? scanRecord.scans[slug].pdfs : null;
    const r = leaks.scan(dist, S, rec);
    ok(r.errors.length === 0, `${slug}: scan errors: ${r.errors.slice(0, 5).join('; ')}`);
    if (S.size) {
      if (leaks.hasPdftotext() && r.errors.length === 0 && r.hits.length === 0) newRecord.scans[slug] = { sentinels_sha256: sh, pdfs: r.pdfHashes };
      // With pdftotext (the local gates), the committed record must already cover this build, so Netlify can rely on it.
      if (leaks.hasPdftotext() && !RECORD) ok(rec && JSON.stringify(rec) === JSON.stringify(r.pdfHashes), `${slug}: data/pdf-leak-scan.json does not cover these PDFs and held set: run node scripts/test-unpublished-counties.js dist --record-pdfs and commit it`);
    }
    ok(r.hits.length === 0, `${slug}: held records reached the built site: ${r.hits.slice(0, 8).map((h) => `${h.file}: ${h.why}`).join('; ')}`);
    if (counties.state(slug) !== 'published') ok(S.size > 20, `${slug}: too few sentinels (${S.size}) to make the check meaningful`);
  });
}

if (RECORD && dist) {
  if (!leaks.hasPdftotext()) ok(false, '--record-pdfs needs pdftotext');
  else if (!errors.length) { fs.writeFileSync(SCAN_FILE, JSON.stringify(newRecord, null, 1) + '\n'); console.log(`test-unpublished-counties: wrote ${path.relative(ROOT, SCAN_FILE)} (${Object.keys(newRecord.scans).join(', ') || 'nothing held'})`); }
}
if (errors.length) { errors.slice(0, 40).forEach((e) => console.error(`  - ${e}`)); console.error(`test-unpublished-counties: ${errors.length} of ${n} checks failed`); process.exit(1); }
console.log(`test-unpublished-counties: ${n} checks passed (published from the registry: ${counties.ON_PAGES.join(', ') || 'none'}; held: ${counties.HELD.join(', ') || 'none'}; leak fixture caught in HTML, RSC, CSV, JSON${leaks.hasPdftotext() ? ' and PDF' : ' (PDF skipped: no pdftotext)'}${dist ? `; built site ${path.relative(ROOT, dist) || dist} checked` : ''})`);
