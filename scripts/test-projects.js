// Checks data/siaya-projects.json (Siaya development project register): schema; every project has an id, a name,
// a source document and page and a valid status; a status of completed-independently-verified rests on independent
// evidence that states completion; printed places resolve to data/siaya-geography.json or are flagged; amounts carry
// a unit and financial year; audit links match data/siaya-audits.json; no personal names or honorifics.
// Run: node scripts/test-projects.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('data/siaya-projects.json');
const schema = read('schemas/siaya-projects.schema.json');
const geo = read('data/siaya-geography.json');
const audits = read('data/siaya-audits.json');
const library = read('data/source-library.json').documents;
const manifest = read('data/source-manifest.json').documents;
const errors = [];
let tests = 0;
const fail = (m) => errors.push(m);
const test = (name, fn) => { tests += 1; const before = errors.length; fn(); if (errors.length > before) errors.splice(before, 0, `[${name}]`); };

// Minimal JSON Schema subset: type (incl. integer, null, type lists), required, properties, additionalProperties false,
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
    if (s.pattern && !new RegExp(s.pattern).test(v)) fail(`${where}: "${v.slice(0, 50)}" does not match ${s.pattern}`);
    if (s.minLength && v.length < s.minLength) fail(`${where}: shorter than ${s.minLength}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems && v.length < s.minItems) fail(`${where}: fewer than ${s.minItems} items`);
    if (s.items) v.forEach((x, i) => check(s.items, x, `${where}[${i}]`));
  } else if (v && typeof v === 'object') {
    (s.required || []).forEach((k) => { if (!(k in v)) fail(`${where}: missing ${k}`); });
    Object.entries(v).forEach(([k, x]) => {
      if (s.properties && s.properties[k]) check(s.properties[k], x, `${where}.${k}`);
      else if (s.additionalProperties === false) fail(`${where}: unexpected property ${k}`);
    });
  }
}

const docs = new Map(data.documents.map((d) => [d.doc_id, d]));
const independent = new Set(data.meta.independent_evidence_types);
const STATES = ['planned', 'tendered', 'contracted', 'active', 'delayed', 'suspended', 'completed-reported', 'completed-independently-verified', 'cancelled', 'unknown'];
const findings = new Map(audits.findings.map((f) => [f.id, f]));
const wards = new Map(geo.wards.map((w) => [w.id, w]));
const cons = new Map(geo.constituencies.map((c) => [c.id, c]));
const namesOf = (e) => [e.name, ...((e.aliases || []).map((a) => a.name))].map((n) => n.toLowerCase());
const ids = new Set(data.projects.map((p) => p.id));

test('schema', () => check(schema, data, 'siaya-projects'));

test('handover state list', () => {
  if (JSON.stringify(data.meta.status_states) !== JSON.stringify(STATES)) fail('meta.status_states must be the handover WP6 list, in order');
  if ([...independent].some((t) => !t.startsWith('audit_'))) fail('only audit evidence types are independent in this release');
});

test('documents', () => {
  if (docs.size !== data.documents.length) fail('duplicate doc_id');
  data.documents.forEach((d) => {
    const tag = `document ${d.doc_id}`;
    if (d.independent !== (d.doc_type === 'audit_report')) fail(`${tag}: only audit reports are independent`);
    if (d.in_source_library) {
      const l = library.find((x) => x.document_id === d.doc_id);
      if (!l) fail(`${tag}: marked in_source_library but not found`);
      else if (l.sha256 !== d.sha256) fail(`${tag}: sha256 differs from source-library.json`);
    }
    if (d.in_source_manifest) {
      const m = manifest.find((x) => x.id === d.doc_id);
      if (!m) fail(`${tag}: marked in_source_manifest but not found`);
      else if (m.sha256 !== d.sha256) fail(`${tag}: sha256 differs from source-manifest.json`);
    }
    if (d.doc_type === 'audit_report') {
      const a = audits.documents.find((x) => x.doc_id === d.doc_id);
      if (!a) fail(`${tag}: audit document missing from data/siaya-audits.json`);
      else if (a.sha256 !== d.sha256) fail(`${tag}: sha256 differs from data/siaya-audits.json`);
    }
    if (!d.in_source_library && !d.in_source_manifest && d.doc_type !== 'audit_report' && !(d.retrieved && d.bytes)) fail(`${tag}: an unregistered document needs retrieved and bytes`);
  });
});

test('identity, name, source and status', () => {
  const seen = new Set();
  data.projects.forEach((p, i) => {
    const tag = p.id || `project[${i}]`;
    if (!/^SIA-P-\d{3}$/.test(p.id || '')) fail(`${tag}: bad id`);
    if (seen.has(p.id)) fail(`${tag}: duplicate id`);
    seen.add(p.id);
    if (p.id !== `SIA-P-${String(i + 1).padStart(3, '0')}`) fail(`${tag}: ids must run in order without gaps (ids are stable: append new projects, never renumber)`);
    if (!p.name || p.name.trim().length < 4) fail(`${tag}: no name`);
    if (!STATES.includes(p.status)) fail(`${tag}: status ${p.status} not in the state list`);
    if (!p.evidence.length) fail(`${tag}: no evidence`);
    const refs = [...p.evidence, ...p.amounts, ...p.aliases, ...p.location.as_printed];
    refs.forEach((r) => {
      if (!docs.has(r.doc_id)) fail(`${tag}: unknown doc_id ${r.doc_id}`);
      if (!Number.isInteger(r.page) || r.page < 1) fail(`${tag}: ${r.doc_id} needs a page`);
    });
    p.evidence.forEach((e) => {
      const d = docs.get(e.doc_id);
      if (!d) return;
      if (d.doc_type === 'audit_report' ? !independent.has(e.evidence_type) : e.evidence_type !== d.doc_type) fail(`${tag}: evidence type ${e.evidence_type} does not fit ${e.doc_id} (${d.doc_type})`);
    });
    const s = p.status_source;
    const se = p.evidence.find((e) => e.doc_id === s.doc_id && e.page === s.page && e.evidence_type === s.evidence_type && e.as_at === s.as_at);
    if (!se) fail(`${tag}: status_source is not one of the project's evidence records`);
    const latest = p.evidence.map((e) => e.as_at).sort().pop();
    if (p.last_evidence_date !== latest) fail(`${tag}: last_evidence_date ${p.last_evidence_date} is not the latest evidence date ${latest}`);
    if (p.status === 'planned' && p.evidence.some((e) => e.evidence_type !== 'county_development_plan')) fail(`${tag}: planned but has evidence beyond a plan`);
    p.related_project_ids.forEach((r) => { if (!ids.has(r) || r === p.id) fail(`${tag}: bad related id ${r}`); });
  });
});

