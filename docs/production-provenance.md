# Production provenance (21 Nov 2026)

Answers P0-1 of the monetisation audit handover: which code is live, and how it differs from the repository.

## Live site
- URL: https://takwimu.netlify.app (Netlify site bf11e227-c98e-4258-aff6-d7660459aef1). No other host: the Vercel and Cloudflare projects were deleted by the owner.
- Live commit: 9cd7100 (deploy 6b016220c93979646e7f2eb9, 21 Nov 2026), built by Netlify itself (`npm run build`, Node 20.20.2, npm 10.8.2, exit 0). The same commit was first built here with every gate (build, smoke 93/93, axe 0 violations in 140 runs, crawl, overflow, verify:repro, typecheck). Live `/data/counties-cob.json` is byte-identical to that gated build.
- Upload safeguard used once: the upload copy's build command kept the gated build as a fallback and published Netlify's log at /_diag/netlify-build-log.txt (noindex). The fallback was not needed. The log file disappears with the next deploy.

## Remote build
- Netlify builds of 14ebc25 failed twice (6b014e0c213e416b4ba62076, 6b014f28e63220af2121ef0f, "exit code 2", no log available). The build of 9cd7100 succeeded on Netlify, so the failure did not recur; its cause is not known. The repository's netlify.toml is unchanged (`npm run build`).
- The source bundle of deploy 6b015baea170bec3a2fa36e9 (supplied by the owner) contains every tracked file, ruling out missing files in the upload.
