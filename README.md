# TAKWIMU Intelligence Engine v2.0 — Cloudflare Pages Edition

Kenya's verified socioeconomic data platform. Premium consultancy-grade design. Sheng + English bilingual. IMF, World Bank, China BRI, KNBS sources. Deployed on Cloudflare's global edge network.

## Why Cloudflare Pages?

- **Global CDN**: 300+ PoPs worldwide — sub-50ms latency for Kenyan users
- **Static export**: No serverless cold starts. Instant page loads.
- **Free tier**: Unlimited bandwidth, unlimited requests
- **Edge caching**: JSON data files cached at 300+ locations
- **PWA-ready**: Service workers + manifest for installable app experience

## Deploy in 3 Steps

### Option 1: Drag & Drop (Fastest)

1. Run `npm run build` locally
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
3. Create a project → Upload the `dist/` folder
4. Done. Your site is live on `*.pages.dev`

### Option 2: Git Integration (Recommended)

1. Push this repo to GitHub
2. In Cloudflare Dashboard → Pages → "Connect to Git"
3. Select your repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click "Save and Deploy"

### Option 3: Wrangler CLI

```bash
npm install
npm run build
npx wrangler pages deploy dist
```

## Architecture

```
Build Phase:
  lib/data.js  →  scripts/build-data.js  →  public/data/*.json

Runtime (Cloudflare Edge):
  dist/index.html      →  Dashboard (static)
  dist/ukweli/index.html  →  Truth Gap (static)
  dist/data/pulse.json    →  API data (static, edge-cached)
  dist/data/truth.json    →  API data (static, edge-cached)
  dist/data/*.json        →  All datasets (static, edge-cached)
```

## Data Sources

| Source | Tier | What it feeds |
|--------|------|---------------|
| KNBS | Official | GDP, inflation, sector growth, labour, wages, poverty |
| CBK | Official | Policy rate, lending rate, FX, reserves, monetary stats |
| Treasury | Official | Debt stock, debt service, budget, fiscal deficit |
| IMF WEO Apr 2026 | Independent | GDP projections, inflation projections, SDR, quota |
| World Bank | Independent | Per capita, governance indicators, ease of business, HDI |
| China BRI Portal | Independent | SGR $3.2B loan, 30K jobs, 5.4M passengers, 172 countries |
| AFDB | Independent | Youth unemployment, continental comparisons |

## Updating Data

Data is baked at build time. To refresh:

```bash
# Update lib/data.js with new figures
# Then rebuild
npm run build

# Redeploy
npx wrangler pages deploy dist
```

For automated updates, set up a GitHub Action:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM EAT
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: takwimu
          directory: dist
```

## Verification Protocol

```
LAW CLAIMS:
  1. Check gazette.go.ke
  2. If gazetted → "Act of Parliament"
  3. If announced only → "Announced, awaiting gazettement"
  4. Never label "proposed" without gazette check

PROJECT CLAIMS:
  1. Check PPDC portal
  2. Check implementing agency
  3. Check historical announcements
  4. If re-announced → "Stalled (re-announcement)"

PRESIDENTIAL SPEECH:
  1. Extract claim within 24 hours
  2. Cross-reference gazette + PPDC + agency
  3. Flag discrepancies within 48 hours
```

## License

MIT — Built for Kenya. Deployed on Cloudflare.
