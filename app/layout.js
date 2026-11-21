import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import siaya from '../data/siaya.json';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { shortDate } from '../lib/format';
import { SITE_URL } from '../lib/site';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap', variable: '--font-mono' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Takwimu Kenya | Public finance, made plain', template: '%s | Takwimu Kenya' },
  openGraph: { type: 'website', siteName: 'Takwimu Kenya', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Takwimu Kenya: Siaya County in plain numbers' }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader asOf={asOf} />
        {children}
        <SiteFooter asOf={asOf} />
      </body>
    </html>
  );
}
