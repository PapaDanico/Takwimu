'use client';

// Text filter over all 47 county names. Without JavaScript the full list shows; with it, typing narrows the list.
import Link from 'next/link';
import { useId, useState } from 'react';
import { COUNTIES } from '../lib/counties';

export default function CountyFinder({ label = 'Find a county' }) {
  const [q, setQ] = useState('');
  const id = useId();
  const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
  const t = q.trim();
  const shown = COUNTIES.filter((c) => !t || (norm(t) ? norm(c.name).includes(norm(t)) : String(c.code) === t.replace(/^0+/, '')));
  return (
    <div className="finder">
      <label htmlFor={`${id}-q`} className="finder-label">{label}</label>
      <input id={`${id}-q`} className="finder-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a county name or code" autoComplete="off" aria-describedby={`${id}-n`} />
      <p id={`${id}-n`} className="finder-count" aria-live="polite">{q.trim() ? `${shown.length} of ${COUNTIES.length} counties match` : `All ${COUNTIES.length} counties`}</p>
      <ul className="county-grid">
        {shown.map((c) => (
          <li key={c.slug}><Link href={`/counties/${c.slug}/`} className={`county-card${c.published ? ' live' : ''}`}><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>{c.published ? 'Published' : 'In preparation'}</small></Link></li>
        ))}
      </ul>
    </div>
  );
}
