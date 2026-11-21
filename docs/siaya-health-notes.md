# Siaya health indicators: research notes (21 Nov 2026)

Data: `data/siaya-health.json` (schema `schemas/siaya-health.schema.json`, test `node scripts/test-health.js`). Programme scope: research programme sections 1, 3C, 5 ("Disease burden", "Community health") and 8. Aggregates only, per `docs/data-protection-policy.md`: county, sub-county or sentinel-area values; no individuals and no patient-level data.

## What is recorded
78 values from 12 sources. Each value has its own source, table or section, PDF page (printed page where there is one), period, vintage, age group, population, geography, method, unit and confidence (1-5, scale in `meta.confidence_scale`). Vintages are separate rows; nothing is averaged or merged.

| Topic | Values | Main sources |
|---|---|---|
| HIV prevalence | 8 county values (2013-2025, six model rounds plus one press figure) and 1 sentinel-site value | Kenya HIV Estimates 2015 and 2018; SCASP 2015/16-2018/19; NSDCC poster 2022; NSDCC County Profiles 2026; CIDP 2023-2027; HEALTH-01; KEMRI/CDC HDSS profile |
| HIV incidence, new infections | 2 incidence, 6 new-infection counts | as above |
| ART, cascade, viral suppression, MTCT | 11 | SCASP; NSDCC 2022 and 2026; CIDP (KHIS) |
| TB | prevalence (2), incidence (1, press), cure rate (2), TB/HIV co-infection (1) | CIDP; HEALTH-01; NTLD-P Annual Report 2023 |
| Malaria | prevalence (4), ITN use and IPTp (KDHS 2022) | CIDP; HEALTH-01; KDHS 2022 KIR |
| Maternal care | skilled ANC, skilled delivery, facility delivery | KDHS 2014 and 2022; CIDP |
| Immunisation | full/basic (KDHS 2014, 2022); admin coverage (CIDP) | KDHS; CIDP |
| Stunting | KDHS 2014, 2022; CIDP (Nawiri/Stawisha 2019) | KDHS; CIDP |
| Health workforce | population per doctor, nurse and clinical officer for each of the six sub-counties | CIDP fact sheet (PDF pp.207-208) |
| Community health | 221 CHUs, 210 assessed, 7.6% of committees fully functional | HEALTH-02 (inaccessible; confidence 1) |

## Rules applied
- **Vintages**: every HIV estimate keeps its model round. NSDCC states that estimates from different rounds are not comparable (KHE 2015 p.7; KHE 2018 p.4). The fall from 24.8% (2015) to 10.3% (2025) is mostly re-modelling.
- **Secondary reports**: HEALTH-01 (May 2026 county article: HIV 9.8% [2023], malaria 24%, TB incidence 363/100,000) names no dataset, so each is confidence 1 with "not traceable" as the original source. HEALTH-02 returns HTTP 404; its figures are as quoted in the programme document and are confidence 1. CIDP figures are recorded as secondary reports with the original it names (KHIS 2022, NACC 2021, TIBU 2022, MICS, Nawiri/Stawisha 2019).
- **Sentinel site**: the KEMRI/CDC HDSS value (HIV 15.4%, ages 13-34, 2003-04) is `geography: sentinel-site` and says it is not representative of the county. PBIDS (HEALTH-03) and MESA (HEALTH-04) pages link no data tables, so no values were taken from them.
- **Conflicts**: nine sets in `conflicts[]` (HIV prevalence, viral suppression, TB prevalence, TB cure rate, malaria prevalence, skilled delivery, facility delivery, stunting, immunisation). No value was chosen over another.

## Findings to flag
1. **data/history.json, HIV 2025 point** says "ages 15 to 49". The NSDCC County Profiles 2026 Siaya page (PDF p.84, printed p.79) prints 10.3% as "Overall", with the sex split for ages 15+ (men 7.62%, women 12.67%). It does not say 15-49. The value matches; the age label in history.json may be wrong. Not edited (out of scope for this task).
2. **data/history.json, HIV 2013 and 2015 points** cite "PDF page 16 (printed page 3)". The page footer reads 4.
3. **Viral suppression**: 96% (KHIS, Dec 2021, poster) against 53.7% (NSDCC 2025 cascade, 3rd 95). Neither page prints the denominator.
4. **Malaria**: the CIDP gives 19% ("MICS", PDF p.193) and 29% ("Malaria cluster indicator survey 2022", PDF p.205) on different pages. Neither survey report was found. No survey has measured malaria prevalence at county level in Siaya since KDHS 2022 dropped testing.
5. **Stunting 20.7%**: the CIDP attributes this to Nawiri/Stawisha 2019 on PDF p.205 and to "KDHS" on PDF p.193. No KDHS round gives 20.7% for Siaya (2014: 24.7%; 2022: 19.2%).
6. **KDHS reference windows differ**: 2014 maternal indicators use births in the 5 years before the survey; 2022 uses 2 years. The 2022 vaccination "national schedule" definition covers more antigens than 2014 "fully vaccinated". County samples are small (58 children for 2022 vaccination; 53 women for IPTp).
7. **Health workforce**: the CIDP prints sub-county ratios only (e.g. 1:170,952 doctors in Rarieda), with no staff counts or population base. No county total is derived.

## Gaps (also in `gaps[]`)
TB notifications (NTLD-P county rates are image-only charts), modelled TB incidence, survey malaria prevalence and routine malaria incidence (KHIS needs a login), survey-measured HIV prevalence (KENPHIA 2018 county table not retrieved), NSDCC estimate reports for 2020-2024, a county health-workforce count, the CHU baseline assessment, and PBIDS/HDSS data tables.

## Downloads (21 Nov 2026, untrusted, under /tmp/claude-0/library/)
HIV-EST-2015, HIV-EST-2018, NSDCC-POSTERS-2022, NSDCC-PROFILES-2026 (98.8 MB), NSDCC-SIAYA-PNG-2026 (cover image only, not used), NTLD-AR-2023, NTLD-AR-2022 (no Siaya values used), HDSS-PROFILE-2012-B (PMC HTML). SHA-256 for every file used is in `sources[]`. These files are not yet in `data/source-library.json` or `data/source-manifest.json`: this task could only create new files.
