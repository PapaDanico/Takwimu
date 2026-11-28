#!/usr/bin/env node
// Mechanical source and data census (work order WO01, owner handover 28 Nov 2026). Read-only: it writes only the two
// report files below and changes no data. Not part of the build. Deterministic: the same inputs give the same bytes
// (no clocks, sorted keys, inputs identified by their SHA-256).
//   Values are enumerated with lib/review-status.js (Siaya and the national files it itemises) and lib/county-registry.js
//   with lib/county-review.js (counties other than Siaya). Metadata are read the way lib/review-pack.js reads them.
//   Counts claimed in README.md "Status" and .claude/CLAUDE.md are compared with the actual counts.
//   The source registers (data/source-library.json, data/source-manifest.json, the Kisumu register and its downloads.tsv,
//   the gap files) are reconciled with each other.
// Run: node scripts/census.js [--dist dist]
//   Writes docs/research/kisumu-handover-2026-11-28/census.json and census.md.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CWD = process.cwd();
process.chdir(ROOT); // some lib modules read files relative to the working directory
const OUT = path.join(ROOT, 'docs', 'research', 'kisumu-handover-2026-11-28');
const argDist = process.argv.indexOf('--dist');
const DIST = argDist > 0 ? path.resolve(CWD, process.argv[argDist + 1]) : null;

const rs = require('../lib/review-status');
const rp = require('../lib/review-pack');
const reg = require('../lib/county-registry');
const cr = require('../lib/county-review');
const { COUNTIES, bySlug } = require('../lib/counties');

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const readJ = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const sortObj = (o) => (Array.isArray(o) ? o.map(sortObj) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortObj(o[k])])) : o);
const inc = (m, k, n = 1) => { m[k] = (m[k] || 0) + n; };
const blank = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
const notStated = (v) => typeof v === 'string' && /^not stated/i.test(v.trim());
const byStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const KREG = 'docs/research/kisumu-2026-11-27/kisumu-sources.json';
const KDL = 'docs/research/kisumu-2026-11-27/downloads.tsv';
const KCOV = 'docs/research/kisumu-2026-11-27/kisumu-coverage.md';
const GAPS = 'docs/research/gaps-2026-11-27';
const INPUTS = [];

// ---------------------------------------------------------------- source tiers
// The six tiers of the handover. A tier is taken, in this order, from: (1) the observation (source_type / tier fields),
// (2) the source record (Kisumu register "tier", ledger source "kind", programme atlas grade A-D), (3) a rule on the
// source's publisher, title and address (TIER_RULES), reported separately as "inferred". Anything else: "unclassified".
const TIERS = ['primary', 'official mirror', 'official compilation', 'secondary-ngo', 'secondary-news', 'academic', 'unclassified'];
function tierOfLabel(t) {
  const s = String(t || '').toLowerCase().trim();
  if (!s) return null;
  if (/^official mirror/.test(s)) return 'official mirror';
  if (/^official compilation|official secondary|official statistics \/ official secondary/.test(s)) return 'official compilation';
  if (/^secondary-news\/ngo$/.test(s)) return 'secondary-ngo';
  if (/civil-society|^secondary-ngo/.test(s)) return 'secondary-ngo';
  if (/^media|secondary-news/.test(s)) return 'secondary-news';
  if (/^academic/.test(s)) return 'academic';
  if (/^primary|^official statistics|^official claim/.test(s)) return 'primary';
  // Programme atlas grade (app/reports/method/page.js): A county document; B research publication; C funder or registry
  // record; D news item.
  if (s === 'a') return 'primary';
  if (s === 'b') return 'academic';
  if (s === 'c') return 'secondary-ngo';
  if (s === 'd') return 'secondary-news';
  if (s === 'secondary') return null; // too coarse to place: falls through to the source record or the rule
  return null;
}
const KIND_TIER = { controller_of_budget: 'primary', auditor_general: 'primary', county: 'primary', senate_quoting_auditor_general: 'official mirror' };
const TIER_RULES = [
  ['official mirror', /repository\.kippra\.or\.ke.*|kippra.*(county|cbrop|cfsp|adp|cidp|budget)/i, (d) => /kippra/i.test(`${d.url} ${d.id}`) && /county/i.test(d.title || '') && !/policy brief|discussion paper|working paper/i.test(d.title || '')],
  ['academic', /journal|universit|doi\.org|thesis|academ/i],
  ['secondary-news', /nation\.africa|standardmedia|the-star|citizen\.digital|news|kenyans\.co\.ke/i],
  ['secondary-ngo', /international budget partnership|internationalbudget\.org|\bibp\b|khrc|national taxpayers|chambua|institute of public finance|iea kenya|transparency|\bngo\b|civil society|iati|world bank projects/i],
  ['official compilation', /aprm|peer review mechanism|fact sheet|economic survey|statistical abstract|world bank|\bwdi\b|\bimf\b|world economic outlook|kippra|parliamentary budget office|commission on revenue allocation|county profile|dhis|compendium/i],
  ['primary', /controller of budget|cob-report|auditor[- ]general|\baudit\b|oag|county government|county treasury|county assembly|siaya\.go\.ke|kisumu\.go\.ke|knbs|national bureau of statistics|demographic and health|dhsprogram|kdhs|national treasury|senate|national assembly|parliament|ministry|census|\.go\.ke|council|regulatory board|wasreb|syndemic|aids control/i],
];
function inferTier(d) {
  const text = [d.id, d.title, d.publisher, d.kind, d.document_type, d.url].filter(Boolean).join(' ');
  for (const [tier, re, fn] of TIER_RULES) if (fn ? fn(d) : re.test(text)) return tier;
  return null;
}

