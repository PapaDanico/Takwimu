# Research findings, 21 Nov 2026: Siaya gaps (CoB FY 2019/20, audit opinions FY 2014/15 to 2018/19, CoB FY 2025/26)

Research-only note. No data files were changed. Downloads are in `/tmp/claude-0/research/`, which is not durable.

How each figure was read:
- **Text** means the PDF's own text layer, read with `pdftotext -layout`.
- **OCR-layer** means a scanned PDF that already carried its own (noisy) OCR text.
- **RapidOCR** means I re-read the page image with `rapidocr_onnxruntime` at 160 to 200 dpi, to check the OCR-layer reading.

"PDF p." is the page index in the PDF file. "printed p." is the number printed on the page.

Every value below is copied from the document. Nothing is computed or inferred unless it is labelled **derived**.

---

## Gap 3: CoB FY 2025/26 reports for Siaya (FOUND: Q1 and First Half)

### 3a. CoB Q1 FY 2025/26
- **Document:** Office of the Controller of Budget, *County Governments Budget Implementation Review Report for the First Quarter of FY 2025/26*, November 2025.
- **Where:** Parliament library item `ab833cdf-9648-4688-96c0-030fe6e0e995`, uploaded 2026-02-19.
  - Item: https://libraryir.parliament.go.ke/items/ab833cdf-9648-4688-96c0-030fe6e0e995
  - File: https://libraryir.parliament.go.ke/bitstreams/0db2380e-ac93-4eca-8ba1-97f28c1192fc/download (497 MB, 636 pages)
- **Siaya section:** §3.38, PDF p. 525 to 536 (printed p. 479 to 490). Read with OCR-layer, checked with RapidOCR on PDF p. 525, 530 and 531.
- **Period:** 1 Jul to 30 Sep 2025.

| Figure | Value | Unit | PDF p. (printed) | Read |
|---|---|---|---|---|
| Approved budget FY 2025/26 | 12.79 | KSh bn | 525 (479) | RapidOCR |
| of which development | 5.82 (45%) | KSh bn | 525 (479) | RapidOCR |
| of which recurrent | 6.97 (55%) | KSh bn | 525 (479) | RapidOCR |
| FY 2024/25 budget, as stated in this report | dev 4.87, rec 6.07; increase 1.85 (17%) | KSh bn | 525 (479) | RapidOCR |
| Budgeted equitable share | 7.75 (60%) | KSh bn | 525 (479) | RapidOCR |
| Budgeted additional allocations | 962 (8%) | KSh m | 525 (479) | RapidOCR |
| Cash balance b/f from FY 2024/25 | 961 (8%) | KSh m | 525 (479) | RapidOCR |
| Budgeted OSR | 3.11 (24%) | KSh bn | 525 (479) | RapidOCR |
| Total available revenue, Q1 | 2.38 (Q1 FY 2024/25: 2.99) | KSh bn | 525 (479) | RapidOCR |
| Equitable share received, Q1 | 1.24 | KSh bn | 525 (479) | RapidOCR |
| OSR collected, Q1 (incl. FIF) | 178, of which FIF 129 and other OSR 49 | KSh m | 525, 528 (479, 482) | RapidOCR / OCR-layer |
| OSR as share of annual target | 6% | % | 528 (482) | OCR-layer |
| Revenue arrears | 189 at 1 Jul 2025, 332 at 30 Sep 2025 | KSh m | 529 (483) | OCR-layer |
| Exchequer issues approved | 712, all recurrent | KSh m | 529 (483) | OCR-layer |
| Expenditure | 712 recurrent; development 0 | KSh m | 529 (483) | OCR-layer |
| Recurrent expenditure as share of annual recurrent budget | 10% | % | 529 (483) | OCR-layer |
| Trade payables at 1 Jul 2025 | Executive 1,889,967,165 (dev 832,926,758, rec 1,057,040,407); Assembly 39,285,727; total 1,929,252,892 | KSh | 530 (484) Table 3.436 | RapidOCR |
| Trade payables at 30 Sep 2025 | Executive 1,889,967,165; Assembly 81,847,158; total 1,971,814,323 | KSh | 530 (484) | RapidOCR |
| Payables settled in Q1 | none | | 530 (484) | RapidOCR |
| Revised budget, Executive (Table 3.439) | 11,432,108,630 (rec 6,194,657,987, dev 5,237,450,643) | KSh | 531 (485) | RapidOCR |
| Revised budget, Assembly (Table 3.439) | 1,361,231,048 (rec 779,893,500, dev 581,337,548) | KSh | 531 (485) | RapidOCR |
| Expenditure Q1 (Table 3.439) | Executive 654,871,759; Assembly 57,525,884 (all compensation of employees) | KSh | 531 (485) | RapidOCR |
| Absorption Q1, total | Executive 6%, Assembly 4% | % | 531 (485) | RapidOCR |

