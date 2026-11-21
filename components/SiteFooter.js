import Link from 'next/link';

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
      { href: '/insights/', label: 'Ten-year insights' },
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
              <img src="/logo.svg" alt="" width="40" height="40" />
              <b>Takwimu <i>Counties</i></b>
            </div>
            <p className="tagline">Public finance, made plain</p>
            <p className="footer-about">
              A free tool that turns Kenya&apos;s county budget, audit and revenue reports into plain
              language, starting with Siaya. Every figure names its source, so any citizen can check it.
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

        <div className="footer-base">
          <p>
            Takwimu explains public documents for education and is <strong>not legal, financial or
            audit advice</strong>. It is not affiliated with, or endorsed by, the Controller of Budget,
            the Office of the Auditor-General, the Kenya National Bureau of Statistics or Siaya County
            Government. Figures are read from published reports and may be delayed, rounded or
            misread from scanned pages. Check any number against the source document before relying
            on it. Last checked {asOf}.
          </p>
          <nav className="footer-legal" aria-label="Legal and help">
            {LEGAL.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <div className="footer-credit">
            <img src="/brand/danico-ventures.webp" alt="Danico Ventures Ltd" width="32" height="32" />
            <p>© {new Date().getFullYear()} Takwimu, a Danico Ventures Ltd product · Built in Kenya</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
