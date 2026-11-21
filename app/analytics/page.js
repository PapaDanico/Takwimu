import PageHead from '../../components/PageHead';
import TableWrap from '../../components/TableWrap';
import BarList from '../../components/BarList';
import { LineChart, ColumnChart } from '../../components/Charts';
import StatStrip from '../../components/StatStrip';
import DataStamp from '../../components/DataStamp';
import { shortDate } from '../../lib/format';
import { SITE_UPDATED } from '../../lib/site';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';
import analysis from '../../data/siaya-analysis.json';
import Link from 'next/link';
import { mean, median, quantile, sd, cv, cagr, iqrOutliers } from '../../lib/analytics';

export const metadata = {
  title: 'Analytics: growth, spread and per-person views of Siaya finances',
  description: 'Growth rates, variability, outliers and per-person measures computed from ten years of Siaya County budget and spending data.',
};

const BASE = '2024/25';
const defl = (fy) => cpi.fiscal_year[BASE] / cpi.fiscal_year[fy];
const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
const bn = (v) => v.toFixed(2);
const one = (v) => v.toFixed(1);
const n0 = (v) => Math.round(v).toLocaleString('en-US');

// Per-person spending: one canonical method, /counties/siaya/analysis/ (family A1). A population figure for calendar
// year Y is used only for FY Y/Y+1; no year is interpolated (gaps are never filled), so only a few years have a value.
const A1 = analysis.records.filter((r) => r.family === 'A1' && r.status === 'value').sort((a, b) => a.period.localeCompare(b.period));

const spendYears = years.filter((y) => y.spent !== undefined);
const y0 = spendYears.find((y) => y.fy === '2014/15');
const y1 = spendYears.find((y) => y.fy === BASE);
const span = 10;

const growthRows = [
  { label: 'Spending', a: y0.spent, b: y1.spent, unit: 'KSh bn', real: true, fmt: bn },
  { label: 'Approved budget', a: y0.approved, b: y1.approved, unit: 'KSh bn', real: true, fmt: bn },
  { label: 'Own-source revenue', a: y0.osr_m, b: y1.osr_m, unit: 'KSh m', real: true, fmt: n0, caution: 'Definition widened over the period' },
].map((r) => {
  const nom = cagr(r.a, r.b, span);
  const real = cagr(r.a * defl('2014/15'), r.b, span);
  return { ...r, nom, real: r.real ? real : null };
});
const revShare = years.filter((y) => y.osr_m !== undefined && y.spent !== undefined).map((y) => ({ fy: y.fy, v: (y.osr_m / (y.spent * 1000)) * 100 }));
const unspent = years.filter((y) => y.approved !== undefined && y.spent !== undefined).map((y) => ({ fy: y.fy, gap: y.approved - y.spent, pct: ((y.approved - y.spent) / y.approved) * 100, real: (y.approved - y.spent) * defl(y.fy) }));
const unspentReal = unspent.reduce((s, u) => s + u.real, 0);
const pending = years.map((y) => {
  const stock = y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined);
  return stock !== undefined && y.spent !== undefined ? { fy: y.fy, months: stock / ((y.spent * 1000) / 12), stock } : null;
}).filter(Boolean);

const stat = (label, rows, get) => {
  const xs = rows.map(get);
  const o = iqrOutliers(rows, get);
  return { label, n: xs.length, mean: mean(xs), median: median(xs), sd: sd(xs), cv: cv(xs), min: Math.min(...xs), max: Math.max(...xs), q1: quantile(xs, 0.25), q3: quantile(xs, 0.75), outliers: o.outliers };
};
const devRows = years.filter((y) => y.development_absorption_pct !== undefined);
const recRows = years.filter((y) => y.recurrent_absorption_pct !== undefined);
const spread = [
  stat('Development budget spent (%)', devRows, (y) => y.development_absorption_pct),
  stat('Recurrent budget spent (%)', recRows, (y) => y.recurrent_absorption_pct),
];

const realYoY = spendYears.slice(1).map((y, i) => {
  const prev = spendYears[i];
  const gap = Number(y.fy.slice(0, 4)) - Number(prev.fy.slice(0, 4));
  return gap === 1 ? { fy: y.fy, g: ((y.spent * defl(y.fy)) / (prev.spent * defl(prev.fy)) - 1) * 100 } : null;
}).filter(Boolean);

