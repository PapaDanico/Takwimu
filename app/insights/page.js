import Link from 'next/link';
import PageHead from '../../components/PageHead';
import TableWrap from '../../components/TableWrap';
import { LineChart, ColumnChart } from '../../components/Charts';
import Donut from '../../components/Donut';
import StatStrip from '../../components/StatStrip';
import DataStamp from '../../components/DataStamp';
import { shortDate } from '../../lib/format';
import { SITE_UPDATED } from '../../lib/site';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';
import manifest from '../../data/source-manifest.json';

const RF = hist.pending_rollforward;
const RF_TERMS = [['opening', 'Opening stock'], ['new_bills', 'New bills'], ['payments', 'Payments'], ['adjustments', 'Write-offs or adjustments'], ['closing', 'Closing stock']];
const DOC = Object.fromEntries(manifest.documents.map((d) => [d.id, d]));
const rfCell = (t) => (typeof t.value === 'number'
  ? <>{t.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="rf-page">PDF p. {t.page}{t.printed_page ? `, printed p. ${t.printed_page}` : ''}{t.note ? `; ${t.note}` : ''}</span></>
  : <span className="rf-np">Not published{t.note ? <span className="rf-page">{t.note}</span> : null}</span>);
const rfComplete = (r) => RF_TERMS.every(([k]) => typeof r[k].value === 'number');

export const metadata = {
  title: 'Ten-year insights: Siaya County finances',
  description: 'Siaya County budget, spending, own-source revenue, pending bills and audit opinions over ten years, with prices adjusted.',
};

const BASE = '2024/25';
const deflator = (fy) => (cpi.fiscal_year[fy] ? cpi.fiscal_year[BASE] / cpi.fiscal_year[fy] : null);
// Real value, or null (a gap) when the value or that year's price index is missing.
const realOf = (v, fy) => (v == null || deflator(fy) === null ? null : v * deflator(fy));
const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
const label = (fy) => `FY ${fy}`;
const bn = (v) => v.toFixed(2);
const m = (v) => Math.round(v).toLocaleString('en-US');

const withSpend = years.filter((y) => y.spent !== undefined);
const first = withSpend.find((y) => y.fy === '2014/15');
const last = withSpend[withSpend.length - 1];
const realFirst = realOf(first.spent, first.fy);
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
const osrRealFirst = realOf(osrFirst.value, osrFirst.fy);
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
// A year missing a field (e.g. FY 2019/20 has no spending) is a gap: any non-finite result becomes null, never NaN.
const finiteOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const col = (fn) => FYS.map((fy) => (by[fy] ? finiteOrNull(fn(by[fy])) : null));
const pendOf = (y) => y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined);
const osrByFy = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
const cur = by['2024/25'];
const kpis = [
  { label: 'Spent, FY 2024/25', value: bn(cur.spent), unit: 'KSh bn', delta: `${Math.round(nomGrowth)}% above FY 2014/15`, note: 'Nominal', spark: col((y) => y.spent) },
  { label: 'Real change in ten years', value: `${realGrowth >= 0 ? '+' : ''}${Math.round(realGrowth)}%`, delta: 'After adjusting for prices', tone: realGrowth >= 0 ? 'up' : 'down', note: `${label(first.fy)} to ${label(last.fy)}`, spark: col((y) => realOf(y.spent, y.fy)) },
  { label: 'Pending bills', value: m(pendLast.v), unit: 'KSh m', delta: `at end of ${label(pendLast.fy)}`, tone: 'down', note: 'Unpaid for goods and services delivered', spark: col(pendOf) },
  { label: 'Latest audit opinion', value: audits[audits.length - 1].opinion, delta: `FY ${audits[audits.length - 1].fy}`, note: 'County Executive accounts' },
];

