import Link from 'next/link';

// Static fallback for a URL that moved (owner UX decisions U2/U6, 21 Nov 2026). On Netlify a 301 in netlify.toml
// answers first; this page serves the static export everywhere else: an inline script that keeps the query string and
// the hash, then a meta refresh, a link and rel=canonical (set by movedMetadata in the page's metadata).
export function movedMetadata(title, to) {
  return { title: `${title} (moved)`, description: `This page moved to ${to}.`, robots: { index: false }, alternates: { canonical: to } };
}

export default function Moved({ title, to, label, clientTo }) {
  const [p, h] = (clientTo || to).split('#');
  const js = `location.replace(${JSON.stringify(p)}+location.search+(location.hash||${JSON.stringify(h ? `#${h}` : '')}))`;
  return (
    <main id="main" className="wrap page">
      <script dangerouslySetInnerHTML={{ __html: js }} />
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <section className="card nf" data-moved-to={to}>
        <h1>{title} has moved</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>It is now part of <Link href={to}>{label}</Link>. If you are not moved automatically, follow the link.</p>
      </section>
    </main>
  );
}
