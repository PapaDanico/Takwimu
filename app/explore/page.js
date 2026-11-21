import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import { EXPLORE } from '../../lib/site';

export const metadata = {
  title: 'Explore',
  description: 'Explore the data: search the datasets, read the Kenya dashboard, compare counties, follow trends and read short data stories.',
};

export default function ExplorePage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }]} current="Explore" title="Explore the data"
        sub="National indicators for Kenya and budget figures for all 47 counties, each with its source. Choose where to start." />
      <section className="card" aria-labelledby="ex-h">
        <h2 id="ex-h">Ways in</h2>
        <ul className="explore-grid">
          {EXPLORE.map((p) => <li key={p.href}><Link className="explore-card" href={p.href}><b>{p.label}</b><span>{p.blurb}</span></Link></li>)}
        </ul>
      </section>
      <section className="card" aria-labelledby="note-h">
        <h2 id="note-h">Before you use the figures</h2>
        <ul className="how">
          <li>County figures for FY 2023/24 and 2024/25 come from the Controller of Budget&apos;s scanned reports and were read by OCR. Check any figure against its page, which every table gives.</li>
          <li>National figures come from the World Bank. Several are modelled estimates, and each says so.</li>
          <li>Missing values are shown as not available, with the reason. Nothing is filled in or estimated.</li>
        </ul>
      </section>
    </main>
  );
}
