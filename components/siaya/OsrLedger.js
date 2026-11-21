import Link from 'next/link';
import TableWrap from '../TableWrap';
import Tile from '../Tile';
import { LineChart, ColumnChart } from '../Charts';
import siaya from '../../data/siaya.json';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';
import analysis from '../../data/siaya-analysis.json';
import { fmt, shortDate } from '../../lib/format';
import { cagr } from '../../lib/analytics';

// Own-source revenue, canonical home /counties/siaya/ledger/ (owner decision U1, 21 Nov 2026). Moved here from the
// Siaya hub (FY 2024/25 sources side by side, composition), from the old Siaya insights page (ten-year series) and from the old
// analytics page (share of spending, revenue against target). Other pages show one summary tile and link here.
const X0 = 160;
const WIDTH = 440;
const MAX = 1000;
const BAR_H = 24;
const xFor = (v) => X0 + (v / MAX) * WIDTH;
const barPath = (x, y, w, h) => `M${x},${y} h${w - 4} a4,4 0 0 1 4,4 v${h - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z`;
const A8 = (id) => analysis.records.find((r) => r.calc_id === id) || {};
const OSR_MIX = { cob2425: A8('SIA-A8-2024-25-cob-report-2024-25'), cty2425: A8('SIA-A8-2024-25-GOV-02-FY2024-25-Q4'), cob2324: A8('SIA-A8-2023-24-cob-report-2023-24'), rank2425: A8('SIA-A8-counties-2024-25-fif-share-rank'), rank2324: A8('SIA-A8-counties-2023-24-fif-share-rank'), dFif: A8('SIA-A8-2024-25-difference-fif'), dOrd: A8('SIA-A8-2024-25-difference-ordinary') };

const BASE = '2024/25';
const FYS = ['2013/14', '2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25'];
const SHORT = FYS.map((f) => f.slice(2));
const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
const by = Object.fromEntries(years.map((y) => [y.fy, y]));
const deflator = (fy) => (cpi.fiscal_year[fy] ? cpi.fiscal_year[BASE] / cpi.fiscal_year[fy] : null);
const realOf = (v, fy) => (v == null || deflator(fy) === null ? null : v * deflator(fy));
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const m0 = (v) => Math.round(v).toLocaleString('en-US');
const osrPts = hist.osr_series.points;
const osrByFy = Object.fromEntries(osrPts.map((p) => [p.fy, p]));
const OSR_CAGR = (() => { const a = by['2014/15'].osr_m; const b = by[BASE].osr_m; return { nom: cagr(a, b, 10), real: cagr(a * deflator('2014/15'), b, 10) }; })();
const osrRealMultiple = osrPts[osrPts.length - 1].value / realOf(osrPts[0].value, osrPts[0].fy);

export const OSR_TOC = [['osr-latest', 'FY 2024/25 sources'], ['osr-mix', 'How it is made up'], ['osr-ten', 'Ten years'], ['osr-share', 'Share of spending and of target']];

