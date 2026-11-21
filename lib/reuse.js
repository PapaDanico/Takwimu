// Reuse terms of one value's own source (sweep N4): the source library record for the value's URL (the exact URL, or
// else its host) says whether figures may go into bulk downloads. A value whose source is "link and cite only" (IMF)
// or "permission required" is blanked in every bulk file; the row keeps its citation and link. Server and build only.
const lib = require('../data/source-library.json').documents;

const ALLOWED = 'figures may be reused with citation';
const host = (u) => { try { return new URL(u).hostname; } catch (e) { return null; } };

// The data_reuse of a URL's source, or null when no source library record covers it.
function reuseOf(url) {
  if (!url) return null;
  const exact = lib.find((d) => d.source_url === url);
  if (exact) return exact.data_reuse;
  const h = host(url);
  const same = lib.filter((d) => h && host(d.source_url) === h);
  if (!same.length) return null;
  return same.some((d) => d.data_reuse === ALLOWED) ? ALLOWED : same[0].data_reuse;
}
const mayRedistribute = (url) => { const r = reuseOf(url); return !r || r === ALLOWED; };
const withheldNote = (url) => `Value not redistributed: the source is "${reuseOf(url)}". View and cite it at the link.`;

// The conflict register as bulk files carry it (public/data/conflicts.json, source-conflicts.csv, history.csv).
function bulkConflicts(conf) {
  return {
    ...conf,
    conflicts: conf.conflicts.map((c) => ({
      ...c,
      values: c.values.map((v) => (mayRedistribute(v.url) ? v : { ...v, value: null, value_withheld: withheldNote(v.url) })),
    })),
  };
}

module.exports = { ALLOWED, reuseOf, mayRedistribute, withheldNote, bulkConflicts };
