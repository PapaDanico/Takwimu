const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-11-20" -> "20 Nov 2026" without time zone surprises.
export function shortDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Numbers as the reports print them: up to two decimals, no trailing zeros.
export const fmt = (v) => String(Number(Number(v).toFixed(2)));