Notes on the Q1 report:
- The page that opens §3.38 (PDF p. 525) begins with the previous county's issues, including a "Kshs.345.51 million" trade-payables figure. That figure is **not** Siaya's.
- In Table 3.439, the recurrent-absorption cells do not align cleanly in OCR. Only the "Total" row (6% / 4%) is reliable.

### 3b. CoB First Half FY 2025/26 (Part II)
- **Document:** OCoB, *County Governments Budget Implementation Review Report, First Half of FY 2025/26*, February 2026, Part II.
- **Where:** Parliament library item `b78c5768-fc91-4c90-ae0f-d45ae647dc17`.
  - Item: https://libraryir.parliament.go.ke/items/b78c5768-fc91-4c90-ae0f-d45ae647dc17
  - File: https://libraryir.parliament.go.ke/bitstreams/5b326a68-4c12-43ef-bdb7-0bc2762a1b0d/download
- **Caution on the label:** the library catalogues this file as "First Nine Months ... Part II". Every page footer reads "FIRST HALF OF FY 2025/26, FEBRUARY, 2026". I treat it as the First Half report.
- **Siaya section:** §3.38, PDF p. 218 to 233 (printed p. 593 to 608). Read with RapidOCR.
- **Period:** 1 Jul to 31 Dec 2025.

| Figure | Value | Unit | PDF p. (printed) |
|---|---|---|---|
| Approved budget and its composition | Same as Q1: 12.79 bn; dev 5.82; rec 6.97 | KSh bn | 218 (593) |
| Revenue in H1 | 4.48 (H1 FY 2024/25: 5.62) | KSh bn | 218 (593) |
| Equitable share received | 3.21 | KSh bn | 218 (593) |
| OSR collected (incl. FIF) | 302, of which FIF 220 and other 82 | KSh m | 218 (593) |
| OSR vs H1 FY 2024/25 | 302 vs 295 (+2%); 9.7% of annual target | KSh m | 221 (596) |
| Table 3.560 grand total | Annual budget 12,793,339,678; actual receipts 4,482,704,620 | KSh | 220 (595) |
| Revenue arrears at 31 Dec 2025 | 953,730,353 (FIF 287 m, OSR 45 m, equitable share 620 m) | KSh | 222 (597) |
| Exchequer issues approved | 2.7 bn (dev 351 m, rec 2.4 bn) | KSh | 223 (598) |
| CRF cash balance at 31 Dec 2025 | 651 | KSh m | 223 (598) |
| Total expenditure | 2.5 bn (dev 320 m, rec 2.2 bn); 92% of releases | KSh | 223 (598) |
| Development spending as share of annual dev budget | 6% | % | 223 (598) |
| Recurrent spending as share of annual rec budget | 32% | % | 223 (598) |
| Trade payables at 1 Jul 2025, as stated here | Executive 1.88 bn; Assembly **72 m** | KSh | 223 (598) |
| Payables settled in H1 | Executive 310 m (rec 252, dev 58); Assembly 16 m | KSh m | 223 to 224 (598 to 599) |
| Outstanding payables at 31 Dec 2025 | Executive 1.57 bn; Assembly 56 m; table total 1,636,142,187 | KSh | 224 (599) |
| Expenditure, Executive (Table 3.565) | 2,219,281,707 (CoE 1,647,766,074.99; O&M 250,666,354.62; dev 320,849,277.28) | KSh | 225 (600) |
| Expenditure, Assembly (Table 3.565) | 327,063,139 | KSh | 225 (600) |
| Absorption H1, Executive | total 19.41%; recurrent 30.65%; CoE 50.65%; O&M 8.52%; dev 6.13% | % | 225 (600) |
| Absorption H1, Assembly | total 24.03%; recurrent 41.94% | % | 225 (600) |
| Compensation-to-revenue ratio | 40% | % | 225 (600) |

