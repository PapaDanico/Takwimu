# Production baseline (WO-00)

Audit date: 21 Nov 2026, about 12:40-13:10 UTC. Read-only: nothing was deployed. Each finding is **CONFIRMED** (with the evidence that was checked) or **UNVERIFIED** (not checked, or checked only from documents).

Verdict: the production source is established. takwimu.netlify.app is served by Netlify deploy `6b0189a18ee52f737fafa147`, built from commit `d413b53` on branch `claude/eager-rubin-7bpcgq` of `PapaDanico/Takwimu`. The handover's stop condition (production source unknown) does not apply.

## 1. Repository and branch

| Finding | Status | Evidence |
|---|---|---|
| Repository is `https://github.com/PapaDanico/Takwimu` | CONFIRMED | `git remote -v` |
| Production branch is `claude/eager-rubin-7bpcgq` (pull request 1 against `main`), not `main` | CONFIRMED | `git status -sb`; `docs/architecture-map.md`. `main` holds the older Cloudflare-style "Takwimu Intelligence Engine" layout, which is why the handover found a mismatched README |
| HEAD at audit start `2a2766a` (WIP, "gates not yet run"); `8d73ffd` landed during the audit | CONFIRMED | `git log`. Other agents commit to this branch concurrently |

## 2. Live deploy and commit

| Finding | Status | Evidence |
|---|---|---|
| Current production deploy is `6b0189a18ee52f737fafa147` (created 12:08 UTC, published 12:09:32 UTC, "Deploy triggered by upload", context production, state ready) | CONFIRMED | Netlify API: `get-project` (site `bf11e227-c98e-4258-aff6-d7660459aef1`) returns `currentDeploy.id = 6b0189a1...`; `get-deploy-for-site` for that id |
| `docs/production-provenance.md` is one deploy behind: it names `b25db36` / `6b01858b31a069addc134c37` (published 11:52 UTC) | CONFIRMED | Root HTML of takwimu.netlify.app (sha256 `09bd51c8db1ee445...`) is byte-identical to the `6b0189a1` permalink and differs from the `6b01858b` permalink (different `buildId` and chunk names) |
| Live content is commit `d413b53` ("Report-an-error links go to the Danico Ventures WhatsApp chat", 12:04 UTC) | CONFIRMED (by content) | Netlify records no commit for uploads (`commit_ref: null`), so this was matched by content: fresh `git archive d413b53` extract in `/tmp/claude-0/baseline-d413`, `npm run build` exit 0; **15/15** files in `dist/data/` (`*.json`, `*.csv`) match `curl https://takwimu.netlify.app/data/<file>` by sha256; visible text of `/`, `/counties/siaya/` and `/data/` matches. The `b25db36` build differs on `/data/` text and has no `wa.me` link in the home page; live and `d413b53` both have one |
| Example hash: `/data/counties-cob.json` = `cb4c26d09550a90eb161e064fb5bec51cc26c87c35faa314731488acb40e7907` live, in the `b25db36`, `d413b53` and HEAD (`2a2766a`) builds | CONFIRMED | `sha256sum` |
| HEAD (`2a2766a`, extract `/tmp/claude-0/baseline-src`) is ahead of live: `conflicts.json` differs (`386c23b0...` vs live `b26f78f4...`); `siaya-audits.json` and `siaya-fiscal-ledger.json` exist only in HEAD (live returns 404); `/counties/siaya/audits/` and `/ledger/` are not live | CONFIRMED | `curl` status codes and sha256 |
| Rendered HTML is not byte-comparable between builds: Next.js writes a random `buildId`, and JS chunk hashes differ between this machine (Node 22.23.5) and Netlify (Node 20) | CONFIRMED | Three local builds gave three `buildId`s and different `layout-*.js` names. Compare data files and page text, not HTML bytes |
| Netlify builds each upload remotely with `npm run build` (framework detected: next; no functions, no edge functions; 3 redirect rules, 5 header rules) | CONFIRMED | Deploy summary from the Netlify API |
| Whether the 6b0189a1 upload ran the full local gate set (smoke, axe, crawl, overflow, verify:repro) before upload | UNVERIFIED | No record in the repository; the provenance doc was not updated for this deploy |

## 3. Framework, build and routing

