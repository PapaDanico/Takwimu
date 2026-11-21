import Link from 'next/link';
import MovedRedirect from './MovedRedirect';

// Static fallback for a URL that moved (owner UX decisions U2/U6, 21 Nov 2026). On Netlify a 301 in netlify.toml
// answers first; this page serves the static export everywhere else: a meta refresh, a link and rel=canonical
// (set by movedMetadata in the page's metadata). The client step keeps the hash and query string.
export function movedMetadata(title, to) {
  return { title: `${title} (moved)`, description: `This page moved to ${to}.`, robots: { index: false }, alternates: { canonical: to } };
}

export default function Moved({ title, to, label }) {
  return (
    <main id="main" className="wrap page">
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <section className="card nf" data-moved-to={to}>
        <h1>{title} has moved</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>It is now part of <Link href={to}>{label}</Link>. If you are not moved automatically, follow the link.</p>
        <MovedRedirect to={to} />
      </section>
    </main>
  );
}
