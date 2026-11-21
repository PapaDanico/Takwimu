#!/usr/bin/env node
// Checks data/siaya-health.json (Siaya health indicators by source, vintage and geography):
// schema; every value has source, page, period, geography and age group; sentinel-site values are flagged and never
// labelled county; secondary reports name (or say they cannot name) the original; no measure is recorded twice for one
// period, source and geography; conflicts point at real values; values that data/history.json takes from the same
// source match. Run: node scripts/test-health.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-health.json');
const schema = read('schemas/siaya-health.schema.json');
const history = read('data/history.json');
const errors = [];
let checks = 0;
const ok = (cond, m) => { checks += 1; if (!cond) errors.push(m); };

// ---- schema (same subset as scripts/validate-data.js) ----
function checkSchema(s, value, where, out) {
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (s.enum && !s.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${s.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${where}: ${value} is below minimum ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${where}: ${value} is above maximum ${s.maximum}`);
  }
  if (typeof value === 'string' && s.pattern && !new RegExp(s.pattern).test(value)) out.push(`${where}: "${value}" does not match ${s.pattern}`);
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems) out.push(`${where}: needs at least ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => checkSchema(s.items, v, `${where}[${i}]`, out));
  }
  if (kind(value) === 'object') {
    (s.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = s.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') checkSchema(s.additionalProperties, v, `${where}.${k}`, out);
    });
  }
}
const schemaErrors = [];
checkSchema(schema, data, 'siaya-health', schemaErrors);
schemaErrors.forEach((m) => errors.push(`schema ${m}`));
checks += 1;

const sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
const obs = data.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

ok(Object.keys(sources).length === data.sources.length, 'duplicate source id');
ok(new Set(obs.map((o) => o.id)).size === obs.length, 'duplicate observation id');
data.sources.forEach((s) => {
  ok(s.access_status === 'downloaded' ? Boolean(s.sha256 && s.bytes) : s.sha256 === null, `${s.id}: hash must be present exactly when the file was downloaded`);
  ok(s.file_type === 'PDF' ? Number.isInteger(s.pdf_pages) : s.pdf_pages === null, `${s.id}: pdf_pages must be set for PDFs only`);
});

// ---- every value: source + page + period + geography + age group ----
obs.forEach((o) => {
  const s = sources[o.source_id];
  ok(Boolean(s), `${o.id}: unknown source ${o.source_id}`);
  if (!s) return;
  ok(typeof o.value === 'number' && Number.isFinite(o.value), `${o.id}: value must be a number (gaps go in gaps[], never 0 or null)`);
  ok(filled(o.table), `${o.id}: table/section missing`);
  if (s.file_type === 'PDF') {
    ok(Number.isInteger(o.pdf_page) && o.pdf_page >= 1 && o.pdf_page <= s.pdf_pages, `${o.id}: pdf_page outside ${s.id} (1-${s.pdf_pages})`);
    ok(o.printed_page === null || (Number.isInteger(o.printed_page) && o.printed_page <= o.pdf_page), `${o.id}: printed_page after pdf_page`);
  } else {
    ok(o.pdf_page === null && filled(o.page_note), `${o.id}: a web source needs pdf_page null and a page_note saying where on the page`);
  }
  ok(filled(o.period), `${o.id}: period missing`);
  ok(filled(o.geography) && filled(o.geography_detail), `${o.id}: geography missing`);
  ok(filled(o.age_group), `${o.id}: age group missing (write "not stated" when the source omits it)`);
  ok(filled(o.population) && filled(o.method) && filled(o.unit) && filled(o.vintage), `${o.id}: population, method, unit or vintage missing`);
  ok(o.confidence >= 4 || filled(o.note) || filled(o.original_source), `${o.id}: confidence below 4 needs a note or a named original source`);
  ok(o.geography !== 'sub-county' || !/county$/i.test(o.geography_detail), `${o.id}: sub-county value labelled with a county name`);
});

// ---- sentinel sites are flagged and never county-representative ----
const sentinelSource = (s) => /sentinel|HDSS|PBIDS|KEMRI/i.test(`${s.kind} ${s.title}`);
obs.forEach((o) => {
  const s = sources[o.source_id];
  if (!s) return;
  const flagged = o.sentinel_site === true;
  ok(flagged === (o.geography === 'sentinel-site') && flagged === (o.status === 'sentinel-site'), `${o.id}: sentinel_site, geography and status disagree`);
  ok(!sentinelSource(s) || flagged, `${o.id}: value from sentinel-site source ${s.id} is not flagged as sentinel-site`);
  ok(!flagged || /not representative/i.test(o.note || ''), `${o.id}: sentinel-site value must say it is not representative of the county`);
});

