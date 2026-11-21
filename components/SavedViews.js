'use client';
// The list of views saved in this browser, with a remove button for each. Empty state when there are none.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadViews, removeView, storageAvailable } from '../lib/saved-views';
import { shortDate } from '../lib/format';

export default function SavedViews() {
  const [views, setViews] = useState(null);
  const [ok, setOk] = useState(true);
  const [msg, setMsg] = useState('');
  useEffect(() => { setOk(storageAvailable()); setViews(loadViews()); }, []);
  const remove = (v) => { removeView(v.url); setViews(loadViews()); setMsg(`Removed "${v.title}".`); };
  return (
    <div>
      {views === null ? <p className="muted" role="status">Loading saved views…</p> : null}
      {views !== null && !ok ? <p className="empty">This browser does not allow saving (private browsing or blocked site data). Bookmark a page instead; its address keeps your choices.</p> : null}
      {views !== null && ok && views.length === 0 ? <p className="empty">No saved views yet. On the datasets, Kenya, compare and trends pages, choose &ldquo;Save this view&rdquo; to keep its filters here. They stay in this browser only.</p> : null}
      {views && views.length > 0 ? (
        <ul className="saved-list">
          {views.map((v) => (
            <li key={v.url}>
              <Link href={v.url}>{v.title}</Link>
              <small>Saved {shortDate(v.saved)} · <code>{v.url}</code></small>
              <button type="button" className="btn-s ghost" onClick={() => remove(v)} aria-label={`Remove saved view: ${v.title}`}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">{msg}</p>
    </div>
  );
}
