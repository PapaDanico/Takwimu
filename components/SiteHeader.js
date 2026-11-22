'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Home, Map, BookOpen, Database, Flag, Columns2 } from 'lucide-react';
import { COUNTIES } from '../lib/counties';
import { ISSUES_URL } from '../lib/site';

// Sections that cover more than one route (header: Home, Kenya, Compare, Counties, Learn, Data; owner decision U6).
const COUNTY_PAGES = ['/counties', '/reports'];
const SECTION = { '/kenya': ['/kenya', '/trends'], '/datasets': ['/datasets', '/data', '/method', '/stories'] };

const NAV = [
  { href: '/', label: 'Home', short: 'Home', Icon: Home },
  { href: '/kenya/', label: 'Kenya', short: 'Kenya', Icon: Flag },
  { href: '/compare/', label: 'Compare', short: 'Compare', Icon: Columns2 },
  { href: '/counties/', label: 'Counties', short: 'Counties', Icon: Map },
  { href: '/learn/', label: 'Learn', short: 'Learn', Icon: BookOpen },
  { href: '/datasets/', label: 'Data', short: 'Data', Icon: Database },
];

export default function SiteHeader({ asOf }) {
  const pathname = usePathname() || '/';
  // Hash links belong to the home page, so only real routes can be "current".
  const menu = useRef(null);
  const p = pathname.replace(/\/$/, '') || '/';
  const isCurrent = (href) => {
    const h = href.replace(/\/$/, '') || '/';
    if (h === '/') return p === '/';
    if (h === '/counties') return COUNTY_PAGES.some((x) => p.startsWith(x));
    if (SECTION[h]) return SECTION[h].some((x) => p.startsWith(x));
    return p.startsWith(h);
  };
  // Close the county menu after navigating, on Escape, and on a click outside it.
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && menu.current && menu.current.open) { menu.current.open = false; menu.current.querySelector('summary').focus(); } };
    const onClick = (e) => { if (menu.current && menu.current.open && !menu.current.contains(e.target)) menu.current.open = false; };
    document.addEventListener('keydown', onKey); document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="wrap row">
          {/* Owner's horizontal lockup from 768 px; below that its KENYA line is too small to read, so the symbol plus the name.
              Only one of the two is displayed, so the link's accessible name is "Takwimu Kenya" exactly once at every width. */}
          <Link href="/" className="brand">
            <span className="brand-lockup"><img src="/brand/takwimu-horizontal-96.png" srcSet="/brand/takwimu-horizontal-96.png 323w, /brand/takwimu-horizontal-192.png 646w" sizes="162px" alt="Takwimu Kenya" width="162" height="48" /></span>
            <span className="brand-compact"><span className="brand-symbol"><img src="/logo.png" alt="" width="34" height="34" /></span><span className="brand-name">Takwimu Kenya</span></span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <details className="county-menu" ref={menu}>
            <summary>Find a county</summary>
            <ul>{COUNTIES.map((c) => <li key={c.slug}><Link href={`/counties/${c.slug}/`}>{c.name}</Link></li>)}</ul>
          </details>
          <div className="header-right">
            <span className="status" title="Date the figures were last checked against their sources">Checked {asOf}</span>
            <a className="report" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Report an error</a>
          </div>
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Primary mobile">
        {NAV.map(({ href, short, Icon }) => (
          <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined}>
            <Icon aria-hidden="true" />
            {short}
          </Link>
        ))}
      </nav>
    </>
  );
}
