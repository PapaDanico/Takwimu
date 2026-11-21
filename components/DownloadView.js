'use client';
// Downloads of exactly what a view shows, built in the browser from the rows on screen (no server).
import { toCSV } from '../lib/csv';

function save(name, type, text) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// rows: array of plain objects; columns: optional column order; meta: title, source and notes for the JSON file.
export default function DownloadView({ rows, columns, name, meta, label = 'Download what is shown' }) {
  const empty = !rows || rows.length === 0;
  const page = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return (
    <div className="dlview" role="group" aria-label={label}>
      <span className="dlview-l">{label}</span>
      <button type="button" className="btn-s" disabled={empty} onClick={() => save(`${name}.csv`, 'text/csv;charset=utf-8', toCSV(rows, columns))}>CSV</button>
      <button type="button" className="btn-s" disabled={empty} onClick={() => save(`${name}.json`, 'application/json', JSON.stringify({ ...meta, view: page, rows }, null, 1))}>JSON</button>
      <span className="dlview-n">{empty ? 'Nothing to download in this view.' : `${rows.length} row${rows.length === 1 ? '' : 's'}`}</span>
    </div>
  );
}
