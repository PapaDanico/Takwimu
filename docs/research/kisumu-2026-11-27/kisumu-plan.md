# Kisumu (042) ingest plan: dataset by dataset, mirroring Siaya

This is a plan only. Repo agents do the build after the owner approves Kisumu as the next county. Source IDs refer to `kisumu-sources.json`. Same rules as Siaya: every value carries source, publication date, period, unit, page/table and confidence. Conflicts are shown side by side. Gaps are listed, never filled. Values stay "Provisional: awaiting editorial review" until a review record exists. Roles only, no names. Contractor names are withheld.

## 0. Prerequisites (0.5 day)

- Generalise the Siaya-only files to county-keyed files (`data/kisumu-*.json`), or add a `county` key to `history.json`. The schemas in `schemas/siaya-*.schema.json` are reused by copy-and-rename, or with a county parameter. Decide this before any ingest.
- Add the held files to `data/source-library.json` (Kisumu records) and `data/source-manifest.json` (SHA-256). Reuse the 14 CoB all-county records that are already in the manifest, and do not duplicate them. Add 2 new all-county CoB records: `COB-ANNUAL-FY2025-26` and `COB-9M-FY2025-26-PART1`.
- Fix the KIPPRA year labels in the library records (see coverage §2.12).

## 1. Datasets

