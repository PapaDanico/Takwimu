# Siaya programme atlas (WP8): notes

File: `data/siaya-programmes.json`. Schema: `schemas/siaya-programmes.schema.json`. Test: `node scripts/test-programmes.js`. Compiled 21 Nov 2026. Window: programmes active at any time from 1 Jan 2016.

## What is in it
73 programme records (SIA-G-001 to SIA-G-073):

| Geography class | Records | Meaning |
|---|---|---|
| siaya_specific | 28 | Siaya is the only place named |
| siaya_wards_listed | 2 | Named places inside Siaya (Ligala well: North Ugenya ward; PBIDS: "Asembo", flagged as not a ward name) |
| multi_county_including_siaya | 31 | Siaya plus other named counties |
| national | 12 | National programme with Siaya as one of many sites or partners |

Evidence type: 14 planned, 47 self-reported, 12 independently evaluated. The 12 evaluated records are World Bank projects with an IEG rating, which covers the whole project. None reports Siaya-specific results, so no outcome on them is attributed to Siaya (R-006).

## Sources and how records were chosen
- **County documents (tier A):** CIDP 2023-2027 (GOV-01-PDF), CBROP FY 2024/25 (GOV-03), Q4 FY 2025/26 budget implementation report (GOV-02-31593). These give the only Siaya-specific amounts for donor programmes: the county-booked grants SIA-G-018 to SIA-G-028 (KDSP, FLLoCA, NAVCDP, KeLCoP, ABDP, KUSP, DANIDA, KCSAP, ASDSP, Livestock Value Chain Support Project, KABDP).
- **World Bank Projects API (KE, saved 21 Nov 2026):** a project is included when its geo-codes include Siaya, or when the county books a grant from it. Closed before 2016: left out.
- **IATI via d-portal:** 158 activities match "Siaya". The 139 that end in 2016 or later were saved as XML (sha256 per file in each record). Records kept are the ones whose title, description or location places work in Siaya. The ones left out are listed under `screened_out`.
- **KEMRI PBIDS page (HEALTH-03)** for the Asembo surveillance site.

## Siaya totals and reconciliation
`summary.siaya_development_partner_grants_kes` adds up only Siaya-specific KES amounts by fiscal year, from the county documents. For each year, the printed county subtotal minus the lines that are not development-partner funded (CHPs, RMLF, CAIP, mineral royalties, fertiliser subsidy, medical equipment lease, salary arrears, housing committee allowances) equals the atlas total exactly:

| FY | Allocation (KSh) | Receipt (KSh) |
|---|---|---|
| 2023/24 | 558,767,940 | not reported in CBROP |
| 2024/25 | 473,462,266 | 155,732,853 |
| 2025/26 | 1,187,125,547 | 765,038,160 |

Amounts in IATI and World Bank records are never converted or added up. Multi-county and national amounts and beneficiary counts are marked `pooled: true` and are left out of every Siaya figure.

## Lwala, Red Cross and UNICEF (programme register leads)
- **Lwala annual reports 2024 and 2025:** Siaya does not appear. The counties named are Migori, Homa Bay, Baringo and, for emergency obstetric care, a wider set that includes Kisumu but not Siaya. No Siaya record was created, and Lwala's reach figures are not attributed to Siaya.
- **Kenya Red Cross floods page:** Siaya does not appear. A Siaya-specific record would have to be requested from the Society.
- **UN-01 to UN-03:** these are statistical reports with no programme records. UNICEF country-programme outputs that name the County Director of Health, Siaya, as a partner come from IATI (SIA-G-067 to SIA-G-069, national, pooled).

## Rules applied
- Only organisations are named. Personal names, phone numbers and e-mail addresses are not recorded (docs/data-protection-policy.md). Lwala and MESA list named staff and investigators; those names were not copied. The test scans every string for honorific-plus-name, phone and e-mail patterns.
- When a funder is not named in the cited source, the record says so (`funder_basis`) and does not guess. This applies to KeLCoP, ABDP, ASDSP, the Livestock Value Chain Support Project and KABDP.
- Blank or "-" cells are recorded as null, never as zero. The cost of the KEMRI-Siaya complex is printed as "12,400" with no unit, so no value is recorded.
- IATI and World Bank values are self-reported by the publisher. A geo-code shows where work was planned or reported, not how much reached Siaya.

## Open gaps
- Global Fund grants: the API address tried returned 404, and Kenya grants are not split by county.
- foreignassistance.gov returned 403. USAID and CDC records come from their IATI files instead. USAID DEC was not searched.
- Spend inside Siaya by multi-county programmes is not known.
- No partner register from the county was found.
- PEPFAR amounts are partial: they cover only the published IATI transactions, not award totals.
- The status of USAID-funded records after 2025 has not been verified.

## Not done
The atlas is not added to `npm run validate`. Wiring `scripts/test-programmes.js` into package.json is left to whoever owns that file.
