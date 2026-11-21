# Production provenance (21 Nov 2026)

Answers P0-1 of the monetisation audit handover: which code is live, and how it differs from the repository.

## Live site
- URL: https://takwimu.netlify.app (Netlify site bf11e227-c98e-4258-aff6-d7660459aef1). No other host: the Vercel and Cloudflare projects were deleted by the owner.
- Deploy method: CLI upload of `git archive HEAD` from branch `claude/eager-rubin-7bpcgq`; Netlify runs `npm run build` (Node 20, publish `dist`). Not deployed from `main`.
- Live commit: fa74dd0 (deploy 6b01524d4d8f44e63cd0b831, 21 Nov 2026). Evidence: live catalogue lists 75 datasets; live `/data/counties-cob.json` is 1,563,582 bytes, matching the head.
- This deploy was built here from `git archive` of fa74dd0 with every gate (build, smoke 75/75, axe, crawl, overflow), then uploaded with the build command in the upload copy set to a no-op, so Netlify only published `dist`.

## Repository head
- Head: fa74dd0, live.
- Locally, from a clean `git archive` of the head, every gate passes on Node 20.10, 20.20 and 22: analytics, validation, reconciliation, explore, derived tests, data build, `next build` (74 pages) and the built-HTML NaN check.

## Open difference
- Netlify builds of 14ebc25 failed twice (deploys 6b014e0c213e416b4ba62076 and 6b014f28e63220af2121ef0f): "Build script returned non-zero exit code: 2", about one minute into the build. Netlify's build log is not readable from the deploy tool, so the failing step is not yet known.
- Ruled out: missing files in the upload (the uploader excludes only node_modules, .git, .netlify, .env, coverage, tmp), Node version features, dependency drift (lockfile tracked and unchanged), CI environment variables, git or network calls in the build scripts.
- Workaround in use: prebuilt upload (above). Netlify's own `npm run build` still fails for reasons not visible here; reading the Netlify build log would let the remote build be restored.
