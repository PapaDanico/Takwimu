// Sources we looked for and could not use, with the reason and the retry date. Listed once, at /method/#known-gaps
// (owner decision U3, 21 Nov 2026); other pages link there.
export const KNOWN_GAPS = [
  { q: 'Known gap: FinAccess county data (FSD Kenya, Central Bank of Kenya and KNBS).', note: 'The FinAccess site was reachable, but its county figures are only in an embedded dashboard and the downloadable files are survey microdata. County estimates from microdata would need survey weighting by us, which would be our estimate rather than a published figure, so none is shown. Retry quarterly for a published county table.' },
  { q: 'Known gap: Uwezo learning assessments (Twaweza).', note: 'uwezo.net could not be reached (the connection failed on 21 Nov 2026), and no county table has been found elsewhere yet. No figure is shown. Retry quarterly.' },
  { q: 'Known gap: NG-CDF allocations per constituency.', note: 'The Parliament library copy of the proposed 2024/25 ceiling for each constituency is a scanned document, and its OCR text is garbled, so no value was taken from it. A secondary website republishes figures, but it is not the primary document. No figure is shown. Retry quarterly for a text copy or a reliable re-read.' },
  { q: 'Known gap: KNBS 2019 census tables (population by county and sub-county).', note: 'The KNBS website failed the secure (TLS) connection from our build environment, and that check was not bypassed. Siaya\'s 2019 count on this site is the one reproduced in the county\'s CIDP 2023-2027, which is named as its source. Retry quarterly.' },
];
