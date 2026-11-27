# Duplication sweep: elements, concepts, information, functionality (27 Nov 2026)

Read-only. Nothing in the repo was edited. Method: all 86 URLs in the live sitemap were fetched (dist/ was not readable from this session). The 86 URLs include 46 template county pages. I counted repeated text blocks (whitespace normalised, at least 120 characters) and sentences per page, the pages that show each key figure, the headings and download links per page, and repeated links inside `<main>`. Code was checked with grep (formatters, constants, imports, data cross-references). Scripts are in `scratchpad/sweep/`.
Settled decisions in docs/bug-sweep-log.md sweep 14 are not reported again: the brief repeating hub figures, the in-preparation template sentence, the Terms independence clause, the /trends/ merge, the home finder and the footer county list.

Legend: Effort S = under 1 h, M = half a day, L = more than a day. "Rule" = whether a CLAUDE.md or owner rule limits the change.

## A. Recommend (ranked by visitor impact)

### D01 Pending bills at 30 June 2025: the same full table is rendered on two pages, and the hub contradicts it
- Category: same figures and analysis twice; inconsistency.
- Where: `/counties/siaya/analysis/` (h3 "Pending bills at 30 June 2025, every source side by side") and `/counties/siaya/ledger/#pending-2025`. Both render `components/siaya/PendingAtDate.js` with fy 2024/25 (AnalysisTrends.js:181, ledger/page.js:88). The hub `/counties/siaya/` shows the range "KSh 545.95M to 1,890.00M, 5 printed values". Below that range, the note from `data/siaya.json:149` says "The closing balance at 30 June 2025 could not be read reliably ... and is not shown".
- Why it matters: a reader sees the same 5-row table twice. On the hub, the figure and the note under it say opposite things.
- Recommend: keep the ledger table as the canonical one. On analysis, replace the table with its existing one-line summary (lowest value 545.95, and why), followed by "every value: fiscal reconciliation" (the line is already there at AnalysisTrends.js:182). Delete or replace the stale siaya.json note (see D10).
- Rule: the summary line keeps its source (CoB Table 3.457 and the county Q4 report), so the sourcing rule is still met. Effort S.

### D02 Ten-year gaps list is printed in full on /data/ and /method/, though pages say it is "listed once"
- Category: repeated boilerplate.
- Where: `app/data/page.js:103` and `app/method/page.js:103` both map `hist.meta.gaps`. The same three paragraphs (FY2013/14, FY2019/20, FY2025/26) also appear in Reports A, B and C, so the block is on 5 pages. Insights says gaps "are listed, with their reasons, once: see known gaps" (insights/page.js:149).
- Recommend: keep `/method/#known-gaps` as the canonical list. On /data/, replace the list with a count and a link (the pattern insights already uses). The reports are standalone PDFs, so they keep their appendices.
- Rule: gaps stay listed ("gaps are listed, never filled"), just in one place on the web. Effort S.

