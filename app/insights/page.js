import PageHead from '../../components/PageHead';
import { LineChart, ColumnChart } from '../../components/Charts';
import Donut from '../../components/Donut';
import StatStrip from '../../components/StatStrip';
import DataStamp from '../../components/DataStamp';
import { shortDate } from '../../lib/format';
import { SITE_UPDATED } from '../../lib/site';
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

const audits = hist.audits.points;
const nOp = (o) => audits.filter((a) => a.opinion === o);
const auditSummary = ['Qualified', 'Adverse', 'Disclaimer', 'Unqualified']
  .filter((o) => nOp(o).length)
  .map((o) => `${nOp(o).length} ${o.toLowerCase()}${nOp(o).length && o !== 'Qualified' && o !== 'Unqualified' ? ` (${nOp(o).map((a) => `FY ${a.fy}`).join(', ')})` : ''}`)
  .join(', ');
const noneClean = nOp('Unqualified').length === 0;

const FYS = ['2013/14', '2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25'];
const by = Object.fromEntries(years.map((y) => [y.fy, y]));
const short = (fy) => fy.slice(2);
const SHORT = FYS.map(short);
const col = (fn) => FYS.map((fy) => (by[fy] ? fn(by[fy]) ?? null : null));
const pendOf = (y) => y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined);
const osrByFy = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
const cur = by['2024/25'];
const kpis = [
  { label: 'Spent, FY 2024/25', value: bn(cur.spent), unit: 'KSh bn', delta: `${Math.round(nomGrowth)}% above FY 2014/15`, note: 'Nominal', spark: col((y) => y.spent) },
  { label: 'Real change in ten years', value: `${realGrowth >= 0 ? '+' : ''}${Math.round(realGrowth)}%`, delta: 'After adjusting for prices', tone: realGrowth >= 0 ? 'up' : 'down', note: `${label(first.fy)} to ${label(last.fy)}`, spark: col((y) => y.spent * deflator(y.fy)) },
  { label: 'Development spent', value: `${cur.development_absorption_pct}%`, delta: 'of the development budget', note: `Range ${devMin.development_absorption_pct} to ${devMax.development_absorption_pct}%`, spark: col((y) => y.development_absorption_pct) },
  { label: 'Pending bills', value: m(pendLast.v), unit: 'KSh m', delta: `at end of ${label(pendLast.fy)}`, tone: 'down', note: 'Unpaid for goods and services delivered', spark: col(pendOf) },
  { label: 'Latest audit opinion', value: audits[audits.length - 1].opinion, delta: `FY ${audits[audits.length - 1].fy}`, note: 'County Executive accounts' },
];

