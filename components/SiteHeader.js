'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, MapPinned, BookOpen, Info } from 'lucide-react';
import { COUNTIES } from '../lib/counties';
import { ISSUES_URL } from '../lib/site';

const NAV = [
  { href: '/', label: 'Overview', short: 'Home', Icon: Home },
  { href: '/counties/', label: 'Counties', short: 'Counties', Icon: Map },
  { href: '/counties/siaya/', label: 'Siaya', short: 'Siaya', Icon: MapPinned },
  { href: '/learn/', label: 'Learn', short: 'Learn', Icon: BookOpen },
  { href: '/method/', label: 'Method', short: 'Method', Icon: Info },
];

export default function SiteHeader({ asOf }) {
  const pathname = usePathname() || '/';
  // Hash links belong to the home page, so only real routes can be "current".
  const isCurrent = (href) => (href === '/' ? pathname === '/' : pathname.replace(/\/$/, '').startsWith(href.replace(/\/$/, '')) && !(href === '/counties/' && pathname.startsWith('/counties/siaya')));

  return (
    <>
      <header className="site-header">
        <div className="wrap row">
          <Link href="/" className="brand">
            <img src="/logo.svg" alt="" width="36" height="36" />
            <b>Takwimu <i>Kenya</i></b>
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <details className="county-menu">
            <summary>Find a county</summary>
            <ul>{COUNTIES.map((c) => <li key={c.slug}><Link href={`/counties/${c.slug}/`}>{c.name}</Link></li>)}</ul>
          </details>
          <div className="header-right">
            <span className="status" title="Date the figures were last checked against their sources">Checked {asOf}</span>
            <a className="report" href={ISSUES_URL}>Report an error</a>
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
