# Data contract (version 1.3)

Applies to `data/history.json` and `data/conflicts.json`. Enforced by `scripts/validate-data.js` at build time, including the JSON Schemas in `schemas/` (also for `subcounties.json` and `county.json`).

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

## Rules
- Original observations are never overwritten when a later report restates them; both stay in the register.
- Arithmetic agreement alone never upgrades a case to `reviewed`.
- Exports (`public/data/history.csv`, `history.json`, `conflicts.json`) are built from these same files.

## Not yet in place
Geography versioning, price-basis fields on every observation, and a reviewer workflow. (Source file checksums are in `data/source-manifest.json` since 21 Nov 2026. A document from a site that publishes no checksum is listed with `sha256: null` and `access: "downloaded <date>; not hashed: <reason>"`; one that could not be fetched has `access: "unavailable on <date>"`.) These need an owner decision on who reviews.