### D03 Two discrepancy registers with no link between them
- Category: duplicate data and functionality.
- Where: `data/conflicts.json` (about 33 cases, rendered on `/data/#conflicts`, on `/corrections/` for "settled as source errors", and in the brief's "31 disagreements open") and `data/siaya-fiscal-ledger.json` cases `D-L025-L047`... (rendered by LedgerView on `/counties/siaya/ledger/`, where the banner says "109 are disputed"). Both record pending bills at 30 June 2022, 2023 and 2024, and own-source revenue for FY 2023/24 and FY 2024/25. Neither file references the other: grep finds `conflicts` 0 times in siaya-fiscal-ledger.json, lib/ledger.js and test-fiscal-ledger.js.
- Why it matters: visitors get two "where sources disagree" pages with different counts (31 against 109) for overlapping cases. A fix made in one register can drift from the other.
- Recommend: keep `conflicts.json` as the human-curated register. Add a `conflict_id` field to ledger cases that match a conflicts.json case, and make the validator fail when a matching pair has no link. On /data/, show the register once and give each ledger case a link to "case pending-2024 (ledger D-…)". Explain the two counts in one sentence on the hub and the ledger: curated cases against machine-classified pairs.
- Rule: the "show conflicts side by side" rule is unaffected. Effort M.

### D04 Own-source revenue composition (FIF, A-i-A) is explained in full on 3 pages, though the explainer already exists
- Where: `/learn/#…` "Own-source revenue, hospital income, FIF and A-i-A: why the totals differ" (canonical); `/counties/siaya/ledger/` "How own-source revenue is made up"; `/counties/siaya/analysis/` "Own-source revenue: ordinary revenue and health facility receipts". Each opens with its own definition of FIF ("lawful own-source revenue under the Facility Improvement Financing Act, 2023" appears on both Siaya pages). The OsrNote link "How each publisher counts own-source revenue" also appears on 5 pages.
- Recommend: Learn keeps the definitions. Ledger and analysis keep their Siaya numbers (45.76% in CoB Table 2.1 against 68.78% in the county figure, and the composition table) but drop the definition paragraph. OsrNote already links the explainer.
- Rule: none. Effort S.

### D05 Ten-year spending is charted on Insights and on Analysis; the hub says "charted once"
- Where: the hub's "Ten years at a glance" says budget and spending "are charted once, on Siaya insights". But `/counties/siaya/analysis/` also draws "Total, recurrent and development spending, KSh billion, nominal" and "Real spending, change on the previous year". Insights draws "Approved budget and spending" and "Nominal and real spending". The headline growth figure is given in two framings: Insights says "86% nominal, about 3% real over ten years"; Analysis says "6.4% a year nominal, 0.3% a year real".
- Recommend: Insights stays the plain-language page. It keeps the budget-against-spending chart and links "growth rates and real per person: Analysis #growth". Analysis keeps the calculation tables and drops its nominal spending line chart in favour of a link, or the hub sentence is corrected to name both pages. Also drop the Insights audit-opinion count block (0 / 5 / 2 / 1). That block repeats `/counties/siaya/audits/`, the brief table and the hub, so a one-line link is enough. Effort M. Rule: every chart keeps its table view.

### D06 Audit opinions shown on 7 pages
- Where: the word "adverse" or "disclaimer" appears on hub, audits, brief, insights, analysis ("Audit findings that recur"), learn, /data/ and Reports A and B. On the hub, "A qualified opinion means the accounts are fair except for specific matters..." is printed twice, once for the Executive and once for the Assembly.
- Recommend: keep the full series on the audits page. The hub keeps the latest opinion; print the explanation sentence once under both cards. Insights: see D05. The brief and reports: keep (settled, printable). Effort S.

### D07 FAQ repeats itself and Method, and contains a stale privacy claim
- Where: `/faq/`. There are three duplicate pairs: "Can I reuse your charts, text and data?" and "Can I use the data?"; "How do I contact you or complain" and "I found a mistake. What should I do?"; "Are the shilling amounts adjusted for inflation?" and "What are real (price-adjusted) figures?". The confidence rubric (5/4/3/lower) restates `/method/#confidence`. "How far back" and "Why are some charts missing a year" both point to the gaps lists.
- Stale: "The only form, Request a brief, is optional and its details are used only to reply". This contradicts the owner policy (no forms; briefs are requested over WhatsApp, docs/data-protection-policy.md).
- Recommend: merge each pair, and cut the rubric and real-terms answers to one sentence plus a link to Method. Fix the form sentence; this is a legal and copy issue, not just repetition. Effort S.

### D08 Licence sentence printed once per document: 98 times on Sources and up to 25 times per report
- Where: "figures may be reused with the body and report named; the document is not redistributed (Kenyan public statistics, /terms/)". Counts: `/counties/siaya/sources/` ×98, Report B ×25, A ×23, D ×17, C ×8, E ×3, /terms/ ×6.
- Recommend: define each licence class once, in the /terms/ table that already exists (rights reserved, public domain, CC BY ...). Give each document a short class label linked to /terms/#reuse, for example "Licence: rights reserved, figures may be cited (terms)". Keep the full text in the JSON.
- Rule: the licence stays attributable per document, so nothing is lost. Effort M (the Source Library renderer and the report bibliography renderer both change).

### D09 /data/ and /datasets/ overlap (two "Data" pages)
- Where: the header "Data" goes to `/datasets/`. The footer lists "Siaya ten-year series" `/data/` and "Where sources disagree" `/data/#conflicts`. Five files are offered on both pages: history.json, history.csv, conflicts.json, cpi.json, subcounties.json. The /data/ meta description ("Download the JSON data behind Takwimu Kenya") is the /datasets/ purpose; its h1 is "Siaya ten-year series: sources and conflicts". /data/ also carries a "Printable brief" section with the brief PDF, which is the /reports/ purpose.
- Recommend: `/datasets/` stays the only download catalogue. `/data/` becomes "Siaya ten-year series: sources and conflicts" and keeps "Where each figure was read" and the conflict register. Its Files section becomes one line ("download these files from Datasets, filtered to Siaya"), and the Printable brief section becomes a link to /reports/. Correct the meta description. Files only on /data/ (siaya.json, county.json, siaya-boundaries.json, source-manifest.json, sources.json) go into the catalogue first.
- Rule: every download keeps its source and date in the catalogue. Effort M.

### D10 Same Siaya headline values stored in three data files; one copy is stale
- Where: `data/siaya.json` (imported by hub, brief, layout, AnalysisTrends, OsrLedger), `data/history.json` and `data/siaya-fiscal-ledger.json` all hold 436.68, 10.94 and 7.75. siaya.json's pending note (line 149) is out of date (see D01). Hard-coded figures in page code: `app/data/page.js:14` ("436.68 of 1,043 is about 42 per cent") and `app/learn/page.js:94` (757.57, 521.07, 436.68, 199.84).
- Recommend: history.json and the ledger stay canonical. siaya.json keeps only what they do not hold (stalled projects, revenue arrears, section refs), or the validator checks each duplicated siaya.json value against history.json. Move the two hard-coded sentences to data with a validator check. Effort M.

### D11 Siaya navigation printed twice on the hub
- Where: `app/counties/siaya/page.js:70` renders SIAYA_GROUPS (Money, People and services, Places, Accountability, Evidence) at the top. The layout's SiayaRelated then renders the same SIAYA_GROUPS under "All Siaya pages" at the bottom (`SIAYA_RELATED['']` exists).
- Recommend: hide the "All Siaya pages" details on the hub, and keep the Related links. Effort S.

### D12 Footer links the same page twice
- Where: `components/SiteFooter.js:28-31`: /method/ and /method/#sources, /data/ and /data/#conflicts; lines 39-42: /terms/, /terms/#copyright and /terms/#disclaimer.
- Recommend: keep one link per page unless the anchor is a different task. "Where sources disagree" is one; "Where the data comes from" is not. Effort S. Low impact.

### D13 Report A (compendium) restates Reports B to E on the web
- Where: 40 sentences appear on both A and B, 22 on both A and D, and 10 on A, C and D. Examples: the 11 bibliography entries for the Auditor-General and CoB reports, the health "Next step" gap rows, the IATI, Global Fund and foreignassistance access notes, and the CIDP project-scope notes. B is 198k characters and A is 132k.
- Recommend: keep the PDFs standalone; they are printable deliverables. On the HTML versions, collapse A's sections that are fully covered by B to E into a summary plus "full evidence: Report B §6". Or mark the compendium as the PDF-first edition. Owner decision needed. Effort L.

### D14 Number formatting is reimplemented 52 times
- Where: `toLocaleString('en-US', …)` appears 52 times in 36 files, with different maximum decimal places (1, 2, 3 and 6). Local helpers: brief `num`, LedgerView `num`, ObsTable `num`, Report `num`/`fmtValue`, ReportChart `fmt`, ImfView `fmt`, compare `fmt`, CompareView `fmtNum`, audits `ksh`. `lib/format.js` exports `fmt` (2 decimal places), but most files do not use it.
- Why it matters for visitors: the same value can print with different precision on different pages, for example 4.99 on one page and 4.990 on another.
- Recommend: add `fmtNum(v, {dp})`, `fmtKsh` and `fmtPct` to lib/format.js and replace the local helpers. Test: one fixture value renders the same in ObsTable, CalcTable, LedgerView and Report. Effort M.

### D15 Fiscal-year list hard-coded four times
- Where: `const FYS = ['2013/14', … '2024/25']` in brief/page.js:18, insights/page.js:65, AnalysisTrends.js:21 and OsrLedger.js:27. report/build.js and lib/pulse.js derive the list from the data instead.
- Recommend: derive it from `history.json` years, like lib/pulse.js does. Otherwise FY 2025/26 has to be added in four places when the annual report lands. Effort S.

### D16 Three map components each implement the same single-hue 5-step scale and legend
- Where: `components/KenyaMap.js`, `SiayaMap.js` and `WardMap.js` (header comments 1-6 in each describe the same scale, hatching for missing values and legend).
- Recommend: extract `lib/scale.js` (breaks, colour step, legend items) and a shared `<MapLegend>`. Keep the three geometries. Effort M.

### D17 Overlapping docs on "what deploys production", and they disagree
- Where: `docs/architecture-map.md`, `docs/production-provenance.md`, `docs/audit/production-baseline.md`, `docs/technical-audit-2026-11-21.md` §1 and `docs/ops/release-checklist.md` (intro), plus README and CLAUDE.md. technical-audit says "`main` is an older, different product and must not be deployed". CLAUDE.md and release-checklist say production comes from `main`; release-checklist adds "by Netlify's GitHub link (since 27 Nov 2026)", while CLAUDE.md says "by CLI upload". production-baseline names branch claude/eager-rubin-7bpcgq.
- Recommend: keep architecture-map.md as the single current answer. Mark production-provenance, production-baseline and technical-audit §1 as dated snapshots with a pointer to it. release-checklist links to it instead of restating it. Resolve CLI upload against GitHub link with the owner. Effort S (docs), but this is high risk for whoever deploys next.

### D18 Overlapping plans and SOPs in docs
- Where: `docs/development-plan.md` (20 Nov), `docs/sprint-work-plan.md` and `docs/release-plan.md` are three plans. `docs/ops/editorial-sop.md` and `docs/editorial/review-sop.md` already cross-link and split scope cleanly, so they are fine.
- Recommend: mark the older plans as superseded, with a link to the current one. Effort S.

### D19 PDF scripts duplicate their scaffolding
- Where: `scripts/make-brief-pdf.js` and `scripts/make-reports-pdf.js` share the same static HTTP server, Playwright launch and poppler checks (identical import blocks and header).
- Recommend: move the shared parts to `scripts/lib/print-pdf.js`; each script keeps its own checks (one A4 page against DRAFT header and fonts). Effort M. No visitor impact.

### D20 Shared provisional-banner text is wrong on one story
- Where: `/stories/population-and-towns/` says "Figures in this story were transcribed by Takwimu from Controller of Budget reports". The story uses World Bank estimates. The text is reused from the stories template; all 4 stories pages print the same sentence and count (4,502).
- Recommend: build the banner sentence from the story's own datasets, as the sector pages already do. Do not remove the banner. Effort S.

## B. Keep (intentional, with reason)
- K1 Provisional banner on every page (33 pages, once each, with that page's own counts). Owner rule. It is already short and page-specific; only D20's wording needs fixing.
- K2 Review-mark legend and "How to read" pointer in each of the five reports. Each report is a standalone PDF, and the notice already defers to /reports/method/ ("set out once for all five reports").
- K3 Bibliography and gap appendices repeated across reports A to E (for the PDFs). Each report has to stand alone when printed; see D13 for the HTML editions only.
- K4 The brief repeats hub figures and audit table (settled in sweep 14; printable one-pager).
- K5 46 in-preparation county pages share one template block (settled in sweep 14).
- K6 Key figures on several pages: 436.68 on 8 pages, 610.74 on 8, 10.94 on 8, 7.75 on 7, 800.34 on 5. Each instance carries its source line, which the rules require. The hub states "One summary figure per measure. Each measure has one home page", and that model is sound. Only the full side-by-side tables (D01) and the explanatory paragraphs (D04, D06) are duplicated.
- K7 /kenya/ county totals against /compare/ against /stories/own-source-revenue/ (67.3 bn): this is a summary card, a tool and a narrative. They have different jobs, and each links to /compare/.
- K8 /method/ against /reports/method/: the report method page covers report-only scales (source tier A-D, OCR score, CBTS grades), snapshot IDs and bibliography conventions. It cites the 1-5 rubric in one sentence and links back. The split is justified.
- K9 /learn/ against /method/: Learn defines terms and Method describes Takwimu's process. There is no material overlap beyond the nominal and real definition, which is a single sentence on Learn.
- K10 Charts.js against ReportChart.js: the second is a static, no-script renderer for print. Both ship table views. Keep both, but share axis-tick and format helpers (part of D14).
- K11 Ledger "Every source side by side" for own-source revenue and the hub's three-figure card: the hub has one line and links to the ledger, as designed.
- K12 /stories/ against /reports/ against /counties/siaya/insights/ against /analysis/: stories are national narratives, reports are print deliverables, insights is the plain-language Siaya page and analysis is the calculation register. The purposes differ; the overlap between Insights and Analysis is addressed in D05.
- K13 Separate test scripts (`test-review-logic.js` for unit tests of the resolver, `test-reviews.js` for register and built-site checks). The two `round()` copies (build-siaya-analysis and test-siaya-analysis) are deliberate: the test recomputes the values independently.

## C. Counts
- 20 recommend (visitor-facing: D01-D13, D20; code: D14-D16, D19; docs: D17-D18), 13 keep.
- Effort: S ×10, M ×9, L ×1.
- Pages with repeated blocks of 120 characters or more on at least 3 pages: 48 block groups. 46 of the hits are the county template (kept); most of the rest are report bibliographies and gap rows (K3 and D13).
- Sentences of 120 characters or more shared by at least 2 non-template pages: 140. About 85% are report-to-report or report-to-topic-page.
- Incidental defects found: hub pending-bills note contradicts the card (D01/D10); FAQ claims a form exists (D07); wrong source in the population story banner (D20); production-deploy docs disagree (D17).
- Note: the live sitemap lists 86 URLs, not 97. Redirected routes (/explore, /analytics, /insights, /profile, /subcounties, /briefs, /trends, /counties/siaya/pulse) are correctly absent.
