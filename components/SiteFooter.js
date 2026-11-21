import Link from 'next/link';
import { COUNTIES } from '../lib/counties';
import { SITE_UPDATED } from '../lib/site';

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

const LEGAL = [
  { href: '/terms/', label: 'Terms of use' },
  { href: '/privacy/', label: 'Privacy notice' },
  { href: '/faq/', label: 'FAQ' },
];

const COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { href: '/', label: 'Overview' },
      { href: '/counties/', label: 'All 47 counties' },
      { href: '/counties/siaya/', label: 'Siaya County' },
      { href: '/insights/', label: 'Siaya ten-year insights' },
      { href: '/analytics/', label: 'Analytics' },
      { href: '/subcounties/', label: 'Sub-counties' },
      { href: '/profile/', label: 'County profile' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { href: '/learn/', label: 'Budget terms, in plain English' },
      { href: '/faq/', label: 'Frequently asked questions' },
      { href: '/method/', label: 'How to read a chart here' },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { href: '/method/', label: 'How we handle numbers' },
      { href: '/method/#sources', label: 'Where the data comes from' },
      { href: '/data/', label: 'Download the data' },
      { href: '/data/#conflicts', label: 'Where sources disagree' },
      { href: ISSUES_URL, label: 'Report an inaccuracy' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms/', label: 'Terms of use' },
      { href: '/privacy/', label: 'Privacy notice' },
      { href: '/terms/#copyright', label: 'Copyright and reuse' },
      { href: '/terms/#disclaimer', label: 'Disclaimer' },
    ],
  },
  {
    heading: 'Our other tools',
    links: [
      { href: 'https://mwangazayield.org/', label: 'Mwangaza Yield: government bonds, made plain' },
      { href: 'https://jipangefinance.org/', label: 'JiPange: everyday money tools' },
    ],
  },
];

function LinkList({ links }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.href + l.label}>
          {l.href.startsWith('http') ? (
            <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
          ) : (
            <Link href={l.href}>{l.label}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function SiteFooter({ asOf }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/logo.png" alt="" width="48" height="48" />
              <span className="wordmark" aria-hidden="true"><span className="wm-main">TAKW<span className="wm-i">I</span>MU</span><span className="wm-sub">KENYA</span></span><span className="sr-only">Takwimu Kenya</span>
            </div>
            <p className="tagline">Turning Data into Progress.</p>
            <p className="footer-about">
              A free tool that turns Kenya&apos;s county budget, audit and revenue reports into plain
              language for all 47 counties, starting with Siaya. Every figure names its source, so any citizen can check it.
            </p>
            <div className="chips">
              <a className="chip gold" href={ISSUES_URL}>Report an inaccuracy</a>
              <Link className="chip" href="/method/">How we work</Link>
            </div>
          </div>

          <div className="folds">
            {COLUMNS.map((col) => (
              <details key={col.heading} className="fold">
                <summary>{col.heading}<span aria-hidden="true">+</span></summary>
                <LinkList links={col.links} />
              </details>
            ))}
          </div>

          <div className="footer-cols">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3>{col.heading}</h3>
                <LinkList links={col.links} />
              </div>
            ))}
          </div>
        </div>

        <nav className="footer-counties" aria-label="All counties">
          <h3>Counties</h3>
          <ul>
            {COUNTIES.map((c) => <li key={c.slug}><Link href={`/counties/${c.slug}/`}>{c.name}</Link></li>)}
          </ul>
        </nav>

        <div className="footer-base">
          <p>
            Takwimu explains public documents for education and is <strong>not legal, financial or
            audit advice</strong>. It is not affiliated with, or endorsed by, the Controller of Budget,
            the Office of the Auditor-General, the Kenya National Bureau of Statistics or any
            county government. Figures are read from published reports and may be delayed, rounded or
            misread from scanned pages. Check any number against the source document before relying
            on it. Last checked {asOf}.
          </p>
          <nav className="footer-legal" aria-label="Legal and help">
            {LEGAL.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <div className="footer-credit">
            <img src="/brand/danico-ventures-96.webp" srcSet="/brand/danico-ventures-96.webp 1x, /brand/danico-ventures.webp 2x" alt="Danico Ventures Ltd" width="40" height="40" />
            <p>© {SITE_UPDATED.slice(0, 4)} Takwimu, a Danico Ventures Ltd product · Built in Kenya</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
