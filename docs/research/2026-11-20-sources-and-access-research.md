# Sources, access and accessibility research (20 Nov 2026)

Search-based findings. Confirmed means a source stated it; unconfirmed means not verified.

## Data sources for Siaya and Kenya
| Need | Finding | Status |
|---|---|---|
| County revenue and spending | Controller of Budget publishes quarterly and annual County Budget Implementation Review Reports as PDFs (cob.go.ke); no bulk or API access found | Confirmed PDFs; API not found |
| Audit opinion | Auditor-General report "County Executive of Siaya for the Year Ended 30 June 2024" exists (Parliament library record dated 2025-03-05). A consolidated volume reportedly says no county executive recorded a clean opinion. The opinion type for Siaya was not read | Report found; opinion unread |
| County economy | KNBS Gross County Product reports (2019, 2021, 2023, 2024 editions). Press outlets quote different Nairobi per-capita figures for one edition, so go to the primary PDF | Confirmed |
| KNBS data portal and API | A search found nothing on a KNBS SDMX portal or API URL. KNBS homepage returned HTTP 503 twice when fetched, so no terms of use, licence or portal link could be read | Unconfirmed; retry later |
| Inflation | KNBS publishes monthly "Consumer Price Indices and Inflation Rates" reports. Current base is February 2019 = 100. No county CPI found, only Nairobi series | Confirmed national only |
| Source terms and reuse | No KNBS terms or Kenyan open-data licence found | Unconfirmed |

Decision: the real/nominal toggle will use KNBS national CPI (Feb 2019 = 100) and say so on the method page. Redistribution of source figures stays limited to compiled series with attribution until terms are read.

## Siaya own-source revenue dispute
Controller of Budget figure KSh 436.7M versus county figure about KSh 946M for FY 2024/25, both from press reports. Still unverified against the primary documents. Next step: read the Controller of Budget FY 2024/25 annual report and the Siaya County Treasury statement.

## Accessibility
- Ran axe-core 4.x (WCAG 2.0 to 2.2 A and AA tags) on the built home and method pages in light and dark themes: 0 violations. Two "needs review" items about unlabelled groups were fixed by adding `role="group"`. One remaining item: axe cannot determine the background of the chart's SVG tick labels because of the hatch pattern. Those labels use the muted text token on the surface colour; contrast was not measured separately.
- Research: pa11y's default engine lags WCAG 2.2, so use the axe runner. Automated tools catch roughly a third to half of WCAG issues and cannot judge SVG chart usability. A vendor audit found all 10 charting libraries scored zero axe violations including unlabelled canvas charts, so each chart needs a hand check: accessible name, text or table equivalent, keyboard access. The chart has a name, a "View as table" option and focusable bars.
- Not done: manual screen-reader test, keyboard-only walkthrough, running axe in CI (needs a browser install in the workflow).

## Citizens-budget guidance
IBP "The Power of Making It Simple" (2012): publishing documents is not enough, accessibility is the point. Takwimu's explainer-first design follows this. Kenyan county citizens-budget practice was not found.

## Open gaps
1. Retry KNBS site for portal, terms and county abstract links.
2. Read the Siaya audit opinion (FY 2023/24 and later) from the Auditor-General PDF.
3. Read the Controller of Budget FY 2024/25 report for the Siaya own-source revenue figure.
4. Manual accessibility and screen-reader review.
5. Benchmark PDF table parsers on real Controller of Budget files.
