# Siaya County source sweep (27 Nov 2026)

Scratchpad research only. Nothing here is in the repo, committed or deployed. Machine-readable list: `siaya-new-sources.json` (138 records; 135 new, 3 turned out to be already held by hash). Downloads are in `dl/<id>/file.pdf` (one directory per file, never executed). SHA-256 values are of the file as received and are listed in `siaya-new-sources.json` and `downloads.tsv`.

Method: I compared everything against `data/source-library.json` (137 documents), the SHA-256 values cited in `data/*.json` and `docs/`, and the source ids used in `data/siaya-*.json`. Search tools used: WebSearch, the KIPPRA DSpace API, the Parliament library DSpace API, the OpenAlex API and curl for specific files. WebFetch was tried for KNBS and OAG, and both returned HTTP 503.

## 1. Headline findings

| # | Finding | Effect on Takwimu |
|---|---|---|
| 1 | The **KIPPRA repository holds the Siaya County Treasury planning and budget set for 2014-2026**: CBROP 2014-2023 (10), CFSP 2014 and 2016-2025 (11), PBB 2014/15-2025/26 except 2017/18 (11), ADP 2015/16-2025/26 (11), CIDP 2013-17 and 2018-22, plus a youth agribusiness strategy: 46 documents, all with a text layer (no OCR needed). 43 are new to Takwimu; 3 matched hashes already in the repo. | A county-side series for every year of the 10-year window. Departmental budget data (PBB) exists for the first time. |
| 2 | The **Auditor-General's Receiver of Revenue statement FY2024/25** (Parliament library, scanned, OCR done) has an audited 12-year OSR table, FY2013/14-2024/25 (PDF p.10, source County Treasury). | A third OSR series. It explains the FY2024/25 OSR dispute: cash receipts are 757.63m, accrual "total revenues" are 948.12m, and CoB reports 436.68m. |
| 3 | **CBROP 2019 (p. "Review of FY 2018/19") prints "Kshs 844,302,787 conditional allocations"**. | Independent second reading of **L077** (CoB 844.302787m). The holdout can be closed as "corroborated by a second document" once a person confirms the page image. |
| 4 | **OAG County Revenue Fund FY2024/25** shows exchequer receipts of 7,301,472,443 and transfers from other government agencies of 111,448,420.90, with KSh 1.289bn released in June 2025. | Evidence for the open cases `equitable_share_received` / `conditional_grants_received` FY2024/25. The conditional-grant value supports CoB/Q4 (111) over the CBROP (276.86). |
| 5 | Parliament library has **about 95 Siaya OAG items**: Receiver of Revenue FY2021/22-2024/25, CRF FY2021/22 and 2024/25, a special payroll audit (July 2025), 10 Level-4 hospitals, the referral hospital, 2 municipalities, 6 county funds and 3 Senate CPAC/CPIC reports from 2026. | Health FIF layer, OSR-by-stream layer, and oversight follow-up for `siaya-audits.json`. |
| 6 | The OAG site has the **County Executive and Assembly reports for 2017/18 and 2018/19** at stable URLs, but it returns HTTP 503 (bot challenge). | These would fill the audit-opinion gap for FY2016/17-2018/19. They need a browser download by a person. |
| 7 | KNBS (poverty 2021/2022, KPHC Vol II, Facts & Figures 2026, Statistical Abstract 2023) could not be fetched: the TLS chain is incomplete via the proxy and WebFetch got 503. Only the 2015 Siaya county statistical abstract exists; no later Siaya edition was found. Kisumu and Homa Bay do have 2024 editions. | KNBS needs a manual download. Poverty after 2015/16 stays a listed gap until then. |

## 2. New items by tier (new only)