| Takwimu file (Siaya → Kisumu) | Sources (IDs) | Method | Expected yield | Effort |
|---|---|---|---|---|
| `history.json` → Kisumu series: budget, spend, revenue, OSR, absorption, pending bills, population | CoB annual FY2014/15-2024/25 (Kisumu section pages in coverage §1). **Reuse `counties-cob.json`** for FY2021/22-24/25 (Kisumu row, code 42; 0 nulls in 2024/25). New CoB FY2025/26 annual Table 2.5 p.44. CSA 2024 + KPHC for population | same scripts as Siaya (OCR/text by page). FY2015/16 needs tesseract (scan). FY2019/20 stays a gap until the CoB report is obtained (manual list #6); the Senate review is context only | 12 years × ~10 indicators ≈ 110 values, ~8 gaps | 3 days |
| `counties-cob.json` (all 47) | COB-ANNUAL-FY2025-26 | extend the all-county table to FY2025/26 (Table 2.1/2.5/2.9 equivalents, pp.44-58). This benefits every county page | 47 × 20 fields | 1.5 days (separate task; optional) |
| `siaya-fiscal-ledger.json` → `kisumu-fiscal-ledger.json` | CoB vs CBROP (9 years) vs CFSP prior-year actuals vs county BIRR vs OAG CRF/RoR (FY2021/22-24/25) | one row per indicator, year and source, with discrepancy cases classed as in `ledger-classes.json`. Expect ~100-130 cases. A known definitional case: OSR with or without FIF (FY2023/24 onward). Also check that the KCB credit facility/overdraft (CoB Q1 FY2025/26 p.271; FY2024/25 p.239 "borrowed 2.72bn") matches the debt strategy DOCX | ~600 values, ~110 cases | 6 days |
| `siaya-audits.json` → `kisumu-audits.json` | OAG Exec FY2013/14, 2018/19-2024/25; Assembly FY2019/20-24/25; CRF, RoR, KIWASCO (4 years each); KHRC FY2016/17 (secondary, labelled); special payroll audit 2025 | opinion per entity and year with page (coverage §1). Code findings by category (no names); management responses where present. Library OCR text layer is poor in places, so check each opinion page image (31 pages) | ~33 opinions + ~250 coded findings | 5 days |
| `siaya-budget-departments.json` → `kisumu-budget-departments.json` | PBB/approved estimates FY2015/16-2026/27 (11 years; text layer), supplementaries FY2017/18, 2021/22, 2023/24; CoB budget-by-department tables | department × year (rec/dev, original/supplementary). Kisumu has more departments than Siaya, plus the **City of Kisumu** as a department: scope label | ~12 departments × 12 years × 4 | 3 days |
| `siaya-county-series.json` → `kisumu-county-series.json` (county-side series) | CBROP 2015-2026, BIRR annual/quarterly | county-reported revenue by source and OSR by stream (Finance Acts 2023/2024/2026 for tariffs; REAP 2024-2028 for targets) | ~250 values | 2 days |
| `siaya-economy.json` → `kisumu-economy.json` | KNBS GCP 2024 and 2025 (held in repo; Kisumu rows), CSA 2024 Domain 2 (p.119-165), KIPPRA MSE briefs 2019/2021/2024, labour productivity brief | two GCP vintages side by side; GCP-based tax effort layer L11 (OSR / GCP) for the Siaya comparison, not a league table | ~60 values | 1.5 days |
| `siaya-governance.json` → `kisumu-governance.json` | IBP CBTS 2021 (held, Kisumu page), CBTS 2022 (manual #9), KIPPRA Public Affairs Index 2021/22, public participation reports (CFSP 2026, estimates 2023/24), Public Participation Policy 2023; APRM (pending) | as for Siaya; record APRM as "in progress" | ~25 values | 1 day |
| `siaya-health.json` → `kisumu-health.json` | KDHS 2014 and 2022 (repo; Kisumu county rows), CSA 2015 and 2024 (Domain 1), NTLD 2023 (repo), NSDCC poster (to fetch), OAG hospital FIF reports (L, 45), CoB health-facility FIF tables (FY2024/25 Table 3.203 p.246; FY2025/26 Table 3.262 p.361) | survey estimates with CIs. Academic HDSS (Kombewa = Kisumu West) results as context with the site label only | ~80 values | 2.5 days |
| `siaya-education.json` → `kisumu-education.json` | BESB 2014/2019 (repo), CSA 2024, KPHC Vol IV (manual), ADP ECDE/VTC targets | separate devolved (ECDE, VTC) from national | ~50 values | 1.5 days |
| `siaya-agriculture.json` → `kisumu-agriculture.json` | CSA 2024 (agriculture, fisheries), KilimoSTAT API (rice, sugarcane, maize), Food System and Agri-Nutrition strategies 2023-27, KeFS landings (to locate) | 10-year crop series from the API; fisheries landings as a new indicator (lake economy) | ~120 values | 2 days |
| `siaya-climate.json` → `kisumu-climate.json` | Climate Change Policy 2019, Environment Policy 2019, OAG Climate Change Fund FY2024/25 (L), CoB climate fund table; FLLoCA/PCRA (to search; not found yet) | NDMA: not applicable (non-ASAL) | ~20 values | 1 day |
| `siaya-projects.json` / `siaya-programmes.json` → Kisumu | ADP FY2017/18-2025/26 (9), CIDP I-III, CoB "highest expenditure projects" tables (every year), OAG KUP reports, media claims MEDIA-K12/K14 (to verify) | stable project IDs; status from CoB/OAG only; contractor names withheld | ~300 projects | 4 days |
| `siaya-geography.json` / `siaya-wards-geo.json` → Kisumu | 35 wards, 7 sub-counties. The repo holds only the county outline (`kenya-counties-map.json`); Kisumu ward boundaries must come from the same source as `siaya-wards-geo.json`. KPHC Vol II for denominators | as for Siaya; ward equity layer | 35 wards | 2.5 days |
| `siaya-analysis.json` / analysis layers → Kisumu | derived from the above | B1-B5 layers; L11 tax effort vs Siaya | – | 2 days |
| `reviews.json`, review packs, machine checks | all of the above | second reading of every cited page (machine-check script); review packs per dataset | – | 2 days |
| Pages (`/counties/kisumu/*`), tests, gates | – | copy the Siaya page set; `scripts/test-*.js` per dataset; smoke test; `verify:repro` | – | 3 days |

## 2. Order of work

1. Prerequisites, library and manifest (day 1).
2. `history` and the ledger skeleton from CoB plus `counties-cob.json` (days 2-4). This gives a publishable minimum.
3. Audits (opinion pages first, then findings).
4. Budget by department, county series, then the ledger reconciliation pass.
5. Sector files (health, education, agriculture, economy, governance, climate).
6. Projects, wards, analysis layers, review packs, pages, tests.

## 3. Effort

| Block | Days |
|---|---|
| Prerequisites and library | 0.5 |
| Fiscal core (history, ledger, budget by department, county series) | 14 |
| Audits | 5 |
| Sector datasets (economy, governance, health, education, agriculture, climate) | 9.5 |
| Projects, programmes, wards, geography | 6 |
| Analysis, review packs, pages, tests | 7 |
| **Total** | **about 42 agent-days** for the full Siaya parity, plus a human review pass. The "minimum evidence threshold" (history + ledger + audits + 3 sectors) is **about 22-25 days**, in line with the 21-27 day estimate in `next-county.md` |
| Manual downloads (owner, browser) | about 1 hour for the 11 items in coverage §3 |
| Optional: download the 121 Parliament link-only items (hospital FIF, funds, city, KUP, Senate; ~6.7 GB) and OCR the opinion pages | +3 days |

## 4. Risks

- **OCR quality**: Parliament library text layers are machine OCR with character errors (for example, "Toble", "Kshs.1 .58 bittion"). Every value needs the second-reading check, as for Siaya.
- **Version duplicates**: several documents exist as both a draft and a final, or as KIPPRA and county-site copies with different hashes (CBROP 2022 x3, CBROP 2024 x3, approved budget 2025/26 and 2026/27 x2). Pick one per year and record the others as versions.
- **Scope**: the City of Kisumu, the Revenue Board, KIWASCO, the Lakefront Corporation and KUP are separate entities. Keep them out of the county totals unless the source includes them.
- **FY2025/26**: the CoB annual (Aug 2026) and CBROP 2026 (Nov 2026) both exist. Show both, and label CoB as the independent source.
