# Takwimu: civic education platform for public finance and statistics (design)

Status: DRAFT for approval. Nothing has been built. Decisions marked **[my call]** were made by the assistant, not agreed by the owner.

## Intent and why
Takwimu teaches Kenyans to read public finance and official statistics, and to follow **trends** over time. Home county is Siaya, so Siaya is the worked example that makes national numbers concrete. The owner is a senior aviation operations professional and investor; the platform is a civic/community project, not a commercial product.

Success: a Siaya resident on a mid-range phone can find how their county's money and economy are changing, understand what the numbers mean, see where each number came from, and share it on WhatsApp.

## Goals
1. Time-series trends (nominal and inflation-adjusted) for national and county public finance and key statistics.
2. A Siaya module (six sub-counties: Alego Usonga, Bondo, Gem, Rarieda, Ugenya, Ugunja) with a county selector that scales to all 47 counties.
3. Explainers in plain language ("Where does a shilling go?", "Equitable share", "Pending bills", "Audit opinions") with a glossary.
4. Every figure carries source, publication date, period, unit and confidence. Conflicting sources are shown side by side, never silently resolved.
5. Fast on weak connections; installable PWA; WhatsApp share cards.
6. English only for v1 (owner: no Kiswahili needed). Sheng toggle from the existing prototype is out of scope until the owner asks for it.

## Non-goals
- No live backend, database or user accounts in v1.
- No political commentary or verdict labels on named politicians.
- No forecasting beyond citing published projections (IMF, Treasury) labelled as such.

## Anti-goals (failure even if it technically works)
- A wrong or stale number presented as fact.
- A dashboard nobody can interpret. Explainers matter more than chart count.
- Publishing a source dispute as a "gotcha" instead of teaching why figures differ.

