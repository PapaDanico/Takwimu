import { Suspense } from 'react';
import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import CompareView from '../../components/CompareView';
import { compareData } from '../../lib/explore';

export const metadata = {
  title: 'Compare counties',
  description: "Compare Kenya's 47 counties on budget, spending, absorption, own-source revenue and pending bills, FY 2023/24 and 2024/25, from the Controller of Budget's tables.",
};

const data = compareData();

function Loading() {
  return (
    <section className="card" aria-busy="true">
      <p className="loading" role="status">Loading the comparison…</p>
      <noscript>
        <p className="empty">The comparison needs JavaScript to choose indicators and counties. The same figures download from the <Link href="/datasets/">datasets catalogue</Link> as CSV or JSON.</p>
      </noscript>
    </section>
  );
}

export default function ComparePage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/explore/', label: 'Explore' }]} current="Compare counties" title="Compare counties"
        sub="Pick an indicator and a year to see all 47 counties in one list, on a map and in a table, or pick two to four counties to see them side by side. The figures are those printed in the Controller of Budget's annual county reports." />
      <Suspense fallback={<Loading />}>
        <CompareView data={data} />
      </Suspense>
      <section className="card" aria-labelledby="read-h">
        <h2 id="read-h">How to read this comparison</h2>
        <ul className="how">
          <li><b>One source per year.</b> Each year comes from one Controller of Budget report (FY {data.years.join(' and FY ')}), chapter 2, which lists every county in the same table.</li>
          <li><b>Read by OCR.</b> The reports are scanned images, so every value was read by text recognition. The 47 rows add up to the printed totals, and the budget, spending and revenue parts add up within each row. A percentage whose reading did not agree with the printed amounts is shown as not available, with the reading kept in the table view.</li>
          <li><b>No verdicts.</b> A higher or lower figure is not good or bad by itself: counties differ in size, population and needs. The list is not ordered by value when a reading is doubtful.</li>
          <li><b>Where sources differ.</b> Siaya&apos;s table values differ slightly from the county chapter in a few places; both are in the <Link href="/data/#conflicts">conflict register</Link>.</li>
        </ul>
      </section>
    </main>
  );
}
