# Release checklist

For a major release only (owner policy, 21 Nov 2026: commit and push often, deploy once per milestone). Production is the Netlify site `takwimu` (https://takwimu.netlify.app, site id `bf11e227-c98e-4258-aff6-d7660459aef1`), deployed by command-line build of `main` by Netlify's GitHub link (since 27 Nov 2026; branch pushes do not deploy). Netlify runs only `npm run build`, so the local gates below are the CI. GitHub Actions is retired; Cloudflare and Vercel checks on pull requests are noise.

Stop at the first failure. Do not deploy around a failing gate.

## 1. Before the gates
1. Working tree clean (`git status`), branch is `claude/eager-rubin-7bpcgq`, pushed (`git pull --rebase`, then `git push`).
2. Note the commit: `git rev-parse --short HEAD`.
3. Owner has approved the milestone. No new feature breaks `docs/data-protection-policy.md` (no forms, cookies, trackers or personal data).

## 2. Gates, in order
1. `npm ci`
2. `npm run build` (unit tests, `scripts/validate-data.js` with JSON Schemas in `schemas/`, source manifest SHA-256 checks, `scripts/test-reconciliation.js` (one test per conflict case), `scripts/test-explore.js` units, the sector tests, `scripts/build-data.js`, `next build`, `scripts/check-built-html.js dist`, `scripts/test-reviews.js dist`).
3. `npm run typecheck`
4. `NODE_PATH=$(npm root -g) node scripts/smoke-test.js dist` (Playwright stays global).
5. `npm run qa:axe`, `npm run qa:crawl`, `npm run qa:overflow`: 0 accessibility violations, no broken internal links, no horizontal overflow.
6. `npm run verify:repro` must print `Reproducible: <hash>`.
7. `node scripts/ops/test-ops.js` (ops scripts' own tests).
8. Brief and report PDFs, if their content changed: rebuild, then `NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js` (and `scripts/make-reports-pdf.js`).
9. Operational checks for the release notes (not blocking unless they show a changed hashed document):
   - `node scripts/ops/freshness.js` (writes `docs/ops/freshness.md`);
   - `node scripts/ops/check-sources.js` (writes `docs/ops/source-health.md`). A **changed** document blocks release of the values read from it until an editor re-reads them (see `docs/ops/editorial-sop.md`).

## 3. Provenance update (before merging)
1. Add the release to `docs/production-provenance.md`: commit, what changed, gate results (smoke n/n, axe 0 in n runs, pages crawled, repro hash).
2. Commit and push that change on the branch, so it is part of the merge.

## 4. Deploy
1. Open a pull request from `claude/eager-rubin-7bpcgq` into `main` and merge it. Netlify builds and publishes `main`.
2. Record the new deploy id and Netlify's build result (exit code, Node version).
3. If the remote build fails with no code change (it has happened: 6b014e0c…, 6b014f28…, 6b01733a…), follow `docs/ops/monitoring.md` "Netlify remote build failure". Do not change code to "fix" an intermittent remote failure.

## 5. Live verification
1. Home, `/counties/siaya/`, `/kenya/`, `/datasets/`, `/compare/`, `/stories/`, `/data/`, `/corrections/`, `/learn/` load with HTTP 200.
2. Redirects: `/trends/` and `/explore/` return 301 to `/kenya/` and `/datasets/`; every redirect in `netlify.toml` lands on a 200 page (`check-redirects` guards this in the build).
3. Data files: download `/data/*.json` from the live site and compare SHA-256 with the gated `dist/data/` (method in `docs/audit/production-baseline.md`). All must match.
4. Headers on `/`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`; no cookies set; no third-party requests (browser network tab).
5. `/reports/#briefs` links to the WhatsApp chat; no form is present.
6. Write the result into `docs/production-provenance.md` (live commit, deploy id, date) and push.

## 6. Rollback
Netlify deploys are immutable, so rollback needs no code change:
1. Netlify dashboard: Sites > takwimu > Deploys, open the last good deploy (ids are in `docs/production-provenance.md`), click **Publish deploy**.
2. Or by API: `POST https://api.netlify.com/api/v1/sites/{site_id}/deploys/{deploy_id}/restore` (CLI: `netlify api restoreSiteDeploy --data '{"site_id":"bf11e227-c98e-4258-aff6-d7660459aef1","deploy_id":"<id>"}'`).
3. Repeat step 5 against the restored deploy, then record the rollback (reason, deploy id) in `docs/production-provenance.md`.
4. Fix forward on the branch; the next release goes through every gate again.

Full restore procedure, including rebuilding from git if Netlify history were lost: `docs/ops/backup-restore.md`.
