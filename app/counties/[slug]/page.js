import Link from 'next/link';
import PageHead from '../../../components/PageHead';
import { COUNTIES, bySlug } from '../../../lib/counties';
import KenyaMap from '../../../components/KenyaMap';

export const dynamicParams = false;
export function generateStaticParams() {
  return COUNTIES.filter((c) => !c.published).map((c) => ({ slug: c.slug }));
}
export function generateMetadata({ params }) {
  const c = bySlug(params.slug);
  return { title: `${c ? c.name : 'County'} County`, description: `Status of ${c ? c.name : 'this county'} on Takwimu Kenya: what is published and what is still needed.` };
}

const NEEDED = [
  'Approved budget and actual spending for ten fiscal years, from the Controller of Budget annual county reports',
  'Own-source revenue and pending bills, with the definition each report uses',
  'Auditor-General opinions on the County Executive accounts for the same years',
  'Population and sub-county counts from the Kenya National Bureau of Statistics censuses',
  'County health and poverty indicators from the Demographic and Health Surveys and KNBS',
  'A checked boundary file for the county and its sub-counties',
];

export default function CountyPending({ params }) {
  const c = bySlug(params.slug);
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: c.slug, name: c.name }} eyebrow={`County ${String(c.code).padStart(2, '0')}`} title={`${c.name} County: in preparation`} sub="This county is not published yet. We do not show estimates or national averages in its place." path={`/counties/${c.slug}/`} shareText={`${c.name} County on Takwimu Kenya`} />
      <section className="card" aria-labelledby="loc-h">
        <h2 id="loc-h">Where {c.name} is</h2>
        <KenyaMap focus={c.slug} ariaLabel={`Map of Kenya with ${c.name} County highlighted`} />
      </section>
      <section className="card" aria-labelledby="need-h">
        <h2 id="need-h">What a published county page needs</h2>
        <ul className="steps">{NEEDED.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="how">Each figure carries its source, retrieval date, confidence rating and any conflict between reports, exactly as for Siaya. Gaps are listed, never filled.</p>
      </section>
      <section className="card" aria-labelledby="meanwhile-h">
        <h2 id="meanwhile-h">Meanwhile</h2>
        <ul className="steps">
          <li><Link href="/counties/siaya/">See what a published county looks like: Siaya</Link></li>
          <li><Link href="/learn/">Learn how county budgets, audits and statistics work</Link></li>
          <li><Link href="/method/">How we check every figure</Link></li>
          <li><Link href="/counties/">Back to all 47 counties</Link></li>
        </ul>
      </section>
    </main>
  );
}
