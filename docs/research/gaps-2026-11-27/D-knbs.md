# Gap D: KNBS and survey sources for Siaya (041) and Kisumu (042), 27 Nov 2026

Retrieved from the KNBS DSpace repository (repository.knbs.or.ke API; MD5 matched the repository checksum for every file) and NADA (statistics.knbs.or.ke). knbs.or.ke itself fails TLS from here and was not bypassed. Files are held outside the repo; bytes and SHA-256 are in `D-knbs-files.tsv`. Page numbers are PDF pages. All values are "official" printed values, to be entered as Provisional and reviewed before publication.

| Source, table, page | Siaya | Kisumu | Unit | Year |
|---|---|---|---|---|
| KPHC 2019 Vol II T2.2 p.22: population | 993,183 | 1,155,574 | people | 2019 |
| Vol II T2.2 p.22: households | 250,698 | 300,745 | households | 2019 |
| Vol II T2.2 p.22: density | 393 | 554 | people/km² | 2019 |
| Vol IV T2.2 p.52: attending school (age 3+) | 48.0 | 47.6 | % | 2019 |
| Vol IV T2.2 p.52: never attended (age 3+) | 9.4 | 7.2 | % | 2019 |
| Vol IV T2.32 pp.443-444: own a mobile phone (age 3+) | 44.1 | 49.4 | % | 2019 |
| Vol IV T2.33 p.453: use the internet (age 3+) | 14.9 | 23.9 | % | 2019 |
| Vol IV T2.12 p.288: iron-sheet roof | 92.9 | 93.5 | % households | 2019 |
| Vol IV T2.15 p.321: piped into dwelling / yard / public tap | 1.7 / 3.4 / 13.0 | 8.3 / 10.9 / 22.1 | % households | 2019 |
| Vol IV T2.16 p.328: covered pit latrine / open or bush | 68.9 / 6.0 | 65.4 / 3.6 | % households | 2019 |
| Vol IV T2.18 p.349: firewood / LPG for cooking | 72.4 / 6.0 | 49.6 / 18.7 | % households | 2019 |
| Vol IV T2.19 p.360: mains electricity / solar for lighting | 19.7 / 50.8 | 52.6 / 26.2 | % households | 2019 |
| GCP 2025 T8 p.33: GCP, current prices | 163,867 | 370,851 | KSh million | 2024 (provisional) |
| GCP 2025 T10 p.45: GCP, constant 2016 prices | 101,944 | 255,113 | KSh million | 2024 (provisional) |
| GCP 2025 T9 p.35: share of county GVA | 1.1 | 2.5 | % | 2024 (provisional) |
| KDHS 2022 KIR T10C p.37: skilled ANC / skilled birth / facility birth | 99.1 / 94.9 / 84.4 | 98.0 / 97.9 / 94.4 | % | 2022 |
| KDHS 2022 KIR T11C p.44: basic / national-schedule vaccination | 88.1 / 69.9 | 78.9 / 62.6 | % | 2022 |
| KDHS 2022 KIR T14C p.54: stunting | 19.2 | 9.1 | % | 2022 |
| KDHS 2022 KIR T19C p.64: ITN use, under 5 | 77.0 | 68.9 | % | 2022 |
| KDHS 2022 KIR T20C p.66: IPTp 3+ doses | 33.8 | 25.5 | % | 2022 |
| Economic Survey 2026 T5.13 p.150: total county revenue FY2024/25 / FY2025/26 (provisional) | 6,024 / 9,087.37 | 13,042 / 12,867.44 | KSh million | FY |
| Economic Survey 2026 T16.3 p.430: registered SHA members | 337,059 | 545,448 | people | 2024/25 |
| World Bank Poverty and Gender Assessment T F.1 p.277 (secondary, KIHBS-based): primary net enrolment | 85.0 | 90.0 | % | 2015/16 |

Checks:
- Siaya GCP 2020-2024 equals data/siaya-economy.json exactly. Siaya KDHS values equal data/siaya-health.json (same KIR copy, sha256 e18cd1e9…).
- Economic Survey 2026 T5.13 prints Siaya FY2025/26 own-source revenue 3,114.92 against 481.79 in FY2024/25. Flag as a possible source error: compare with the CoB FY2025/26 annual report before any use.
- Census Vol I: the sourceafrica copy (4d93b465…) is not byte-identical to the KNBS copy (740093a7…). The text is identical (re-optimised PDF). Use the KNBS copy; the other is a secondary copy, content verified.

Not found or not searched: Siaya statistical abstract newer than 2015; census volumes on NADA (catalogue 116 holds questionnaires only); census.ke backend (522). UNDP and Issuu 403; DocPlayer, KHIS and library.parliament.go.ke timed out. Not yet searched: CRA, CoG maarifa, KIPPRA, UNICEF, opendata.go.ke, Kenya Law/Gazette, county sites, OpenAlex/CORE/BASE, news.
