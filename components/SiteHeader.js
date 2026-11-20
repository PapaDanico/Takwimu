'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, ShieldCheck, BookOpen, Info } from 'lucide-react';

const NAV = [
  { href: '/#siaya', label: 'Revenue', Icon: TrendingUp },
  { href: '/#spending', label: 'Spending', Icon: Wallet },
  { href: '/#audit', label: 'Audit', Icon: ShieldCheck },
  { href: '/#learn', label: 'Learn', Icon: BookOpen },
  { href: '/method/', label: 'Method', Icon: Info },
];

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

export default function SiteHeader({ asOf }) {
  const pathname = usePathname() || '/';
  // Hash links belong to the home page, so only real routes can be "current".
  const isCurrent = (href) => !href.includes('#') && pathname.replace(/\/$/, '') === href.replace(/\/$/, '');

  return (
    <>
      <header className="site-header">
        <div className="wrap row">
          <Link href="/" className="brand">
            <img src="/logo.svg" alt="" width="36" height="36" />
            <b>Takwimu <i>Counties</i></b>
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <div className="header-right">
            <span className="status" title="Date the figures were last checked against their sources">Checked {asOf}</span>
            <a className="report" href={ISSUES_URL}>Report an error</a>
          </div>
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Primary mobile">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined}>
            <Icon aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
