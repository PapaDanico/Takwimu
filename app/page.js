import Link from 'next/link';
import { COUNTIES } from '../lib/counties';
import KenyaMap from '../components/KenyaMap';

export default function Home() {
  return (
    <main id="main" className="wrap page">
      <section className="hero card" aria-labelledby="hero-h">
        <p className="eyebrow">Takwimu Kenya · <em>Turning Data into Progress.</em></p>
        <h1 id="hero-h">Kenya&apos;s public finances and statistics, county by county, made plain</h1>
        <p className="lead">Budgets, spending, own revenue, unpaid bills, audit opinions and population, with the source, date and confidence beside every figure. Where two official reports disagree, we show both.</p>
        <p><Link className="btn" href="/counties/siaya/">Start with Siaya County</Link> <Link className="btn ghost" href="/counties/">Browse all 47 counties</Link></p>
      </section>
      <section className="card" aria-labelledby="pick-h">
        <h2 id="pick-h">Find your county</h2>
        <p className="lead">Siaya is published first. The other 46 are added one at a time, each only when its data meets the same standard.</p>
        <KenyaMap />
        <ul className="county-grid">
          {COUNTIES.map((c) => (
            <li key={c.slug}><Link href={`/counties/${c.slug}/`} className={`county-card${c.published ? ' live' : ''}`}><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>{c.published ? 'Published' : 'In preparation'}</small></Link></li>
          ))}
        </ul>
      </section>
      <section className="card" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <ul className="steps">
          <li><b>Primary documents only.</b> Controller of Budget, Auditor-General, KNBS and Demographic and Health Surveys, with links.</li>
          <li><b>Ten-year trends.</b> Real terms, per person and against budget, with missing years left blank.</li>
          <li><b>Honest uncertainty.</b> Confidence ratings, a conflict register, and no verdicts on named people.</li>
          <li><b>Open data.</b> Every chart has a table, and the datasets download as CSV and JSON.</li>
        </ul>
        <p><Link href="/method/">Read the method</Link> or <Link href="/learn/">learn the terms</Link>.</p>
      </section>
    </main>
  );
}
