# Monitoring

Takwimu is a static site with no server, no analytics and no trackers (`docs/data-protection-policy.md`), so monitoring is a set of scripts run by a person on a schedule, plus Netlify's own deploy log. GitHub Actions is retired (no runner on the account), so nothing runs automatically. All scripts below are read-only towards `data/`.

## Schedule

| When | Run | Look for | Act |
|---|---|---|---|
| Weekly | Open https://takwimu.netlify.app, `/counties/siaya/`, `/kenya/`, `/data/`; check WhatsApp reports | Page errors, reader corrections | `docs/ops/editorial-sop.md` section 1 |
| Weekly | `curl -sI https://takwimu.netlify.app/` | HTTP 200; `Content-Security-Policy` and `Strict-Transport-Security` present | If down, check Netlify status; roll back if a deploy caused it (`docs/ops/release-checklist.md` section 6) |
| Monthly | `node scripts/ops/check-sources.js` (about 5 minutes; one request per second per host) | `docs/ops/source-health.md`: changed, moved, broken, blocked | `docs/ops/editorial-sop.md` section 3; commit the refreshed report and `docs/ops/source-health.json` |
| Monthly | `node scripts/review-queue.js` | Review backlog | Work the queue (`docs/editorial/review-sop.md`) |
| Monthly | Live data check: SHA-256 of live `/data/*.json` against the last gated build | Any mismatch means the live site is not the recorded commit | Re-run the release verification; record in `docs/production-provenance.md` |
| Quarterly | `node scripts/ops/freshness.js` | `docs/ops/freshness.md`: overdue, due | Check the publisher; open a research task for a new edition (CoB quarterly and annual reports, OAG audits, KNBS GCP, CBK series, IBP rounds) |
| Quarterly | `bash scripts/ops/backup-drill.sh` | `drill: PASS` | Record in `docs/ops/backup-restore.md`; on FAIL fix before the next release |
| Quarterly | `npm audit --omit=dev` | High or critical advisories in shipped dependencies | Upgrade on the branch, run every gate |
| Each release | `docs/ops/release-checklist.md` | All gates pass | Deploy, verify, record |

Overdue in `freshness.md` means "a newer edition should exist by the publisher's cadence", not that the site is wrong. Cadences and their basis are listed at the end of that report and in `scripts/ops/freshness.js`.

## Netlify remote build failure (intermittent)

Netlify builds the uploaded archive with `npm run build`. Builds have failed with "exit code 2" and no log on commits that then built cleanly unchanged (14ebc25 twice; 964f39e once, then deploy 6b0173e08c671088668f7426 succeeded). The cause is not in our code.

1. Do not change code in response. Confirm the same commit passes every local gate.
2. Retry the upload once, unchanged.
3. If it fails again, use the **prebuilt fallback** used once before (see `docs/production-provenance.md`, "Upload safeguard"): in the upload copy only (not committed), set the build command so that Netlify still runs `npm run build`, and if that fails, publishes the locally gated `dist/` shipped in the upload, and writes Netlify's build log to `/_diag/netlify-build-log.txt` (noindex). Example for the upload copy's `netlify.toml`:

   ```toml
   [build]
     command = "mkdir -p _diag; (npm run build > _diag/netlify-build-log.txt 2>&1) || (rm -rf dist && cp -r dist-prebuilt dist); mkdir -p dist/_diag && cp _diag/netlify-build-log.txt dist/_diag/"
     publish = "dist"
   ```

   where `dist-prebuilt/` is the `dist/` from the gated local build of the same commit. Add `X-Robots-Tag: noindex` for `/_diag/*`.
4. After publishing, verify that live `/data/*.json` hashes equal the gated build (release checklist section 5), read the diagnostic log, and record the deploy id, which path published (remote build or fallback) and the log finding in `docs/production-provenance.md`.
5. The next normal deploy removes `/_diag/`. Never leave the fallback in the committed `netlify.toml`.

## What is not monitored, by design

No uptime pinger, error tracker, real-user monitoring or analytics: each would add a third party or collect visitor data, which the data-protection policy rules out. If the owner wants automated scheduling later, the scripts above can run from any scheduler without code changes; that needs the owner's decision on where it runs.
