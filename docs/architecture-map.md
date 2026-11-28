# Architecture map: what deploys the live site

Checked 21 Nov 2026. This answers the handover's P0 gate.

## Production mapping

| Link | Value |
|---|---|
| Public URL | https://takwimukenya.com (primary domain, owner, 28 Nov 2026; Netlify DNS). https://takwimu.netlify.app is an alias: the first rule in `netlify.toml` 301s it to the same path on the primary domain (deploy previews untouched). `lib/site-url.js` holds the address; `scripts/check-host.js` fails the build if a published file names the old host |
| Hosting project | Netlify site `takwimu`, site id `bf11e227-c98e-4258-aff6-d7660459aef1` |
| How it is deployed | Netlify continuous deployment from GitHub (PapaDanico/Takwimu, branch `main`, linked by the owner 27 Nov 2026). Each push to `main` runs `npm run build` on Netlify. Branch pushes do not deploy; pull requests get deploy previews (deploy-preview-N--takwimu.netlify.app), which are not production. |
| Repository | https://github.com/PapaDanico/Takwimu |
| Source branch | `claude/eager-rubin-7bpcgq`, open as pull request 1 against `main` |
| Build command | `npm run build` = unit tests, data validation, data publishing, `next build` |
| Output directory | `dist/` (static export, `trailingSlash`) |
| Config | `netlify.toml`, `next.config.js` |

Each deploy logs its deploy id in `/tmp` during a session; the Netlify dashboard keeps the full history and can roll back to any earlier deploy.

## Branches
`main` holds the live product since pull request 1 was merged (22 Nov 2026). Work happens on `claude/eager-rubin-7bpcgq` and is merged into `main` by pull request at each release. `app/_held/` and `lib/data.js` hold unverified or bilingual material that is deliberately not routed; the site is English only.

## Release process (current)
1. Work on the branch; commit and push often. Pushing the branch does not deploy (Netlify deploys the production branch only).
2. Before a release, run every gate on a clean `git archive` of the branch: `npm run build`, the smoke test, `npm run verify:repro`, `npm run typecheck`, `npm run test:reports`, `qa:axe`, `qa:crawl`, `qa:overflow`.
3. Merge the branch into `main` by pull request once per major release (owner policy, 21 Nov 2026). The merge deploys.
4. Verify the live pages and data files, and record the commit and deploy id in `docs/production-provenance.md`.

## Rollback
In the Netlify dashboard, open Deploys, pick the previous deploy and publish it. No code change is needed.

## Known integration noise
GitHub Actions got no runner (account level), so the workflow was removed on 21 Nov 2026; the gates run locally before each release merge. Netlify's build runs the data and build tests (`npm run build`) but not the smoke, axe, crawl or report checks, so those must pass locally before merging into `main`. Cloudflare and Vercel checks on pull requests are not deploy targets.