export default function OsrLedger() {
  const osr = siaya.own_source_revenue;
  const [primary, county, report] = osr.observations;
  const budget = siaya.budget;
  const ticks = [0, 250, 500, 750, 1000];
  const share = osr.share_of_annual_target_pct;
  const ofBudgetPct = (primary.value / (budget.approved_total * 1000)) * 100;
  const asOf = shortDate(primary.retrieved);
  const rows = [
    { o: primary, label: 'Controller of Budget', sub: 'FY 2024/25 report', y: 20, verified: true },
    { o: report, label: 'County Q4 report', sub: 'Treasury, Table 4', y: 72, verified: true },
    { o: county, label: 'County statement', sub: 'news report (secondary)', y: 124, verified: false },
  ];
  return (
    <>
      <section className="card" id="osr-latest" aria-labelledby="rev">
        <h2 id="rev">Own-source revenue, FY 2024/25: three figures side by side</h2>
        <p className="lead">
          Money the county raises itself from fees, levies and payments at its health facilities,
          as opposed to money sent by the national government.
        </p>
        <div className="tiles">
          <Tile label="Collected" value={fmt(primary.value)} unit="KSh million" note="Stated by the Controller of Budget, including KSh 199 million from health facilities." />
          <Tile label="Share of annual target" value={`${share}%`} tone="warn" note="The report states this. Its Table 2.1 (PDF p. 46) prints the target: KSh 927.34 million." />
          <Tile label="County statement" value={fmt(county.value)} unit="KSh million" dashed tag="News report (secondary)" note={`Reported in the press. The county's own Q4 report gives KSh ${fmt(report.value)} million instead.`} />
          <Tile label="Share of approved budget" value={`${ofBudgetPct.toFixed(1)}%`} note={`Derived: ${fmt(primary.value)} million divided by the KSh ${budget.approved_total} billion approved budget.`} />
        </div>

        <figure className="figure" style={{ margin: '20px 0 0' }}>
          <div className="cap">
            <strong>Siaya own-source revenue, FY {osr.fiscal_year}</strong>
            <span className="tag warn">Sources disagree</span>
          </div>
          <p className="units">Nominal KSh million.</p>
          <svg viewBox="0 0 640 212" role="img" aria-label={`Bar chart: Controller of Budget reports ${fmt(primary.value)} million shillings. The county's fourth-quarter report gives ${fmt(report.value)} million shillings. County statement in the press says ${fmt(county.value)} million shillings, unverified.`}>
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--sand-50)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart)" strokeWidth="3" />
              </pattern>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={xFor(t)} x2={xFor(t)} y1="10" y2="176" stroke="var(--rule)" strokeWidth="1" />
                <text x={xFor(t)} y="194" textAnchor="middle">{t.toLocaleString('en-US')}</text>
              </g>
            ))}
            <g className="bars">
              {rows.map(({ o, label, sub, y, verified }) => (
                <g key={label} className="bar">
                  <title>{`${label}: KSh ${o.value} million. Confidence ${o.confidence} of 5. ${verified ? 'Primary report.' : 'Unverified.'}`}</title>
                  <text className="lab" x="0" y={y + 12} style={{ fontFamily: 'var(--sans)', fontSize: 13 }}>{label}</text>
                  <text x="0" y={y + 28}>{sub}</text>
                  <path d={barPath(X0, y, xFor(o.value) - X0, BAR_H)} fill={verified ? 'var(--chart)' : 'url(#hatch)'} />
                  <text className="lab" x={xFor(o.value) + 8} y={y + 16}>{fmt(o.value)}</text>
                </g>
              ))}
            </g>
          </svg>
          <details className="tableview">
            <summary>View as table</summary>
            <TableWrap label="Own-source revenue by source">
              <table className="data">
                <thead>
                  <tr><th>Source</th><th>KSh million</th><th>Status</th><th>Confidence</th><th>Retrieved</th></tr>
                </thead>
                <tbody>
                  {osr.observations.map((o) => (
                    <tr key={o.source}>
                      <td><a href={o.source_url}>{o.source}</a>{o === county ? <> <span className="tag warn">News report (secondary)</span></> : null}</td>
                      <td className="mono">{fmt(o.value)}</td>
                      <td>{o.status}</td>
                      <td className="mono">{o.confidence} of 5</td>
                      <td className="mono">{shortDate(o.retrieved)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><a href={osr.target.source_url}>Own-source revenue in budget financing (Controller of Budget)</a>: {osr.target.description}</td>
                    <td className="mono">{osr.target.value.toLocaleString('en-US')}</td>
                    <td>{osr.target.status}</td>
                    <td className="mono">{osr.target.confidence} of 5</td>
                    <td className="mono">{shortDate(osr.target.retrieved)}</td>
                  </tr>
                </tbody>
              </table>
            </TableWrap>
          </details>
          <div className="src">
            Sources: <a href={primary.source_url}>{primary.source}</a>; <a href={report.source_url}>{report.source}</a> (PDF page 6, read from the text layer, retrieved {shortDate(report.retrieved)}); <a href={county.source_url}>{county.source}</a>. Retrieved {asOf}.
            <br />
            Notes: the first solid bar is the figure the Controller of Budget states for FY 2024/25 (KSh {fmt(primary.value)} million, including KSh 199 million from health facilities).
            The report calls this 2 per cent more than KSh {fmt(osr.previous_year.value)} million in FY 2023/24, but the previous year&apos;s report gave KSh 610.74 million for that year (see the trend below).
            It is {share} per cent of the annual target; Table 2.1 of the same report prints that target as KSh 927.34 million (PDF p. 46). The budget financing counted about KSh {osr.target.value.toLocaleString('en-US')} million of own-source revenue, and the report does not explain the difference.
            The second solid bar is the county treasury&apos;s own fourth-quarter report: KSh 236.50 million into the County Revenue Fund plus KSh 521.07 million collected and spent at source, mostly at health facilities, against a target of KSh 1,044 million. It is unaudited.
            The hatched bar is the county statement reported in the press. It does not match the county&apos;s own report, and what it counts is not established.
            The three figures are shown side by side, not averaged, and we do not say which is right. See the <Link href="/data/#conflicts">conflict register</Link>, case osr-2024-25-county-statement.
          </div>
        </figure>
        <div className="takeaway"><b>What this means:</b> a gap like this usually means the two figures count different things, such as cash collected against revenue billed, or different reporting dates. Check the definition before the number.</div>
        <ol className="steps" aria-label="How to read this chart">
          <li>Find the units under the title. Here they are millions of shillings.</li>
          <li>Compare the two bars. The solid bar comes from the Controller of Budget&apos;s own report.</li>
          <li>Open the source line to see where each figure comes from and when we retrieved it.</li>
        </ol>
      </section>

      <section className="card" id="osr-mix" aria-labelledby="osr-mix-h">
        <h2 id="osr-mix-h">How own-source revenue is made up</h2>
        <p className="lead">Part of Siaya&apos;s own-source revenue is Facility Improvement Financing (FIF): money its hospitals and health facilities collect, lawful own-source revenue under the Facility Improvement Financing Act, 2023. The rest is ordinary revenue such as fees, licences and levies.</p>
        <ul className="how">
          <li>FY 2024/25: FIF is {OSR_MIX.cob2425.result}% of own-source revenue in the Controller of Budget&apos;s Table 2.1 and {OSR_MIX.cty2425.result}% in the county&apos;s Q4 report. The two documents differ by KSh {OSR_MIX.dFif.result} million in FIF and KSh {OSR_MIX.dOrd.result} million in ordinary revenue, so the gap between KSh 436.68 million and KSh 757.57 million lies in hospital and health facility receipts, not in ordinary revenue (case <a href="/data/#osr-2024-25-county-statement">osr-2024-25-county-statement</a>).</li>
          <li>FY 2023/24: FIF is {OSR_MIX.cob2324.result}% (Controller of Budget). Among counties with a printed value, Siaya&apos;s FIF share is position {OSR_MIX.rank2324.result} of {OSR_MIX.rank2324.flags && OSR_MIX.rank2324.flags.n_counties} in FY 2023/24 and {OSR_MIX.rank2425.result} of {OSR_MIX.rank2425.flags && OSR_MIX.rank2425.flags.n_counties} in FY 2024/25 (1 = highest share).</li>
        </ul>
        <p className="src">Calculated by Takwimu Kenya from published figures. Every input, page and the all-county table: <Link href="/counties/siaya/analysis/#an-a8">Siaya analysis, own-source revenue composition</Link>.</p>
      </section>

      <section className="card" id="osr-ten" aria-labelledby="osr-ten-h">
        <h2 id="osr-ten-h">Ten years of own-source revenue: about {osrRealMultiple.toFixed(1)} times its real level of FY 2013/14, but the definition changed</h2>
        <p className="lead">The county&apos;s own revenue rose from KSh {m0(osrPts[0].value)} million in FY {osrPts[0].fy} to KSh {m0(osrPts[osrPts.length - 1].value)} million in FY {osrPts[osrPts.length - 1].fy}; FY {osrPts[0].fy} is worth about KSh {m0(realOf(osrPts[0].value, osrPts[0].fy))} million in FY {BASE} prices. The FY 2020/21 report attributes that year&apos;s jump to enhanced collection of NHIF capitation and Linda Mama revenue, so the series is not like for like. Hollow markers show the other report&apos;s value where two reports disagree.</p>
        <LineChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Own-source revenue by fiscal year, KSh million, nominal and real" series={[{ name: 'Nominal', color: 1, values: FYS.map((fy) => (osrByFy[fy] ? osrByFy[fy].value : null)), alt: FYS.map((fy) => (osrByFy[fy] && osrByFy[fy].alternate ? osrByFy[fy].alternate.value : null)) }, { name: `Real (FY ${BASE} prices)`, color: 2, dash: true, values: FYS.map((fy) => (osrByFy[fy] ? realOf(osrByFy[fy].value, fy) : null)) }]} />
        <ul className="how">
          {hist.osr_series.conflicts.map((c) => <li key={c}>{c}</li>)}
          <li>FY 2023/24: KSh 610.74 million in the FY 2023/24 report against KSh 427.95 million in the FY 2024/25 report. The hollow marker shows the alternate value.</li>
          <li>Compound annual growth, FY 2014/15 to FY {BASE}: {OSR_CAGR.nom.toFixed(1)} per cent a year in shillings and {OSR_CAGR.real.toFixed(1)} per cent after prices. The definition widened over the period, so this overstates like-for-like growth.</li>
          <li>FY 2022/23 is KSh 402.23 million of ordinary own-source revenue and excludes KSh 105.81 million of appropriations-in-aid; with them the report gives KSh 508.04 million. FY 2023/24 (KSh 610.74 million) includes health facility income.</li>
        </ul>
        <details className="tableview" id="osr-recent">
          <summary>What each of the last four years includes</summary>
          <TableWrap label="Own-source revenue by fiscal year, FY 2021/22 to FY 2024/25">
            <table className="data">
              <caption className="sr-only">Own-source revenue by fiscal year with what each figure includes</caption>
              <thead><tr><th scope="col">Fiscal year</th><th scope="col">KSh million</th><th scope="col">Confidence</th><th scope="col">What it includes</th></tr></thead>
              <tbody>
                {osr.trend.points.map((p) => (
                  <tr key={p.fiscal_year}>
                    <th scope="row" className="mono">{p.fiscal_year}</th>
                    <td className="mono">{fmt(p.value)}{p.alternate ? ` (and ${fmt(p.alternate.value)} in the next report)` : ''}</td>
                    <td className="mono">confidence {p.confidence} of 5</td>
                    <td>{p.note}{p.alternate ? ` ${p.alternate.note}` : ''}{p.corroboration ? ` ${p.corroboration}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </details>
        <div className="takeaway"><b>What this means:</b> two Controller of Budget reports give different figures for the same year, FY 2023/24 (KSh 610.74 million and KSh 427.95 million). Whether Siaya&apos;s own revenue fell sharply in FY 2024/25 or rose 2 per cent depends on which figure is right. In the reports&apos; own breakdowns, health facility financing (FIF) fell from KSh 388.63 million to KSh 199.84 million, while ordinary own-source revenue rose from KSh 222.11 million to KSh 236.84 million (Table 2.1 of each report). See the <Link href="/counties/siaya/analysis/#an-a8">own-source revenue composition</Link>. Check which figures a report is comparing before drawing a trend.</div>
        <p className="src">Sources: Controller of Budget county reports for <a href={osr.trend.points[1].source_url}>FY 2022/23</a> and <a href={osr.trend.points[3].source_url}>FY 2024/25</a>, and each year&apos;s report in <a href="/data/history.csv">history.csv</a>. {osr.trend.caveat}</p>
      </section>

      <section className="card" id="osr-share" aria-labelledby="osr-share-h">
        <h2 id="osr-share-h">Own-source revenue as a share of spending and of its target</h2>
        <p className="lead">How much of each year&apos;s spending the county&apos;s own revenue would cover, and how much of the revenue target was collected. Most spending is funded by the national share, so the first is small; the trend matters more than the level. These are separate indicators, not a score, and the county is not ranked against anyone.</p>
        <h3 className="chart-title">Own-source revenue as a share of spending, per cent</h3>
        <ColumnChart labels={SHORT} yFormat="one" unit="%" ariaLabel="Own-source revenue as a share of spending, by fiscal year" series={[{ name: 'Own-source revenue as % of spending', color: 3, values: FYS.map((fy) => (by[fy] && by[fy].osr_m !== undefined && by[fy].spent !== undefined ? fin((by[fy].osr_m / (by[fy].spent * 1000)) * 100) : null)) }]} />
        <h3 className="chart-title">Own-source revenue collected as a share of its target, per cent</h3>
        <LineChart labels={SHORT} yFormat="pct0" unit="%" ariaLabel="Own-source revenue as a share of its target, by fiscal year" series={[{ name: 'Revenue vs target', color: 1, values: FYS.map((fy) => (by[fy] && by[fy].osr_m !== undefined && by[fy].osr_target_m ? fin((by[fy].osr_m / by[fy].osr_target_m) * 100) : null)) }]} />
        <p className="how"><b>How.</b> Share of spending = own-source revenue ÷ total spending of the same year. Revenue vs target = own-source revenue collected ÷ the target in the same report. The definition of own-source revenue changed over the period (for example the inclusion of health facility income from FY 2020/21) and FY 2023/24 has two values from different reports, so compare years with care. FY 2024/25 has no comparable target in our data. The ratio of pending bills to spending is with the other pending-bills measures on <Link href="/counties/siaya/analysis/#pending">Siaya analysis</Link>.</p>
      </section>
    </>
  );
}
