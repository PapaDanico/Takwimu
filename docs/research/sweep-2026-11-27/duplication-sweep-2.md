# Duplication sweep 2 (27 Nov 2026)

Owner request: "eliminate all areas of duplication and repetition". Follows `duplication-sweep.md` (sweep 1).

## Method (same for before and after)

1. Build the site (`next build` of commit 401698f for "before"; the full `npm run build` chain for "after").
2. Open every page in the sitemap in Chromium, open every `<details>`, and take the visible text of `<main>`
   (header and footer excluded). Left out: the 46 in-preparation county pages (one settled template, sweep 14) and
   Moved stubs. 40 pages.
3. Split into sentences; keep sentences of 90 characters or more; replace every digit with 0.
4. Count the sentences that appear on more than 2 pages (the sweep-1 measure), and, to go further, on 2 or more
   pages, and sentences of 60 characters or more on 2 or more pages.

Sweep 1 measured all `<main>` text with a slightly different page set (105 to 18). The baseline below is re-measured
with this exact script on 401698f, so the two numbers here are comparable with each other.

| Measure | Before (401698f) | After |
| --- | ---: | ---: |
| Sentences of 90+ characters on more than 2 pages | 12 | 5 |
| Sentences of 90+ characters on 2 or more pages | 120 | 24 |
| Sentences of 60+ characters on 2 or more pages | 175 | 55 |

The 5 left on more than 2 pages are the required per-page review label with that page's own counts
("Provisional: awaiting editorial review. Editorial review of N values: ...", 4 count variants) and the reports'
one-line DRAFT label. Both are required labels, stated once per page.

## What was merged or removed

Text and explainers
- Provisional banner (`components/ObsTable.js` `Provisional`): one short shared form on every page: the label, the
  page's review counts and a "What this means" link to `/method/#review`. The 22 page-specific paraphrases ("Values
  were transcribed by Takwimu from ... and have not yet been checked by a reviewer") are gone; each figure already
  cites its source. The analysis page uses the same component (with its "calculated by Takwimu" tag).
- Editorial review explained once, in a new `/method/#review` section. `/datasets/#review` keeps only the totals and
  a link; `/reports/method/#review` keeps only what is report-specific (cover notice, DRAFT watermark, marks).
- `/method/#conflicts` no longer lists example conflicts (they duplicated the register and the ledger); it links the
  conflict register on `/data/#conflicts`.
- `/counties/siaya/people/`: the poverty gap sentence is a link to `/method/#known-gaps` (where it is listed).
- FAQ: three questions on missing years merged into one; "classroom or news story" merged into the reuse question;
  the inflation and scanned-page answers cut to one sentence and a pointer to Learn / Method; the independence
  sentence removed (the footer carries it); the stale "corrections page" reference replaced by the footnote rule.
- FIF/A-i-A definition removed from the own-source revenue composition caveat (A8 records in
  `data/siaya-analysis.json`, via `scripts/build-siaya-analysis.js`); it is defined once on `/learn/`. Caveat text
  only; no value changed (test-corrections: 6,730 values compared, 0 changed).
- `components/CalcTable.js`: a formula or caveat shared by every row of a calculation table is stated once under
  the table ("Every row: ...") instead of on each row (the audit-recurrence caveat had printed 31 times on
  `/counties/siaya/analysis/`).

Reports (web editions only; the PDFs and print routes stay complete and standalone)
- A table or chart whose every figure is printed in one section of a report earlier in the owner order (B, C, D, E,
  then A) is summarised and linked there (`components/report/web.js` `coveredBy`).
- Takwimu calculations (absorption, transfer dependency, pending-bill changes, budget beside services, climate
  hazard exposure) link to their full records on Siaya analysis; the compendium's education, agriculture and audit
  opinion tables link to their Siaya pages. `scripts/test-reports.js` checks every linked page holds the summarised
  entries.
- Threshold rules quoted in Report B's interpretation (35 per cent wage ceiling, 30 per cent development floor,
  liabilities test) are replaced on the web by a link to the threshold beside the ratios on Siaya analysis.
- Web bibliography: one line per document (key, title, publisher, date, link). The SHA-256, period and licence of a
  library document are held once, in its Source Library record (`/counties/siaya/sources/#doc-<id>`); the PDF keeps
  the full bibliography. The snapshot appendix gives the snapshot ID and points to the PDF for the input-file hashes.
- The web DRAFT notice is one line.

Navigation (owner addition, 27 Nov 2026)
- Footer: "Siaya ten-year series" removed, so the footer lists national and county-generic links only. `/data/`
  itself is unchanged (the earlier request to move it was withdrawn by the owner).

Code
- `lib/siaya-years.js` now holds the helpers that were copied between pages: `SIAYA_FY_SHORT` (3 copies),
  `pendingTotal` (3 copies: brief, insights, AnalysisTrends), `SIAYA_OSR_BY_FY` (3 copies) and `yearsBetween`
  (3 copies in lib/extra.js, lib/explore.js, lib/siaya-topics.js).

## Kept, with reason
- The per-page review label and counts (owner rule: provisional values stay labelled).
- Conflicting values shown on both the register and the page that uses them, e.g. IMF against World Bank on
  `/kenya/` and `/data/#conflicts` (rule: conflicting sources side by side).
- Dataset metadata (World Bank source notes, CPI method, PDF reading method) printed both on its dataset entry in the
  catalogue and beside the series on its page: each figure must carry its source and method on its page.
- Story deks shown on the stories index card and as the story's subtitle (navigation summary).
- The brief's closing disclaimer: the brief is printed as a standalone PDF.
- `app/compare/page.js` still passes its old banner text to `Provisional`; it is not rendered (file left to the
  agent editing it).
