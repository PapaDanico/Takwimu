#!/usr/bin/env python3
"""Fetch IMF World Economic Outlook (WEO) series for Kenya and build data/imf.json.

Routes tried, in order (the route that worked is recorded in meta.route):
  1. IMF DataMapper API  https://www.imf.org/external/datamapper/api/v1/<indicator>/KEN
  2. IMF SDMX 3.0 API    https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/WEO/<version>/KEN.<ind>.A
Each WEO dataflow version is a separate vintage and is kept separate.

Polite fetching: honest User-Agent "TakwimuKenya-data", back-off 30-120 s on HTTP 429, max 3 retries.
Raw responses are untrusted data: they are saved under RAW_DIR (outside the repo) and parsed as JSON only.

Year types (WEO "estimates start after" = attribute LATEST_ACTUAL_ANNUAL_DATA, per series):
  year <= latest actual                     -> actual
  latest actual < year < edition year       -> estimate (IMF staff estimate)
  year >= edition year                      -> projection
If a series has no LATEST_ACTUAL_ANNUAL_DATA, years before the edition year are "estimate" (never "actual").

Usage: python3 -I scripts/fetch_imf.py [--offline] [RAW_DIR]
  --offline rebuilds data/imf.json from raw files already in RAW_DIR (no network).
"""
import hashlib
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
OFFLINE = '--offline' in sys.argv
RAW_DIR = ARGS[0] if ARGS else '/tmp/claude-0/library/imf/sdmx'
DOC_DIR = '/tmp/claude-0/library/imf/docs'
UA = 'TakwimuKenya-data'
RETRIEVED = time.strftime('%Y-%m-%d')
FIRST_YEAR = 2010

INDICATORS = {
    'NGDP_RPCH': ('Real GDP growth', '% annual change, constant prices', 'economy'),
    'PCPIPCH': ('Inflation, average consumer prices', '% annual change, period average', 'prices'),
    'PCPIEPCH': ('Inflation, end-of-period consumer prices', '% annual change, end of period', 'prices'),
    'GGXWDG_NGDP': ('General government gross debt', '% of GDP', 'public finance'),
    'GGR_NGDP': ('General government revenue', '% of GDP', 'public finance'),
    'GGX_NGDP': ('General government total expenditure', '% of GDP', 'public finance'),
    'GGXCNL_NGDP': ('General government net lending (+) / borrowing (-)', '% of GDP', 'public finance'),
    'BCA_NGDPD': ('Current account balance', '% of GDP', 'external'),
    'NGDPD': ('GDP, current prices', 'US$ billion', 'economy'),
    'NGDPDPC': ('GDP per capita, current prices', 'US$ per person', 'economy'),
}
VERSIONS = ['9.0.0', '6.0.0']  # IMF.RES/WEO dataflow versions listed by the SDMX structure endpoint
SDMX = 'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/WEO/{v}/KEN.{i}.A?attributes=all&dimensionAtObservation=TIME_PERIOD'
DATAMAPPER = 'https://www.imf.org/external/datamapper/api/v1/{i}/KEN'
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

LICENCE = {
    'terms_url': 'https://www.imf.org/external/terms.htm',
    'statement': 'link and cite; check IMF copyright for redistribution',
    'redistribution_allowed': False,
    'imf_notice': 'IMF copyright notice served with the data: "International Monetary Fund Copyright. All Rights Reserved."',
}

