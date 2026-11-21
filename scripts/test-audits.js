// Checks data/siaya-audits.json: schema, citations (document, page, entity, year), amounts, recurrence links,
// no personal names or honorifics, no loaded words outside quoted report headings, and opinions against data/history.json.
// Run: node scripts/test-audits.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-audits.json');
const schema = read('schemas/siaya-audits.schema.json');
const history = read('data/history.json');
const manifest = read('data/source-manifest.json');
const errors = [];
let tests = 0;
const fail = (m) => errors.push(m);

// Minimal JSON Schema subset: type (incl. integer, type lists), required, properties, additionalProperties false,
// items, minItems, minLength, enum, minimum, maximum, pattern, local $ref.
function check(s, v, where) {
  if (s.$ref) return check(s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], schema), v, where);
  if (s.type) {
    const types = [].concat(s.type);
    const ok = types.some((t) => (t === 'integer' ? Number.isInteger(v) : t === 'null' ? v === null : t === 'array' ? Array.isArray(v)
      : t === 'object' ? v !== null && typeof v === 'object' && !Array.isArray(v) : typeof v === t));
    if (!ok) { fail(`${where}: expected ${types.join('|')}`); return; }
  }
  if (s.enum && !s.enum.includes(v)) fail(`${where}: ${JSON.stringify(v)} not in enum`);
  if (typeof v === 'number') {
    if (s.minimum !== undefined && v < s.minimum) fail(`${where}: below ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) fail(`${where}: above ${s.maximum}`);
  }
  if (typeof v === 'string') {
    if (s.pattern && !new RegExp(s.pattern).test(v)) fail(`${where}: does not match ${s.pattern}`);
    if (s.minLength && v.length < s.minLength) fail(`${where}: shorter than ${s.minLength}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems && v.length < s.minItems) fail(`${where}: fewer than ${s.minItems} items`);
    if (s.items) v.forEach((x, i) => check(s.items, x, `${where}[${i}]`));
  } else if (v && typeof v === 'object') {
    (s.required || []).forEach((k) => { if (!(k in v)) fail(`${where}: missing ${k}`); });
    Object.keys(v).forEach((k) => {
      if (s.properties && s.properties[k]) check(s.properties[k], v[k], `${where}.${k}`);
      else if (s.additionalProperties === false) fail(`${where}: unexpected property ${k}`);
    });
  }
}
tests++; check(schema, data, 'siaya-audits');

const docs = Object.fromEntries(data.documents.map((d) => [d.doc_id, d]));
const manDocs = Object.fromEntries((manifest.documents || []).map((d) => [d.id, d]));

// Documents: unique ids; hashes agree with the source manifest where the document is there.
data.documents.forEach((d) => {
  tests++;
  if (data.documents.filter((x) => x.doc_id === d.doc_id).length > 1) fail(`document ${d.doc_id}: duplicate id`);
  const m = manDocs[d.doc_id];
  if (d.in_manifest && !m) fail(`document ${d.doc_id}: in_manifest but not in data/source-manifest.json`);
  if (m && m.sha256 && m.sha256 !== d.sha256) fail(`document ${d.doc_id}: sha256 differs from source manifest`);
  if (m && m.bytes && m.bytes !== d.bytes) fail(`document ${d.doc_id}: bytes differ from source manifest`);
  if (!d.report_date && !d.date_note) fail(`document ${d.doc_id}: no report date and no reason`);
});

// Findings: source, page, entity, year agree with the document; amounts numeric with unit.
const ids = new Set();
data.findings.forEach((f) => {
  tests++;
  const d = docs[f.doc_id];
  if (ids.has(f.id)) fail(`finding ${f.id}: duplicate id`);
  ids.add(f.id);
  if (!d) { fail(`finding ${f.id}: unknown doc_id ${f.doc_id}`); return; }
  if (d.entity !== f.entity) fail(`finding ${f.id}: entity ${f.entity} differs from document ${d.entity}`);
  if (d.fy !== f.fy) fail(`finding ${f.id}: year ${f.fy} differs from document ${d.fy}`);
  if (!Number.isInteger(f.page) || f.page < 1) fail(`finding ${f.id}: no page`);
  f.amounts.forEach((a, i) => {
    if (typeof a.value !== 'number' || !Number.isFinite(a.value) || a.value <= 0) fail(`finding ${f.id} amount ${i}: not a positive number`);
    if (a.unit !== 'KSh') fail(`finding ${f.id} amount ${i}: unit ${a.unit}`);
  });
  if (f.unresolved_prior_year.flag && f.unresolved_prior_year.basis.startsWith('Not stated')) fail(`finding ${f.id}: prior-year flag without basis`);
  // A next-year flag needs a next-year report for the same entity that is in this file.
  if (f.listed_unresolved_next_year) {
    const y = Number(f.fy.slice(0, 4)) + 1;
    const next = `${y}/${String(y + 1).slice(2)}`;
    if (!data.documents.some((x) => x.entity === f.entity && x.fy === next)) fail(`finding ${f.id}: no ${next} report to list it`);
  }
});