// ---------------------------------------------------------------- source documents (all registers)
const LIB = readJ('data/source-library.json');
const MAN = readJ('data/source-manifest.json');
const KR = readJ(KREG);
INPUTS.push('data/source-library.json', 'data/source-manifest.json', KREG);
const KR_BY = { id: {}, sha: {}, url: {} };
KR.sources.forEach((s) => {
  KR_BY.id[s.id.toLowerCase()] = s;
  if (s.sha256) (KR_BY.sha[s.sha256] = KR_BY.sha[s.sha256] || []).push(s);
  [s.url, s.landing].filter(Boolean).forEach((u) => { (KR_BY.url[u] = KR_BY.url[u] || []).push(s); });
});
// Extra per-source facts from the data files (kind, tier, publisher) keyed by source id.
const SRCX = {};
const addX = (id, o) => { if (!id) return; const e = SRCX[id] || (SRCX[id] = {}); Object.entries(o).forEach(([k, v]) => { if (!blank(v) && blank(e[k])) e[k] = v; }); };
MAN.documents.forEach((d) => addX(d.id, { title: d.title, kind: d.kind, url: d.file_url || d.url, sha256: d.sha256 }));
LIB.documents.forEach((d) => addX(d.document_id, { title: d.title, publisher: d.publisher, document_type: d.document_type, url: d.source_url, sha256: d.sha256, publication_date: d.publication_date }));
Object.entries(readJ('data/siaya-fiscal-ledger.json').sources).forEach(([id, s]) => addX(id, { title: s.title, publisher: s.publisher, kind: s.kind, url: s.url, sha256: s.sha256, publication_date: s.publication_date }));
readJ('data/siaya-programmes.json').sources.forEach((s) => addX(s.id, { title: s.title, publisher: s.publisher, tier: s.tier, url: s.url, sha256: s.sha256 }));
// Every dataset's own source list (publisher, title, address), so the tier rule can read them.
rs.DATASET_IDS.forEach((ds) => {
  const d = readJ(`data/${ds}.json`);
  [...(Array.isArray(d.sources) ? d.sources : []), ...(Array.isArray(d.documents) ? d.documents : [])].forEach((s) => {
    const o = { title: s.title, publisher: s.publisher || s.issuer, document_type: s.document_type || s.kind, url: s.url || s.source_url, sha256: s.sha256, publication_date: s.publication_date || s.published || s.report_date };
    [s.id, s.source_id, s.document_id, s.doc_id, s.vintage].filter(Boolean).forEach((id) => addX(id, o));
  });
});
reg.slugs().filter((s) => s !== 'siaya').forEach((slug) => Object.entries(cr.sources(slug)).forEach(([id, s]) => addX(id, { title: s.title, url: s.url, sha256: s.sha256, publication_date: s.publication_date })));
reg.slugs().filter((s) => reg.has(s, 'ledger') && s !== 'siaya').forEach((slug) => Object.entries(reg.load(slug, 'ledger').sources).forEach(([id, s]) => addX(id, { kind: s.kind, publisher: s.publisher })));

function sourceTier(id) {
  const x = SRCX[id] || {};
  const k = KR_BY.id[String(id).toLowerCase()] || (x.sha256 && (KR_BY.sha[x.sha256] || [])[0]) || (x.url && (KR_BY.url[x.url] || [])[0]);
  if (k && tierOfLabel(k.tier)) return { tier: tierOfLabel(k.tier), basis: 'recorded (Kisumu register)' };
  if (x.tier && tierOfLabel(x.tier)) return { tier: tierOfLabel(x.tier), basis: 'recorded (source record)' };
  if (x.kind && KIND_TIER[x.kind]) return { tier: KIND_TIER[x.kind], basis: 'recorded (source kind)' };
  const d = rp.doc(id);
  const t = inferTier({ id, title: x.title || d.title, publisher: x.publisher, kind: x.kind, document_type: x.document_type, url: x.url || d.url });
  return t ? { tier: t, basis: 'inferred (TIER_RULES)' } : { tier: 'unclassified', basis: 'none' };
}
const docKnown = (dataset, id) => {
  if (!id) return false;
  if (dataset && rs.sourceHash(dataset, id)) return true;
  const d = rp.doc(id);
  return Boolean(SRCX[id] || d.url || d.sha256 || (d.title && d.title !== id));
};

// ---------------------------------------------------------------- per-value metadata
const H = readJ('data/history.json');
const SA = readJ('data/siaya-audits.json');
const SA_DOC = Object.fromEntries(SA.documents.map((d) => [d.doc_id, d]));
const first = (o, keys) => { for (const k of keys) if (o && !blank(o[k])) return o[k]; return null; };
const REASON_KEYS = ['null_reason', 'reason', 'status', 'note', 'gap', 'value_note', 'basis', 'page_note', 'caveat', 'why'];

// One normalised row per value: { dataset, id, kind, period, unit, page, sources[], confidence, tiers, value, nullReason }.
function siayaRow(dataset, item, packed) {
  const [o = {}, repl = {}] = item.ref || [];
  const p = packed || {};
  const out = { dataset, id: item.id, kind: item.kind, sources: item.sources.map((s) => String(s).replace(/\s*\(.*\)\s*$/, '').trim()) };
  out.period = p.period ?? (o.fy ? `FY ${o.fy}` : first(o, ['period', 'year', 'edition']));
  if (dataset === 'counties-cob' && blank(out.period)) out.period = `FY ${item.id.split(':')[0]}`;
  if (out.period && typeof out.period === 'object') out.period = out.period.start || out.period.end ? `${out.period.start || '?'} to ${out.period.end || '?'}` : (out.period.as_printed || null);
  out.unit = p.unit ?? first(o, ['unit']);
  out.page = first(p, ['pdf_page', 'printed_page']) ?? first(o, ['pdf_page', 'page', 'page_pdf', 'printed_page']);
  let conf = first(o, ['confidence']);
  let confBasis = conf !== null ? 'record' : null;
  let obsTier = first(o, ['source_type', 'tier']);
  let value = 'value' in p ? p.value : o[Object.keys(repl)[0]];
  let reasonSrc = o;
  if (dataset === 'history' && /^years:/.test(item.id)) {
    const k = item.id.split(':')[2];
    const pv = (o.provenance || {})[k] || {};
    conf = first(pv, ['confidence']);
    confBasis = conf !== null ? 'record' : null;
    if (conf === null && H.reports && H.reports[o.fy] && !blank(H.reports[o.fy].confidence)) { conf = H.reports[o.fy].confidence; confBasis = 'inherited (report)'; }
    obsTier = pv.source_type || null;
    value = o[k];
    reasonSrc = { ...pv, caveat: o.caveat };
  }
  if (dataset === 'siaya-audits' && conf === null && SA_DOC[o.doc_id] && !blank(SA_DOC[o.doc_id].confidence)) { conf = SA_DOC[o.doc_id].confidence; confBasis = 'inherited (audit document)'; }
  if (dataset === 'history' && /^(osr|in_year):/.test(item.id) && conf === null) {
    const per = /^in_year:/.test(item.id) ? (H.in_year.periods.find((x) => x.id === item.id.split(':')[1]) || {}) : {};
    if (!blank(per.confidence)) { conf = per.confidence; confBasis = 'inherited (in-year report)'; }
  }
  out.confidence = conf;
  out.confidence_basis = confBasis;
  out.obs_tier = tierOfLabel(obsTier);
  out.value = typeof value === 'function' ? null : value;
  out.null_reason = blank(out.value) && !Array.isArray(out.value) ? first(reasonSrc, REASON_KEYS) : null;
  out.state = rs.stateOf(dataset, item.id).state;
  out.hashes = out.sources.map((s) => rs.sourceHash(dataset, s) || rp.doc(s).sha256 || (SRCX[s] || {}).sha256 || null);
  out.pub = out.sources.map((s) => rp.doc(s).publication_date || (SRCX[s] || {}).publication_date || null);
  out.known = out.sources.map((s) => docKnown(dataset, s));
  return out;
}
function countyRow(slug, e) {
  const kind = /fiscal-ledger$/.test(e.dataset) ? 'ledger' : /audits$/.test(e.dataset) ? 'audits' : 'population';
  const D = reg.load(slug, kind);
  const o = kind === 'ledger' ? D.observations.find((x) => x.id === e.id) : kind === 'audits' ? D.opinions.find((x) => `opinion:${x.entity}:${x.fy}` === e.id) : D.points.find((x) => x.id === e.id);
  const src = cr.sources(slug);
  return {
    dataset: e.dataset, id: e.id, kind: e.kind, sources: e.sources, period: e.period, unit: e.unit, page: first(e, ['pdf_page', 'printed_page']),
    confidence: first(o, ['confidence']), confidence_basis: blank((o || {}).confidence) ? null : 'record', obs_tier: tierOfLabel(first(o, ['source_type', 'tier'])),
    value: e.value, null_reason: blank(e.value) ? first(o, REASON_KEYS) : null, state: e.state_code,
    hashes: e.sources.map((s) => (src[s] || {}).sha256 || rp.doc(s).sha256 || null), pub: e.sources.map((s) => (src[s] || {}).publication_date || rp.doc(s).publication_date || null),
    known: e.sources.map((s) => Boolean(src[s]) || docKnown(null, s)),
  };
}

