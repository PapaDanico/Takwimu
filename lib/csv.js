// CSV helpers shared by the build (static downloads) and the browser (downloads of exactly what a view shows).
// CommonJS so Node scripts and Next.js both load it. Every cell is quoted; empty for null or undefined.
const cell = (v) => (v === undefined || v === null ? '' : `"${String(v).replace(/"/g, '""')}"`);

function toCSV(rows, columns) {
  const cols = columns || [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols.map(cell).join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

module.exports = { toCSV };
