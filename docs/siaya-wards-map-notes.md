# Siaya ward boundaries and `<WardMap>`: notes

Data: `data/siaya-wards-geo.json`. Schema: `schemas/siaya-wards-geo.schema.json`. Build: `scripts/build-siaya-wards-geo.py` (one-off; the output is committed). Test: `node scripts/test-wards-geo.js`. Component: `components/WardMap.js`. Compiled 21 Nov 2026.

## Source

| | Primary (geometry) | Cross-check only |
|---|---|---|
| HDX dataset | [administrative-wards-in-kenya-1450](https://data.humdata.org/dataset/administrative-wards-in-kenya-1450) | [kenya-admin-level-3-wards](https://data.humdata.org/dataset/kenya-admin-level-3-wards) |
| Publisher (HDX "source") | American Red Cross | FAO (HDX organisation: OCHA ROSEA) |
| Licence (HDX) | Creative Commons Attribution International (CC BY) | Creative Commons Attribution International (CC BY) |
| Dataset date | 2016-03-31 (modified 2019-04-12) | 2016-01-01 |
| Resource | `kenya_wards.zip`, 25,164,754 bytes | `kenya_wards.zip`, 17,402,535 bytes |
| SHA-256 | `13e0dee1a1c731fbb2eb03f0c28468d202fdc174279a104064f05740cc281206` | `57d8898dab7e91783af14aab37191419b207b3816f2ef49fd82811c07962162e` |
| CRS | `.prj` GCS_WGS_1984; no reprojection needed | no `.prj`; degrees, read as WGS 84 |

Attribution shown on every map: **Ward boundaries: American Red Cross via HDX, CC BY, 2016**.

HDX caveat (primary, quoted): "Data abstracted from different sources including National Land Commission/IEBC & SOK then cleaned for topological errors and verified with county teams from > 20 counties." HDX caveat (FAO): "This dataset is not an official administrative layer from the authorities." Neither is an IEBC publication; the ward set matches the IEBC 2012 delimitation (30 wards, codes 1156-1185).

Downloads were kept in `/tmp/claude-0/library/hdx-wards/{arc,fao,geob}` (not committed). `geob` holds the geoBoundaries KEN ADM2 simplified GeoJSON (SHA-256 `1330f031cf0fd00c7a0ef29ab09d0544da12482094a85d60165a1534e45d84ad`), the layer behind `data/siaya-boundaries.json`; it is used only for the county bbox.

Rebuild: `pip install pyshp shapely` (shapely 2.1 or later), then
`python3 -I scripts/build-siaya-wards-geo.py <arc>/Kenya_Wards/kenya_wards "<fao>/Kenya wards" <geob>/adm2_simplified.geojson`.

## Processing

- 30 features where `county = Siaya`. Each source name (for example "Siaya Township Ward") has " Ward" dropped and is matched to `data/siaya-geography.json` by name or recorded alias **and** by constituency (`subcounty` "X Sub County" = constituency X). Nothing is forced; the script stops if any ward is unmatched.
- Simplified with `shapely.coverage_simplify` (tolerance 0.0012 degrees, about 130 m), so shared edges stay shared and no gaps or overlaps appear. Coordinates rounded to 4 decimals. File size 67 KB.
- Each feature keeps the source name, source sub-county and DHIS2 `uid`, plus registry ward id, code, name and constituency, and a label point (pole of inaccessibility).

## Findings

1. **All 30 wards matched the registry**, one to one, by official name, with the right constituency. No aliases had to be added. Source names are the registry names plus " Ward".
2. **FAO layer disagrees in Bondo and Rarieda.** It has 28 Siaya wards, uses old district labels, includes lake water in shoreline wards and gives South Sakwa and West Sakwa codes 1266 and 1267 (registry: 1177, 1179). It has no North Alego or North Sakwa polygon, and spells "Sindindi", "Siaya Town", "Yimbo West". Overlap (IoU) with the primary layer is 0.80-0.90 for most inland wards but below 0.5 for Siaya Township, North Alego, West Yimbo, Central Sakwa, South Sakwa, North Sakwa, North Uyoma and South Uyoma. The per-ward result is stored in `crosscheck_fao`. The FAO geometry is not used.
3. **County outline.** The wards reach up to 0.0018 degrees (about 200 m) beyond the geoBoundaries county bbox on the east side; the test allows 0.01 degrees because the two layers have different origins. The ward layer has not been checked against an IEBC ward map.
4. `data/siaya-geography.json` `spatial_layers` still says no ward layer exists. That file belongs to another workstream; its owner should add this layer.

## `<WardMap>` props

```jsx
import WardMap from '../../../../components/WardMap';
<WardMap values={{ '1156': 12.5, ukwala: 9 }} valueLabel="Share of households" valueUnit="%" valueDec={1} />
```

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `values` | `{ [ward_id or ward_code]: number \| null }` | none | Optional. Shades wards on a single-hue scale (`--q1..--q5`), five equal steps from min to max, with a legend. Missing or `null` = hatched, "not available". |
| `valueLabel` | string | `''` | Name of the measure; used in the legend, labels, tooltip and table header. |
| `valueUnit` | string | `''` | Unit; `'%'` is appended without a space. |
| `valueDec` | number | `0` | Decimal places. |
| `valueNotes` | `{ [ward_id or code]: string }` | `{}` | Per-ward note, added to the label and table. |
| `ariaLabel` | string | "Map of the 30 county assembly wards of Siaya County" | Label of the SVG group. |
| `caption` | node | none | Text placed before the attribution (put source, date, period, unit and confidence of the values here). |
| `mapId` | string | `'wmap'` | Unique per page if more than one map is shown (pattern and help ids). |

Behaviour: client component (`'use client'`). Buttons zoom in, zoom out and reset (44 px targets). Drag pans (pointer events: mouse, pen, touch; two-finger pinch zooms once zoomed in; at full view vertical touch scrolling still scrolls the page). With the map focused: arrow keys pan, `+`/`-` zoom, `0` resets. Every ward is in the tab order with an `aria-label` (ward, constituency, IEBC code, value); a focused ward off screen is brought into view. Ward names show at 2x zoom and above. A tooltip shows on hover or focus. "View as table" lists all 30 wards by code. The attribution line is always visible. No network requests, no cookies, no storage; styles are inline (allowed by the site CSP). Transitions are turned off under `prefers-reduced-motion`.
