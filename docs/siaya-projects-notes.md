# Siaya development project register: notes (21 Nov 2026)

Data: `data/siaya-projects.json`. Schema: `schemas/siaya-projects.schema.json`. Check: `node scripts/test-projects.js` (not yet wired into `npm run validate`; add it there when the page that uses the register is built). Handover reference: WP6, section 14 and stop condition 17(f).

## What it holds
- **118 projects, 19 documents.** Statuses: planned 20, active 13, delayed 25, suspended 16, completed-reported 23, completed-independently-verified 1, cancelled 4, unknown 16.
- Each project has a stable id (`SIA-P-001` onwards, append only, never renumber), the name as printed in its first source, aliases where another source spells it differently, a sector, the implementing entity, printed places with their resolution, amounts, contract details, a status with `status_source`, `last_evidence_date`, linked audit finding ids, evidence records (document, PDF page, type, date, confidence 1-5), conflicts and related projects.
- 39 projects link to 43 Auditor-General finding ids in `data/siaya-audits.json`. Every finding in category `projects` is linked (the test enforces this). One audit paragraph used here is not in the tracker: FY 2021/22 para 8.5, Opoda-Bondo township road (SIA-P-018).

## Sources read
| Source | What was taken | Text |
|---|---|---|
| CIDP 2023-2027 (GOV-01-PDF), PDF p. 168-173 | Flagship projects (Muluwa, Anyiko irrigation) and location-specific capital projects (planned) | Text layer |
| County budget implementation reports FY 2025/26 Q1-Q4 (GOV-02-FY2025-26-Q1..Q4) | "Development projects with the highest expenditure" and "Stalled projects" tables | Text layer |
| CoB annual reports FY 2018/19, 2020/21, 2021/22, 2022/23, 2023/24, 2024/25 (manifest ids `cob-report-*`) | Siaya "highest expenditure" and stalled tables | 2018/19 text layer; others scanned, OCR. 2022/23 to 2024/25 re-read at 400 dpi; 2020/21 and 2021/22 from the existing OCR text (confidence 3) |
| Auditor-General, Executive FY 2020/21 to 2024/25 and Assembly FY 2022/23, 2023/24 | Project paragraphs: dates, amounts, inspection dates and results | Text layer; FY 2024/25 tesseract OCR |
| CADP 2025/26 public participation report (`GOV-04-CADP-PP`) | Two named projects (Hawinga ECD, Wagai multi-media centre) | Text layer |

`GOV-04-CADP-PP` was downloaded on 21 Nov 2026 to `/tmp/claude-0/library/dl-adp-2526/rpp.pdf` (SHA-256 fa62a517..., 96 pages) from https://siaya.go.ke/?cgdp_download=31438. It is not yet a record in `data/source-library.json`; the owner of that file should add it (parent GOV-04). The ADP 2025/26 itself was not found.

## Status rules
- A county report of completion (BIR, CoB table "Source: Siaya County Treasury", participation report, or a county certificate quoted by the auditor) gives **completed-reported**, never verified.
- **completed-independently-verified** needs an audit evidence record with `verifies_completion: true`, i.e. the auditor states on inspection that the works were complete. Only SIA-P-038 (Malunga Dispensary maternity block, FY 2024/25 audit p. 56, July 2025: "complete but remained idle") qualifies. Kagwa laboratory (SIA-P-023) stays completed-reported: the completion is the county's technical certificate; the audit visit says only that it was unused.
- **delayed** is also used on the county's own dates (expected completion passed, below 100%); `status_note` says so.
- **suspended** = listed as stalled by the county, or works found stopped or abandoned by the auditor. **cancelled** = contract terminated or budget removed.
- Where sources disagree, status follows the latest evidence; independent evidence outranks a county report of the same or earlier date. Every disagreement is kept in `conflicts`. Notable: Opoda-Bondo road (county 100% "complete and in use", audit 20%), Bondo mortuary cold room and Siaya theatre equipment (county 100% at June 2025, not installed at the October 2025 audit), Migwena perimeter wall and stadium VIP seats (county 100% after an audit found works short).
- Siaya County Stadium (SIA-P-001) is **delayed**: no source reports the main contract complete. Contract sums conflict (394.7m, 488.7m, 524.2m in audits; 424.9m in CoB FY 2023/24).

## Geography
Printed places are resolved only by name against `data/siaya-geography.json` (ward or constituency names and aliases). Not resolved, with a reason: "Executive" (the implementing office), towns, facilities, schools, roads, and "Siaya" alone (county, town or sub-county). "Ugunja" alone resolves to the constituency only. "East Uyoma Ward" (CoB FY 2018/19) is not in the IEBC register and is flagged. A place taken from a project name (for example "Ugenya Sub County Office at Ukwala") is marked in the printed text.

## Amounts
As printed, in KSh (KSh million for the CIDP; its capital-projects table prints "Cost" without a unit, read as millions like the flagship table header "Estimated cost (M)"). `fy` is the financial year of the document that prints the figure. Nothing is summed or derived. OCR-read figures note the OCR reading in `label_as_printed`; where a figure was not legible (for example the Boro-Katondi paid amount) it is left out, not set to zero. Printed paid amounts above a contract sum (Yala ring road, Nyamonye juakali) are kept and flagged.

## Names
No individuals. Contractors are named only where an official report prints a company name: Fast Choice Limited (stadium seats) and Paco Investment Limited (Migwena washroom works), both in the FY 2023/24 audit, and the national power utility. Elsewhere the reports say only "a firm" or "a company", and `contractor` is null. The audit tracker itself names no firms; review before publishing these two names. Road and facility names are kept as printed (one road name includes a personal name; it is a place name). The test scans every string for honorifics.

## Gaps (listed, not filled)
- ADP 2025/26 not obtained; the participation report's Annex 4 (several hundred ranked ward proposals) is not entered as projects.
- FY 2024/25 and earlier county BIRs carry no project annexes.
- CoB Siaya tables for FY 2014/15 to 2017/18 and 2019/20 not read for this register.
- No Takwimu physical verification. Stop condition 17(f) applies to every completed-reported project: do not present it as completed without the source's name beside it.
- Programme lines without a place (subsidies, routine maintenance, ECD and VTC programmes) and purchases (seeds, fertiliser, tractors, land acquisition) are not entered.