**Conflict inside CoB reports:** the opening County Assembly payables are 39,285,727 in the Q1 report (Table 3.436) but "Kshs.72 million" in the First Half text. Show both.

### 3c. Later FY 2025/26 reports
**Not found for Siaya.** The CoB annual *County Government Budget Implementation Review Report for the Financial Year 2025-2026*, August 2026, is item `99f48395-0710-4a74-bcdf-e4ea40812813`. Only **Part 1** is in the library: file `18137d92-…`, 486 pages, covering §3.1 to about §3.26. Its contents list puts Siaya at §3.38, printed p. 713, which is in the missing Part 2. Searches for Part 2 found nothing.

Lead only (a county document, not CoB): siaya.go.ke has *Budget Implementation Report For 4th Quarter Ending June 30th 2026*, at https://siaya.go.ke/wp-content/uploads/2026/09/Budget-Implementation-Report-For-4th-Quarter-Ending-June-30th-2026.pdf. I did not download or read it.

---

## Gap 1: CoB annual CBIRR FY 2019/20 (NOT FOUND; partial figures from other primary documents)

The CoB annual FY 2019/20 county report is not in the Parliament library. The DSpace searches that failed were "County Governments Budget Implementation Review Report 2019/2020", "… FY 2019-20" and "Annual … FY 2019-2020". cob.go.ke returns 503 to both curl and WebFetch.

Documents found and what they give:

### 1a. Senate report on the CoB FY 2019/20 county report
- **Document:** Senate, *Report on the County Governments' Budget Implementation Review Report for Financial Year 2019/20*, April 2021, tabled May 2021.
- **Where:** item https://libraryir.parliament.go.ke/items/a33fe8b9-af9a-4519-a135-cc80521756ea; file https://libraryir.parliament.go.ke/bitstreams/26d14638-fa4c-46c3-ac6f-3a410a2985ec/download (64 pages, scanned, read with RapidOCR on every page).
- **Siaya content:** Siaya is named only once as a figure-free statement. It is among seven counties whose FY 2019/20 OSR was below 50% of the annual target (PDF p. 19 and 27). There are no Siaya amounts.

### 1b. CoB *Annual CBIRR FY 2020/21*, September 2021, with FY 2019/20 comparison figures
- **Where:** item https://libraryir.parliament.go.ke/items/79eb8b51-0c86-4077-aceb-e1e762cce44c; file `fa13464d-84c7-492c-a336-b65c902ddfbe` (570 MB). Siaya §3.39 is at PDF p. 372 to 381. Read with RapidOCR.

| Figure | Value | Unit | PDF p. |
|---|---|---|---|
| OSR, FY 2019/20 (CoB) | 179.43 | KSh m | 374 |
| Balance b/f from FY 2019/20, FY 2020/21 Table 3.215 | budgeted 1,235,985,311; actual 1,186,274,440 | KSh | 373 |
| Outstanding employee statutory deductions at close of FY 2019/20 | 316,860,039 | KSh | 375 |
| COVID-19 funds b/f from FY 2019/20 | 140.28 | KSh m | 375 |

### 1c. CoB *CBIRR First Half FY 2020/21*
- **Where:** item https://libraryir.parliament.go.ke/items/f8bd1f52-a92c-4012-a04a-ae528af00862; file `8248551a-…`. Siaya §3.38 is at PDF p. 318 to 325 (printed p. 295 onward). Read with RapidOCR.
- **Figure:** balance b/f from FY 2019/20 is **1,840,119,055** KSh (PDF p. 319).
- **Conflict:** this does not match the 1,186,274,440 in the FY 2020/21 annual (1b). Show both.

