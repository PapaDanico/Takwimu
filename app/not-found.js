import Link from 'next/link';
import { PAGES, EXPLORE } from '../lib/site';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main" className="wrap page">
      <section className="card nf">
        <p className="eyebrow">Error 404</p>
        <h1>That page is not here</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>The link may be old or mistyped. Nothing is wrong with your device. Try one of these instead.</p>
        <p className="toolbar" style={{ justifyContent: 'center' }}>
          <Link className="btn-s" href="/">Home</Link>
          <Link className="btn-s ghost" href="/explore/">Explore the data</Link>
          <Link className="btn-s ghost" href="/counties/">Find a county</Link>
        </p>
        <h2 className="mini">Explore</h2>
        <ul className="toc" style={{ justifyContent: 'center', marginTop: 8 }}>
          {EXPLORE.map((p) => <li key={p.href}><Link href={p.href}>{p.label}</Link></li>)}
        </ul>
        <h2 className="mini">Every page</h2>
        <ul className="toc" style={{ justifyContent: 'center', marginTop: 8 }}>
          {PAGES.map((p) => <li key={p.href}><Link href={p.href}>{p.label}</Link></li>)}
        </ul>
      </section>
    </main>
  );
}