test('independent verification', () => {
  data.projects.forEach((p) => {
    p.evidence.forEach((e) => { if (e.verifies_completion && !independent.has(e.evidence_type)) fail(`${p.id}: verifies_completion on non-independent evidence ${e.doc_id}`); });
    if (p.status === 'completed-independently-verified') {
      const ok = p.evidence.some((e) => e.verifies_completion && independent.has(e.evidence_type));
      if (!ok) fail(`${p.id}: completed-independently-verified without independent evidence that states completion`);
      if (!independent.has(p.status_source.evidence_type)) fail(`${p.id}: verified status must be sourced to independent evidence`);
    }
    // A county report of completion is completed-reported, never verified; a 100% county figure that the status does not follow must be explained.
    const county100 = p.evidence.some((e) => !independent.has(e.evidence_type) && e.reported_completion_pct === 100);
    if (county100 && !p.status.startsWith('completed') && !p.conflicts.some((c) => c.field === 'status')) fail(`${p.id}: a county source reports 100% but status is ${p.status} with no status conflict recorded`);
    if (p.status === 'completed-reported' && independent.has(p.status_source.evidence_type) && !/county/i.test(p.status_note || '')) fail(`${p.id}: completed-reported from an audit must say whose completion report it rests on`);
  });
});

test('geography', () => {
  data.projects.forEach((p) => {
    const wardSet = new Set(); const conSet = new Set();
    p.location.as_printed.forEach((l) => {
      const text = l.text.toLowerCase();
      if (!l.resolved_to && !l.unresolved_reason) fail(`${p.id}: place "${l.text}" neither resolved nor flagged`);
      (l.resolved_to || []).forEach((r) => {
        if (r.ward_id) {
          const w = wards.get(r.ward_id);
          if (!w) { fail(`${p.id}: unknown ward ${r.ward_id}`); return; }
          if (!namesOf(w).some((n) => text.includes(n))) fail(`${p.id}: "${l.text}" does not contain the name of ward ${w.name}`);
          wardSet.add(w.id); conSet.add(w.parent);
        } else if (r.constituency_id) {
          const c = cons.get(r.constituency_id);
          if (!c) { fail(`${p.id}: unknown constituency ${r.constituency_id}`); return; }
          const names = namesOf(c).filter((n) => n !== 'siaya'); // "Siaya" alone is ambiguous (county, town, sub-county)
          const alego = c.id === 'alego-usonga' && /\balego\b/.test(text);
          if (!names.some((n) => text.includes(n)) && !alego) fail(`${p.id}: "${l.text}" does not contain the name of constituency ${c.name}`);
          conSet.add(c.id);
        } else fail(`${p.id}: empty resolved_to entry`);
      });
      if (/^\s*siaya\s*$|\bsiaya\s+and\b|\band\s+siaya\b/i.test(l.text) && !/can mean|ambiguous/i.test(l.unresolved_reason || '')) fail(`${p.id}: "${l.text}" must say why "Siaya" is not resolved`);
    });
    const same = (a, b) => a.length === b.size && a.every((x) => b.has(x));
    if (!same(p.location.ward_ids, wardSet)) fail(`${p.id}: ward_ids do not match the resolved places`);
    if (!same(p.location.constituency_ids, conSet)) fail(`${p.id}: constituency_ids do not match the resolved places and ward parents`);
    const flagged = p.location.as_printed.filter((l) => l.unresolved_reason);
    if (flagged.length !== p.location.unresolved.length || flagged.some((l, i) => p.location.unresolved[i].text !== l.text)) fail(`${p.id}: location.unresolved must list every flagged place`);
  });
});

