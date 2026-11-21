import Link from 'next/link';
import PageHead from '../../components/PageHead';
import { COUNTIES } from '../../lib/counties';
import KenyaMap from '../../components/KenyaMap';
import CountyFinder from '../../components/CountyFinder';

export const metadata = {
  title: 'All 47 counties',
  description: 'Public finance and statistics for Kenya’s 47 counties. Find any county; each is published once its data meets the same evidence standard.',
};

export default function Counties() {
  const live = COUNTIES.filter((c) => c.published);
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Counties" title="Kenya's 47 counties" sub={`${live.length} of ${COUNTIES.length} counties published so far. A county is published when its figures, sources and checks meet the same evidence standard; every other county page shows what is coming and what is still needed.`} path="/counties/" shareText="Takwimu Kenya: all 47 counties" />
      <section className="card" aria-labelledby="map-h">
        <h2 id="map-h">Map of Kenya</h2>
        <p className="lead">Select a county on the map, or use the list below.</p>
        <KenyaMap />
      </section>
      <section className="card" aria-labelledby="live-h">
        <h2 id="live-h">Published so far</h2>
        <ul className="county-grid">
          {live.map((c) => (
            <li key={c.slug}><Link href={`/counties/${c.slug}/`} className="county-card live"><span className="county-code">{String(c.code).padStart(2, '0')}</span><b>{c.name}</b><small>Ten-year series, sub-counties, analytics</small></Link></li>
          ))}
        </ul>
      </section>
      <section className="card" aria-labelledby="all-h">
        <h2 id="all-h">All counties, by constitutional code</h2>
        <p className="lead">Type a name or code to narrow the list. Pages for counties not yet published explain what data is needed and where it will come from. Nothing is estimated in advance.</p>
        <CountyFinder />
      </section>
    </main>
  );
}