| Finding | Status | Evidence |
|---|---|---|
| Next.js 14.2.35, React 18, Tailwind 3, TypeScript 5 (typecheck only); Node `>=20 <21` | CONFIRMED | `package.json` |
| Static export: `output: 'export'`, `distDir: 'dist'`, `trailingSlash: true`, `images.unoptimized`; a webpack plugin sorts chunk ids for reproducible output | CONFIRMED | `next.config.js` |
| `netlify.toml`: command `npm run build`, publish `dist`, `NODE_VERSION = "20"` | CONFIRMED | file |
| Redirects: `/corrections/*` -> `/data/#conflicts` (301), `/trends/` and `/trends` -> `/kenya/` (301) | CONFIRMED | file; live `curl`: `/trends/` 301 to `/kenya/`, `/corrections/x` 301 to `/data/#conflicts` |
| `index.txt` route payloads served as `text/x-component` | CONFIRMED (config) | `netlify.toml` |
| `npm run build` at HEAD and at `d413b53` exits 0 (76 pages) | CONFIRMED | logs in `/tmp/claude-0/baseline-src.log`, `/tmp/claude-0/baseline-d413.log` |
| `npm run typecheck` (`tsc --noEmit`) at `2a2766a` exits 0 | CONFIRMED | run in `/tmp/claude-0/baseline-src` |
| `app/_held/` (ukweli) is not routed | CONFIRMED (docs) / UNVERIFIED (not re-crawled) | `.claude/CLAUDE.md`, `docs/architecture-map.md` |

## 4. Data storage and ingestion

| Finding | Status | Evidence |
|---|---|---|
| No database or backend. Versioned JSON in `data/` (23 files) is the source of truth; `scripts/build-data.js` writes `public/data/` (gitignored), which `next build` copies to `dist/data/` | CONFIRMED | `ls data`, `.gitignore`, build log |
| JSON Schemas for 16 datasets in `schemas/`, checked by a hand-written validator in `scripts/validate-data.js` | CONFIRMED | `ls schemas`; `validate-data.js` lines 194-197 |
| `data/source-manifest.json` lists 51 documents; `sha256` must be present if and only if the PDF was downloaded, and must stay equal to the hash recorded when figures were read | CONFIRMED | `validate-data.js` lines 238-264 |
| Ingestion is manual and one-off: `scripts/import-staging.js` (copies verified staging values unchanged; doubtful cells stay null with the raw OCR reading); `scripts/ocr/reread-cells.py` (two OCR passes for scanned tables; needs rapidocr, opencv, poppler; not part of the build); map generators `make-kenya-map.js`, `make-siaya-map.js` | CONFIRMED | script headers |
| No scheduled or automated ingestion | CONFIRMED (no such script or workflow in the repository) | `ls scripts`; GitHub Actions workflow retired |

## 5. Tests and gates

`npm run build` runs, in order (all passed at HEAD `2a2766a`, from `/tmp/claude-0/baseline-src.log`):

| Script | What it checks | Result at HEAD |
|---|---|---|
| `scripts/test-analytics.js` | analytics derivations | passed |
| `scripts/validate-data.js` | provenance fields (source, date, period, unit, confidence), JSON Schemas, sums, source manifest hashes | passed |
| `scripts/test-reconciliation.js` | one test per conflict case in the reconciliation register | 113 tests, 28 cases |
| `scripts/test-explore.js` | units and coverage for `/explore/` (national WDI and county CoB values) | 53 indicators, 655 noted county values |
| `scripts/test-derived.js` | recomputes every derived measure | 144 values |
| `scripts/test-economy.js` | Siaya economy values, vintage sums, revisions | 2,063 checks |
| `scripts/test-governance.js` | Siaya governance data | 106 checks |
| `scripts/test-audits.js` | Auditor-General findings tracker | 319 checks |
| `scripts/test-fiscal-ledger.js` | fiscal reconciliation ledger | 5,410 checks, 142 open discrepancy cases |
| `scripts/build-data.js` | publishes `public/data/` | ran |
| `next build` | static export | 76 pages |
| `scripts/check-built-html.js dist` | no `NaN` rendered; missing values must render as gaps | passed |

Outside `npm run build`:

| Gate | Status |
|---|---|
| `npm run smoke` / `NODE_PATH=$(npm root -g) node scripts/smoke-test.js dist`: routes, charts, table views, keyboard focus, downloads, CSP violations, no form fields on `/briefs/request/` | Exists in repo. Not run in this audit (UNVERIFIED for HEAD). Needs a global Playwright install, not a project dependency |
| `npm run verify:repro` (`scripts/repro-check.js`): builds twice, compares hashes of `dist/` ignoring buildId folders | Exists. Not run in this audit (UNVERIFIED for HEAD) |
| CI | None. GitHub Actions retired 21 Nov 2026 (no runner); local gates are the CI. Cloudflare and Vercel checks on PR 1 are external noise |

## 6. PDF pipeline

| Finding | Status | Evidence |
|---|---|---|
| `scripts/make-brief-pdf.js` prints `dist/counties/siaya/brief/index.html` with Chromium (Playwright, global) to `public/briefs/siaya-fiscal-brief.pdf`, then checks one A4 page with extractable text (pdfinfo, pdftotext). Run after a build, then rebuild so `dist/` carries the PDF | CONFIRMED (script) | script header |
| Visual regression, link checks and source-appendix validation of PDFs (handover section 14) | UNVERIFIED / not implemented | No such script in the repository |

## 7. Accessibility checks