// Same-item links: every member exists, belongs to the group, one entity, and spans at least two years.
data.same_items.forEach((g) => {
  tests++;
  const members = data.findings.filter((f) => f.same_item === g.key);
  const listed = new Set(g.finding_ids);
  if (members.length !== listed.size || members.some((f) => !listed.has(f.id))) fail(`same item ${g.key}: finding_ids do not match findings`);
  if (members.some((f) => f.entity !== g.entity)) fail(`same item ${g.key}: mixes entities`);
  const years = [...new Set(members.map((f) => f.fy))].sort();
  if (years.length < 2 || JSON.stringify(years) !== JSON.stringify(g.years)) fail(`same item ${g.key}: years wrong`);
});
data.findings.forEach((f) => { if (f.same_item && !data.same_items.some((g) => g.key === f.same_item)) fail(`finding ${f.id}: unknown same_item ${f.same_item}`); });

// Recurrence counts recompute from findings.
tests++;
const rec = {};
data.findings.forEach((f) => {
  rec[f.entity] = rec[f.entity] || {};
  rec[f.entity][f.category] = rec[f.entity][f.category] || {};
  rec[f.entity][f.category][f.fy] = (rec[f.entity][f.category][f.fy] || 0) + 1;
});
const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
if (canon(rec) !== canon(data.recurrence_by_category)) fail('recurrence_by_category does not match the findings');

// Opinions: each cites a document in this file or in the source manifest; one per entity and year;
// and the opinion type matches data/history.json where both exist.
const kind = (s) => (s ? s.toLowerCase().replace(/ (opinion|of opinion)$/, '').split(' ')[0] : null);
const hist = Object.fromEntries((history.audits.points || []).map((p) => [p.fy, p]));
const seen = new Set();
data.opinions.forEach((o) => {
  tests++;
  const key = `${o.entity} ${o.fy} ${o.doc_id}`;
  if (seen.has(key)) fail(`opinion ${key}: duplicate`);
  seen.add(key);
  if (!docs[o.doc_id] && !manDocs[o.doc_id]) fail(`opinion ${key}: unknown document`);
  if (docs[o.doc_id] && (docs[o.doc_id].entity !== o.entity || docs[o.doc_id].fy !== o.fy)) fail(`opinion ${key}: entity or year differs from document`);
  if (o.opinion === null && !o.opinion_note) fail(`opinion ${key}: no opinion and no reason`);
  const h = hist[o.fy];
  const comparable = o.entity === 'county_executive' || o.entity === 'county_government';
  if (comparable && h && o.opinion !== null) {
    if (kind(o.opinion) !== kind(h.opinion)) fail(`opinion ${key}: ${o.opinion} contradicts history.json ${h.opinion}`);
    if (o.history !== 'matches') fail(`opinion ${key}: history field should be "matches"`);
  } else if (o.history === 'matches') fail(`opinion ${key}: marked "matches" but history.json has no comparable entry`);
});
// Every history.json opinion year is covered here (no silent drop).
Object.keys(hist).forEach((fy) => {
  tests++;
  if (!data.opinions.some((o) => o.fy === fy && o.history === 'matches')) fail(`history.json opinion ${fy} not reflected`);
});

// Gaps: no year is both listed as missing and carrying findings.
data.gaps.forEach((g) => {
  tests++;
  if (g.status === 'missing' && data.findings.some((f) => f.entity === g.entity && f.fy === g.fy)) fail(`gap ${g.entity} ${g.fy}: has findings`);
});

// No honorifics or personal-name patterns; loaded words only inside quoted report headings.
const honorific = /(^|[^A-Za-z])(Hon|H\.E|Dr|Mr|Mrs|Ms|Prof|Eng|M\/s)\.?\s+[A-Z]/;
const loaded = /\b(fraud\w*|corrupt\w*|theft|thieves|stole\w*|embezzl\w*|fictitious|looted)\b/i;
const walk = (v, where, inHeading) => {
  if (typeof v === 'string') {
    if (honorific.test(v)) fail(`${where}: honorific or personal-name pattern`);
    if (!inHeading && loaded.test(v)) fail(`${where}: loaded word outside a quoted report heading`);
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`, inHeading));
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], `${where}.${k}`, inHeading || (k === 'report_heading' && v[k] && v[k].quoted === true)));
};
tests++; walk(data, 'siaya-audits', false);

if (errors.length) {
  console.error(`test-audits: ${errors.length} failure(s) in ${tests} checks`);
  errors.slice(0, 50).forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log(`test-audits: ${tests} checks passed (${data.findings.length} findings, ${data.opinions.length} opinions, ${data.documents.length} documents)`);
