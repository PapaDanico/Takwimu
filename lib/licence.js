// Short licence labels (duplication sweep D08). Each document keeps its full licence text in the data files; pages and
// reports print a short class label linked to the class definitions on /terms/#reuse, instead of repeating the
// same long sentence once per document. A licence that fits no class is printed as written.
const TERMS_HREF = '/terms/#reuse';

const CLASSES = [
  { id: 'kps', name: 'Kenyan public statistics', label: 'figures citable, not redistributed', re: /figures may be reused with the body and report named; the document is not redistributed \(Kenyan public statistics, \/terms\/\)/, text: 'Figures may be reused with the body and report named; the document itself is not redistributed. This is the class for Kenyan public statistics and county documents that state no reuse licence.' },
  { id: 'perm', name: 'Rights reserved', label: "publisher's permission needed", re: /figures need the publisher's permission \(link and cite\)/, text: "No reuse licence is stated and the publisher reserves its rights: figures need the publisher's permission; Takwimu links to the document and cites it." },
  { id: 'ibp', name: 'IBP survey results', label: 'figures citable with the IBP citation', re: /figures may be reused with the citation IBP states/, text: 'International Budget Partnership survey results: figures may be reused with the citation IBP states ("International Budget Partnership (2025). Open Budget Survey Dataset."); the documents are not redistributed.' },
  { id: 'cite', name: 'Link and cite only', label: 'link and cite only', re: /^(not stated: )?link and cite only$/i, text: 'No licence is recorded: Takwimu links to the document and cites it, and does not redistribute it.' },
];

// "© County Government of Siaya, all rights reserved (site footer); ..." -> "© County Government of Siaya"
const holderOf = (t) => { const m = String(t).match(/^(©\s*(?:\d{4}\s+)?[^,;(]+?)\s*(?:[,;(]|$)/); return m ? m[1] : null; };

// { label, cls } where cls is the class id (null when the text is printed as written).
function licenceLabel(text) {
  if (!text) return { label: 'Not stated: link and cite only', cls: 'cite' };
  const c = CLASSES.find((k) => k.re.test(text));
  if (!c) return { label: text, cls: null };
  const holder = holderOf(text);
  const lead = holder ? `${holder}, rights reserved` : /^Not stated on the PDF/.test(text) ? 'Not stated on the PDF' : /^(Not stated|No (reuse )?licence stated)/i.test(text) ? 'No licence stated' : null;
  const label = lead ? `${lead}; ${c.label}` : c.label.charAt(0).toUpperCase() + c.label.slice(1);
  return { label, cls: c.id };
}

module.exports = { TERMS_HREF, CLASSES, licenceLabel };
