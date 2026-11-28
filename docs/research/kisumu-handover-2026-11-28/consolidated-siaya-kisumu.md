# TAKWIMU KENYA \| Siaya (041) and Kisumu (042)

## Consolidated evidence acquisition and Claude AI execution handover

28 November 2026 • Research supplement • Not publication authorisation

### 1. Mandate and repository alignment

Complement Claude's research; do not redesign the platform, change hosting, introduce accounts, or merge/deploy. Repository main README, `lib/county-registry.js` and `docs/research/kisumu-2026-11-27/kisumu-coverage.md` reopened in this round. Baseline dated 27 November: Siaya 4,005 values across 16 datasets, Kisumu 331 values, 448 registered sources; 0 editorial approvals for either. Siaya 80 machine disagreements and 1,562 not checkable; Kisumu 5 and 53 respectively. Treat counts as baseline, not current live telemetry. Siaya remains published and provisional; Kisumu held. Preserve existing Siaya filenames and county registry. Re-read current branch before applying anything. Existing data contract, review gates, source hashes, correction logs and role-only privacy rules govern all imports. No Git actions taken.

### 2. New paired primary evidence: fisheries

Source F01: Kenya Fisheries Service, Fisheries Annual Statistics 2024, printed p.13, Table 3 (2013--23) and Figure 6 (2024). https://kefs.go.ke/sites/default/files/2025-07/Fisheries%20Annual%20Statistics%202024.pdf . Publisher PDF text inspected via web, PDF ordinal and SHA-256 still to establish. Metric tonnes of Lake Victoria landings, not aquaculture or all fisheries output. Stage rows below; deduplicate against Siaya agriculture data before importing.

  Year     Siaya   Kisumu   Combined (derived)
  ------ ------- -------- --------------------
  2013     24509     5550                30059
  2014     28385     5556                33941
  2015     29257     4354                33611
  2016     28255     4149                32404
  2017     36171     5004                41175
  2018     32084     4115                36199
  2019     25164     2013                27177
  2020     28273     1938                30211
  2021     30489     3932                34421
  2022     27906     3298                31204
  2023     24159     2715                26874
  2024     23890     3411                27301

2024 five-county total derived from Figure 6: 67,575 tonnes. Siaya share 35.35%; Kisumu 5.05%; combined 40.40%. Siaya YoY -1.11%; Kisumu 25.64%. Verify totals against full table and source vintage. Do not infer stock depletion or county residents' earnings from landings alone. Acquire KeFS annual reports 2013--23, KMFRI catch assessment, LVFO frame surveys, beach counts, species and ex-vessel values; distinguish landing location from capture location. KMFRI Kisumu research programme https://kmfri.go.ke/stations/kisumu (institutional description inspected; no numeric county outcomes).

### 3. New paired primary evidence: poverty

P01: KNBS Kenya Poverty Report 2022, overall individual poverty table preceding Figure 4.2, and Annex A1 (confirm exact PDF page before ingest). https://www.knbs.or.ke/wp-content/uploads/2024/10/The-Kenya-Poverty-Report-2022.pdf . Two tables in same report agree; not independent surveys.

  Indicator                   Siaya   Kisumu Unit
  ------------------------- ------- -------- -------------------
  Headcount                    38.3     39.0 \% individuals
  Headcount SE (Annex A1)      2.27     2.42 percentage points
  Gap                           9.7      7.4 \%
  Severity                      3.6      2.1 \%
  Survey population            1062     1226 thousands
  Poor population               407      478 thousands

Point estimates are close; do not rank as statistically different without design-based inference. Siaya's gap and severity point estimates are higher. Combined headcount using published rounded counts is 885/2288 = 38.68% (derived approximation, not official pooled estimate). Reconcile county estimates with poverty mapping, adult/child/food/hardcore definitions, 2015/16 KIHBS and 2021/2022 KCHS. Do not apply 2022 estimates to 2026 populations.

### 4. Household and health evidence

D01: KNBS KDHS 2022 Siaya factsheet https://www.knbs.or.ke/wp-content/uploads/2023/08/Kenya-Demographic-and-Health-Survey-2022-Factsheet-Siaya.pdf ; D02 index https://www.knbs.or.ke/reports/kdhs-2022/ . D03 alternative Siaya factsheet host https://new.knbs.or.ke/wp-content/uploads/2023/08/Kenya-Demographic-and-Health-Survey-2022-Factsheet-Siaya.pdf (same survey, not independent). Siaya values below directly inspected; Kisumu water, sanitation, fuels and teenage pregnancy are carried from preceding research, re-open Kisumu sheet before ingestion; fertility and modern FP checked against D03 comparative tables.

  Indicator                                             Siaya   Kisumu   Kenya
  --------------------------------------------------- ------- -------- -------
  Basic drinking water (% household population)            49       72      68
  Basic sanitation (% household population)                35       35      41
  Clean fuels/technologies (% household population)         6       15      21
  Ever pregnant (% women 15--19)                           21       11      15
  Total fertility (births per woman)                      4.0      3.5     3.4
  Modern FP (% married women 15--49)                       43       57      57
  Unmet FP need (% married women 15--49)                   27      ---      14
  Demand satisfied by modern methods (%)                   60      ---      75
  Skilled delivery (%)                                     95      ---      89
  4+ ANC visits (%)                                        65      ---      66
  Maternal postnatal check within 2 days (%)               86      ---      78
  Birth postnatal check within 2 days (%)                  86      ---      83
  Basic antigen vaccination 12--23 months (%)              88      ---      80
  Neonatal mortality per 1000 live births                  24      ---      21

Dashes are not extracted, not zero. Keep full footnotes, reference periods and uncertainty. Drinking water gap 23 percentage points; teenage pregnancy gap 10 points, descriptive only. Acquire county-level HIV estimates by vintage (NSDCC county profiles 2026 already held per repo), malaria survey and facility data, TB notification rates, workforce and facility master list. Never disclose individual patients. KEMRI Asembo and Kombewa cohorts are study catchments, not county prevalence.

### 5. Economy and crop evidence (secondary, primary tables pending)

Strathmore SAFIC AgriIntel profiles https://www.saficai.strathmore.edu/counties/siaya and https://www.saficai.strathmore.edu/counties/kisumu inspected. Underlying sources: KNBS GCP 2025 Table 8 and Annex I; AFA Yearbook 2025 and KNBS National Agriculture Production Report 2025. Both profiles reproduce same official statistical system; no independent confirmation.

  2024 measure                                        Siaya   Kisumu
  ------------------------------------------------- ------- --------
  GCP current KES billion, provisional                163.9    370.9
  Agriculture/forestry/fishing value added KES bn      67.7     58.9
  Sector share %                                       41.3     15.9
  Projected population million (rounded)               1.08     1.27

Siaya maize 143,979 t; sweet potato 78,852 t; cassava 75,840 t. Kisumu maize 58,657 t; rice 63,002 t; sugar 91,190 t (processed sugar, confirm definition; not cane). Retrieve original tables and exact population, constant-price GCP and revision history before calculating per-capita values or real growth. GCP is not household income. No causal claim linking economic structure to poverty.

### 6. Regional water and infrastructure project leads

W01 https://www.lvswwda.go.ke/ongoing-projects/ : agency lists Siaya/Bondo last-mile connectivity (KES 200m announced programme), Ugunja/Ukwala/Sega water and sanitation, and Kisumu LVWATSAN. W02 https://www.gaa.go.ke/sh48-billion-plan-enhance-water-connectivity-lake-region : government news describes KES 48bn eight-county strategic plan and regional water target 58% to 70%, sewerage 27% to 40% by 2027. Not allocations to either county and not actual outcomes. Acquire strategic plan, funding agreements, procurement notices, contract revisions, progress and completion certificates, WASREB utility performance and household surveys. Do not sum commitments across umbrella projects and child contracts. W03 https://wasreb.go.ke/wp-content/uploads/2026/06/Impact-18-Report.pdf (previous round, reread Table 4.1 for both utilities). Distinguish utility service area, low-income area, household access and countywide coverage.

### 7. Specific historical gap queue from repository

