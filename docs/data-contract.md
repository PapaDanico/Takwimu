# Data contract (version 1.2)

Applies to `data/history.json` and `data/conflicts.json`. Enforced by `scripts/validate-data.js` at build time, including the JSON Schemas in `schemas/` (also for `subcounties.json` and `county.json`).

## Observations (history.json)
Each year carries: fiscal year, figures, `report` (default source), optional `field_source` (a different report for one field), optional `derived` (fields computed rather than printed), `caveat`. Each report has title, URL and confidence (1 to 5, an explanation of source quality and extraction, not a probability of accuracy). Gaps are listed in `meta.gaps`, never filled.

Audit points may carry `source` (when the opinion comes from a compilation, not the audit report) and `caveat`.

## In-year figures (history.json `in_year`, since 21 Nov 2026)
Partial-year Controller of Budget figures (FY 2025/26 first quarter and first half). Each period names its report, section and confidence; each figure has measure, value, unit, PDF and printed page, how it was read and, for balances, `as_of`. `comparability` is fixed to "In-year, not comparable with full years". The validator fails if the in-year fiscal year also appears in `years`, or if an in-year conflict id is not in the register. Pages show these apart from the ten-year series, never on the same chart.

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
