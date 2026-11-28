import Link from 'next/link';
import Abbrs from '../../../../components/Abbrs';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import { LineChart, ColumnChart } from '../../../../components/Charts';
import { economy } from '../../../../lib/economy';
import Reviewed from '../../../../components/Reviewed';
import { Provisional } from '../../../../components/ObsTable';
import { fmtNum } from '../../../../lib/format';
import { pageMeta } from '../../../../lib/page-meta';

export const metadata = pageMeta('/counties/siaya/economy/', {
  title: 'Siaya’s economy',
  description: 'Gross County Product for Siaya from the KNBS GCP 2025 and GCP 2024 editions: total output at current and constant 2016 prices, the activities that make it up, and how the later edition revised the earlier one.',
});

const e = economy();
const n = (v) => fmtNum(v);
const signed = (v) => (v > 0 ? `+${n(v)}` : v < 0 ? `−${n(-v)}` : '0');
const Cite = ({ c, extra }) => (
  <>{c.edition}, <a href={c.url}>{c.table}</a>, {c.page}, {c.read}{extra}. Confidence {c.confidence} of 5</>
);

export default function SiayaEconomy() {
  const [g25, g24] = e.growth;
  const [s25, s24] = e.share;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Economy" title="Siaya’s economy"
        sub="The value of everything produced in Siaya County each year, as measured by the Kenya National Bureau of Statistics (KNBS) in its Gross County Product reports. Two editions are shown side by side; neither replaces the other here."
        path="/counties/siaya/economy/" shareText="Siaya’s economy: Gross County Product from KNBS" />
      <Provisional dataset={'siaya-economy'} />
      <Abbrs list={['GCP']} />

      <PageToc items={[['eco-what', 'What this measures'], ['eco-current', 'Current prices'], ['eco-constant', 'Constant prices'], ['eco-sectors', 'By activity'], ['eco-rev', 'Revisions'], ['eco-gaps', 'Not published']]} />
      <section className="card gold" aria-labelledby="eco-what">
        <h2 id="eco-what">What this measures, and what it does not</h2>
        <ul className="how">
          <li id="not-revenue"><b>County output is not county government revenue.</b> Gross County Product (GCP) is the value added by every farm, business, school, clinic and public office located in Siaya. It is not the county government’s revenue, budget or spending, which are on the <Link href="/counties/siaya/">Siaya County hub</Link>.</li>
          <li><b>No share of national GDP is published.</b> Neither edition gives Siaya’s share of Kenya’s GDP. What KNBS publishes is Siaya’s share of the value added by all 47 counties together: <Reviewed b={s25.review}>{s25.value}%</Reviewed> on average over {s25.period} (<Cite c={s25.cite} />) and <Reviewed b={s24.review}>{s24.value}%</Reviewed> over {s24.period} (<Cite c={s24.cite} />).</li>
          <li><b>Annual real growth is not published.</b> KNBS gives only an average for each five-year window, read from a chart: <Reviewed b={g25.review}>{g25.value}%</Reviewed> a year for {g25.period} (<Cite c={g25.cite} />) and <Reviewed b={g24.review}>{g24.value}%</Reviewed> a year for {g24.period} (<Cite c={g24.cite} />). The windows and editions differ, so the two averages are not a trend, and KNBS does not state how the average is computed. No year-by-year rate is calculated here.</li>
          <li>These figures describe the county economy. They are not a judgement of the county government or of any person.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="eco-current">
        <h2 id="eco-current">Total output at current prices</h2>
        <p className="lead">GCP in KSh million, at the prices of each year, so part of the rise is inflation. In {e.latestYear} the GCP 2025 edition puts Siaya’s output at <Reviewed b={e.latestTotal.review}>{() => <>KSh {n(e.latestTotal.value)} million</>}</Reviewed>{e.latestTotal.provisional ? ' (provisional)' : ''}. Each edition is its own line; the table view gives every value.</p>
        <LineChart labels={e.years} unit="KSh million" yFormat="int" naText="Not in this edition"
          ariaLabel={`Siaya Gross County Product at current prices, ${e.years[0]} to ${e.years[e.years.length - 1]}, KSh million, by KNBS edition`}
          series={e.current.map((s, i) => ({ name: s.name, color: i + 1, dash: i === 1, values: s.values }))} />
        <p className="src">Sources: {e.current.map((s, i) => <span key={s.vintage}>{i ? '; ' : ''}<Cite c={s.cite} extra={s.provisional.length ? ` (${s.provisional.join(', ')} provisional)` : ''} /></span>)}.</p>
      </section>

      <section className="card" aria-labelledby="eco-constant">
        <h2 id="eco-constant">Total output at constant 2016 prices</h2>
        <p className="lead">The same measure valued at 2016 prices, which removes the effect of price changes. Shown as its own chart, not on a second axis. KSh million.</p>
        <LineChart labels={e.years} unit="KSh million" yFormat="int" naText="Not in this edition"
          ariaLabel={`Siaya Gross County Product at constant 2016 prices, ${e.years[0]} to ${e.years[e.years.length - 1]}, KSh million, by KNBS edition`}
          series={e.constant.map((s, i) => ({ name: s.name, color: i + 1, dash: i === 1, values: s.values }))} />
        <p className="src">Sources: {e.constant.map((s, i) => <span key={s.vintage}>{i ? '; ' : ''}<Cite c={s.cite} extra={s.provisional.length ? ` (${s.provisional.join(', ')} provisional)` : ''} /></span>)}.</p>
      </section>

      <section className="card" aria-labelledby="eco-sectors">
        <h2 id="eco-sectors">What Siaya produced in {e.latestYear}, by activity</h2>
        <p className="lead">Gross value added by economic activity, current prices, KSh million, largest first. {e.largest ? <>{e.activities.some((x) => x.withdrawn) ? 'Among the values shown, ' : ''}{e.activities.some((x) => x.withdrawn) ? e.largest.sector_label.charAt(0).toLowerCase() + e.largest.sector_label.slice(1) : e.largest.sector_label} is the largest at <Reviewed b={e.largest.review}>{() => <>KSh {n(e.largest.value)} million</>}</Reviewed>.</> : null}{e.activities.filter((x) => x.withdrawn).map((x) => <span key={x.id}> {x.sector_label}: <Reviewed b={x.review}>{() => null}</Reviewed>.</span>)} Not shown in the chart: an adjustment for financial services (FISIM) of <Reviewed b={e.fisim.review}>{() => <>KSh {n(e.fisim.value)} million</>}</Reviewed>; with it, the activities add to the printed GCP of <Reviewed b={e.annex.review}>{() => <>KSh {n(e.annex.value)} million</>}</Reviewed>.</p>
        <ColumnChart labels={e.activities.map((a) => (a.withdrawn ? `${a.short} (withdrawn)` : a.short))} unit="KSh million" yFormat="int" naText="Withdrawn after editorial review"
          ariaLabel={`Siaya gross value added by economic activity, ${e.latestYear}, current prices, KSh million`}
          series={[{ name: `Value added, ${e.latestYear}`, color: 1, values: e.activities.map((a) => a.value) }]} />
        <p className="src">Source: <Cite c={e.sectorCite} extra={e.largest && e.largest.provisional ? `; ${e.latestYear} is provisional` : ''} />. Chart labels are shortened; KNBS’s full activity names are in the <Link href="/datasets/?q=siaya-economy">dataset</Link>.</p>
      </section>

      <section className="card" aria-labelledby="eco-rev">
        <h2 id="eco-rev">How the 2025 edition revised the 2024 edition</h2>
        <p className="lead">Both editions cover {e.revisions[0].period} to {e.revisions[e.revisions.length - 1].period}. The values are shown side by side, KSh million; the difference is the later edition minus the earlier one. Revisions are normal as statistics offices receive fuller data.</p>
        <TableWrap label="Siaya GCP in the GCP 2024 and GCP 2025 editions, overlapping years">
          <table className="data" id="revisions">
            <caption className="sr-only">Siaya GCP in the GCP 2024 and GCP 2025 editions, overlapping years, KSh million</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Prices</th><th scope="col">GCP 2024 edition</th><th scope="col">GCP 2025 edition</th><th scope="col">Difference</th></tr></thead>
            <tbody>
              {e.revisions.map((r) => (
                <tr key={`${r.price_basis}${r.period}`}>
                  <th scope="row">{r.period}</th>
                  <td>{r.price_basis === 'current' ? 'Current' : 'Constant 2016'}</td>
                  <td><Reviewed b={r.earlierReview}>{() => n(r.earlier_value)}</Reviewed><br /><small>{r.earlier.table.split(':')[0]}, {r.earlier.page}, confidence {r.earlier.confidence}</small></td>
                  <td><Reviewed b={r.laterReview}>{() => n(r.later_value)}</Reviewed><br /><small>{r.later.table.split(':')[0]}, {r.later.page}, confidence {r.later.confidence}</small></td>
                  <td>{r.withheld ? <span className="muted withheld">Withheld: {r.withheld.reason}</span> : <>{signed(r.difference)} ({r.difference_pct > 0 ? '+' : ''}{r.difference_pct.toFixed(1)}%)</>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="src">The largest revision is to 2023 at current prices. It falls mostly in {e.rev2023.map((r, i) => `${i ? (i === e.rev2023.length - 1 ? ' and ' : ', ') : ''}${r.label.toLowerCase()} (${signed(r.difference)})`).join('')}, comparing <Cite c={e.rev2023Src.earlier} /> with <Cite c={e.rev2023Src.later} />. Neither edition is treated as wrong; both are kept.</p>
      </section>

      <section className="card" aria-labelledby="eco-gaps">
        <h2 id="eco-gaps">What is not published</h2>
        <ul className="how">
          {e.gaps.map((g) => <li key={`${g.indicator}${g.vintage}${g.period}`}><b>{g.indicator.replace(/_/g, ' ')}, {g.period}{g.vintage !== 'both' ? ` (${e.EDITION[g.vintage]})` : ''}:</b> {g.reason}</li>)}
        </ul>
        <p className="src">Reports: {e.sources.map((s, i) => <span key={s.vintage}>{i ? '; ' : ''}{s.publisher}, <a href={s.library_url}>{s.title}</a> (PDF created {s.pdf_created}, {s.licence})</span>)}. Confidence 5 is a clean table cell read from the PDF text; 4 a chart label matched by position; 3 a chart label read by OCR (<Link href="/method/">method</Link>). Download every value from the <Link href="/datasets/?q=siaya-economy">dataset catalogue</Link> or as <a href="/data/siaya-economy.json">siaya-economy.json</a>.</p>
      </section>
    </main>
  );
}