CoB FY2019/20 annual report remains a manual retrieval priority for both counties: https://cob.go.ke/download/county-governments-budget-implementation-review-report-for-the-fy-2019-20/ . Do not substitute Senate review for original full-year series. Kisumu FY2015/16 scan pp.141--147; CBROP 2016/17 and CFSP 2014--16; approved FY2014/15 budget; FY2022/23 annual BIRR; adopted ADP FY2026/27 (draft held, final previously returned invalid bytes). OAG early Executive/Assembly opinions use PBO compilation as secondary, seek originals; 2017/18 URLs in coverage register. Prioritise 121 link-only Parliament reports by entity and materiality rather than downloading 6.7GB indiscriminately. For Siaya, reconcile 164 ledger discrepancies (78 open per README) and 53 conflict records; Kisumu 38 conflicts. Separate total OSR, ordinary OSR, FIF/A-i-A, receipts, expenditure and balances. No silent selection of disputed values. Retrieve county-side FY2025/26 actuals and compare to CoB same period and version. Use existing corrections log for changed observations.

### 8. Ward-level and civic evidence

Siaya ADP 2025/26 participation announcement https://siaya.go.ke/citizen-participation-report-on-the-siaya-county-annual-development-plan-adp-2025-2026/ confirms forums across 30 wards and submission to Assembly. Retrieve actual report and map submissions to adopted budget lines, procurement and delivered outputs; participation does not prove adoption. County CFSP 2026 notice https://siaya.go.ke/?p=28657 provides ward meeting schedule. County homepage https://siaya.go.ke/ links official YouTube and reports Sidindi ward CFSP 2027/28 engagement. This is discovery of official channel, not verified individual posts. Kisumu Assembly https://kisumuassembly.go.ke/?page_id=1204 prior acquisition lead. Confirm all ward codes from official boundaries and retain geographic version. No allocation to wards from county totals by population unless explicitly labelled modelled and approved; no personal names in participation annexes.

### 9. Execution contract for Claude

1.  Snapshot current branch and inventory existing observation IDs, source IDs, conflicts, and all previous handovers below. Diff by source hash and logical indicator key; no duplicate values.
2.  Acquire publisher PDFs using normal access; if blocked, log HTTP status, date and alternative institutional mirror; do not bypass challenges or disable certificate checks. Check magic bytes, size, page count and SHA-256. Record publication date separately from retrieval and period.
3.  Stage F01 and P01 paired rows, D01/D03 observations and candidate E01/W01 leads. Map to existing schemas, preserving Siaya layout and Kisumu held directory. Set actual PDF page only after retrieval; if not located follow contract null plus page_note. Do not invent source IDs or hashes.
4.  Check table title, row, column, units, denominator, geography and notes. Independent reading is machine check, not approval. Preserve conflicting values and explicit hypotheses. Run existing review pack generator and human review queue.
5.  Add new domain observations only where existing contract permits; if schema change necessary make minimal additive proposal. No database or service migration. Keep personal data out of repository and public artifacts.
6.  Update per-county coverage register with statuses held/link-only/manual/not found; for each requested gap record query, source, reason, next action and owner. A source lead is not an observation.
7.  Validate `npm run validate`, `npm run build`, `npm run typecheck`, `npm run test:reviews`, `npm run test:reports`, existing smoke/axe/crawl/overflow and reproducibility gates where applicable. Do not claim any passed until run. Preserve unpublished county protections. No deployment or approval by this handover.

### 10. Expanded coverage matrix and acquisition instructions

Each row is an assigned research question, not a claim a document is held. Acquire both counties unless specified. Search 2013--2026, prioritising newest complete periods and source vintages; record gaps even when unavailable.

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Domain                  Source leads                                                     Extraction and reconciliation
  ----------------------- ---------------------------------------------------------------- -----------------------------------------------------------------------------------------------------
  Demography              KNBS census 2009/2019, projections, CSA                          Age/sex, households, density, migration, disability; administrative vs electoral boundaries

  Poverty                 KNBS KIHBS/KCHS, poverty mapping, UNICEF                         Individual vs household headcount, SE, poverty lines and prices

  Fiscal                  CoB, county Treasury, CRA, National Treasury                     Approved vs revised budget, receipts, releases, actuals, pending bills by entity

  Audit                   OAG, Parliament CPAC, PBO, NTA                                   Opinion and findings by audited entity/year, management response and follow-up

  Procurement             PPRA, PPIP, county tender and award registers                    Contract ID, scope, award amount, variation and delivery; exclude personal identifiers

  Health                  MoH, NSDCC, KEMRI, county health plans                           HIV prevalence vs incidence, malaria tests vs cases, TB notifications, staffing, facility readiness

  Education               MoE, KNEC, KNBS, county ECDE/VTC                                 Enrolment by level/sex, teachers, completion, bursaries; avoid school-level private pupil data

  Social protection       Social Protection Secretariat, UNICEF, WFP                       Beneficiary households vs people, programme periods, actual transfers

  Gender/youth            NGEC, UNFPA, UN Women, KDHS                                      Age denominator, violence survey estimates, participation, employment

  Agriculture             AFA, KALRO, NIA, KAMIS                                           Area planted/harvested, tonnes, yield, farmgate prices, rice/cane/maize, livestock

  Fisheries               KeFS, KMFRI, LVFO                                                Landings, species, value, effort, cages, aquaculture; no pooled lake values assigned to county

  Industry/labour         KNBS GCP, KIPPRA, EPZA                                           Current/constant prices, employment definitions, business permits vs establishments

  Transport               KAA, KCAA, KPA, Kenya Railways, KeRRA                            Kisumu airport passengers/cargo, port throughput, roads by class, planned vs completed

  Energy/digital          EPRA, REREC, CA, census                                          Connections vs households served, coverage vs adoption, tariff definitions

  Water                   WASREB, KIWASCO, SIWASCO, LVSWWDA, WRA                           Service geography, NRW, sewerage, tariff targets vs actual, water quality

  Climate                 KMD, FLLoCA, county PCRA, Red Cross                              Flood/drought event, affected persons vs households, hazard model vs observed impacts

  Environment             NEMA, KFS, KMFRI, WRA                                            Forest/tree cover definitions, pollution sampling site/date, wetland protection

  Housing/urban           KISIP, KUSP, county municipalities                               Settlement and city boundaries, tenure, drainage, housing, project outputs

  Tourism/culture         TRI, NMK, county tourism departments                             Visitor counts vs admissions, attraction and accommodation activity

  Justice/safety          Judiciary annual reports, NPS, KNBS                              Court station jurisdiction, reported crimes vs prevalence; avoid personal allegations

  Governance              Assembly, IBP, APRM, KHRC                                        Budget transparency survey vintage, participation and implementation tracking

  Development partners    DPMIS, IATI, World Bank, AfDB, AFD, UNICEF, UNDP                 Project ID, geographic scope, commitment/disbursement/expenditure, unique vs repeat beneficiaries

  Academia                Maseno, JOOUST, KEMRI, KMFRI, Crossref, OpenAlex, PubMed, AJOL   DOI, sample, dates, geography, methods, limitations, full text licence

  Social media            Official county/assembly/agency/NGO channels and local news      Public post URL, timestamp, claim, documentary corroboration; no personal data
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### 11. Academic and public-channel acquisition protocol

Search both county names and localities, e.g. Asembo, Bondo, Yala, Ugunja, Rarieda, Nyando, Ahero, Kombewa, Nyalenda and Obunga. Query combinations with malaria, HIV, maternal health, fisheries, irrigation, flood, sanitation, school, livelihoods and accountability. Deduplicate DOI and preprint/version; extract study year rather than publication year as observation period. Check primary data and statistical methods, sample and confidence intervals; no extrapolation of local cohorts. For Facebook, X, YouTube, LinkedIn, Instagram and TikTok start from links on official domains; search account plus locality plus project. Record original post URL, date, claim, publisher identity, correction and supporting official document. Duplicate reposts count once. Public videos: record timestamp and transcript excerpt, no unverified visual inference of project completion. Access-limited posts remain leads. This round did not verify individual posts or conduct full academic searches; use the prior registers below as leads, not completed coverage.

### 12. Completion gates and limitations

Deliver a source delta register, staged observations, conflict deltas, gap manifest, review packs and test transcript. Each domain for each county must be marked complete for a defined period, partial, not available, or blocked; never equate source count with completeness. Primary PDF text for fisheries, poverty and Siaya KDHS was inspected; no byte hashes or independent page-image checks were performed here. Other current sources are secondary or programme announcements, and earlier handover claims require rechecking before reuse. No actual data import, code changes or live deployment verification. Research coverage is not exhaustive. The appendices are previous handovers, preserved for continuity and explicitly superseded by the latest repo state and evidence above where inconsistent. Their proposed architectural/commercial changes are NOT assignments for this research-only sprint. Prior claims are not newly verified by inclusion.

