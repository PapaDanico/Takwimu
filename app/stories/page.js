import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import { STORIES } from '../../lib/stories';
import { Provisional } from '../../components/ObsTable';

export const metadata = {
  title: 'Data stories',
  description: 'Short, plain-language stories built only from the data: county budget absorption, population and towns, and own-source revenue across counties.',
};

export default function StoriesPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }]} current="Data stories" title="Data stories"
        sub="Short reads built only from the published figures. Each story shows its method and sources, and links to the data so you can check every number." />
      <Provisional dataset={['counties-cob', 'history']}>Figures in these stories were transcribed by Takwimu from Controller of Budget reports and have not yet been checked by a reviewer.</Provisional>
      <section className="card" aria-labelledby="list-h">
        <h2 id="list-h">Stories</h2>
        <ul className="explore-grid">
          {STORIES.map((s) => <li key={s.slug}><Link className="explore-card" href={`/stories/${s.slug}/`}><b>{s.title}</b><span>{s.blurb}</span></Link></li>)}
        </ul>
      </section>
    </main>
  );
}