const yearOf = (p) => { const m = String(p || '').match(/(19|20)\d{2}/); return m ? Number(m[0]) : null; };
function summarise(rows) {
  const s = {
    observations: rows.length, kinds: {}, first_period: null, last_period: null, periods_unparsed: 0,
    by_tier: Object.fromEntries(TIERS.map((t) => [t, 0])), tier_basis: {},
    by_state: { provisional: 0, approved: 0, rejected: 0, disputed: 0, superseded: 0 },
    missing: { source: 0, source_unresolved: 0, publication_date: 0, publication_date_not_stated: 0, period: 0, unit: 0, confidence: 0, page: 0 },
    missing_any: 0, missing_any_counting_not_stated: 0, confidence_inherited: 0,
    distinct_source_ids: 0, distinct_source_hashes: 0, cited_sources_without_hash: 0,
    nulls_with_reason: 0, nulls_without_reason: 0,
  };
  const ids = new Set(); const hashes = new Set(); const noHash = new Set();
  let lo = null; let hi = null;
  rows.forEach((r) => {
    inc(s.kinds, r.kind || 'unspecified');
    const y = yearOf(r.period);
    if (y === null) s.periods_unparsed += 1;
    else {
      if (!lo || y < lo.y || (y === lo.y && byStr(String(r.period), lo.p) < 0)) lo = { y, p: String(r.period) };
      if (!hi || y > hi.y || (y === hi.y && byStr(String(r.period), hi.p) > 0)) hi = { y, p: String(r.period) };
    }
    // Tier: the observation's own, else the first cited source's.
    let t = r.obs_tier ? { tier: r.obs_tier, basis: 'recorded (observation)' } : (r.sources[0] ? sourceTier(r.sources[0]) : { tier: 'unclassified', basis: 'no source' });
    inc(s.by_tier, t.tier); inc(s.tier_basis, t.basis);
    // Review state: "provisional" is every value with no record in force (the data file's own disputes included, as in
    // lib/review-status.js counts()); disputed is shown beside it and overlaps.
    if (r.state === 'APPROVED') s.by_state.approved += 1;
    else if (r.state === 'REJECTED') s.by_state.rejected += 1;
    else if (r.state === 'SUPERSEDED') s.by_state.superseded += 1;
    else s.by_state.provisional += 1;
    if (r.state === 'DISPUTED') s.by_state.disputed += 1;
    const m = {
      source: r.sources.length === 0,
      source_unresolved: r.sources.length > 0 && r.known.some((k) => !k),
      publication_date: r.sources.length === 0 || r.pub.every((p) => blank(p)),
      publication_date_not_stated: r.pub.length > 0 && r.pub.every((p) => blank(p) || notStated(p)) && r.pub.some((p) => notStated(p)),
      period: blank(r.period), unit: blank(r.unit), confidence: blank(r.confidence), page: blank(r.page),
    };
    Object.entries(m).forEach(([k, v]) => { if (v) s.missing[k] += 1; });
    if (m.source || m.publication_date || m.period || m.unit || m.confidence || m.page) s.missing_any += 1;
    if (m.source || m.publication_date || m.publication_date_not_stated || m.period || m.unit || m.confidence || m.page) s.missing_any_counting_not_stated += 1;
    if (r.confidence_basis && r.confidence_basis !== 'record') s.confidence_inherited += 1;
    r.sources.forEach((id, i) => { ids.add(id); if (r.hashes[i]) hashes.add(r.hashes[i]); else noHash.add(id); });
    if (blank(r.value) && !Array.isArray(r.value)) { if (r.null_reason) s.nulls_with_reason += 1; else s.nulls_without_reason += 1; }
  });
  s.first_period = lo ? lo.p : null; s.last_period = hi ? hi.p : null;
  s.distinct_source_ids = ids.size; s.distinct_source_hashes = hashes.size; s.cited_sources_without_hash = noHash.size;
  s._hashes = [...hashes].sort(); s._noHash = [...noHash].sort();
  return s;
}

// ---------------------------------------------------------------- enumerate
const packed = {}; rp.all().forEach((e) => { packed[`${e.dataset}|${e.id}`] = e; });
const ROWS = {};
rs.DATASET_IDS.forEach((ds) => { ROWS[ds] = rs.observations(ds).map((i) => siayaRow(ds, i, packed[`${ds}|${i.id}`])); });
reg.NOT_YET_ON_PAGES.forEach((slug) => cr.entries(slug).forEach((e) => { (ROWS[e.dataset] = ROWS[e.dataset] || []).push(countyRow(slug, e)); }));
const DS_FILE = {};
rs.DATASET_IDS.forEach((ds) => { DS_FILE[ds] = `data/${ds}.json`; });
reg.NOT_YET_ON_PAGES.forEach((slug) => ['ledger', 'audits', 'population'].filter((k) => reg.has(slug, k)).forEach((k) => { DS_FILE[cr.datasetName(slug, k)] = reg.file(slug, k); }));

