import Link from 'next/link';
import { PAGES } from '../lib/site';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main" className="wrap page">
      <section className="card nf">
        <p className="eyebrow">Error 404</p>
        <h1>That page is not here</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>The link may be old, or mistyped. These pages exist:</p>
        <ul className="toc" style={{ justifyContent: 'center', marginTop: 16 }}>
          {PAGES.map((p) => <li key={p.href}><Link href={p.href}>{p.label}</Link></li>)}
        </ul>
      </section>
    </main>
  );
}
