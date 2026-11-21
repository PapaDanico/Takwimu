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
      <p className="notice">County figures were read by OCR from scanned reports and some national figures are modelled; missing values say why. How every figure is read and checked is set out once in the <Link href="/method/">method</Link>.</p>
    </main>
  );
}