const FILES = [
  ...fs.readdirSync(path.join(ROOT, 'data')).filter((f) => f.endsWith('.json')).map((f) => `data/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'data', 'counties')).sort().flatMap((d) => fs.readdirSync(path.join(ROOT, 'data', 'counties', d)).filter((f) => f.endsWith('.json')).sort().map((f) => `data/counties/${d}/${f}`)),
].sort();
INPUTS.push(...FILES);

function genericYears(o, acc = new Set(), key = '') {
  if (Array.isArray(o)) o.forEach((x) => genericYears(x, acc, key));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (/^(19|20)\d{2}$/.test(k)) acc.add(Number(k)); genericYears(v, acc, k); });
  else if (/^(fy|year|period|calendar_year|fiscal_year|edition|date)$/.test(key) && o !== null) { const y = yearOf(o); if (y && y >= 1990 && y <= 2035) acc.add(y); }
  return acc;
}
const FILE_TO_DS = Object.fromEntries(Object.entries(DS_FILE).map(([d, f]) => [f, d]));
const datasets = FILES.map((f) => {
  const d = readJ(f);
  const ds = FILE_TO_DS[f];
  const title = (d.meta && d.meta.title) || d.title || null;
  if (ds) {
    const s = summarise(ROWS[ds]);
    const inPack = ROWS[ds].filter((r) => packed[`${ds}|${r.id}`]).length;
    return { file: f, dataset: ds, type: `observations (${/^kisumu-/.test(ds) ? 'lib/county-registry.js + lib/county-review.js' : 'lib/review-status.js'})`, title, siaya_review_pack_scope: /^kisumu-/.test(ds) ? null : inPack, ...s };
  }
  const stem = f.replace(/^data\//, '').replace(/\.json$/, '');
  const arrays = Object.fromEntries(Object.entries(d).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]));
  const ys = [...genericYears(d)].sort((a, b) => a - b);
  let type = 'support file (not itemised by lib/review-status.js or lib/county-registry.js)';
  if (rs.NOT_ITEMISED[stem]) type = `not itemised: ${rs.NOT_ITEMISED[stem]}`;
  else if (/conflicts\.json$/.test(f)) type = 'conflict register';
  else if (/machine-checks\.json$/.test(f)) type = 'machine cross-check results';
  else if (/review-packs\.json$/.test(f)) type = 'review packs (preparation, not review)';
  else if (/reviews\.json$/.test(f)) type = 'review decision register';
  else if (/source-(library|manifest)\.json$/.test(f)) type = 'source register';
  return { file: f, dataset: null, type, title, observations: null, top_level_arrays: arrays, years_in_fields: ys.length ? `${ys[0]}-${ys[ys.length - 1]}` : null };
});

// ---------------------------------------------------------------- totals
const siayaScope = rp.all();
const sumBy = (rows) => summarise(rows);
const siayaRows = siayaScope.map((e) => ROWS[e.dataset].find((r) => r.id === e.id));
const kisumuRows = Object.keys(ROWS).filter((d) => /^kisumu-/.test(d)).flatMap((d) => ROWS[d]);
const allRows = Object.values(ROWS).flat();
const strip = (s) => { const { _hashes, _noHash, ...rest } = s; return rest; };
const totals = { siaya_review_scope: strip(sumBy(siayaRows)), kisumu: strip(sumBy(kisumuRows)), all_itemised: strip(sumBy(allRows)) };

// ---------------------------------------------------------------- machine checks: disagreements
function disagreements(file, rowsOf) {
  const M = readJ(file);
  INPUTS.push(file);
  const t = {}; M.checks.forEach((c) => inc(t, c.result));
  const list = M.checks.filter((c) => c.result === 'disagree').map((c) => {
    const e = rowsOf(c.dataset, c.id) || {};
    return { dataset: c.dataset, id: c.id, value: e.value ?? null, unit: e.unit ?? null, source_id: c.source_id, pdf_page: c.pdf_page, printed_page: e.printed_page ?? null,
      first_reading: { method: c.original_method || e.read || null, as_printed: e.printed_text || null },
      second_reading: { method: c.method, result: c.result, matched: c.matched ?? null, reason: c.reason } };
  }).sort((a, b) => byStr(`${a.dataset}|${a.id}`, `${b.dataset}|${b.id}`));
  return { file, meta_counts: M.meta && M.meta.counts ? M.meta.counts : null, actual_counts: t, checks: M.checks.length, disagreements: list };
}
const kEntries = {}; reg.NOT_YET_ON_PAGES.forEach((slug) => cr.entries(slug).forEach((e) => { kEntries[`${e.dataset}|${e.id}`] = e; }));
const machine = {
  siaya: disagreements('data/machine-checks.json', (d, id) => packed[`${d}|${id}`]),
  ...Object.fromEntries(reg.NOT_YET_ON_PAGES.map((slug) => [slug, disagreements(reg.COUNTY_DATA[slug].review.machine_checks, (d, id) => kEntries[`${d}|${id}`])])),
};

// ---------------------------------------------------------------- claims
const ed = require('../lib/editorial');
const cn = require('../lib/correction-notes');
const explore = require('../lib/explore');
const conflicts = readJ('data/conflicts.json');
const ledger = readJ('data/siaya-fiscal-ledger.json');
const classes = readJ('data/ledger-classes.json');
const cob = readJ('data/counties-cob.json');
const cpi = readJ('data/cpi.json');
const reviews = readJ('data/reviews.json');
const reportsReg = JSON.parse(fs.readFileSync(path.join(ROOT, 'components', 'report', 'reports.json'), 'utf8'));
const packs = readJ('data/review-packs.json');
const classCount = {}; classes.cases.forEach((c) => inc(classCount, c.class || c.classification));
const ledgerStatus = {}; ledger.discrepancies.forEach((d) => inc(ledgerStatus, d.status));
const notes = cn.correctionNotes();
const cat = explore.catalogue();
const kis = {};
reg.NOT_YET_ON_PAGES.forEach((slug) => { kis[slug] = { counts: cr.counts(slug), by_dataset: {} }; cr.entries(slug).forEach((e) => inc(kis[slug].by_dataset, e.dataset)); });
const kc = reg.has('kisumu', 'conflicts') ? reg.load('kisumu', 'conflicts').conflicts.length : null;
const y1920 = H.years.find((y) => y.fy === '2019/20') || {};
const y1920vals = Object.entries(y1920).filter(([k, v]) => typeof v === 'number').map(([k]) => k).sort();
const distPages = DIST && fs.existsSync(DIST) ? (function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [1] : [])); })(DIST).length : null;
const packSet = new Set(packs.entries.map((e) => `${e.dataset}|${e.record_id}`));
const siayaKeys = siayaScope.map((e) => `${e.dataset}|${e.id}`);
const sources448 = KR.sources.length;
const covText = fs.readFileSync(path.join(ROOT, KCOV), 'utf8');
INPUTS.push(KCOV, 'README.md', '.claude/CLAUDE.md', 'data/conflicts.json', 'data/ledger-classes.json', 'data/corrections.json', 'data/review-packs.json', 'components/report/reports.json');

const C = (where, claim, actual, match, how) => ({ where, claim, actual, match: Boolean(match), how });
const sc = totals.siaya_review_scope;
const claims = [
  C('README Status', 'Counties: 1 of 47 published (Siaya)', `${COUNTIES.filter((c) => c.published).length} of ${COUNTIES.length} published (${COUNTIES.filter((c) => c.published).map((c) => c.name).join(', ')})`, COUNTIES.length === 47 && COUNTIES.filter((c) => c.published).length === 1, 'lib/counties.js'),
  C('README Status', 'Siaya values: 4,005', String(siayaScope.length), siayaScope.length === 4005, 'lib/review-pack.js all() over lib/review-status.js'),
  C('README Status', 'across 16 datasets', String(new Set(siayaScope.map((e) => e.dataset)).size), new Set(siayaScope.map((e) => e.dataset)).size === 16, 'distinct datasets in the review-pack scope'),
  C('README Status', 'each with a review pack', `${siayaKeys.filter((k) => packSet.has(k)).length} of ${siayaKeys.length} in data/review-packs.json (file holds ${packs.entries.length})`, siayaKeys.every((k) => packSet.has(k)) && packSet.size === siayaKeys.length, 'data/review-packs.json entries'),
  C('README Status', '0 approved; data/reviews.json is empty', `${sc.by_state.approved} approved; ${reviews.decisions.length} records`, sc.by_state.approved === 0 && reviews.decisions.length === 0, 'lib/review-status.js stateOf'),
  C('README Status', 'Machine cross-checks: 2,363 agree, 80 disagree, 1,562 not checkable', `${machine.siaya.actual_counts.agree} agree, ${machine.siaya.actual_counts.disagree} disagree, ${machine.siaya.actual_counts['not checkable']} not checkable (${machine.siaya.checks} checks)`, machine.siaya.actual_counts.agree === 2363 && machine.siaya.actual_counts.disagree === 80 && machine.siaya.actual_counts['not checkable'] === 1562, 'data/machine-checks.json checks[].result'),
  C('README Status', 'Fiscal ledger: 164 discrepancy cases', String(ledger.discrepancies.length), ledger.discrepancies.length === 164, 'data/siaya-fiscal-ledger.json discrepancies'),
  C('README Status', '47 definitional, 22 period or version, 15 probable source error, 2 resolved by source, 78 open', `${classCount.definitional || 0} definitional, ${classCount['period or version'] || 0} period or version, ${classCount['probable source error'] || 0} probable source error, ${classCount['resolved by source'] || 0} resolved by source, ${classCount.open || 0} open (data/ledger-classes.json); the ledger file itself marks ${JSON.stringify(ledgerStatus)}`, classCount.definitional === 47 && classCount['period or version'] === 22 && classCount['probable source error'] === 15 && classCount['resolved by source'] === 2 && classCount.open === 78, 'data/ledger-classes.json cases[].class'),
  C('README Status', 'Conflict register: 53 cases', String(conflicts.conflicts.length), conflicts.conflicts.length === 53, 'data/conflicts.json'),
  C('README Status', 'Ten-year series FY 2013/14 to FY 2025/26', `${H.years[0].fy} to ${H.years[H.years.length - 1].fy} (${H.years.length} years)`, H.years[0].fy === '2013/14' && H.years[H.years.length - 1].fy === '2025/26', 'data/history.json years'),
  C('README Status', 'FY 2019/20 stays a gap (CoB report not found)', `FY 2019/20 row holds numeric fields: ${y1920vals.join(', ') || 'none'}`, true, 'data/history.json years[fy=2019/20] (informational: the gap is the CoB value; other fields may be filled from other sources)'),
  C('README Status', '17 corrections footnoted beside 26 values', `${new Set(notes.map((n) => n.id)).size} corrections, ${new Set(notes.map((n) => n.ref)).size} values`, new Set(notes.map((n) => n.id)).size === 17 && new Set(notes.map((n) => n.ref)).size === 26, 'lib/correction-notes.js'),
  C('README Status', '14 source-error records', String(ed.sourceErrors().length), ed.sourceErrors().length === 14, 'lib/editorial.js sourceErrors()'),
  C('README Status', 'Kisumu: 331 values', String(kis.kisumu ? kis.kisumu.counts.total : 0), kis.kisumu && kis.kisumu.counts.total === 331, 'lib/county-review.js entries'),
  C('README Status', '291 ledger, 35 audit opinions, population (5)', JSON.stringify(kis.kisumu ? kis.kisumu.by_dataset : {}), kis.kisumu && kis.kisumu.by_dataset['kisumu-fiscal-ledger'] === 291 && kis.kisumu.by_dataset['kisumu-audits'] === 35 && kis.kisumu.by_dataset['kisumu-population'] === 5, 'lib/county-review.js entries by dataset'),
  C('README Status', 'Kisumu: 38 conflict cases', String(kc), kc === 38, 'data/counties/kisumu/conflicts.json'),
  C('README Status', 'Kisumu: 0 approved', String(kis.kisumu ? kis.kisumu.counts.approved : null), kis.kisumu && kis.kisumu.counts.approved === 0, 'lib/county-review.js counts'),
  C('README Status', 'Site: 110 pages', distPages === null ? 'not counted (run with --dist dist)' : String(distPages), distPages === 110, '.html files under dist/'),
  C('README Status', '92 downloadable datasets', `${cat.length} datasets in the catalogue; ${cat.filter((d) => d.files.csv).length} downloadable (CSV/JSON)`, cat.length === 92 && cat.filter((d) => d.files.csv).length === 92, 'lib/explore.js catalogue()'),
  C('README Status', '5 draft reports', String(reportsReg.reports.length), reportsReg.reports.length === 5, 'components/report/reports.json'),
  C('CLAUDE.md', 'lib/counties.js lists 47 counties; only Siaya is published', `${COUNTIES.length} listed; published: ${COUNTIES.filter((c) => c.published).map((c) => c.slug).join(', ')}`, COUNTIES.length === 47 && COUNTIES.filter((c) => c.published).length === 1 && bySlug('siaya').published, 'lib/counties.js'),
  C('CLAUDE.md', 'data/counties-cob.json: 47 counties, FY 2023/24-2024/25', `${[...new Set(cob.years.map((y) => y.counties.length))].join('/')} counties; FYs ${cob.years.map((y) => y.fy).sort().join(', ')}`, cob.years.every((y) => y.counties.length === 47) && cob.years.map((y) => y.fy).sort().join(',') === '2023/24,2024/25', 'data/counties-cob.json years'),
  C('CLAUDE.md', 'Series must go back 10 years: data/history.json plus data/cpi.json', `history ${H.years.length} FYs (${H.years[0].fy}-${H.years[H.years.length - 1].fy}); cpi ${Object.keys(cpi.calendar_year).length} calendar years, ${Object.keys(cpi.fiscal_year).length} fiscal years`, H.years.length >= 10 && Object.keys(cpi.fiscal_year).length >= 10, 'data/history.json, data/cpi.json'),
  C('CLAUDE.md', 'Kisumu (042) phase 1 data is in, unpublished', `registry code ${reg.COUNTY_DATA.kisumu.code}; NOT_YET_ON_PAGES = ${reg.NOT_YET_ON_PAGES.join(', ')}`, reg.COUNTY_DATA.kisumu.code === 42 && reg.NOT_YET_ON_PAGES.includes('kisumu'), 'lib/county-registry.js'),
  C('kisumu-coverage.md / handover', 'kisumu-sources.json (448 records)', `${sources448} records (meta.counts.total ${KR.meta.counts.total})`, sources448 === 448, KREG),
];

// ---------------------------------------------------------------- source reconciliation
const tsv = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('\t'));
const DL = tsv(KDL).map(([id, http, type, bytes, sha256, pages, words, url]) => ({ id, http: Number(http), type, bytes: Number(bytes), sha256, pages, url }));
INPUTS.push(KDL);
const gapFiles = fs.readdirSync(path.join(ROOT, GAPS)).filter((f) => f.endsWith('.tsv')).sort();
const GAPROWS = gapFiles.flatMap((g) => { INPUTS.push(`${GAPS}/${g}`); return tsv(`${GAPS}/${g}`).filter((r) => /^[0-9a-f]{64}$/.test(r[2] || '')).map((r) => ({ gap_file: g, file: r[0], bytes: Number(r[1]), sha256: r[2], url: r[3] || null })); });

const allSha = {};
const addSha = (h, where) => { if (h) (allSha[h] = allSha[h] || []).push(where); };
LIB.documents.forEach((d) => addSha(d.sha256, `source-library:${d.document_id}`));
MAN.documents.forEach((d) => addSha(d.sha256, `source-manifest:${d.id}`));
KR.sources.forEach((s) => addSha(s.sha256, `kisumu-sources:${s.id}`));
DL.filter((d) => d.http === 200).forEach((d) => addSha(d.sha256, `downloads.tsv:${d.id}`));
GAPROWS.forEach((g) => addSha(g.sha256, `${g.gap_file}:${g.file}`));

const normStatus = (s) => { const t = String(s || '').toLowerCase(); return /^held/.test(t) ? 'held' : /^link-only/.test(t) ? 'link-only' : /^manual/.test(t) ? 'manual-download' : /^missing/.test(t) ? 'missing' : /^failed/.test(t) ? 'failed' : 'other'; };
const dlById = {}; DL.forEach((d) => { (dlById[d.id.toLowerCase()] = dlById[d.id.toLowerCase()] || []).push(d); });
const dlByUrl = {}; DL.forEach((d) => { (dlByUrl[d.url] = dlByUrl[d.url] || []).push(d); });
const isPdfOk = (d) => d.http === 200 && /PDF|Zip|Microsoft|OOXML|Word|Excel/i.test(d.type);
// Current status of each Kisumu register record, from the register and the download log (the last good download wins).
const current = KR.sources.map((s) => {
  const dls = [...(dlById[s.id.toLowerCase()] || []), ...((dlByUrl[s.url] || []).filter((d) => d.id.toLowerCase() !== s.id.toLowerCase()))];
  const good = dls.filter(isPdfOk);
  const inGap = s.sha256 && GAPROWS.some((g) => g.sha256 === s.sha256);
  const reg0 = normStatus(s.status);
  let now = reg0;
  if (reg0 !== 'held' && good.length) now = 'held (per downloads.tsv)';
  if (reg0 === 'held' && !s.sha256 && !good.length && !/repo|reuse|source-manifest/.test(s.status)) now = 'held, no file hash recorded';
  if (reg0 === 'failed' && !good.length) now = 'failed';
  const shaMismatch = good.length && s.sha256 && !good.some((d) => d.sha256 === s.sha256) && dlById[s.id.toLowerCase()];
  return { id: s.id, register_status: s.status, register: reg0, current: now, sha256: s.sha256 || null, downloads: dls.map((d) => `${d.id} ${d.http} ${d.sha256.slice(0, 12)}`), in_gap_file: Boolean(inGap), sha_differs_from_download: Boolean(shaMismatch) };
});
const statusTable = {}; current.forEach((c) => { const k = `${c.register} -> ${c.current}`; inc(statusTable, k); });

const regIdsLower = new Set(KR.sources.map((s) => s.id.toLowerCase()));
const regSha = new Set(KR.sources.map((s) => s.sha256).filter(Boolean));
const recon = {
  counts: { source_library: LIB.documents.length, source_manifest: MAN.documents.length, kisumu_register: KR.sources.length, kisumu_register_meta_total: KR.meta.counts.total, downloads_tsv_rows: DL.length, downloads_tsv_http200: DL.filter((d) => d.http === 200).length, gap_file_rows_with_hash: GAPROWS.length },
  records_with_no_file: {
    source_library_downloaded_without_hash: LIB.documents.filter((d) => d.retrieval_status === 'downloaded' && !d.sha256).map((d) => d.document_id).sort(),
    source_manifest_downloaded_without_hash: MAN.documents.filter((d) => /^downloaded/.test(d.access) && !d.sha256).map((d) => d.id).sort(),
    kisumu_held_without_hash_or_download: current.filter((c) => c.current === 'held, no file hash recorded').map((c) => c.id).sort(),
    kisumu_held_with_hash_but_no_downloads_row: KR.sources.filter((s) => normStatus(s.status) === 'held' && s.sha256 && !(dlById[s.id.toLowerCase()] || []).length && !(dlByUrl[s.url] || []).length && !/repo|reuse|source-manifest/.test(s.status)).map((s) => s.id).sort(),
  },
  files_with_no_record: {
    downloads_rows_not_in_register: DL.filter((d) => !regIdsLower.has(d.id.toLowerCase()) && !regSha.has(d.sha256) && !KR.sources.some((s) => s.url === d.url)).map((d) => `${d.id} (HTTP ${d.http}, ${d.sha256.slice(0, 12)})`).sort(),
    downloads_rows_matched_only_by_url_or_hash: DL.filter((d) => !regIdsLower.has(d.id.toLowerCase()) && (regSha.has(d.sha256) || KR.sources.some((s) => s.url === d.url))).map((d) => d.id).sort(),
    gap_files_not_in_any_register: GAPROWS.filter((g) => !LIB.documents.some((d) => d.sha256 === g.sha256) && !MAN.documents.some((d) => d.sha256 === g.sha256) && !regSha.has(g.sha256)).map((g) => `${g.gap_file}:${g.file}`).sort(),
  },
  duplicate_hashes: {
    within_source_library: Object.entries(allSha).filter(([, w]) => w.filter((x) => x.startsWith('source-library:')).length > 1).map(([h, w]) => ({ sha256: h, ids: w.filter((x) => x.startsWith('source-library:')) })),
    within_source_manifest: Object.entries(allSha).filter(([, w]) => w.filter((x) => x.startsWith('source-manifest:')).length > 1).map(([h, w]) => ({ sha256: h, ids: w.filter((x) => x.startsWith('source-manifest:')) })),
    within_kisumu_register: Object.entries(allSha).filter(([, w]) => w.filter((x) => x.startsWith('kisumu-sources:')).length > 1).map(([h, w]) => ({ sha256: h, ids: w.filter((x) => x.startsWith('kisumu-sources:')) })),
    across_registers_different_ids: Object.entries(allSha).filter(([, w]) => { const reg2 = w.filter((x) => /^(source-library|source-manifest|kisumu-sources):/.test(x)); return new Set(reg2.map((x) => x.split(':')[0])).size > 1 && new Set(reg2.map((x) => x.split(':').slice(1).join(':').toLowerCase())).size > 1; }).length,
  },
  sha_differs_between_register_and_downloads: current.filter((c) => c.sha_differs_from_download).map((c) => ({ id: c.id, register: c.sha256, downloads: c.downloads })),
  status_table: statusTable,
  status_changed_since_register: current.filter((c) => c.current !== c.register).map((c) => ({ id: c.id, register_status: c.register_status, current: c.current, downloads: c.downloads })),
  cited_hashes_not_in_manifest: null,
};
// Hashes cited by values but held in no register (source-manifest is the build's list of cited PDFs).
const manSha = new Set(MAN.documents.map((d) => d.sha256).filter(Boolean));
const libSha = new Set(LIB.documents.map((d) => d.sha256).filter(Boolean));
const cited = {}; allRows.forEach((r) => r.sources.forEach((id, i) => { if (r.hashes[i]) cited[r.hashes[i]] = cited[r.hashes[i]] || new Set(); if (r.hashes[i]) cited[r.hashes[i]].add(`${r.dataset.replace(/^(siaya|kisumu)-/, '$1-')}:${id}`); }));
recon.cited_hashes_not_in_manifest = {
  cited_distinct_hashes: Object.keys(cited).length,
  in_manifest: Object.keys(cited).filter((h) => manSha.has(h)).length,
  in_library_only: Object.keys(cited).filter((h) => !manSha.has(h) && libSha.has(h)).length,
  in_kisumu_register_only: Object.keys(cited).filter((h) => !manSha.has(h) && !libSha.has(h) && regSha.has(h)).length,
  in_neither: Object.keys(cited).filter((h) => !manSha.has(h) && !libSha.has(h) && !regSha.has(h)).sort().map((h) => ({ sha256: h, cited_as: [...cited[h]].sort() })),
};
// Mislabelled CBROPs: a CBROP published in year Y reviews FY (Y-1)/Y. The title year is compared with the FY the record says it reviews.
const mislabel = [];
KR.sources.filter((s) => /budget\s+review\s+and\s+outlook|\bcbrop\b/i.test(s.title)).forEach((s) => {
  const t = (s.title.match(/(?:paper|cbrop)\s*(20\d{2})(?!\s*\/)/i) || [])[1];
  const fy = (String(s.period).match(/reviews FY ?(20\d{2})\/\d{2}/i) || [])[1];
  if (t && fy && Number(fy) !== Number(t) - 1) mislabel.push({ register: 'kisumu-sources', id: s.id, title: s.title, title_year: Number(t), reviews_fy: `${fy}/${String(Number(fy) + 1).slice(2)}`, expected_title_year: Number(fy) + 1 });
});
// Siaya: CBROP-titled documents and the fiscal years of the values that cite them.
const cbropFy = {};
allRows.filter((r) => !/^kisumu-/.test(r.dataset)).forEach((r) => r.sources.forEach((id) => { const d = rp.doc(id); if (/budget\s+review\s+and\s+outlook|\bcbrop\b/i.test(`${d.title} ${id}`)) { const y = (String(r.period).match(/FY (20\d{2})\/\d{2}/) || [])[1]; if (y) { cbropFy[id] = cbropFy[id] || { title: d.title, fys: {} }; inc(cbropFy[id].fys, `${y}/${String(Number(y) + 1).slice(2)}`); } } }));
Object.entries(cbropFy).sort(([a], [b]) => byStr(a, b)).forEach(([id, v]) => {
  const t = (String(v.title).match(/(?:paper|cbrop)\s*(20\d{2})(?!\s*\/)/i) || [])[1];
  const top = Object.entries(v.fys).sort((a, b) => b[1] - a[1] || byStr(b[0], a[0]))[0][0];
  if (t && Number(top.slice(0, 4)) !== Number(t) - 1) mislabel.push({ register: 'siaya values', id, title: v.title, title_year: Number(t), most_cited_fy: top, fys_cited: v.fys });
});
recon.mislabelled = mislabel;
// Stale notes in kisumu-coverage.md: every URL in its tables and gap list, against the register and the download log now.
const covUrls = [...new Set((covText.match(/https?:\/\/[^\s|)]+/g) || []).map((u) => u.replace(/[.,]$/, '')))].sort();
recon.coverage_md = {
  register_count_stated: (covText.match(/\((\d+) records\)/) || [])[1] ? Number(covText.match(/\((\d+) records\)/)[1]) : null,
  register_count_actual: KR.sources.length,
  says_not_in_repo: /Nothing here is in the repo/.test(covText),
  urls: covUrls.map((u) => {
    const recs = KR.sources.filter((s) => s.url === u || s.landing === u);
    const dls = dlByUrl[u] || [];
    return { url: u, register: recs.map((s) => `${s.id}: ${s.status}`), downloads: dls.map((d) => `${d.id} HTTP ${d.http} ${/PDF/.test(d.type) ? 'PDF' : d.type.split(',')[0]}`), good_download: dls.some(isPdfOk), register_says_held: recs.some((s) => normStatus(s.status) === 'held') };
  }),
};

// ---------------------------------------------------------------- write
const inputHashes = Object.fromEntries([...new Set(INPUTS)].sort().map((f) => [f, sha(f)]));
const census = sortObj({
  title: 'Takwimu source and data census (WO01)',
  generated_by: 'scripts/census.js',
  rule: 'Mechanical counts from the data files as held, enumerated with lib/review-status.js and lib/county-registry.js. No value was changed. Tiers marked "inferred" come from TIER_RULES in scripts/census.js, not from a recorded field.',
  inputs: inputHashes,
  datasets,
  totals,
  claims,
  machine_checks: machine,
  sources: recon,
});
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'census.json'), `${JSON.stringify(census, null, 1)}\n`);

// census.md: generated tables only.
const md = [];
const row = (cells) => `| ${cells.map((c) => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`;
md.push('# Source and data census (WO01)', '', 'Generated by `node scripts/census.js --dist dist` from the files as held; do not edit by hand. Full detail, including every list, is in `census.json`. Base commit and the engineering findings E03-E05 are in the WO01 handover report, not in this generated file.', '');
md.push('Rules: "provisional" is every value with no review record in force (values the data file itself marks as disputed are included and also counted under "disputed"). Source tier: the observation\'s own field, else the cited source\'s recorded tier, else a rule on publisher, title and address (`TIER_RULES` in `scripts/census.js`; counted under "inferred" in the basis column). Missing metadata counts a value once per field; "pub. date" is missing when no cited source records a date, and "not stated" (the document prints none) is shown separately. Nulls count values that are null (not empty lists).', '');
md.push('## 1. Totals', '');
md.push(row(['Scope', 'Values', 'Provisional', 'Approved', 'Rejected', 'Disputed', 'Missing any metadata', 'Distinct source hashes', 'Nulls with reason', 'Nulls without reason']), row(Array(10).fill('---')));
[['Siaya review scope (16 datasets)', totals.siaya_review_scope], ['Kisumu (unpublished)', totals.kisumu], ['All itemised values', totals.all_itemised]].forEach(([n, t]) => md.push(row([n, t.observations, t.by_state.provisional, t.by_state.approved, t.by_state.rejected, t.by_state.disputed, t.missing_any, t.distinct_source_hashes, t.nulls_with_reason, t.nulls_without_reason])));
md.push('', '## 2. Datasets', '');
md.push(row(['File', 'Dataset', 'Type', 'First period', 'Last period', 'Values', ...TIERS, 'Tier basis', 'Prov.', 'Appr.', 'Rej.', 'Disp.', 'No source', 'Source unresolved', 'No pub. date', 'Pub. date "not stated"', 'No period', 'No unit', 'No confidence', 'No page', 'Missing any', 'Source ids', 'Source hashes', 'Nulls w/ reason', 'Nulls w/o reason']), row(Array(37).fill('---')));
datasets.filter((d) => d.dataset).forEach((d) => md.push(row([d.file, d.dataset, d.type.replace(/^observations /, ''), d.first_period, d.last_period, d.observations, ...TIERS.map((t) => d.by_tier[t]), Object.entries(d.tier_basis).sort().map(([k, v]) => `${k} ${v}`).join('; '), d.by_state.provisional, d.by_state.approved, d.by_state.rejected, d.by_state.disputed, d.missing.source, d.missing.source_unresolved, d.missing.publication_date, d.missing.publication_date_not_stated, d.missing.period, d.missing.unit, d.missing.confidence, d.missing.page, d.missing_any, d.distinct_source_ids, d.distinct_source_hashes, d.nulls_with_reason, d.nulls_without_reason])));
md.push('', 'Files that hold no itemised values (not enumerated by either library, so outside the review system):', '');
md.push(row(['File', 'Type', 'Years in fy/year/period fields', 'Top-level arrays']), row(Array(4).fill('---')));
datasets.filter((d) => !d.dataset).forEach((d) => md.push(row([d.file, d.type, d.years_in_fields, Object.entries(d.top_level_arrays).map(([k, v]) => `${k} ${v}`).join(', ')])));
md.push('', '## 3. Claims in README.md "Status" and .claude/CLAUDE.md against the actual counts', '');
md.push(row(['Where', 'Claim', 'Actual', 'Match', 'Counted with']), row(Array(5).fill('---')));
claims.forEach((c) => md.push(row([c.where, c.claim, c.actual, c.match ? 'yes' : '**NO**', c.how])));
md.push('', '## 4. Source registers', '');
md.push(row(['Register', 'Records']), row(['---', '---']));
Object.entries(recon.counts).forEach(([k, v]) => md.push(row([k, v])));
md.push('', '### 4.1 Records with no file', '');
Object.entries(recon.records_with_no_file).forEach(([k, v]) => md.push(`- ${k}: ${v.length}${v.length ? ` (${v.join(', ')})` : ''}`));
md.push('', '### 4.2 Files with no record', '');
Object.entries(recon.files_with_no_record).forEach(([k, v]) => md.push(`- ${k}: ${v.length}${v.length ? ` (${v.join(', ')})` : ''}`));
md.push('', '### 4.3 Duplicate hashes', '');
['within_source_library', 'within_source_manifest', 'within_kisumu_register'].forEach((k) => { md.push(`- ${k}: ${recon.duplicate_hashes[k].length}`); recon.duplicate_hashes[k].forEach((x) => md.push(`  - ${x.sha256.slice(0, 16)}: ${x.ids.map((i) => i.split(':').slice(1).join(':')).join(', ')}`)); });
md.push(`- the same file held under different ids in different registers: ${recon.duplicate_hashes.across_registers_different_ids} hashes (listed in census.json only by hash count)`);
md.push(`- register hash differs from the downloaded file's hash: ${recon.sha_differs_between_register_and_downloads.length}${recon.sha_differs_between_register_and_downloads.length ? ` (${recon.sha_differs_between_register_and_downloads.map((x) => x.id).join(', ')})` : ''}`);
md.push('', '### 4.4 Hashes cited by values', '');
const ch = recon.cited_hashes_not_in_manifest;
md.push(`${ch.cited_distinct_hashes} distinct document hashes are cited by values: ${ch.in_manifest} in data/source-manifest.json, ${ch.in_library_only} only in data/source-library.json, ${ch.in_kisumu_register_only} only in the Kisumu register, ${ch.in_neither.length} in none of the three:`, '');
ch.in_neither.forEach((x) => md.push(`- ${x.sha256.slice(0, 16)}: ${x.cited_as.join(', ')}`));
md.push('', '### 4.5 Mislabelled CBROP records (title year against the fiscal year reviewed)', '');
md.push(row(['Register', 'Id', 'Title', 'Title year', 'Reviews / most cited FY', 'Expected title year']), row(Array(6).fill('---')));
mislabel.forEach((m) => md.push(row([m.register, m.id, m.title, m.title_year, m.reviews_fy || m.most_cited_fy, m.expected_title_year || Number(String(m.most_cited_fy).slice(0, 4)) + 1])));
md.push('', '### 4.6 Current status of the Kisumu register (generated from the register and downloads.tsv)', '');
md.push(row(['Register status -> current', 'Records']), row(['---', '---']));
Object.entries(statusTable).sort().forEach(([k, v]) => md.push(row([k, v])));
md.push('', 'Records whose status has changed since the register line was written:', '');
md.push(row(['Id', 'Register status', 'Current', 'Download log']), row(Array(4).fill('---')));
recon.status_changed_since_register.forEach((c) => md.push(row([c.id, c.register_status, c.current, c.downloads.join('; ')])));
md.push('', '### 4.7 kisumu-coverage.md against the register now', '');
md.push(`- Register size stated: ${recon.coverage_md.register_count_stated}; actual: ${recon.coverage_md.register_count_actual}.`);
md.push(`- Says "Nothing here is in the repo": ${recon.coverage_md.says_not_in_repo ? 'yes (the file and the Kisumu data layer are now in the repo)' : 'no'}.`);
md.push('', row(['URL named in kisumu-coverage.md', 'Register records', 'Download log', 'Good download now']), row(Array(4).fill('---')));
recon.coverage_md.urls.forEach((u) => md.push(row([u.url, u.register.join('; '), u.downloads.join('; '), u.good_download ? 'yes' : 'no'])));
md.push('', '## 5. Machine cross-check disagreements', '');
Object.entries(machine).forEach(([k, m]) => {
  md.push(`### ${k}`, '', `${m.file}: ${m.checks} checks; ${Object.entries(m.actual_counts).sort().map(([a, b]) => `${a} ${b}`).join(', ')}.`, '');
  md.push(row(['Dataset', 'Id', 'Value', 'Unit', 'Source', 'PDF page', 'First reading (method; as printed)', 'Second reading (method; result)']), row(Array(8).fill('---')));
  m.disagreements.forEach((d) => md.push(row([d.dataset, d.id, typeof d.value === 'object' ? JSON.stringify(d.value) : d.value, d.unit, d.source_id, d.pdf_page, `${d.first_reading.method}; ${d.first_reading.as_printed || '(not recorded)'}`, `${d.second_reading.method}; ${d.second_reading.reason}`])));
  md.push('');
});
md.push('## Inputs (SHA-256)', '');
Object.entries(inputHashes).forEach(([f, h]) => md.push(`- ${f}: ${h}`));
fs.writeFileSync(path.join(OUT, 'census.md'), `${md.join('\n')}\n`);
console.log(`census: ${allRows.length} values in ${Object.keys(ROWS).length} datasets; ${claims.filter((c) => !c.match).length} of ${claims.length} claims differ; wrote ${rel(path.join(OUT, 'census.json'))} and census.md`);
