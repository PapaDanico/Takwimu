# Takwimu Kenya

**Turning Data into Progress.**

Civic education on Kenyan public finance and statistics, focused on trends. Siaya County is the published county (`/counties/siaya/`); national pages (`/kenya/`, `/explore/`, `/compare/`, `/datasets/`, `/stories/`) cover all 47 counties where data exists. Every figure shows its source, publication date, period, unit and confidence. Conflicting sources are shown side by side.

Live site: https://takwimu.netlify.app

## Stack and hosting

- Next.js 14 static export (`output: 'export'`, `trailingSlash: true`, output in `dist/`), React 18, Tailwind 3. TypeScript is used for type checking only.
- Hosted on Netlify only. No server, functions, database, accounts, forms, analytics or cookies.
- Production is built from branch `claude/eager-rubin-7bpcgq` by command-line upload to Netlify, not from `main` and not by Git push. `main` holds an older, different product. See `docs/architecture-map.md`.

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

`npm run build` runs, in order: `test-analytics`, `validate-data` (provenance fields, JSON Schemas, sums, source-manifest SHA-256), `test-reconciliation` (one test per conflict case), `test-explore` (units), `test-derived`, `test-economy`, `test-governance`, `test-audits`, `test-fiscal-ledger`, `test-health`, `test-education`, `test-agriculture`, `test-geography`, `test-wards-geo`, `test-climate` (also checks that no phone or ID number from the PCRA's participant annex is extracted), `test-siaya-analysis`, `test-projects`, `test-programmes`, `test-research-deliverables`, `test-reviews`, `test-imf` (IMF WEO: types, vintages, comparisons), `ops/test-ops` (offline, 60 checks), `build-data`, `next build`, `check-built-html` (no `NaN`; gaps stay gaps), and `test-reviews dist --synthetic`: a second, throwaway build into `dist-synthetic/` with one synthetic rejection per dataset held in memory only (never written to `data/reviews.json`), which fails unless every page, report, download and published data file withholds the value and every calculation using it. There is no hosted CI: run every gate locally before an upload.

The `qa:*` scripts and the smoke test use Playwright (and axe-core for `qa:axe`) installed globally, not as project dependencies; the npm scripts set `NODE_PATH=$(npm root -g)` themselves, so install them once with `npm i -g playwright axe-core && npx playwright install chromium`. Run them after `npm run build`; they serve `dist/` locally.

Brief PDF: after a build, `NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js`, then build again. Report PDFs: `npm run build`, `npm run reports:pdf`, `npm run build`, then `npm run test:reports`, which must pass before any deploy (release gate).

Monitoring (not part of the build; see `docs/ops/monitoring.md`): `npm run ops:check-sources`, `npm run ops:freshness`, `npm run ops:backup-drill`.

## Data rules

- Every figure carries source, publication date, period, unit and confidence.
- Series go back 10 years (`data/history.json`, `data/cpi.json`). Gaps are listed, never filled; unknowns are never shown as zero.
- Conflicting figures are shown side by side and tested in `scripts/test-reconciliation.js`.
- Cited PDFs are pinned by SHA-256 in `data/source-manifest.json`.
- No verdict labels on named individuals without a primary document and legal review.
- No personal data is collected (`docs/data-protection-policy.md`).

## Deploying

Deploy once per major release (owner policy). Run all gates, upload a clean `git archive` of a gated commit to the Netlify site, then check the live pages and data files. Record the deploy in `docs/production-provenance.md`. Rollback: publish an earlier deploy in the Netlify dashboard.

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