------------------------------------------------------------------------

## Historical appendix: TAKWIMU_SIAYA_DEEP_RESEARCH_WORKFLOW.md

# TAKWIMU KENYA --- SIAYA COUNTY RESEARCH PROGRAMME

**Research design and verified discovery register \| 21 November 2026**

## Mandate

Build a reproducible, source-linked, continuously maintainable evidence base for Siaya County across public finance, governance, economic development, health, education, livelihoods, climate, infrastructure and public participation. This is a *research workflow and initial verified source discovery*, not a claim that all underlying reports have been downloaded, extracted, or independently validated.

## 1. Non-negotiable research standards

1.  Record exact document title, issuing body, original URL, publication date, reference period, geographic coverage, licence, document hash, download date and access status.
2.  Separate source publication from extracted factual claim. Every quantitative observation requires page/table reference, units, denominator, methodology, collection date and quality flag.
3.  Rank sources by relevance and directness, not merely institutional prestige. Primary official records are preferred for administrative totals; independent audits and studies are preferred for independent verification. Preserve contradictions.
4.  Distinguish Siaya-specific results from national, regional, multi-county or intervention-site findings. Never silently allocate pooled NGO impact results to Siaya.
5.  Maintain original fiscal-year notation (e.g. FY 2024/25), survey reference year, geography (county/sub-county/ward/facility) and version.
6.  No unsupported claims of causality, completion, corruption, fraud or legal wrongdoing. Audit findings are findings, not convictions.
7.  Licence-check all PDFs, figures, tables and maps before redistribution or commercial reuse. Link and cite restricted works; do not republish without permission.
8.  Include correction and dispute workflows, a public methodology page, and dated editorial review.

## 2. Priority verified source register

Each entry below is a *discovered source*, not necessarily an extracted dataset.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  ID          Publisher / source                        Document / collection                                                       Siaya relevance                                          Research use                                                        URL
  ----------- ----------------------------------------- --------------------------------------------------------------------------- -------------------------------------------------------- ------------------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------
  GOV-01      Siaya County Government                   County Integrated Development Plan 2023--2027                               Direct                                                   Development baseline, sector targets, projects, indicators          https://siaya.go.ke/documents/county-integrated-development-plan-siaya-county-2023-2027/

  GOV-02      Siaya County Government                   County Budget Implementation Review Report collection (through FY2025/26)   Direct                                                   Quarterly/annual budget execution                                   https://siaya.go.ke/document-category/county-budget-implementation-review-report/

  GOV-03      Siaya County Government                   County Budget Review and Outlook Paper FY2024/25                            Direct                                                   Revenue, expenditure, outlook and fiscal assumptions                https://siaya.go.ke/siaya/download/county-budget-review-and-outlook-paper-for-fy-2024_2025/

  GOV-04      Siaya County Government                   ADP FY2025/26 citizen participation report                                  Direct                                                   Ward submissions and government responses                           https://siaya.go.ke/citizen-participation-report-on-the-siaya-county-annual-development-plan-adp-2025-2026/

  GOV-05      Siaya County Government                   CFSP 2026 public participation notice                                       Direct                                                   Ward consultation schedule, process baseline                        https://siaya.go.ke/?p=28657

  COB-01      Controller of Budget                      Consolidated County Budget Implementation Reviews, FY2021/22--FY2025/26     Siaya section within national reports                    Independent fiscal monitoring                                       https://cob.go.ke/reports/consolidated-county-budget-implementation-review-reports/

  OAG-01      Auditor-General                           County Executive and Assembly audit reports FY2024/25                       Siaya section or separate report                         Qualified opinions, audit findings, management responses            https://www.oagkenya.go.ke/2024-2025-county-government-audit-reports/

  OAG-02      Auditor-General                           County Executives and Assemblies archive FY2016/17 onward                   Direct/compilation                                       Historical finding recurrence                                       https://www.oagkenya.go.ke/county-executives-assemblies-reports/

  KNBS-01     KNBS                                      Gross County Product 2025 (2020--2024 estimates)                            Siaya observations within all-county series              County economy, sector structure, growth                            https://repository.knbs.or.ke/entities/publication/7b86f948-dc7c-4862-952a-a18169e6d136

  KNBS-02     KNBS                                      Gross County Product 2024 (2019--2023)                                      Siaya observations within all-county series              Revisions and time-series comparison                                https://repository.knbs.or.ke/entities/publication/8eb93ffa-014f-4e8f-8ff2-a1c1d6d4187f

  KNBS-03     KNBS                                      County Statistical Abstracts portal                                         Check Siaya availability                                 Demographic, service and administrative series                      https://www.knbs.or.ke/county-statistical-abstracts/

  IBP-01      International Budget Partnership Kenya    County Budget Transparency Survey 2022 --- Siaya                            Direct                                                   Budget availability, comprehensiveness, public participation        https://internationalbudget.org/wp-content/uploads/Siaya-County.pdf

  IBP-02      International Budget Partnership Kenya    County Budget Transparency Survey 2021 --- Siaya                            Direct                                                   Longitudinal transparency baseline                                  https://internationalbudget.org/wp-content/uploads/CBTS-2021-County-Summaries-FINAL.pdf

  APRM-01     NEPAD/APRM Kenya                          Siaya County Review Report 2024                                             Direct                                                   Governance, public participation, civic education                   https://nepadaprmkenya.go.ke/wp-content/uploads/2025/07/Siaya-County-Review-Report-2024-Final.pdf

  CLIM-01     Kenya Climate Finance / county partners   Siaya Participatory Climate Risk Assessment                                 Direct                                                   Ward hazards, climate vulnerability, hotspots                       https://climatefinanceken.go.ke/sites/default/files/2025-05/Siaya%20County%20PCRA%20Report%20%28revised%20nakuru%29%20FINAL.pdf

  CLIM-02     Siaya County Government                   FY2025/26 climate financing analysis discussion                             Direct but secondary summary                             Trace climate allocations to original analysis                      https://siaya.go.ke/siaya/siaya-strengthens-climate-governance-and-financing-through-q3-consultative-meeting/

  HEALTH-01   Siaya County Government                   Syndemic Operational Plan announcement May 2026                             Direct secondary account                                 HIV, TB, malaria and NCD planning; obtain original COP              https://siaya.go.ke/?p=29820

  HEALTH-02   Siaya County Government / Lwala           Community health baseline assessment September 2026                         Direct secondary account                                 CHU and committee functionality; request underlying study           https://siaya.go.ke/siaya/siaya-moves-to-strengthen-community-health-system-after-baseline-assessment/

  HEALTH-03   KEMRI/CDC                                 Population-Based Infectious Disease Surveillance, Asembo                    Siaya sentinel site                                      Infectious disease surveillance, research outputs                   https://pbids.kemri.go.ke/

  HEALTH-04   MESA/KEMRI/LSTM                           Routine health facility malaria surveillance, Siaya                         Direct, historic                                         Malaria surveillance methodology and archived studies               https://mesamalaria.org/mesa-track/routine-health-facility-surveillance-siaya-county-western-kenya/

  NGO-01      Lwala Community Alliance                  Annual Report 2024                                                          Multi-county, do not attribute pooled results to Siaya   NGO methodology, potential partnerships, contextual interventions   https://lwala.org/2024-annual-report-2/

  NGO-02      Lwala Community Alliance                  Annual Report 2025                                                          Multi-county, do not attribute pooled results to Siaya   Cross-county programme lessons; Siaya linkage separately verified   https://lwala.org/2025-annual-report/

  NGO-03      Kenya Red Cross                           Floods Operations 2024                                                      National/Lake Victoria region                            Obtain county-specific situation reports and response data          https://redcross.or.ke/floods/

  UN-01       UNICEF Kenya                              Child Sensitive Snapshot (Dec 2025)                                         National; extract Siaya only if present                  Child poverty and county-specific comparisons                       https://www.unicef.org/kenya/reports/child-sensitive-snapshot

  UN-02       UNICEF/KNBS/UN Women                      Brighter Futures (Aug 2025)                                                 National with potential county tables                    Multidimensional child vulnerability                                https://www.unicef.org/kenya/reports/brighter-futures

  UN-03       UNICEF Kenya                              Situation of Adolescents 2024                                               National with possible county disaggregation             Adolescent health, education, livelihoods                           https://www.unicef.org/kenya/reports/situation-adolescents-kenya-2024

  MEDIA-01    Kenya News Agency                         Siaya disputes FY2024/25 OSR comparison                                     Direct, secondary reporting                              Revenue reconciliation lead, not final adjudication                 https://www.kenyanews.go.ke/county-government-refutes-claims-of-revenue-under-performance/
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 3. Priority research questions and extraction matrices

