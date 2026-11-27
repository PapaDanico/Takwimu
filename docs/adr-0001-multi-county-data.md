# ADR 0001: How a second county's data sits beside Siaya's

Status: accepted for Phase 1 (data layer only). Date: 27 Nov 2026. Scope: Kisumu (county code 042), the owner's choice for the next county.

## Context

Every Takwimu data file was written for Siaya: `data/history.json`, `data/siaya-*.json`, `data/conflicts.json` and the schemas named after them. Tests and review tools read those paths directly (`scripts/test-fiscal-ledger.js`, `scripts/test-audits.js`, `lib/review-status.js`, `lib/review-pack.js`, `scripts/machine-check.js`). Kisumu needs the same kinds of file: a fiscal series with every value sourced, audit opinions, a population denominator, a conflict register, review packs and machine checks. Two constraints apply:

1. Siaya's files, values and published output must not change. The site is live, and readers and reviewers cite its pages and downloads.
2. Kisumu must not reach the built site until its pages exist and are approved. That covers data files, values and pages.

The Siaya `history.json` schema is shaped around one county. It has fixed blocks for health, poverty and in-year figures, and its year rows have no fields for the equitable share, grants, the wage bill or the FIF split. The Siaya fiscal ledger (`data/siaya-fiscal-ledger.json`) is already generic. It holds one row per measure, year and source, records discrepancy cases and has a completeness matrix with the reason for every gap. Those measures are the ones the Kisumu core series needs.

## Options

A. **Copy and rename.** Add `data/kisumu-*.json`, copy each Siaya schema and test as `kisumu-*`. This is quick, but every rule then lives in two copies that drift apart, and a third county means a third copy.

B. **Move every county under `data/counties/<slug>/`, Siaya included.** This gives one layout. But it changes every Siaya path that the pages, `lib/`, the build and the published `/data/` downloads read, so Siaya's output would change and every link would need a redirect.

C. **A county registry: generic loaders and tests parameterised by slug.** Siaya keeps its legacy paths. A new county keeps its files under `data/counties/<slug>/` and uses the same file kinds and the same schemas, which are widened rather than copied. Tests loop over the registry, and an unpublished county is held back by a guard.

## Decision

Option C.

- `lib/county-registry.js` maps each county to its files by kind (`ledger`, `audits`, `population`, `conflicts`), its review outputs and its research register. Siaya maps to its existing files. Kisumu maps to `data/counties/kisumu/fiscal-ledger.json`, `audits.json`, `population.json` and `conflicts.json`.
- **Core fiscal series = the ledger model.** Kisumu's budget, spending (recurrent and development), absorption, equitable share and grants, OSR (ordinary and FIF kept apart), pending bills and wage bill are ledger observations. CoB and county-paper values sit side by side, and the discrepancy cases and the completeness matrix (gaps with reasons) are recomputed by `scripts/build-county-ledger.js`. Values from `data/counties-cob.json` (FY 2021/22 to 2024/25) are reused with `reused_from` and must equal that file exactly.
- **Schemas are widened, not copied.** Every change only widens a schema, so every Siaya file still validates:
  - `schemas/siaya-fiscal-ledger.schema.json` accepts county Kisumu or code 42, the `K` id prefix, rates in %, and the `second_reading` and `needs_page_check` fields.
  - `schemas/siaya-audits.schema.json` adds the separately audited entities (County Revenue Fund, Receiver of Revenue, water company) and the opinion fields `tier`, `quote`, `read_method`, `second_reading` and `needs_page_check`. Findings may be empty, and `scripts/test-audits.js` still requires findings for Siaya.
  - `schemas/conflicts.schema.json` accepts `K` ledger cases and an `observations` list.
  - `schemas/county-population.schema.json` is new, because Siaya's population sits inside `history.json`.
- **Tests are parameterised.**
  - `scripts/test-fiscal-ledger.js` and `scripts/test-audits.js` run Siaya's checks unchanged, then the same generic checks for each county in the registry. Another county also gets source hashes matched against the manifest or the research register, a second reading for every OCR value, a page-check flag whenever readings disagree, no reuse of Siaya's `history.json`, and the secondary or primary tier rules.
  - New: `scripts/test-county-reconciliation.js` runs one test per conflict case and checks that every ledger case is in the register. `scripts/test-county-population.js` checks that the parts add up and that projections are labelled.
- **Review.** `lib/county-review.js` derives each value's state by the same rules as `lib/review-status.js`: pending, or disputed when the value is in an open conflict. Approval needs a record whose hash matches the source. `scripts/review-packs.js --county <slug>` and `scripts/machine-check.js --county <slug>` write the county's packs and machine checks to its own files. Siaya's `data/review-packs.json`, `data/machine-checks.json` and `data/reviews.json` are untouched.
- **Guard (NOT_YET_ON_PAGES).** The registry lists every county that `lib/counties.js` does not mark published. `scripts/test-unpublished-counties.js` fails the build in two situations:
  - Before the build: a page, component or library reads a held file or the registry; `scripts/build-data.js` copies one; a route `app/counties/<slug>/` exists; `data/reviews.json` holds a record for the county; any value is approved; or the packs or machine checks are stale.
  - After the build, with `dist`: any path under `dist/` or any built file contains a record id, source id, conflict id or file title that exists only in the held files.

## Consequences

- Siaya's output is byte-identical. A before/after hash of every file in `dist/` shows 0 changes on Siaya pages and data files (see the Phase 1 report).
- A third county needs only a registry entry, its files under `data/counties/<slug>/` and an id prefix letter. It needs no new test or schema copy.
- When Kisumu gets pages, it leaves `NOT_YET_ON_PAGES`: `lib/counties.js` marks it published, the pages read through the registry, and `scripts/build-data.js` publishes its files through `lib/county-review.js`. At that point a published-copy mask for rejected values, as Siaya's `publishedCopy` provides, must be added. That is deliberately not built in Phase 1.
- Siaya's paths stay a special case in the registry. Moving them under `data/counties/siaya/` is possible later, but only together with redirects for the published `/data/` files.
- The schema file names still say "siaya" because pages and docs cite them. Their titles now say they are county schemas.