# Source documents found by web search (owner instruction: WebSearch for pages and links; curl for files).
DOCUMENTS = [
    {
        'id': 'imf-cr-24-316-kenya-7th-8th-reviews',
        'title': 'Kenya: Seventh and Eighth Reviews Under the Extended Fund Facility and Extended Credit Facility Arrangements, Requests for Reduction of Access, Augmentation and Rephasing of Access Under the Arrangements, Modifications of Performance Criteria, Waiver of Nonobservance of Performance Criteria, and Review Under the Resilience and Sustainability Facility Arrangement-Press Release; Staff Report; and Statement by the Executive Director for Kenya',
        'series': 'IMF Country Report No. 24/316',
        'type': 'programme review staff report',
        'date': '2024-11-01',
        'landing_page': 'https://www.imf.org/en/publications/cr/issues/2024/11/01/kenya-seventh-and-eighth-reviews-under-the-extended-fund-facility-and-extended-credit-556994',
        'pdf_url': 'https://www.imf.org/-/media/files/publications/cr/2024/english/1kenea2024003-print-pdf.pdf',
        'alt_urls': ['https://www.elibrary.imf.org/view/journals/002/2024/316/002.2024.issue-316-en.xml'],
    },
    {
        'id': 'imf-cr-24-13-kenya-2023-article-iv',
        'title': 'Kenya: 2023 Article IV Consultation-Sixth Reviews Under the Extended Fund Facility and Extended Credit Facility Arrangements, Requests for Augmentations of Access, Modification of Performance Criteria, Waiver of Nonobservance of Performance Criteria, Waiver of Applicability of Performance Criteria, and First Review Under the Resilience and Sustainability Facility Arrangement-Press Release; Staff Report; and Statement by the Executive Director for Kenya',
        'series': 'IMF Country Report No. 24/13',
        'type': 'Article IV and programme review staff report',
        'date': '2024-01-17',
        'landing_page': 'https://www.imf.org/en/Publications/CR/Issues/2024/01/17/Kenya-2023-Article-IV-Consultation-Sixth-Reviews-Under-the-Extended-Fund-Facility-and-543889',
        'pdf_url': 'https://www.elibrary.imf.org/downloadpdf/journals/002/2024/013/002.2024.issue-013-en.pdf',
        'alt_urls': ['https://www.elibrary.imf.org/view/journals/002/2024/013/002.2024.issue-013-en.xml'],
    },
    {
        'id': 'imf-cr-23-266-kenya-5th-reviews',
        'title': 'Kenya: Fifth Reviews Under the Extended Fund Facility and Extended Credit Facility Arrangements and Request for a 20-Month Arrangement Under the Resilience and Sustainability Facility, Requests for Extension, Rephasing, and Augmentation of Access, Modification of a Performance Criterion, Waiver of Applicability for Performance Criteria and Waiver of Nonobservance for a Performance Criterion, and Monetary Policy Consultation Clause-Press Release; Staff Report; and Statement by the Executive Director for Kenya',
        'series': 'IMF Country Report No. 23/266',
        'type': 'programme review staff report',
        'date': '2023-07',
        'landing_page': 'https://www.elibrary.imf.org/view/journals/002/2023/266/article-A001-en.xml',
        'pdf_url': 'https://www.elibrary.imf.org/downloadpdf/journals/002/2023/266/002.2023.issue-266-en.pdf',
        'alt_urls': [],
    },
    {
        'id': 'imf-pr-26-071-kenya-staff-visit',
        'title': 'IMF Staff Concludes Visit to Kenya (Press Release No. 26/071)',
        'series': 'IMF Press Release 26/071',
        'type': 'press release (no staff report; programme request under discussion)',
        'date': '2026-03-04',
        'landing_page': 'https://www.imf.org/en/news/articles/2026/03/04/pr-26071-kenya-imf-staff-concludes-visit-to-kenya',
        'pdf_url': None,
        'alt_urls': [],
    },
]


def curl(url, out, accept=None):
    """Return HTTP status; body written to out. Backs off on 429."""
    for attempt in range(4):
        cmd = ['curl', '-s', '-L', '--max-time', '120', '-A', UA, '-o', out, '-w', '%{http_code}', url]
        if accept:
            cmd[1:1] = ['-H', 'Accept: ' + accept]
        code = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
        if code != '429' or attempt == 3:
            return code
        time.sleep(min(120, 30 * (attempt + 1)))
    return code


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()


