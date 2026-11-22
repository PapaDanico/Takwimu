# Workflow research for Takwimu (20 Nov 2026)

Purpose: decide how data, content and release workflows should run so upkeep is low and every number is traceable. Findings are from web searches and page reads this session. Gaps are listed at the end.

## What the benchmarks do

| Platform | Pattern worth borrowing | Evidence |
|---|---|---|
| Our World in Data | Each chart page shows title, subtitle, source line ("major processing by Our World in Data"), last-updated date, next expected update, a named page owner, a "learn more" explainer, per-source citations with retrieval dates, downloads (CSV, metadata JSON, API URL, ZIP), CC BY 4.0, and a ready-made citation. Its ETL is open source (github.com/owid/etl), builds a flat-file data catalog and publishes it to S3. | Page read: ourworldindata.org/grapher/life-expectancy; search results on the ETL |
| USAFacts | Chart subheading plus a units line ("Adjusted for inflation (FY 2025 dollars)"), "Source: agency" under every chart, "Updated" date, plain caveats such as missing years. Government-only sources, no ads. No methodology link or corrections policy found in the page text. | Page read: usafacts.org/state-of-the-union and /about |
| Vulekamali (South Africa Treasury) | Learning section (videos, glossary, dataset guides, FAQ) beside the data, a "Report inaccuracies on this page" link, a Data Portal API. Department pages could not be read (rendered by JavaScript). | Homepage and listing page read |
| OpenSpending | Accepts CSV, Excel and Google Sheets; treemaps for allocations. | Search summaries |

## Tooling findings

- **Git scraping** (Simon Willison): a single scheduled GitHub Actions workflow fetches data and commits only when it changed, so the commit history records every change. Use it to watch Controller of Budget, Treasury, Auditor-General and KNBS pages and store raw files with hashes. Source: simonwillison.net/2020/Oct/9/git-scraping/
- **Validation**: Frictionless Data Table Schema with `frictionless-ci` (GitHub Action) validates tabular files on every change and shows reports. Source: frictionlessdata.io. Check the Action's current inputs in its README before use.
- **PDF tables**: no benchmark covers Kenyan government reports. One academic study of 10 open-source parsers found Camelot best on government tenders (recall 0.72), with traditional tools weak on recall overall. Docling claims higher accuracy on complex tables, but the strongest figures come from vendor or IBM-affiliated sources. Decision: build a golden-file test set from real Controller of Budget PDFs and benchmark Camelot, pdfplumber and Docling on it before choosing.
- **Netlify**: Netlify's own Git integration builds deploy previews on each PR by default; GitHub Actions can replace it but then previews must be handled explicitly. Next.js `output: 'export'` is already set; the build output directory is `dist` (set via `distDir`), so `netlify.toml` must publish `dist`. Lighthouse can run in CI with thresholds (community actions exist); Netlify also offers a Lighthouse plugin.
- **Kenya data access**: no Controller of Budget API found. KNBS reportedly runs an SDMX open data portal (unconfirmed). OGP notes Kenyan budget data is published but hard to extract.

## Proposed workflows

1. **Source watch** (scheduled Action): fetch listed source pages, download new report files into `data/raw/`, record SHA-256 and retrieval date, commit only on change. Opens an issue when a new report appears.
2. **Extract** (on new raw file): parse tables to staging CSV with a per-table confidence score, store the page number for every value. Parsers are tested against golden files.
3. **Validate**: Table Schema checks (units, periods, totals reconcile, year-on-year jump flags). Failures block the PR.
4. **Review PR**: data diff plus a review aid showing the source PDF page beside each extracted value. Owner approves; nothing auto-merges.
5. **Deploy**: merge triggers the Netlify build; each PR gets a deploy preview.
6. **Quality gates** on every PR: type-check, lint, schema validation, source-link check, Lighthouse budget (first load under about 150 KB on throttled mobile), accessibility checks.
7. **Freshness check** (scheduled): each series records an expected next release; an issue opens when overdue and the page shows "last updated" and "next expected".
8. **Content workflow**: explainers are Markdown with front matter (author, status unreviewed or reviewed, reviewer, last reviewed). Claims about named people need a primary-document link and legal review before publishing. A public corrections log; every page has "Report an inaccuracy".

## Gaps (not yet researched)
- Accessibility test tooling (axe or similar): no results found.
- How OWID triggers dataset refreshes.
- USAFacts and Vulekamali chart visuals, and Vulekamali department pages (JavaScript-rendered).
- Whether the Controller of Budget or Treasury publish any structured downloads; each source's terms of use.
- Real Controller of Budget PDF layouts: needed for the parser benchmark.
