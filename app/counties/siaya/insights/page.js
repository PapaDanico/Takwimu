import Link from 'next/link';
import OsrNote from '../../../../components/OsrNote';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import { LineChart, ColumnChart } from '../../../../components/Charts';
import Donut from '../../../../components/Donut';
import StatStrip from '../../../../components/StatStrip';
import { Provisional } from '../../../../components/ObsTable';
import DataStamp from '../../../../components/DataStamp';
import { shortDate } from '../../../../lib/format';
import { SITE_UPDATED } from '../../../../lib/site';
import hist from '../../../../data/history.json';
import cpi from '../../../../data/cpi.json';
import ledger from '../../../../data/siaya-fiscal-ledger.json';

export const metadata = {
  title: 'Ten-year insights: Siaya County finances',
  description: 'Siaya County over ten years in plain language: spending with prices adjusted, audit opinions, and links to the canonical pages for share of budget spent, pending bills and own-source revenue.',
  alternates: { canonical: '/counties/siaya/insights/' },
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
// Years whose year-end stock has an open discrepancy in the fiscal ledger (another document gives a different stock).
const PEND_DISPUTED = new Set(ledger.discrepancies.filter((d) => d.indicator_id === 'pending_bills_close' && d.status === 'open').map((d) => d.period.replace('FY ', '')));
// Years whose own-source revenue total has an open discrepancy in the fiscal ledger (as on the Siaya hub).
const OSR_DISPUTED = new Set(ledger.discrepancies.filter((d) => d.indicator_id === 'osr_total_actual' && d.status === 'open').map((d) => d.period.replace('FY ', '')));

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
const auditRange = `FY ${audits[0].fy} to FY ${audits[audits.length - 1].fy}`;
const auditCounts = ['Unqualified', 'Qualified', 'Adverse', 'Disclaimer'].map((o) => `${nOp(o).length} ${o.toLowerCase()}`).join(', ');

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
const absLast = years.filter((y) => y.development_absorption_pct !== undefined).slice(-1)[0];
const osrPts = hist.osr_series.points;
const kpis = [
  { label: 'Spent, FY 2024/25', value: bn(cur.spent), unit: 'KSh bn', delta: `${Math.round(nomGrowth)}% above FY 2014/15`, note: 'Nominal', spark: col((y) => y.spent) },
  { label: 'Real change in ten years', value: `${realGrowth >= 0 ? '+' : ''}${Math.round(realGrowth)}%`, delta: 'After adjusting for prices', tone: realGrowth >= 0 ? 'up' : 'down', note: `${label(first.fy)} to ${label(last.fy)}`, spark: col((y) => realOf(y.spent, y.fy)) },
  { label: 'Share of development budget spent', value: `${absLast.development_absorption_pct}%`, delta: label(absLast.fy), spark: col((y) => y.development_absorption_pct), href: '/counties/siaya/analysis/#spent', link: 'Ten years, with recurrent, on Siaya analysis' },
  { label: 'Pending bills', value: m(pendLast.v), unit: 'KSh m', delta: `at end of ${label(pendLast.fy)}${PEND_DISPUTED.has(pendLast.fy) ? '; sources disagree' : ''}`, spark: col(pendOf), href: '/counties/siaya/analysis/#pending', link: 'Every year and the roll-forward, on Siaya analysis' },
  { label: 'Own-source revenue', value: m(osrPts[osrPts.length - 1].value), unit: 'KSh m', delta: `${label(osrPts[osrPts.length - 1].fy)}${OSR_DISPUTED.has(osrPts[osrPts.length - 1].fy) ? '; sources disagree' : ''}`, spark: FYS.map((fy) => (osrByFy[fy] ? osrByFy[fy].value : null)), href: '/counties/siaya/ledger/#osr-ten', link: 'Every source and year, on the ledger' },
  { label: 'Latest audit opinion', value: audits[audits.length - 1].opinion, delta: `FY ${audits[audits.length - 1].fy}`, note: 'County Executive accounts' },
];

export default function Insights() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Insights" title="Ten years of Siaya County finances" sub="What ten years of Controller of Budget and Auditor-General reports add up to, FY 2014/15 to FY 2024/25, in plain language. Each measure has one home page with every figure and source; this page links to it. Gaps are marked, never filled in." path="/counties/siaya/insights/" shareText="Ten years of Siaya County finances" />
      <DataStamp period={`FY 2014/15 to FY ${FYS[FYS.length - 1]} (July 2014 to June 2025); FY 2013/14 (16 months) shown where available`} checked={shortDate(hist.meta.retrieved)} updated={shortDate(SITE_UPDATED)} completeness={`Spending for ${years.filter((y) => y.spent !== undefined).length} of ${FYS.length} years; budget for ${years.filter((y) => y.approved !== undefined).length}; audit opinions for ${hist.audits.points.length}. Missing years are left blank, never filled.`} />

      <Provisional dataset={['history', 'siaya-fiscal-ledger']}>Figures were transcribed by Takwimu from the Controller of Budget and Auditor-General reports and have not yet been checked by a reviewer.</Provisional>

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#spending">Spending</a></li><li><a href="#audit">Audit</a></li><li><a href="#gaps">Gaps</a></li>
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
        <p className="how"><b>How we calculated this.</b> Spending is nominal, from each year's Controller of Budget report; real values are at {label(BASE)} prices, worked out as set out in the <Link href="/method/#prices">method</Link>. FY 2019/20: Controller of Budget report not found, so the series has no spending for that year; the county&apos;s own and the Senate&apos;s figures for it are on the <Link href="/counties/siaya/ledger/">fiscal reconciliation ledger</Link>.</p>
      </section>

      <section id="audit" className="card insight" aria-labelledby="audit-h">
        <p className="eyebrow">Insight 2</p>
        <h2 id="audit-h">Auditor-General opinions on the County Executive, {auditRange}: {auditCounts}</h2>
        <p className="finding">{audits.length} years of opinions are available ({auditSummary}). An adverse opinion means the auditor found the accounts materially misstated; a disclaimer means the auditor could not form an opinion. An opinion describes the accounts, not the quality of services. FY 2016/17 to FY 2018/19 are missing, and FY 2014/15 and FY 2015/16 come from a Senate compilation rather than the audit reports; see the note below.</p>
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
        <p className="lead">{hist.meta.gaps.length} gaps in the ten-year series are listed, with their reasons, once: see <Link href="/method/#known-gaps">known gaps</Link>. Nothing is filled or estimated.</p>
      </section>
      <OsrNote />
    </main>
  );
}
