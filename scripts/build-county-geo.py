#!/usr/bin/env python3
# One-off: builds a registry county's boundary files from public downloads. The outputs are committed, so the normal
# build needs no network and no Python. Written for Kisumu (042); the county-specific facts (codes, crosswalk, the
# official land area) are read from the IEBC and KNBS documents named below, never assumed.
#
# Usage (run with -I; the inputs are untrusted downloads and are only read, never executed):
#   PYTHONPATH=<dir with shapely>=2.1 and pyshp> python3 -I scripts/build-county-geo.py SRC_DIR
#   SRC_DIR holds: kenya_wards.zip and wards/Kenya_Wards/kenya_wards.* (HDX administrative-wards-in-kenya-1450),
#   adm2_full.geojson (geoBoundaries gbOpen KEN ADM2), gn13904.pdf (IEBC Gazette Notice 13904 of 2025),
#   rov2022.pdf (IEBC registered voters per constituency, 2022), and their pdftotext -layout outputs gn.txt, rov.txt.
# Writes data/counties/kisumu/{geography.json,wards-geo.json,constituencies-geo.json}.
import hashlib
import json
import math
import os
import re
import sys

import shapefile
import shapely
from shapely.geometry import shape, MultiPolygon, mapping
from shapely.ops import polylabel, transform

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'data', 'counties', 'kisumu')
SRC = sys.argv[1]
PREC = 4
TOLERANCE = 0.0012  # the tolerance used for Siaya (data/siaya-wards-geo.json)
COUNTY, COUNTY_CODE = 'Kisumu', '042'
LAND_AREA_KM2 = 2085  # KNBS 2019 census Volume II Table 2.2, Kisumu row (data/counties/kisumu/population.json P01)


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace("'", '')).strip('-')


def key(s):
    s = re.sub(r'\s+ward$', '', s.strip(), flags=re.I)
    return re.sub(r"[^a-z]", '', s.lower())


# ---- IEBC codes and names: Gazette Notice 13904 of 26 Sep 2025 (one row per registration centre) ----
gn_pages = open(os.path.join(SRC, 'gn.txt'), encoding='utf-8').read().split('\f')
gn = {}
for i, p in enumerate(gn_pages):
    for line in p.splitlines():
        m = re.match(r'\s*042\s+Kisumu\s+(\d{3})\s+(.+?)\s{2,}(\d{4})\s+(.+?)\s{2,}\d{3}\s', line)
        if m:
            gn.setdefault(m.group(3), {'con_code': m.group(1), 'con_name': m.group(2).strip(), 'name': m.group(4).strip(), 'pages': set()})['pages'].add(i + 1)
if len(gn) != 35:
    raise SystemExit(f'expected 35 Kisumu wards in the gazette notice, found {len(gn)}')
cons = {}
for code, w in gn.items():
    cons.setdefault(w['con_code'], w['con_name'])
if len(cons) != 7:
    raise SystemExit(f'expected 7 constituencies, found {len(cons)}')

# ---- Registered voters per constituency, 2022 (IEBC) ----
rov_pages = open(os.path.join(SRC, 'rov.txt'), encoding='utf-8').read().split('\f')
voters = {}
for i, p in enumerate(rov_pages):
    for line in p.splitlines():
        m = re.match(r'\s*042\s+KISUMU\s+(\d{3})\s+(.+?)\s{2,}([\d,]+)\s*$', line)
        if m:
            voters[m.group(1)] = {'value': int(m.group(3).replace(',', '')), 'as_printed': line.strip(), 'pdf_page': i + 1, 'name_as_printed': m.group(2).strip()}
if set(voters) != set(cons):
    raise SystemExit('registered-voter rows do not match the constituency codes')

