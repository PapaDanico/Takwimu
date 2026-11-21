// One-off import (21 Nov 2026) of the verified staging files into data/. Values are copied unchanged: nothing is
// filled, rounded or recomputed. Doubtful and blank cells stay null with their status, note and raw OCR reading.
// Usage: node scripts/import-staging.js <staging-dir>   (the staging folder is not kept in the repository)
const fs = require('fs');
const path = require('path');
const { COUNTIES } = require('../lib/counties');

const dir = process.argv[2];
if (!dir) { console.error('Usage: node scripts/import-staging.js <staging-dir>'); process.exit(2); }
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const out = (f, d) => { fs.writeFileSync(path.join(__dirname, '..', 'data', f), JSON.stringify(d, null, 1) + '\n'); console.log('wrote data/' + f); };

// ---- National: World Bank WDI ----
const n = read('national.json');
out('national.json', {
  meta: {
    title: 'Kenya: national indicators from the World Bank World Development Indicators',
    country: n.country, iso3: n.iso3, period: n.period, retrieved: n.retrieved, source_id: 'worldbank-wdi-api', schema_version: '1.0',
    rule: 'Values are as served by the World Bank API on the retrieval date. Missing years are listed in missing_years and are never filled. Modelled or estimated series say so in modelled_or_estimated_note.',
    gaps: n.gaps,
  },
  indicators: n.indicators.map(({ raw_file, ...x }) => ({ ...x, source_id: 'worldbank-wdi-api' })),
});

// ---- Counties: Controller of Budget annual county reports, two years ----
const ids = { '2024/25': 'cob-report-2024-25', '2023/24': 'cob-report-2023-24' };
const offset = { '2024/25': 43, '2023/24': 23 };
const year = (file, fy) => {
  const d = read(file);
  const { sha256_verified_against, ...source } = d.source;
  return {
    fy,
    source_id: ids[fy],
    source: { ...source, sha256_verified_against: 'data/source-manifest.json' },
    printed_page_offset: offset[fy],
    reading_method: d.reading_method,
    counties: d.counties.map((c) => {
      const k = COUNTIES.find((x) => x.code === c.code);
      if (!k || k.name !== c.name) throw new Error(`county ${c.code} ${c.name} does not match lib/counties.js`);
      return { code: c.code, name: c.name, slug: k.slug, ...Object.fromEntries(Object.entries(c).filter(([key]) => !['code', 'name'].includes(key))) };
    }),
    total_row: d.total_row,
    checks: d.checks,
    siaya_vs_history_json: d.siaya_vs_history_json,
  };
};
out('counties-cob.json', {
  meta: {
    title: "Kenya's 47 counties: budget, spending, absorption, own-source revenue and pending bills (Controller of Budget annual reports)",
    unit: 'KSh million, except percentages',
    retrieved: '2026-11-21',
    schema_version: '1.0',
    rule: 'Every value carries its table, PDF page, printed page and how it was read. All values were read by OCR (RapidOCR) from scanned pages. A null value has a status (blank or doubtful) and a note; doubtful readings keep the raw OCR text. The derived block holds percentages computed from printed amounts for reference only; they are never used as values.',
    fields: read('counties-fy2024-25.json').fields,
  },
  years: [year('counties-fy2024-25.json', '2024/25'), year('counties-fy2023-24.json', '2023/24')],
});
