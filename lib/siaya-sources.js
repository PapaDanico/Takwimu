// One lookup for every source id used by the Siaya topic datasets (health, education, agriculture, geography,
// climate, analysis): the id each data file uses, the Source Library record id, or a source-manifest id.
// Returns the title, publisher and the address to link to. Server and build only.
const lib = require('../data/source-library.json');
const manifest = require('../data/source-manifest.json');

const FILES = ['siaya-health', 'siaya-education', 'siaya-agriculture', 'siaya-geography', 'siaya-climate'];
const index = new Map();
const put = (id, rec) => { if (id && !index.has(id)) index.set(id, rec); };

lib.documents.forEach((d) => put(d.document_id, { title: d.title, publisher: d.publisher, url: d.file_url || d.source_url, library_id: d.document_id }));
manifest.documents.forEach((d) => put(d.id, { title: d.title, publisher: d.publisher || '', url: d.url, library_id: d.id }));
FILES.forEach((f) => {
  require(`../data/${f}.json`).sources.forEach((s) => {
    const id = s.id || s.source_id;
    const libId = s.library_id && index.has(s.library_id) ? s.library_id : (index.has(id) ? id : null);
    put(id, { title: s.title, publisher: s.publisher || '', url: s.url, library_id: libId });
  });
});
// Source ids the analysis layer uses that name a data-file id with a different spelling.
put('KNBS-CSA-SIAYA-2015', index.get('KNBS-03-SIAYA-2015'));

function source(id) {
  const r = index.get(id);
  if (!r) return { id, title: id, publisher: '', url: null, library_id: null };
  return { id, ...r };
}

// "PDF p. 84 (printed p. 79)" or the page note for web pages and databases.
function pageRef(pdfPage, printedPage, note) {
  if (pdfPage === null || pdfPage === undefined) return note || 'no page (web page or database)';
  return `PDF p. ${pdfPage}${printedPage !== null && printedPage !== undefined && printedPage !== pdfPage ? ` (printed p. ${printedPage})` : ''}`;
}

module.exports = { source, pageRef };
