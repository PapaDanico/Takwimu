# Takwimu Kenya

**Turning Data into Progress.**

Civic education on Kenyan public finance and statistics, focused on trends. Siaya (`/counties/siaya/`) and Kisumu (`/counties/kisumu/`, core fiscal, audit and population pages from 28 Nov 2026) are the published counties; national pages (`/kenya/`, `/compare/`, `/datasets/`, `/stories/`; `/explore/` and `/trends/` redirect to `/datasets/` and `/kenya/`) cover all 47 counties where data exists. Every figure shows its source, publication date, period, unit and confidence. Conflicting sources are shown side by side.

Live site: https://takwimukenya.com (primary domain from 28 Nov 2026; https://takwimu.netlify.app is a Netlify alias that 301s to it). The address is set once, in `lib/site-url.js`.

## Stack and hosting

- Next.js 14 static export (`output: 'export'`, `trailingSlash: true`, output in `dist/`), React 18, Tailwind 3. TypeScript is used for type checking only.
- Hosted on Netlify only. No server, functions, database, accounts, forms, analytics or cookies.
- Production is `main`. Netlify is linked to this repository (27 Nov 2026) and builds `main` on every merge; branch pushes do not deploy. Work happens on `claude/eager-rubin-7bpcgq` and is merged by pull request at each release. See `docs/architecture-map.md`.

## Layout

```
app/          pages (app/_held/ is deliberately not routed)
components/   charts (Charts.js, Donut.js), maps, explorers
lib/          shared code (counties.js lists the 47 counties)
data/         versioned source data with provenance (the source of truth)
schemas/      JSON Schemas for the data files
scripts/      tests, validation, data publishing, PDF and map generators
public/       static assets; public/data/ is generated, not committed
brand/        owner-supplied logo artwork (see brand/README.md)
netlify.toml  build command, headers (CSP), redirects
```

## Build and gates

Node 20.

```bash
npm install
npm run validate      # data tests and validation only
npm run build         # tests + validation + data publishing + next build + built-HTML check -> dist/
npm run typecheck     # tsc --noEmit
NODE_PATH=$(npm root -g) node scripts/smoke-test.js dist   # end-to-end smoke test (global Playwright)
npm run verify:repro  # two builds must be identical; prints "Reproducible"
npm run qa:axe        # axe-core accessibility check of every sitemap page in dist/, light and dark (must report 0 violations)
npm run qa:crawl      # crawl of every sitemap page: status, one h1, title, description, broken internal links
npm run qa:overflow   # no horizontal overflow at phone and desktop widths
npm run reports:pdf   # regenerate the five report PDFs (public/reports/), then npm run build again
npm run test:reports  # report pages and PDFs: snapshot, figures resolve, DRAFT mark (blocking before any deploy)
npm run test:reviews  # synthetic-rejection test on its own (also the last step of npm run build)
npm run ops:check-sources  # re-checks every source address and document hash (network; writes docs/ops/source-health.md)
npm run ops:freshness      # dataset freshness against each publisher's cycle (writes docs/ops/freshness.md)
npm run ops:backup-drill   # clone, build and compare from the remote branch (docs/ops/backup-restore.md)
npm run dev
```

