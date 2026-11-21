// CSV helpers shared by the build (static downloads) and the browser (downloads of exactly what a view shows).
// CommonJS so Node scripts and Next.js both load it. Every cell is quoted; empty for null or undefined.
// Text that a spreadsheet would run as a formula (=, +, -, @ at the start) gets a leading apostrophe; numbers stay as they are.
const safe = (v) => (typeof v !== 'number' && /^[=+\-@\t\r]/.test(String(v)) && Number.isNaN(Number(v)) ? `'${v}` : String(v));
const cell = (v) => (v === undefined || v === null ? '' : `"${safe(v).replace(/"/g, '""')}"`);

function toCSV(rows, columns) {
  const cols = columns || [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols.map(cell).join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

module.exports = { toCSV };
