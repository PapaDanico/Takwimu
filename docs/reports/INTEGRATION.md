# Reports A-E: wiring still needed (not done by the reports work)

The report templates live in `app/reports/` (index and `[slug]` pages), `components/report/` (model, builders,
renderer, CSS, registry `reports.json`), `scripts/make-reports-pdf.js` and `scripts/test-reports.js`. Generated PDFs
go to `public/reports/<slug>.pdf`. These files were the only ones changed. The items below touch shared files and
need the owner of those files to apply them.

## 1. package.json scripts (do not change the `build` chain)
```json
"reports:pdf": "NODE_PATH=$(npm root -g) node scripts/make-reports-pdf.js dist",
"test:reports": "NODE_PATH=$(npm root -g) node scripts/test-reports.js dist"
```
Order of a release: `npm run build`, `npm run reports:pdf`, `npm run build` again (so `dist/` carries the new PDFs),
then `npm run test:reports`. The PDF script and the test need Playwright (global) and poppler-utils, like the brief.

## 2. Sitemap (`app/sitemap.js`)
Add `/reports/` and the five report pages:
`/reports/siaya-evidence-compendium/`, `/reports/siaya-fiscal-accountability/`, `/reports/siaya-health-community-services/`,
`/reports/siaya-development-opportunities/`, `/reports/siaya-programme-atlas/`. Slugs are in `components/report/reports.json`.

## 3. Siaya hub and navigation
Link `/reports/` from the Siaya hub (`app/counties/siaya/page.js`) next to the fiscal brief, and optionally add a
`PAGES` entry in `lib/site.js` (`{ href: '/reports/', label: 'Siaya evidence reports', ... }`).

## 4. Smoke test (`scripts/smoke-test.js`)
Add the six routes above to the routes it fetches, and the five PDFs to the static files it expects. The report pages
contain no forms, cookies or third-party requests (only the site's own fonts, logo and chart script).

## 5. Review status
A figure counts as reviewed only when its record has `review: { decision: 'approved', reviewer, reviewed_at }`
(`isReviewed` in `components/report/model.js`). No record has one, so every figure is marked
"Provisional: awaiting editorial review" and every report carries the DRAFT watermark. When `lib/review-status.js`
and `data/reviews.json` are committed, replace `isReviewed` with a lookup of `review(dataset, id).approved` from that
module (dataset = data file stem, id = the record's id); the DRAFT mark then clears by itself once every included
figure is approved.

## 6. Contractor names
Reports never read `projects[].contract`. `scripts/test-reports.js` fails if any withheld contractor name from
`data/siaya-projects.json` appears in a report page or PDF. One exception: a public body that the World Bank names as a
programme's implementing agency in `data/siaya-programmes.json` (Kenya Power and Lighting Company, for the electricity
modernisation project) may appear in the programme atlas, because it is named there as an implementer, not as a
contractor. Remove the exception in `bannedFor` if the owner wants it hidden there too.

## 7. Page-count ranges
Expected ranges per report are `pages` in `components/report/reports.json`; adjust them when sections are added.
