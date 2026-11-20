import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Takwimu | Public finance, explained',
  description: "Kenya's public finance and statistics, explained with sources. Starting with Siaya County.",
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A1F3C',
};

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <div className="wrap">
          <header className="top">
            <Link href="/" className="brand"><b>TAKWIMU</b><span>Public finance, explained</span></Link>
            <nav aria-label="Primary">
              <Link href="/#siaya">Siaya</Link>
              <Link href="/#audit">Audit</Link>
              <Link href="/#learn">Learn</Link>
              <Link href="/method/">Method</Link>
            </nav>
          </header>
          {children}
          <footer>
            <div><b>Method and corrections.</b> Every figure names its source, retrieval date and a confidence score. Disputed figures are shown side by side, never merged. <Link href="/method/">Read how we work</Link>.</div>
            <div><a href={ISSUES_URL}>Report an inaccuracy</a></div>
          </footer>
        </div>
      </body>
    </html>
  );
}
