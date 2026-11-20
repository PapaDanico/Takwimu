# Sprint work plan: a populated, shareable Takwimu

Sprint goal: by the end of this sprint, https://takwimu.netlify.app is a complete civic-education site for Siaya County that anyone can open on a phone, understand, check against sources, and share.

Scope rule: every figure on the site has a named source, a retrieval date and a confidence score, and passes `npm run validate`. Nothing is published that cannot be traced.

## Deliverables
| # | Deliverable | Acceptance test |
|---|---|---|
| D1 | Overview page (done): revenue, trend, spending, obligations, audit | Live, checks pass |
| D2 | Sub-counties page: all 6 sub-counties with population, area, density, wards, villages, voters, health facilities and health workforce, with comparison charts | Every number traced to the CIDP annex; sums reconcile to county totals |
| D3 | County profile: poverty, households, urban population, health outcomes against national averages | Same |
| D4 | Insights page: derived analysis (per-person revenue and spending, workforce gaps, density, health outcomes) | Every insight shows its inputs and arithmetic |
| D5 | Learn page: plain-language explainers for 16 budget and audit terms | Each marked "draft" until reviewed |
| D6 | FAQ page | Answers link to the method and data pages |
| D7 | Method page: sources, confidence rubric, verification protocol, disagreement rules, fiscal year conventions, update cadence | Rubric matches how scores were actually assigned |
| D8 | Corrections page: public log of every error found and fixed so far | Entries match `docs/bug-sweep-log.md` |
| D9 | Data page: downloadable JSON, data dictionary, source register | Files served from `/data/` and valid |
| D10 | Header and footer updated for the new pages; not-found page | All links resolve |
| D11 | Share readiness: Open Graph image, per-page titles and descriptions, sitemap, robots, WhatsApp share links | Social preview tags present; sitemap lists every page |
| D12 | Quality gates: validator, type check, layout at 360 and 1280 px (light, dark), axe, keyboard walk, link check | All pass |
| D13 | Deployed to Netlify and verified live | Live pages match the build |

## Workstreams and sequence
1. **Data (D2, D3):** extract sub-county and county tables from the Siaya CIDP 2023-2027 text layer; encode in `data/subcounties.json` and `data/county.json` with provenance; extend the validator (sums, ratios, years); publish to `/data/`.
2. **Pages (D2 to D9):** build shared components (tile, bar list, share row, source line), then each page; update navigation.
3. **Share readiness (D11):** metadata, Open Graph image, sitemap, robots, WhatsApp links.
4. **Quality (D12):** run the full suite; fix everything it finds; record in the bug log.
5. **Release (D13):** commit, push, deploy through the Netlify connector, verify the live site.

## Quality gates (every step)
- `npm run validate`, `npm run typecheck`, `npm run build` pass.
- No sideways scrolling at 360 px; no SVG label overlaps; axe reports 0 violations in light and dark.
- Text contrast at least 4.5 to 1 for every colour pair used.
- Every external link on the site is listed and checked.
- Derived numbers are labelled "derived" and show their inputs.

## Known limits (stated on the site, not hidden)
- County statistics come from the county's own plan, which reproduces KNBS data. Sub-county figures are as at 2019 (census) and 2022 (projection and service counts).
- Controller of Budget data is for FY 2024/25 and earlier. The FY 2025/26 annual report exists but could not be downloaded; press coverage is not used for figures.
- National inflation series and real-terms toggle are not in this sprint because the KNBS source could not be reached.
- Explainers are drafts until reviewed.

## Out of scope this sprint
Other counties, ward-level data, automated data refresh, real-terms charts, user accounts.

## Definition of done
All deliverables accepted, quality gates green, site deployed, and a short handover note listing what is verified, what is derived, and what is open.

## Ten-year requirement (added 20 Nov 2026)
All series must go back at least ten years (FY 2014/15 to FY 2024/25) or say why not.
- Done: budget, spending, absorption, own-source revenue (FY 2013/14 to 2024/25), pending bills, audit opinions FY 2020/21 to 2023/24, population 2009 to 2022 including sub-counties, health surveys 2014 and 2022, poverty 2005/06 and 2015/16, price index for real-terms views.
- Open gaps (listed on the Method and Data pages): FY 2019/20 county report, FY 2013/14 approved budget and pending bills, audit opinions FY 2014/15 to 2019/20, FY 2025/26 report, later county poverty estimate.
- Pages built: Insights, Sub-counties, County profile, Learn, FAQ, Data, Method, Corrections.