def parse_sdmx(path):
    d = json.load(open(path))
    st = d['data']['structures'][0]
    ds = d['data']['dataSets'][0]
    ds_ids = [a['id'] for a in st['attributes']['dataSet']]
    ds_attr = dict(zip(ds_ids, ds.get('attributes') or []))
    pub = (ds_attr.get('PUBLICATION_DATE') or [None])[0]
    ser_dims = st['dimensions']['series']
    years = [v.get('id', v.get('value')) for v in st['dimensions']['observation'][0]['values']]
    ser_attr_defs = st['attributes'].get('series', [])
    grp_defs = st['attributes'].get('dimensionGroup', [])
    grp_vals = {}
    for key, vals in (ds.get('dimensionGroupAttributes') or {}).items():
        for a, v in zip(grp_defs, vals):
            if v is not None:
                grp_vals.setdefault(key, {})[a['id']] = v

    def resolve(adef, raw):
        if raw is None:
            return None
        if isinstance(raw, int) and adef.get('values'):
            return adef['values'][raw].get('id', adef['values'][raw].get('value'))
        if isinstance(raw, list):
            raw = raw[0] if raw else None
            if isinstance(raw, dict):
                raw = raw.get('en')
        return raw

    out = {}
    for key, s in ds['series'].items():
        idx = [int(x) for x in key.split(':')]
        ind = ser_dims[1]['values'][idx[1]]['id']
        attrs = {a['id']: resolve(a, r) for a, r in zip(ser_attr_defs, s.get('attributes', []))}
        # dimension-group attributes: match keys like "0:0::" (country, indicator) or ":0::" (indicator)
        for gk, gv in grp_vals.items():
            parts = gk.split(':')
            if all(p == '' or int(p) == idx[n] for n, p in enumerate(parts[:3])):
                for k, v in gv.items():
                    attrs.setdefault(k, resolve({}, v))
        obs = {years[int(k)]: (None if v[0] in (None, '', 'NA') else float(v[0])) for k, v in s['observations'].items()}
        out[ind] = {'attrs': attrs, 'obs': obs}
    return pub, out


def edition_from(pub):
    y, m = int(pub[:4]), int(pub[5:7])
    return y, ('April' if m <= 6 else 'October') + ' ' + str(y)


def year_type(year, latest_actual, ed_year):
    if year >= ed_year:
        return 'projection'
    if latest_actual is not None and year <= latest_actual:
        return 'actual'
    return 'estimate'


def build_vintages(route_log):
    vintages = []
    for v in VERSIONS:
        raw = os.path.join(RAW_DIR, 'weo_%s_KEN.json' % v)
        url = SDMX.format(v=v, i='+'.join(INDICATORS))
        if not OFFLINE:
            code = curl(url, raw, 'application/vnd.sdmx.data+json;version=2.0.0')
            route_log.append({'route': 'IMF SDMX 3.0 API (api.imf.org)', 'url': url, 'http_status': code})
            if code != '200':
                continue
            time.sleep(5)
        if not os.path.exists(raw):
            continue
        pub, series = parse_sdmx(raw)
        ed_year, edition = edition_from(pub)
        values, inds = [], []
        for code_, (name, unit, sector) in INDICATORS.items():
            if code_ not in series:
                inds.append({'code': code_, 'name': name, 'unit': unit, 'available': False})
                continue
            s = series[code_]
            la = s['attrs'].get('LATEST_ACTUAL_ANNUAL_DATA')
            la = int(la) if la not in (None, '') else None
            ind_url = SDMX.format(v=v, i=code_)
            inds.append({
                'code': code_, 'name': name, 'unit': unit, 'sector': sector, 'available': True,
                'latest_actual_year': la,
                'reporting_year': s['attrs'].get('START_END_MONTHS_OF_REPORTING_YEAR'),
                'country_update_date': s['attrs'].get('COUNTRY_UPDATE_DATE'),
                'methodology': s['attrs'].get('METHODOLOGY'),
                'base_year': s['attrs'].get('BASE_YEAR'),
                'scale': s['attrs'].get('SCALE'),
                'source_url': ind_url,
            })
            for y, val in sorted(s['obs'].items()):
                yi = int(y)
                if yi < FIRST_YEAR:
                    continue
                values.append({'indicator': code_, 'year': yi, 'value': val, 'unit': unit, 'vintage': edition,
                               'type': year_type(yi, la, ed_year), 'source_url': ind_url})
        vintages.append({
            'vintage': edition, 'sdmx_dataflow': 'IMF.RES/WEO', 'sdmx_version': v, 'publication_date': pub[:10],
            'edition_year': ed_year, 'raw_file': os.path.basename(raw), 'raw_sha256': sha256(raw),
            'indicators': inds, 'values': values,
        })
    return vintages


