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
npm run dev
```

`npm run build` runs, in order: `test-analytics`, `validate-data` (provenance fields, JSON Schemas, sums, source-manifest SHA-256), `test-reconciliation` (one test per conflict case), `test-explore` (units), `test-derived`, `test-economy`, `test-governance`, `test-audits`, `test-fiscal-ledger`, `build-data`, `next build`, `check-built-html` (no `NaN`; gaps stay gaps). There is no hosted CI: run every gate locally before an upload.

Brief PDF: after a build, `NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js`, then build again.

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
