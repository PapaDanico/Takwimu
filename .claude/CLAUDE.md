# Takwimu

Civic education platform for Kenyan public finance and statistics, focused on trends. Home county example: Siaya.

- Stack: Next.js (static export) + React + Tailwind, TypeScript available. Deploy target: Netlify (owner decision). Do not use Vercel or Cloudflare.
- Design spec (draft, awaiting owner approval): docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md
- Do not build product code until the owner approves the spec.
- Every figure needs source, publication date, period, unit and confidence. Show conflicting sources side by side.
- No verdict labels on named individuals without a primary document and legal review.
- Series must go back 10 years: data/history.json (budget, spend, revenue, audits, population, health) plus data/cpi.json; gaps are listed, never filled. Validator checks sums.
- Layout repaired 2026-11-20 (app/, lib/, scripts/, data/, public/). app/_held/ukweli is intentionally not routed. Build, validate and typecheck pass.

- Deploy to Netlify only for major releases (owner, 21 Nov 2026): commit and push often, deploy once per milestone. Production comes from branch claude/eager-rubin-7bpcgq by CLI upload, not from main (see docs/architecture-map.md).
- Hosting is Netlify only; vercel.json disables Vercel Git deploys. Cloudflare Workers Builds and GitHub Actions failures on the PR are external noise (owner must disconnect).
- National (Takwimu Kenya, 21 Nov 2026): lib/counties.js lists all 47 counties; only Siaya is published (/counties/siaya/ hub; its pages keep their old URLs). Other counties get in-preparation pages. Maps: components/KenyaMap.js and SiayaMap.js use geoBoundaries outlines in data/*.json (scripts/make-*-map.js, one-off).
- Charts: components/Charts.js (line, column), Donut.js; palette --s1..--s6 validated; every chart needs a table view.

# Rules
Concise responses. Grep before Read. No unrequested extras.
