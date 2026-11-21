# Data contract (version 1.1)

Applies to `data/history.json` and `data/conflicts.json`. Enforced by `scripts/validate-data.js` at build time, including the JSON Schemas in `schemas/` (also for `subcounties.json` and `county.json`).

## Observations (history.json)
Each year carries: fiscal year, figures, `report` (default source), optional `field_source` (a different report for one field), optional `derived` (fields computed rather than printed), `caveat`. Each report has title, URL and confidence (1 to 5, an explanation of source quality and extraction, not a probability of accuracy). Gaps are listed in `meta.gaps`, never filled.

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
Geography versioning, price-basis fields on every observation, source file checksums, and a reviewer workflow. These need an owner decision on who reviews.
