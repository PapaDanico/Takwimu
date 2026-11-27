# Next county: recommendation

The inputs were `data/counties-cob.json` (FY2021/22-2024/25 CoB OCR, null pattern per county), `lib/counties.js` (47 counties, Siaya only published), the KIPPRA repository API (counts of county planning and budget documents by title), the Parliament library API (OAG County Executive reports by year) and test downloads of current county-site documents (text-layer check with `pdftotext`).

## Evidence

| County | CoB 2021/22-24/25 (counties-cob nulls) | KIPPRA county docs: CBROP / CFSP / budget / ADP / CIDP (years) | OAG Exec reports in Parliament library (FY end) | Own-site check (27 Nov 2026) | KNBS county abstract | Budget FY2024/25 (CoB, KSh m) |
|---|---|---|---|---|---|---|
| Kisumu | all 4 years; fewest nulls (0 in 2024/25) | 9 CBROP 2014-2024, 9 CFSP 2017-2025, 8 budget estimates/PBB, 9 ADP, 3 CIDP ("Kisumu City County" titles) | 2019-2024 | Approved Budget 2025/26 (325 pp, text layer); **County Statistical Abstract 2024** (255 pp, text layer) | **2024 edition** | 15,314 |
| Busia | all 4; Assembly development nulls | 8 / 10 / 7 / 11 / 3 (2015-2026) | 2019-2025 (most complete) | CFSP 2026/27 (text layer), Q3 FY2025/26 BIRR listed (download failed) | 2015 only | 10,770 |
| Kakamega | all 4; Assembly nulls | 7 / 11 / 13 / 8 / 3 (2014-2026) | 2019, 2022-2025 | CFSP 2025 (text) | 2015 (UN Women county profile) | 17,647 |
| Homa Bay | all 4; few nulls | 10 / 9 / 3 / 9 / 3 | 2016, 2020, 2022-2023 (gaps) | CSA download link 404 | listed on county site | 13,131 |
| Vihiga | all 4; Assembly nulls | 9 / 8 / 4 / 12 / 3 | 2020-2025 | CBROP 2025 link 404 | 2015 | 7,106 |
| Makueni (contrast) | all 4; fewest problems in 2021/22, 2023/24 | 13 / 11 / 10 / 14 / 3 (2013-2027; most complete) | 2020, 2021, 2023, 2024 | Q3 FY2025/26 report (230 pp, text layer); strong PFM-transparency reputation | 2015 | 11,580 |

Machine-readability: every county-site and KIPPRA document tested has a text layer. All OAG uploads to the Parliament library are scans for every county, so OCR effort is equal across candidates. The CoB tables in `counties-cob.json` are OCR for all 47 counties.

## Scores (1-5, higher is better; effort is scored inversely)

| Criterion (weight) | Kisumu | Busia | Kakamega | Homa Bay | Vihiga | Makueni |
|---|---|---|---|---|---|---|
| Document availability and machine-readability (25%) | 5 | 4 | 4 | 3 | 3 | 5 |
| 10-year coverage (20%) | 4 | 4 | 4 | 3 | 3 | 5 |
| Audience and impact (20%) | 5 (city, regional hub, lake economy) | 3 | 4 (largest Western county) | 3 | 2 | 3 (national PFM interest) |
| Comparability with Siaya (20%) | 4 (neighbour, lake, Luo-speaking, shared OSR "weakest performers" ranking in FY2025/26 Q3 news) | 5 (neighbour, similar size and budget, rural) | 3 | 4 | 3 | 2 (contrast) |
| Effort, inverse (15%) | 3 (city board, more departments, 35 wards) | 4 (35 wards, structure similar to Siaya) | 2 (60 wards, largest budget) | 3 | 4 | 3 |
| **Weighted** | **4.30** | **4.00** | **3.50** | **3.20** | **2.95** | **3.70** |

## Recommendation: Kisumu

Reasons:
1. **Best evidence base among the neighbours.** Kisumu has a recent KNBS-supported county statistical abstract (2024). Siaya has only the 2015 edition, and its absence is a listed gap for Siaya. It also has a complete KIPPRA CBROP and CFSP run, approved estimates on its own site in text form, and OAG Executive reports for FY2018/19-2023/24.
2. **Comparison value.** Kisumu and Siaya share the lake basin, a similar disease burden (the HDSS/PBIDS literature covers both) and the same CoB FY2025/26 "weakest OSR" headline. That allows a fair comparison of revenue effort: Kisumu's OSR is 2,463m vs Siaya's 437m in FY2024/25 (CoB), on different economic bases. This should be shown with GCP-based tax effort (layer L11), not as a league table.
3. **Audience.** It is the largest urban centre in the region and has the media and civil-society reach to spread Takwimu.

Runner-up: **Busia**. It is the closest structural match (rural, similar budget) and has the most complete run of OAG Executive reports (FY2018/19-2024/25). It would be the choice if the goal is a like-for-like comparison with the lowest effort. **Makueni** is the best single contrast case for PFM transparency, but it is less comparable.

## Effort estimate for Kisumu (to the Siaya "minimum evidence threshold" in docs/data-contract.md)

| Work package | Effort |
|---|---|
| Source discovery and download (KIPPRA API: ~50 docs; Parliament library OAG; county site; CoB annual 2014/15-2024/25 already held as all-county reports) | 2 days |
| History series (10 years from the held CoB annual reports: Kisumu section OCR/text; same scripts as Siaya) | 3-4 days |
| Ledger and reconciliation (county vs CoB vs OAG; expect a similar ~100+ cases) | 5-7 days |
| Audits (OAG Executive and Assembly FY2018/19-2023/24, scans, OCR, findings coding without names) | 4-5 days |
| Sector pages reusing Siaya schemas (health KDHS 2022 held; education BESB held; CSA 2024 for population/health/agriculture) | 4-5 days |
| Wards (35), boundaries (held geo files), review packs, tests, page build | 3-4 days |
| **Total** | **about 21-27 working days** for one agent plus a human review pass. Busia is about 3-4 days less (simpler structure); Makueni is similar to Kisumu |

Check before committing: Kisumu City Board and municipal accounts are reported separately and need explicit scope labels. The county's title "Kisumu City County" in documents must map to `lib/counties.js` code 42.