`npm run build` runs, in order: `test-analytics`, `validate-data` (provenance fields, JSON Schemas, sums, source-manifest SHA-256), `test-reconciliation` (one test per conflict case), `test-explore` (units), `test-derived`, `test-economy`, `test-governance`, `test-audits`, `test-fiscal-ledger`, `test-health`, `test-education`, `test-agriculture`, `test-geography`, `test-wards-geo`, `test-climate` (also checks that no phone or ID number from the PCRA's participant annex is extracted), `test-siaya-analysis`, `test-projects`, `test-programmes`, `test-research-deliverables`, `test-reviews`, `test-review-logic`, `test-machine-checks` (second independent reading of each value; never approves), `test-corrections` (every changed value is in the corrections log), `test-imf` (IMF WEO: types, vintages, comparisons), `ops/test-ops` (offline, 60 checks), `build-data`, `next build`, `check-built-html` (no `NaN`; gaps stay gaps), `check-redirects` (no Netlify redirect hides a built page), `check-osr-links` (pages on own-source revenue link the explainer), `test-corrections dist`, and `test-reviews dist --synthetic`: a second, throwaway build into `dist-synthetic/` with one synthetic rejection per dataset held in memory only (never written to `data/reviews.json`), which fails unless every page, report, download and published data file withholds the value and every calculation using it; it restores the real `.next/` afterwards, which Netlify's Next.js plugin reads. Netlify runs only `npm run build`: run the smoke, axe, crawl, overflow, report and reproducibility checks locally before merging into `main`.

The `qa:*` scripts and the smoke test use Playwright (and axe-core for `qa:axe`) installed globally, not as project dependencies; the npm scripts set `NODE_PATH=$(npm root -g)` themselves, so install them once with `npm i -g playwright axe-core && npx playwright install chromium`. Run them after `npm run build`; they serve `dist/` locally.

Brief PDF: after a build, `NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js`, then build again. Report PDFs (printed from the full print edition at `/reports/<slug>/print/`; the web page `/reports/<slug>/` shows what is unique to each report and links the rest): `npm run build`, `npm run reports:pdf`, `npm run build`, then `npm run test:reports`, which must pass before any deploy (release gate). Whenever a PDF in `public/` changes, or what is held back changes, also run `node scripts/test-unpublished-counties.js dist --record-pdfs` and commit `data/pdf-leak-scan.json`: Netlify has no pdftotext, so its build accepts a PDF only if that file records it as scanned clean against the current held records (the local build fails until the record is current).

Monitoring (not part of the build; see `docs/ops/monitoring.md`): `npm run ops:check-sources`, `npm run ops:freshness`, `npm run ops:backup-drill`.

## Data rules

- Every figure carries source, publication date, period, unit and confidence.
- Series go back 10 years (`data/history.json`, `data/cpi.json`). Gaps are listed, never filled; unknowns are never shown as zero.
- Conflicting figures are shown side by side and tested in `scripts/test-reconciliation.js`.
- Corrections are small footnotes beside the value ("Corrected <date>: was <original>. <reason>."), and source-document errors are flagged there too; `data/corrections.json` is the log and `/method/#corrections` the note. There is no register page (owner, 27 Nov 2026; `/corrections/` redirects). `scripts/test-corrections.js` fails the build if a changed value has no entry or a correction is not footnoted on a built page.
- Cited PDFs are pinned by SHA-256 in `data/source-manifest.json`.
- No verdict labels on named individuals without a primary document and legal review.
- No personal data is collected (`docs/data-protection-policy.md`).

## Status (28 Nov 2026)

- Counties: 2 of 47 published (Siaya, Kisumu); national pages cover all 47 where data exists.
- Siaya values: 4,122 across 17 datasets, each with a review pack. 0 approved: approval needs a review record from an independent reviewer (`data/reviews.json` is empty); unreviewed values are labelled "Provisional: awaiting editorial review". New on 28 Nov: `data/indicators.json` adds poverty 2022, KDHS 2022 fact sheet, crops, Sibo utility and lake fish landings.
- Machine cross-checks (second reading of the cited page): 2,435 agree, 80 disagree (need a person to read the page image), 1,607 not checkable.
- Fiscal ledger: 164 discrepancy cases, 164 of them open (a case is open until a review record resolves it; `data/siaya-fiscal-ledger.json` holds the status); by class 47 definitional, 22 period or version, 15 probable source error, 2 resolved by source, 78 unexplained (`data/ledger-classes.json`; a class is not a status). Both values stand in every open case. Conflict register: 53 cases.
- Ten-year series: FY 2013/14 to FY 2025/26 (FY 2025/26 from the CoB annual report Part 1 tables, 27 Nov 2026); FY 2019/20 stays a gap (CoB report not found), with county and look-back figures listed beside it.
- Corrections: 17 corrections footnoted beside 26 values, 14 source-error records flagged beside theirs (kept as published, e.g. "31st June 2025", and the Economic Survey 2026 printing Siaya's OSR budget as FY 2025/26 revenue); no register page, `/corrections/` redirects to `/method/#corrections` (owner, 27 Nov 2026).
- Kisumu (published 28 Nov 2026: hub, fiscal reconciliation, audit opinions, population, indicators, health, education, trade and markets, governance, agriculture and fisheries, water and environment, social protection, road safety and communications, wards and constituencies with IEBC boundary maps, sources under `app/counties/[slug]/`, built from `lib/county-registry.js` through `lib/county-pages.js`): 331 values (291 ledger, 35 audit opinions, 5 population), 36 ledger discrepancy cases, 38 explained conflict cases, 51 values marked "Needs page check", 0 approved (all labelled "Provisional: awaiting editorial review"). Sector pages follow one domain per release. Social and economic indicators (published from Release 10 on /counties/kisumu/indicators/): 176 values in `data/counties/kisumu/indicators.json` (poverty, KDHS fact sheet, WASREB and KIWASCO, statistical abstract 2024, crops, fisheries), 4 cases where publishers differ, 4 gaps. Evidence delta of 28 Nov: `docs/research/kisumu-handover-2026-11-28/delta-manifest.md`.
- Kisumu statistical abstract (`data/counties/kisumu/abstract.json`, kind `abstract`): published table by table through `public_tables` in `lib/county-registry.js` (ward voters Table 1.7.1, eight health, thirteen education, two trade, one governance, sixteen agriculture and fisheries, ten water and environment, eleven social and two road safety and communications tables); every other abstract table stays held and leak-scanned by record.
- County release states (`lib/county-states.js`): draft / reviewable / published, set by hand. `scripts/test-unpublished-counties.js` checks states against routes, the per-county `public_kinds` allowlist, and scans dist/ (HTML, RSC payloads, CSV, JSON, PDF text) for held records by dataset and record id, with a deliberately leaked fixture; it fails closed.
- Site: 124 pages, 92 downloadable datasets plus 1 link-only (IMF), a three-page fiscal brief and 5 draft reports. Layers B1, B2, B4, B5 on /counties/siaya/analysis/; B3 and own-source revenue by publisher on /counties/siaya/ledger/.

## Deploying

Deploy once per major release (owner policy). Run all gates on a clean `git archive` of the branch, open a pull request into `main` and merge it; Netlify builds and publishes `main`. Then check the live pages and data files and record the commit and deploy id in `docs/production-provenance.md`. Rollback: publish an earlier deploy in the Netlify dashboard.

## Documentation

- `docs/audit/production-baseline.md`: confirmed and unverified production facts
- `docs/architecture-map.md`: what deploys the live site
- `docs/production-provenance.md`: live commit and deploy history
- `docs/release-plan.md`: release checklist
- `docs/data-protection-policy.md`: no-ODPC design rules
- `docs/data-contract.md`: data file contract
- `docs/development-plan.md`, `docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md`: plan and design
- `brand/README.md`: logo use

## Licence

MIT for the code. Source data belongs to its publishers; check each source's terms before reuse.
