# Takwimu

Civic education for Kenyan public finance and statistics, focused on trends. It starts with Siaya County and shows every figure with its source, retrieval date and confidence score. Disputed figures are shown side by side.

Design and plan: `docs/superpowers/specs/2026-11-20-takwimu-civic-education-design.md`. Workflow research: `docs/research/2026-11-20-workflows-research.md`. Visual concept: `docs/design/takwimu-concept.html`.

## Stack

Next.js 14 (static export), React, hosted on Netlify. No server runtime.

## Layout

```
app/            pages (home, method). app/_held/ is not routed (see below)
lib/            shared code
data/           versioned data with provenance (siaya.json)
scripts/        validate-data.js (provenance checks), build-data.js (public JSON)
public/         icons, manifest, generated data
netlify.toml    build and headers
.github/workflows/ci.yml   validate, typecheck, build on every PR
```

## Commands

```bash
npm install
npm run validate   # fails if a figure lacks source, date, confidence
npm run build      # validate, generate data, static export to dist/
npm run dev
```

## Deploying to Netlify

Connect the repository in Netlify. `netlify.toml` already sets the build command (`npm run build`) and publish directory (`dist`).

## Held content

`app/_held/ukweli/` holds the earlier "Truth Gap" page. It is not routed and its claims dataset is not published. Claims about named people need a primary document and a legal check before they go live. See the design doc.

## Data rules

- Every figure has a source, a retrieval date, a confidence score (1 to 5) and a status.
- The primary official figure is the headline. Conflicting figures are labelled and shown beside it.
- `npm run validate` enforces this and runs in CI.

## Licence

MIT. Source data belongs to its publishers; check each source's terms before reuse.
