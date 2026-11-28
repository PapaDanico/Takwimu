# Evidence delta manifest: Siaya (041) and Kisumu (042), 28 Nov 2026

What the owner's 28 Nov handovers (`consolidated-siaya-kisumu.md`, `kisumu-complementary-evidence.md`, `handover.md`) added to the data layer, deduplicated against `census.md`, the Kisumu register (`docs/research/kisumu-2026-11-27/kisumu-sources.json`), `data/source-library.json` and `data/source-manifest.json`. Branch `claude/evidence-siaya-kisumu`.

Rules applied: every value comes from original PDF bytes with a SHA-256, the PDF page (not the printed page), table, row and column, read by Takwimu from the text layer and, where `read_method` says so, checked against the rendered page image. Every value is "Provisional: awaiting editorial review". Conflicts sit side by side, never averaged. No review records were written (`data/reviews.json` unchanged). Kisumu rows stay held in `data/counties/kisumu/indicators.json`: Kisumu was published by Release 8 (merged into this branch), but the `indicators` kind is not in its `public_kinds`, so these records stay off the site and the leak guard now scans for them.

## 1. Totals

| | Siaya (published, `data/indicators.json`) | Kisumu (held, `data/counties/kisumu/indicators.json`) |
|---|---|---|
| New values | 117 | 176 |
| Poverty (KPR 2022 Tables 4.3-4.5, Annex A1 SEs) | 18 | 18 |
| KDHS 2022 county fact sheet | 25 (6 duplicates not entered) | 31 (one bounded "<1") |
| Water utility (WASREB IMPACT 18) | 15 | 20 |
| KIWASCO tariff targets and web claims | - | 21 (11 targets/baselines, 10 claims) |
| Statistical abstract 2024 | - (no Siaya edition after 2015) | 47 |
| Agriculture and cage culture (KNBS NAPR 2025) | 39 | 39 |
| Lake fish landings (Economic Survey 2024, 2025) | 20 (lake totals, regional) | - (lake rows belong to the regional file) |
| Conflict cases | 0 | 4 |
| Gaps recorded in the file | 3 | 4 |
| Machine cross-check (second reading) | 72 agree, 45 not checkable, 0 disagree | 103 agree, 73 not checkable, 0 disagree |

After this delta: Siaya 4,122 values in 17 datasets; Kisumu 507 values (331 published, 176 held). 0 approved.

## 2. New sources (original bytes held outside git; hashes recorded)