### A. Fiscal performance and accountability

Collect FY2013/14 onward (where available): approved/revised budgets, equitable share, conditional grants, own-source revenue by stream, facility improvement financing, cash transfers, recurrent/development actuals, pending bills opening/closing balances, wage bill, commitments, audit opinions, procurement awards, project completion, public participation. Preserve executive and assembly separately. Triangulate County Government ↔ Controller of Budget ↔ Auditor-General ↔ IBP. Produce fiscal reconciliation ledger and audit-findings tracker.

### B. Economy and livelihoods

Collect KNBS GCP by year/sector; agriculture output and yields; rice, sugarcane, cassava, cotton; fisheries landings and prices; informal businesses, markets, labour, household poverty, access to finance, tourism, trade and electricity. Document inflation adjustment and revisions. Avoid implying county output equals county government revenue.

### C. Health

Collect HIV incidence/prevalence, ART coverage, viral suppression, TB incidence, malaria prevalence and case incidence, maternal mortality, skilled delivery, immunisation, nutrition, staffing, medicine stockouts, community health unit functionality, health financing. Specify age group, test methodology, geographic population and survey year. KEMRI sentinel surveillance must not be presented as county-representative without evidence.

### D. Education and human development

Collect ECDE enrolment/centres/teacher ratios, TVET participation, school transitions, KCSE outcomes (where permissible and comparable), bursaries, youth unemployment, gender, disability, poverty and social protection. Separate national education ministry responsibilities from devolved ECDE and vocational training functions.

### E. Climate, water, environment and disaster resilience

Extract PCRA hazards by ward, flood and drought hotspots, water and sanitation access, lake ecosystem risks, climate adaptation financing, disaster losses and response. Differentiate climate-tagged budget allocations from actual expenditure and realised resilience outcomes.

### F. Infrastructure and public services

Road inventory and condition, health facilities, markets, water schemes, irrigation, electrification, digital access, land administration, urban services, procurement and project status. Track named project with stable ID and physical verification status.

### G. Civil society and NGO ecosystem

Build organisation registry: NGO/CSO name, registered status where verifiable, sector, Siaya wards, intervention dates, funder, programme objectives, reported expenditure, beneficiaries, independent evaluation, outputs, outcomes, data availability and reporting contact. Do not mistake organisation-wide impact for Siaya-specific impact. Search programme partners of county health, climate, education, agriculture and governance initiatives; pursue unpublished reports through direct requests.

## 4. Research workflow: 8 stages

**Stage 0 --- Scope and inventory:** Create document universe for 2013--2026, with focus on 2023--2026 and ward coverage. Establish controlled vocabulary and canonical Siaya administrative geography.

**Stage 1 --- Discovery:** Search county site, County Assembly, CoB, OAG, KNBS, Treasury, MoH, KEMRI, IBP, APRM, UNICEF, World Bank, AfDB, UNDP, FAO, WHO, Red Cross, NGO portals and academic repositories. Record discovered, requested, downloaded and inaccessible separately.

**Stage 2 --- Acquisition:** Download primary PDF/XLS/CSV files where legally accessible; capture provenance and SHA-256; preserve originals; maintain licence/redistribution flags; record failed requests.

**Stage 3 --- Extraction:** Parse tables with page anchors, preserve scanned-image page references, normalize currency and units, store original strings and normalized values. Use manual QA for complex tables; do not silently infer missing values.

**Stage 4 --- Reconciliation:** Compare overlapping official series and independent studies; create discrepancy cases. Example: FY2024/25 own-source revenue claimed as KES 946,893,440.40 by county official vs approximately 47% performance reported by CoB according to Kenya News Agency. Investigate exact numerator, denominator, facility financing and period before choosing canonical measure.

**Stage 5 --- Triangulation:** For material findings, require at least two independent source pathways where available. Do not treat multiple reports copying one dataset as independent corroboration.

**Stage 6 --- Analysis:** Build sector briefs with trends, county comparisons, ward equity, implementation bottlenecks, costs and outcomes. Include data caveats and alternative interpretations.

**Stage 7 --- Editorial and expert review:** Domain reviewer signs off high-stakes indicators; verify legal, health, financial and statistical claims; publish corrections log and source snapshot.

**Stage 8 --- Release and monitoring:** Publish open baseline dashboards and paid analytical workspaces; set source-specific update cadences, broken-link checks, versioning, and change alerts.

## 5. Immediate source-specific research leads

-   **Revenue:** County official publicly contested CoB's FY2024/25 interpretation. Obtain CoB source table, Siaya signed financial statements, OSR bank reconciliation, facility improvement fund treatment and approved revenue targets before calculating performance.
-   **Community health:** September 2026 county summary says baseline assessed 210 of 221 CHUs and only 7.6% of community health committees were fully functional. Request original Lwala/county assessment, definitions, sampling and ward breakdown.
-   **Disease burden:** May 2026 county article cites HIV 9.8% (2023), malaria 24%, TB incidence 363 per 100,000. Obtain original epidemiological datasets; do not conflate with older PCRA report citing different historical estimates.
-   **Climate budgets:** County news summary reports water/environment allocation KES 710.8m FY2024/25 vs KES 858.1m FY2025/26, public works KES 549.5m FY2025/26 and agriculture KES 364.5m to 474.2m. Retrieve underlying climate budget analysis and clarify whether figures are sector totals or climate-tagged expenditure.
-   **Transparency:** IBP's 2021 Siaya summary recorded 7/10 documents published and 45/100 transparency score. Reassess latest document availability rather than carrying historical scores forward.
-   **Participation:** APRM 2024 review identifies low turnout, civic education and feedback gaps; compare with the county's published FY2025/26 participation report, and code whether public proposals changed final allocations.

## 6. Data architecture for Claude Code

Tables: `sources`, `documents`, `document_versions`, `geographies`, `organisations`, `programmes`, `projects`, `indicators`, `observations`, `source_claims`, `discrepancies`, `audit_findings`, `public_participation_submissions`, `reviews`, `licences`, `update_jobs`.

Observation schema: `indicator_id`, `geography_id`, `period_start`, `period_end`, `period_type`, `value`, `unit`, `denominator`, `population`, `measurement_method`, `source_document_id`, `page`, `table`, `original_text`, `revision_status`, `verification_status`, `published_at`, `extracted_at`, `reviewed_at`.

Document schema: `document_id`, `title`, `publisher`, `document_type`, `publication_date`, `reference_period`, `source_url`, `sha256`, `licence`, `redistribution_allowed`, `geographic_coverage`, `retrieval_status`, `review_status`, `last_checked_at`.

Discrepancy schema: `case_id`, `indicator_id`, `period`, `claim_a`, `claim_b`, `source_a`, `source_b`, `difference`, `possible_basis_mismatch`, `status`, `resolution`, `reviewer`, `reviewed_at`.

## 7. Deliverables

1.  Searchable Siaya Source Library with ≥100 source records as an *initial target*, not a claimed achieved count.
2.  County Profile: demographics, economy, poverty, governance, finance, health, education, infrastructure, climate and livelihoods.
3.  FY2013--FY2026 fiscal series with completeness and reconciliation matrix.
4.  30-ward indicator inventory with explicit coverage and missingness.
5.  NGO/CSO partner map and evidence register.
6.  Source-linked quarterly County Evidence Brief, with human editorial review.
7.  Public methodology, dataset licences, corrections and provenance pages.
8.  Premium institutional products: custom sector due diligence, monitoring alerts, research exports and commissioned evidence briefs; no paywall on source citations or essential public-interest facts.

## 8. Claude Code acceptance tests

-   Every published numeric claim resolves to a source document and page/table or machine-readable data series.
-   No pooled national/multi-county NGO result is labelled Siaya-specific without supporting disaggregation.
-   Reconciliation conflicts are visibly labelled and no contested metric is silently overwritten.
-   No missing value is coerced to zero; no future projection is labelled actual.
-   County/ward names and boundary versions validate against a canonical geography registry.
-   Financial series preserve fiscal-year and budget-version semantics.
-   PDF exports include source appendix, date, units, limitations, and reproducible calculation IDs.
-   Data updates trigger automated regression tests and human review for material changes.
-   Commercial redistribution complies with the licence of each underlying source.

