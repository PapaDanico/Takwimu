// Budget transparency and public participation (/counties/siaya/governance/): IBP Kenya CBTS 2021 and 2022 and the
// APRM Siaya County Review Report 2024, from data/siaya-governance.json. Each edition is kept separate; nothing is
// carried forward or resolved here. Server and build only.
// Read through lib/review-status.js: a value rejected in editorial review is already removed (masked) here, and each
// item carries its review badge.
const rs = require('./review-status');
const gov = rs.masked('siaya-governance');
const lib = require('../data/source-library.json');

const docOf = (id) => {
  const s = gov.sources.find((x) => x.source_id === id);
  const l = lib.documents.find((x) => x.document_id === id) || {};
  return { ...s, url: l.source_url };
};
// APRM pages are printed; give the printed page first and the PDF page after.
const aprmPage = (f) => `p. ${f.page_printed} (PDF p. ${f.page_pdf})`;

function editions() {
  return gov.ibp_cbts.editions.map((e) => {
    const it = Object.fromEntries(e.items.map((x) => [x.id.replace(/^cbts\d{4}-/, ''), { ...x, review: rs.badge('siaya-governance', x.id) }]));
    const participation = it['participation-score'] || it.participation;
    return {
      edition: e.edition, year: e.year, doc: docOf(e.source_id), assessed: e.documents_assessed,
      index: it.index, count: it['documents-count'], list: it['documents-list'], comp: it.comprehensiveness,
      participation, participationFinding: it['participation-finding'] || null,
      nationalAverage: it['national-average'] || null, rank: it.rank || null,
      recommendation: it['recommendation-feedback'] || null, response: it['county-response'] || null,
    };
  });
}

const THEMES = [
  { key: 'participation', title: 'Public participation' },
  { key: 'civic_education', title: 'Civic education' },
  { key: 'feedback', title: 'Feedback on public input' },
  { key: 'transparency', title: 'Access to information' },
];

function governance() {
  const aprmDoc = docOf(gov.aprm.source_id);
  return {
    editions: editions(),
    conflicts: gov.ibp_cbts.conflicts.map((c) => ({ ...c, positions: c.positions.map((p) => ({ ...p, doc: docOf(p.source_id) })) })),
    method: gov.ibp_cbts.method_note,
    aprm: { ...gov.aprm, doc: aprmDoc, groups: THEMES.map((t) => ({ ...t, findings: gov.aprm.findings.filter((f) => f.theme === t.key).map((f) => ({ ...f, review: rs.badge('siaya-governance', f.id) })) })).filter((g) => g.findings.length) },
    caveats: gov.caveats, sources: gov.sources.map((s) => docOf(s.source_id)),
  };
}

const reviewCols = (id) => { const r = rs.review('siaya-governance', id); return { review_status: r.label, review_note: r.hide ? r.reason : '' }; };
// Dataset rows for the catalogue CSV: one row per cited item (survey measure or report finding), with source and page.
function datasetRows() {
  const cbts = gov.ibp_cbts.editions.flatMap((e) => e.items.map((x) => ({
    source_id: x.source_id, edition: x.edition, year: x.year, item_id: x.id, measure: x.measure || '', theme: '',
    value: x.value ?? (x.scores ? x.scores.map((s) => `${s.document}: ${s.value ?? s.reason}`).join('; ') : x.series ? x.series.map((s) => `${s.survey}: ${s.value}`).join('; ') : ''),
    of: x.of ?? '', unit: x.unit || '', published: (x.published || []).join('; '), not_published: (x.not_published || []).join('; '),
    quote: x.quote || '', note: [x.note, x.reason].filter(Boolean).join(' '), page_pdf: x.page_pdf, page_printed: '', confidence: x.confidence || '',
    source: docOf(x.source_id).title, source_url: docOf(x.source_id).url, ...reviewCols(x.id),
  })));
  const aprm = gov.aprm.findings.map((f) => ({
    source_id: f.source_id, edition: f.edition, year: f.year, item_id: f.id, measure: f.measure || f.section, theme: f.theme,
    value: f.value ?? (f.rows ? f.rows.map((r) => `${r.output}: ${Object.entries(r.targets).map(([y, v]) => `${y} ${v}`).join(', ')}`).join('; ') : ''),
    of: '', unit: f.unit || '', published: '', not_published: '', quote: f.quote, note: [f.also, f.note].filter(Boolean).join(' '),
    page_pdf: f.page_pdf, page_printed: f.page_printed, confidence: '', source: docOf(f.source_id).title, source_url: docOf(f.source_id).url, ...reviewCols(f.id),
  }));
  return [...cbts, ...aprm];
}

module.exports = { governance, datasetRows, aprmPage, gov };