| Tier | Count | Downloaded | Link only |
|---|---|---|---|
| Primary official (county budget/planning, OAG, Senate, CoB, KNBS, MoA, CRA, KMD, NDMA) | 85 | 50 (45 county docs incl. 2 CAF copies + 5 OAG/Senate) | 35 |
| Official secondary (PBO Devolution Budget Watch, Bajeti Yetu, CRA fact sheet) | 3 | 1 (PBO) | 2 |
| Academic / official secondary research (KIPPRA policy briefs and discussion paper) | 8 | 8 | 0 |
| Academic (peer-reviewed, OpenAlex/DOI) | 24 | 0 | 24 |
| Media claims (to verify) | 15 | 0 | 15 |
| **Total new** | **135** | **59 new downloads** (+3 already held, +6 Part B files) | 76 |

## 3. Official statistics and finance: what is new

### 3a. County Treasury documents (all downloaded, text layer, KIPPRA host; licence: county copyright, cite, do not redistribute)

| Series | Years now in hand | Missing (searched, not found) | Feeds |
|---|---|---|---|
| CBROP | 2014, 2015, 2016, 2017, 2018, 2019, 2021, 2022, 2023 (new); 2020 already held | CBROP 2024 (Sept 2024, reviews FY2023/24). CBROP 2025 is held as GOV-03 | `history.json` alternates, ledger county-side values, OSR by stream |
| CFSP | 2014, 2016-2025 (KIPPRA); 2025 also on CAF (different file, 54 vs 40 pp) | CFSP 2015, CFSP 2026 (public participation held as GOV-05, document not found) | ceilings, prior-year actuals, pending-bills annexes (2024, 2025) |
| PBB / approved estimates | 2014/15, 2015/16, 2016/17, 2018/19-2025/26 | 2017/18 and 2026/27. The KIPPRA "ADP 2026/2027" record wrongly holds the PBB 2025/26 file | **new dataset: budget by department/programme**. FY2019/20 PBB gives a total of 6,808,544,467 original and 8,881,773,924 supplementary (fills part of the FY2019/20 gap, county side) |
| ADP | 2016/17-2017/18, 2019/20-2025/26 new (2015/16 and 2018/19 held) | ADP 2026/27 | `siaya-projects.json`, ward project lists, population projections |
| CIDP | 2013-2017, 2018-2022 | CIDP 2023-27 mid-term review (not online) | targets over three plan cycles |

### 3b. Auditor-General, Senate, CoB, PBO

| ID (json) | Document | Period | Status | Adds |
|---|---|---|---|---|
| OAG-ROR-2024-25 | Receiver of Revenue statements, qualified opinion | FY2024/25 + 12-yr table | downloaded, OCR | OSR receipts 757.63m vs target 1,044.06m; hospital fees 643.17m (FIF 199.84m, Linda Mama 6.34m, NHIF/SHA 436.99m); 16 streams, 1 met target |
| OAG-ROR-2023-24 | Receiver of Revenue statements, qualified | FY2023/24 | downloaded, OCR | receipts 610,364,012 (hospital fees 382.07m); FY2022/23 501.56m |
| OAG-CRF-2024-25 | County Revenue Fund, qualified | FY2024/25 | downloaded, OCR | exchequer 7,301.47m; other agencies 111.45m; June releases 1,289.01m |
| OAG-SPECIAL-PAYROLL-2025 | Special audit, payroll management, County Executive | July 2025 | downloaded (part text) | wage-bill control findings (findings only, no names) |
| SENATE-CPIC-...-2024-25 | Senate CPIC on water company, municipalities, hospitals, funds | FY2024/25 | downloaded, OCR | water company going-concern uncertainty; municipal autonomy; hospital FIF accounting |
| PBO-DEVOLUTION-BUDGET-WATCH-2025 | Parliamentary Budget Office | FY2024/25-2025/26 | downloaded, text | all-county allocations and OSR, a cross-check for CoB |
| PARL-* (16 records) | RoR FY2021/22-22/23, CRF FY2021/22, hospitals x10, referral hospital, municipalities x2, bursary/emergency/climate/liquor/car-loan funds, Senate CPAC FY2024/25 vols 2-3, CPAC FY2019/20-20/21 | FY2017/18-2024/25 | link only (scans, 12-387 MB) | FIF and OSR by stream; Assembly opinions FY2019/20-20/21 |
| OAG-SITE-* (3) | Executive 2017/18, 2018/19; Assembly 2017/18 | FY2017/18-18/19 | link only (503) | fills the audit-opinion gap |
| OAG-CONSOL-ASM-2024-25 | Consolidated Assemblies volume (Nairobi Assembly host) | FY2024/25 | link only | all-county opinions (Part B) |
| COB-9M-2025-26 / COB-ANNUAL-2025-26 | CoB 9-month and annual FY2025/26 | FY2025/26 | not retrieved / not found | closes the in_year gap. Q3 news says Siaya is among the weakest OSR performers |