## 9. Proposed research sprint schedule

**Weeks 1--2:** Full source discovery, download, document register, fiscal and KNBS baseline. **Weeks 3--4:** Audit and budget reconciliation, county governance and IBP/APRM review. **Weeks 5--6:** Health, education, social protection and NGO programme mapping. **Weeks 7--8:** Climate, fisheries, agriculture, infrastructure, ward geography and development projects. **Weeks 9--10:** Triangulation, domain reviews, county evidence reports and first institutional pilot.

## 10. Research gaps requiring further investigation

County Assembly committee reports; county public accounts committee follow-up; sector-specific annual reports; facility-level DHIS2 access; ward-level project lists; NGO partner evaluation datasets; donor grant expenditure by ward; public procurement contracts; actual project completion evidence; latest county poverty estimates; fisheries landing series; Siaya statistical abstract availability; updated budget transparency survey; verified county water-quality and sanitation series. Absence from this register does not mean the source does not exist.

------------------------------------------------------------------------

## Historical appendix: TAKWIMU_KISUMU_COMPLEMENTARY_EVIDENCE_HANDOVER.md

# TAKWIMU KENYA --- Kisumu complementary evidence acquisition handover

**28 November 2026 \| Research transfer to Claude AI \| County 042**

## 1. Mandate and integration boundaries

This is an incremental research delivery, not a redesign, code audit or replacement for Claude's work. Preserve the existing static Next.js/Netlify architecture, county registry, published Siaya files, source manifest, review packs and publication safeguards. No Git actions or publication performed. Reconcile against current HEAD before importing. Repository baseline: https://github.com/PapaDanico/Takwimu/blob/main/README.md ; https://github.com/PapaDanico/Takwimu/blob/main/docs/data-contract.md ; https://github.com/PapaDanico/Takwimu/blob/main/docs/research/kisumu-2026-11-27/kisumu-coverage.md ; https://github.com/PapaDanico/Takwimu/blob/main/docs/research/kisumu-2026-11-27/kisumu-sources.json . The documented baseline is 448 registered source records, 331 held observations, 38 conflicts, zero editorial approvals. Counts are repository-reported, not a fresh full-tree count. The source register is already extensive: deduplicate before adding any source below.

## 2. Evidence status and import protocol

A = primary publisher table/figure retrieved as web text in this run; B = publisher narrative or secondary reproduction retrieved; C = acquisition lead, not an extracted observation. None is human editorial approval or page-image verification. For A records recover original PDF bytes, hash SHA-256, identify PDF page (not printed page), store original row/column/table and read method; reuse manifest IDs where already present. For B record as claim/context, not approved observation. For C obtain document first. Do not invent pages, hashes, publication dates, licence rights or missing values. Distinguish year of data, vintage, release date and retrieval date. Keep all new records held until county release policy permits. Do not add synthetic review decisions. Use existing schemas or minimal compatible extensions with validations. Source copies with identical content are not independent corroboration.

## 3. Primary fisheries data packet (A)

KeFS, Fisheries Annual Statistics 2024, Table 3 and Figure 6, printed p.13 (confirm PDF offset): https://kefs.go.ke/sites/default/files/2025-07/Fisheries%20Annual%20Statistics%202024.pdf . Units: metric tonnes, calendar year, Lake Victoria fish landings assigned to riparian county. Exact source transcription, 2024 from figure 6; check final table continuation.

  Year     Kisumu   Siaya   Homa Bay   Busia   Migori
  ------ -------- ------- ---------- ------- --------
  2013       5550   24509      80150    5079     9400
  2014       5556   28385      81399    5468     7899
  2015       4354   29257      66598    4515     5178
  2016       4149   28255      54540    4670     6553
  2017       5004   36171      42532    7010     2003
  2018       4115   32084      53989    4878     3082
  2019       2013   25164      55523    5004     3036
  2020       1938   28273      52375    3216     2422
  2021       3932   30489      53347    3434     3144
  2022       3298   27906      50053    2491     2646
  2023       2715   24159      39155    2171     2053
  2024       3411   23890      34797    2893     2584

Derived Kisumu 2024 change = (3411/2715-1)\*100 = 25.64%; 2013--24 = -38.54%. 2024 five-county sum 67,575 t; Kisumu 5.05% (source rounded 5.0%). Do not infer fish stock biomass or county residence of fishers. Check table totals for rounding differences, retain original. Cross-source discrepancy candidate: KNBS Economic Survey 2024 table 8.5(a), https://www.knbs.or.ke/wp-content/uploads/2024/05/2024-Economic-Survey.pdf , Lake Victoria aggregate 2019--23 = 90,743; 88,223; 94,349; 86,394; 70,313 t (2023 provisional). KeFS 2024 vintage table totals = 92,759; 90,244; 96,367; 88,416; 72,276. Differences 2,016; 2,021; 2,018; 2,022; 1,963 t. Verify whether scope or revision explains before classifying. Never treat lake-wide aggregate as county data.

Follow through: https://www.kmfri.go.ke/stations/kisumu and https://kmfri.go.ke/research/technical-reports (B/catalogue): obtain 2022 Frame Survey, 2023 CAS, aquaculture production reports; extract effort, species, landing sites, boats, gear, BMUs, farm systems, fish value, source sampling dates. Crosscheck Lake Victoria Fisheries Organization regional frame surveys; separate Kenya waters from whole lake. Exclude prototype vendor domains masquerading as KMFRI, including prototypes.chemuagencies.com, from trusted sources. Do not ingest unverified DOI or dataset identifiers from prototypes.

## 4. Poverty packet (A)

KNBS Kenya Poverty Report 2022 https://www.knbs.or.ke/wp-content/uploads/2024/10/The-Kenya-Poverty-Report-2022.pdf ; table 4.3 food, 4.4 overall, 4.5 hardcore. County row, persons not households. Table column order: headcount %, distribution of poor %, gap %, severity %, population thousands, poor thousands.

  -------------------------------------------------------------------------------------------
  Type         Headcount   Distribution        Gap   Severity   Population (000)   Poor (000)
  ---------- ----------- -------------- ---------- ---------- ------------------ ------------
  Food              31.5            2.4        5.9        2.0               1226          386

  Overall           39.0            2.4        7.4        2.1               1226          478

  Hardcore           3.1            1.1        0.4        0.1               1226           39
  -------------------------------------------------------------------------------------------

National overall 39.8%; Kisumu difference -0.8 percentage points, not evidence of statistically significant difference. Printed counts and rates are rounded independently; never overwrite 39 thousand with 38 thousand calculated from rounded rate. Crosscheck: Adaptation Fund concept note annex 5 https://www.adaptation-fund.org/wp-content/uploads/2025/10/Adaptation_Fund_LLA_Concept-Note\_-Final_30.06.2025_Updated.pdf reproduces 39.0%; same upstream survey. Repo already records 2015/16 33.9%, 2021 36.3%; recover original reports before trend release, include confidence intervals and poverty line methodology. New lead: Mapping Poverty Report in Kenya, unofficial copy https://fliphtml5.com/pqhnt/Mapping-Poverty-Report-in-Kenya/148/ printed p.130 claims Seme 59.7%, Muhoroni 26.0% and 445k county poor. Quarantine pending official KNBS release, methodology and denominator verification; do not combine 445k with KCHS 478k. Seek small-area estimation methods, census base, reference year, model errors and boundary crosswalk. Not direct ward survey estimates.

## 5. Health and social statistics packet (A)

KNBS KDHS 2022 Kisumu factsheet https://www.knbs.or.ke/wp-content/uploads/2023/07/2022-Kenya-DHS-Factsheet-Kisumu.pdf ; parent https://www.knbs.or.ke/reports/kdhs-2022/ . County/national: basic water 72/68%; basic sanitation 35/41%; clean fuels/technologies for cooking, heating and lighting 15/21%; women 15--49 no formal education 1/6%; men 15--49 no formal education \<1/3%; fertility 3.5/3.4 children per woman; ever pregnant age 15--19 11/15%. Preserve '\<1' as bounded published value, not zero or one; obtain exact estimates and CI from main report before comparisons. Household population denominator for WASH and fuel indicators; no ward estimates from county sample. Extract remaining factsheet and main tables (ANC, delivery, immunisation, nutrition, violence, contraception); record age group, survey sample and reference period. NSDCC county profiles 2026 and county posters 2022 held by repo; extract HIV prevalence, incidence, ART coverage, suppression with denominators. NTLD reports and Kenya malaria indicator survey: obtain Kisumu rows only; KHIS not public, request aggregate official extracts rather than patient data. Facility master list: unique facility code, ownership, level, operational status, location; verify current list against historical snapshots. JOOTRH referral catchment is not county resident incidence.

