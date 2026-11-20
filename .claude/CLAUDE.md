# Takwimu

Civic education platform for Kenyan public finance and statistics, focused on trends. Home county example: Siaya.

- Stack: Next.js (static export) + React + Tailwind, TypeScript available. Deploy target: Netlify (owner decision). Do not use Vercel or Cloudflare.
- Design spec (draft, awaiting owner approval): docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md
- Do not build product code until the owner approves the spec.
- Every figure needs source, publication date, period, unit and confidence. Show conflicting sources side by side.
- No verdict labels on named individuals without a primary document and legal review.
- Series must go back 10 years: data/history.json (budget, spend, revenue, audits, population, health) plus data/cpi.json; gaps are listed, never filled. Validator checks sums.
- Layout repaired 2026-11-20 (app/, lib/, scripts/, data/, public/). app/_held/ukweli is intentionally not routed. Build, validate and typecheck pass.

# Rules
Concise responses. Grep before Read. No unrequested extras.