# ---- Ward polygons: American Red Cross via HDX; names joined to IEBC by name within the constituency ----
# Crosswalk for names that differ beyond case, punctuation and the word "Ward" (each recorded in the output).
ALIAS = {'northkisumu': 'kisumunorth'}
r = shapefile.Reader(os.path.join(SRC, 'wards', 'Kenya_Wards', 'kenya_wards'), encoding='utf-8')
prj = open(os.path.join(SRC, 'wards', 'Kenya_Wards', 'kenya_wards.prj')).read()
if 'WGS_1984' not in prj or 'PROJCS' in prj:
    raise SystemExit('unexpected CRS in .prj')
by_key = {}
for code, w in gn.items():
    by_key.setdefault((w['con_code'], key(w['name'])), code)
con_by_name = {key(n): c for c, n in cons.items()}
src = []
for sr in r.iterShapeRecords():
    rec = sr.record.as_dict()
    if rec['county'] != COUNTY:
        continue
    g = shape(sr.shape.__geo_interface__)
    if not g.is_valid:
        g = shapely.make_valid(g)
    con_code = con_by_name.get(key(rec['subcounty'].replace(' Sub County', '')))
    k = key(rec['ward'])
    k = ALIAS.get(k, k)
    code = by_key.get((con_code, k))
    if not code:
        raise SystemExit(f"unmatched ward {rec['ward']!r} in {rec['subcounty']!r}: record an alias rather than forcing a match")
    src.append((code, rec, g))
if len(src) != 35 or len({c for c, _, _ in src}) != 35:
    raise SystemExit('expected 35 distinct matched wards')

# ---- Topology and area (equal-area projection centred on the county) ----
ward_union = shapely.union_all([g for _, _, g in src])
lon0, lat0 = ward_union.centroid.x, ward_union.centroid.y
R = 6371.0072  # authalic radius, km


def laea(x, y, z=None):
    lam, phi = math.radians(x - lon0), math.radians(y)
    p0 = math.radians(lat0)
    k = math.sqrt(2 / (1 + math.sin(p0) * math.sin(phi) + math.cos(p0) * math.cos(phi) * math.cos(lam)))
    return (R * k * math.cos(phi) * math.sin(lam), R * k * (math.cos(p0) * math.sin(phi) - math.sin(p0) * math.cos(phi) * math.cos(lam)))


area = lambda g: transform(laea, g).area  # shapely.ops.transform: deprecated in 2.2 but exact for this use
gb = json.load(open(os.path.join(SRC, 'adm2_full.geojson'), encoding='utf-8'))
gfe = {key(f['properties']['shapeName']): f for f in gb['features']}
adm2 = {}
for code, name in cons.items():
    f = gfe.get(key(name))
    if not f:
        raise SystemExit(f'constituency {name} not in geoBoundaries ADM2')
    g = shape(f['geometry'])
    adm2[code] = (f, g if g.is_valid else shapely.make_valid(g))
adm2_union = shapely.union_all([g for _, g in adm2.values()])
overlaps = sum(area(a.intersection(b)) for i, (_, _, a) in enumerate(src) for (_, _, b) in src[i + 1:])
ward_area = area(ward_union)
adm2_area = area(adm2_union)
cover_valid = bool(shapely.coverage_is_valid([g for _, _, g in src]))
# Each ward lies inside its own constituency (share of the ward's area inside the geoBoundaries polygon).
inside = {code: area(g.intersection(adm2[gn[code]['con_code']][1])) / area(g) for code, _, g in src}


def clean_ring(coords):
    out = []
    for x, y in coords:
        p = [round(x, PREC), round(y, PREC)]
        if not out or out[-1] != p:
            out.append(p)
    if out[0] != out[-1]:
        out.append(out[0])
    return out


