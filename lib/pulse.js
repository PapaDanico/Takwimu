// Siaya Fiscal Pulse (/counties/siaya/pulse/): three insights computed from the Siaya ten-year series
// (data/history.json), each with the document, page, period, unit and confidence of every figure it uses.
// Only spending amounts are used: no open case in the conflict register concerns them (checked in
// scripts/test-explore.js). Nominal shillings; nothing is filled or estimated. Server and build only.
const hist = require('../data/history.json');
const manifest = require('../data/source-manifest.json');

const docs = Object.fromEntries(manifest.documents.map((d) => [d.id, d]));
const byFy = Object.fromEntries(hist.years.map((y) => [y.fy, y]));
const FIRST = '2014/15'; // first full year with a printed total (FY 2013/14 covers 16 months)
const LATEST = '2024/25';
const FYS = hist.years.map((y) => y.fy).filter((fy) => fy >= FIRST).sort();
const FIELDS = { spent: 'Total spending', recurrent_spent: 'Recurrent spending', development_spent: 'Development spending' };

// One figure with everything needed to cite it.
function fig(fy, key) {
  const y = byFy[fy];
  const rep = hist.reports[(y.field_source && y.field_source[key]) || y.report];
  const ref = y.provenance[key];
  const doc = docs[ref.source_id];
  return {
    fy, key, label: FIELDS[key], value: y[key], unit: 'KSh billion', period: `FY ${fy} (1 July ${fy.slice(0, 4)} to 30 June ${Number(fy.slice(0, 4)) + 1})`,
    report: rep.title, section: rep.section, confidence: rep.confidence, page: ref.page, printed_page: ref.printed_page || null, read: ref.read,
    pdf_url: doc.file_url || doc.url, item_url: doc.url, source_id: ref.source_id,
  };
}

function insights() {
  const withVal = (key) => FYS.filter((fy) => typeof byFy[fy][key] === 'number');
  const gaps = FYS.filter((fy) => typeof byFy[fy].spent !== 'number');
  const a = fig(FIRST, 'spent'); const b = fig(LATEST, 'spent');
  const devYears = withVal('development_spent');
  const devMax = devYears.reduce((m, fy) => (byFy[fy].development_spent > byFy[m].development_spent ? fy : m), devYears[0]);
  const recYears = withVal('recurrent_spent');
  const r = recYears.slice(-3).map((fy) => fig(fy, 'recurrent_spent'));
  return {
    first: FIRST, latest: LATEST, gaps,
    items: [
      {
        id: 'total',
        title: `Total spending was KSh ${b.value.toFixed(2)} billion in FY ${LATEST}`,
        text: `That compares with KSh ${a.value.toFixed(2)} billion in FY ${FIRST}, in shillings of each year. The figures are not adjusted for prices, so part of the difference reflects inflation.`,
        figures: [b, a],
      },
      {
        id: 'development',
        title: `Development spending of KSh ${byFy[devMax].development_spent.toFixed(2)} billion in FY ${devMax} is the largest in the series`,
        text: `Development spending pays for projects such as roads, water and buildings. The comparison covers the ${devYears.length} years with a figure from FY ${FIRST} to FY ${LATEST}${gaps.length ? `; FY ${gaps.join(' and FY ')} is a gap in the source reports and is not filled` : ''}.`,
        figures: [fig(devMax, 'development_spent')],
        holds: devMax === LATEST,
      },
      {
        id: 'recurrent',
        title: `Recurrent spending was lower in FY ${r[2].fy} than in each of the two years before`,
        text: `Recurrent spending covers salaries and running costs: KSh ${r[0].value.toFixed(2)} billion in FY ${r[0].fy}, KSh ${r[1].value.toFixed(2)} billion in FY ${r[1].fy} and KSh ${r[2].value.toFixed(2)} billion in FY ${r[2].fy}. The reports do not say why; the figures describe what was spent, not whether it was enough.`,
        figures: [r[2], r[1], r[0]],
        holds: r[2].value < r[1].value && r[1].value < r[0].value,
      },
    ],
    chart: {
      labels: FYS.map((fy) => `FY ${fy}`),
      series: Object.keys(FIELDS).map((k) => ({ key: k, name: FIELDS[k], values: FYS.map((fy) => (typeof byFy[fy][k] === 'number' ? byFy[fy][k] : null)) })),
    },
  };
}

module.exports = { insights, fig, FIELDS, FIRST, LATEST };
