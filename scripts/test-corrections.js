#!/usr/bin/env node
// Corrections as footnotes (owner item 7, 23 Nov 2026; register page retired by the owner, 27 Nov 2026). Fails when:
//  - a resolved register case that is our correction lacks its record, or a source-error case is listed as ours;
//  - a correction lacks the records, short "was" or one-line note its footnote needs;
//  - a value differs from the previous release's data (git main, data/corrections.json meta.baseline) and has no
//    entry in data/corrections.json or a correction record in data/conflicts.json naming it;
//  - with a built site (node scripts/test-corrections.js dist): a correction is not footnoted beside its value on a
//    built page (data-correction="<dataset>:<record>"), a source error is not flagged beside its value
//    (data-source-error="<dataset>:<record>"), /method/#corrections is missing, or /corrections/ is more than the
//    moved stub (netlify.toml 301 and static fallback to /method/#corrections).
// Run: node scripts/test-corrections.js [dist]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const rs = require('../lib/review-status');
const ed = require('../lib/editorial');
const conflicts = require('../data/conflicts.json');
const log = require('../data/corrections.json');
const { correctionNotes } = require('../lib/correction-notes');

const errors = [];
let checks = 0;
const ok = (c, m) => { checks += 1; if (!c) errors.push(m); };

// 1. Register cases and footnote fields.
const corr = ed.corrections();
conflicts.conflicts.filter((c) => c.status === 'resolved' && c.register === 'our_correction').forEach((c) => {
  ok(corr.some((x) => x.id === c.id), `${c.id}: our correction missing from the corrections list`);
  ok(c.correction && (c.correction.records || []).length, `${c.id}: correction.records missing (where is the corrected value shown?)`);
});
ed.registerSourceErrors().forEach((c) => ok(!corr.some((x) => x.id === c.id), `${c.id}: a source error is not our correction`));
log.entries.forEach((e) => ok(e.original !== e.corrected, `${e.id}: original and corrected are the same`));
const notes = correctionNotes();
notes.forEach((n) => ok(n.was && n.was.length <= 80 && n.note && n.note.length >= 10 && n.note.length <= 140, `${n.id} ${n.ref}: the footnote needs a short "was" (80 characters at most) and a one-line note (10 to 140)`));
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

// Placement of footnotes in one built page: a tag scan (scripts and styles skipped) that keeps the open elements, and
// for each data-correction or data-correction-mark element finds its nearest container: a <tr>, an element of class
// "lv" (a ledger value) or an element with data-record. When the container closes, its markup must name the record.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function placement(h) {
  const out = [];
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  for (let m = re.exec(h); m; m = re.exec(h)) {
    const [, close, raw, attrs] = m;
    const tag = raw.toLowerCase();
    if (!close && (tag === 'script' || tag === 'style')) { const end = h.indexOf(`</${tag}`, re.lastIndex); re.lastIndex = end < 0 ? h.length : end; continue; }
    if (close) {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].tag !== tag) i -= 1;
      if (i < 0) continue;
      stack.splice(i).forEach((e) => e.needs.forEach(({ ref, kind }) => {
        const body = h.slice(e.start, m.index);
        const named = body.includes(`data-obs="${ref}"`) || body.includes(`data-record="${ref}"`);
        out.push({ ok: named, msg: `correction ${kind} ${ref} sits in a <${e.tag}> that is not its record's row or block (it holds ${(body.match(/data-(?:obs|record)="[^"]+"/) || ['no record attribute'])[0]})` });
      }));
      continue;
    }
    const container = tag === 'tr' || /\sclass="(?:[^"]*\s)?lv(?:\s[^"]*)?"/.test(attrs) || /\sdata-record="/.test(attrs);
    const fm = attrs.match(/\sdata-correction(-mark)?="([^"]+)"/);
    if (fm) {
      const c = [...stack].reverse().find((x) => x.container);
      const need = { ref: fm[2], kind: fm[1] ? 'mark' : 'line' };
      if (c) c.needs.push(need); else out.push({ ok: false, msg: `correction ${need.kind} ${need.ref} is in no row, ledger value block or data-record element` });
    }
    if (!VOID.has(tag) && !/\/\s*$/.test(attrs)) stack.push({ tag, attrs, start: m.index, container, needs: [] });
  }
  return out;
}