## 6. Water and sanitation evidence packet (A/B)

WASREB IMPACT 18 FY2024/25 https://wasreb.go.ke/wp-content/uploads/2026/06/Impact-18-Report.pdf Table 4.1 p.74 as indexed: Kisumu LIA population 304229, served 279212, utility budget KES321203208. Calculated share 91.78%, only within reported LIA denominator. Verify page and definition. Obtain all county and WSP rows, service areas, nine KPIs, definitions and historical IMPACT editions. MyGov 23 June 2026 https://www.ict.go.ke/sites/default/files/2026-06/MyGov%2023rd%20June%202026.pdf corroborates release and reporting period, not individual values. KIWASCO publisher claims https://kiwasco.co.ke/about-us/our-story/ (B): IMPACT 17 water coverage 93.19%, sewer coverage 18.67%, NRW 37.03%; FY2024/25 collection efficiency 98%. Home https://kiwasco.co.ke/ (B) instead states 93% water, 96.03% sanitation, 32% NRW, 100% collection efficiency without clear reference period. Do not equate sanitation with sewerage or assume same year. Tariff consultation https://wasreb.go.ke/wp-content/uploads/2026/03/KIWASCO-DETAILS-OF-PROPOSED-TARIFF-FOR-PUBLIC-CONSULTATION.pdf (A, proposed targets): FY2026/27 water 95%, sewer 23%, NRW 31%; FY2029/30 98%,29%,27%. These are targets, not actuals or adopted licence conditions; obtain final gazette. Reconcile KIWASCO, GULF, NYANAS and rural small providers using service-area denominators, not summing percentages. Link utility audit entries already in registry. Academic context: https://doi.org/10.1080/00220388.2025.2462031 delegated management study, not current utility census. Obtain full text and study dates.

## 7. Urban development and donor programmes (B)

KISIP2 official https://kisip.go.ke/about/kisip2 describes pooled national US\$165m project, effective 17 March 2021, scheduled IDA close Jan 2027 and AFD close Dec 2028; not Kisumu allocation. World Bank national annual financial report FY2024/25 https://documents1.worldbank.org/curated/en/099010926022026361/pdf/P167814-7824a119-3cf9-4076-925c-85d13438464d.pdf retrieve project-specific components and geographical schedules. KISIP components https://www.kisip.go.ke/project-components/kisip2 reports six completed/approved Kisumu community development plans; does not establish completed physical works. KNA https://www.kenyanews.go.ke/sh1-3-billion-to-upgrade-informal-settlements-in-kisumu/ 1 March 2024 claim KES1.3bn grants, six settlements, 14 planned road upgrades; follow contract lots and works certificates in Bandani, Manyatta A/B, Kibuye, Muhoroni and locations of lighting. Do not assume every named locality is one of six settlements. State department https://www.housingandurban.go.ke/our-functions confirms KISIP scope. Trace KUSP I/II, KUP, AFD/EIB LVWATSAN, LVBC/LVEMP, FLLoCA, NARIGP, NAVCDP, ENABLE Youth, irrigation and urban health programmes using project ID and county allocation evidence. Join by IATI identifier, World Bank project ID, county project code; national commitments not county expenditure. Programme stages: announced, approved, contracted, disbursed, completed, independently evaluated. Obtain donor evaluation and safeguards reports separately from press releases. Use existing Siaya programme schema, with Kisumu attribution flags.

## 8. Academic evidence inventory (B, retrieved metadata/abstract)

-   Simiyu et al., Urban Forum 2019, https://doi.org/10.1007/s12132-018-9346-3 ; published online 2018, correction Jan 2019. Informal settlement deprivation. Retrieve corrected version, sample, settlement list, methods, dates and results. Do not generalise to county.
-   Sifuna et al., International Journal of Epidemiology 2014, https://pmc.ncbi.nlm.nih.gov/articles/PMC4258789/ ; DOI 10.1093/ije/dyu139. Kombewa HDSS baseline 2011; historical dynamic cohort 141956 people, 34718 households, area \~369 km²; site not county. Extract later surveillance papers and sampling windows, not this count as contemporary population.
-   Othoo et al., J UOEH 2020, https://pubmed.ncbi.nlm.nih.gov/32879188/ DOI 10.7888/juoeh.42.237. Spatial WASH facilities in informal settlements; extract actual study area and methods before deriving access indicators.
-   Delegated water management study 2025 https://doi.org/10.1080/00220388.2025.2462031 ; cite study vs cited utility records separately. Systematic search: OpenAlex, Crossref, PubMed, AJOL, Maseno, JOOUST, University of Nairobi, MMUST, KEMRI, KMFRI; query Kisumu, Nyando, Ahero, Muhoroni, Seme, Nyakach, Kombewa, Nyalenda, Obunga, Manyatta, Winam Gulf. Topic combinations malaria, HIV, TB, schistosomiasis, maternal health, school attendance, mental health, disability, transport, housing, food systems, flood, wetland, contaminants, fisheries, governance. Screen titles/abstracts, deduplicate DOI, check corrections/retractions, record inclusion reason, sample size, study geography, design, effect measure/uncertainty and funding. Review article vs original research distinction. No pooled meta-analysis without comparable methods. These four articles were discovered/inspected at metadata or abstract level, not fully appraised.

## 9. Agriculture and economic evidence (B)

Strathmore SAFIC AgriIntel https://www.saficai.strathmore.edu/counties/kisumu provides original table pointers: KNBS GCP 2025 Table 8 2024 GCP KES370.9bn provisional; annex I agriculture/forestry/fishing KES58.9bn current prices; implied 15.88%; Table 1 population 1.27m projected. Obtain original KNBS release and retain previous GCP vintage. KNBS National Agriculture Production Report 2025 table 5.3.3 sugar 91190 tonnes (processed sugar, not cane), AFA Yearbook 2025 Table 69 rice 63002 tonnes, Table 63 dry maize 58657 tonnes, Table 71 sorghum 24246 tonnes. All 2024, secondary transcription only. KNBS National Agriculture Production Report 2024 Annex 15--25 indigenous chicken 3358608 (2023). Verify production location vs processing location. Obtain annual harvested area, yield, farmgate values, irrigation land actually irrigated (not scheme command area), NIA Ahero/West Kano scheme annual reports, AFA Sugar Directorate factory throughput, KAMIS dated market-level prices, livestock slaughter and disease records. GCP nominal trends are not real growth; use KNBS constant-price series if offered. Separate market prices by grade, retail/wholesale and exact market; no annual average from a single month.

## 10. Governance and publicly available social evidence

Primary policy https://kisumuassembly.go.ke/wp-content/uploads/2023/12/Report-on-the-Kisumu-County-Public-Participation-Policy-Final.pdf printed p.4 identifies participation, civic information, inclusion and feedback gaps as policy diagnosis, not measured current performance. Assembly announcement https://kisumuassembly.go.ke/?p=6227 records 6 June 2023 participation across seven subcounties; obtain minutes, proposals, response matrix, adopted budget and completion evidence. Do not treat reported attendance 'hundreds' as precise count or publish attendee names. Actual external social-media public index queries in this run returned no sufficiently verifiable individual posts. No claim of comprehensive platform sweep. Claude browser follow-up: locate official accounts via reciprocal links on institutional websites; inspect public Facebook, YouTube, X, Instagram, LinkedIn and TikTok posts from county executive, assembly, city board, KIWASCO, KISIP, humanitarian agencies, local CSOs and media. Search each subcounty and named project with date ranges 2013--2026, prioritise 2023 onward. Capture post URL, account, publication time, claim, locality, referenced document, retrieval date, corroboration and correction link. Use public transcripts for assembly proceedings; record video timestamp. Public posts = leads or attributed claims, not independent confirmation. No private groups, bypasses, user profiling or personal contacts. Where inaccessible record access failure and alternative official minutes/press releases. Deduplicate reposts and syndicated media. Do not infer public opinion from engagement. Keep allegations unpublished unless supported and cleared per repository standards.

## 11. Comprehensive remaining acquisition matrix (C unless linked above)

