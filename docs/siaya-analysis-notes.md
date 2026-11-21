# Siaya analytical measures: notes (21 Nov 2026)

Files: `data/siaya-analysis.json` (generated, committed), `scripts/build-siaya-analysis.js` (builds it), `schemas/siaya-analysis.schema.json`, `scripts/test-siaya-analysis.js` (run `node scripts/test-siaya-analysis.js`). The test isn't wired into `npm run validate`, the build or any page yet, because those files are being edited elsewhere. Scope: owner handover section 4 (WP1 Analysis, WP3, WP5), reconciliation cases R-002, R-003 and R-005, and section 14 (compatible denominators, documented rounding, no gap shown as zero).

## What it is
- 324 records: 255 values and 69 gaps. Every record carries the label "Calculated by Takwimu Kenya from published figures".
- Every result is arithmetic on values already in the repository. No new readings were made. Each input names its dataset, record path, field, value, unit, source, page and confidence. Values shown beside a result (printed rates, service indicators, allocations) are cited the same way.
- Each record has a stable `calc_id` (`SIA-A<family>-<key>`), a formula in words, a machine `calc`, the result, its unit and period, comparability notes, a caveat and flags.
- A missing or non-comparable input produces a gap record with its reason. A gap has no value, and nothing is filled or averaged.

## Families and rules
| Family | Measure | Rule |
|---|---|---|
| A1 | Real per-capita expenditure | Prices are at FY 2024/25 (`data/cpi.json`). A population figure for calendar year Y is used only for FY Y/Y+1. The census count (2019, `county.json`) and projections (2015 and 2017 from `history.json`, 2022 from `county.json`) are marked as such. No other year is interpolated, so only 4 fiscal years have a value. |
| A2 | Transfer dependency | (Equitable share received + conditional grants received) / (those two + OSR collected). All three come from one document and one year. The repository holds no printed total revenue, so the denominator is the sum of the three published streams. It leaves out balances brought forward. |
| A3 | Execution rates | Expenditure / budget for recurrent, development and total, taken from the same document. Where a document gives two budget versions, each gets its own rate. When budget and expenditure come from the same table, that pair is used. Revenue-side estimates that include balances brought forward are not used as denominators. Printed CoB rates (`history.json`, `counties-cob.json`) are shown beside, and any difference over 1 point is flagged. |
| A4 | Pending bills | Each reported stock is kept with its date and basis. Changes are calculated only within one document or within a declared series (same publisher, basis and scope). Where a report gives all four terms, the roll-forward residual is opening + new − payments − closing. Changes whose closing figure omits the year's new bills are gaps, because there closing − opening only repeats the payments. |
| A5 | Audit recurrence | Findings by category for each entity and year (the tracker's categories). Counts of findings the report says date from an earlier year. Counts of findings the next report lists as unresolved: only FY 2023/24 has that list transcribed, so other years are gaps. Named items reported in more than one year. |
| A6 | Budget beside service | Sector spending is shown beside a same-year indicator and flagged "context, not causation". No ratio is calculated. |
| A7 | Climate finance beside risk | The count of PCRA (2023) wards with a flood or drought hotspot printed, shown beside the FY 2023/24 FLLoCA allocations. Allocation, receipt and expenditure are never added together. |

Readings of one measure in one document that agree within 1% are the same figure at different rounding. The most precise is used and the others are listed. A difference above 1% within one document is a conflict and becomes a gap. Percentages and KSh million are rounded to 2 decimals and per-capita values to whole shillings. The test allows half a unit in the last decimal.

## Results to note (no verdicts)
- **A1:** KSh 8,958 per person in FY 2015/16, 6,337 in FY 2017/18 and 7,224 in FY 2022/23. These three are CoB figures using projections. FY 2019/20 is KSh 9,235, from the county BROP with the 2019 census count. All are at FY 2024/25 prices.
- **A2, CoB:** 97.6% (FY 2015/16) to 92.1% (FY 2023/24), and 94.8% in FY 2024/25. For the same year, county documents give 91.3% (Q4 report) and 90.9% (BROP). The difference comes from the own-source revenue figures (436.68m against 757.57m, case R-001).
- **A3:** No CoB printed rate differs from the recalculated rate by more than 1 point. The largest gap is 0.8 points (FY 2024/25 recurrent, county chapter 83 against 82.2). County and CoB documents give different expenditure figures, so their rates are separate records: recurrent FY 2023/24 is 96.7% (county Q4) against 87.0% (CoB), and FY 2024/25 is 101.7% (BROP) against 82.2% (CoB).
- **A4:** The CoB roll-forward residual is 0.00 for FY 2021/22 and FY 2022/23. In the management-statement series, the stock changes by +637.95m from 30 June 2023 to 30 June 2024. The FY 2024/25 changes are gaps, because Table 3.457 and the county Q4 report add no new bills.
- **A5:** The FY 2024/25 reports list 31 FY 2023/24 Executive findings and 13 Assembly findings as unresolved. The Siaya County Stadium contract appears in 4 audit years.
- **A6:** Two pairs have a value: education department spending in FY 2014/15 (KSh 301.1m) beside 2014 ECDE enrolment, and water department spending in FY 2024/25 (KSh 350.27m) beside WASREB coverage. Health is a gap because no health spending is held.
- **A7:** 20 of the 30 wards have a printed hotspot (18 flood, 9 drought). These are shown beside FLLoCA FY 2023/24 allocations of KSh 137.5m (CCRI) and 11.0m (CCIS). Receipts and expenditure for that year are gaps.

## Rebuilding
Run `node scripts/build-siaya-analysis.js` after any change to an input file. `meta.input_files` records the SHA-256 of each input. The test re-runs the build and fails unless the output is identical byte for byte. It also resolves every input to its record, recomputes every result, rejects mixed-source ratios and verdict wording, and checks counts against `siaya-audits.json` and `siaya-climate.json`.