### 3c. Statistics and sector (link only unless stated)

| ID | Source | Adds | Note |
|---|---|---|---|
| KNBS-POVERTY-2022 / 2021 | Kenya Poverty Reports (KCHS) | county poverty 2021, 2022 (extends `history.poverty`) | KNBS TLS/503 |
| KNBS-KPHC-2019-VOL2 | Census Vol II (sub-location) | sub-county/location denominators for ward equity (wards are not in the census) | Parliament copy is 330 MB |
| KNBS-STAT-ABSTRACT-2023, KNBS-FACTS-2026 | national abstract, Facts & Figures | 5-year county tables; GCP per capita 2024 (secondary report: KSh 151,968) | verify against KNBS-01 (held) |
| MOA-NAPR-2023-24-KILIMO, KILIMOSTAT-API | MoA production report (new host), crop API | county crop area/production/yield 2012-present (10-year agriculture series) | replaces the inaccessible `MOA-NAPR-2023-24` URL |
| CRA-CARA-2025 | County Allocation of Revenue Bill 2025, First Schedule | equitable share allocated FY2025/26 (allocation vs receipt) | extend to the CARA 2014-2026 series |
| NDMA-NATIONAL-DEW-2026-02 | NDMA bulletin | Siaya is non-ASAL: no county DEW bulletin, low value | record as "not applicable" gap |
| KMD-SIAYA-OND-2025 | KMD county forecasts | climate page context (forecast, not observation) | |
| TREASURY-BAJETI-YETU-41 | National Treasury county library | may hold CBROP 2024 and CFSP 2026 | connection reset, retry |

## 4. Gaps, open cases and holdouts these items address