### 1d. Siaya County Treasury, *Budget Review and Outlook Paper FY 2019/2020*, September 2020
- **Source type:** a county document, not CoB. Use it alongside CoB, not in place of it.
- **Where:** https://siaya.go.ke/wp-content/uploads/2026/08/County-Budget-Review-and-Outlook-Paper-2019_2020.pdf. Read from the text layer.

| Figure | Value (KSh) | PDF p. |
|---|---|---|
| Original budget | 9,223,350,139 | 11 |
| Supplementary (final) budget | 8,881,773,924 (cut of 341,576,215) | 11 |
| Total receipts | 8,101,687,729 | 11 |
| Expenditure, total (Table 9) | 6,814,847,783 | 20 |
| Expenditure, compensation of employees | 2,808,812,405 | 20 |
| Expenditure, O&M | 1,851,030,140 | 20 |
| Expenditure, recurrent total | 4,659,842,545 | 20 |
| Expenditure, development | 2,155,005,238 | 20 |
| Budget lines (Table 9) | recurrent 4,899,616,267; CoE 2,926,638,524; O&M 1,972,977,743; development 3,982,157,657 | 20 |
| Absorption (Table 9) | CoE 96%; O&M 94%; recurrent 95%; development 54%; total 77% | 20 (also summary, p. 6) |
| OSR | target 420,000,000; actual 184,249,748 (43.87%) | 15 (also p. 6) |
| Un-budgeted pending bills paid | 324,825,486 | 20 |

**Conflict:** OSR for FY 2019/20 is 179.43 m per CoB (1b) and 184,249,748 per the county BROP (1d). Show both.

### 1e. Pending bills FY 2019/20, from the audited financial statements
- **Source:** Auditor-General's FY 2019/20 basis item 5.0, as reproduced in the Senate CPAC report (see 2f).
- **Figures:** Kshs.222,333,808 at 30 June 2020, down from Kshs.386,787,728 at 30 June 2019 (cpac PDF p. 523).
- **Caveat:** this is the audit figure, not the CoB figure.

**Still missing for gap 1, all CoB FY 2019/20 Siaya figures:**
- approved budget and its recurrent/development split
- expenditure (total, recurrent, development)
- absorption rates
- OSR target
- pending bills

---

## Gap 2: Auditor-General opinions, County Executive of Siaya

| FY | Opinion | Source and how read | Status |
|---|---|---|---|
| 2014/15 | **Adverse** ("Adverse Opinion") | Senate CPAIC, *Annexes to Fiduciary Report* (Nov 2018), table "Summary of audit querries for 2014/2015", Siaya row, PDF p. 4, text layer. https://www.parliament.go.ke/sites/default/files/2018-11/Annexes%20to%20Fiduciary%20Report.pdf | Senate compilation of AG opinions; AG report itself not retrieved. **Caveat:** the main fiduciary report (p. 12, Trend in County Audit Opinions) says the 2014/15 opinions were "CA/CE Combined", so this may be a combined Executive and Assembly opinion. |
| 2015/16 | **Qualified** | Same annex, table "County Executives Fiduciary Risks 2015/2016", Siaya row 38, PDF p. 2, text layer | Senate compilation; AG report not retrieved |
| 2016/17 | Not confirmed. Lead: "Adverse Opinion" | Lead only: National Taxpayers Association, *Citizen led analysis of County Executives' Auditor General Reports 2016/2017*, PDF p. 41 to 42. https://www.nta.or.ke/wp-content/uploads/2024/04/Summary-of-County-Executive-Reports-Chambua-compressed.pdf | Civil-society summary, **not primary** |
| 2017/18 | Not found | | |
| 2018/19 | Not found | | |

