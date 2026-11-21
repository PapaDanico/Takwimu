// One lookup for every source id used by the Siaya topic datasets (health, education, agriculture, geography,
// climate, analysis): the id each data file uses, the Source Library record id, or a source-manifest id.
// Returns the title, publisher and the address to link to. Server and build only.
const lib = require('../data/source-library.json');
const manifest = require('../data/source-manifest.json');

const FILES = ['siaya-health', 'siaya-education', 'siaya-agriculture', 'siaya-geography', 'siaya-climate'];
const index = new Map();
const put = (id, rec) => { if (id && !index.has(id)) index.set(id, rec); };

// The data files' own source lists come first: they name the copy each value was read from (for example the
// Council of Governors copy of the PCRA, CLIM-01, whose register address fails certificate checks).
FILES.forEach((f) => {
  require(`../data/${f}.json`).sources.forEach((s) => put(s.id || s.source_id, { title: s.title, publisher: s.publisher || '', url: s.url }));
});
lib.documents.forEach((d) => put(d.document_id, { title: d.title, publisher: d.publisher, url: d.file_url || d.source_url }));
manifest.documents.forEach((d) => put(d.id, { title: d.title, publisher: d.publisher || '', url: d.url }));
require('../data/siaya-audits.json').documents.forEach((d) => put(d.doc_id, { title: d.title, publisher: d.issuer || 'Office of the Auditor-General', url: d.url }));
const cpi = require('../data/cpi.json');
// Source ids the analysis layer uses that name another record or a database.
put('KNBS-CSA-SIAYA-2015', index.get('KNBS-03-SIAYA-2015'));
put('GOV-01 (CIDP 2023-2027)', index.get('GOV-01-PDF'));
put('WDI FP.CPI.TOTL', { title: cpi.meta.source, publisher: 'World Bank', url: cpi.meta.source_url });
put('county-ADP (as cited in history.json)', { title: 'Siaya County Annual Development Plans 2015/16 and 2018/19, population projection as recorded in history.json (no page recorded)', publisher: 'County Government of Siaya', url: null });

function source(id) {
  const r = index.get(id);
  if (!r) return { id, title: id, publisher: '', url: null };
  return { id, ...r };
}

// "PDF p. 84 (printed p. 79)" or the page note for web pages and databases.
function pageRef(pdfPage, printedPage, note) {
  if (pdfPage === null || pdfPage === undefined) return note || 'no page (web page or database)';
  return `PDF p. ${pdfPage}${printedPage !== null && printedPage !== undefined && printedPage !== pdfPage ? ` (printed p. ${printedPage})` : ''}`;
}

module.exports = { source, pageRef };
