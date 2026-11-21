#!/usr/bin/env node
// Checks data/reviews.json (editorial review decisions) and the review states derived from it (lib/review-status.js):
// schema; every record names existing observations of its dataset and a source document of those observations whose
// current SHA-256 equals the hash the reviewer checked; reviewers are roles from the vocabulary, never names (no
// honorifics, no personal-name or contact patterns anywhere in the file); no record supersedes an unknown record; no
// dataset field says a value was reviewed or approved without a record; observation ids are unique per dataset; the
// review queue (docs/editorial/REVIEW_QUEUE.md) is current.
// With a build directory (node scripts/test-reviews.js dist): no page says "Approved" for a value without a matching
// approved record, and the catalogue counts equal the resolver's counts.
// Run: node scripts/test-reviews.js [dist]
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/reviews.json');
const schema = read('schemas/reviews.schema.json');
const rs = require('../lib/review-status');
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

// ---- schema (same subset as scripts/validate-data.js, with local $ref) ----
function checkSchema(s, value, where, out) {
  if (s.$ref) return checkSchema(s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], schema), value, where, out);
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number' && s.minimum !== undefined && value < s.minimum) out.push(`${where}: below minimum`);
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value.slice(0, 60)}" does not match ${s.pattern}`);
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems) out.push(`${where}: needs at least ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => checkSchema(s.items, v, `${where}[${i}]`, out));
  }
  if (kind(value) === 'object') {
    (s.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    Object.entries(value).forEach(([k, v]) => {
      if ((s.properties || {})[k]) checkSchema(s.properties[k], v, `${where}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
    });
  }
}
const schemaErrors = [];
checkSchema(schema, data, 'reviews', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

// The role vocabulary is the same in the data file and the schema, and the schema's dataset list is the resolver's.
const decisionSchema = schema.$defs.decision.properties;
ok(JSON.stringify(decisionSchema.reviewer_role.enum) === JSON.stringify(data.meta.reviewer_roles), 'reviewer_roles in data/reviews.json and the schema enum differ');
ok(JSON.stringify([...decisionSchema.dataset.enum].sort()) === JSON.stringify([...rs.DATASET_IDS].sort()), 'schema dataset enum differs from lib/review-status.js DATASET_IDS');
ok(JSON.stringify(decisionSchema.decision.enum) === JSON.stringify(rs.DECISIONS), 'schema decision enum differs from lib/review-status.js');

// ---- no personal data: roles only ----
const HONORIFIC = /\b(Mr|Mrs|Ms|Miss|Mx|Dr|Prof|Professor|Hon|Honourable|Eng|Engineer|Rev|Reverend|Sir|Madam|Dame|Lord|Lady|Fr|Father|Sr|Sister|Bishop|Pastor|Sheikh|Imam|Mzee|Bw|Bi|CPA|Arch|Justice|Judge)\.?\s+[A-Z][a-z]/;
const BY_NAME = /\b([Rr]eviewed|[Cc]hecked|[Aa]pproved|[Rr]ejected|[Ss]igned|[Vv]erified|[Dd]one|[Pp]repared|[Ee]xtracted)\s+by\s+(?!the\b|a\b|an\b|role\b|Takwimu\b)[A-Z][a-z]+/;
const CONTACT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}|(?:\+?254|\b0)[17]\d{8}\b|\bwa\.me\//;
const TWO_NAMES = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g;
// Capitalised word pairs that are not people (publishers, documents, places) and may appear in a rationale.
const NOT_PEOPLE = /^(Controller|Budget|Auditor|General|County|Government|Siaya|Kenya|National|Treasury|Assembly|Executive|Office|Report|Review|Annual|Table|Statistical|Abstract|Bureau|Statistics|Health|Ministry|World|Bank|Commission|Revenue|Allocation|Integrated|Development|Plan|Programme|Fiscal|Year|Quarter|First|Second|Third|Fourth|Implementation|Demographic|Survey|Gross|Product|Economic|Open|International|Partnership|African|Peer|Review|Mechanism|Mortality|Census|Population|Housing|Lake|Victoria|Bondo|Gem|Rarieda|Ugenya|Ugunja|Alego|Usonga|Water|Services|Regulatory|Board|Senate|Parliament|Public|Accounts|Committee|Source|Library|Manifest|Page|Printed|Approved|Supplementary|Estimates|Pending|Bills|Own|The|This|See|Same)$/;
const scanText = (text, where) => {
  ok(!HONORIFIC.test(text), `${where}: contains an honorific followed by a name; reviewers are identified by role only`);
  ok(!BY_NAME.test(text), `${where}: names who did the work ("... by <Name>"); use the role`);
  ok(!CONTACT.test(text), `${where}: contains an e-mail address, phone number or chat link`);
  (text.match(TWO_NAMES) || []).forEach((m) => ok(m.split(/\s+/).some((w) => NOT_PEOPLE.test(w)), `${where}: "${m}" looks like a personal name; reviewers are identified by role only (add the words to NOT_PEOPLE in scripts/test-reviews.js if it is an organisation or document)`));
};
const walk = (v, where) => {
  if (typeof v === 'string') scanText(v, where);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { ok(!/name|email|phone|person|signature|initials/i.test(k), `${where}.${k}: field name suggests personal data`); walk(x, `${where}.${k}`); });
};
walk(data.decisions, 'reviews.decisions');
// The checks catch what they should (guards against a pattern that silently matches nothing).
['Dr. Achieng checked the page', 'Reviewed by Otieno', 'reviewer@example.org', 'Grace Akinyi'].forEach((t) => {
  const before = errors.length;
  scanText(t, 'self-test');
  const caught = errors.length > before;
  errors.splice(before);
  ok(caught, `self-test: the name scan missed "${t}"`);
});