def to_coords(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    res = []
    for p in polys:
        rings = [clean_ring(p.exterior.coords)] + [clean_ring(i.coords) for i in p.interiors]
        rings = [rg for rg in rings if len(rg) >= 4]
        if rings:
            res.append(rings)
    return res


def label(g):
    p = polylabel(max(g.geoms, key=lambda q: q.area) if isinstance(g, MultiPolygon) else g, 0.0005)
    return [round(p.x, PREC), round(p.y, PREC)]


cid = {c: slug(n) for c, n in cons.items()}
wid = {code: slug(w['name'].replace('/', ' ')) for code, w in gn.items()}
simp = list(shapely.coverage_simplify([g for _, _, g in src], TOLERANCE, simplify_boundary=True))
wfeat = []
for (code, rec, g0), g in zip(src, simp):
    g = g if g.is_valid else shapely.make_valid(g)
    w = gn[code]
    wfeat.append({'type': 'Feature', 'properties': {
        'ward_id': wid[code], 'ward_code': code, 'ward_name': w['name'], 'constituency_id': cid[w['con_code']], 'constituency_name': cons[w['con_code']], 'constituency_code': w['con_code'],
        'source_name': rec['ward'], 'source_subcounty': rec['subcounty'], 'source_uid': rec['uid'], 'label': label(g),
    }, 'geometry': {'type': 'MultiPolygon', 'coordinates': to_coords(g)}})
wfeat.sort(key=lambda f: f['properties']['ward_code'])

# Sub-county view: each constituency drawn as the union of its own wards (land only, and the same edges as the wards).
# The geoBoundaries constituency polygons are kept as a check only: they extend over Lake Victoria water and differ
# from the ward edges inland (checks.constituency_vs_wards).
con_geoms = {c: shapely.union_all([g for code, _, g in src if gn[code]['con_code'] == c]) for c in sorted(cons)}
csimp = list(shapely.coverage_simplify(list(con_geoms.values()), TOLERANCE, simplify_boundary=True))
cfeat = []
for c, g in zip(con_geoms, csimp):
    g = g if g.is_valid else shapely.make_valid(g)
    cfeat.append({'type': 'Feature', 'properties': {
        'ward_id': cid[c], 'ward_code': c, 'ward_name': cons[c], 'constituency_id': cid[c], 'constituency_name': cons[c], 'constituency_code': c,
        'source_name': f'union of the {sum(1 for w in gn.values() if w["con_code"] == c)} ward polygons', 'label': label(g),
    }, 'geometry': {'type': 'MultiPolygon', 'coordinates': to_coords(g)}})
con_check = [{'iebc_code': c, 'name': cons[c], 'wards_area_km2': round(area(con_geoms[c]), 1), 'geoboundaries_area_km2': round(area(adm2[c][1]), 1),
              'geoboundaries_outside_wards_km2': round(area(adm2[c][1].difference(con_geoms[c])), 1), 'wards_outside_geoboundaries_km2': round(area(con_geoms[c].difference(adm2[c][1])), 1)} for c in sorted(cons)]

ARC = {'publisher': 'American Red Cross', 'distributor': 'Humanitarian Data Exchange (HDX), OCHA', 'dataset': 'Administrative Wards in Kenya 1450', 'dataset_url': 'https://data.humdata.org/dataset/administrative-wards-in-kenya-1450',
       'resource_url': 'https://data.humdata.org/dataset/e8d06ae7-740b-4491-8749-43f81700cf41/resource/858129b2-7197-4ffe-b34f-c2091b307b2c/download/kenya_wards.zip', 'resource_sha256': sha(os.path.join(SRC, 'kenya_wards.zip')),
       'licence': 'CC BY', 'licence_url': 'https://creativecommons.org/licenses/by/4.0/', 'attribution': 'Ward boundaries: American Red Cross via HDX, CC BY, 2016',
       'vintage': '2016-03-31 (HDX dataset date); last modified on HDX 2019-04-12. Ward set matches the IEBC 2012 delimitation (35 Kisumu wards, codes 1186-1220).', 'crs': 'EPSG:4326 (WGS 84; source .prj GCS_WGS_1984, no reprojection)'}
GEOB = {'publisher': 'geoBoundaries (William & Mary geoLab)', 'dataset': 'gbOpen KEN ADM2', 'boundary_id': gb.get('boundaryID') or 'KEN-ADM2-3690345', 'upstream': 'IEBC, OCHA ROSEA', 'boundary_year_represented': '2020',
        'download_url': 'https://www.geoboundaries.org/data/snapshots/1c423398df24ddf6e730b116567d2181c9782778d0459c3f3b76ca2f9f12b6bc/gbOpen/KEN/ADM2/geoBoundaries-KEN-ADM2.geojson', 'sha256': sha(os.path.join(SRC, 'adm2_full.geojson')),
        'licence': 'CC BY 3.0 IGO', 'attribution': 'Constituency boundaries: geoBoundaries gbOpen KEN ADM2 (IEBC, OCHA ROSEA), CC BY 3.0 IGO', 'crs': 'EPSG:4326 (WGS 84)'}
SIMP = f'shapely {shapely.__version__} coverage_simplify, tolerance {TOLERANCE} degrees, shared edges kept shared; coordinates rounded to {PREC} decimals. For display only; not for measuring area or distance.'

json.dump({'type': 'FeatureCollection', 'meta': {'title': 'Kisumu County: 35 county assembly ward boundaries (simplified for display)', **ARC, 'retrieved': '2026-11-28', 'simplification': SIMP}, 'features': wfeat},
          open(os.path.join(OUT, 'wards-geo.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({'type': 'FeatureCollection', 'meta': {'title': 'Kisumu County: 7 constituencies (sub-counties), each the union of its wards (simplified for display)', **ARC, 'derivation': 'Each constituency is the union of its IEBC wards (ward polygons above, joined by IEBC code), then simplified with shared edges kept shared. Land only.', 'retrieved': '2026-11-28', 'simplification': SIMP}, 'features': cfeat},
          open(os.path.join(OUT, 'constituencies-geo.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

reg = {
    'meta': {
        'title': 'Kisumu County geographic registry: county, constituencies (sub-counties) and county assembly wards',
        'compiled': '2026-11-28', 'county': COUNTY, 'iebc_county_code': COUNTY_CODE,
        'official_name_rule': 'Ward and constituency names and codes follow IEBC Gazette Notice 13904 of 26 September 2025 (all 35 wards listed). The ward polygons carry the American Red Cross names; the crosswalk records every pair.',
        'boundary_vintage': 'IEBC delimitation of 2012 (in force for the 2013, 2017 and 2022 general elections); the 2025 gazette notice uses the same codes.',
        'scope': 'County, constituency and ward boundaries only. The City of Kisumu (the city board area) is not drawn: it is not the county, and it is not the Kisumu Central constituency. Sub-county here means the IEBC constituency, which carries the same name as the KNBS 2019 census sub-county; KNBS also lists a Kadibo sub-county with no figures, which has no IEBC equivalent.',
        'lake_rule': f'The ward polygons cover land only: the 35 wards add to {ward_area:.1f} km2 against the KNBS land area of {LAND_AREA_KM2} km2. The sub-county view joins each constituency\'s wards, so it is land only too. The geoBoundaries constituency polygons are larger ({adm2_area:.0f} km2): they extend over Lake Victoria (Winam Gulf) water off Seme, Kisumu West, Nyando and Kisumu Central and differ from the ward edges inland; they are used only as a check. No lake area is counted in any figure here.',
        'build': 'scripts/build-county-geo.py (one-off; outputs committed)',
    },
    'sources': [
        {'id': 'IEBC-GN-13904-2025', 'title': 'Kenya Gazette Special Issue Vol. CXXVII No. 201, Gazette Notice No. 13904: Registration Centres, First Schedule', 'publisher': 'Independent Electoral and Boundaries Commission', 'published': '2025-09-26',
         'url': 'https://www.iebc.or.ke/uploads/resources/r9lwR44tQK.pdf', 'sha256': sha(os.path.join(SRC, 'gn13904.pdf')), 'retrieved': '2026-11-28', 'pages': f'PDF pages {min(min(w["pages"]) for w in gn.values())}-{max(max(w["pages"]) for w in gn.values())} (Kisumu, county code 042)', 'used_for': 'all 35 ward codes and names and the 7 constituency codes and names'},
        {'id': 'IEBC-ROV-2022', 'title': 'Registered voters per constituency for the 2022 General Election', 'publisher': 'Independent Electoral and Boundaries Commission', 'published': '2022', 'url': 'https://www.iebc.or.ke/docs/rov_per_constituency.pdf',
         'sha256': sha(os.path.join(SRC, 'rov2022.pdf')), 'retrieved': '2026-11-28', 'pages': f'PDF page {voters[next(iter(voters))]["pdf_page"]}, rows 042/238-244', 'used_for': 'registered voters by constituency (values) and a cross-check of the constituency codes'},
        {'id': 'HDX-ARC-WARDS', **ARC, 'retrieved': '2026-11-28', 'used_for': 'ward polygons'},
        {'id': 'GEOB-KEN-ADM2', **GEOB, 'retrieved': '2026-11-28', 'used_for': 'check only: constituency polygons compared with the union of their wards (checks.constituency_vs_wards)'},
        {'id': 'KNBS-KPHC-2019-VOL2', 'title': '2019 Kenya Population and Housing Census Volume II', 'publisher': 'Kenya National Bureau of Statistics', 'used_for': f'official land area {LAND_AREA_KM2} km2 (Table 2.2, Kisumu row; data/counties/kisumu/population.json P01, also_printed_in)'},
    ],
    'county': {'id': 'kisumu', 'name': COUNTY, 'iebc_county_code': COUNTY_CODE, 'constitution_first_schedule_number': 42, 'constituency_ids': [cid[c] for c in sorted(cons)]},
    'constituencies': [{'id': cid[c], 'name': cons[c], 'iebc_constituency_code': c, 'parent': 'kisumu', 'knbs_sub_county_slug': cid[c], 'ward_ids': [wid[w] for w in sorted(gn) if gn[w]['con_code'] == c],
                        'registered_voters_2022': {**voters[c], 'source_id': 'IEBC-ROV-2022', 'unit': 'persons (registered voters)', 'period': '2022 General Election register', 'confidence': 4, 'read_method': 'PDF text layer'}} for c in sorted(cons)],
    'wards': [{'id': wid[w], 'name': gn[w]['name'], 'iebc_ward_code': w, 'iebc_constituency_code': gn[w]['con_code'], 'parent': cid[gn[w]['con_code']], 'gazette_pages': sorted(gn[w]['pages']),
               'source_names': {'IEBC-GN-13904-2025': gn[w]['name'], 'HDX-ARC-WARDS': next(rec['ward'] for c, rec, _ in src if c == w)}} for w in sorted(gn)],
    'crosswalk': [{'iebc_code': w, 'iebc_name': gn[w]['name'], 'polygon_name': next(rec['ward'] for c, rec, _ in src if c == w), 'polygon_sub_county': next(rec['subcounty'] for c, rec, _ in src if c == w),
                   'rule': 'alias' if ALIAS.get(key(next(rec['ward'] for c, rec, _ in src if c == w))) else 'same name after case, punctuation and the word "Ward"'} for w in sorted(gn)],
    'checks': {
        'wards': len(src), 'constituencies': len(cons), 'coverage_valid': cover_valid, 'ward_overlap_km2': round(overlaps, 3),
        'ward_area_km2': round(ward_area, 1), 'geoboundaries_constituency_area_km2': round(adm2_area, 1), 'official_land_area_km2': LAND_AREA_KM2,
        'ward_area_vs_official_pct': round(100 * (ward_area - LAND_AREA_KM2) / LAND_AREA_KM2, 2), 'geoboundaries_constituency_area_vs_official_pct': round(100 * (adm2_area - LAND_AREA_KM2) / LAND_AREA_KM2, 2),
        'min_share_of_ward_inside_geoboundaries_constituency': round(min(inside.values()), 3),
        'constituency_vs_wards': con_check,
        'area_method': 'Lambert azimuthal equal-area projection centred on the county, authalic radius 6371.0072 km, on the unsimplified polygons.',
    },
}
json.dump(reg, open(os.path.join(OUT, 'geography.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(OUT, 'geography.json'), 'a').write('\n')
print(json.dumps(reg['checks'], indent=1))