export default function Insights() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Insights" title="Ten years of Siaya County finances" sub="Budget, spending, revenue, unpaid bills and audit opinions from the Controller of Budget and Auditor-General reports, FY 2014/15 to FY 2024/25. Gaps are marked, never filled in." path="/insights/" shareText="Ten years of Siaya County finances" />
      <DataStamp period={`FY 2014/15 to FY ${FYS[FYS.length - 1]} (July 2014 to June 2025); FY 2013/14 (16 months) shown where available`} checked={shortDate(hist.meta.retrieved)} updated={shortDate(SITE_UPDATED)} completeness={`Spending for ${years.filter((y) => y.spent !== undefined).length} of ${FYS.length} years; budget for ${years.filter((y) => y.approved !== undefined).length}; audit opinions for ${hist.audits.points.length}. Missing years are left blank, never filled.`} />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#spending">Spending</a></li><li><a href="#development">Development</a></li><li><a href="#pending">Pending bills</a></li><li><a href="#revenue">Revenue</a></li><li><a href="#audit">Audit</a></li><li><a href="#gaps">Gaps</a></li><li><a href="/analytics/">More analytics</a></li>
      </ul></nav>

      <StatStrip label="Key figures" items={kpis} />

      <section id="spending" className="card insight" aria-labelledby="spending-h">
        <p className="eyebrow">Insight 1</p>
        <h2 id="spending-h">Spending rose {Math.round(nomGrowth)} per cent in shillings and about {Math.round(realGrowth)} per cent after prices</h2>
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
            <LineChart labels={SHORT} yFormat="one" unit="KSh bn" ariaLabel="Nominal and real spending by fiscal year, KSh billion" series={[{ name: 'Nominal', color: 1, values: col((y) => y.spent) }, { name: 'Real', color: 2, dash: true, values: col((y) => realOf(y.spent, y.fy)) }]} />
          </div>
        </div>
        <h3 className="chart-title">Where the {label(BASE)} budget went</h3>
        <p className="chart-sub">Share of the approved budget of KSh {bn(cur.approved)} billion.</p>
        <Donut ariaLabel={`How the ${label(BASE)} approved budget was used`} centerValue={`${Math.round((cur.spent / cur.approved) * 100)}%`} centerLabel="of budget spent" format={bn} unit=" bn" items={[{ label: 'Recurrent spending', value: cur.recurrent_spent, color: 1 }, { label: 'Development spending', value: cur.development_spent, color: 3 }, { label: 'Not spent', value: cur.approved - cur.spent, color: 4 }]} />
        <p className="how"><b>How we calculated this.</b> Spending is nominal, from each year's Controller of Budget report; real values are at {label(BASE)} prices, worked out as set out in the <Link href="/method/#prices">method</Link>. FY 2019/20 is missing because that report was not found; only its own-source revenue is known.</p>
      </section>

      <section id="development" className="card insight" aria-labelledby="dev-h">
        <p className="eyebrow">Insight 2</p>
        <h2 id="dev-h">Development spending ranged from {devMin.development_absorption_pct} to {devMax.development_absorption_pct} per cent of its budget</h2>
        <p className="finding">Absorption is the share of the approved budget actually spent. The lowest year was {label(devMin.fy)} at {devMin.development_absorption_pct} per cent and the highest was {label(devMax.fy)} at {devMax.development_absorption_pct} per cent. Recurrent spending (salaries and running costs) usually uses most of its budget. Low spending does not by itself show whether projects were delivered: payments can fall in a later year, and a qualified audit opinion is about the accounts, not about misconduct.</p>
        <h3 className="chart-title">Share of each budget spent, per cent</h3>
        <p className="chart-sub">Recurrent spending sits near the top; development spending swings widely.</p>
        <LineChart labels={SHORT} yFormat="pct0" unit="%" yMaxFixed={100} refLine={{ value: 100, label: 'Whole budget' }} ariaLabel="Share of the recurrent and development budgets spent, by fiscal year" series={[{ name: 'Development', color: 3, dash: true, values: col((y) => y.development_absorption_pct) }, { name: 'Recurrent', color: 1, values: col((y) => y.recurrent_absorption_pct) }]} />
        <p className="how"><b>Reading the numbers.</b> These are the percentages stated by the Controller of Budget, checked against our own division of spending by budget (the validator allows a small difference for rounding). Where the two differ, the year's note on the Data page says so.</p>
      </section>

      <section id="pending" className="card insight" aria-labelledby="pending-h">
        <p className="eyebrow">Insight 3</p>
        <h2 id="pending-h">Pending bills rose from KSh {m(pendFirst.v)} million to KSh {m(pendLast.v)} million</h2>
        <p className="finding">Pending bills are money owed for goods and services already delivered. The reported stock was KSh {m(pendFirst.v)} million at the end of {label(pendFirst.fy)} and KSh {m(pendLast.v)} million at the end of {label(pendLast.fy)}. The reports use slightly different definitions, and two reports disagree about the stock at 30 June 2021, so read the direction rather than each step.</p>
        <h3 className="chart-title">Pending bills at year end, KSh million</h3>
        <ColumnChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Pending bills at the end of each fiscal year, KSh million" series={[{ name: 'Pending bills', color: 2, values: col(pendOf) }]} />
        <h3 className="chart-title" id="rollforward-h">How the stock changes each year: the roll-forward</h3>
        <p className="chart-sub">{RF.identity.replace(/^./, (c) => c.toUpperCase())}. KSh million. Each term comes from that year&apos;s Controller of Budget report, with its page.</p>
        <div className="tablewrap" id="rollforward" tabIndex={0} role="region" aria-labelledby="rollforward-h">
          <table className="data rf">
            <caption className="sr-only">Pending bills roll-forward by fiscal year, KSh million, with the page of each published term</caption>
            <thead><tr><th scope="col">Fiscal year</th>{RF_TERMS.map(([k, l]) => <th key={k} scope="col">{l}</th>)}<th scope="col">Complete?</th></tr></thead>
            <tbody>
              {RF.years.map((r) => (
                <tr key={r.fy}>
                  <th scope="row">{label(r.fy)}{r.source_id ? <span className="rf-page"><a href={DOC[r.source_id].url}>FY {DOC[r.source_id].fiscal_year} report</a></span> : <span className="rf-page">No report found</span>}</th>
                  {RF_TERMS.map(([k]) => <td key={k}>{rfCell(r[k])}</td>)}
                  <td>{rfComplete(r) ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="how"><b>Reading the roll-forward.</b> {RF.note} {RF.years.filter(rfComplete).length} of {RF.years.length} years have every term published. In FY 2021/22 and FY 2022/23 the published terms add up with no adjustment reported, but the reports do not say there were none, so those years stay incomplete.</p>
        <ul className="steps rf-notes">{RF.years.map((r) => <li key={r.fy}><b>{label(r.fy)}.</b> {r.note}</li>)}</ul>
        <p className="how"><b>Conflict.</b> At 30 June 2021 the FY 2020/21 report gives KSh 1,061 million, while the FY 2021/22 report gives KSh 602 million for the same date. We plot each year's figure from the report that gives it (FY 2022/23 and FY 2023/24 come from the following year's report) and show both values here. The FY 2023/24 column (KSh 1,120 million, from the FY 2024/25 report) differs by about 3.7 times from the KSh 304 million in the FY 2023/24 report, which excludes bills incurred in the year; the Data page lists this and two smaller differences (FY 2022/23). Years without a column (FY 2013/14, FY 2014/15 and FY 2019/20) could not be read or were incomplete; FY 2024/25 has no column because its report gives two different year-end stocks (see the roll-forward above).</p>
      </section>

      <section id="revenue" className="card insight" aria-labelledby="rev-h">
        <p className="eyebrow">Insight 4</p>
        <h2 id="rev-h">Own-source revenue is about {osrRealMultiple.toFixed(1)} times its real level of FY 2013/14, but the definition changed</h2>
        <p className="finding">The county's own revenue rose from KSh {m(osrFirst.value)} million in {label(osrFirst.fy)} to KSh {m(osrLast.value)} million in {label(osrLast.fy)}. Adjusting for prices, {label(osrFirst.fy)} is worth about KSh {m(osrRealFirst)} million in {label(BASE)} money. The FY 2020/21 report attributes that year's jump to enhanced collection of NHIF capitation and Linda Mama revenue, so the series is not like for like. Four years show a second value from another report.</p>
        <h3 className="chart-title">Own-source revenue, KSh million</h3>
        <p className="chart-sub">Hollow markers show the other report&apos;s value where two reports disagree.</p>
        <LineChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Own-source revenue by fiscal year, KSh million, nominal and real" series={[{ name: 'Nominal', color: 1, values: FYS.map((fy) => (osrByFy[fy] ? osrByFy[fy].value : null)), alt: FYS.map((fy) => (osrByFy[fy] && osrByFy[fy].alternate ? osrByFy[fy].alternate.value : null)) }, { name: 'Real', color: 2, dash: true, values: FYS.map((fy) => (osrByFy[fy] ? realOf(osrByFy[fy].value, fy) : null)) }]} />
        <ul className="how">
          {hist.osr_series.conflicts.map((c) => <li key={c}>{c}</li>)}
          <li>FY 2023/24: KSh 610.74 million in the FY 2023/24 report against KSh 427.95 million in the FY 2024/25 report. The hollow marker shows the alternate value.</li>
          <li>FY 2022/23 excludes KSh 105.81 million of appropriations-in-aid; with it the total is KSh 508.04 million.</li>
        </ul>
      </section>

      <section id="audit" className="card insight" aria-labelledby="audit-h">
        <p className="eyebrow">Insight 5</p>
        <h2 id="audit-h">{noneClean ? 'Every audit opinion we can read for the County Executive is qualified, adverse or a disclaimer' : 'Audit opinions vary by year'}</h2>
        <p className="finding">{audits.length} years of Auditor-General opinions are available: {auditSummary}. An adverse opinion means the auditor found the accounts materially misstated; a disclaimer means the auditor could not form an opinion. An opinion describes the accounts, not the quality of services. FY 2016/17 to FY 2018/19 are missing, and FY 2014/15 and FY 2015/16 come from a Senate compilation rather than the audit reports; see the note below.</p>
        <TableWrap label="Auditor-General opinions on the County Executive of Siaya">
          <table className="data">
            <caption className="sr-only">Auditor-General opinions on the County Executive of Siaya</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Opinion</th><th scope="col">Main matters</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {hist.audits.points.map((a) => (
                <tr key={a.fy}>
                  <th scope="row">FY {a.fy}</th>
                  <td><span className={`tag ${a.opinion === 'Adverse' ? 'warn' : ''}`}>{a.opinion}</span></td>
                  <td>{a.reasons}. <a href={a.url}>{a.source ? 'Senate compilation' : 'Report'}</a>{a.period ? <small style={{ display: "block" }}>Period: {a.period}</small> : null}{a.caveat ? <small style={{ display: "block" }}>Caveat: {a.caveat}</small> : null}</td>
                  <td>{a.confidence} of 5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="how">{hist.audits.note}</p>
      </section>

      <section id="gaps" className="card" aria-labelledby="gaps-h">
        <h2 id="gaps-h">What is missing</h2>
        <ul className="steps">{hist.meta.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
      </section>
    </main>
  );
}