export default function Insights() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Insights" title="Ten years of Siaya County finances" sub="Budget, spending, revenue, unpaid bills and audit opinions from the Controller of Budget and Auditor-General reports, FY 2014/15 to FY 2024/25. Gaps are marked, never filled in." path="/insights/" shareText="Ten years of Siaya County finances" />
      <DataStamp period={`FY ${FYS[0]} to FY ${FYS[FYS.length - 1]} (July 2013 to June 2025)`} checked={shortDate(hist.meta.retrieved)} updated={shortDate(SITE_UPDATED)} completeness={`Spending for ${years.filter((y) => y.spent !== undefined).length} of ${FYS.length} years; budget for ${years.filter((y) => y.approved !== undefined).length}; audit opinions for ${hist.audits.points.length}. Missing years are left blank, never filled.`} />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#spending">Spending</a></li><li><a href="#development">Development</a></li><li><a href="#pending">Pending bills</a></li><li><a href="#revenue">Revenue</a></li><li><a href="#audit">Audit</a></li><li><a href="#gaps">Gaps</a></li><li><a href="/analytics/">More analytics</a></li>
      </ul></nav>

      <StatStrip label="Key figures" items={kpis} />

      <section id="spending" className="card insight" aria-labelledby="spending-h">
        <p className="eyebrow">Insight 1</p>
        <h2 id="spending-h">Spending is up {Math.round(nomGrowth)} per cent in shillings, but only about {Math.round(realGrowth)} per cent after prices</h2>
        <p className="finding">
          The county spent KSh {bn(first.spent)} billion in {label(first.fy)} and KSh {bn(last.spent)} billion in {label(last.fy)}. Prices rose over the same period, so the same {label(first.fy)} spending is worth about KSh {bn(realFirst)} billion in {label(BASE)} prices. In real terms the county spends {realGrowth >= 0 ? 'about' : 'about'} {Math.abs(Math.round(realGrowth))} per cent {realGrowth >= 0 ? 'more' : 'less'} than ten years ago, while its population grew.
        </p>
        <div className="chartgrid two">
          <div>
            <h3 className="chart-title">Approved budget and spending, KSh billion</h3>
            <p className="chart-sub">The gap between the two columns is budget that was not spent.</p>
            <ColumnChart labels={SHORT} yFormat="one" unit="KSh bn" ariaLabel="Approved budget and spending by fiscal year, KSh billion" series={[{ name: 'Approved budget', color: 1, values: col((y) => y.approved) }, { name: 'Spent', color: 2, values: col((y) => y.spent) }]} />
          </div>
          <div>
            <h3 className="chart-title">Nominal and real spending, KSh billion</h3>
            <p className="chart-sub">The dashed line removes the effect of rising prices ({label(BASE)} prices).</p>
            <LineChart labels={SHORT} yFormat="one" unit="KSh bn" ariaLabel="Nominal and real spending by fiscal year, KSh billion" series={[{ name: 'Nominal', color: 1, values: col((y) => y.spent) }, { name: 'Real', color: 2, dash: true, values: col((y) => y.spent * deflator(y.fy)) }]} />
          </div>
        </div>
        <h3 className="chart-title">Where the {label(BASE)} budget went</h3>
        <p className="chart-sub">Share of the approved budget of KSh {bn(cur.approved)} billion.</p>
        <Donut ariaLabel={`How the ${label(BASE)} approved budget was used`} centerValue={`${Math.round((cur.spent / cur.approved) * 100)}%`} centerLabel="of budget spent" format={bn} unit=" bn" items={[{ label: 'Recurrent spending', value: cur.recurrent_spent, color: 1 }, { label: 'Development spending', value: cur.development_spent, color: 3 }, { label: 'Not spent', value: cur.approved - cur.spent, color: 4 }]} />
        <p className="how"><b>How we calculated this.</b> Spending is nominal from each year's Controller of Budget report. Real values multiply by the ratio of the {label(BASE)} price index to that year's index. Each fiscal-year index is the average of the two calendar-year World Bank consumer price indices it spans, so the real view is approximate. FY 2019/20 is missing because that report could not be downloaded.</p>
      </section>

      <section id="development" className="card insight" aria-labelledby="dev-h">
        <p className="eyebrow">Insight 2</p>
        <h2 id="dev-h">The development budget is rarely fully spent: it ranged from {devMin.development_absorption_pct} to {devMax.development_absorption_pct} per cent</h2>
        <p className="finding">Absorption is the share of the approved budget actually spent. The lowest year was {label(devMin.fy)} at {devMin.development_absorption_pct} per cent and the highest was {label(devMax.fy)} at {devMax.development_absorption_pct} per cent. Recurrent spending (salaries and running costs) usually uses most of its budget. Low spending does not by itself show whether projects were delivered: payments can fall in a later year, and a qualified audit opinion is about the accounts, not about misconduct.</p>
        <h3 className="chart-title">Share of each budget spent, per cent</h3>
        <p className="chart-sub">Recurrent spending sits near the top; development spending swings widely.</p>
        <LineChart labels={SHORT} yFormat="pct0" unit="%" yMaxFixed={100} refLine={{ value: 100, label: 'Whole budget' }} ariaLabel="Share of the recurrent and development budgets spent, by fiscal year" series={[{ name: 'Development', color: 3, values: col((y) => y.development_absorption_pct) }, { name: 'Recurrent', color: 1, values: col((y) => y.recurrent_absorption_pct) }]} />
        <p className="how"><b>Reading the numbers.</b> These are the percentages stated by the Controller of Budget, checked against our own division of spending by budget (the validator allows a small difference for rounding). Where the two differ, the year's note on the Data page says so.</p>
      </section>

      <section id="pending" className="card insight" aria-labelledby="pending-h">
        <p className="eyebrow">Insight 3</p>
        <h2 id="pending-h">Unpaid bills grew from KSh {m(pendFirst.v)} million to KSh {m(pendLast.v)} million</h2>
        <p className="finding">Pending bills are money owed for goods and services already delivered. The reported stock was KSh {m(pendFirst.v)} million at the end of {label(pendFirst.fy)} and KSh {m(pendLast.v)} million at the end of {label(pendLast.fy)}. The reports use slightly different definitions, and two reports disagree about the stock at 30 June 2021, so read the direction rather than each step.</p>
        <h3 className="chart-title">Pending bills at year end, KSh million</h3>
        <ColumnChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Pending bills at the end of each fiscal year, KSh million" series={[{ name: 'Pending bills', color: 2, values: col(pendOf) }]} />
        <p className="how"><b>Conflict.</b> At 30 June 2021 the FY 2020/21 report gives KSh 1,061 million, while the FY 2021/22 report gives KSh 602 million for the same date. We plot the figure from the report for that year and show both here. Years without a column (FY 2013/14, FY 2014/15, FY 2019/20 and FY 2024/25) could not be read or were incomplete.</p>
      </section>

      <section id="revenue" className="card insight" aria-labelledby="rev-h">
        <p className="eyebrow">Insight 4</p>
        <h2 id="rev-h">Own-source revenue is about {osrRealMultiple.toFixed(1)} times its real level of FY 2013/14, but the definition changed</h2>
        <p className="finding">The county's own revenue rose from KSh {m(osrFirst.value)} million in {label(osrFirst.fy)} to KSh {m(osrLast.value)} million in {label(osrLast.fy)}. Adjusting for prices, {label(osrFirst.fy)} is worth about KSh {m(osrRealFirst)} million in {label(BASE)} money. The FY 2020/21 report attributes that year's jump to enhanced collection of NHIF capitation and Linda Mama revenue, so the series is not like for like. Two years have conflicting values.</p>
        <h3 className="chart-title">Own-source revenue, KSh million</h3>
        <p className="chart-sub">Hollow markers show the other report&apos;s value where two reports disagree.</p>
        <LineChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Own-source revenue by fiscal year, KSh million, nominal and real" series={[{ name: 'Nominal', color: 1, values: FYS.map((fy) => (osrByFy[fy] ? osrByFy[fy].value : null)), alt: FYS.map((fy) => (osrByFy[fy] && osrByFy[fy].alternate ? osrByFy[fy].alternate.value : null)) }, { name: 'Real', color: 2, dash: true, values: FYS.map((fy) => (osrByFy[fy] ? osrByFy[fy].value * deflator(fy) : null)) }]} />
        <ul className="how">
          {hist.osr_series.conflicts.map((c) => <li key={c}>{c}</li>)}
          <li>FY 2023/24: KSh 610.74 million in the FY 2023/24 report against KSh 427.95 million in the FY 2024/25 report. The hollow marker shows the alternate value.</li>
          <li>FY 2022/23 excludes KSh 105.81 million of appropriations-in-aid; with it the total is KSh 508.04 million.</li>
        </ul>
      </section>

      <section id="audit" className="card insight" aria-labelledby="audit-h">
        <p className="eyebrow">Insight 5</p>
        <h2 id="audit-h">{noneClean ? 'Auditors have not given the County Executive a clean opinion in any year we can read' : 'Audit opinions vary by year'}</h2>
        <p className="finding">{audits.length} years of Auditor-General opinions are available: {auditSummary}. An adverse opinion means the auditor found the accounts materially misstated; a disclaimer means the auditor could not form an opinion. An opinion describes the accounts, not the quality of services. Years between FY 2013/14 and FY 2019/20 are mostly missing; see the note below.</p>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Auditor-General opinions on the County Executive of Siaya</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Opinion</th><th scope="col">Main matters</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {hist.audits.points.map((a) => (
                <tr key={a.fy}>
                  <th scope="row">FY {a.fy}</th>
                  <td><span className={`tag ${a.opinion === 'Adverse' ? 'warn' : ''}`}>{a.opinion}</span></td>
                  <td>{a.reasons}. <a href={a.url}>Report</a>{a.period ? <small style={{ display: "block" }}>Period: {a.period}</small> : null}</td>
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