Amounts in the 2015/16 Siaya row (KSh millions, same annex, PDF p. 2):
- irregular procurement 72.63
- under-expenditure 131.18
- pending bills 1,153.98
- unsupported expenditure 392.32
- unaccountable expenses 14.30
- under-collection of revenue 7.30
- outstanding imprest 31.12
- irregular payments 101.74
- others 7,094.01
- equitable revenue allocation 5,302.21

Amounts in the 2014/15 Siaya row (KSh millions, PDF p. 4): 1,468 / 24 / 1,319 / 158 / – / 36 / 90 / 94 / 325; total queried 3,513; revenue share 5,012.
- The column headers for this row are misaligned in the text layer, so I cannot assign these values to columns.
- These are query amounts, not the AG's "basis for opinion" paragraphs.

**Extra, outside the requested years: FY 2019/20 = Qualified.**
- **Document:** Senate CPAC, *Reports of the Auditor General on the Financial Statements of … Siaya … County Executives 2019-2020*, Feb 2024, Chapter Twelve, PDF p. 504 and 517, text layer. Item https://libraryir.parliament.go.ke/items/6533ab5f-fd9c-4570-ad59-922be3bb9ba1
- **Basis items, as reproduced in the report (PDF p. 517 to 523):**
  1. Unsupported negative adjustment to budgeted exchequer releases: final budget 8,106,977,580, reached after an unexplained cut of 341,576,215.
  2. Fixed assets: additions variance 181,547,678; comparative-balance variance 3,769,527,365; 2.0 ha of land worth 2,000,000 not in the register.
  3. Compensation of employees: variance of 36,495,000.
  4. Transfers to other government units: 858,267,464 reported against 1,082,246,513 in the schedules (variance 223,979,049).
  5. Pending bills: 222,333,808 with anomalies, including 59,524,524 not supported by certificates.

**AG originals exist but were not reachable:** archive.org's availability API returned HTTP-200 snapshots for these files:

| AG file | Snapshot timestamp |
|---|---|
| https://www.oagkenya.go.ke/wp-content/uploads/2021/09/County-Executive-of-Siaya-2016-2017.pdf | 20250810165656 |
| https://www.oagkenya.go.ke/wp-content/uploads/2021/09/County-Executive-of-Siaya-2017-2018.pdf | 20260510013006 |
| https://www.oagkenya.go.ke/wp-content/uploads/2022/09/County-Executive-of-Siaya-2018-2019.pdf | 20260417115814 |
| https://www.oagkenya.go.ke/wp-content/uploads/2022/01/County-Executive-of-Siaya-2019-2020.pdf | 20250714170129 |

web.archive.org itself is blocked from here: the proxy reports "ws_closed_mid_exchange", and WebFetch says it cannot fetch the domain. Downloading these four PDFs from a machine with Wayback access is the fastest way to close gap 2 for 2016/17 to 2018/19.

The Senate CPAIC *County Executive Reports 2015-2018* Vols 1 to 3 (parliament.go.ke/sites/default/files/2021-03/…) now return 404. They also have Wayback snapshots from 20221023, equally unreachable from here. They are a second route.

---

## Failed attempts (do not repeat blindly)
- **Parliament library DSpace searches** found no Siaya County Executive AG report for FY 2014/15 to 2019/20. It has FY 2013/14, 16-month 2014, and FY 2021 to 2025 reports; the FY 2025 report is item a8d4bb86-….
- **CPAIC volumes in DSpace** for FY 2014/15 (Vol 2) and 2015 to 2018 (Vols 1 and 2) do not include Siaya.
- **oagkenya.go.ke:** 503.
- **cob.go.ke:** 503 to curl and WebFetch.
- **web.archive.org:** blocked by the proxy. The archive.org availability API does work, and the CDX API returned nothing.
- **kiambuassembly.go.ke file 239**, "Quarter 4 Consolidated County Budget Implementation Review Report FY 2019-20": downloaded, but it is Kiambu's own Q4 financial statements, not CoB.
- **Senate CPAIC Volumes I and II (Nov 2018)** cover FY 2013/14 only, and Siaya is not in them.
- **IBP "10 key questions" (2019):** no Siaya content.
- **siayaassembly.go.ke:** the media and search APIs show no AG or CoB report files.
