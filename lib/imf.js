// IMF World Economic Outlook for Kenya (data/imf.json, scripts/fetch_imf.py): one series per vintage and indicator,
// never mixed across vintages. Each year keeps the IMF's own type (actual, estimate, projection); projections are
// labelled "IMF projection". Read through lib/review-status.js masked(): a value rejected in editorial review is
// removed and shown as withdrawn. Server and build only.
const rs = require('./review-status');

const imf = rs.masked('imf');
const PROJECTION_LABEL = 'IMF projection';
const TYPE_LABEL = { actual: 'Actual', estimate: 'IMF estimate', projection: PROJECTION_LABEL };
const keyOf = (x) => `${x.vintage}:${x.indicator}:${x.year}`;

// Compact data for the /kenya/ IMF section (components/ImfView.js): per vintage, per indicator, years with value,
// type and review state. No other vintage's value is ever placed in a series.
function imfViewData() {
  return {
    vintages: imf.vintages.map((v) => ({
      vintage: v.vintage, published: v.publication_date,
      indicators: v.indicators.filter((i) => i.available !== false).map((i) => {
        const pts = v.values.filter((x) => x.indicator === i.code).sort((a, b) => a.year - b.year);
        return {
          code: i.code, name: i.name, unit: i.unit, latestActual: i.latest_actual_year, sourceUrl: i.source_url,
          points: pts.map((x) => { const b = rs.badge('imf', keyOf(x)); return { year: x.year, value: x.value, type: x.type, withheld: b && b.hide ? `${b.label}: ${b.reason}` : null, key: `imf:${keyOf(x)}` }; }),
        };
      }),
    })),
    documents: imf.documents.map((d) => ({ id: d.id, title: d.title, series: d.series, date: d.date, url: d.landing_page })),
    projectionLabel: PROJECTION_LABEL,
  };
}

// Catalogue rows (/datasets/, imf-weo-kenya.csv): every value with its vintage and type.
function imfRows() {
  return imf.vintages.flatMap((v) => v.values.map((x) => {
    const i = v.indicators.find((y) => y.code === x.indicator) || {};
    const r = rs.review('imf', keyOf(x));
    return {
      indicator_code: x.indicator, indicator: i.name, vintage: x.vintage, vintage_published: v.publication_date, year: x.year, value: x.value, unit: x.unit,
      type: TYPE_LABEL[x.type] || x.type, latest_actual_year: i.latest_actual_year, source: 'IMF World Economic Outlook (SDMX 3.0 API)', source_url: x.source_url,
      retrieved: imf.meta.retrieved, review_status: r ? (r.hide ? `${r.label}: ${r.reason}` : r.label) : '',
    };
  }));
}
const IMF_COLUMNS = ['indicator_code', 'indicator', 'vintage', 'vintage_published', 'year', 'value', 'unit', 'type', 'latest_actual_year', 'source', 'source_url', 'retrieved', 'review_status'];

module.exports = { imf, imfViewData, imfRows, IMF_COLUMNS, PROJECTION_LABEL, TYPE_LABEL };
