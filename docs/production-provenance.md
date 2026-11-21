# Production provenance (21 Nov 2026)

Answers P0-1 of the monetisation audit handover: which code is live, and how it differs from the repository.

## Live site
- URL: https://takwimu.netlify.app (Netlify site bf11e227-c98e-4258-aff6-d7660459aef1). No other host: the Vercel and Cloudflare projects were deleted by the owner.
- Deploy method: CLI upload of `git archive HEAD` from branch `claude/eager-rubin-7bpcgq`; Netlify runs `npm run build` (Node 20, publish `dist`). Not deployed from `main`.
- Live commit: 181480d (last successful deploy, 06:31 UTC). Evidence: live `/data/counties-cob.json` is 729,136 bytes, identical to 181480d; live catalogue lists 21 datasets.

## Repository head
- Head: 14ebc25. Not live. Commits after the live one: 1bce11f, 1a7a21f, 62ff37e, 2ecaa67, 33f5a85, 14ebc25.
- Locally, from a clean `git archive` of the head, every gate passes on Node 20.10, 20.20 and 22: analytics, validation, reconciliation, explore, derived tests, data build, `next build` (74 pages) and the built-HTML NaN check.

## Open difference
- Netlify builds of 14ebc25 failed twice (deploys 6b014e0c213e416b4ba62076 and 6b014f28e63220af2121ef0f): "Build script returned non-zero exit code: 2", about one minute into the build. Netlify's build log is not readable from the deploy tool, so the failing step is not yet known.
- Ruled out: missing files in the upload (the uploader excludes only node_modules, .git, .netlify, .env, coverage, tmp), Node version features, dependency drift (lockfile tracked and unchanged), CI environment variables, git or network calls in the build scripts.
- Next step: read the Netlify build log, or bisect by deploying 2ecaa67 (ahead of the live commit). Either needs the owner.
