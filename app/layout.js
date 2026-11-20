import './globals.css';
import siaya from '../data/siaya.json';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { shortDate } from '../lib/format';

export const metadata = {
  title: 'Takwimu Counties | Public finance, made plain',
  description: "Kenya's county budget, audit and revenue reports in plain language, starting with Siaya. Every figure names its source.",
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A192F',
};

export default function RootLayout({ children }) {
  const asOf = shortDate(siaya.own_source_revenue.observations[0].retrieved);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader asOf={asOf} />
        {children}
        <SiteFooter asOf={asOf} />
      </body>
    </html>
  );
}
