# Takwimu development plan

> Superseded (27 Nov 2026): this is the 20 Nov 2026 plan, kept as written. The current plan is `docs/release-plan.md`; what deploys production is in `docs/architecture-map.md`.

Updated 20 Nov 2026. Design: `docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md`. Research: `docs/research/`. Bugs: `docs/bug-sweep-log.md`.

## Where things stand
Done and verified locally (build, data validation, type check, layout checks at 360 and 1280 px in light and dark, axe-core scan with no violations):
- Repo repaired, Next 14.2.35 static export, `netlify.toml`, CI workflow.
- Siaya page with three exhibits: own-source revenue (Controller of Budget KSh 436M versus the county's unverified KSh 946M, with the KSh 1,043M budget target), budget and spending (57 per cent development, 83 per cent recurrent), Auditor-General opinion (qualified, FY 2023/24).
- Provenance validator, method page, held-back Truth Gap content, accessibility and keyboard fixes.

Not done: national trends (no verified series), other counties, explainer pages, deployment, CI passing on GitHub, manual accessibility test.

## Status of blockers
| Item | Status |
|---|---|
| Live site | Done: https://takwimu.netlify.app (Netlify site "takwimu"). Redeploys are run from the assistant session through the Netlify connector; there is no automatic deploy on push because linking a GitHub repo to Netlify needs a browser sign-in |
| Vercel failing on every commit | Preview deployments switched off for the "takwimu" Vercel project |
| Cloudflare Workers Builds failing | Not reachable from the available connectors. It fails on the old Cloudflare configuration, which is removed from the repo |
| GitHub Actions `CI` job | Fails in about 3 seconds with no runner assigned, also on the first commit in the repo. Cause is account level. Local equivalents (validate, type check, build, layout and accessibility checks) pass |
| Scanned figures checked | Done with a second OCR engine on rendered pages; one error found and fixed (recurrent budget) |
| Reviewers for legal and explainer text | Policy set: claims about named people stay held back; explainers are factual definitions and are marked as unreviewed drafts until someone reviews them |

## Phases
Each phase ends with: validate, type check, build, layout and axe checks passing, bug log updated.

### Phase 1: Make Siaya trustworthy (now)
1. Done: the 47 per cent is of the annual target (implied about KSh 929 million), and revenue is up 2 per cent on FY 2023/24. Still open: why the target differs from the KSh 1,043 million in budget financing, and how the KSh 290 million of arrears splits the total.
2. Read Siaya's audit opinion for FY 2024/25 once published, and the County Assembly audit.
3. Read the county's own revenue statement behind the KSh 946M claim; mark verified or explained.
4. Add Siaya's five-year own-source revenue trend (the report has a chart FY 2019/20 to 2024/25) after verifying each point.
5. Add sub-county content only where a primary source exists.

### Phase 2: Trends and the real/nominal toggle
1. Add national CPI series (KNBS, Feb 2019 = 100) with a source and date per point.
2. Build the line chart component to the same rules as the bar charts: 2 px line, 8 px end dot, direct end label, table view, tooltip, 4.5:1 text contrast.
3. Real/nominal toggle for Siaya revenue and spending using national CPI; method page states that no county CPI exists.
4. Series schema with `period`, `value`, `unit`, `basis`, `source_id`, `retrieved`, `confidence`; validator checks continuity and jumps.

### Phase 3: Data pipeline (turbocharged workflows)
1. Source watch: scheduled Action fetches the Controller of Budget, Treasury, Auditor-General and KNBS pages, stores new files in `data/raw/` with SHA-256, commits only on change, opens an issue.
2. Parser benchmark: Camelot, pdfplumber and Docling on real Controller of Budget PDFs with golden-file tests. Note the Controller of Budget annual report is 603 pages and about 179 MB, and its text layer is scanned OCR, so extraction needs a confidence score and page reference for every value.
3. Review PR: data diff plus source page beside each extracted value; nothing auto-merges.
4. Freshness check: each series records its expected next release; an issue opens when overdue.
5. Extend to the other 46 counties using the same Controller of Budget section structure.

### Phase 4: Learning layer and trust
1. Explainer pages (own-source revenue, pending bills, audit opinions, equitable share, absorption rate) with glossary links from each figure.
2. Corrections log page and "Report an inaccuracy" link on every exhibit (link exists; log page to add).
3. Claim check relaunch: only claims with a primary document and legal review; no verdict labels on named people.
4. Reuse terms: read each source's terms before enabling CSV downloads or scheduled fetching.

### Phase 5: Quality gates and reach
1. Add axe-core and a performance budget (first load under about 150 KB on throttled mobile) to CI.
2. Manual screen-reader and keyboard test; test on a low-end Android phone on a throttled connection.
3. WhatsApp share cards and a print stylesheet.
4. Privacy-respecting analytics only (vendor chosen then).

## Definition of done for any figure
Source named and linked, retrieval date, fiscal period, unit, confidence 1 to 5, status, and a note on how it was read. Conflicting sources shown side by side and never averaged.

## Risks
| Risk | Mitigation |
|---|---|
| Scanned-PDF misreads | Confidence cap at 4, cross-checks in the validator, human check against printed tables |
| Source sites down or blocking (KNBS unreachable from the build environment) | Manual upload path; cache raw files; retry later |
| Press figures contradict primary documents (already happened with the KSh 1.04 billion figure) | Primary document first; label press-only figures unverified |
| Reputational or legal exposure from claims about people | Held-back content, legal review gate |
| Free-tier usage limits on the host | Static pages under 150 KB first load; monitor usage |
