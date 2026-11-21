import Link from 'next/link';
import PageHead from '../../components/PageHead';
import { COUNTIES } from '../../lib/counties';
import KenyaMap from '../../components/KenyaMap';

export const metadata = {
  title: 'All 47 counties',
  description: 'Public finance and statistics for Kenya’s 47 counties. Siaya is published; others are added as each meets the evidence threshold.',
};

export default function Counties() {
  const live = COUNTIES.filter((c) => c.published);
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Counties" title="Kenya's 47 counties" sub="We began with Siaya. A county is published only when its figures, sources and checks meet the same standard, so the others show what is coming and what is missing." path="/counties/" shareText="Takwimu Kenya: all 47 counties" />
      <section className="card" aria-labelledby="map-h">
        <h2 id="map-h">Map of Kenya</h2>
        <p className="lead">Select a county on the map, or use the list below.</p>
        <KenyaMap />
      </section>
      <section className="card" aria-labelledby="live-h">
        <h2 id="live-h">Published</h2>
        <ul className="county-grid">
          {live.map((c) => (
            <li key={c.slug}><Link href={`/counties/${c.slug}/`} className="county-card live"><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>Ten-year series, sub-counties, analytics</small></Link></li>
          ))}
        </ul>
      </section>
      <section className="card" aria-labelledby="all-h">
        <h2 id="all-h">All counties, by constitutional code</h2>
        <p className="lead">Pages for counties not yet published explain what data is needed and where it will come from. Nothing is estimated in advance.</p>
        <ul className="county-grid">
          {COUNTIES.map((c) => (
            <li key={c.slug}><Link href={`/counties/${c.slug}/`} className={`county-card${c.published ? ' live' : ''}`}><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>{c.published ? 'Published' : 'In preparation'}</small></Link></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