| Target | Item(s) | What it does | Status after review |
|---|---|---|---|
| **L077** (conditional grants budgeted FY2018/19, 844.302787m) | KIPPRA CBROP 2019, review section ("Kshs 844,302,787 conditional allocations") | an independent county document prints the same value | can close as corroborated once a person checks the page image |
| **L142** (OSR FY2014/15 chart label 142.88; OCR read 142.38) | CBROP 2015 (143,403,440), RoR 2024/25 table (143,271,988) | neither matches either reading: county values are about 143.3-143.4 | still needs the page image; context only |
| **L143** (OSR FY2015/16 chart label 113.26; OCR "1T5.26") | CBROP 2016 Table 1 (135,583,664), RoR table (132,586,919 implied = 230,000,000 - 97,413,081), CoB text 127.93 | no source gives 113.26 | still needs the page image; the chart value is an outlier against 3 sources |
| OSR FY2024/25 dispute (CoB 436.68 vs county 946.9; MEDIA-01, k24) | OAG RoR FY2024/25 | audited receipts 757.63m (cash, incl. FIF/Linda Mama/SHA) and accrual revenues 948.12m (incl. receivables 189.26m) | the county's 946.9m is close to the accrual total, not to the cash figure; likely **definitional** (basis) |
| OSR target FY2024/25 (D-L156-L165, D-L156-L169) | OAG RoR FY2024/25 | audited final receipts target 1,044,061,306 = county original estimates | CoB 927.34 still unexplained |
| OSR FY2023/24 (D-L138-L145, D-L145-*) | OAG RoR FY2023/24 | audited receipts 610.36m (hospital fees 382.07m, so non-hospital OSR 228.29m) | supports 610.74 (CoB own year); 427.95 is still unexplained |
| OSR FY2019/20 (D-L131-L144) and the history.json FY2019/20 gap | RoR 2024/25 table (277,193,698.20; target 420m); PBB 2019/20 (budget 6.81bn original, 8.88bn supplementary) | third OSR value (CoB 179.43). The basis probably includes NHIF/Linda Mama | new conflict row, not a fill |
| Equitable share / conditional grants received FY2024/25 (4 open cases) | OAG CRF FY2024/25 | exchequer 7,301.47m matches CBROP 7,301.47m; other-agency transfers 111.45m match CoB/Q4 | conditional grants: the CBROP figure is probably the outlier. Equitable share needs the CRF note table |
| Pending bills (42 open cases, FY2020/21-2024/25) | CFSP 2024 and 2025 annexes (department lists); Senate CPIC 2026; OAG hospital/municipal reports | department-level payables, so the stock can be partly rebuilt | stock differences still need the Executive financial-statement annexes (held) |
| Audit opinions FY2016/17-2018/19 | OAG-SITE-EXEC-2017-18, 2018-19, ASM-2017-18 | primary documents | manual download needed |
| FY2025/26 full year | COB-ANNUAL-2025-26, county Q4 (held) | CoB side | not online yet |
| Poverty after 2015/16 | KNBS Poverty Reports 2021, 2022 | county headcounts | manual download |
| Agriculture 10-year series | KilimoSTAT API, NAPR 2023-24 | crop production by county | try the API (JSON) |

## 5. Academia (24 records; DOI, venue and use in `siaya-new-sources.json`)

The rule for all of these: contextual or secondary only, never a primary financial figure. HDSS/PBIDS results cover the Karemo/Rarieda/Gem/Asembo surveillance area, not the whole county.

| Theme | Strongest items (year, venue) | Usable figures? |
|---|---|---|
| HIV | Borgdorff et al. 2018 Lancet HIV (HDSS incidence); fishing communities 2019 PLoS ONE; DREAMS impact 2021 PLoS Med | yes, contextual, labelled with site and age group |
| Malaria and child mortality | Sultana 2019 BMJ Open (prevalence trends); Malaria J 2018 (inequality; HDSS mortality); Malaria J 2023 (child malaria mortality); CHAMPS 2020 Lancet GH | yes, contextual |
| Surveillance and data access | ALPHA network 2016 IJE; PBIDS excess mortality 2023 PLOS GPH (HDSS-2012 profile already held) | access route; no figures |
| Health financing | Afya credits CCT effectiveness (BMJ Open 2022) and economic evaluation (PLOS GPH 2022); spatial equity in maternal care (ESJ 2018) | contextual; programme register |
| Devolution and PFM | Water governance 2018 (J. Middle East & Africa); ECDE devolution 2017; budget utilisation in Nyanza 2023 (uses CoB data); e-revenue 2025 | no (qualitative or secondary of CoB) |
| Agriculture, fisheries, Yala | cage culture 2017 (Aquaculture Research); Yala wetland 2021/2022; sorghum 2020; COVID farm shock 2023 World Dev; drought and crops 2025 | contextual; trace any rainfall/crop data to KMD/MoA |
| KIPPRA briefs (downloaded) | PB47 child/youth/women budgeting 2014/15-2017/18; Budgets for Impact (child poverty) 2025; Public Affairs Index 2021/22; labour productivity 2024; MSE business environment 2019, 2021, 2024 | official secondary; check each figure against the primary document |

## 6. News and official accounts (claims to verify; 15 records)

No personal data. People are named by role only, and no verdict labels are used. Primary-document status is in `primary_backing`.

