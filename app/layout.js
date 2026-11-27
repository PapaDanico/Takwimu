import './fonts.css';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { SITE_URL } from '../lib/site';

// Fonts are self-hosted from public/fonts/ (app/fonts.css): no network call at build time. The latin files are preloaded,
// as next/font/google did.
const PRELOAD = ['/fonts/plus-jakarta-sans-latin.woff2', '/fonts/jetbrains-mono-latin.woff2'];

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Takwimu Kenya | Turning Data into Progress.', template: '%s | Takwimu Kenya' },
  openGraph: { type: 'website', siteName: 'Takwimu Kenya', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Takwimu Kenya: Turning Data into Progress.' }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  description: "Budget, audit and revenue reports for Kenya's 47 counties in plain language. Every figure names its source, so you can check it.",
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon-16.png', sizes: '16x16', type: 'image/png' }, { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#17191C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>{PRELOAD.map((f) => <link key={f} rel="preload" href={f} as="font" type="font/woff2" crossOrigin="" />)}</head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
