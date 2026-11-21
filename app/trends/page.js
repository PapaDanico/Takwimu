import { Suspense } from 'react';
import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import TrendsView from '../../components/TrendsView';
import { trendSeries, BASE_FY } from '../../lib/explore';

export const metadata = {
  title: 'Trends',
  description: 'Choose a national, county or Siaya indicator and see how it changed over time, in nominal or real terms, with a table and downloads.',
};

const series = trendSeries();

function Loading() {
  return (
    <section className="card" aria-busy="true">
      <p className="loading" role="status">Loading the trend…</p>
      <noscript><p className="empty">Choosing a trend needs JavaScript. The <Link href="/kenya/">Kenya dashboard</Link> shows every national series without it, and every dataset downloads from the <Link href="/datasets/">datasets catalogue</Link>.</p></noscript>
    </section>
  );
}

export default function TrendsPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/explore/', label: 'Explore' }]} current="Trends" title="Trends"
        sub={`Pick one of ${series.length} indicators to see how it changed over time. Money values can be shown after prices (real terms), so years can be compared fairly.`} />
      <Suspense fallback={<Loading />}>
        <TrendsView series={series} baseFy={BASE_FY} />
      </Suspense>
      <section className="card" aria-labelledby="read-h">
        <h2 id="read-h">Nominal and real</h2>
        <p className="lead">A nominal figure is in shillings of its own year. Because prices rise, a shilling buys less each year, so a real figure restates every year in the prices of FY {BASE_FY}. Percentages, rates and counts of people are not money, so they are shown as published. Dollar series from the World Bank are in current US dollars and are not adjusted here. <Link href="/method/">Method</Link>.</p>
      </section>
    </main>
  );
}