test('amounts', () => {
  data.projects.forEach((p) => {
    p.amounts.forEach((a, i) => {
      const tag = `${p.id} amounts[${i}]`;
      if (!['KSh', 'KSh million'].includes(a.unit)) fail(`${tag}: unit missing or unknown`);
      if (!/^20\d{2}\/\d{2}(-20\d{2}\/\d{2})?$/.test(a.fy || '')) fail(`${tag}: financial year missing or malformed`);
      if (!(typeof a.value === 'number' && a.value > 0)) fail(`${tag}: value must be a positive number (missing values are left out, never zero)`);
      const d = docs.get(a.doc_id);
      if (d && (a.unit === 'KSh million') !== (d.doc_type === 'county_development_plan')) fail(`${tag}: KSh million is used for CIDP cost tables only`);
      if (d && d.doc_type !== 'county_development_plan' && a.value < 1000) fail(`${tag}: KSh amount below 1,000 looks like a unit slip`);
      if (d && /^20\d{2}\/\d{2}$/.test(a.fy) && d.period && !d.period.includes(a.fy) && a.kind !== 'other_payment') fail(`${tag}: fy ${a.fy} is not the period of ${a.doc_id}`);
    });
  });
});

test('audit links', () => {
  const linked = new Set();
  data.projects.forEach((p) => {
    const fromEvidence = new Set(p.evidence.map((e) => e.finding_id).filter(Boolean));
    if (p.audit_finding_ids.length !== fromEvidence.size || p.audit_finding_ids.some((f) => !fromEvidence.has(f))) fail(`${p.id}: audit_finding_ids must equal the evidence finding ids`);
    p.evidence.forEach((e) => {
      const d = docs.get(e.doc_id);
      if (d && d.doc_type === 'audit_report' && !e.finding_id && !/data\/siaya-audits\.json/.test(e.summary)) fail(`${p.id}: audit evidence on ${e.doc_id} p. ${e.page} has no finding id and does not say why`);
      if (!e.finding_id) return;
      const f = findings.get(e.finding_id);
      if (!f) { fail(`${p.id}: unknown finding ${e.finding_id}`); return; }
      linked.add(f.id);
      if (f.doc_id !== e.doc_id) fail(`${p.id}: finding ${f.id} is from ${f.doc_id}, not ${e.doc_id}`);
      if (e.page < f.page || e.page > f.page + 1) fail(`${p.id}: finding ${f.id} is on p. ${f.page}, evidence cites p. ${e.page}`);
    });
  });
  audits.findings.filter((f) => f.category === 'projects').forEach((f) => { if (!linked.has(f.id)) fail(`audit finding ${f.id} (category projects) is not linked to any project`); });
});

test('names and contractors', () => {
  const honorific = /(^|[^A-Za-z])(Hon|H\.E|Dr|Mr|Mrs|Ms|Prof|Eng|M\/s|Mzee|Gov|Sen)\.?\s+[A-Z]/;
  const walk = (v, where) => {
    if (typeof v === 'string') { if (honorific.test(v)) fail(`${where}: honorific or personal-name pattern`); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${where}.${k}`));
  };
  walk(data, 'siaya-projects');
  // Owner decision (sweep D22, 21 Nov 2026): no contractor names anywhere in repository data. A project whose audit
  // report names a contractor keeps only a reference to the document and page.
  data.projects.forEach((p) => {
    if ('contractor' in p.contract) fail(`${p.id}: contract.contractor must not exist (use contractor_reference)`);
    const r = p.contract.contractor_reference;
    if (r === undefined) fail(`${p.id}: contractor_reference missing (null when no contractor is named)`);
    if (r && !(docs.has(r.doc) && Number.isInteger(r.page) && /withheld pending review/.test(r.note))) fail(`${p.id}: contractor_reference needs doc, page and the withheld note`);
  });
  const COMPANY = /\b[A-Z][A-Za-z&]+(?: (?:[A-Z][A-Za-z&]+|and|of|&))* (?:Limited|Ltd\.?|PLC|Company|Corporation)\b/;
  ['siaya-projects.json', 'siaya-audits.json'].forEach((f) => {
    const m = fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8').match(COMPANY);
    if (m) fail(`data/${f}: contains a company name ("${m[0]}"); contractor names are withheld`);
  });
});

if (errors.length) {
  console.error(`test-projects: ${errors.length} problem(s) in ${tests} tests`);
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
const by = {};
data.projects.forEach((p) => { by[p.status] = (by[p.status] || 0) + 1; });
console.log(`test-projects: ${tests} tests passed; ${data.projects.length} projects, ${data.documents.length} documents; ` + Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', '));