// ---- every record resolves ----
const ids = new Set();
data.decisions.forEach((r) => {
  const tag = `review ${r.id}`;
  ok(!ids.has(r.id), `${tag}: duplicate id`);
  ids.add(r.id);
  ok(rs.DATASET_IDS.includes(r.dataset), `${tag}: unknown dataset ${r.dataset}`);
  const obs = Object.fromEntries(rs.observations(r.dataset).map((o) => [o.id, o]));
  (r.record_ids || []).forEach((id) => {
    ok(Boolean(obs[id]), `${tag}: ${r.dataset} has no observation ${id}`);
    if (obs[id]) ok(obs[id].sources.includes(r.source_document_id), `${tag}: ${id} does not cite ${r.source_document_id} (it cites ${obs[id].sources.join(', ') || 'no document'})`);
  });
  const current = rs.sourceHash(r.dataset, r.source_document_id);
  ok(Boolean(current), `${tag}: source document ${r.source_document_id} has no stored SHA-256, so nothing can be reviewed against it`);
  // A record still in force must match the document as held now; a superseded one keeps the hash it was made on.
  if (current && rs.inForce.some((x) => x.id === r.id)) ok(current === r.source_sha256, `${tag}: source_sha256 does not match the current hash of ${r.source_document_id}; re-review and add a superseding record`);
  ok(new Set(r.record_ids).size === r.record_ids.length, `${tag}: duplicate record id`);
  ok(!(r.decision === 'disputed') || Boolean(r.conflict_id), `${tag}: a disputed decision names the conflict case (conflict_id)`);
  ok(r.date <= data.meta.updated, `${tag}: dated after meta.updated`);
});
data.decisions.forEach((r) => (r.supersedes || []).forEach((s) => {
  ok(ids.has(s) && s !== r.id, `review ${r.id}: supersedes unknown record ${s}`);
  const old = data.decisions.find((x) => x.id === s);
  if (old) ok(old.dataset === r.dataset && old.date <= r.date, `review ${r.id}: supersedes ${s} from another dataset or a later date`);
}));
// Conflict ids named by a disputed decision exist in the register.
const conflictIds = new Set(read('data/conflicts.json').conflicts.map((c) => c.id));
const ledgerCases = new Set(read('data/siaya-fiscal-ledger.json').discrepancies.map((d) => d.case_id));
data.decisions.filter((r) => r.conflict_id).forEach((r) => ok(conflictIds.has(r.conflict_id) || ledgerCases.has(r.conflict_id), `review ${r.id}: conflict ${r.conflict_id} is not in data/conflicts.json or the ledger`));

// ---- observation ids are unique per dataset (a record must point at one value) ----
rs.DATASET_IDS.forEach((d) => {
  const list = rs.observations(d).map((o) => o.id);
  ok(list.length > 0, `${d}: no observations enumerated`);
  ok(new Set(list).size === list.length, `${d}: duplicate observation ids in lib/review-status.js enumeration`);
});

