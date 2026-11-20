import PageHead from '../../components/PageHead';
import BarList from '../../components/BarList';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';

export const metadata = {
  title: 'Ten-year insights: Siaya County finances',
  description: 'Siaya County budget, spending, own-source revenue, pending bills and audit opinions over ten years, with prices adjusted.',
};

const BASE = '2024/25';
const deflator = (fy) => cpi.fiscal_year[BASE] / cpi.fiscal_year[fy];
const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
const label = (fy) => `FY ${fy}`;
const bn = (v) => v.toFixed(2);
const m = (v) => Math.round(v).toLocaleString('en-US');

const withSpend = years.filter((y) => y.spent !== undefined);
const first = withSpend.find((y) => y.fy === '2014/15');
const last = withSpend[withSpend.length - 1];
const realFirst = first.spent * deflator(first.fy);
const realGrowth = ((last.spent / realFirst) - 1) * 100;
const nomGrowth = ((last.spent / first.spent) - 1) * 100;

const dev = years.filter((y) => y.development_absorption_pct !== undefined);
const devMax = dev.reduce((a, b) => (b.development_absorption_pct > a.development_absorption_pct ? b : a));
const devMin = dev.reduce((a, b) => (b.development_absorption_pct < a.development_absorption_pct ? b : a));

const pend = years.map((y) => ({ fy: y.fy, v: y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined) })).filter((p) => p.v !== undefined);
const pendFirst = pend[0];
const pendLast = pend[pend.length - 1];

const osr = hist.osr_series.points;
const osrFirst = osr[0];
const osrLast = osr[osr.length - 1];
const osrRealFirst = osrFirst.value * deflator(osrFirst.fy);
const osrRealMultiple = osrLast.value / osrRealFirst;

