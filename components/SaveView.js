'use client';
// "Save this view": stores the current address (filters and choices included) in this browser only.
import Link from 'next/link';
import { useState } from 'react';
import { saveView } from '../lib/saved-views';

export default function SaveView({ title }) {
  const [msg, setMsg] = useState('');
  const onSave = () => {
    const url = `${window.location.pathname}${window.location.search}`;
    const d = new Date();
    const saved = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const r = saveView({ url, title: typeof title === 'function' ? title() : title, saved });
    setMsg(r === 'saved' ? 'Saved in this browser.' : r === 'exists' ? 'This view is already saved.' : 'This browser does not allow saving. You can bookmark or copy the address instead.');
  };
  return (
    <div className="saveview">
      <button type="button" className="btn-s" onClick={onSave}>Save this view</button>
      <span className="saveview-msg" role="status" aria-live="polite">{msg}{msg && msg.startsWith('Saved') ? <> <Link href="/datasets/#saved">See saved views</Link></> : null}</span>
    </div>
  );
}
