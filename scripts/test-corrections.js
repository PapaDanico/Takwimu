#!/usr/bin/env node
// Corrections register (owner item 7, 23 Nov 2026). Fails the build when:
//  - a resolved register case that is our correction lacks its record, or a source-error case is listed as ours;
//  - a value differs from the previous release's data (git main, data/corrections.json meta.baseline) and has no
//    entry in data/corrections.json or a correction record in data/conflicts.json naming it;
//  - with a built site (node scripts/test-corrections.js dist): /corrections/ does not show every correction and every
//    source error, or the footer, /method/ and /data/ do not link it.
// Run: node scripts/test-corrections.js [dist]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const rs = require('../lib/review-status');
const ed = require('../lib/editorial');
const conflicts = require('../data/conflicts.json');
const log = require('../data/corrections.json');

const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };

// 1. Register cases.
const corr = ed.corrections();
conflicts.conflicts.filter((c) => c.status === 'resolved' && c.register === 'our_correction').forEach((c) => ok(corr.some((x) => x.id === c.id), `${c.id}: our correction missing from the register list`));
ed.registerSourceErrors().forEach((c) => ok(!corr.some((x) => x.id === c.id), `${c.id}: a source error is not our correction`));
log.entries.forEach((e) => ok(e.original !== e.corrected, `${e.id}: original and corrected are the same`));
const ses = ed.sourceErrors();
ok(ses.length > 0, 'no source errors found: the source_error fields were removed?');
ses.forEach((s) => ok(s.quote && s.issue && Number.isInteger(s.page), `${s.dataset} ${s.record}: source error needs quote, page and issue`));

// 2. Every value that changed since the previous release has a correction entry.
const baseline = log.meta.baseline;
const gitShow = (ref, f) => { try { return execFileSync('git', ['show', `${ref}:${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const ref = [baseline, `origin/${baseline}`].find((r) => gitShow(r, 'data/history.json'));
const named = new Set([...log.entries.flatMap((e) => e.record_ids.map((id) => `${e.dataset}|${id}`)), ...conflicts.conflicts.flatMap((c) => ((c.correction && c.correction.records) || []))]);
let compared = 0;
let changed = 0;
if (!ref) console.warn(`test-corrections: SKIP value comparison: git ref ${baseline} not available here`);
else {
  rs.DATASET_IDS.forEach((ds) => {
    const old = gitShow(ref, `data/${ds}.json`);
    if (!old) return;
    const valuesOf = (data) => Object.fromEntries(rs.refsOf(ds, data).map((i) => [i.id, JSON.stringify(Object.keys(i.ref[1] || {}).filter((k) => typeof i.ref[1][k] !== 'function').map((k) => i.ref[0][k]))]));
    const before = valuesOf(JSON.parse(old));
    const now = valuesOf(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `${ds}.json`), 'utf8')));
    Object.entries(now).forEach(([id, v]) => {
      if (!(id in before)) return; // a new value is an addition, not a correction
      compared += 1;
      if (before[id] !== v) { changed += 1; ok(named.has(`${ds}|${id}`), `${ds} ${id}: value changed since ${ref} (${before[id]} -> ${v}) without an entry in data/corrections.json`); }
    });
  });
}

// 3. The built page.
const dist = process.argv[2];
if (dist) {
  const page = (p) => { const f = path.join(path.resolve(dist), p, 'index.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
  const html = page('corrections');
  ok(html, '/corrections/ was not built');
  if (html) {
    const text = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ');
    corr.forEach((c) => { ok(html.includes(`id="cor-${c.id}"`), `/corrections/: correction ${c.id} is not shown`); });
    ses.forEach((s) => ok(html.includes(`data-source-error="${s.dataset}:${s.record}"`), `/corrections/: source error ${s.dataset} ${s.record} is not shown`));
    ed.registerSourceErrors().forEach((c) => ok(html.includes(`id="se-${c.id}"`), `/corrections/: source-error case ${c.id} is not shown`));
    ok(/Source errors in the original documents/.test(text), '/corrections/: no separate section for source-document errors');
  }
  ['method', 'data'].forEach((p) => { const h = page(p); ok(h && /href="\/corrections\/"/.test(h), `/${p}/ does not link /corrections/`); });
  const home = page('');
  ok(home && /<footer[\s\S]*href="\/corrections\/"[\s\S]*<\/footer>/.test(home), 'the footer does not link /corrections/');
}

// Netlify redirects run before static files: none may shadow the register (live 301 on 23 Nov 2026).
{
  const toml = fs.readFileSync(require('path').join(__dirname, '..', 'netlify.toml'), 'utf8');
  ok(!/from\s*=\s*"\/corrections\//.test(toml), 'netlify.toml redirects /corrections/ away from the register');
}

if (errors.length) {
  console.error(`test-corrections: ${errors.length} of ${checks} checks failed`);
  errors.slice(0, 40).forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-corrections: ${checks} checks passed (${corr.length} corrections, ${ses.length} source-error records, ${ed.registerSourceErrors().length} source-error register cases; ${ref ? `${compared} values compared with ${ref}, ${changed} changed` : 'no baseline'})`);