const FYS = ['2013/14', '2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25'];
const SHORT = FYS.map((f) => f.slice(2));
// Missing inputs give a gap (null), never NaN.
const fillBy = (rows, f) => FYS.map((fy) => { const r = rows.find((x) => x.fy === fy); const v = r ? f(r) : null; return typeof v === 'number' && Number.isFinite(v) ? v : null; });
const pendTotal = (y) => (y.pending_total_m !== undefined ? y.pending_total_m : (y.pending_recurrent_m !== undefined && y.pending_development_m !== undefined ? y.pending_recurrent_m + y.pending_development_m : null));
const kpis = [
  { label: 'Real spending growth', value: `${one(growthRows[0].real)}%`, unit: 'a year', delta: `CAGR, FY 2014/15 to ${BASE}, ${BASE} prices` },
  { label: 'Unspent budget, ten years', value: bn(unspentReal), unit: 'KSh bn', delta: `${BASE} prices`, spark: fillBy(unspent, (u) => u.pct) },
];

export default function Analytics() {
  const sp = growthRows[0];
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Analytics" title="Growth, spread and per-person views" sub="Statistics computed from the ten-year Siaya series. Every figure here is derived, so each section says how. Nothing is forecast." path="/analytics/" shareText="Siaya County finances: growth, spread and per-person analytics" />
      <DataStamp period={`FY 2014/15 to FY 2024/25 (ten years); FY 2013/14 shown where available`} checked={shortDate(hist.meta.retrieved)} updated={shortDate(SITE_UPDATED)} completeness={`${spendYears.length} years of spending; FY 2019/20: no Controller of Budget report found (county and Senate figures are on the ledger). Nothing is interpolated.`} />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#growth">Growth</a></li><li><a href="#person">Per person</a></li><li><a href="#share">Own revenue share</a></li><li><a href="#spread">Spread</a></li><li><a href="#unspent">Unspent budget</a></li><li><a href="#pending">Pending bills</a></li><li><a href="#limits">Limits</a></li>
      </ul></nav>

      <StatStrip label="Key analytics" items={kpis} />

      <section id="growth" className="card insight" aria-labelledby="gr-h">
        <p className="eyebrow">Growth rates, FY 2014/15 to FY 2024/25</p>
        <h2 id="gr-h">Spending grew {one(sp.nom)} per cent a year in shillings and {one(sp.real)} per cent a year after prices</h2>
        <p className="finding">A compound annual growth rate (CAGR) is the steady yearly rate that would take a value from its start to its end. Population is not compared here: a yearly population series would need interpolation between censuses and projections, and gaps are never filled. Spending per person for the years that have a population figure is on <Link href="/counties/siaya/analysis/#an-a1">Siaya analysis</Link>.</p>
        <TableWrap label="Compound annual growth rates over ten years">
          <table className="data">
            <caption className="sr-only">Compound annual growth rates over ten years</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">FY 2014/15</th><th scope="col">FY 2024/25</th><th scope="col">Nominal CAGR</th><th scope="col">Real CAGR</th></tr></thead>
            <tbody>
              {growthRows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}<small style={{ display: 'block', fontWeight: 400 }}>{r.unit}{r.caution ? `. ${r.caution}.` : ''}</small></th>
                  <td>{r.fmt(r.a)}</td><td>{r.fmt(r.b)}</td><td>{one(r.nom)}%</td><td>{r.real === null ? 'n/a' : `${one(r.real)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <h3 className="mini">Real spending, change on the previous year, per cent</h3>
        <BarList label="Year-on-year change in real spending" unit="%" format={(v) => one(v)} accent="navy" items={realYoY.map((r) => ({ label: `FY ${r.fy}`, value: Math.abs(r.g), sub: r.g >= 0 ? 'Rise' : 'Fall' }))} />
        <p className="how"><b>How.</b> CAGR = (end ÷ start)^(1 ÷ 10) − 1. Real values use the price index on the Method page. The bars show size of change; the label under each says whether spending rose or fell. FY 2019/20: Controller of Budget report not found (county and Senate figures are on the <Link href="/counties/siaya/ledger/">ledger</Link>), so the step into FY 2020/21 is left out.</p>
      </section>

      <section id="person" className="card" aria-labelledby="pp-h">
        <p className="eyebrow">Per person</p>
        <h2 id="pp-h">Real spending per person: {A1.length} years with a population figure</h2>
        <p className="finding">Per-person values are calculated once, on <Link href="/counties/siaya/analysis/#an-a1">Siaya analysis</Link>, with every input and page. A population figure for calendar year Y is used only for FY Y/Y+1, and no year between censuses and projections is interpolated, so the other years are gaps.</p>
        <TableWrap label="Real spending per person, years with a population figure">
          <table className="data">
            <caption className="sr-only">Siaya real county spending per person at FY {BASE} prices, by population basis</caption>
            <thead><tr><th scope="col">Fiscal year</th><th scope="col" className="num">KSh per person ({BASE} prices)</th><th scope="col">Population basis</th><th scope="col">Spending source</th><th scope="col">calc_id</th></tr></thead>
            <tbody>{A1.map((r) => <tr key={r.calc_id}><th scope="row">{r.period}</th><td className="num">{n0(r.result)}</td><td>{r.flags.population_kind === 'census' ? '2019 census count' : 'Projection'}</td><td>{r.source_ids.filter((s) => !/WDI|ADP|GOV-01/.test(s)).join(', ')}</td><td><code>{r.calc_id}</code></td></tr>)}</tbody>
          </table>
        </TableWrap>
        <p className="how"><b>How.</b> Total spending at {BASE} prices ÷ population of the year the fiscal year starts in. Census counts and projections are marked. Calculated by Takwimu Kenya from published figures; provisional, awaiting editorial review.</p>
      </section>

      <section id="share" className="card" aria-labelledby="sh-h">
        <h2 id="sh-h">Own revenue as a share of spending</h2>
        <p className="lead">How much of each year's spending the county's own revenue would cover. Most spending is funded by the national share, so these are small numbers; the trend matters more than the level. The definition of own revenue widened during the period, so early and late years are not strictly comparable. FY 2022/23 uses KSh 402.23 million, ordinary own-source revenue without KSh 105.81 million of appropriations-in-aid; with them the report gives KSh 508.04 million, and FY 2023/24 (KSh 610.74 million) includes health facility income.</p>
        <ColumnChart labels={SHORT} yFormat="one" unit="%" ariaLabel="Own-source revenue as a share of spending, by fiscal year" series={[{ name: 'Own revenue as % of spending', color: 3, values: fillBy(revShare, (r) => r.v) }]} />
      </section>

      <section id="spread" className="card insight" aria-labelledby="sp-h">
        <p className="eyebrow">Spread</p>
        <h2 id="sp-h">Development spending varies far more from year to year than recurrent spending</h2>
        <p className="finding">The coefficient of variation (spread relative to the average) is {one(spread[0].cv * 100)} per cent for development absorption and {one(spread[1].cv * 100)} per cent for recurrent. The mean and median are shown together; a gap between them signals skew.</p>
        <TableWrap label="Variability of absorption rates">
          <table className="data">
            <caption className="sr-only">Variability of absorption rates</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">Years</th><th scope="col">Mean</th><th scope="col">Median</th><th scope="col">Std dev</th><th scope="col">Lowest</th><th scope="col">Highest</th><th scope="col">Unusual years</th></tr></thead>
            <tbody>
              {spread.map((s) => (
                <tr key={s.label}>
                  <th scope="row">{s.label}</th><td>{s.n}</td><td>{one(s.mean)}</td><td>{one(s.median)}</td><td>{one(s.sd)}</td><td>{one(s.min)}</td><td>{one(s.max)}</td>
                  <td>{s.outliers.length ? s.outliers.map((o) => `FY ${o.fy}`).join(', ') : 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="how"><b>How.</b> Sample standard deviation. A year is called unusual if it lies more than 1.5 interquartile ranges beyond the quartiles (Tukey's rule). With about a dozen years, this flags years to look at, not proven anomalies.</p>
      </section>

      <section id="unspent" className="card insight" aria-labelledby="un-h">
        <p className="eyebrow">Unspent budget</p>
        <h2 id="un-h">Across {unspent.length} years, about KSh {bn(unspentReal)} billion of approved budget remained unspent, in {BASE} prices</h2>
        <p className="finding">This is approved budget minus spending, year by year. Unspent money is not always lost: some rolls over as cash balance. It shows how much planned spending was not paid out in the year. It does not show which projects were or were not delivered.</p>
        <ColumnChart labels={SHORT} yFormat="one" unit="%" ariaLabel="Unspent approved budget as a share of the budget, by fiscal year" series={[{ name: 'Unspent, % of approved budget', color: 4, values: fillBy(unspent, (u) => u.pct) }]} />
      </section>

      <section id="pending" className="card" aria-labelledby="pd-h">
        <h2 id="pd-h">Pending bills in months of spending</h2>
        <p className="lead">The year-end stock of unpaid bills divided by average monthly spending: roughly how many months of spending the unpaid bills equal.</p>
        <ColumnChart labels={SHORT} yFormat="one" unit="months" ariaLabel="Pending bills in months of spending, by fiscal year" series={[{ name: 'Months of spending', color: 2, values: fillBy(pending, (p) => p.months) }]} />
      </section>

      <section id="health" className="card insight" aria-labelledby="fh-h">
        <p className="eyebrow">Fiscal health indicators</p>
        <h2 id="fh-h">Two indicators to watch: revenue against its target, and pending bills against a year of spending</h2>
        <p className="finding">These are separate indicators, not a score, and the county is not ranked against anyone. Revenue realisation asks how much of the own-source revenue target was collected. The pending-bills ratio asks how large the unpaid bills at year end were compared with one year of spending. Higher is better for the first and lower is better for the second.</p>
        <h3 className="chart-title">Own-source revenue as a share of target, and pending bills as a share of annual spending, per cent</h3>
        <LineChart labels={SHORT} yFormat="pct0" unit="%" ariaLabel="Own-source revenue as a share of its target and pending bills as a share of annual spending, by fiscal year" series={[{ name: 'Revenue vs target', color: 1, values: fillBy(years, (y) => (y.osr_m !== undefined && y.osr_target_m ? (y.osr_m / y.osr_target_m) * 100 : null)) }, { name: 'Pending bills vs spending', color: 3, dash: true, values: fillBy(years, (y) => { const p = pendTotal(y); return p !== null && y.spent ? (p / (y.spent * 1000)) * 100 : null; }) }]} />
        <ul className="how">
          <li><b>Revenue vs target</b> = own-source revenue collected divided by the target in the same report, per cent. The definition of own-source revenue changed over the period (for example the inclusion of health facility income from FY 2020/21), the FY 2022/23 figure (KSh 402.23 million) is ordinary own-source revenue and excludes KSh 105.81 million of appropriations-in-aid (KSh 508.04 million with them, the figure the county chapter compares with FY 2023/24), and FY 2023/24 has two values from different reports, so compare years with care. FY 2024/25 has no comparable target in our data.</li>
          <li><b>Pending bills vs spending</b> = recurrent plus development pending bills at year end (or the reported total) divided by spending for the year. Each year uses the stock printed in its own report (one rule for every year): FY 2023/24 is the KSh 304 million in the FY 2023/24 report, which covers the County Executive only and excludes bills incurred in the year, while the FY 2024/25 report gives KSh 1,120 million for the same date, so that point is the least certain. Years with an open discrepancy are listed on <Link href="/insights/#pending-disputed">Siaya insights</Link>. Years where only part of the pending bills could be read are left blank.</li>
          <li>Wage bill, transfer dependence and rolling changes are not shown because we do not yet hold comparable series for them. Gaps are never filled.</li>
        </ul>
      </section>

      <section id="limits" className="card" aria-labelledby="li-h">
        <h2 id="li-h">What this analysis cannot tell you</h2>
        <ul className="steps">
          <li>With about a dozen annual values, we do not run significance tests or fit forecasts. A pattern across so few years can easily be chance.</li>
          <li>We do not compute correlations between series. Almost every money series rises with prices and population, which would make unrelated series look linked.</li>
          <li>These are county totals from official reports. They do not show which sub-counties or services gained or lost.</li>
          <li>Years with missing reports are left out, not estimated. See the gaps on the Method page.</li>
          <li>Different reports sometimes disagree. Where they do, we use the report for that year and note the conflict on the Data page.</li>
        </ul>
      </section>
    </main>
  );
}