// 3. The built site: each correction and source error beside its value; /corrections/ only a moved stub.
const dist = process.argv[2];
let pagesWithNotes = 0;
let placed = 0;
if (dist) {
  const root = path.resolve(dist);
  const page = (p) => { const f = path.join(root, p, 'index.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
  const unesc = (x) => x.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
  const html = walk(root).map((f) => [f, fs.readFileSync(f, 'utf8')]);
  const notesSeen = new Set(); const marksSeen = new Set(); const seSeen = new Set();
  html.forEach(([, h]) => {
    let any = false;
    for (const m of h.matchAll(/data-correction="([^"]+)"/g)) { notesSeen.add(unesc(m[1])); any = true; }
    for (const m of h.matchAll(/data-correction-mark="([^"]+)"/g)) marksSeen.add(unesc(m[1]));
    for (const m of h.matchAll(/data-source-error="([^"]+)"/g)) seSeen.add(unesc(m[1]));
    if (any) pagesWithNotes += 1;
  });
  // Every corrected record shows its footnote line, or its mark where the same correction's line is already in that table.
  notes.forEach((n) => ok(notesSeen.has(n.ref) || marksSeen.has(n.ref), `${n.id}: ${n.ref} has no correction footnote on any built page`));
  [...new Set(notes.map((n) => n.id))].forEach((id) => ok(notes.some((n) => n.id === id && notesSeen.has(n.ref)), `${id}: its footnote line is not shown on any built page`));
  ses.forEach((s) => ok(seSeen.has(`${s.dataset}:${s.record}`), `source error ${s.dataset}:${s.record} is not flagged beside its value on any built page`));
  // Each footnote line and mark sits beside the record it footnotes: its nearest enclosing row (<tr>), ledger value
  // block (.lv) or element carrying data-record must name that record, by data-obs or data-record. A footnote in the
  // wrong row, or in no row at all, fails.
  html.forEach(([f, h]) => placement(h).forEach((p) => { placed += 1; ok(p.ok, `${path.relative(root, f)}: ${p.msg}`); }));
  ok(placed >= notes.length, `only ${placed} footnote lines and marks were checked for placement`);
  const data = page('data');
  ed.registerSourceErrors().forEach((c) => ok(data && new RegExp(`id="${c.id}"[^>]*>[\\s\\S]{0,600}?data-register="source_error"`).test(data), `/data/: source-error case ${c.id} is not marked "Source error in original"`));
  const method = page('method');
  ok(method && /<section[^>]*id="corrections"/.test(method) && /href="\/data\/corrections\.json"/.test(method), '/method/ has no #corrections section linking corrections.json');
  const stub = page('corrections');
  ok(stub && /http-equiv="refresh" content="0; url=\/method\/#corrections"/.test(stub) && !/data-correction=|<table/.test(stub), '/corrections/ is not the moved stub to /method/#corrections');
  const linking = html.filter(([f, h]) => f !== path.join(root, 'corrections', 'index.html') && /href="\/corrections\/?(#[^"]*)?"/.test(h)).map(([f]) => path.relative(root, f));
  ok(!linking.length, `built pages still link /corrections/: ${linking.slice(0, 3).join(', ')}`);
  const sm = path.join(root, 'sitemap.xml');
  ok(fs.existsSync(sm) && !/\/corrections\/<\/loc>/.test(fs.readFileSync(sm, 'utf8')), '/corrections/ is still in the sitemap');
}

// Netlify answers /corrections/ with a 301 to the method note; the static stub is the fallback.
{
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  ['/corrections/', '/corrections'].forEach((from) => ok(new RegExp(`from = "${from}"\\s*to = "/method/#corrections"\\s*status = 301`).test(toml), `netlify.toml has no 301 from ${from} to /method/#corrections`));
}

if (errors.length) {
  console.error(`test-corrections: ${errors.length} of ${checks} checks failed`);
  errors.slice(0, 40).forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`test-corrections: ${checks} checks passed (${corr.length} corrections footnoting ${notes.length} records${dist ? ` on ${pagesWithNotes} pages, ${placed} lines and marks in their record's row` : ''}, ${ses.length} source-error records, ${ed.registerSourceErrors().length} source-error register cases; ${ref ? `${compared} values compared with ${ref}, ${changed} changed` : 'no baseline'})`);
