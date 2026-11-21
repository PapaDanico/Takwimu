# Release plan: visuals and legal

Deployment policy (owner decision, 21 Nov 2026): deploy to Netlify only for major releases, not after each change. Commit and push as work progresses; deploy once at the end of a milestone.

## Goals
1. Charts, not only bars: line, column and donut charts with tooltips and table views.
2. Terms of use, privacy notice and a fuller FAQ, linked from the footer.
3. No third-party requests from a visitor's browser (fonts served from our own domain).
4. One reviewed release, one deployment.

## Workstreams and acceptance checks

| # | Workstream | Done when |
|---|---|---|
| 1 | Chart components (line, column, donut, stat strip) | Palette validated in light and dark; every chart has a legend, direct labels on wide screens, a table view, keyboard-focusable hit areas and a tooltip; no horizontal overflow at 360 px |
| 2 | Place charts on Insights, Analytics, Sub-counties, Profile, Home | Each page opens with headline numbers and has at least one trend or share chart; text numbers come from the data, not hard-coded |
| 3 | Terms of use | Covers purpose, no advice, accuracy, reuse and attribution, acceptable use, third-party links, liability, changes, governing law, contact |
| 4 | Privacy notice | Says exactly what is and is not collected; names the hosting provider; explains share links, rights under the Kenya Data Protection Act, 2019, children, retention, changes and contact |
| 5 | FAQ | Adds reuse, privacy, accuracy, accessibility and contact questions |
| 6 | Footer | Terms, Privacy, FAQ and Corrections reachable on every page, on phone and desktop |
| 7 | Self-hosted fonts | No request to Google Fonts in the built HTML |
| 8 | Quality gates | Unit tests, data validation, typecheck, build, axe (0 violations) on every page in both themes, overflow at 360 to 1280 px, link check, chart check, print check |
| 9 | Independent review | A reviewer who did not write the code reads the diff; findings fixed or recorded |
| 10 | Ship | Commit, push, one Netlify deploy, live checks, notes updated |

## Risks
- Legal text is a good-faith draft by a non-lawyer. It must be reviewed by counsel before the owner relies on it. The pages say who to contact; the release notes say counsel review is outstanding.
- Charts cannot be viewed as images in this environment, so layout is checked by measurement (bounding boxes, overflow, focus and tooltip behaviour) rather than by eye.
- Open data gaps are unchanged and stay listed on the Method and Data pages.

## Handover review (21 Nov 2026) and where each item stands

An outside assessment of the live site was supplied as a handover. It is an assessment, not proof of faults; each item was checked here.

| Handover item | Status |
|---|---|
| P0 architecture gate: which repo deploys the site | Done: `docs/architecture-map.md`. `main` is an older product; the live site comes from the PR branch by CLI upload |
| P0.2 reconciliation assertions | Largely in place (budget and spending sums, absorption recompute, census sums, series length). Per-measure tolerances are in code; a typed schema layer is still to do |
| P0.3 source conflict register | Done: `data/conflicts.json`, validated, shown on the Corrections page |
| P0.4 cautious wording on absorption, delivery and audit opinions | Done on Insights, Analytics, Learn and Home |
| P0.5 four labels (period, checked, updated, completeness) | Done: data coverage strip on Insights, Analytics, Sub-counties, Profile. Immutable dataset versions and a machine changelog are still to do |
| Insights note said FY2023/24 not extracted | Fixed: the stale gap line was removed |
| Ten-year labels clarified | Done: coverage strip states the period and which years have data |
| Sub-county ratio caveats (undated counts) | Done: caveats on the Sub-counties page |
| Survey change without confidence intervals | Caveat added; intervals not yet computed |
| Number and unit rendering | Fixed: unit now separated by a space for screen readers |
| Research-ready exports | Partly done: `history.csv`, `history.json`, `conflicts.json`; printable one-page brief still to do |
| Charts with table alternative, legend, tooltip | Done for line, column and donut charts |

## Deferred (next releases, in this order)
1. Typed schemas with runtime validation, source snapshot hashes, dataset versions and a machine-readable changelog.
2. County fiscal scorecard (approved against actual, mix, revenue against comparable target, pending bills, payroll share, audit status, missing data).
3. Filters by fiscal year and indicator with URL parameters, and exports that follow the filter.
4. Navigation regrouping (Overview, Finances, Development, People and Services, Compare, Data and Methods) with redirects.
5. Development execution lens: a small, manually verified sample of Siaya projects, only where independently documented.
6. FY2019/20 and FY2025/26 reports, audit opinions FY2014/15 to FY2018/19, and the payroll series, when sources are reachable.
7. End-to-end tests in CI, Lighthouse and Core Web Vitals measurement, security headers review.
8. Peer counties (three to five) with standardised definitions.

## Second-pass recommendations (21 Nov 2026): triage

| Item | Status |
|---|---|
| Repo and deploy mapping (P0) | Done: `docs/architecture-map.md`; live deploy `6b00f585a910acddb221ccd0` from commit `cd1f7c8` |
| FY2023/24 OSR 610.74 vs 427.95; component sum 610.63 vs 610.74 | Recorded in `data/conflicts.json` and the Siaya data note |
| FY2024/25 recurrent 82.2 vs 83 per cent | Recorded; page-image check of the denominator still open |
| FY2024/25 pending bills: opening 1.12bn, settled 577.7m, closing unknown | Recorded as not calculable; no closing stock derived |
| Pending-bills disagreements FY2020/21, 2022/23, 2023/24 | Recorded (`pending-2021`, `pending-2023`, `pending-2024`) |
| Number and unit formatting | Done |
| Chart table alternative, keyboard, tooltip | Done; touch tooltip and screen-reader announcements need device testing |
| Export matches display and keeps source metadata | Done for CSV; no schema version or licence field yet |
| Navigation regrouping | Deferred (needs redirects) |
| Typed contracts, supersession links, reviewer fields | Next release (largest P0 item) |
| Playwright E2E, Lighthouse, security headers | Next release |
| Fiscal Health Monitor, Pending Bills roll-forward, Audit tracker, peers, scenarios | Later releases, one module per release, only with source evidence |

Recommended order: (1) data contracts with supersession and reviewer fields; (2) E2E tests and headers; (3) Fiscal Health Monitor from data already held; (4) retry the missing reports (FY2019/20, FY2025/26, audits FY2014/15 to FY2018/19) and record negative outcomes.
