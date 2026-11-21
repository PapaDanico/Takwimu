# Siaya climate, water and resilience: extraction notes (WP5, R-005)

Data: `data/siaya-climate.json`. Schema: `schemas/siaya-climate.schema.json`. Test: `node scripts/test-climate.js`. Retrieved 21 Nov 2026. Not yet wired into `scripts/validate-data.js` or any page.

## What is recorded (87 values)
- **Hazards (49).** These come from the PCRA ward risk profile (section 2.4.1). There is one flood or drought entry per ward where the ward table lists one, with hotspots copied as printed. The rest come from Table 2 (county hazard list), three narrative ranking statements, and Annex 2 rows 7, 8, 10 and 12. The PCRA prints **no severity ranking by ward**, and each entry says so. "S/NO." and the Annex row numbers are serial numbers, not ranks. The only rankings in the text are narrative: "unpredictable onset of rainfall... the major current hazard" (county), drought as "the worst hazard" in Bondo and Rarieda, and HIV/AIDS "perceived to be the most dominant hazard".
- **Coverage (17).** These come from four sources that each use a different definition. They are kept side by side in `comparisons[]` and no single figure is chosen:
  - KDHS 2022: JMP water and sanitation ladders, as a share of the de jure population.
  - CIDP: 58% "safe water". The narrative gives this as a share of households and the indicator table as a share of the population. Neither defines it.
  - WASREB Impact 18: SIBOWASCO service-area coverage of 62%, and Siaya county population served by formal water service providers of 34%. The 34% is read from a chart label.
- **Money (21).** There are four kinds, each in its own series:
  - allocation: budget estimates and targets
  - receipt: grant cash received
  - transfer: money disbursed into the county FLLoCA fund
  - expenditure: actual department spending

  "Climate-tagged" here means the FLLoCA grant lines only. The water/environment department totals are sector allocations, not climate tags. No outcome values are recorded.

## FLLoCA findings
- FY 2024/25 (CBROP, Table 7, p.17): the CCRI estimate was KSh 137,000,000 and KSh 30,222,034 was received. The CCIS line shows "-".
- FY 2025/26 (Q4 report, Table 0.1 and Table 0.6):
  - Targets: development 217,509,163, recurrent 11,000,000 and the 2025/26 grant 137,000,000. These add up exactly to the fund's approved budget of 365,509,163.
  - Receipts: 126,449,101, 11,000,000 and 94,152,840. These add up exactly to the 231,601,941 disbursed to the fund.
  - Cumulative disbursements to the fund since 2022 total 470,842,789.
- No FLLoCA project expenditure or verified adaptation outcome is published in the documents read. R-005 stays open.

## Ward names
- The reference spelling is the CIDP 2023-2027 ward table (PDF p.28), recorded as `ward_register`. The IEBC register was not downloaded, so IEBC spellings are unverified. For example, the IEBC may use "Yimbo East" where the CIDP and PCRA print "East Yimbo".
- Spelling differences:
  - The CIDP prints "Township" for Siaya Township.
  - PCRA Annex 2 prints "Sigomre" for Sigomere.
  - PCRA Annex 3 has OCR-style splits ("Tow nship", "Ukw ala", "C. Sakw a").
- Seven wards have no ward table in the PCRA: Usonga, West Alego, North Ugenya, East Ugenya, Ukwala, Central Sakwa and West Asembo.

## Cautions
- The PCRA PDF lists named participants with national ID and phone numbers (Annex 1, PDF pp.91-94). Never republish the file or those pages. Only aggregate statements are taken.
- climatefinanceken.go.ke still fails TLS verification. It presents a chain to eMudhra or Comodo roots that are absent from this environment's trust stores, over both https and http. Verification was not bypassed. The same-named file was taken from the Council of Governors Maarifa mirror instead. Whether that file is byte-identical to the original is unverified.
- Flood impact counts were not obtained. ReliefWeb returned 403. News counts conflict: 80 households, more than 1,000 residents, and more than 5,000 families. These are Tier D leads only and are not recorded as values.

## New source documents (downloaded this pass; untrusted copies under /tmp/claude-0/library/)
| Title | URL | sha256 | Used |
|---|---|---|---|
| Siaya County Participatory Climate Risk Assessment (PCRA) Report, 2023 (Maarifa mirror of CLIM-01) | https://maarifa.cog.go.ke/sites/default/files/2024-06/Siaya%20County%20PCRA%20Report%20%28revised%20nakuru%29%20FINAL.pdf | 94ac1729fa29f651b4516ffc35dc676238273f3ef66773249a285111f8898313 | yes |
| Siaya County Climate Change Action Plan (2023-2028) | https://www.maarifa.cog.go.ke/sites/default/files/2024-07/Siaya%20County%20Climate%20Change%20Action%20Plan%20%28NAKURU%20FINAL%29.pdf | a22909d390985e04cebf36cb9cdcf87117ef86700e36a1863095277f162c0b88 | no (planned costs only; not allocations) |
| WASREB Impact 18: Performance Report of Kenya's Water Services Sector 2024/2025 | https://wasreb.go.ke/wp-content/uploads/2026/06/Impact-18-Report.pdf | 93c826ddcf57075968f72814dc9e68cf1f141eec080bccfb7090c928d8d09720 | yes |
| WASREB Impact Report 16 (2022/23) | https://wasreb.go.ke/wp-content/uploads/2024/06/Impact-Report-16.pdf | 2865f8b50aa13d6826e4c3f16439989d0580f83226899c9e30a87b5c0424f770 | no (utility tables have no text layer) |

These documents were already in the library and are reused: GOV-01-PDF (CIDP), GOV-03 (CBROP FY 2024/25), GOV-02 31593 (Q4 FY 2025/26) and KDHS 2022 FR380. Their hashes are in the data file.

## Verification
Every observation has a `quote` that was checked to appear on its `pdf_page` (pdftotext). Numeric values were also checked to appear on that page.
