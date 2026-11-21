# Data contract (version 1.4)

Applies to `data/history.json`, `data/conflicts.json`, `data/national.json` and `data/counties-cob.json`. Enforced by `scripts/validate-data.js` at build time, including the JSON Schemas in `schemas/` (also for `subcounties.json` and `county.json`).

## Observations (history.json)
Each year carries: fiscal year, figures, `report` (default source), optional `field_source` (a different report for one field), optional `derived` (fields computed rather than printed), `caveat`. Each report has title, URL and confidence (1 to 5, an explanation of source quality and extraction, not a probability of accuracy). Gaps are listed in `meta.gaps`, never filled.

Audit points may carry `source` (when the opinion comes from a compilation, not the audit report) and `caveat`.

## Page references (since 21 Nov 2026)
Every observation names the document it was read from and the page: each year's `provenance` maps every figure field to a reference; audit points, own-source revenue points and their alternates carry the reference directly. A reference has `source_id` (an id in `data/source-manifest.json`), `page` (PDF page, counted from the first page of the file), optional `printed_page` (only where at least three pages of the section show the same offset between PDF and printed numbers), `read` (`PDF text layer`, `OCR layer` or `RapidOCR`) and optional `page_note`. A figure that could not be found again has `page: null` and `page_note: "not located"`; a page is never guessed. In-year periods and supplementary documents carry `source_id`; their figures keep `pdf_page`. The validator fails if a figure has no reference, if `source_id` is not in the manifest, if the manifest document's link differs from the report or audit link the observation cites, if a null page lacks "not located", or if a reference exists for a gap. The CSV export carries `source_id`, `pdf_page`, `printed_page` and `page_note` on every row that has them; the Data page lists them per year.

## In-year figures (history.json `in_year`, since 21 Nov 2026)
Partial-year Controller of Budget figures (FY 2025/26 first quarter and first half). Each period names its report, section and confidence; each figure has measure, value, unit, PDF and printed page, how it was read and, for balances, `as_of`. `comparability` is fixed to "In-year, not comparable with full years". The validator fails if the in-year fiscal year also appears in `years`, or if an in-year conflict id is not in the register. Pages show these apart from the ten-year series, never on the same chart.

## Pending-bills roll-forward (history.json `pending_rollforward`, since 21 Nov 2026)
One row per fiscal year with the identity opening stock + new bills − payments − write-offs or adjustments = closing stock. Each term is either published (value in KSh million, `source_id` of that year's report, PDF page, printed page where known, how it was read, optional note and `parts`) or `{"status": "not published"}` with no value. A closing stock is never computed from the other terms, and a missing term is never filled. The validator checks that each published term cites the year's report and has a page, that `parts` add up, and that a "not published" term has no value. `scripts/test-reconciliation.js` tests the identity for every year where all five terms are published and, for every other year, that the gap is shown as "not published"; the smoke test checks the Insights table shows every row and every unpublished term.

## Other documents (history.json `supplementary`)
Figures for a year whose Controller of Budget report is missing (FY 2019/20), from other primary documents (county Budget Review and Outlook Paper, later CoB reports, Senate committee report quoting the audit). Listed with page numbers; never used to fill `years`. Disagreements with another source go in the register.

## Conflict register (conflicts.json)
Each case has: id, measure, unit, at least two sourced values (label, value, https URL), definitions, a labelled hypothesis, status (`open` or `resolved`), effect on the pages, and:
- `verification_state`: `resolved_by_source`, `unresolved_no_reviewer` or `reviewed`. A `reviewed` case must name `reviewer` and `reviewed_on`. No case is reviewed yet.
- `page_image_checked`: true only when the figure was checked against the page image, not only the extracted text. Currently false for all.
- `supersedes`: id of an earlier case this one restates, or null.

## National indicators (national.json, since 21 Nov 2026)
Fourteen World Bank World Development Indicators series for Kenya, 2010 to 2025, retrieved from the API on 21 Nov 2026 (`source_id: worldbank-wdi-api` in the manifest; a live API, so not hashed). Each indicator has code, name, unit, sector, the API's source note, original source, `api_url`, `last_updated`, retrieval date, a note on modelled or estimated data, `missing_years` and one value per year. The validator fails if years are not consecutive, if a null year is not in `missing_years` (or a listed year has a value), or if a percentage (other than gross enrolment) is outside 0 to 100. Gaps (central government debt, the IMF series that could not be reached, net enrolment, the redefined poverty line) are in `meta.gaps`. Stored values keep the World Bank unit; pages divide some by a scale for display (population in million people, remittances in US$ billion), and `scripts/test-explore.js` fails the build if a display unit and its scale disagree or a download changes the raw value or unit.

## 47-county tables (counties-cob.json, since 21 Nov 2026)
Two years (FY 2023/24 and FY 2024/25) of the Controller of Budget annual county reports, chapter 2: own-source revenue (Table 2.1), budget, spending and absorption (Table 2.5 or 2.3), pending bills (Table 2.9 or 2.5). Every value carries `table`, `pdf_page`, `printed_page`, `read: "ocr"`, the raw printed string and the OCR confidence. A null value has `status` (`blank` or `doubtful`) and a `note`; a doubtful value keeps its raw reading. The `derived` block (percentages computed from amounts) is for reference and is never shown as a value. The validator checks the schema, that each year's `source_id`, link and SHA-256 match the manifest, that the 47 counties match `lib/counties.js`, that the printed page is the PDF page minus the year's offset, that the 47 rows sum to the printed total (within 0.5 KSh m), that row parts add up (recurrent plus development, ordinary plus FIF/A-i-A, Executive plus Assembly), that printed percentages agree with the printed amounts (within 1.5 points), and that Siaya's rows equal `history.json` within its rounding or the difference is in the register (`budget-2024-25`, `recurrent-absorption-2024-25`, `recurrent-absorption-2023-24`, `development-absorption-2023-24`, `pending-close-2025`, `pending-2024`, `budget-financing-osr-2024-25`). Plotted Siaya values are unchanged. Imported once by `scripts/import-staging.js`.

## Explore pages and downloads
`lib/explore.js` reads these files for /datasets/, /kenya/, /compare/, /trends/ and /stories/ and for the build's downloads in `public/data/datasets/` (one CSV and JSON per dataset plus `catalogue.json`). Views download exactly the rows they show. Comparisons do not order counties by value when any reading for that indicator and year is doubtful. Story numbers are computed from the data in `lib/stories.js`.

## Rules
- Original observations are never overwritten when a later report restates them; both stay in the register.
- Arithmetic agreement alone never upgrades a case to `reviewed`.
- Exports (`public/data/history.csv`, `history.json`, `conflicts.json`) are built from these same files.

## Not yet in place
Geography versioning, price-basis fields on every observation, and a reviewer workflow. (Source file checksums are in `data/source-manifest.json` since 21 Nov 2026. A document from a site that publishes no checksum is listed with `sha256: null` and `access: "downloaded <date>; not hashed: <reason>"`; one that could not be fetched has `access: "unavailable on <date>"`.) These need an owner decision on who reviews.
