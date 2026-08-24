import './globals.css';

export const metadata = {
  title: 'TAKWIMU | Kenya Intelligence Engine',
  description: 'Verified socioeconomic data for Kenya. Sheng + English. IMF, World Bank, China BRI, KNBS sources. Deployed on Cloudflare Pages.',
  keywords: 'Kenya, data, economy, politics, 2027, Sheng, IMF, World Bank, BRI, Cloudflare',
  authors: [{ name: 'TAKWIMU Labs' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0a0f1a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
