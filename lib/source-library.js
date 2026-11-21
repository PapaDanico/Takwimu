// Labels for the Siaya Source Library (data/source-library.json), shared by the page and its client-side list.
export const STATUS = {
  downloaded: { label: 'Downloaded', text: 'A copy was saved and checked to be a valid file; its SHA-256 fingerprint is recorded.' },
  discovered: { label: 'Discovered', text: 'The page or record exists, but the document itself has not been saved yet (a landing page, a collection or a live service).' },
  inaccessible: { label: 'Inaccessible', text: 'The address did not work when checked: not found, under maintenance, or a certificate that could not be verified.' },
  blocked: { label: 'Blocked', text: 'An automated bot check stopped the request, so the page could not be read.' },
};
export const COVERAGE = { Siaya: 'Siaya only', 'multi-county including Siaya': 'Several counties, including Siaya', national: 'National' };
