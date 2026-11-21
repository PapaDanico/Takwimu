// View choices in the address without a reload (as on /compare/), for client components that also render in the
// static HTML: read after load, write with replaceState. Nothing is stored or sent.
export function readParams(keys) {
  const p = new URLSearchParams(window.location.search);
  return Object.fromEntries(keys.map((k) => [k, p.get(k) || '']));
}
export function writeParams(patch) {
  const p = new URLSearchParams(window.location.search);
  Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
  const qs = p.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
}
