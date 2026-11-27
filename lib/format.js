// Shared number and date formatting (CommonJS so node scripts and pages use the same code).
// Every helper is a thin wrapper over toLocaleString('en-US'); the options are exactly the
// ones the pages used before they shared this file, so no printed value changes.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-11-20" -> "20 Nov 2026" without time zone surprises.
function shortDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Numbers as the reports print them: up to two decimals, no trailing zeros.
const fmt = (v) => String(Number(Number(v).toFixed(2)));

// Thousands separators. dp = maximum decimals (toLocaleString's default of 3 when omitted);
// minDp = minimum decimals (0 when omitted).
function fmtNum(v, opts = {}) {
  const o = {};
  if (opts.minDp !== undefined) o.minimumFractionDigits = opts.minDp;
  if (opts.dp !== undefined) o.maximumFractionDigits = opts.dp;
  return v.toLocaleString('en-US', Object.keys(o).length ? o : undefined);
}
// Exactly d decimals: 1,234.50
const fmtFixed = (v, d) => fmtNum(v, { minDp: d, dp: d });
// Rounded to a whole number: 1,235
const fmtInt = (v) => fmtNum(Math.round(v));
// "KSh 1,234.5" (at most dp decimals)
const fmtKsh = (v, dp = 2) => `KSh ${fmtNum(v, { dp })}`;
// "12.3%" (at most dp decimals)
const fmtPct = (v, dp = 1) => `${fmtNum(v, { dp })}%`;
// Numbers formatted, anything else (text, a dash) passed through.
const fmtMaybe = (v, opts) => (typeof v === 'number' ? fmtNum(v, opts) : v);

module.exports = { MONTHS, shortDate, fmt, fmtNum, fmtFixed, fmtInt, fmtKsh, fmtPct, fmtMaybe };