// ---- secondary reports ----
obs.forEach((o) => {
  const s = sources[o.source_id];
  if (!s) return;
  if (/^secondary report/.test(s.kind)) ok(o.status === 'secondary report', `${o.id}: value from ${s.id} (${s.kind}) must be status "secondary report"`);
  if (o.status === 'secondary report') ok(filled(o.original_source), `${o.id}: secondary report must name the original source or say it is not traceable`);
  if (/^secondary report/.test(s.kind) && /not named|not traceable|not obtained/i.test(o.original_source || '')) ok(o.confidence <= 2, `${o.id}: untraced secondary figure with confidence above 2`);
  if (s.access_status === 'inaccessible') ok(o.confidence === 1, `${o.id}: value from an inaccessible source must have confidence 1`);
});

// ---- no duplicate measure-period-source (within one geography and sex) ----
const keyOf = (o) => [o.measure, o.period, o.source_id, o.geography_detail, o.sex].join('|');
const seen = new Map();
obs.forEach((o) => {
  const k = keyOf(o);
  ok(!seen.has(k), `${o.id}: same measure, period and source as ${seen.get(k)}`);
  seen.set(k, o.id);
});

// ---- conflicts point at real values of the named measure; multi-source measures are listed ----
data.conflicts.forEach((c) => c.observation_ids.forEach((id) => {
  ok(Boolean(byId[id]), `conflict ${c.measure}: unknown observation ${id}`);
  if (byId[id]) ok(byId[id].measure === c.measure, `conflict ${c.measure}: ${id} is measure ${byId[id].measure}`);
}));
const countyMeasures = {};
obs.filter((o) => o.geography === 'county').forEach((o) => {
  (countyMeasures[`${o.measure}|${o.period}`] = countyMeasures[`${o.measure}|${o.period}`] || []).push(o);
});
Object.entries(countyMeasures).forEach(([k, list]) => {
  const values = new Set(list.map((o) => o.value));
  if (values.size < 2) return;
  const listed = data.conflicts.some((c) => list.every((o) => c.observation_ids.includes(o.id)));
  ok(listed, `${k}: different values from ${list.map((o) => o.source_id).join(', ')} are not recorded side by side in conflicts[]`);
});

// ---- data/history.json health series: same source, same value ----
const h = history.health;
const urlToSource = Object.fromEntries(data.sources.map((s) => [s.url, s.id]));
const refs = {};
obs.filter((o) => o.history_ref).forEach((o) => {
  ok(!refs[o.history_ref], `${o.history_ref}: claimed by ${refs[o.history_ref]} and ${o.id}`);
  refs[o.history_ref] = o.id;
  const [kind, a, b] = o.history_ref.split(':');
  if (kind === 'indicator') {
    const ind = h.indicators.find((i) => i.id === a);
    ok(Boolean(ind), `${o.id}: history.json has no health indicator ${a}`);
    if (!ind) return;
    ok(ind[`v${b}`] === o.value, `${o.id}: history.json ${a} ${b} is ${ind[`v${b}`]}, this file has ${o.value}`);
    ok(ind.unit === o.unit, `${o.id}: unit differs from history.json (${ind.unit})`);
    const cited = ind.sources.map((u) => urlToSource[u]);
    ok(cited.includes(o.source_id), `${o.id}: history.json ${a} does not cite ${o.source_id}`);
  } else {
    const pt = h.hiv.points.find((p) => p.year === Number(a));
    ok(Boolean(pt), `${o.id}: history.json has no HIV point for ${a}`);
    if (!pt) return;
    ok(pt.value === o.value, `${o.id}: history.json HIV ${a} is ${pt.value}, this file has ${o.value}`);
    if (pt.url) ok(urlToSource[pt.url] === o.source_id, `${o.id}: history.json HIV ${a} cites ${pt.url}, not ${o.source_id}`);
  }
});
// every history value whose cited source is held here must be matched
h.indicators.forEach((ind) => ['2014', '2022'].forEach((y) => {
  const held = ind.sources.map((u) => urlToSource[u]).filter(Boolean);
  if (held.length && ind[`v${y}`] !== undefined) ok(Boolean(refs[`indicator:${ind.id}:${y}`]), `history.json ${ind.id} ${y} cites a source held here but has no matching value`);
}));
h.hiv.points.forEach((p) => {
  if (p.url && urlToSource[p.url]) ok(Boolean(refs[`hiv:${p.year}`]), `history.json HIV ${p.year} cites ${urlToSource[p.url]} but has no matching value`);
});

// ---- aggregates only: no individual-level fields ----
const banned = /patient_id|national_id|phone|email|date_of_birth|name_of/i;
ok(!banned.test(JSON.stringify(Object.keys(Object.assign({}, ...obs)))), 'observation fields look like individual-level data');

if (errors.length) {
  errors.forEach((m) => console.error(`FAIL ${m}`));
  console.error(`test-health: ${errors.length} failure(s) in ${checks} checks`);
  process.exit(1);
}
const sentinel = obs.filter((o) => o.sentinel_site).length;
console.log(`test-health: ${checks} checks passed (${obs.length} values from ${data.sources.length} sources, ${sentinel} sentinel-site, ${data.conflicts.length} conflict sets, ${Object.keys(refs).length} matched to history.json)`);
