# Technical audit, 21 November 2026

Evidence-based baseline before the design-system overhaul and fiscal intelligence expansion. Every line below was checked in this session; nothing is inferred from the live site alone.

## 1. What deploys production
- Live: https://takwimu.netlify.app, Netlify site `bf11e227-…`, CLI upload of `git archive` of branch `claude/eager-rubin-7bpcgq` (see `docs/architecture-map.md`). `main` is an older, different product and must not be deployed.
- Last verified deploys: `6b00fa9b…` (commit `7d4ffed`), `6b0100c7…` (commit `6710b05`, national release).

## 2. Build reproducibility
| Check | Finding | Status |
|---|---|---|
| Lockfile | `package-lock.json` committed | OK |
| Node version | `.nvmrc` pins 20, `engines` is `>=20 <21`; Netlify builds on Node 20; local checks ran on Node 22 | OK |
| Byte-identical output (re-checked after steps 2 to 5: `Reproducible: 78993fed…`; after the brand redesign: `Reproducible: d2550c5a…`) | `npm run verify:repro` builds twice and compares SHA-256 of every file in `dist/` (BUILD_ID masked). Two causes fixed: footer year from `new Date()` (now `SITE_UPDATED`), and webpack listing merged duplicate chunk ids in compile order (sorted by a plugin in `next.config.js`). Result: `Reproducible: 4938075e…` | Done (step 1) |
| Build gates | `npm run build` = unit tests, data validation, data publishing, `next build` | OK |
| Network at build | None needed: map outlines and data are committed | OK |
| CI | GitHub Actions has no runner (account level); Cloudflare build is unrelated noise | Gap: owner-level, outside the code |

## 3. Data schema and audit trail
| Item | Finding | Status |
|---|---|---|
| Schema | JSON Schema files in `schemas/` for `history`, `conflicts`, `subcounties` and `county`, checked at build by a small hand-written validator in `scripts/validate-data.js` (type, required, properties, additionalProperties, items, enum, minimum, maximum, pattern, local $ref; no new dependency). A test edit (bad status, extra field, string boolean) failed the build with three schema errors | Done (step 2). Page references added 21 Nov 2026 (`$defs/provenance`) |
| Per-figure source | Report per year, `field_source` overrides, `derived` flags; CSV carries source, URL, confidence, retrieval date, period. 21 Nov 2026: every observation (120 year figures, 8 audit opinions, 12 own-source revenue points and 5 alternates) has `source_id` (manifest entry), PDF page, printed page where the report numbers pages consistently, and how it was read. All 145 were found again in the re-downloaded PDFs (SHA-256 matched the manifest first): text layer by `pdftotext -layout`, scanned pages by RapidOCR on candidate pages only; 0 not located. The 22 in-year figures were re-checked on their recorded pages (all found). The CSV has `source_id`, `pdf_page`, `printed_page` and `page_note` columns; the Data page lists every reference by year. Re-reading found three disagreements, now in the register (19 cases): FY 2022/23 development absorption 53.8 (table) against 53.4 (text), and FY 2023/24 absorption read 85.8 and 64.5 by the PDF's text layer but 86.8 and 64.6 by RapidOCR and the department table. Plotted values unchanged until a reviewer checks the page images | Done |
| Supersession | Conflict register keeps both values with `supersedes` and `verification_state` | OK, no reviewer yet |
| Source snapshots | `data/source-manifest.json` lists all 16 documents cited in `history.json` (10 Controller of Budget reports, 6 Auditor-General reports) with title, link, fiscal year, retrieval date, file URL, size, library MD5 and SHA-256. All 16 were downloaded on 21 Nov 2026 from the Parliament library DSpace bitstreams (4.2 GB); each MD5 matched the library's published checksum before the SHA-256 was recorded. `validate-data.js` fails the build if a cited report or audit URL is missing, or a hash is malformed or lacks `access: "unavailable on <date>"` when null. PDFs are not stored in the repo (size). 21 Nov 2026: 7 more documents for the in-year, FY 2019/20 and audit additions (23 in all); 5 MD5-verified and hashed, 2 from sites without published checksums listed with a null hash and `access: "downloaded <date>; not hashed: …"` | Done (step 3); per-observation link done 21 Nov 2026 |
| Negative results | `docs/source-access-log.md` | OK |

## 4. Reconciliation tests
- `scripts/test-analytics.js` (statistics helpers) and `scripts/validate-data.js` run on every build. Known contradictory values (OSR FY2023/24, pending bills 2021/2023/2024, recurrent absorption FY2024/25) are enforced in the register.
- Done (step 4): `scripts/test-reconciliation.js`, run by `npm run validate` and `npm run build`, has one explicit test per register case (11 cases): both values present, they differ, and the data the pages read uses the value the register's `effect` says is plotted (OSR alternates kept; pending bills use the Insights page's total rule). Plus arithmetic identities per year (budget and spending parts, development and recurrent absorption recompute) and the FY 2024/25 category sums: 62 tests pass. A meta-test fails if a register case has no test. Mutation check: setting FY 2016/17 recurrent spending to the text value 3.9 failed two tests. Still scripts, not a test framework (no new dependency).

