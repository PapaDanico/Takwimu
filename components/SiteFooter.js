import Link from 'next/link';
import { SITE_UPDATED } from '../lib/site';

import { ISSUES_URL } from '../lib/site';

const COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { href: '/kenya/', label: 'Kenya' },
      { href: '/compare/', label: 'Compare' },
      { href: '/counties/', label: 'Counties' },
      { href: '/datasets/', label: 'Data' },
      { href: '/stories/', label: 'Data stories' },
      { href: '/reports/', label: 'Publications' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { href: '/learn/', label: 'Budget terms, in plain English' },
      { href: '/faq/', label: 'Frequently asked questions' },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { href: '/method/', label: 'How we handle numbers' },
      { href: '/method/#sources', label: 'Where the data comes from' },
      { href: '/data/', label: 'Siaya ten-year series' },
      { href: '/data/#conflicts', label: 'Where sources disagree' },
      { href: '/corrections/', label: 'Corrections' },
      { href: '/reports/#briefs', label: 'About our briefs' },
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

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            {/* Owner's full logo, tagline included, on a light panel: its dark green does not read on the dark footer. */}
            <div className="footer-brand">
              <img className="footer-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="200" height="189" />
            </div>
            <p className="tagline sr-only">Turning Data into Progress.</p>
            <p className="footer-about">
              A free, independent tool that turns the budget, audit and revenue reports of Kenya&apos;s 47
              counties into plain language. Every figure names its source, so you can check it.
            </p>
            <div className="chips">
              <a className="chip gold" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Report an error</a>
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
            the Office of the Auditor-General, the Kenya National Bureau of Statistics or any
            county government. Figures are read from published reports and may be delayed, rounded or
            misread from scanned pages. Check any number against the source document before relying
            on it. Each figure shows its own source and the date it was checked.
          </p>
          <div className="footer-credit">
            <img src="/brand/danico-ventures-96.webp" srcSet="/brand/danico-ventures-96.webp 1x, /brand/danico-ventures.webp 2x" alt="Danico Ventures Ltd" width="40" height="40" />
            <p>© {SITE_UPDATED.slice(0, 4)} Takwimu, a Danico Ventures Ltd product · Built in Kenya</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
