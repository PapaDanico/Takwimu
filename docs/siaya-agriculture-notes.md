# Siaya agriculture, livestock, fisheries and irrigation: extraction notes (21 Nov 2026)

Data: `data/siaya-agriculture.json` (schema `schemas/siaya-agriculture.schema.json`, test `node scripts/test-agriculture.js`). Not yet wired into the build, the site or `npm run verify`. Sector value added (GCP) stays in `data/siaya-economy.json` and is not repeated here.

## What was extracted
- **KNBS Siaya County Statistical Abstract 2015** (2013 and 2014*, data from the county departments): area, production and value for maize, beans, sorghum, rice and cassava (Table 4.2, p.11); bag counts (Table 4.5, p.12); livestock numbers (Table 5.1, p.14); fish ponds, fish landed and aquaculture, quantity and value (Tables 6.1-6.3, p.19).
- **CIDP 2023-2027** (GOV-01-PDF): blue economy statements (p.20); 2018-2022 review table (p.23); M&E baselines for 2022 and mid-term and 2027 targets for irrigated area, cereals, roots and tubers, capture and culture fish (pp.177-178); rice irrigation scheme targets for Muluwa/Lower Nzoia and Anyiko (pp.149-150).
- 105 values: 62 observed, 43 targets, no projections. Every row has the source, table, PDF page and printed page, period, unit, status, the printed string and a confidence score from 1 to 5.

## Problems found (kept as printed; listed in `conflicts`)
1. The 2014* "Production (Tonnes)" column in Table 4.2 equals the bag counts in Table 4.5 (maize 1,372,914). It is marked confidence 1, do not chart. The 2013 tonnes do not match the bags at 90 kg, and the bag weight is not stated.
2. Fish landed in 2013-2014: Table 6.2 (28,222 t; 27,141 t) and Table 6.3 (24,703 t; 28,519 t) disagree on the same page.
3. The CIDP gives three fish figures with inconsistent units: "30,147,600 metric tonnes" (p.20, withheld as implausible), "000 (MT)" 30,000 + 147.6 (p.23), and 29,625,057 kg (p.178).
4. The CIDP gives irrigated area as 680 ha (p.20) and as 1,000.5 acres, about 405 ha (p.177).
5. The CIDP gives 88 landing sites and "over 60 existing beaches" in the same paragraph.
6. The CIDP's "000 (MT)" sorghum and roots figures (p.23) are implausible as thousand tonnes.

## Gaps (not filled)
- No yields are printed in either source, so the area x yield check has no published triplet to test. The checker is self-tested on synthetic rows.
- No cotton or sugarcane quantities; no crop or livestock data for 2015-2025; no landings by BMU or beach; no county-level frame survey (fishers, boats); no observed irrigated area by scheme.

## New source documents (to add to data/source-library.json)
| Title | URL | SHA-256 | Status |
|---|---|---|---|
| Kenya National Bureau of Statistics, Siaya County Statistical Abstract 2015 (81 pp, 722,813 bytes, PDF created 2017-02-28) | https://www.maarifa.cog.go.ke/sites/default/files/2026-02/2015-County-Statistical-Abstracts-Siaya.pdf | 3e7cfa7105a03dc01ef346ad2ea2aea65cd9b9f7c17614cd15fa9f5b56fddb13 | Acquired (`/tmp/claude-0/library/AGRI-CSA-SIAYA-2015/body`). Licence: KNBS copyright; extracts may be used with acknowledgement |
| Ministry of Agriculture, National Agriculture Production Report 2023-2024 (county crop annex) | https://statistics.kilimo.go.ke/files/bookpage/National_Agriculture_Production_Report_2023-2024.pdf | none | Inaccessible: connection reset, 21 Nov 2026 |
| Ministry of Agriculture, Economic Review of Agriculture 2015 | https://statistics.kilimo.go.ke/files/bookpage/Economic_Review_of_Agriculture_2015.pdf | none | Inaccessible: same host |
| LVEMP, Status report on Lake Victoria frame surveys for 2000, 2002 and 2004, Kenya | https://repository.eac.int/handle/11671/779 | none | Discovered only. Its geography predates the counties, so not extracted |

The CIDP is already in the library as GOV-01-PDF (sha256 650a5bdf…9d0d).