// ---- default: no record, no approval; states as expected ----
const recorded = new Set(data.decisions.flatMap((r) => r.record_ids.map((id) => `${r.dataset}|${id}`)));
rs.DATASET_IDS.forEach((d) => rs.observations(d).forEach((o) => {
  const s = rs.stateOf(d, o.id);
  if (!recorded.has(`${d}|${o.id}`)) ok(s.state === 'REVIEW_PENDING' || s.state === 'DISPUTED', `${d} ${o.id}: state ${s.state} without a review record`);
  if (s.state === 'APPROVED') ok(s.anchored, `${d} ${o.id}: approved without a source anchor`);
}));
{
  const first = rs.DATASET_IDS.flatMap((d) => rs.observations(d).map((o) => [d, o.id])).find(([d, id]) => !recorded.has(`${d}|${id}`) && rs.stateOf(d, id).state === 'REVIEW_PENDING');
  ok(!first || rs.review(first[0], first[1]).label === 'Provisional: awaiting editorial review', 'default public label is not "Provisional: awaiting editorial review"');
}

// ---- data files never claim a review the register does not hold ----
// Fields that record a review in the data files must stay empty (or say "not reviewed") until there is a record.
const ledger = read('data/siaya-fiscal-ledger.json');
ledger.discrepancies.forEach((x) => ok((x.reviewer === null && x.reviewed_at === null) || data.decisions.some((r) => r.dataset === 'siaya-fiscal-ledger' && r.conflict_id === x.case_id), `ledger ${x.case_id}: reviewer or reviewed_at is set without a review record`));
const APPROVED_WORD = /^(approved|reviewed|verified by reviewer|editorially approved)$/i;
fs.readdirSync(path.join(root, 'data')).filter((f) => /^(siaya-|counties-cob|history)/.test(f) && f.endsWith('.json')).forEach((f) => {
  const scan = (v, where) => {
    if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => {
      if (/^(review_status|review_state|editorial_status|approval_status|approved)$/.test(k)) ok(!(x === true || (typeof x === 'string' && APPROVED_WORD.test(x))), `${f} ${where}.${k}: says "${x}" without a review record (reviews go in data/reviews.json)`);
      scan(x, `${where}.${k}`);
    });
  };
  scan(read(`data/${f}`), f.replace(/\.json$/, ''));
});

// ---- the review queue is current ----
const queue = require('./review-queue').render();
const queueFile = path.join(root, 'docs/editorial/REVIEW_QUEUE.md');
ok(fs.existsSync(queueFile) && fs.readFileSync(queueFile, 'utf8') === queue, 'docs/editorial/REVIEW_QUEUE.md is out of date: run node scripts/review-queue.js');

// ---- built site (optional): "Approved" only with a record ----
const dist = process.argv[2];
if (dist) {
  const dir = path.resolve(dist);
  const pages = [];
  const list = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) list(p); else if (e.name.endsWith('.html')) pages.push(p); });
  list(dir);
  ok(pages.length > 0, `${dist}: no HTML pages`);
  let approvedTags = 0;
  pages.forEach((p) => {
    const html = fs.readFileSync(p, 'utf8');
    const rel = path.relative(dir, p);
    // Every element marked as approved names its record, and the record resolves to APPROVED.
    for (const m of html.matchAll(/<[^>]*data-review="approved"[^>]*>/g)) {
      approvedTags += 1;
      const rec = (m[0].match(/data-record="([^":]+):([^"]+)"/) || []);
      const s = rec[1] ? rs.stateOf(rec[1], rec[2]) : null;
      ok(Boolean(s && s.state === 'APPROVED'), `${rel}: an element is marked approved for ${rec[1] || '?'}:${rec[2] || '?'} without an approved record`);
    }
    // The word "Approved" as a review label (a tag or a status) appears only on such elements.
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '');
    for (const m of text.matchAll(/<(span|a|strong|b|em|small|dd|td)\b[^>]*class="[^"]*\b(tag|ds-status|review)[^"]*"[^>]*>\s*(Approved|Editorially approved|Reviewed and approved)\s*</gi)) {
      ok(/data-review="approved"/.test(m[0]), `${rel}: "${m[3]}" label without a review record`);
    }
    ok(!/Editorially approved|Approved by (the )?(editor|reviewer)/i.test(text) || /data-review="approved"/.test(text), `${rel}: says a value was approved by a reviewer, but no value on the page has an approved record`);
  });
  const approvedTotal = rs.DATASET_IDS.reduce((n, d) => n + rs.counts(d).approved, 0);
  if (approvedTotal === 0) ok(approvedTags === 0, `${dist}: ${approvedTags} approved tags but no approved records`);
  // The catalogue as built carries the resolver's counts.
  const catFile = path.join(dir, 'data/datasets/catalogue.json');
  if (fs.existsSync(catFile)) {
    const cat = JSON.parse(fs.readFileSync(catFile, 'utf8'));
    const items = Array.isArray(cat) ? cat : cat.datasets || [];
    items.filter((d) => d.review).forEach((d) => {
      const c = rs.catalogueCounts(d.id);
      ok(Boolean(c) && c.approved === d.review.approved && c.pending === d.review.pending && c.rejected === d.review.rejected, `catalogue ${d.id}: review counts differ from lib/review-status.js`);
    });
    ok(items.some((d) => d.review), 'catalogue.json: no dataset carries review counts');
  }
}