These are targeted work queues, not claims all sources exist or have been inspected. For each resolve publisher landing page, exact report and Kisumu row; record unsuccessful attempts and access status.

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Domain                  Publisher / document families                                                                                      Required Kisumu extraction and crosscheck
  ----------------------- ------------------------------------------------------------------------------------------------------------------ ------------------------------------------------------------------------------------------------------------------------------------------------------
  Geography               KNBS KPHC 2019 Vol I/II/IV; IEBC ward boundaries; Survey of Kenya                                                  seven subcounty and 35 ward identifiers; census administrative units vs constituencies; boundary vintages; polygon joins

  Population              CSA 2015/2024; KNBS GCP population projections                                                                     census vs estimates; age/sex, urban-rural, households, disability, migration; year-matched denominators

  Fiscal                  CoB annual 2019/20; CBROP 2016/17; CFSP early years; adopted ADP 2026/27                                           close repository gaps, primary/mirror status; current vs supplementary budget; ordinary OSR and FIF; don't overwrite held alternatives

  Audit entities          OAG, Parliament library, PBO, KIWASCO                                                                              hospitals, county funds, city, revenue board, KUP, lakefront; opinion and findings, response and follow-up; retrieve link-only documents by priority

  Procurement             PPRA PPIP, county award notices, assembly oversight                                                                award, variation, contract amount, lot, dates, completion; roles/entity only consistent with repository rules

  Health                  NSDCC, NTLD, MoH, KMHFL, KDHS, KEMRI, JOOTRH                                                                       disease, service access, workforce, facilities, FIF, referral geography and reporting completeness

  Education               Ministry basic education statistical booklets, KNEC aggregate statistics, CSA, county ECDE/VTC reports             enrolment by sex/level, disability, teachers, classrooms, transition, bursaries; no learner records

  Social protection       State Department social protection, UNICEF, WFP, county disability programmes                                      beneficiaries by programme/reporting period, coverage, payment status; avoid overlap and individual identifiers

  Gender/youth            KNBS, NGEC, UN Women, UNFPA, county plans                                                                          labour and education gaps, service access, programme results; sensitive survey disclosure thresholds

  Agriculture             KNBS, AFA, NIA, KALRO, KAMIS                                                                                       packet above plus soil, rainfall, inputs, farm size, horticulture, livestock and market infrastructure

  Fisheries               KeFS, KMFRI, LVFO                                                                                                  packet above plus fish value, species, effort, aquaculture, landing sites and cold chain

  Industry/jobs           KNBS GCP and MSE survey; KIPPRA; EPZA; industrial park documents                                                   value added, establishments, employment, enterprise survival; registry vs survey universe

  Transport               KPA, KAA, KCAA, Kenya Railways, KeNHA, KURA, KeRRA, KRB                                                            Kisumu port cargo, airport traffic, rail freight, roads condition and length, projects; distinguish station from county totals

  Energy/digital          EPRA, Kenya Power, REREC, Communications Authority, KNBS                                                           household electricity, connections, outages, clean cooking, coverage; national telecom data not Kisumu

  Water                   WASREB, WRA, KIWASCO, LVNWWDA, KDHS                                                                                packet above; basin flows, treatment, service areas, boreholes, tariffs, sewage quality

  Climate/disaster        KMD, WRA, NEMA, FLLoCA, Kenya Red Cross, ReliefWeb, LVBC                                                           flood dates, affected persons vs households, crop loss, adaptation finance, rainfall anomalies; event deduplication

  Environment             NEMA, KMFRI, WRA, KFS, Ramsar sources                                                                              Winam Gulf pollution, wetland extent, water hyacinth, tree cover, waste; sample locations and lab methods

  Housing/land            KISIP, KUSP, City Board, Lands Ministry                                                                            settlements, tenure, housing stock, upgrading milestones; avoid household-level addresses

  Tourism/culture         Tourism Research Institute, National Museums, county tourism department                                            visitor/site counts, beds, occupancy, heritage activity; not national allocation

  Justice/safety          Judiciary annual reports, NPS statistical reports, KNBS CSA                                                        station/court jurisdiction, cases filed/resolved, crime aggregates; no named individuals

  Governance              Assembly, IBP CBTS, KHRC, NTA, IEA, APRM                                                                           document availability, participation, oversight recommendations and implementation; APRM status verify

  NGOs/donors             DPMIS, IATI, World Bank, AFD, EIB, UN-Habitat, UNICEF, WHO, FAO, Practical Action, WaterAid, Red Cross, Muungano   project-level geography, dates, spending vs commitments, outputs vs outcomes, independent evaluations

  Academia/social         sources in §§8--10                                                                                                 complete searchable bibliography and claim register, explicit publication and access status
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 12. Statistical abstract acquisition and extraction

Official KNBS landing page https://www.knbs.or.ke/reports/2024-statistical-abstract-kisumu-county/ ; repository https://repository.knbs.or.ke/entities/statisticalabstract/a5c06128-678d-4c72-b5a8-2109e70ec87f ; official PDF https://www.knbs.or.ke/wp-content/uploads/2025/12/2024-Statistical-Abstract-Kisumu-County.pdf ; CoG mirror https://maarifa.cog.go.ke/sites/default/files/2026-02/2024-Statistical-Abstract-Kisumu-County.pdf . KNBS repository states CC BY-SA 4.0 except otherwise noted, release landing page December 2025, reference year 2024; foreword says most coverage 2019--2023. County-hosted version already held in repo; compare hashes and edition metadata before replacing. Extract table-of-contents inventory across all five domains, assign every table disposition: imported/reused, not relevant with reason, blocked, duplicate, or pending. Preserve footnotes, fiscal/calendar units, suppressed and provisional data. No claim made here that all 255 pages were read. Prioritise tables extending missing sector series, then historical CSA 2015 and national newer reports.

## 13. Completion ledger and acceptance criteria

1.  Reconcile this packet against source IDs and existing observations: report new, duplicate, alternate vintage, conflicting and rejected counts.
2.  Download/hash priority A originals and verify correct row correctly scoped, printed versus PDF page and licence. Create review pack entries; machine comparison alone is not approval.
3.  Stage fisheries 60 candidate rows (five counties x12), poverty 18 table cells, KDHS 14 county/national values (including bounded value), WASREB three source cells; counts are prospective, not imported totals.
4.  For every discrepancy record both original figures, definition, period, sources, hypothesis and open status; never silently choose or average. For fisheries compare original annual reports and revisions; for poverty use survey vs model boundaries; for water use service-area versus county population.
5.  Complete missing document queue from repo, including 121 Parliament link-only records where still outstanding; start with latest hospital, city, county fund and water company audits, then historical. Avoid blanket multi-GB downloads before checking relevance and availability. Repository coverage document contains updates superseding earlier gap text; read latest entries.
6.  Publish no held Kisumu data by this handover. Run existing validate, build, review packs, report, smoke, axe, crawl, overflow and reproducibility gates when implementation authorised. Maintain Siaya regression integrity.
7.  Return a delta manifest, candidate observations machine-readable, source IDs, gaps, exceptions and review queue. Report actual coverage by sector and reporting year, not number of search results. Record source licences; link rather than redistribute where rights uncertain.

## 14. Research limits and exact handoff instruction

This run retrieved publisher web text and metadata, not local PDF bytes or page images, no original document hashes calculated, no full academic systematic review, no verified individual social posts, no repository build or live browser checks. No source-level deduplication against all 448 records was completed. Scope expansion leads are explicitly separated from extracted data. Existing Claude safeguards remain controlling. Prioritisation decisions: fisheries, poverty, water and urban development because they yielded specific usable evidence and support both Kisumu and regional comparisons. Claude: ingest only the evidence delta after source checks, execute remaining acquisition matrix, return traceable results, avoid redesign or duplicate work. Do not claim completion until each gap has a recorded disposition.

------------------------------------------------------------------------

## Historical appendix: TAKWIMU_CONTINUING_ANALYTICAL_AUDIT_2026-11-28.md

# TAKWIMU KENYA --- Continuing analytical audit and Claude Code work orders

Date: 2026-11-28 \| Read-only review \| Supplement to Kisumu deep research handover

## 1. Evidence and limitations

GitHub main files directly inspected: README.md, lib/counties.js, lib/county-registry.js, data/counties/kisumu/population.json, machine-checks.json, conflicts.json. Prior pass also inspected package.json, test-unpublished-counties.js and Kisumu coverage and research plan. The new domain and Kisumu route could not be fetched; no browser rendering or build execution certified. No git changes. Status counts are repository-reported as of 27 Nov, not independently enumerated across every dataset.

