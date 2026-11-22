# Siaya education and human development: extraction notes (21 Nov 2026)

Data: `data/siaya-education.json` (schema `schemas/siaya-education.schema.json`, test `node scripts/test-education.js`). Programme sections 1, 3D and 8 apply. Aggregates only: no school-level, learner-level or personal data (docs/data-protection-policy.md). Nothing here is routed or published yet.

## Sources read
| source_id | Document | Pages used | Notes |
|---|---|---|---|
| MOE-BESB-2019 | Ministry of Education, Basic Education Statistical Booklet 2019 (NEMIS) | Tables 38-52, 64-71 | New download (SourceAfrica copy); not yet in source-library.json. Printed page = PDF page - 17 |
| MOE-BESB-2014 | MoEST, 2014 Basic Education Statistical Booklet | Tables 16-26, 45-46, 63, 66, 78-79 | New download (KICD copy). Printed page = PDF page - 14 |
| KNBS-ABS-2015 | KNBS, Siaya County Statistical Abstract 2015 (library KNBS-03-SIAYA-2015) | Tables 3.3, 13.1-13.24, 15.2, 15.4 | 2014 values provisional. Printed page = PDF page - 17 |
| CIDP-2023-2027 | Siaya CIDP 2023-2027 (GOV-01-PDF) | pp. 35, 39, 44, 143, 148, 193-194 | Narrative figures mostly undated and unsourced (confidence 1-3) |
| CBIRR-FY2025-26-Q4 | County budget implementation report, Q4 FY 2025/26 (GOV-02) | Table 0.6, p. 10 | Bursary Fund only |
| BROP-FY2024-25 | County Budget Review and Outlook Paper FY 2024/25 (GOV-03) | p. 32 | CFSP plan amounts, not spending |
| KDHS-2022 | KDHS 2022 Vol. 1 (FR380) | Tables 2.11.1C, 2.11.2C, 2.12C, 3.2.1C, 3.2.2C | New download; library holds only the key indicators report |
| KDHS-2014 | KDHS 2014 (FR308, library kdhs-2014) | Tables 3.2.1C, 3.2.2C | The library folder named SITE-KDHS-2022 actually holds this 2014 report |

New downloads are in `/tmp/claude-0/library/EDU-MOE-BESB-2019`, `EDU-MOE-BESB-2014`, `EDU-KDHS-2022-FR380` (sha256 in the data file). They should be added to `data/source-library.json` and `data/source-manifest.json` by whoever owns those files.

## Devolved vs national
Devolved (county): pre-primary/ECDE, VTCs (youth polytechnics), county bursary, county education department budget. National: primary, secondary, TSC teachers, national TVET institutes (Siaya Institute of Technology, St. Joseph's Nyangoma), CDF bursaries, KDHS attainment and attendance, population projections.

## Findings that need care
1. 2014 ECDE total pupil-teacher ratio is printed 28.7; enrolment and teachers in the same table give 33.7 (28.7 is the mean of the public and private ratios).
2. KNBS abstract GERs do not reproduce from its own age-group projections (ECDE 73.5 vs 72.0, primary 117.0 vs 122.9, secondary 75.1 vs 69.5).
3. The 2019 booklet swaps female and male enrolment between its GPI tables (47, 66) and GER tables (49, 68). Sex-specific GERs are not recorded.
4. 2019 pre-primary GER 190.7% is implausible against any 3-5 population.
5. CIDP end-2022 ECE "gross enrolment" (81,771) equals its projected 3-5 population for 2022.
6. Teacher counts differ between sources (2014 ECDE 1,926 vs 1,824; TSC primary 5,809 vs 5,788; TSC secondary 1,861 vs 1,967; CIDP 608 ECD teachers vs 1,431 public pre-primary teachers in 2019).
7. The Siaya County Bursary Fund shows KSh 732.1 million cumulative disbursements and no FY 2025/26 allocation; the report says the fund's 10-year life has lapsed. The FY 2024/25 KSh 120 million bursary is a CFSP plan figure, not spending.
8. 2014 ECDE public + private enrolment is one less than the printed total (rounding).

## Gaps (listed in the data, not filled)
County transition rate primary to secondary; KCSE results beyond candidate counts; pre-primary PTR and GER/NER after 2019; annual VTC enrolment after 2022; bursary outturn by year; Inua Jamii beneficiaries by programme (no official county table found); youth unemployment for Siaya (the CIDP's 31.2% is unsourced and not youth-specific); UNICEF UN-01..03 give no usable Siaya education value; KNBS Economic Survey county tables not yet read.

## Not done
No page, chart or import into lib/ uses this file yet. The 10-year series rule (data/history.json) is not met: education values exist for 2013, 2014, 2019, 2022 and CIDP baselines only.
