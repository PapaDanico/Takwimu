// Reader wording for text that comes from the data files (owner decision U4, 21 Nov 2026): "own-source revenue", never
// "OSR"; "share of budget spent", never "execution rate". Source table names quoted in the data keep their own wording
// inside quotation marks. Display only: the data files, and so the report snapshots, are unchanged.
const cap = (to) => (m) => (m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
const RULES = [
  [/\bOSR\b/g, () => 'own-source revenue'],
  [/\b[Bb]udget execution rates?\b/g, cap('share of budget spent')],
  [/\b[Ee]xecution rates?\b/g, cap('share of budget spent')],
  [/\b[Ee]xecution\b/g, cap('share of budget spent')],
];
function plain(s) {
  if (typeof s !== 'string') return s;
  // Odd parts are quoted ("..." or “...”) and kept as printed.
  return s.split(/("[^"]*"|“[^”]*”)/).map((part, i) => (i % 2 ? part : RULES.reduce((t, [re, to]) => t.replace(re, to), part))).join('');
}
// Every reader string in a data object; identifiers, keys and addresses are left alone.
const SKIP = /(^|_)(id|ids|key|keys|url|href|slug|file|sha256|calc_id|source_id|source_ids|record|dataset|op|role|status|kind|family|measure)$/;
function plainDeep(x, k = '') {
  if (typeof x === 'string') return SKIP.test(k) ? x : plain(x);
  if (Array.isArray(x)) return x.map((v) => plainDeep(v, k));
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([kk, v]) => [kk, plainDeep(v, kk)]));
  return x;
}
module.exports = { plain, plainDeep };
