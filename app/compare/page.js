import { Suspense } from 'react';
import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import CompareView from '../../components/CompareView';
import KenyaMap from '../../components/KenyaMap';
import TableWrap from '../../components/TableWrap';
import { compareData, extra } from '../../lib/explore';

export const metadata = {
  title: 'Compare counties',
  description: "Compare Kenya's 47 counties on budget, spending, absorption, own-source revenue and pending bills (FY 2021/22 to 2024/25, Controller of Budget), the CRA's recommended allocations for FY 2026/27 and 2022 registered voters by constituency.",
};

const data = compareData();
const fmt = (v) => v.toLocaleString('en-US');
const cra = extra.craRows.slice().sort((a, b) => a.code - b.code);
const craMap = Object.fromEntries(cra.map((r) => [r.slug, r.total_allocation_2026_27]));
const voterMap = Object.fromEntries(extra.voterCounty.map((r) => [r.slug, r.value]));
const byCounty = extra.voterCounty.slice().sort((a, b) => a.code - b.code).map((c) => ({ ...c, rows: extra.constituencies.filter((x) => x.slug === c.slug) }));

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
      <section className="card" id="cra" aria-labelledby="cra-h">
        <h2 id="cra-h">Equitable share recommended for each county, FY 2026/27</h2>
        <p className="lead">The Commission on Revenue Allocation, a constitutional commission, recommends how the counties&apos; share of national revenue is divided. These are its recommendations to Parliament (February 2026), not the amounts in the County Allocation of Revenue Act, which may differ.</p>
        <KenyaMap values={craMap} valueUnit="KSh m" valueDec={0} valueLabel="Recommended allocation, FY 2026/27" ariaLabel="Map of Kenya's 47 counties shaded by the CRA's recommended allocation for FY 2026/27" mapId="cramap" />
        <TableWrap label="CRA recommended allocation by county, FY 2026/27">
          <table className="data">
            <caption>Allocation by county, KSh million: FY 2025/26 and the CRA&apos;s recommendation for FY 2026/27 (baseline plus the Fourth Basis share)</caption>
            <thead><tr><th scope="col">County</th><th scope="col" className="num">FY 2025/26</th><th scope="col" className="num">Baseline FY 2026/27</th><th scope="col" className="num">Fourth Basis share (%)</th><th scope="col" className="num">Fourth Basis amount</th><th scope="col" className="num">Recommended total FY 2026/27</th></tr></thead>
            <tbody>{cra.map((r) => <tr key={r.slug}><th scope="row">{r.name}</th><td className="num">{fmt(r.allocation_2025_26)}</td><td className="num">{fmt(r.baseline_2026_27)}</td><td className="num">{r.fourth_basis_allocation_factor_pct.toFixed(2)}</td><td className="num">{fmt(r.fourth_basis_allocation_2026_27)}</td><td className="num">{fmt(r.total_allocation_2026_27)}</td></tr>)}</tbody>
          </table>
        </TableWrap>
        <p className="src">Source: <a href={extra.CRA.source.url}>{extra.CRA.source.title}</a>, {extra.CRA.source.location}. Fourth Basis weights: population {extra.ngo.cra.fourth_basis_weights.weights.population} per cent, basic share {extra.ngo.cra.fourth_basis_weights.weights.basic_share}, area {extra.ngo.cra.fourth_basis_weights.weights.geographical_size}, poverty {extra.ngo.cra.fourth_basis_weights.weights.poverty}. The 47 totals add to the published KSh 458,940 million; other columns differ from their printed totals by rounding (up to KSh 4 million). Download: <Link href="/datasets/?q=CRA">CRA datasets</Link>.</p>
      </section>
      <section className="card" id="voters" aria-labelledby="voters-h">
        <h2 id="voters-h">Registered voters, 2022 general election</h2>
        <p className="lead">IEBC registered voters by constituency. The county figures on the map add up each county&apos;s constituencies (a sum, not a separate IEBC figure).</p>
        <KenyaMap values={voterMap} valueUnit="voters" valueDec={0} valueLabel="Registered voters, 2022 (sum of constituencies)" ariaLabel="Map of Kenya's 47 counties shaded by registered voters in 2022" mapId="votermap" />
        <TableWrap label="Registered voters by constituency, 2022">
          <table className="data">
            <caption>Registered voters in each of the 290 constituencies, 2022, grouped by county</caption>
            <thead><tr><th scope="col">County</th><th scope="col">Constituency</th><th scope="col" className="num">Registered voters</th></tr></thead>
            <tbody>{byCounty.flatMap((c) => [
              ...c.rows.map((r) => <tr key={`${c.slug}-${r.code}`}><td>{c.name}</td><th scope="row">{r.name.replace(/\b([A-Z])([A-Z'’]*)/g, (m, a, b) => a + b.toLowerCase())}</th><td className="num">{fmt(r.voters)}</td></tr>),
              <tr key={`${c.slug}-total`} style={{ fontWeight: 600 }}><td>{c.name}</td><th scope="row">County total (sum)</th><td className="num">{fmt(c.value)}</td></tr>,
            ])}</tbody>
          </table>
        </TableWrap>
        <p className="src">Source: IEBC, <a href={extra.VOTERS.source.url}>{extra.VOTERS.source.title}</a>. The 290 rows add to the file&apos;s total of {fmt(extra.VOTERS.checks.published_total)}; IEBC cites 22,120,458 elsewhere, and the file does not explain the gap of 17,926 (see the <Link href="/data/#conflicts">conflict register</Link>). The IEBC states no reuse licence for this file; cite the IEBC.</p>
      </section>
      <section className="card" aria-labelledby="read-h">
        <h2 id="read-h">How to read this comparison</h2>
        <ul className="how">
          <li><b>One source per year.</b> Each year comes from one Controller of Budget report (FY {data.years.join(', FY ')}), chapter 2, which lists every county in the same table.</li>
          <li><b>Read by OCR.</b> The reports are scanned images, so every value was read by text recognition. The 47 rows add up to the printed totals, and the budget, spending and revenue parts add up within each row. A percentage whose reading did not agree with the printed amounts is shown as not available, with the reading kept in the table view.</li>
          <li><b>No verdicts.</b> A higher or lower figure is not good or bad by itself: counties differ in size, population and needs. The list is not ordered by value when a reading is doubtful.</li>
          <li><b>Where sources differ.</b> Siaya&apos;s table values differ slightly from the county chapter in a few places; both are in the <Link href="/data/#conflicts">conflict register</Link>.</li>
        </ul>
      </section>
    </main>
  );
}
