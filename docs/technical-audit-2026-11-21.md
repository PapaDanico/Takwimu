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
| Byte-identical output (re-checked after steps 2 to 5: `Reproducible: 78993fed…`) | `npm run verify:repro` builds twice and compares SHA-256 of every file in `dist/` (BUILD_ID masked). Two causes fixed: footer year from `new Date()` (now `SITE_UPDATED`), and webpack listing merged duplicate chunk ids in compile order (sorted by a plugin in `next.config.js`). Result: `Reproducible: 4938075e…` | Done (step 1) |
| Build gates | `npm run build` = unit tests, data validation, data publishing, `next build` | OK |
| Network at build | None needed: map outlines and data are committed | OK |
| CI | GitHub Actions has no runner (account level); Cloudflare build is unrelated noise | Gap: owner-level, outside the code |

## 3. Data schema and audit trail
| Item | Finding | Status |
|---|---|---|
| Schema | JSON Schema files in `schemas/` for `history`, `conflicts`, `subcounties` and `county`, checked at build by a small hand-written validator in `scripts/validate-data.js` (type, required, properties, additionalProperties, items, enum, minimum, maximum, pattern, local $ref; no new dependency). A test edit (bad status, extra field, string boolean) failed the build with three schema errors | Done (step 2). Page/table reference per observation still open |
| Per-figure source | Report per year, `field_source` overrides, `derived` flags; CSV carries source, URL, confidence, retrieval date, period | Partial: page and table references are not recorded per figure |
| Supersession | Conflict register keeps both values with `supersedes` and `verification_state` | OK, no reviewer yet |
| Source snapshots | `data/source-manifest.json` lists all 16 documents cited in `history.json` (10 Controller of Budget reports, 6 Auditor-General reports) with title, link, fiscal year, retrieval date, file URL, size, library MD5 and SHA-256. All 16 were downloaded on 21 Nov 2026 from the Parliament library DSpace bitstreams (4.2 GB); each MD5 matched the library's published checksum before the SHA-256 was recorded. `validate-data.js` fails the build if a cited report or audit URL is missing, or a hash is malformed or lacks `access: "unavailable on <date>"` when null. PDFs are not stored in the repo (size) | Done (step 3). Per-observation link to manifest entry still open |
| Negative results | `docs/source-access-log.md` | OK |

## 4. Reconciliation tests
- `scripts/test-analytics.js` (statistics helpers) and `scripts/validate-data.js` run on every build. Known contradictory values (OSR FY2023/24, pending bills 2021/2023/2024, recurrent absorption FY2024/25) are enforced in the register.
- Done (step 4): `scripts/test-reconciliation.js`, run by `npm run validate` and `npm run build`, has one explicit test per register case (11 cases): both values present, they differ, and the data the pages read uses the value the register's `effect` says is plotted (OSR alternates kept; pending bills use the Insights page's total rule). Plus arithmetic identities per year (budget and spending parts, development and recurrent absorption recompute) and the FY 2024/25 category sums: 62 tests pass. A meta-test fails if a register case has no test. Mutation check: setting FY 2016/17 recurrent spending to the text value 3.9 failed two tests. Still scripts, not a test framework (no new dependency).

## 5. Interface quality (measured on the built site, 59 pages)
| Check | Result |
|---|---|
| axe-core WCAG 2.2 AA, light and dark | 0 violations on 118 page-theme runs |
| Horizontal overflow at 360, 768, 900, 1024, 1280 px | 0 failures in 296 checks |
| Internal links | 68 unique, 0 broken |
| Titles, descriptions, one h1, lang | 0 issues after fixing the Siaya hub title |
| Smoke test (routes, charts, table view, keyboard tooltip, CSV, CSP) | 35 of 35 pass |
| Print contrast, light and dark | 0 low-contrast elements |
| Security headers live | CSP, HSTS, X-Frame-Options, Permissions-Policy present; 0 CSP violations in a real browser |

## 6. Brand assets
- `public/logo.svg` (Takwimu mark) is vector. The Danico Ventures logo exists only as WebP raster (`public/brand/`). Gap: vector version needed from the owner's original artwork; it must not be redrawn from the raster as if official.

## 7. Exports
- CSV and JSON downloads exist and match the charts' data files.
- Done (step 5): `/counties/siaya/brief/` is a print-optimised one-page brief built from `siaya.json`, `history.json` and `conflicts.json` (headline figures with source and confidence, ten-year table with gaps shown as dashes, audit opinions, caveats, sources and date), with a named `@page brief { size: A4 }`. `scripts/make-brief-pdf.js` (global Playwright, not a dependency) renders it to `public/briefs/siaya-fiscal-brief.pdf` and checks it: `pdfinfo` Pages: 1, 594.96 x 841.92 pts (A4); `pdftotext` extracts all section headings (5,789 characters). Linked from the Siaya hub and the Data page. The page passes axe (light and dark, 0 violations) and overflow at all five widths. Regenerating the PDF changes its embedded creation date, so commit it only when the brief content changes.

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
