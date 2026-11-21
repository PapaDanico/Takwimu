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
| Byte-identical output | `npm run verify:repro` builds twice and compares SHA-256 of every file in `dist/` (BUILD_ID masked). Two causes fixed: footer year from `new Date()` (now `SITE_UPDATED`), and webpack listing merged duplicate chunk ids in compile order (sorted by a plugin in `next.config.js`). Result: `Reproducible: 4938075e…` | Done (step 1) |
| Build gates | `npm run build` = unit tests, data validation, data publishing, `next build` | OK |
| Network at build | None needed: map outlines and data are committed | OK |
| CI | GitHub Actions has no runner (account level); Cloudflare build is unrelated noise | Gap: owner-level, outside the code |

## 3. Data schema and audit trail
| Item | Finding | Status |
|---|---|---|
| Schema | JSON Schema files in `schemas/` for `history`, `conflicts`, `subcounties` and `county`, checked at build by a small hand-written validator in `scripts/validate-data.js` (type, required, properties, additionalProperties, items, enum, minimum, maximum, pattern, local $ref; no new dependency). A test edit (bad status, extra field, string boolean) failed the build with three schema errors | Done (step 2). Page/table reference per observation still open |
| Per-figure source | Report per year, `field_source` overrides, `derived` flags; CSV carries source, URL, confidence, retrieval date, period | Partial: page and table references are not recorded per figure |
| Supersession | Conflict register keeps both values with `supersedes` and `verification_state` | OK, no reviewer yet |
| Source snapshots | Not stored; no checksums | Gap |
| Negative results | `docs/source-access-log.md` | OK |

## 4. Reconciliation tests
- `scripts/test-analytics.js` (statistics helpers) and `scripts/validate-data.js` run on every build. Known contradictory values (OSR FY2023/24, pending bills 2021/2023/2024, recurrent absorption FY2024/25) are enforced in the register.
- Gap: tests are scripts, not a test framework; no fixtures per contradictory case beyond the register checks.

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
- CSV and JSON downloads exist and match the charts' data files. PDF: only a print stylesheet; no generated, paginated PDF. Gap.

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
