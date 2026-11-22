#!/usr/bin/env python3
# One-off: builds data/siaya-wards-geo.json (Siaya's 30 county assembly wards) from the HDX ward shapefile.
# The output is committed, so the normal build needs no network and no Python.
#
# Usage (run with -I; the inputs are untrusted downloads and are only read, never executed):
#   python3 -I scripts/build-siaya-wards-geo.py ARC_SHP_BASE FAO_SHP_BASE GEOB_ADM2_GEOJSON
#   ARC_SHP_BASE      .../hdx-wards/arc/Kenya_Wards/kenya_wards     (HDX administrative-wards-in-kenya-1450)
#   FAO_SHP_BASE      ".../hdx-wards/fao/Kenya wards"               (HDX kenya-admin-level-3-wards, cross-check only)
#   GEOB_ADM2_GEOJSON .../hdx-wards/geob/adm2_simplified.geojson    (geoBoundaries KEN ADM2, the layer behind
#                                                                    data/siaya-boundaries.json; county bbox only)
# Needs: pip install pyshp shapely (shapely >= 2.1 for coverage_simplify).
import hashlib
import json
import os
import sys

import shapefile
import shapely
from shapely.geometry import shape, MultiPolygon
from shapely.ops import polylabel

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'data', 'siaya-wards-geo.json')
PREC = 4            # decimal places of a degree (about 11 m)
TOLERANCE = 0.0012  # coverage simplification tolerance in degrees (about 130 m); chosen to keep the file < 150 KB

arc_base, fao_base, geob_path = sys.argv[1:4]


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def norm(s):
    return ' '.join(s.replace('-', ' ').split()).lower()


reg = json.load(open(os.path.join(ROOT, 'data', 'siaya-geography.json'), encoding='utf-8'))
cons = {c['id']: c for c in reg['constituencies']}
by_name = {}
for w in reg['wards']:
    for n in filter(None, [w['name']] + [a['name'] for a in w.get('aliases', [])] + list(w.get('source_names', {}).values())):
        by_name.setdefault(norm(n), set()).add(w['id'])
wards = {w['id']: w for w in reg['wards']}

# ---- Primary layer: American Red Cross via HDX ----
r = shapefile.Reader(arc_base, encoding='utf-8')
prj = open(arc_base + '.prj').read()
if 'WGS_1984' not in prj or 'GEOGCS' not in prj or 'PROJCS' in prj:
    raise SystemExit('unexpected CRS in .prj; reprojection would be needed: ' + prj)
src = []
for sr in r.iterShapeRecords():
    rec = sr.record.as_dict()
    if rec['county'] != 'Siaya':
        continue
    g = shape(sr.shape.__geo_interface__)
    if not g.is_valid:
        g = shapely.make_valid(g)
    src.append((rec, g))
if len(src) != 30:
    raise SystemExit(f'expected 30 Siaya wards in source, found {len(src)}')

# Match to the registry by name and constituency; never force a match.
unmatched, matched = [], []
for rec, g in src:
    raw = rec['ward']
    nm = raw[:-5] if raw.endswith(' Ward') else raw
    con_src = rec['subcounty'].replace(' Sub County', '')
    ids = by_name.get(norm(nm), set())
    ids = {i for i in ids if cons[wards[i]['parent']]['name'] == con_src}
    if len(ids) != 1:
        unmatched.append({'source_name': raw, 'source_subcounty': rec['subcounty'], 'candidates': sorted(ids)})
        continue
    matched.append((wards[ids.pop()], rec, nm, g))
if unmatched:
    print('UNMATCHED', json.dumps(unmatched, indent=1))
    raise SystemExit('unmatched wards; record aliases in the registry rather than forcing a match')

# ---- Topology-preserving simplification (shared edges stay shared) ----
geoms = [m[3] for m in matched]
print('coverage valid before:', bool(shapely.coverage_is_valid(geoms)))
simp = list(shapely.coverage_simplify(geoms, TOLERANCE, simplify_boundary=True))


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


# ---- Cross-check layer: FAO via HDX (spatial overlap with the same-code or best-overlap polygon) ----
fr = shapefile.Reader(fao_base, encoding='latin-1')
fao = []
for sr in fr.iterShapeRecords():
    rec = sr.record.as_dict()
    if rec['FIRST_DIST'] not in ('Siaya', 'Bondo'):
        continue
    try:
        g = shape(sr.shape.__geo_interface__)
    except Exception:
        continue
    if g.is_empty:
        continue
    fao.append((rec, shapely.make_valid(g) if not g.is_valid else g))

# ---- County bbox from the geoBoundaries ADM2 layer behind data/siaya-boundaries.json ----
gb = json.load(open(geob_path, encoding='utf-8'))
CON_NAMES = {'Alego Usonga', 'Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja'}
gfe = [f for f in gb['features'] if f['properties']['shapeName'] in CON_NAMES]
if len(gfe) != 6:
    raise SystemExit('expected 6 geoBoundaries constituencies')