// ---- renderers not yet wired to the register ----
// history.json values are also drawn by pages that read the file directly (the Siaya hub, profile, insights and
// others). Until they are wired, a real rejection of a history value must stop the build instead of leaking there.
const UNWIRED = { history: ['/counties/siaya/', '/profile/', '/method/', '/counties/siaya/brief/', '/data/', '/subcounties/', '/insights/', '/analytics/', '/counties/siaya/pulse/'] };
Object.entries(UNWIRED).forEach(([d, pages]) => ok(rs.counts(d).rejected === 0, `${d}: a value is rejected, but ${pages.join(', ')} still read data/${d}.json directly; wire them to lib/review-status.js masked() first`));

// ---- synthetic rejection (node scripts/test-reviews.js dist --synthetic) ----
// Picks, per dataset, values that the built site shows (elements marked data-obs="<dataset>:<id>"), enough to touch
// every page that shows that dataset; rebuilds the site into dist-synthetic/ with those values rejected in memory
// (TAKWIMU_SYNTHETIC_REJECTIONS; data/reviews.json is never written); and checks that every page, the dataset
// downloads, the published data files and history.csv withhold them, and that calculations using them are withheld.
// The report PDFs are printed from the report pages checked here.
if (dist && process.argv.includes('--synthetic')) {
  const { execFileSync } = require('child_process');
  const dir = path.resolve(dist);
  const scan = (base) => {
    const out = {}; // key -> { page -> [{ state, after }] }
    const walkHtml = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) return walkHtml(p);
      if (!e.name.endsWith('.html')) return;
      const html = fs.readFileSync(p, 'utf8');
      const rel = `/${path.relative(base, path.dirname(p)).split(path.sep).join('/')}/`.replace(/^\/\.?\//, '/');
      for (const m of html.matchAll(/<[a-z]+\b[^>]*\bdata-obs="([^"]+)"[^>]*>/g)) {
        const st = (m[0].match(/data-obs-state="([^"]+)"/) || [])[1] || '';
        ((out[m[1]] = out[m[1]] || {})[rel] = out[m[1]][rel] || []).push({ state: st, after: html.slice(m.index + m[0].length, m.index + m[0].length + 400) });
      }
    });
    walkHtml(base);
    return out;
  };
  const before = scan(dir);
  // Choose: per dataset, a greedy cover of the pages that show it, preferring values shown on many pages.
  const chosen = [];
  rs.DATASET_IDS.forEach((d) => {
    const keys = Object.keys(before).filter((k) => k.startsWith(`${d}:`) && Object.values(before[k]).flat().every((x) => x.state !== 'rejected'));
    ok(keys.length > 0, `synthetic: no page marks a value of ${d} (data-obs); its renderers are not wired to lib/review-status.js`);
    const pagesOf = (k) => Object.keys(before[k]);
    const need = new Set(keys.flatMap(pagesOf));
    const pick = [];
    while (need.size) {
      const best = keys.filter((k) => !pick.includes(k)).sort((x, y) => pagesOf(y).filter((p) => need.has(p)).length - pagesOf(x).filter((p) => need.has(p)).length || x.localeCompare(y))[0];
      if (!best || !pagesOf(best).some((p) => need.has(p))) break;
      pick.push(best);
      pagesOf(best).forEach((p) => need.delete(p));
    }
    chosen.push(...pick);
  });
  const ids = chosen.map((k) => { const i = k.indexOf(':'); return [k.slice(0, i), k.slice(i + 1)]; });
  // Calculations whose inputs include a chosen value are expected to be withheld too.
  const expected = new Set(chosen);
  rs.observations('siaya-analysis').forEach((o) => { if ((o.inputs || []).some((x) => expected.has(`${x.dataset}:${x.id}`))) expected.add(`siaya-analysis:${o.id}`); });
  const out = 'dist-synthetic';
  const outDir = path.join(root, out);
  const env = { ...process.env, TAKWIMU_SYNTHETIC_REJECTIONS: JSON.stringify(ids.map(([d, id]) => `${d}|${id}`)), TAKWIMU_DIST: out, NEXT_TELEMETRY_DISABLED: '1' };
  // next build rewrites tsconfig.json for a new distDir and .next/BUILD_ID: both are restored afterwards.
  const keep = ['tsconfig.json', 'next-env.d.ts', '.next/BUILD_ID'].map((f) => [f, fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f)) : null]);
  try {
    fs.rmSync(outDir, { recursive: true, force: true });
    execFileSync('node', ['scripts/build-data.js'], { cwd: root, env, stdio: 'ignore' });
    try { execFileSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], { cwd: root, env, stdio: 'pipe', maxBuffer: 64 << 20 }); } catch (e) {
      throw new Error(`synthetic build failed (a renderer cannot cope with a withheld value):\n${String(e.stdout || '').split('\n').filter((l) => /rror|at |Export/.test(l)).slice(0, 25).join('\n')}\n${String(e.stderr || '').slice(-3000)}`);
    }
    const after = scan(outDir);
    // 1. Every element of a value expected withheld says so; no other value is withheld; no page lost a marker.
    Object.entries(before).forEach(([k, pages]) => Object.entries(pages).forEach(([pg, els]) => {
      const now = (after[k] || {})[pg] || [];
      ok(now.length === els.length, `synthetic: ${pg} showed ${k} ${els.length} times, now ${now.length}`);
      now.forEach((x) => {
        if (expected.has(k)) ok(x.state === 'rejected' && x.after.includes('Withdrawn after editorial review'), `synthetic: ${pg} still shows ${k} after it was rejected`);
        else ok(x.state !== 'rejected', `synthetic: ${pg} withholds ${k}, which was not rejected`);
      });
    }));
    ok(chosen.every((k) => Object.keys((after[k] || {})).length > 0), 'synthetic: a rejected value vanished from the page instead of being shown as withdrawn');
    // 2. Published data files: the value fields are emptied and editorial_review lists the rejection.
    ids.forEach(([d, id]) => {
      const f = path.join(outDir, 'data', `${d}.json`);
      if (!fs.existsSync(f)) return;
      const pub = JSON.parse(fs.readFileSync(f, 'utf8'));
      ok(pub.editorial_review && pub.editorial_review.values[id] && pub.editorial_review.values[id].state === 'REJECTED', `synthetic: /data/${d}.json does not list ${id} as rejected`);
      const item = rs.refsOf(d, pub).find((x) => x.id === id);
      ok(Boolean(item), `synthetic: /data/${d}.json has no record ${id}`);
      if (item && item.ref) Object.keys(item.ref[1]).forEach((fk) => { const v = item.ref[0][fk]; ok(v === null || v === undefined || (Array.isArray(v) && !v.length), `synthetic: /data/${d}.json ${id}.${fk} still holds the rejected value`); });
    });
    // 3. Dataset downloads: rows marked withdrawn carry no value, and every rejected dataset has such rows.
    const dlDir = path.join(outDir, 'data', 'datasets');
    const VALUE_COLS = ['value', 'result', 'amounts', 'amounts_as_printed', 'original_text', 'value_as_printed', 'raw_reading'];
    const withdrawnIn = {};
    fs.readdirSync(dlDir).filter((f) => f.endsWith('.json') && f !== 'catalogue.json').forEach((f) => {
      const rows = JSON.parse(fs.readFileSync(path.join(dlDir, f), 'utf8')).rows || [];
      const csv = fs.existsSync(path.join(dlDir, f.replace(/\.json$/, '.csv'))) ? fs.readFileSync(path.join(dlDir, f.replace(/\.json$/, '.csv')), 'utf8') : '';
      rows.filter((r) => /^Withdrawn after editorial review/.test(r.review_status || '') || /withdrawn after editorial review/.test(r.status || '')).forEach((r) => {
        withdrawnIn[f] = (withdrawnIn[f] || 0) + 1;
        VALUE_COLS.forEach((c) => { if (c in r) ok(r[c] === null || r[c] === '' || (Array.isArray(r[c]) && !r[c].length), `synthetic: download ${f} row withdrawn but ${c} = ${JSON.stringify(r[c]).slice(0, 40)}`); });
      });
      if (withdrawnIn[f]) ok(/review_status/.test(csv.split('\n')[0]), `synthetic: ${f.replace(/\.json$/, '.csv')} has no review_status column`);
    });
    const DL = { 'siaya-fiscal-ledger': 'siaya-fiscal-ledger', 'siaya-audits': 'siaya-audit-findings', 'siaya-economy': 'siaya-economy', 'siaya-governance': 'siaya-governance', 'siaya-health': 'siaya-health', 'siaya-education': 'siaya-education', 'siaya-agriculture': 'siaya-agriculture', 'siaya-climate': 'siaya-climate', 'siaya-analysis': 'siaya-analysis', 'siaya-projects': 'siaya-projects', 'siaya-programmes': 'siaya-programmes' };
    ids.forEach(([d, id]) => {
      if (!DL[d] || (d === 'siaya-audits' && id.startsWith('opinion:'))) return;
      ok(Boolean(withdrawnIn[`${DL[d]}.json`]), `synthetic: download ${DL[d]} has no withdrawn row for ${d} ${id}`);
    });
    // 4. history.csv says withdrawn and has no value for a rejected history value.
    const hcsv = fs.readFileSync(path.join(outDir, 'data', 'history.csv'), 'utf8').split('\n');
    ok(/review_status/.test(hcsv[0]), 'synthetic: history.csv has no review_status column');
    if (ids.some(([d]) => d === 'history')) ok(hcsv.some((l) => /"Withdrawn after editorial review/.test(l)), 'synthetic: history.csv does not mark the rejected history value');
    hcsv.filter((l) => /"Withdrawn after editorial review/.test(l)).forEach((l) => ok(/^"[^"]*","[^"]*",(""|,)/.test(l) || /^"[^"]*","[^"]*",,/.test(l), `synthetic: history.csv row withdrawn but holds a value: ${l.slice(0, 80)}`));
    console.log(`test-reviews --synthetic: ${chosen.length} values rejected in memory across ${new Set(ids.map(([d]) => d)).size} datasets (${expected.size - chosen.length} calculations withheld with them); every page, download and data file checked in ${out}/`);
  } finally {
    keep.forEach(([f, buf]) => { if (buf === null) fs.rmSync(path.join(root, f), { force: true }); else fs.writeFileSync(path.join(root, f), buf); });
    fs.rmSync(outDir, { recursive: true, force: true });
    execFileSync('node', ['scripts/build-data.js'], { cwd: root, stdio: 'ignore' }); // public/data back to the real register
  }
}
// The synthetic rationale must never reach the real build.
if (dist) {
  const walkAll = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkAll(path.join(d, e.name)) : /\.(html|json|csv|txt)$/.test(e.name) ? [path.join(d, e.name)] : []));
  ok(!walkAll(path.resolve(dist)).some((f) => fs.readFileSync(f, 'utf8').includes(rs.SYNTHETIC_RATIONALE)), `${dist}: contains the synthetic test rejection`);
}

if (errors.length) {
  console.error(`test-reviews: ${errors.length} problem(s)`);
  errors.slice(0, 50).forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
const n = rs.DATASET_IDS.reduce((s, d) => s + rs.observations(d).length, 0);
console.log(`test-reviews: OK (${checks} checks; ${data.decisions.length} review records; ${n.toLocaleString('en-US')} observations in ${rs.DATASET_IDS.length} datasets${dist ? `; built pages checked in ${dist}` : ''})`);
