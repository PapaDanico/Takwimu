# IMF data for Kenya (data/imf.json)

Built 21 Nov 2026 by `python3 -I scripts/fetch_imf.py` (rebuild without network: `--offline`). Checked by `node scripts/test-imf.js`. National only.

## Route
- IMF DataMapper API (`imf.org/external/datamapper/api/v1/...`): HTTP 403 Access Denied (Akamai) from this environment. One probe only.
- **Worked: IMF SDMX 3.0 API**, `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/WEO/<version>/KEN.<indicator>.A?attributes=all`. One request per indicator, because multi-indicator queries drop the latest-actual-year attribute. User-Agent `TakwimuKenya-data`; backs off 30-120 s on HTTP 429 (none seen).
- Raw responses (untrusted, not committed) are in `/tmp/claude-0/library/imf/sdmx/`. The SHA-256 of each is in `vintages[].raw_files`.

## Vintages (kept separate)
| Vintage | SDMX version | Published | Latest actual year |
|---|---|---|---|
| October 2026 | 9.0.0 | 2026-10-13 | 2025, all ten indicators (country update 30 Sep 2026) |
| April 2025 | 6.0.0 | 2025-04-22 | 2023 for GDP growth, current account and GDP US$; 2024 for prices and fiscal; 2019 for GDP per capita |

Type per year: up to the WEO `LATEST_ACTUAL_ANNUAL_DATA` it is **actual**; after that and before the edition year it is **estimate**; from the edition year on it is **projection**. Values run from 2010 to 2031 (Oct 2026) and to 2030 (Apr 2025). All ten indicators are served, PCPIEPCH included. NGDPD is converted from US$ to US$ billion. In Oct 2026 the IMF gives the fiscal series' reporting year as "January/December", recorded as served.

## Documents (`documents`, to merge into source-library.json)
CR 24/316 (7th and 8th EFF/ECF reviews, 1 Nov 2024), CR 24/13 (2023 Article IV and 6th reviews, 17 Jan 2024), CR 23/266 (5th reviews, Jul 2023) and PR 26/071 (staff visit, 4 Mar 2026). There has been no Article IV since Jan 2024. The ninth review was dropped in Mar 2025, and a new programme request is under discussion. URLs were found by web search. The PDF downloads returned HTTP 403 (Akamai on imf.org, CloudFront on elibrary), so `sha256` is null and `download_status` gives the reason. Licence: "link and cite; check IMF copyright for redistribution", `redistribution_allowed: false`.

## Candidate conflicts (`comparisons`, |difference| > 0.5; not in conflicts.json)
Only the latest vintage's actual years are compared, never projections.
- GDP per capita vs WB: IMF is 6.7-9.1% higher in every year 2010-2025. The likely cause is different population denominators.
- Revenue vs WB GC.REV.XGRT.GD.ZS: -0.5 to -3.3 points (2014-2023). Expenditure vs WB GC.XPN.TOTL.GD.ZS: -5.2 to +5.6 points. These are definitional: general government against central government, grants, and expense against expenditure.
- Gross debt vs CBK December debt / CBK nominal GDP (a derived ratio): 2023 -0.69, 2025 +1.29.
- GDP US$ vs WB: 2011, 2023, 2024 (0.66-0.86%).
- End-period inflation vs CBK December 12-month rate: 2019 +1.34.
- Real GDP growth and average inflation agree within 0.5 with both WB and CBK.

## Integration (for the coordinator; not done here)
1. `package.json`: add `node scripts/test-imf.js` to the build/test gate chain.
2. `scripts/validate-data.js`: register `data/imf.json` with `schemas/imf.schema.json`.
3. Merge `documents` into `data/source-library.json` (map fields to its schema; keep `sha256` null until downloaded from a network that reaches imf.org, then add them to `data/source-manifest.json`).
4. Add source ids `imf-weo-sdmx` (dataset) and the four document ids to the source register or catalogue.
5. Pages: `/kenya/` and the trend explorer through `lib/explore.js`. Show each vintage separately, style projections differently and label them "IMF projection", and show IMF and WB/CBK side by side where candidates exist. Every chart needs a table view.
6. Done 21 Nov 2026 (sweep D13). In `data/conflicts.json`, each with a test in `scripts/test-reconciliation.js`: debt against CBK (`imf-debt-cbk-2023`, `imf-debt-cbk-2025`), end-period inflation (`imf-inflation-eop-cbk-2019`), and the substantive definitional differences against the World Bank: GDP per capita (`imf-wb-gdp-per-capita-2025`), revenue (`imf-wb-revenue-gdp-2023`), expenditure against expense (`imf-wb-expense-gdp-2023`) and GDP in US$ (`imf-wb-gdp-usd-2024`). They are labelled "Definitional difference" and shown side by side on `/kenya/#imf-wb`. The other years in `comparisons` follow the same pattern and stay there.
7a. Licence (sweep D1/D2): the IMF is "link and cite only" in `data/source-library.json` (`data_reuse`). No CSV/JSON copy of the IMF values is published; `/kenya/` cites "IMF World Economic Outlook, <vintage>, © IMF". `scripts/validate-data.js` fails if the catalogue offers a bulk download for a link-and-cite source.
7. Smoke test and sitemap: add any new route.