county = shapely.union_all([shape(f['geometry']) for f in gfe])
cb = [round(v, 4) for v in county.bounds]

features = []
for (w, rec, nm, g0), g in zip(matched, simp):
    if not g.is_valid:
        g = shapely.make_valid(g)
    coords = to_coords(g)
    lab = polylabel(max(g.geoms, key=lambda p: p.area) if isinstance(g, MultiPolygon) else g, 0.0005)
    best = None
    for frec, fg in fao:
        inter = g0.intersection(fg).area
        if inter <= 0:
            continue
        iou = inter / g0.union(fg).area
        if not best or iou > best[0]:
            best = (iou, frec)
    c = cons[w['parent']]
    features.append({
        'type': 'Feature',
        'properties': {
            'ward_id': w['id'],
            'ward_code': w['iebc_ward_code'],
            'ward_name': w['name'],
            'constituency_id': c['id'],
            'constituency_name': c['name'],
            'constituency_code': c['iebc_constituency_code'],
            'source_name': rec['ward'],
            'source_subcounty': rec['subcounty'],
            'source_uid': rec['uid'],
            'label': [round(lab.x, PREC), round(lab.y, PREC)],
            'crosscheck_fao': None if not best else {
                'name': best[1]['IEBC_WARDS'].strip(),
                'code': None if best[1]['NO'] is None else str(best[1]['NO']),
                'iou': round(best[0], 3),
            },
        },
        'geometry': {'type': 'MultiPolygon', 'coordinates': coords},
    })
features.sort(key=lambda f: f['properties']['ward_code'])

meta = {
    'title': 'Siaya County: 30 county assembly ward boundaries (simplified for display)',
    'publisher': 'American Red Cross',
    'distributor': 'Humanitarian Data Exchange (HDX), OCHA',
    'dataset': 'Administrative Wards in Kenya 1450',
    'dataset_url': 'https://data.humdata.org/dataset/administrative-wards-in-kenya-1450',
    'resource_url': 'https://data.humdata.org/dataset/e8d06ae7-740b-4491-8749-43f81700cf41/resource/858129b2-7197-4ffe-b34f-c2091b307b2c/download/kenya_wards.zip',
    'resource_sha256': sha(os.path.join(os.path.dirname(os.path.dirname(arc_base)), 'kenya_wards.zip')),
    'licence': 'CC BY',
    'licence_text': 'Creative Commons Attribution International (CC BY)',
    'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
    'attribution': 'Ward boundaries: American Red Cross via HDX, CC BY, 2016',
    'source_caveat': 'Data abstracted from different sources including National Land Commission/IEBC & SOK then cleaned for topological errors and verified with county teams from > 20 counties. Data also triangulated with DHIS2 to include unique ids (HDX caveats field, quoted).',
    'vintage': '2016-03-31 (HDX dataset date); last modified on HDX 2019-04-12. Ward set matches the IEBC 2012 delimitation (30 wards, codes 1156-1185).',
    'retrieved': '2026-11-21',
    'crs': 'EPSG:4326 (WGS 84 longitude, latitude; source .prj is GCS_WGS_1984, no reprojection needed)',
    'simplification': f'shapely coverage_simplify, tolerance {TOLERANCE} degrees, shared edges kept shared; coordinates rounded to {PREC} decimals. For display only; not for measuring area or distance.',
    'county_bbox': cb,
    'county_bbox_source': 'Bounds [west, south, east, north] of the six Siaya constituencies in geoBoundaries gbOpen KEN ADM2 (KEN-ADM2-3690345), the layer data/siaya-boundaries.json was drawn from. Projecting this bbox with scripts/make-siaya-map.js gives the extent of that file.',
    'crosscheck': {
        'dataset': 'kenya-admin-level-3-wards',
        'dataset_url': 'https://data.humdata.org/dataset/kenya-admin-level-3-wards',
        'publisher': 'FAO (organisation on HDX: OCHA ROSEA)',
        'licence': 'CC BY',
        'resource_sha256': sha(os.path.join(os.path.dirname(fao_base), 'kenya_wards.zip')),
        'vintage': '2016-01-01 (HDX dataset date)',
        'caveat': 'This dataset is not an official administrative layer from the authorities. Digitized from digital PDF maps by FAO Kenya. Shapefile has no .prj; coordinates are degrees, read as WGS 84.',
        'method': 'For each ward, the FAO polygon with the largest intersection-over-union with the unsimplified American Red Cross polygon. Not used for geometry.',
    },
}
out = {'type': 'FeatureCollection', 'meta': meta, 'features': features}
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print('written', OUT, os.path.getsize(OUT), 'bytes', len(features), 'features; county bbox', cb)
for f in features:
    p = f['properties']
    x = p['crosscheck_fao']
    print(p['ward_code'], p['ward_name'], '|', p['source_name'], '| FAO:', x and (x['name'], x['code'], x['iou']))