def try_datamapper(route_log):
    if OFFLINE:
        return
    for i in list(INDICATORS)[:1]:  # probe one indicator only; do not hammer a blocked endpoint
        out = os.path.join(RAW_DIR, 'datamapper_probe_%s.txt' % i)
        code = curl(DATAMAPPER.format(i=i), out)
        route_log.append({'route': 'IMF DataMapper API', 'url': DATAMAPPER.format(i=i), 'http_status': code,
                          'note': 'Access Denied (Akamai edge) from this environment' if code == '403' else None})


def fetch_documents():
    docs = []
    for d in DOCUMENTS:
        rec = dict(d)
        rec.update({'publisher': 'International Monetary Fund', 'licence': LICENCE, 'sha256': None,
                    'retrieved': None, 'download_status': None})
        if d['pdf_url'] and not OFFLINE:
            folder = os.path.join(DOC_DIR, d['id'])
            os.makedirs(folder, exist_ok=True)
            out = os.path.join(folder, 'document.pdf')
            code = curl(d['pdf_url'], out)
            ok = code == '200' and open(out, 'rb').read(5) == b'%PDF-'
            if ok:
                rec.update({'sha256': sha256(out), 'retrieved': RETRIEVED, 'download_status': 'downloaded (HTTP 200)'})
            else:
                rec['download_status'] = 'not downloaded: HTTP %s (access denied by IMF edge/CDN from this environment); sha256 pending' % code
                os.remove(out) if os.path.exists(out) else None
            time.sleep(5)
        elif not d['pdf_url']:
            rec['download_status'] = 'web page only; no PDF'
        else:
            rec['download_status'] = 'offline rebuild; see previous run'
        docs.append(rec)
    return docs


# ---- cross-checks against World Bank (data/national.json) and CBK (data/cbk.json) ----
def load(name):
    return json.load(open(os.path.join(ROOT, 'data', name)))


def lookup_other(ref, national, cbk):
    """Return value for a reference {file, series, year, field, scale, ratio_of}; None if absent."""
    if ref['file'] == 'national.json':
        ind = next((i for i in national['indicators'] if i['code'] == ref['series']), None)
        if not ind:
            return None
        v = next((p['value'] for p in ind['series'] if p['year'] == ref['year']), None)
        return None if v is None else v / ref.get('divisor', 1)
    s = cbk['series'].get(ref['series'])
    if not s:
        return None
    if ref.get('month'):
        v = (s.get('monthly') or {}).get(ref['month'])
    else:
        v = (s.get('annual') or {}).get(str(ref['year']))
    if v is None:
        return None
    if ref.get('ratio_of'):
        den = lookup_other(ref['ratio_of'], national, cbk)
        return None if not den else 100.0 * v / den
    return v


PAIRS = [
    ('NGDP_RPCH', 'national.json', 'NY.GDP.MKTP.KD.ZG', 'points', {}),
    ('NGDP_RPCH', 'cbk.json', 'gdp_real_growth', 'points', {}),
    ('PCPIPCH', 'national.json', 'FP.CPI.TOTL.ZG', 'points', {}),
    ('PCPIPCH', 'cbk.json', 'inflation_annual_average', 'points', {'note': 'CBK annual = December value of the annual-average rate'}),
    ('PCPIEPCH', 'cbk.json', 'inflation_12_month', 'points', {'month': True, 'note': 'CBK December 12-month rate'}),
    ('GGR_NGDP', 'national.json', 'GC.REV.XGRT.GD.ZS', 'points', {'note': 'Definitions differ: WB central government revenue excluding grants; IMF general government revenue including grants, Kenya fiscal year July-June'}),
    ('GGX_NGDP', 'national.json', 'GC.XPN.TOTL.GD.ZS', 'points', {'note': 'Definitions differ: WB central government expense (excludes net acquisition of non-financial assets); IMF general government total expenditure, fiscal year'}),
    ('GGXWDG_NGDP', 'cbk.json', 'public_debt_total', 'points', {'derived': True, 'note': 'Derived for comparison only: CBK December public debt / CBK calendar-year nominal GDP x 100; IMF series is fiscal-year general government gross debt'}),
    ('NGDPD', 'national.json', 'NY.GDP.MKTP.CD', 'percent', {'divisor': 1e9}),
    ('NGDPDPC', 'national.json', 'NY.GDP.PCAP.CD', 'percent', {}),
]
THRESHOLD = 0.5


