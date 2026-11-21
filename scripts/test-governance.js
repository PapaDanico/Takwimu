// Checks data/siaya-governance.json: schema, citations (source id, page, edition/year), score ranges, no personal names.
// Run: node scripts/test-governance.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siaya-governance.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', 'siaya-governance.schema.json'), 'utf8'));
const errors = [];
let tests = 0;
const fail = (m) => errors.push(m);

// Minimal JSON Schema subset: type (incl. integer, type lists), required, properties, additionalProperties false,
// items, minItems, enum, minimum, maximum, pattern, local $ref, allOf.
function check(s, v, where) {
  if (s.$ref) return check(s.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], schema), v, where);
  if (s.allOf) s.allOf.forEach((x) => check(x, v, where));
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
  if (s.pattern && typeof v === 'string' && !new RegExp(s.pattern).test(v)) fail(`${where}: does not match ${s.pattern}`);
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
tests++; check(schema, data, 'siaya-governance');

// Every item and finding: source id known to this file and to the source library, page, edition and year match its source.
const lib = JSON.parse(fs.readFileSync(path.join(root, 'data', 'source-library.json'), 'utf8'));
const libDocs = Array.isArray(lib) ? lib : (lib.documents || lib.sources || []);
const sources = Object.fromEntries(data.sources.map((s) => [s.source_id, s]));
data.sources.forEach((s) => {
  tests++;
  const r = libDocs.find((d) => d.document_id === s.source_id);
  if (!r) fail(`source ${s.source_id}: not in data/source-library.json`);
  else if (r.sha256 && r.sha256 !== s.sha256) fail(`source ${s.source_id}: sha256 differs from source library`);
});
const items = [];
data.ibp_cbts.editions.forEach((e) => {
  e.items.forEach((it) => {
    items.push(it);
    tests++;
    if (it.source_id !== e.source_id || it.edition !== e.edition || it.year !== e.year) fail(`${it.id}: source/edition/year differ from its edition block ${e.edition}`);
  });
});
data.aprm.findings.forEach((f) => items.push(f));
data.ibp_cbts.conflicts.forEach((c) => c.positions.forEach((p, i) => items.push({ ...p, id: `${c.id}#${i}` })));
const ids = new Set();
items.forEach((it) => {
  tests++;
  const s = sources[it.source_id];
  if (!s) { fail(`${it.id}: unknown source_id ${it.source_id}`); return; }
  if (!it.edition || !Number.isInteger(it.year)) fail(`${it.id}: missing edition or year`);
  if (it.edition !== s.edition || it.year !== s.year) fail(`${it.id}: edition/year ${it.edition}/${it.year} differ from source ${s.source_id}`);
  if (!Number.isInteger(it.page_pdf) || it.page_pdf < 1 || it.page_pdf > s.pdf_pages) fail(`${it.id}: page_pdf ${it.page_pdf} outside 1..${s.pdf_pages}`);
  if (s.siaya_pages_pdf && !s.siaya_pages_pdf.includes(it.page_pdf)) fail(`${it.id}: page ${it.page_pdf} is not a Siaya page of ${s.source_id}`);
  if (s.printed_page_numbers && s.printed_to_pdf_offset !== undefined && /^\d+/.test(it.page_printed || '')) {
    if (parseInt(it.page_printed, 10) + s.printed_to_pdf_offset !== it.page_pdf) fail(`${it.id}: printed page ${it.page_printed} does not map to PDF page ${it.page_pdf}`);
  }
  if (!it.id.includes('#')) { if (ids.has(it.id)) fail(`duplicate id ${it.id}`); ids.add(it.id); }
  if ('value' in it && it.value === null && !it.reason) fail(`${it.id}: null value without a reason`);
});

// Scores within the survey's stated range; nulls keep their reason; counts within the number assessed.
const { min, max } = data.ibp_cbts.score_range;
const inRange = (v, lo, hi, where) => { tests++; if (v !== null && (typeof v !== 'number' || v < lo || v > hi)) fail(`${where}: ${v} outside ${lo}..${hi}`); };
data.ibp_cbts.editions.forEach((e) => e.items.forEach((it) => {
  if (it.unit === 'points out of 100' && 'value' in it) inRange(it.value, min, max, it.id);
  (it.scores || []).forEach((x) => { inRange(x.value, min, max, `${it.id}/${x.document}`); if (x.value === null && !x.reason) fail(`${it.id}/${x.document}: null without reason`); });
  (it.series || []).forEach((x) => inRange(x.value, (it.score_range || {}).min ?? min, (it.score_range || {}).max ?? max, `${it.id}/${x.survey}`));
  if (it.unit === 'documents') { inRange(it.value, 0, e.documents_assessed, it.id); if (it.of !== e.documents_assessed) fail(`${it.id}: of ${it.of} differs from documents_assessed`); }
  if (it.published) {
    tests++;
    const n = it.published.length + it.not_published.length;
    if (!/Table 1/.test(it.measure) && n !== e.documents_assessed) fail(`${it.id}: ${n} documents listed, ${e.documents_assessed} assessed`);
    const count = e.items.find((x) => x.unit === 'documents');
    if (!/Table 1/.test(it.measure) && count && it.published.length !== count.value) fail(`${it.id}: ${it.published.length} published listed, count says ${count.value}`);
  }
  (it.rounds || []).forEach((r) => { tests++; if (r.published.length !== r.published_count) fail(`${it.id}/${r.survey}: list and count differ`); });
}));
// No score is carried forward: each edition's own index must come from its own source.
tests++;
const idx = data.ibp_cbts.editions.map((e) => e.items.find((x) => x.measure === 'Transparency index'));
idx.forEach((x, i) => { if (!x) fail(`edition ${data.ibp_cbts.editions[i].edition}: no transparency index of its own`); });
const pr = data.aprm.perception_score_range;
data.aprm.findings.forEach((f) => {
  if (f.unit === pr.unit.split(' (')[0]) ['highest', 'second', 'lowest'].forEach((k) => f[k] && inRange(f[k].value, pr.min, pr.max, `${f.id}/${k}`));
});

// No personal names: honorifics and titles followed by a capitalised word, anywhere in the file.
tests++;
const text = JSON.stringify(data);
const honorific = /(?:^|[^A-Za-z])(Hon|H\.\s?E|Dr|Mr|Mrs|Ms|Prof|Eng|Rev|Gov|Sen)\.?\s+[A-Z]/g;
let m;
while ((m = honorific.exec(text))) fail(`possible personal name near "${text.slice(m.index, m.index + 30)}"`);
if (/\b(?:Governor|Senator|Speaker|Deputy Governor)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) fail('possible named office holder');

if (errors.length) { errors.forEach((e) => console.error('FAIL', e)); console.error(`${errors.length} failure(s) in ${tests} checks`); process.exit(1); }
console.log(`siaya-governance: ${tests} checks passed`);