| Date | Outlet | Claim (short) | Primary backing |
|---|---|---|---|
| 2025-09 | Nation, Standard, KNA, K24 | CoB: Siaya had the lowest OSR in FY2024/25 (436.68m, ~47%); county says 946.9m of 1.04bn | CoB held; OAG RoR: receipts 757.63m, accrual 948.12m, target 1,044.06m |
| 2025-09-03 | Standard | FY2025/26 budget KSh 12.7bn | PBB 2025/26 downloaded (confirm total) |
| 2025-09 | Standard | CoB: ~KSh 200m on travel; pending bills 1.12-1.3bn | CoB 2024/25 held; pending bills are already open cases |
| 2025-11 | Eastleigh Voice, Star | CoB Q1 FY2025/26: Siaya absorption 6% | cob-q1-2025-26 held |
| 2026-04 | Standard | MCAs question implementation before a supplementary budget | none online (Assembly Hansard not found) |
| 2026-05 | Nation | CoB 9 months: Siaya among the weakest OSR | CoB 9-month report (not retrieved) |
| 2026-06 | People Daily | OSR target 1.5bn; streams up from 10 to 25 of 40 | none yet; OAG lists 16 streams FY2024/25 |
| 2026-08 | Capital FM, Kenyans, AllAfrica | July-Aug 2026 salaries delayed by late FY2026/27 budget | none yet |
| 2026 | Eastleigh Voice vs People Daily | SHA owes Siaya facilities 287.47m (CoB, 31 Mar 2026) vs county: 281m claimed, 180m paid, 101m pending | **conflict**, show side by side once the CoB 9-month report is obtained |
| 2026-08-27 | Standard | Assembly approves the CEC Finance nominee | timeline only (role, not name) |

Official social accounts: no verified county X or Facebook handles surfaced in search. The National Assembly held FY2026/27 budget hearings at Siaya on 14 May 2026 (parliamentary process).

## 7. Downloads and integrity

- 59 new PDFs (45 county documents, 5 OAG/Senate, 1 PBO, 8 KIPPRA research), 3 PDFs already held (ADP 2015/16, ADP 2018/19 and CBROP 2020 matched existing hashes), and 6 Part B files. Totals: `downloads.tsv` (all attempts) and `dl-ok.tsv`.
- Text layer: all 46 KIPPRA county documents, 8 KIPPRA research papers, 2 CAF copies and PBO. Scans: all Parliament-library OAG/Senate uploads. OCR output (tesseract, 150 dpi, single thread) is in `dl/oag-ror-2024-25/ocr/all.txt`, `dl/oag-ror-2023-24/ocr/all.txt`, `dl/oag-crf-2024-25/ocr/all.txt` and `dl/senate-cpic-siaya-entities-2024-25/ocr/all.txt`. The OCR values quoted above need the same second-reading check as the repo's machine checks before use.
- Blocked: oagkenya.go.ke (503), knbs.or.ke (TLS chain, 503), bajetiyetu.treasury.go.ke (reset), ipfglobal (404), cob.go.ke (file links not exposed).
- Licences: county documents state no reuse licence. Use them as the repo already does: cite with body and page, and do not redistribute the PDF. OAG and Senate documents are public reports: cite and link.

## 8. Suggested next actions (for the repo agents, not done here)

1. Add the 45 new county documents and the 6 audit/oversight/PBO downloads to `source-library.json` and `source-manifest.json`. Check the CFSP 2025 two-version issue.
2. Ask a person to view CoB 2018/19 p.270 (L142, L143) and CBROP 2019 p.~9 (L077); then record the L077 corroboration.
3. Stage the OAG RoR 12-year OSR table as a third OSR series (basis: County Treasury, audited statements, includes hospital revenue from FY2020/21) and add conflict rows. Do not overwrite.
4. Extract PBB departmental tables (text layer) to `siaya-budget-by-department.json` (new schema and test).
5. Get KNBS poverty 2021/2022, KPHC Vol II, the OAG 2017/18-2018/19 reports and the CoB FY2025/26 annual report by manual browser download.