def build_comparisons(vintage, national, cbk):
    comps = []
    by = {(x['indicator'], x['year']): x for x in vintage['values']}
    for ind, file_, series, basis, opt in PAIRS:
        for (i, y), x in sorted(by.items()):
            if i != ind or x['type'] == 'projection' or x['value'] is None:
                continue
            ref = {'file': file_, 'series': series, 'year': y}
            if opt.get('month'):
                ref['month'] = '%d-12' % y
            if opt.get('divisor'):
                ref['divisor'] = opt['divisor']
            if opt.get('derived'):
                ref['month'] = '%d-12' % y
                ref['ratio_of'] = {'file': 'cbk.json', 'series': 'gdp_nominal', 'year': y}
            other = lookup_other(ref, national, cbk)
            if other is None:
                continue
            if basis == 'points':
                diff = x['value'] - other
            else:
                diff = 100.0 * (x['value'] - other) / other
            comps.append({
                'imf_indicator': ind, 'vintage': vintage['vintage'], 'year': y, 'imf_type': x['type'],
                'imf_value': x['value'], 'other': ref,
                'other_label': ('World Bank WDI ' if file_ == 'national.json' else 'CBK ') + series,
                'other_value': round(other, 6), 'difference_basis': basis,
                'difference': round(diff, 6), 'threshold': THRESHOLD,
                'candidate_conflict': abs(diff) > THRESHOLD, 'note': opt.get('note'),
            })
    return comps


def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    route_log = []
    prev = {}
    out_path = os.path.join(ROOT, 'data', 'imf.json')
    if OFFLINE and os.path.exists(out_path):
        prev = json.load(open(out_path))
        route_log = prev.get('meta', {}).get('routes_tried', [])
    try_datamapper(route_log)
    vintages = build_vintages(route_log)
    if not vintages:
        sys.exit('No WEO vintage could be fetched; nothing written.')
    docs = prev.get('documents') if OFFLINE and prev.get('documents') else fetch_documents()
    national, cbk = load('national.json'), load('cbk.json')
    latest = max(vintages, key=lambda v: v['publication_date'])
    comps = build_comparisons(latest, national, cbk)
    data = {
        'meta': {
            'title': 'Kenya: IMF World Economic Outlook indicators and IMF staff documents',
            'country': 'Kenya', 'iso3': 'KEN',
            'retrieved': prev.get('meta', {}).get('retrieved', RETRIEVED) if OFFLINE else RETRIEVED,
            'schema_version': '1.0', 'source_id': 'imf-weo-sdmx',
            'publisher': 'International Monetary Fund, Research Department (World Economic Outlook)',
            'route': 'IMF SDMX 3.0 API at api.imf.org (DataMapper API and imf.org pages returned HTTP 403 Access Denied)',
            'routes_tried': route_log,
            'licence': LICENCE,
            'citation': 'International Monetary Fund. World Economic Outlook (WEO), https://data.imf.org/en/datasets/IMF.RES:WEO.',
            'rule': 'Values as served by the IMF SDMX API for each WEO vintage; vintages are kept separate. Type per year from the WEO latest-actual-year attribute: actual up to it, estimate after it and before the edition year, projection from the edition year on. Projections are never labelled actual. Missing values stay null.',
            'type_rule': {'actual': 'year <= latest_actual_year', 'estimate': 'latest_actual_year < year < edition_year (or no latest_actual_year given)', 'projection': 'year >= edition_year'},
            'first_year': FIRST_YEAR,
        },
        'vintages': sorted(vintages, key=lambda v: v['publication_date'], reverse=True),
        'documents': docs,
        'comparisons': comps,
        'comparison_rule': 'Latest vintage only, actual and estimate years only. difference = IMF minus other (points for rates and ratios; percent of the other value for US$ levels). candidate_conflict when |difference| > threshold. Candidates are not entered in conflicts.json.',
    }
    with open(out_path, 'w') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write('\n')
    n = sum(len(v['values']) for v in vintages)
    print('wrote %s: %d vintages, %d values, %d comparisons (%d candidates), %d documents' % (
        out_path, len(vintages), n, len(comps), sum(c['candidate_conflict'] for c in comps), len(docs)))


if __name__ == '__main__':
    main()
