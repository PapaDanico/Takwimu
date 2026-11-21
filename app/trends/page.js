import Link from 'next/link';
import TrendsRedirect from '../../components/TrendsRedirect';

// The trend explorer moved into the Kenya dashboard (/kenya/#trends). Netlify redirects /trends/ there with a
// 301 that keeps the query string; this page does the same where the redirect rules do not run.
export const metadata = { title: 'Trends (moved)', description: 'The trend explorer is now part of the Kenya dashboard.', robots: { index: false } };

export default function TrendsMoved() {
  return (
    <main id="main" className="wrap page">
      <section className="card nf">
        <h1>Trends are now on the Kenya dashboard</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>Your choices carry over. If you are not moved automatically, <Link href="/kenya/#trends">open the trend explorer</Link>.</p>
        <TrendsRedirect />
      </section>
    </main>
  );
}
