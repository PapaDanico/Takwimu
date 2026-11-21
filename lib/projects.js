// Siaya development project register (/counties/siaya/projects/) from data/siaya-projects.json.
// Owner decision (21 Nov 2026): contractor company names are withheld from the public site pending editorial review.
// publicCopy() removes every contractor field (contract.contractor, contract.contractor_note) before anything is
// published; the page, the dataset downloads and public/data/siaya-projects.json all read from it. Server and build only.
// Read through lib/review-status.js: a project record rejected in editorial review has its amounts and evidence removed.
const rs = require('./review-status');
const raw = rs.masked('siaya-projects');
const geo = require('../data/siaya-geography.json');

const WITHHELD = ['contractor', 'contractor_note'];
function publicCopy() {
  const d = JSON.parse(JSON.stringify(raw));
  d.projects.forEach((p) => { if (p.contract) WITHHELD.forEach((k) => delete p.contract[k]); });
  d.meta.contractor_names = 'Withheld from the public site pending editorial review (owner decision, 21 Nov 2026).';
  return d;
}
const pub = publicCopy();
const docs = Object.fromEntries(pub.documents.map((d) => [d.doc_id, d]));
const wardName = Object.fromEntries(geo.wards.map((w) => [w.id, w.name]));
const conName = Object.fromEntries(geo.constituencies.map((c) => [c.id, c.name]));

// The states used in this release, in the order of the meta list, with their rule text.
const STATES = pub.meta.status_states.filter((s) => pub.projects.some((p) => p.status === s)).map((s) => ({ state: s, rule: (pub.meta.status_rules.find((r) => r.startsWith(`${s}:`)) || pub.meta.status_rules.find((r) => r.includes(s)) || '').replace(/^[^:]+:\s*/, ''), count: pub.projects.filter((p) => p.status === s).length }));
const SECTOR = {
  roads_transport: 'Roads and transport', water_sanitation: 'Water and sanitation', health: 'Health', education: 'Education', markets_trade: 'Markets and trade', industry: 'Industry',
  agriculture_fisheries: 'Agriculture and fisheries', sports_culture_tourism: 'Sports, culture and tourism', governance_offices: 'Offices and governance', ict: 'ICT', urban_housing_lands: 'Urban, housing and lands',
  energy_lighting: 'Energy and lighting', environment: 'Environment', social_services: 'Social services',
};
const INDEPENDENT = new Set(pub.meta.independent_evidence_types || ['audit_physical_verification', 'audit_documentary_review']);
const ev = (e) => ({ doc: docs[e.doc_id] ? docs[e.doc_id].title : e.doc_id, url: docs[e.doc_id] ? docs[e.doc_id].url : null, page: e.page, type: e.evidence_type.replace(/_/g, ' '), as_at: e.as_at, summary: e.summary, confidence: e.confidence, pct: e.reported_completion_pct ?? null, finding: e.finding_id || null, independent: INDEPENDENT.has(e.evidence_type) });

// Compact rows for the client explorer (no contractor field exists in the public copy).
function projectRows() {
  return pub.projects.map((p) => {
    const e = p.evidence.map(ev);
    return {
      id: p.id, name: p.name, sector: p.sector, status: p.status, status_note: p.status_note || '',
      wards: p.location.ward_ids.map((w) => ({ id: w, name: wardName[w] || w })), constituencies: p.location.constituency_ids.map((c) => conName[c] || c), countywide: p.location.countywide,
      places: p.location.as_printed.map((x) => x.text), status_source: { ...ev({ ...p.status_source, summary: '', confidence: null }) },
      reported: e.filter((x) => !x.independent), audit: e.filter((x) => x.independent), conflicts: p.conflicts.map((c) => c.note), findings: p.audit_finding_ids,
      amounts: p.amounts.map((a) => ({ kind: a.kind.replace(/_/g, ' '), value: a.value, unit: a.unit, fy: a.fy, doc: docs[a.doc_id] ? docs[a.doc_id].title : a.doc_id, url: docs[a.doc_id] ? docs[a.doc_id].url : null, page: a.page, label: a.label_as_printed })),
      last: p.last_evidence_date, review: rs.badge('siaya-projects', p.id),
    };
  });
}
const datasetRows = () => pub.projects.map((p) => ({
  id: p.id, name: p.name, sector: p.sector, implementing_entity: p.implementing_entity, status: p.status, status_doc: p.status_source.doc_id, status_page: p.status_source.page, status_evidence_type: p.status_source.evidence_type,
  last_evidence_date: p.last_evidence_date, wards: p.location.ward_ids.join('; '), constituencies: p.location.constituency_ids.join('; '), places_as_printed: p.location.as_printed.map((x) => x.text).join('; '),
  audit_finding_ids: p.audit_finding_ids.join('; '), conflicts: p.conflicts.map((c) => c.note).join(' | '), amounts: p.amounts.map((a) => `${a.kind} ${a.value} ${a.unit} (${a.fy}, ${a.doc_id} p. ${a.page})`).join('; '),
  contract_signed: p.contract.signed || '', expected_completion: p.contract.expected_completion || '',
  review_status: rs.review('siaya-projects', p.id).label, review_note: rs.review('siaya-projects', p.id).hide ? rs.review('siaya-projects', p.id).reason : '',
}));

module.exports = { publicCopy, projectRows, datasetRows, STATES, SECTOR, pub, WITHHELD };