## Constraints
- Static export hosted on Netlify (owner's choice). No server runtime. Netlify's free tier has usage limits (bandwidth/build credits) that Cloudflare Pages did not; keep pages light and watch usage.
- Source data is mostly PDFs and spreadsheets (Controller of Budget, Treasury, Auditor-General, KNBS), with no confirmed bulk or API access. Parsers will be brittle; human review is required.
- Owner time is limited; pipeline must reduce, not add, upkeep.

## Findings from review (current repo)
- Source files are in the repo root, but imports, `package.json` and Tailwind expect `app/`, `lib/`, `scripts/`, `public/data/`. Build is broken as committed.
- Only one page exists (Truth Gap). No dashboard, no county dimension; Siaya is absent from the one county table.
- Config issues: `assetPrefix: '.'`, absolute manifest icon paths, legacy `[site]` in `wrangler.toml`, unneeded `next-on-pages`, Next 14.2.0 behind on security patches, irrelevant npm-publish and webpack workflows, no deploy workflow.
- All data is hand-typed with no timestamps; some figures already stale.

## Research findings that shape the design
- Controller of Budget publishes quarterly and annual County Budget Implementation Review Reports (CBIRR) as PDFs, back to FY 2013/14. No bulk data download confirmed.
- Auditor-General publishes a County Executive of Siaya report per year (FY 2017/18 onward found). Audit opinion type not verified yet.
- KNBS publishes Gross County Product (2019, 2021, 2023, 2024 editions); no API confirmed.
- **Real source conflict, Siaya own-source revenue FY 2024/25:** Controller of Budget reports Ksh 436.7M (ranked lowest); county officials cite about Ksh 946M. This is the model teaching case for "why two numbers?" and for the side-by-side provenance display.
- Press reports of two different Nairobi GCP-per-capita figures for the same edition show why figures must be traced to the primary document.

## Approaches considered
- **A. Hand-curated static JSON.** Cheapest, fully human-checked, but goes stale and does not scale to 47 counties.
- **B. Scheduled pipeline that opens pull requests (chosen [my call], owner delegated).** Per-source fetchers and parsers run on a schedule, validate against a schema and open a PR showing the data diff; owner approves; site rebuilds as static pages. Automated, auditable, fast, free hosting.
- **C. Live backend (database and API).** Most flexible, but adds cost, ops and slower rural loads. Revisit later for a public API.

## Design (approach B)
**Repo layout:** `app/` (Next.js App Router pages), `components/`, `lib/` (series types, formatters, i18n), `data/` (versioned JSON series and `sources.json`), `scripts/` (fetchers, parsers, validators, build), `docs/`.

**Data model:** every metric is a series of `{period, value, unit, basis: nominal|real}` with `source_id`, `published`, `retrieved`, `doc_url`, `confidence` and optional `notes`. Disputed values are stored as multiple observations for one period, each with its own source.

**Pipeline:** scheduled GitHub Action runs fetchers, parses new reports, validates (schema, unit sanity, period continuity, year-on-year jump flags), and opens a PR with a data diff. Merge triggers the Netlify build and deploy. Parser failures open an issue instead of publishing.

**Pages:** Home (headline trends and "what changed"); National trends; County explorer (default Siaya); Explainers and glossary; Claim check (the old Truth Gap, demoted, restricted to checkable claims with cited documents); Methodology and corrections.

**Trust rules:** methodology page, public corrections log, right-of-reply contact, no verdict labels on named individuals. Claims tied to a person require a primary document link and legal review before publishing. **[my call]**

**UX:** charts with plain-language "what this means" lines, real versus nominal toggle, data table and CSV download per chart, accessible colour and text alternatives, low-bandwidth mode, share cards sized for WhatsApp.

## Benchmarks (research, 20 Nov 2026)
What was actually read, and what was not.
- **USAFacts** (founded by Steve Ballmer): only the About page was read. Facts confirmed there: government-only sources, privately funded, no advertising, free with no paywall. Its explainer pages, chart conventions and corrections policy were **not** read; do not assume them. Lesson taken: a stated sourcing rule. Critics have noted that its figures can be hard to trace, so Takwimu links each figure to its document.
- **Vulekamali** (South Africa's National Treasury budget portal): homepage only. Confirmed: a "Learning" group (videos, glossary, dataset guides, FAQ) beside the data, a "Report inaccuracies on this page" form, and a Data Portal API. Lessons taken: plain-language route before tables, glossary and dataset guides next to figures, a visible report-an-error link.
- **Our World in Data**: About page only. Confirmed: free non-profit, charts under a permissive Creative Commons licence, third-party data subject to its providers' terms. Chart-page layout was not read. Lesson taken: state licence and source terms next to every download.
- **OpenSpending / Open Budget Survey explorer** (Open Knowledge Foundation, International Budget Partnership): search-result summaries only. Lessons: treemaps make allocations legible; a tabular data model that accepts CSV or Excel is a workable ingest format.
- **Kenya context:** Open Budget Survey 2023 scores Kenya 55/100 on transparency, 31 on public participation and 57 on oversight. The Open Government Partnership notes budget data is published but hard to extract. A KNBS SDMX open-data portal is reported but unconfirmed; check its API documentation in Phase 1. No Controller of Budget API found.
- **Gap to fill:** read USAFacts explainer pages, Our World in Data chart pages and Vulekamali department pages directly before final visual design.

## Workflow design (see docs/research/2026-11-20-workflows-research.md)
Source-watch (raw files stored and hashed), parse with confidence scores, schema-validate, open PR with a review aid, Netlify deploy preview, quality gates (type-check, schema, link check, Lighthouse budget, accessibility), and a freshness check that opens an issue when an expected release is overdue.

## Phases
0. Repair repo: restore layout, fix build, config and security upgrade, CI (build, lint, type-check, data validation), Netlify deploy via `netlify.toml` and deploy previews.
1. Data foundation: schema, `sources.json`, migrate existing figures with real provenance, retire unverifiable numbers, validator.
2. First pipeline: Controller of Budget county reports (Siaya first), then Treasury and KNBS; PR-based review.
3. Siaya module and county selector; explainers and glossary.
4. Trust layer: methodology, corrections log, claim-check relaunch.
5. Performance, PWA, offline, share cards, analytics (privacy-respecting).

## Left to the builder
Chart library (prefer lightweight), PDF parsing tooling, test framework, exact visual design (run design review against the dataviz and website-design guidance), CPI deflator source.

## Decisions (owner said "your call" on all builder-check questions, 2026-11-20)
All marked **[my call]**; the owner can overrule any of them.
1. **v1 scope:** hand-curated Siaya module (about 10 verified metrics, last 5 fiscal years) plus national trends. Other counties and the automated pipeline follow in Phase 2. The pipeline is not a v1 launch dependency.
2. **Review:** owner approves data PRs. The pipeline ships a review aid (source PDF page beside the extracted value). Nothing auto-merges. Explainers are drafted by the assistant and shown as "unreviewed" until a human reviewer checks them.
3. **Existing figures and Truth Gap:** figures that cannot be traced to a primary document are hidden at launch. Claims naming individuals stay off the site until the owner has seen them and a legal reviewer (to be named) has cleared them.
4. **Infrastructure:** unknown. Phase 0 includes connecting the repo to Netlify (site, domain, deploy previews) and checking GitHub Actions permissions together with the owner. Observed already: Cloudflare Workers Builds and Vercel checks are attached to the repo and fail; both integrations should be removed.
5. **Conflicting sources:** the headline value is the primary official source (Controller of Budget for county spending and revenue). Other sources appear as labelled second observations. The 946M Siaya figure is from county officials via press and is unverified; the explainer says so.
6. **Inflation adjustment:** national CPI from KNBS, latest year as base. County series use national CPI because no county CPI exists; the methodology page states this.
7. **Performance and analytics:** first page load under about 150 KB, tested on throttled 3G. privacy-respecting analytics only; Netlify Analytics or a cookieless alternative, vendor to be chosen in Phase 5.
8. **Data rights:** every figure links to its source document. CSV downloads contain compiled series with attribution. Source terms are checked before any scheduled fetcher is enabled; until then fetchers are a manual-upload step.

## Owner constraint
Do not use Vercel. Deploy target is Netlify (owner decision, replaces the earlier Cloudflare Pages assumption). Add `netlify.toml`; remove `wrangler.toml`, `@cloudflare/next-on-pages` and the Cloudflare Workers Builds integration. No Vercel config will be added.

## Open items
- Named legal reviewer for claims about individuals.
- Named reviewer for explainer text.
- Owner removes the Vercel and Cloudflare Workers Builds GitHub integrations (it reports "Account is blocked" and fails every PR); the assistant cannot do this from here.