| Source id | Document | SHA-256 (first 12) | Where registered | Licence; commercial_reuse |
|---|---|---|---|---|
| KNBS-KPR-2022 | Kenya Poverty Report 2022 (KNBS repository) | 89bd399537c8 | manifest `knbs-kpr-2022`, library, Kisumu register `KNBS-POVERTY-2022` (was manual-download) | CC BY-NC 4.0; not_permitted |
| KNBS-ES-2024 | Economic Survey 2024 | 0d07e095289c | manifest, library | CC BY-NC 4.0; not_permitted |
| KNBS-ES-2025 | Economic Survey 2025 | c37245d6eb13 | manifest, library | CC BY-NC 4.0; not_permitted |
| KNBS-KDHS-2022-FS-SIAYA | KDHS 2022 fact sheet, Siaya | 2833644fc3e7 | library | CC BY-NC 4.0; not_permitted |
| KNBS-KDHS-2022-FS-KISUMU | KDHS 2022 fact sheet, Kisumu | 6d24d6c94175 | Kisumu register | CC BY-NC 4.0; not_permitted |
| WASREB-IMPACT-18 | IMPACT 18 (FY 2024/25) | 93c826ddcf57 | already in library (siaya-climate); Kisumu register entry added | not stated; not_stated |
| KIWASCO-TARIFF-PROPOSAL-2026 | KIWASCO proposed tariff, public consultation | 6a099e8bfcb0 | Kisumu register | not stated; not_stated |
| KIWASCO-WEB-HOME / -STORY-2026-11-28 | KIWASCO web pages (HTML snapshots) | a287e800ff61 / 44dedfa1d408 | Kisumu register `KIWASCO-WEB-2026-11-28` | not stated; not_stated |
| KNBS-CSA-KISUMU-2024 | Kisumu Statistical Abstract 2024 (KNBS copy) | 96ce5eaf9585 | Kisumu register | CC BY-SA 4.0; permitted (check each table's own source) |
| KNBS-NAPR-2025 | National Agriculture Production Report 2025 | 72a8a2f73d12 | library | CC BY-NC 4.0; not_permitted |

knbs.or.ke fails TLS from here and was not bypassed; every KNBS file came from the KNBS DSpace repository and its MD5 matched the repository checksum. `commercial_reuse` is a new field in `schemas/county-indicators.schema.json`; if a later change on `main` adds the same field elsewhere, align the vocabulary (`permitted`, `not_permitted`, `not_stated`).

## 3. Duplicates (not re-entered)

| Item | Already held | Note |
|---|---|---|
| Siaya fact sheet: basic drinking water 49, basic sanitation 35 | `siaya-climate.json` kdhs22-water-basic 48.5, kdhs22-sanitation-basic 35.0 (KDHS main report) | same survey, more decimals |
| Siaya fact sheet: skilled birth 95, basic vaccination 88, stunting 19, IPTp3 34 | `siaya-health.json` sba-2022 94.9, imm-basic-2022 88.1, stunt-2022 19.2, iptp3-2022 33.8 (KIR) | same survey |
| Siaya WASREB Table 4.1 LIA population 67,722 and served 63,443; Sibo coverage 62, population in service area and served | `siaya-climate.json` wasreb18-* | only the LIA budget and other KPIs are new |
| Kisumu abstract 2024, county-hosted copy (`KISUMU-CSA-2024`, d3f38c77) | KNBS copy (96ce5eaf) | same 255 pages, same creation date (2025-09-08), identical text layer: a re-saved copy of one edition, not a second vintage |
| Abstract Tables 1.1.1-1.1.2 (population and projections) | `data/counties/kisumu/population.json` | reused; the 1,155,551 / 1,155,574 print difference was already recorded there |
| KDHS fact sheets, KPR 2022 bytes | gap-D sweep (`D-knbs-files.tsv`) held the fact sheets; same SHA-256 | not re-acquired as new evidence |
| Handover's Adaptation Fund concept note (Kisumu 39.0%) | KPR 2022 | reproduces the same survey; not independent, not entered |
| Strathmore SAFIC AgriIntel county profiles | KNBS NAPR 2025 and GCP 2025 (primary) | secondary reproductions; primary tables entered instead |

## 4. Alternate vintages

- Lake Victoria and Lake Kanyaboli landings: Economic Survey 2024 (2019-2023) and 2025 (2020-2024) kept as separate vintages. The overlapping years 2020-2023 are identical in both editions (2023 was provisional in 2024 and is unchanged in 2025).
- Kisumu KDHS fact sheet against the Key Indicators Report: skilled birth 98 (KIR 97.9), basic vaccination 79 (78.9), stunting 9 (9.1), IPTp3 26 (25.5): the same survey rounded; noted on each value.
- KIWASCO web "Our story" cites IMPACT 17 (FY 2023/24: NRW 37.03%, coverage 93.19%, sewer 18.67%); IMPACT 18 (FY 2024/25) gives NRW 32, coverage 93. Different years, not a conflict.

## 5. Conflicts (side by side, open)

| Case | Values | Hypothesis |
|---|---|---|
| kiwasco-collection-efficiency-2024-25 (Kisumu) | IMPACT 18 100%; KIWASCO web 98%; tariff cost table 105%; tariff target table 102% | different definitions (capped KPI, arrears in collections, monthly average) |
| kiwasco-connections (Kisumu) | IMPACT 18 65,697; KIWASCO web 50,053 ("currently") | undated web text or accounts against connections |
| kisumu-piped-households-vs-kiwasco-connections | Abstract 2023: 111,565 households (all providers); IMPACT 18: 65,697 KIWASCO connections | households against connections, all providers against one utility, calendar against fiscal year |
| kisumu-immunisation-admin-vs-kdhs | Abstract 2022: 89.70% administrative full immunisation (under-ones); KDHS 2022: 79% basic antigens (12-23 months) | administrative output over a weak denominator (Kisumu Central above 100%) against a survey estimate |
| KeFS county landings against Economic Survey lake total (not entered) | ES 2019-2023: 90,743; 88,223; 94,349; 86,394; 70,313 t. Handover's KeFS county sums: 92,759; 90,244; 96,367; 88,416; 72,276 t | KeFS side unverifiable (no bytes). Hypothesis: about 2,000 t a year of scope difference (another water body or riverine/dam catch counted in the county table) or a revision; in 2024 the ES total (67,575) equals the handover's five-county sum. Recorded as gap `gap-kefs-vs-es-lake-total` |

Source errors flagged (kept as printed, not corrected): Kisumu abstract Table 3.1.4 Nyakach 2019 = 133,408 households (other years about 13,700-14,500; the county total 223,073 carries the error); Table 2.1.2 "Gross County Product per capita" row labelled "Constant Prices (KSh Million)" (confidence 1). Siaya Lake Kanyaboli 2024 = 14.0 t against 84.3 t in 2023 (provisional; no reason printed).

## 6. Rejected or not entered

| Item | Reason |
|---|---|
| KeFS Fisheries Annual Statistics 2024, Table 3 and Figure 6 (60 county rows in the handover) | publisher TLS: kefs.go.ke sends only its leaf certificate and that certificate expired on 2026-09-14; not bypassed. No Internet Archive snapshot; no other copy found. Not one KeFS value is entered. |
| Handover "Headcount SE (Annex A1)" | entered, but with a caution: the printed SEs repeat across counties (2.27 for Siaya and Nyeri; 2.42 for Kisumu, Vihiga, Kisii, Nyamira), so they may be computed above county level |
| Mapping Poverty Report (Seme 59.7%, Muhoroni 26.0%, 445k poor) | only an unofficial fliphtml5 copy (HTTP 403 to automated clients); quarantined (`gap-kpr-mapping-poverty-kisumu`); never combined with KCHS 478k |
| Derived figures in the handover (combined Siaya+Kisumu headcount 38.68%, combined landings, shares of the five-county total) | Takwimu arithmetic on rounded or unverified inputs; not entered as values |
| Abstract tables excluded for privacy | 1.2.5, 1.2.7 (staff by ethnicity), 3.1.22, 3.1.23, 1.5.10, 2.8.1: small cells or group records |
| prototypes.chemuagencies.com "KMFRI" pages | vendor prototypes, untrusted; excluded |

## 7. Statistical abstracts

- Kisumu 2024: all 219 tables have a disposition in `abstract-dispositions-kisumu-2024.md` (imported 7, reused 3, duplicate 9, not extracted for privacy 6, pending fiscal reconciliation 12, not relevant 10, pending 172). The 219 found on their pages equal the 219 in the abstract's own list of tables.
- Siaya 2024: does not exist in the KNBS repository (Siaya editions: 2015 only) and none was found by web search (`gap-siaya-statistical-abstract-2024`). The 2015 edition is held and used.

## 8. Open gaps and dispositions (acquisition matrix)

Status words: held, partial, blocked, lead (URL recorded, document not read), not attempted (with reason). Owner of every next action: Takwimu research (this data layer) unless marked.

| Domain / item | Siaya | Kisumu | Disposition and next action |
|---|---|---|---|
| Fisheries: KeFS county landings 2013-2024 | blocked | blocked | expired TLS (above). Next: owner downloads in a browser that shows the certificate warning, or requests a copy from KeFS; then hash and read Table 3. Compare with Siaya CSA 2015 Table 6.3 (24,703 t 2013; 28,519 t 2014), which the handover's KeFS values (24,509; 28,385) do not match |
| Fisheries: lake totals 2019-2024 | held | n/a (regional) | done (ES 2024, 2025) |
| Fisheries: cage culture | held (NAPR 2024 Table 8.7) | held (NAPR 8.7; abstract 2.3.6 for 2022-2023) | 2019-2021 Kisumu cage harvest not available |
| Fisheries: KMFRI frame survey, CAS, LVFO | lead | lead | kmfri.go.ke reachable (200); catalogue pages only; next: locate the 2022 Frame Survey PDF |
| Poverty 2022 | held | held | done; small-area estimates quarantined |
| Poverty 2015/16 and 2021 | partial (2015/16 in history.json; 2021 report not found) | partial (register values) | next: KNBS repository search for the 2021 Kenya Poverty Report |
| KDHS 2022 county | held (fact sheet + KIR + main report) | held (fact sheet; KIR values in gap D) | next: main-report county tables with confidence intervals for the "<1" value |
| Water: WASREB IMPACT 18 | held | held | next: IMPACT 17 and earlier editions for a series; final gazetted KIWASCO tariff (not found) |
| Water: KIWASCO claims | n/a | held as claims | conflicts open |
| Water: LVSWWDA projects (W01), KES 48bn plan (W02) | lead | lead | pages reachable (200); announcements, not allocations; next: strategic plan, contracts and completion certificates |
| Urban: KISIP2 | n/a | lead | kisip.go.ke timed out twice (28 Nov); Kenya News Agency article reachable (claim of KES 1.3bn, six settlements); World Bank financial report PDF reachable (37 MB, not read) |
| Agriculture: crops | held (maize, sweet potato, cassava 2020-2024; sugar by factory) | held (same; rice and sorghum per AFA Yearbook not acquired) | next: AFA Yearbook 2025 tables 63, 69, 71 |
| Economy: GCP | held (siaya-economy.json) | held in gap D (not in a Kisumu data file) | Kisumu GCP file belongs to the phase-2 session's sector pages |
| Fiscal: CoB FY 2019/20 | gap A (done) | gap A (done) | not repeated |
| Fiscal: abstract revenue and spending tables (2.1.3-2.1.6, bursaries) | n/a | pending | compare with the Kisumu fiscal ledger before entry |
| Governance: Siaya ADP 2025/26 participation report | lead | n/a | the county page announces it but attaches no report; next: request the report |
| Governance: Kisumu Assembly participation policy, 6 Jun 2023 notice | n/a | blocked | kisumuassembly.go.ke serves a bot challenge ("One moment, please..."); not bypassed |
| Academic (Simiyu 2019, Sifuna 2014, Othoo 2020, delegated management 2025) | n/a | lead | DOI pages reachable except Taylor & Francis (403); metadata only; not appraised; site studies, never county estimates |
| Social media | lead | not attempted | official Siaya accounts found by reciprocal links on siaya.go.ke (X `siayacounty1`, Facebook, YouTube `@countygovernmentofsiaya1468`, TikTok `@siayacounty`); no individual post inspected (platforms need JavaScript or login; no login used). Kisumu official links not reachable (assembly bot challenge). Roles only, no personal data |
| Demography, health beyond KDHS, education, social protection, gender, transport, energy, climate, environment, housing, tourism, justice | as held before this delta | abstract tables pending (see dispositions) | not attempted this round beyond the abstract; queued by priority |

## 9. Access log (28 Nov 2026)

| Address | Result |
|---|---|
| https://kefs.go.ke/sites/default/files/2025-07/Fisheries%20Annual%20Statistics%202024.pdf | TLS: incomplete chain; with the issuer's intermediate, certificate expired (notAfter 2026-09-14). Not bypassed |
| https://archive.org/wayback/available (KeFS PDF) | no snapshot; web.archive.org CDX connection reset |
| https://www.knbs.or.ke/ (all) | TLS fails (as in gap D); KNBS repository used |
| https://kiwasco.co.ke/, /about-us/our-story/ | 200; HTML snapshots hashed |
| https://wasreb.go.ke/ (IMPACT 18, KIWASCO tariff) | 200 PDF |
| https://www.kisumu.go.ke/wp-content/uploads/FINAL-KISUMU-CSA-2024.pdf | 200 PDF (duplicate edition) |
| https://kisumuassembly.go.ke/ (three addresses) | 200 with a bot-challenge page; not bypassed |
| https://kisip.go.ke/, https://www.kisip.go.ke/ | timeout |
| https://doi.org/10.1080/00220388.2025.2462031 | 403 |
| https://fliphtml5.com/pqhnt/Mapping-Poverty-Report-in-Kenya/148/ | 403 |
| LVSWWDA, GAA, KNA, World Bank, Siaya county pages, KMFRI, Adaptation Fund, MyGov, SAFIC, PMC, PubMed | 200 |

## 10. Files changed

- New: `schemas/county-indicators.schema.json`, `data/indicators.json`, `data/counties/kisumu/indicators.json`, `scripts/test-indicators.js` (in `npm run validate` and `npm run build`), `docs/research/kisumu-handover-2026-11-28/abstract-dispositions-kisumu-2024.md`, this file.
- Wired: `lib/county-registry.js` (kind `indicators`), `lib/county-review.js`, `lib/county-pages.js` (page counts cover public kinds only), `scripts/county-leaks.js` and `scripts/test-unpublished-counties.js` (sentinels for held indicator records), `lib/review-status.js`, `lib/review-pack.js`, `lib/siaya-topics.js` (catalogue `siaya-indicators`), `scripts/build-data.js` (publishes `indicators.json`), `scripts/test-reviews.js`, `schemas/reviews.schema.json`.
- Page: `app/counties/siaya/people/` poverty section shows the 2022 estimates through the review mask (the old "no recent figure" line was wrong after this delta); `data/history.json` poverty gap text updated without values.
- Regenerated: review packs, machine checks, review queue, research deliverables, report PDFs.
