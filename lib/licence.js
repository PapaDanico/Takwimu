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
  if (!c) {
    // "The DHS Program terms of use: link and cite; do not republish ..." -> "The DHS Program terms of use: link and cite"
    const m = String(text).match(/^(.{3,70}?): link and cite\b/);
    return m && text.length > 80 ? { label: `${m[1]}: link and cite`, cls: 'cite' } : { label: text, cls: null };
  }
  const holder = holderOf(text);
  const lead = holder ? `${holder}, rights reserved` : /^Not stated on the PDF/.test(text) ? 'Not stated on the PDF' : /^(Not stated|No (reuse )?licence stated)/i.test(text) ? 'No licence stated' : null;
  const label = lead ? `${lead}; ${c.label}` : c.label.charAt(0).toUpperCase() + c.label.slice(1);
  return { label, cls: c.id };
}

// Commercial reuse of a source's figures (owner, 28 Nov 2026), derived from the recorded licence and data_reuse; never
// typed by hand (scripts/validate-data.js recomputes it). Never "allowed" without a stated licence: CC BY-NC (or a
// stated ban on commercial use) is non-commercial-only, CC BY and CC BY-SA are attribution-required, a stated public
// domain dedication is allowed, a reserved right or a permission requirement is not-allowed, anything else unknown.
const COMMERCIAL_REUSE = ['allowed', 'attribution-required', 'non-commercial-only', 'unknown', 'not-allowed'];
const COMMERCIAL_LABEL = { allowed: 'commercial reuse allowed', 'attribution-required': 'commercial reuse with attribution', 'non-commercial-only': 'non-commercial only', unknown: 'commercial reuse unknown', 'not-allowed': 'no commercial reuse without permission' };
function commercialReuse(licence, dataReuse) {
  const t = String(licence || '').trim();
  if (!t || /^not (stated|confirmed)/i.test(t)) return 'unknown';
  if (/CC BY-NC|non-?commercial|not to be sold or used commercially/i.test(t)) return 'non-commercial-only';
  if (/\bCC BY(-SA)?\b|Creative Commons Attribution/i.test(t)) return 'attribution-required';
  if (/^Public Domain\b/i.test(t)) return 'allowed';
  if (/all rights reserved|permission/i.test(t) || dataReuse === 'permission required') return 'not-allowed';
  return 'unknown';
}

module.exports = { TERMS_HREF, CLASSES, licenceLabel, COMMERCIAL_REUSE, COMMERCIAL_LABEL, commercialReuse };
