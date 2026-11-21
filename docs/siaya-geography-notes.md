# Siaya geographic registry: notes

Registry: `data/siaya-geography.json`. Schema: `schemas/siaya-geography.schema.json`. Test: `node scripts/test-geography.js`. Compiled 21 Nov 2026.

## What it holds

- County: Siaya, IEBC county code 041.
- 6 IEBC constituencies: Ugenya 232, Ugunja 233, Alego Usonga 234, Gem 235, Bondo 236, Rarieda 237.
- 30 county assembly wards, codes 1156 to 1185. Each ward has one parent constituency, the spelling in each cited source, and aliases with where each alias was seen.
- Two sub-county naming systems, kept apart from the constituencies: county-government sub-counties (CIDP Table 3) and KNBS census sub-counties (as reproduced in CIDP Table 5).
- The vintage, source and licence of each spatial layer already in the repository.

## Sources

| ID | Document | Used for |
|---|---|---|
| IEBC-GN-13904-2025 | Kenya Gazette Notice 13904, 26 Sep 2025 (registration centres), PDF pp. 296-303 | Codes and names for 27 wards |
| IEBC-2017-RESULTS | IEBC report on the 2017 General Election, MCA results, PDF pp. 546-552 | Codes and names for all 30 wards |
| IEBC-ROV-2022 | IEBC registered voters per constituency, 2022, p. 6 | Constituency codes |
| CIDP-2023-27 | Siaya CIDP 2023-2027, Tables 3, 4 and 5 (pp. 7-9) | Sub-county labels and spelling variants |
| KNBS-KPHC-2019-VOL1 | 2019 Census Volume I | Not acquired (see below) |

SHA-256 hashes are stored in the registry. The PDFs were downloaded to `/tmp/claude-0/library/GEO-IEBC-*`. They are not committed, and `data/source-manifest.json` was not edited because another workstream owns it. When those PDFs are present, the test reads the ward rows from them again; otherwise it reports the step as skipped.

## Findings

1. **Ugunja is missing from the 2025 gazette notice.** Gazette Notice 13904 lists no Ugunja wards (1160 Sidindi, 1161 Sigomere, 1162 Ugunja). The notice says it leaves out areas with ongoing by-elections, but it does not name them. The codes and names for those three wards come from the 2017 IEBC results report. The constituency code 233 is confirmed by IEBC-ROV-2022.
2. **Spelling differences.** IEBC writes "Siaya Township" and "Yimbo East". The CIDP writes "Township" and "East Yimbo". `data/siaya-audits.json` uses "East Yimbo". These spellings are stored as aliases, and the IEBC spelling is the official name.
3. **Boundary review.** No IEBC boundary review result from 2024 or 2025 was found. The 2025 notice still uses the 2012 delimitation codes, so the registry's vintage is the 2012 delimitation.
4. **KNBS sub-counties are not the same thing as constituencies.** In the CIDP's KNBS table, Alego Usonga is labelled "Siaya (Alego Usonga)". The CIDP says Gem is split administratively into Gem Wagai and Gem Yala. Neither source gives ward lists or codes for those two units. The registry maps each KNBS and county sub-county to a constituency by name only, and the boundaries have not been checked. Census Volume I could not be fetched: the KNBS server failed TLS verification because its certificate chain is incomplete, and a second attempt returned HTTP 503.
5. **`data/subcounties.json`** matches the registry. Its ids, names and ward counts (6, 6, 4, 3, 6, 5) agree.
6. **`data/siaya-boundaries.json`** matches the registry's ids and names. Its licence (CC BY 3.0 IGO) and year (2020) match the geoBoundaries ADM2 metadata (KEN-ADM2-3690345, upstream IEBC and OCHA ROSEA, built 12 Dec 2023). geoBoundaries labels this layer "Sub-Counties", but its 290 units are IEBC constituencies.
7. **The licence in `data/kenya-counties-map.json` differs from its source.** The file says CC BY 3.0 IGO, from IEBC via OCHA ROSEA. The geoBoundaries ADM1 metadata (KEN-ADM1-32016919) says Public Domain, from RCMRD GeoPortal. The file was not edited. Its owner should correct the meta.
8. **No ward boundary layer exists.** The Ward Explorer must not draw ward shapes until a licensed 2012 IEBC ward layer has been acquired and recorded.

## Ward names in other files

The test looks through `data/siaya-*.json` (all except this registry and the boundary file). It collects `ward`, `ward_name` and `wards` values and phrases of the form "<Name> ward". Each name is then looked up against the ward names and aliases. On 21 Nov 2026 it found 5 ward names, and all 5 resolved. A name that does not resolve is printed as a warning and does not fail the test.
