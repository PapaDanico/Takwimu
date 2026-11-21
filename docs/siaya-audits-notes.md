# Siaya audit findings tracker: notes (21 Nov 2026)

Data: `data/siaya-audits.json`. Schema: `schemas/siaya-audits.schema.json`. Check: `node scripts/test-audits.js` (part of npm run validate and npm run build). Page: /counties/siaya/audits/; dataset siaya-audit-findings.

## What it holds
- **12 documents, 14 opinions, 262 findings.** County Executive and County Assembly are kept apart. FY 2013/14 has a 16-month audit of the whole county government (`county_government`) and a separate review of the Executive's financial operations, which carries no opinion.
- Each finding has a document, PDF page, paragraph number, report section, a short neutral title, a category, any amounts in KSh with the report's own label, and three recurrence fields:
  - `unresolved_prior_year`: set only when the report says the matter dates from an earlier year (with the reason quoted in `basis`).
  - `listed_unresolved_next_year`: set when the next year's report lists it as unresolved. The FY 2024/25 Executive report (Appendix 1, PDF p. 63-65) lists 30 FY 2023/24 matters. The FY 2024/25 Assembly report (PDF p. 56) lists 13.
  - `same_item`: links findings on the same named contract or requirement across years (`same_items`): the Siaya County Stadium (4 years), Siaya Bus Park, the ERP system, the Kirindo ECD classroom, the aggregation and industrial park, the County Assembly Fund, and the Assembly's misposting of ward office costs.
- `recurrence_by_category` counts findings per category and year. A count is not evidence that a given finding recurred.

## Sources
| Entity | Years with a report read | Source |
|---|---|---|
| Executive | 2013/14 (two documents), 2019/20, 2020/21, 2021/22, 2022/23, 2023/24, 2024/25 | Parliament library (libraryir.parliament.go.ke). The hashes for 2013/14, 2019/20 and 2020/21 to 2023/24 match `data/source-manifest.json` |
| Assembly | 2020/21, 2022/23, 2023/24, 2024/25 | Parliament library; downloaded 21 Nov 2026 to `/tmp/claude-0/library/audit-*` (library MD5 checked) |

- oagkenya.go.ke (OAG-01, OAG-02) still returned HTTP 503 ("Under Maintenance") on 21 Nov 2026.
- The FY 2024/25 PDFs have no text layer, so their audit-report pages were read with tesseract OCR and graded 3.
- FY 2019/20 is a Senate committee report that quotes the audit, also graded 3. Only the quoted audit paragraphs were used.

## Cross-check with data/history.json
The opinions agree for every year in both files: 2013/14 Disclaimer, 2014/15 Adverse, 2015/16 Qualified, 2019/20 Qualified, 2020/21 Qualified, 2021/22 Adverse, 2022/23 Qualified, 2023/24 Qualified. The 2014/15 and 2015/16 opinions are reused from history.json, which takes them from the Senate compilation; no findings are recorded for those years. FY 2024/25 and all Assembly opinions are new (Qualified throughout). The test fails if an opinion contradicts history.json or drops one of its years.

## Gaps (listed, not filled)
- Executive: no audit report found for FY 2016/17, 2017/18 or 2018/19. For 2014/15 and 2015/16 there are opinions only.
- Assembly: no report found for FY 2013/14 to 2019/20 or for 2021/22. The FY 2013/14 file titled "Executive and Assembly" holds the Executive report only.
- Some amounts are partly illegible in the text layer (FY 2021/22, items 8.3, 9 and 10). The contract sum is recorded instead, with a note.
- The FY 2021/22 Executive report's signing date shows "12 April" but the year is cut off, so `report_date` is null.

## Editorial rules applied
- Findings are the auditor's findings, not convictions. Titles paraphrase neutrally.
- No individuals, firms or advocates are named. Offices (for example the Governor's residence) and public bodies are named only where the finding concerns them.
- Loaded words appear once, as the report's own heading for FY 2013/14 item 1.4 ("Fraudulent Transactions Through IFMIS/G-Pay Account"), stored in `report_heading` with `quoted: true`. The test rejects such words anywhere else, along with honorifics (Hon., H.E., Dr., Mr., Mrs., Ms., M/s).
- FY 2024/25 is the first year on transitional accrual IPSAS, so its totals are not directly comparable with earlier cash-basis years.
