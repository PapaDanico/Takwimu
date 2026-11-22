# Siaya economy: Gross County Product (research programme 3B)

Data: `data/siaya-economy.json`, schema `schemas/siaya-economy.schema.json`, check `node scripts/test-economy.js`. Not yet wired into the build.

## Sources (two vintages, kept apart)
| Vintage | Library id | Report | Years | SHA-256 (first 12) | Printed page |
|---|---|---|---|---|---|
| GCP2025 | KNBS-01-PDF | KNBS, Gross County Product 2025 (PDF created 15 Dec 2025) | 2020-2024 (2024 provisional, all tables marked revised) | 412af7c153b0 | PDF page - 14 |
| GCP2024 | KNBS-02-PDF | KNBS, Gross County Product 2024 (PDF created 8 Oct 2024) | 2019-2023 | fe2dff51a697 | PDF page - 14 (left pages of spreads unnumbered) |

## What was extracted (154 values)
- Total GCP at current prices (GCP2025 Table 8, p.33; GCP2024 Table 5, p.28) and at constant 2016 prices (Table 10, p.45; Table 7, p.41), KSh million.
- Share of all-county GVA, % (Table 9, p.35; Table 6, p.29), with the printed five-year average (1.1% in both).
- GVA by 18 activities plus FISIM, current prices: GCP2025 annexes I-III (2024, 2023, 2022; pp.54, 56, 58); GCP2024 annexes I-III (2023, 2022, 2021; pp.48-49, 54-55, 58-59).
- Average real growth: 4.6% a year 2020-2024 (GCP2025 Figure 6, p.46, OCR, confidence 3) and 3.8% 2019-2023 (GCP2024 Figure 7, p.42, chart label in text layer, confidence 4). National comparators printed: 4.5% and 4.6%.

Tables were read from the PDF text layer with word positions (pdftotext -bbox), confidence 5. Activity columns were matched to their rotated headers by x position. In GCP2024 the annexes run over two facing pages and only the left page names the county, so the right-hand row was matched by its y position. Its GCP column equals Table 5, which confirms the match. Activity sums agree with the printed GCP within KSh 2 million every year.

## Revisions (GCP2025 minus GCP2024)
| Year | Current prices | Constant 2016 prices |
|---|---|---|
| 2020 | +52 (+0.1%) | +42 (+0.1%) |
| 2021 | -42 (0.0%) | -84 (-0.1%) |
| 2022 | -6 (0.0%) | -4 (0.0%) |
| 2023 | -2,196 (-1.5%) | -361 (-0.4%) |

The 2023 revision is concentrated in transport and storage (-1,721), public administration (-375), education (-334) and health (-245), partly offset by small rises elsewhere. The 2022 activity values are almost unchanged (transport -3, finance -2). Shares are the same to one decimal place.

## Caveats
- GCP is the output of the county economy. It is not county government revenue or spending.
- Neither edition publishes a share of national GDP. The share tables divide by the sum of county GVA, which excludes taxes on products. GCP2024's Figure 2 caption calls this a GDP share, but it is recorded here under the table's own name.
- The two growth rates cover different windows and come from different editions, so they are not a trend. KNBS does not say how the average is computed. Annual real growth rates are not published, and none are derived here.
- Gaps (listed in the file, not filled): activity values for 2019-2020 in GCP2024 and 2020-2021 in GCP2025; any activity breakdown at constant prices.
- Wholesale and retail trade is small for Siaya (KSh 1.7 billion in 2024) next to transport (KSh 19.4 billion). Both values are as printed.
