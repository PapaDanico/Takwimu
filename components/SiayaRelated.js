'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIAYA_GROUPS, SIAYA_RELATED } from '../lib/siaya-nav';

// Related block on every Siaya page (owner decision U6): topic and report cross-links, then every Siaya page by
// group, collapsed so it costs one tab stop until opened. Rendered by app/counties/siaya/layout.js.
export default function SiayaRelated() {
  const p = (usePathname() || '').replace(/^\/counties\/siaya\/?/, '').replace(/\/$/, '');
  const rel = SIAYA_RELATED[p];
  if (!rel) return null;
  return (
    <nav className="wrap siaya-related" aria-label="Related Siaya pages">
      <h2 className="mini">Related</h2>
      <ul className="toc">{rel.map(([h, t]) => <li key={h}><Link href={h}>{t}</Link></li>)}</ul>
      {/* The hub already lists every Siaya page by group at the top (duplication sweep D11). */}
      {p === '' ? null : <details className="siaya-all">
        <summary>All Siaya pages</summary>
        <div className="siaya-groups">
          {SIAYA_GROUPS.map((g) => (
            <div key={g.label}>
              <h3 className="mini">{g.label}</h3>
              <ul>{g.links.map(([h, t]) => <li key={h}><Link href={h} aria-current={h === `/counties/siaya/${p}/` ? 'page' : undefined}>{t}</Link></li>)}</ul>
            </div>
          ))}
        </div>
      </details>}
    </nav>
  );
}
