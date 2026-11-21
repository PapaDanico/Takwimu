# Takwimu

Civic education platform for Kenyan public finance and statistics, focused on trends. Home county example: Siaya.

- Stack: Next.js (static export) + React + Tailwind, TypeScript available. Deploy target: Netlify (owner decision). Do not use Vercel or Cloudflare.
- Design spec (draft, awaiting owner approval): docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md
- Do not build product code until the owner approves the spec.
- Every figure needs source, publication date, period, unit and confidence. Show conflicting sources side by side.
- No verdict labels on named individuals without a primary document and legal review.
- Series must go back 10 years: data/history.json (budget, spend, revenue, audits, population, health) plus data/cpi.json; gaps are listed, never filled. Validator checks sums.
- Layout repaired 2026-11-20 (app/, lib/, scripts/, data/, public/). app/_held/ukweli is intentionally not routed. Build, validate and typecheck pass.
- Netlify's remote build works again (deploy 6b016220c93979646e7f2eb9, Node 20.20.2, exit 0); earlier failures of 14ebc25 did not recur. Still run every gate here before uploading. No personal data is collected (owner, 21 Nov 2026): no forms, Netlify form handling disabled; /briefs/request/ links to the Danico Ventures WhatsApp chat (wa.me/message/GPPIKMENXJVWO1).
- Deploy to Netlify only for major releases (owner, 21 Nov 2026): commit and push often, deploy once per milestone. Production comes from branch claude/eager-rubin-7bpcgq by CLI upload, not from main (see docs/architecture-map.md). vercel.json disables Vercel Git deploys. The GitHub Actions workflow was retired (21 Nov 2026: the account gets no runner); Netlify is the only deploy path and the local gates are the CI. Cloudflare checks on the PR are external noise (owner must disconnect).
- Build gates: schemas/ (JSON Schema), data/source-manifest.json (SHA-256 of cited PDFs), scripts/test-reconciliation.js (one test per conflict case), smoke test (NODE_PATH=$(npm root -g) node scripts/smoke-test.js dist); npm run verify:repro must print Reproducible. Brief PDF: rebuild, then NODE_PATH=$(npm root -g) node scripts/make-brief-pdf.js (Playwright stays global).
- National (21 Nov 2026): lib/counties.js lists 47 counties; only Siaya is published (/counties/siaya/ hub, old URLs kept). Phase 2: data/national.json (World Bank WDI) and data/counties-cob.json (47 counties, FY 2023/24-2024/25, OCR with table/page; nulls keep the reason) feed lib/explore.js, /explore/, /datasets/, /kenya/ (with the trend explorer; /trends/ redirects), /compare/, /stories/; scripts/test-explore.js checks units. KenyaMap takes values (single-hue scale).
- Brand: brand/README.md (Takwimu Kenya, tagline "Turning Data into Progress."). Site uses the owner's supplied artwork: horizontal lockup in header, full logo in footer and PDF, symbol for icons. Owner SVG exports are empty, so PNGs are used; the old rebuilt mark and CSS wordmark are not used. Page background stays charcoal #17191C (owner decision, 21 Nov 2026).
- Charts: components/Charts.js (line, column), Donut.js; palette --s1..--s6 validated; every chart needs a table view.

# Rules
Concise responses. Grep before Read. No unrequested extras.