## 2. Confirmed findings and work orders

### P0 --- Editorial assurance

Kisumu: 273 agree, 5 disagree, 53 not checkable (331). Siaya: 2363 agree, 80 disagree, 1562 not checkable (4005). Combined 85 disagreements, 1615 not checkable. README reports zero approvals. Machine matching finds a number anywhere on page at compatible scale/precision, not necessarily the correct cell. Implement row/column/period/unit-aware matching, with table and page coordinates, source hash, extraction method, review decision and reviewer independence. Add adversarial fixtures where identical numbers occur in unrelated rows, or values are swapped between years. Never equate machine match with approval. Review 85 disagreements first, then material headline observations and conflicts. Distinguish count of observations from unique indicators. \### P0 --- Publication lifecycle Existing registry has ledger, audits, population and conflicts. Kisumu unpublished. Existing test forbids pre-publication review records; staged independent review needs explicit lifecycle separation. Permit review on private held data while preserving leakage guard. Test unpublished JSON, CSV, JS bundles, HTML/RSC, sitemap, PDFs, search indexes, and data endpoints. Require explicit owner release; do not weaken guard. Check that shared national data legitimately includes Kisumu without exposing held records. \### P1 --- Source arithmetic anomaly County Q4 FY2024/25 report: total 15,301,595,492; recurrent 10,272,065,659; development 5,029,529,833. Printed shares 67% and 37%; calculated 67.1307% and 32.8693%. Record probable source arithmetic error, verify actual PDF page visually, preserve printed value and add calculated value with rationale. Revenue receipts 12,423,511,303 / budget = 81.191%. Do not assume cash receipts and expenditure are comparable. Source https://www.kisumu.go.ke/wp-content/uploads/QUARTER_4_BUDGET_IMPLEMENTATION_REPORT_2024_20251-1.pdf \### P1 --- Budget vintage conflict Chagua reproduces CoB FY2024/25 recurring budget 9.89bn and spend 7.90bn, development budget 5.43bn and spend 1.57bn. Approximate absorption 79.9% and 28.9% respectively. Compare with county Q4 budget split above; locate exact CoB tables 2.1, 2.4, 2.5, document original/revised version, reconcile rounding and classifications. No merge across vintages. Chagua is secondary: https://chagua.co.ke/budget/county/kisumu/ \### P1 --- Fiscal comparison Create metric registry with numerator, denominator, entity, period, vintage, price basis, exclusions, null treatment and lawful benchmark. Development budget share vs actual share vs absorption are distinct. Personnel expenditure / total revenue is distinct from payroll / total expenditure. Central payroll allocation may make departmental health spending look artificially low; verify allocation before attributing costs. Separate ordinary OSR and FIF/AIA, ensure no double count. Pending bills stock is not annual spending. Debt drawdown is not debt balance. Use confidence intervals where available for survey estimates. Use consistent population vintages and distinguish census from projections. Recompute all derivatives after rejection/correction. Test zeros, nulls, negative values, partial years and rounded source values. \### P1 --- County comparisons Compare Kisumu with urban peers and regional peers separately. Show rationale, common periods and coverage counts. No composite league tables without transparent weighting and sensitivity checks. National aggregates use sums or appropriately weighted estimates, never unweighted county averages by default. Include real and nominal money series with KNBS CPI base year documented; GCP nominal growth not real economic growth. \### P1 --- Project delivery Track allocation, transfers, commitments, expenditure, verified physical progress, operational status, service outcomes separately. Project identity across renamed projects and fiscal years, geography, funding source and duplicate controls. No inference of completion from commissioning post alone. Include primary document page, stage and date. No accusation of loss or theft based solely on underspending or audit qualification.

## 3. Newly surfaced source routes

-   KNBS CSA: https://www.knbs.or.ke/reports/2024-statistical-abstract-kisumu-county/ ; repository https://repository.knbs.or.ke/handle/knbs-ke-repo/406 explicitly states CC BY-SA 4.0 except otherwise noted. Reconcile reference year 2024 with portal publication December 2025 and CoG upload 2026; do not collapse dates. CoG mirror https://maarifa.cog.go.ke/node/1517. Hash compare against existing county copy before treating as identical.
-   County Assembly budget collection https://kisumuassembly.go.ke/?page_id=1204 lists proposed ADP FY2027/28 and public participation report, proposed estimates FY2026/27, debt management strategy 2026, CFSP 2026/27, and seven subcounty budget analyses. Acquire originals, classify draft/adopted, version and date. This is a discovery result, not downloaded files.
-   County Q3 report https://www.kisumu.go.ke/wp-content/uploads/FIRST_NINE_MONTHS_CBIRR_2024-2025\_\_THIRD_QUARTER.pdf reports revenue 6.9bn and expenditure 6.8bn, cites delays in procurement, transfers, coordination and heavy rain. Treat cited reasons as county statements, not established causal attribution. Compare Q4 full-year, do not sum cumulative quarters.
-   OAG County Revenue Fund 2023/24 https://libraryir.parliament.go.ke/handle/123456789/30846 official catalogue record dated 2025-02-13. Retrieve actual report and match opinion paragraph.
-   KIPPRA https://repository.kippra.or.ke/communities/21c86adb-2946-4f1c-ac28-4a1587371310?f.dateIssued.max=2025&f.dateIssued.min=2023&f.subject=Priority+Programmes%2Cequals&spc.page=1 shows a record tagged CBROP 2024 whose description refers to 2025. Use internal cover/date/reviewed period, catalogue metadata separately.
-   Strathmore SAFIC https://www.saficai.strathmore.edu/counties/kisumu identifies primary agricultural tables. Use as competitor benchmark and source lead, not controlling evidence. Reported 2024 rice 63,002 tonnes, dry maize 58,657 tonnes, sugar 91,190 tonnes (not sugarcane). Retrieve AFA Year Book 2025 Tables 69 and 63; KNBS National Agriculture Production Report 2025 Table 5.3.3. Verify production versus processed output, area harvested and yield denominator; do not extrapolate one-year changes. Link current market data to market and month, commodity grade, observations and dispersion.
-   KNBS GCP 2024 https://repository.knbs.or.ke/handle/knbs-ke-repo/1552 states CC BY-NC 4.0 except otherwise noted. Check individual source permissions before paid redistribution or derivative products. Do not assume public availability equals commercial reuse permission.
-   Open Budget Kenya https://openbudget.or.ke/county/42_kisumu gives population 1,155,551 vs repo research census total 1,155,574 (difference 23). The difference equals reported intersex census count; hypothesis only, verify primary census and third-party definition before explaining. Preserve inclusivity and exact denominator.

## 4. Production & UX acceptance

README now correctly identifies custom domain and old alias redirect. Verify HTTP status, canonical tags, sitemap, robots, SSL, redirects and social share metadata on actual deployment. Run clean archive build, validate, typecheck, report, axe, crawl, overflow, reproducibility, smoke. Pin browser test dependencies and enforce all gates in CI before release; current README says Netlify runs build only, manual checking of other gates. Test mobile 320/360/390 widths, low bandwidth, keyboard and screen reader; PDFs check tables, footnotes and pagination. Verify no source/data mismatches across HTML, PDF, CSV. Do not claim tests passed without logs.

## 5. Analytical product roadmap

First release: verified fiscal history, audited opinions with scope, population, budget-to-delivery and methodology. Then seven subcounty/35 ward geography, health and education, agriculture and fisheries, city, WASH, climate, port/logistics and NGO evidence atlas. For academia store DOI, design, sample, dates, geographic scope, limitations, funding and effect measure; avoid generalizing facility/HDSS findings. For social media record public permalink, publisher, timestamp, claim, primary corroboration and outcome; no personal data, no private posts or access bypass. This pass did not perform fresh social or academic searches beyond the Strathmore comparator, so prior tasks remain open.

## 6. Delivery contract

Claude must return evidence register delta, source acquisition log, discrepancy ledger, metric dictionary, test results, changed-file manifest and release recommendation. Priorities: editorial validation, scope and reconciliation, sources, release gates, then new visualisations. No git merge or deploy without owner authorisation. Keep current static/no accounts/no personal data architecture unless owner explicitly authorises a change. Monetisation via bespoke analysis and permitted data products; review source licences and privacy obligations. No arbitrary scores or unsupported causal claims. This is a supplemental audit, not proof that all proposed defects exist in live deployment.