export default function Insights() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Insights" title="Ten years of Siaya County finances" sub="Budget, spending, revenue, unpaid bills and audit opinions from the Controller of Budget and Auditor-General reports, FY 2014/15 to FY 2024/25. Gaps are marked, never filled in." path="/insights/" shareText="Ten years of Siaya County finances" />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#spending">Spending</a></li><li><a href="#development">Development</a></li><li><a href="#pending">Pending bills</a></li><li><a href="#revenue">Revenue</a></li><li><a href="#audit">Audit</a></li><li><a href="#gaps">Gaps</a></li>
      </ul></nav>

      <section id="spending" className="card insight" aria-labelledby="spending-h">
        <p className="eyebrow">Insight 1</p>
        <h2 id="spending-h">Spending is up {Math.round(nomGrowth)} per cent in shillings, but only about {Math.round(realGrowth)} per cent after prices</h2>
        <p className="finding">
          The county spent KSh {bn(first.spent)} billion in {label(first.fy)} and KSh {bn(last.spent)} billion in {label(last.fy)}. Prices rose over the same period, so the same {label(first.fy)} spending is worth about KSh {bn(realFirst)} billion in {label(BASE)} prices. In real terms the county spends {realGrowth >= 0 ? 'about' : 'about'} {Math.abs(Math.round(realGrowth))} per cent {realGrowth >= 0 ? 'more' : 'less'} than ten years ago, while its population grew.
        </p>
        <h3 className="mini">Spent against approved budget, KSh billion (marker is the approved budget)</h3>
        <BarList
          label="Spending against approved budget by year"
          unit=" bn"
          format={bn}
          items={years.filter((y) => y.spent !== undefined && y.approved !== undefined).map((y) => ({ label: label(y.fy), value: y.spent, compareTo: y.approved }))}
        />
        <h3 className="mini">Real spending, KSh billion in {label(BASE)} prices</h3>
        <BarList
          label="Real spending by year"
          unit=" bn"
          format={bn}
          accent="navy"
          items={withSpend.map((y) => ({ label: label(y.fy), value: y.spent * deflator(y.fy) }))}
        />
        <p className="how"><b>How we calculated this.</b> Spending is nominal from each year's Controller of Budget report. Real values multiply by the ratio of the {label(BASE)} price index to that year's index. Each fiscal-year index is the average of the two calendar-year World Bank consumer price indices it spans, so the real view is approximate. FY 2019/20 is missing because that report could not be downloaded.</p>
      </section>

      <section id="development" className="card insight" aria-labelledby="dev-h">
        <p className="eyebrow">Insight 2</p>
        <h2 id="dev-h">The development budget is rarely fully spent: it ranged from {devMin.development_absorption_pct} to {devMax.development_absorption_pct} per cent</h2>
        <p className="finding">Absorption is the share of the approved budget actually spent. The lowest year was {label(devMin.fy)} at {devMin.development_absorption_pct} per cent and the highest was {label(devMax.fy)} at {devMax.development_absorption_pct} per cent. Recurrent spending (salaries and running costs) usually uses most of its budget.</p>
        <h3 className="mini">Development budget spent, per cent</h3>
        <BarList label="Development absorption by year" unit="%" format={(v) => v.toFixed(1)} accent="mint" items={dev.map((y) => ({ label: label(y.fy), value: y.development_absorption_pct }))} />
        <h3 className="mini">Recurrent budget spent, per cent</h3>
        <BarList label="Recurrent absorption by year" unit="%" format={(v) => v.toFixed(1)} items={years.filter((y) => y.recurrent_absorption_pct !== undefined).map((y) => ({ label: label(y.fy), value: y.recurrent_absorption_pct }))} />
        <p className="how"><b>Reading the numbers.</b> These are the percentages stated by the Controller of Budget, checked against our own division of spending by budget (the validator allows a small difference for rounding). Where the two differ, the year's note on the Data page says so.</p>
      </section>

      <section id="pending" className="card insight" aria-labelledby="pending-h">
        <p className="eyebrow">Insight 3</p>
        <h2 id="pending-h">Unpaid bills grew from KSh {m(pendFirst.v)} million to KSh {m(pendLast.v)} million</h2>
        <p className="finding">Pending bills are money owed for goods and services already delivered. The reported stock was KSh {m(pendFirst.v)} million at the end of {label(pendFirst.fy)} and KSh {m(pendLast.v)} million at the end of {label(pendLast.fy)}. The reports use slightly different definitions, and two reports disagree about the stock at 30 June 2021, so read the direction rather than each step.</p>
        <BarList label="Pending bills at year end" unit=" m" format={m} accent="red" items={pend.map((p) => ({ label: label(p.fy), value: p.v }))} />
        <p className="how"><b>Conflict.</b> At 30 June 2021 the FY 2020/21 report gives KSh 1,061 million, while the FY 2021/22 report gives KSh 602 million for the same date. We plot the figure from the report for that year and show both here. Years without a bar (FY 2019/20 and FY 2024/25) could not be read.</p>
      </section>

      <section id="revenue" className="card insight" aria-labelledby="rev-h">
        <p className="eyebrow">Insight 4</p>
        <h2 id="rev-h">Own-source revenue is about {osrRealMultiple.toFixed(1)} times its real level of FY 2013/14, but the definition changed</h2>
        <p className="finding">The county's own revenue rose from KSh {m(osrFirst.value)} million in {label(osrFirst.fy)} to KSh {m(osrLast.value)} million in {label(osrLast.fy)}. Adjusting for prices, {label(osrFirst.fy)} is worth about KSh {m(osrRealFirst)} million in {label(BASE)} money. The FY 2020/21 report attributes that year's jump to enhanced collection of NHIF capitation and Linda Mama revenue, so the series is not like for like. Two years have conflicting values.</p>
        <BarList label="Own-source revenue by year" unit=" m" format={m} items={osr.map((p) => ({ label: label(p.fy), value: p.value, compareTo: p.alternate ? p.alternate.value : undefined, sub: p.alternate ? 'Reports differ' : undefined }))} />
        <ul className="how">
          {hist.osr_series.conflicts.map((c) => <li key={c}>{c}</li>)}
          <li>FY 2023/24: KSh 610.74 million in the FY 2023/24 report against KSh 427.95 million in the FY 2024/25 report. The marker shows the alternate value.</li>
          <li>FY 2022/23 excludes KSh 105.81 million of appropriations-in-aid; with it the total is KSh 508.04 million.</li>
        </ul>
      </section>

      <section id="audit" className="card insight" aria-labelledby="audit-h">
        <p className="eyebrow">Insight 5</p>
        <h2 id="audit-h">Auditors have not given the County Executive a clean opinion in any year we can read</h2>
        <p className="finding">Four years of Auditor-General opinions are available. Three were qualified and one, FY 2021/22, was adverse, which means the auditor found the accounts materially misstated. An opinion describes the accounts, not the quality of services. Earlier years could not be obtained.</p>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Auditor-General opinions on the County Executive of Siaya</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Opinion</th><th scope="col">Main matters</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {hist.audits.points.map((a) => (
                <tr key={a.fy}>
                  <th scope="row">FY {a.fy}</th>
                  <td><span className={`tag ${a.opinion === 'Adverse' ? 'warn' : ''}`}>{a.opinion}</span></td>
                  <td>{a.reasons}. <a href={a.url}>Report</a></td>
                  <td>{a.confidence} of 5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="how">{hist.audits.note}</p>
      </section>

      <section id="gaps" className="card" aria-labelledby="gaps-h">
        <h2 id="gaps-h">What is missing</h2>
        <ul className="steps">{hist.meta.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
      </section>
    </main>
  );
}
