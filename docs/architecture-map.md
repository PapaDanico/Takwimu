# Architecture map: what deploys the live site

Checked 21 Nov 2026. This answers the handover's P0 gate.

## Production mapping

| Link | Value |
|---|---|
| Public URL | https://takwimu.netlify.app |
| Hosting project | Netlify site `takwimu`, site id `bf11e227-c98e-4258-aff6-d7660459aef1` |
| How it is deployed | Command-line upload (`npx @netlify/mcp deploy-site`) of a clean `git archive` of the working branch. Netlify then runs the build. The site is not built by a Git push. |
| Repository | https://github.com/PapaDanico/Takwimu |
| Source branch | `claude/eager-rubin-7bpcgq`, open as pull request 1 against `main` |
| Build command | `npm run build` = unit tests, data validation, data publishing, `next build` |
| Output directory | `dist/` (static export, `trailingSlash`) |
| Config | `netlify.toml`, `next.config.js` |

Each deploy logs its deploy id in `/tmp` during a session; the Netlify dashboard keeps the full history and can roll back to any earlier deploy.

## The default branch is a different, older product

`main` holds the earlier flat layout: root-level `page.js`, `layout.js`, `data.js`, `build-data.js`, `sheng.js`, `wrangler.toml` and a Cloudflare Pages README ("Takwimu Intelligence Engine"). It does not match the live site. The live site (Takwimu Counties, Siaya) exists only on the pull-request branch, which is about 35 commits ahead.

Consequences and rules:
1. Do not deploy `main` to the Netlify site. It would replace the live product with the older one.
2. Do not merge the two products. Merging pull request 1 would replace the older layout with the current one; that is the owner's decision.
3. `sheng.js`, `lib/data.js` and `app/_held/` hold unverified or bilingual material that is deliberately not routed. The site is English only.
4. The README on `main` is stale. The README on the branch describes the current layout.

## Release process (current)
1. Work on the branch; commit and push often. Pushing does not deploy.
2. Run `npm run build`, then the checks in `docs/release-plan.md`.
3. Deploy once per major release (owner policy, 21 Nov 2026).
4. Verify the live pages and data files.

## Rollback
In the Netlify dashboard, open Deploys, pick the previous deploy and publish it. No code change is needed.

## Known integration noise
GitHub Actions gets no runner (account level), Cloudflare Workers Builds and Vercel previews are connected to the repository but are not deploy targets. These show red on pull request 1 and should be disconnected by the repository owner.
