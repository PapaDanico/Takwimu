// "Saved views": the address (path and query) of a view, kept only in this browser's localStorage. No account,
// no server, no tracking. Every storage call is wrapped, so private windows and blocked storage simply report
// that saving is unavailable and the page keeps working.
const KEY = 'takwimu:saved-views';
const MAX = 50;

export function storageAvailable() {
  try {
    const k = `${KEY}:test`;
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) { return false; }
}

export function loadViews() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((v) => v && typeof v.url === 'string' && v.url.startsWith('/') && typeof v.title === 'string') : [];
  } catch (e) { return []; }
}

function write(list) {
  try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); return true; } catch (e) { return false; }
}

// Returns 'saved', 'exists' or 'unavailable'.
export function saveView(view) {
  if (!storageAvailable()) return 'unavailable';
  const list = loadViews();
  if (list.some((v) => v.url === view.url)) return 'exists';
  return write([{ url: view.url, title: view.title, saved: view.saved }, ...list]) ? 'saved' : 'unavailable';
}

export function removeView(url) {
  return write(loadViews().filter((v) => v.url !== url));
}