| Finding | Status | Evidence |
|---|---|---|
| axe, crawl and overflow scripts (`axe.js`, `axeone.js`, `crawl.js`, `overflow.js` and logs) exist only in the session scratchpad `/tmp/claude-0/-home-user-Takwimu/<session>/scratchpad/`, not in the repository | CONFIRMED | `find /tmp/claude-0 -name '*axe*'` etc.; absent from `scripts/` |
| Earlier result "axe 0 violations in 140 runs" (for deploy 6b016220) | UNVERIFIED (reported in `docs/production-provenance.md`, not re-run) | |
| **Risk:** these checks are not reproducible from a clone and are lost when the scratchpad is cleared. They should be committed under `scripts/` before they are relied on as gates | open | |
| Netlify Lighthouse on `/` for the live deploy: Performance 98, Accessibility 100, Best Practices 100, SEO 98 | CONFIRMED | Netlify deploy record |

## 8. Security and privacy

| Finding | Status | Evidence |
|---|---|---|
| Live headers: CSP `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, plus HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy | CONFIRMED | `curl -sI https://takwimu.netlify.app/` |
| `script-src 'unsafe-inline'` is required by Next.js inline payloads; a weaker point of the CSP | CONFIRMED (config) | |
| No backend: no functions, no edge functions, no server | CONFIRMED | Netlify deploy summary |
| Netlify Forms not enabled | CONFIRMED | Netlify `get-project`: `forms: not enabled` |
| No personal data collected. The only `<form>` elements are client-side filter controls (`DatasetCatalogue`, `TrendsView`, `CompareView`) with `preventDefault`; no submission. `/briefs/request/` links to WhatsApp only | CONFIRMED (code) | `grep '<form'`; `smoke-test.js` line 118 |
| No analytics, cookies or trackers | CONFIRMED (CSP `connect-src 'self'` blocks third-party beacons); smoke test checks it (not re-run) | |
| Netlify secret scan on the live deploy: 583 files, 0 matches | CONFIRMED | Netlify deploy record |

## 9. Logo assets

| Finding | Status | Evidence |
|---|---|---|
| Site uses the owner's PNG artwork: `public/brand/takwimu-horizontal-96.png` and `-192.png` (header, from `brand/takwimu-logo-horizontal.png`), `public/brand/takwimu-logo.png` (footer and PDF, from `brand/takwimu-logo-full-v2.png`), `public/logo.png` symbol | CONFIRMED | `ls brand public/brand`; `brand/README.md` |
| `brand/takwimu-mark*.svg` are drafts generated by `scripts/make-brand-mark.js` (about 2.7 KB, one path each), not owner artwork, and are not used on the site | CONFIRMED | file sizes; `brand/README.md` |
| The owner's own SVG exports are empty, so PNGs are used | UNVERIFIED here (owner-supplied SVGs are not in the repository; stated in `.claude/CLAUDE.md`) | |
| Handover asks to validate vector logos visually before reuse: no owner vector is currently in use, so nothing to validate until a working SVG is supplied | open | |
| Tagline "Turning Data into Progress." | CONFIRMED | `brand/README.md` |

## 10. Known risks

| Risk | Status | Evidence |
|---|---|---|
| Intermittent Netlify remote build failures, exit code 2, no log (`14ebc25` twice; `964f39e` once then clean unchanged) | CONFIRMED as history (provenance doc); cause UNVERIFIED | `docs/production-provenance.md` |
| `www.oagkenya.go.ke` returns HTTP 503 (Auditor-General reports cannot be re-fetched) | CONFIRMED at audit time | `curl` returned 503 |
| Scanned PDFs (CoB, some audit reports) read by OCR; errors are possible (example: `02724ea` corrected an equitable share read as 5.68bn to 6.68bn) | CONFIRMED | `git log`; `data/counties-cob.json` re-read blocks |
| Provenance doc lags the live deploy | CONFIRMED | section 2 |
| Concurrent agents push WIP commits whose gates have not run (`2a2766a`) to the production branch | CONFIRMED | `git log`. Pushing does not deploy, but any upload must start from a gated commit |
| `main` deployed by mistake would replace the live product | CONFIRMED (structure) | `docs/architecture-map.md` |

## 11. Handover constraints vs owner decisions

| Handover says | Owner decision (21 Nov 2026) | Applies |
|---|---|---|
| No git push, merge or deployment without explicit owner approval | Owner authorises pushing to `claude/eager-rubin-7bpcgq` often and one Netlify deploy per major release; merging PR 1 stays the owner's decision | Owner decision |
| Accounts, editorial console, paid products imply user data | No accounts, forms, sign-ups, analytics or cookies, so nothing triggers ODPC registration (`docs/data-protection-policy.md`); contact by WhatsApp only | Owner decision; WO-04/WO-08 must work without accounts on the public site |
| Hosting assumed open; the accessible README described Cloudflare | Netlify only. Vercel and Cloudflare projects deleted; `vercel.json` disables Vercel Git deploys | Owner decision |
| English interface; no Kiswahili localisation | Same: site is English only; bilingual material is held, not routed | Agreed |
| Stop if production source is unknown | Source established (section 2) | Not triggered |
