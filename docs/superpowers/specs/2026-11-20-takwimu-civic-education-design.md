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
6. English and Kiswahili as primary languages; Sheng as optional toggle. Dholuo glossary later. **[my call]**

## Non-goals
- No live backend, database or user accounts in v1.
- No political commentary or verdict labels on named politicians.
- No forecasting beyond citing published projections (IMF, Treasury) labelled as such.

## Anti-goals (failure even if it technically works)
- A wrong or stale number presented as fact.
- A dashboard nobody can interpret. Explainers matter more than chart count.
- Publishing a source dispute as a "gotcha" instead of teaching why figures differ.

## Constraints
- Static export on Cloudflare Pages (free tier). No server runtime.
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

**Pipeline:** scheduled GitHub Action runs fetchers, parses new reports, validates (schema, unit sanity, period continuity, year-on-year jump flags), and opens a PR with a data diff. Merge triggers build and Cloudflare Pages deploy. Parser failures open an issue instead of publishing.

**Pages:** Home (headline trends and "what changed"); National trends; County explorer (default Siaya); Explainers and glossary; Claim check (the old Truth Gap, demoted, restricted to checkable claims with cited documents); Methodology and corrections.

**Trust rules:** methodology page, public corrections log, right-of-reply contact, no verdict labels on named individuals. Claims tied to a person require a primary document link and legal review before publishing. **[my call]**

**UX:** charts with plain-language "what this means" lines, real versus nominal toggle, data table and CSV download per chart, accessible colour and text alternatives, low-bandwidth mode, share cards sized for WhatsApp.

## Phases
0. Repair repo: restore layout, fix build, config and security upgrade, CI (build, lint, type-check, data validation), Cloudflare deploy workflow.
1. Data foundation: schema, `sources.json`, migrate existing figures with real provenance, retire unverifiable numbers, validator.
2. First pipeline: Controller of Budget county reports (Siaya first), then Treasury and KNBS; PR-based review.
3. Siaya module and county selector; explainers and glossary; Kiswahili.
4. Trust layer: methodology, corrections log, claim-check relaunch.
5. Performance, PWA, offline, share cards, analytics (privacy-respecting).

## Left to the builder
Chart library (prefer lightweight), PDF parsing tooling, test framework, exact visual design (run design review against the dataviz and website-design guidance), CPI deflator source.

## Open questions for the owner
See builder check results appended below.