## 5. Interface quality (measured on the built site, 59 pages)
| Check | Result |
|---|---|
| axe-core WCAG 2.2 AA, light and dark | 0 violations on 120 page-theme runs (re-run after the brand redesign) |
| Horizontal overflow at 320, 360, 768, 900, 1024, 1280 px (320 added 21 Nov 2026 after the brief's six-column table scrolled the page; it now scrolls inside a focusable region) | 0 failures in 360 checks (60 pages) |
| Internal links | 71 unique, 0 broken |
| Titles, descriptions, one h1, lang | 0 issues after fixing the Siaya hub title |
| Smoke test (routes, charts, table view, keyboard tooltip, CSV, CSP) | 35 of 35 pass |
| Print contrast, light and dark | 0 low-contrast elements |
| Security headers live | CSP, HSTS, X-Frame-Options, Permissions-Policy present; 0 CSP violations in a real browser |

## 6. Brand assets
- 21 Nov 2026 redesign with the owner's artwork only (see `brand/README.md`): horizontal lockup in the header from 768 px, symbol plus name below; full logo on a light panel in the footer and on the PDF brief; brand tokens drive links, eyebrows, buttons, nav, focus ring, section accents and footer. Header and footer measured with Playwright (deviceScaleFactor 1) at 320, 360, 767, 768, 900, 1024, 1199, 1200 and 1280 px, light and dark: no overlap between brand, nav, county menu, status and report controls, nothing clipped, all images loaded, header row 68 px (narrow) or 80 px. The "Checked" status pill now shows from 1200 px (was 1024) to make room for the lockup.
- Built-HTML check: `scripts/check-built-html.js` runs at the end of `npm run build` and fails if any page contains "NaN". Added after the FY 2019/20 row (own-source revenue only) produced NaN chart coordinates on Insights; chart helpers now turn any non-finite value into a gap.
- `public/logo.svg` (Takwimu mark) is vector. The Danico Ventures logo exists only as WebP raster (`public/brand/`). Gap: vector version needed from the owner's original artwork; it must not be redrawn from the raster as if official.

- Brown theme (21 Nov 2026): page background is the footer's brand charcoal `#17191C` (measured in `app/globals.css`; it is a very dark neutral charcoal, which reads as brown beside the green and orange). Light and dark colour preferences get the same theme; print stays on white. Measured after the change: axe 0 violations on 120 page-scheme runs, print contrast 0 low-contrast elements in both schemes, overflow 0 of 360, crawl 0 issues, smoke 36 of 36, reproducible. Chart series: dark set, contrast against cards #24221F from 4.02:1 (--s5) to 5.17:1 (--s4).

- National navigation (21 Nov 2026): header and mobile bottom nav are Home, Counties, Learn, Data, Method; no single county in the primary navigation. Siaya's pages (hub, Insights, Analytics, Sub-counties, Profile, brief) mark Counties as current and carry the breadcrumb Counties · Siaya · page; in-preparation county pages carry Counties · county. Home leads with the Kenya map, a neutral "1 of 47 counties published so far" line, a "Published so far" row and a county finder (`components/CountyFinder.js`, a text filter over the 47 names and codes; without JavaScript the full list shows), which also replaces the static list on `/counties/` so mobile users reach it from the Counties tab. Footer Explore lists Home, All 47 counties and Open data; the 47-county list stays. Map colours on the brown theme: published counties in the accent green, others #7A7262 (3.3:1 on cards), keyboard focus an orange outline. Every URL is unchanged; `lib/site.js` PAGES reordered.

- Copy pass (21 Nov 2026): national, neutral headlines. Examples: home h1 "Kenya's public finances and statistics, county by county, made plain" became "Kenya's 47 counties, in plain numbers you can check"; Insights "Auditors have not given the County Executive a clean opinion in any year we can read" became "Every audit opinion we can read for the County Executive is qualified, adverse or a disclaimer"; "The development budget is rarely fully spent" became "Development spending ranged from 30.5 to 66.4 per cent of its budget"; Analytics "Two warning lights" became "Two indicators to watch". No number, source, caveat, legal obligation or URL changed. PDF brief regenerated: 1 A4 page, 5,607 characters.

- Sweep 13 (21 Nov 2026, `docs/bug-sweep-log.md`): 600 runs (60 pages, 2 colour preferences, 320 to 1280 px, disclosures open) with axe, overflow, console/CSP, alt and literal-text checks: 0 issues after fixing keyboard access to scrolling tables (`components/TableWrap.js`) and the Netlify Content-Type of Next route payloads (`netlify.toml`; live check pending the next deploy).

## 7. Exports
- CSV and JSON downloads exist and match the charts' data files.
- Done (step 5): `/counties/siaya/brief/` is a print-optimised one-page brief built from `siaya.json`, `history.json` and `conflicts.json` (headline figures with source and confidence, ten-year table with gaps shown as dashes, audit opinions, caveats, sources and date), with a named `@page brief { size: A4 }`. `scripts/make-brief-pdf.js` (global Playwright, not a dependency) renders it to `public/briefs/siaya-fiscal-brief.pdf` and checks it: `pdfinfo` Pages: 1, 594.96 x 841.92 pts (A4); `pdftotext` extracts all section headings (5,789 characters). Regenerated 21 Nov 2026 with the brand header (full logo), brand colours, the FY 2014/15 and 2015/16 audit rows, and key caveats moved to a full-width two-column list to stay on one page: Pages 1, A4, tagged, 5,534 characters. Linked from the Siaya hub and the Data page. The page passes axe (light and dark, 0 violations) and overflow at all five widths. Regenerating the PDF changes its embedded creation date, so commit it only when the brief content changes.

## Defects fixed in this sweep
1. Siaya hub shared the home page title (missing metadata).
2. County menu stayed open after choosing a county; now closes on navigation, Escape and outside click.
3. Siaya's own pages (Insights, Analytics, Sub-counties, Profile) did not mark "Siaya" as the current section; now they do, with a breadcrumb back to Counties and Siaya.

## Plan (in order, each step keeps existing pages, URLs, sources and history)
1. Pin Node and add a reproducible-build check (clean install and build twice, compare output hashes).
2. Typed schema: JSON Schema for history, conflicts and county files, validated at build; add page/table reference per observation as figures are re-checked.
3. Source snapshots: store SHA-256 of each source PDF in a manifest; link each observation to it.
4. Reconciliation tests as fixtures: one test per known disagreement, expected to stay visible.
5. Design system: tokens, type scale and components documented; migrate page by page with the existing axe, overflow and smoke gates as the guard.
6. PDF briefs: a printable one-page county brief generated from the same data, checked for clipping and text extractability.
7. Fiscal intelligence: pending-bills roll-forward (only where all terms are published), audit findings tracker, then a second county.

## Pending-bills roll-forward (21 Nov 2026)
- `history.json` `pending_rollforward`: 11 fiscal years (FY 2014/15 to FY 2024/25), each term with its report page or marked not published. Shown on Insights (`/insights/#rollforward`) under the pending-bills chart.
- Complete years (all five terms published): 0. No report publishes write-offs or adjustments. FY 2021/22 (Table 3.251) and FY 2022/23 publish opening, new bills, payments and closing, and those add up with no adjustment, but they stay incomplete because the reports do not state that adjustments were nil. FY 2023/24 and FY 2024/25 publish opening, payments and closing but not new bills. FY 2014/15 to FY 2020/21 publish only the closing stock (FY 2014/15 only its development part; FY 2019/20 no report).
- Tests: 11 roll-forward tests (one per year: identity if complete, otherwise gap shown and not filled), 2 published-terms checks, 1 cross-check of closing stocks against the series. Re-reading found three more disagreements, added to the register (22 cases): stock at 30 June 2022 in two reports (705.38 against 840.67), and within one report (705.38 against 789.96), and the FY 2024/25 year-end stock (Table 3.457 KSh 545.95m against KSh 1.12bn in the text); the FY 2022/23 report's closing 873.38 is added as a third value to `pending-2023`.

## Phase 2: national and 47-county data, Explore pages (21 Nov 2026)
- Data: `data/national.json` (14 WDI series, 13 with values, 2010 to 2025) and `data/counties-cob.json` (47 counties, FY 2023/24 and 2024/25, 21 measures each, every value with table and page). Schemas `schemas/national.schema.json`, `schemas/counties-cob.schema.json` (validator gained `allOf`). Mutation check: changing one county budget, one printed page and one null status failed four checks. Manifest: World Bank API entry; the two CoB reports now list the counties file. Register: 23 cases (new `budget-2024-25`; further values 82, 87.0, 64.6, 1,890.0 and 927.34 in five cases); reconciliation 101 tests.
- Unit fix (review finding): national downloads had raw values labelled with display units (population as "million people"). Downloads now keep the World Bank unit; `scripts/test-explore.js` (in the build) checks every indicator's scale against its unit and plausible ranges.
- Pages: /explore/, /datasets/ (21 datasets, search and five filters in the address, saved views), /kenya/ (sparkline cards, county totals, trend explorer with 23 series and real terms for money, sources table), /compare/ (ordered list, shaded map, table with pages and notes, two to four side by side), /stories/ and three stories. /trends/ was merged into /kenya/ in sweep 14 (301 in netlify.toml); see docs/bug-sweep-log.md for every de-duplication. `app/error.js`, friendlier 404. Navigation: Home, Explore, Counties, Learn, Data & Method.
- Gates on the final tree (after sweep 14): build (validation, reconciliation 101 tests, explore units and 60 noted county values, NaN check on 71 pages), smoke 72 of 72, axe 0 violations on 136 page-scheme runs plus 30 interactive states at 360 and 1280 px, overflow 0 of 408 (320 to 1280 px), crawl 68 pages and 101 internal links with 0 issues, print contrast 0 low-contrast on the new pages in both schemes, typecheck clean, `Reproducible: 085063f4...`.
- Not done: county data before FY 2023/24; per-person county figures (no county population series loaded); a reviewer check of OCR readings against page images; a vector Danico logo.
