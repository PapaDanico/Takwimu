import Link from 'next/link';
import { COUNTIES, PUBLISHED } from '../lib/counties';
import KenyaMap from '../components/KenyaMap';
import CountyFinder from '../components/CountyFinder';

export default function Home() {
  return (
    <main id="main" className="wrap page">
      <section className="hero card" aria-labelledby="hero-h">
        <p className="eyebrow">Takwimu Kenya · <em>Turning Data into Progress.</em></p>
        <h1 id="hero-h">Kenya&apos;s 47 counties, in plain numbers you can check</h1>
        <p className="lead">Budgets, spending, own revenue, unpaid bills, audit opinions and population for every county, with the source, date and confidence beside each figure. Where two official reports disagree, you see both.</p>
        <p className="coverage"><b>{PUBLISHED.length} of {COUNTIES.length} counties published so far.</b> More are added as each meets the same evidence standard.</p>
        <div className="hero-grid">
          <KenyaMap />
          <div>
            <h2 className="mini" id="published-h">Published so far</h2>
            <ul className="published-row" aria-labelledby="published-h">
              {PUBLISHED.map((c) => <li key={c.slug}><Link className="county-card live" href={`/counties/${c.slug}/`}><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>Published</small></Link></li>)}
            </ul>
            <p><Link className="btn" href="/counties/">Browse all 47 counties</Link></p>
          </div>
        </div>
      </section>
      <section className="card" aria-labelledby="pick-h">
        <h2 id="pick-h">Find your county</h2>
        <p className="lead">Choose a county on the map above, or type its name below. Each county page shows what is published and what is still being checked.</p>
        <CountyFinder compact />
      </section>
      <section className="card" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <p className="lead">Our purpose is simple: informed citizens, and counties and citizens working from the same facts, so that public money builds shared progress.</p>
        <p>Every figure comes from a primary document and names it, so you can check it. How we read, check and label the figures is set out once, in the <Link href="/method/">method</Link>; the terms are explained in <Link href="/learn/">Learn</Link>. To start with the numbers, <Link href="/datasets/">explore the data</Link>.</p>
      </section>
    </main>
  );
}
