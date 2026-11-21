import PageHead from '../../components/PageHead';
import BarList from '../../components/BarList';
import { LineChart, ColumnChart } from '../../components/Charts';
import StatStrip from '../../components/StatStrip';
import DataStamp from '../../components/DataStamp';
import { shortDate } from '../../lib/format';
import { SITE_UPDATED } from '../../lib/site';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';
import sc from '../../data/subcounties.json';
import { mean, median, quantile, sd, cv, cagr, iqrOutliers, interpolate } from '../../lib/analytics';

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

// Population at the middle of each fiscal year. FY y/y+1 runs July to June, so its midpoint is 1 January of y+1.
const pop2025 = sc.sub_counties.reduce((s, x) => s + x.population['2025'], 0);
const popPoints = [...hist.population.points.map((p) => ({ year: p.year, value: p.value })), { year: 2025, value: pop2025 }];
const popAt = (fy) => interpolate(popPoints, Number(fy.slice(0, 4)) + 1);

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
const popGrowth = cagr(popAt('2014/15'), popAt(BASE), span);

const perPerson = spendYears.map((y) => ({ fy: y.fy, v: (y.spent * defl(y.fy) * 1e9) / popAt(y.fy) }));
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
const lastPP = perPerson[perPerson.length - 1];
const firstPP = perPerson.find((p) => p.fy === '2014/15');
const kpis = [
  { label: 'Real spending growth', value: `${one(growthRows[0].real)}%`, unit: 'a year', delta: `Nominal ${one(growthRows[0].nom)}% a year`, spark: fillBy(spendYears, (y) => y.spent * defl(y.fy)) },
  { label: 'Population growth', value: `${one(popGrowth)}%`, unit: 'a year', delta: 'Estimate, FY 2014/15 to 2024/25' },
  { label: 'Real spending per person', value: n0(lastPP.v), unit: 'KSh', delta: `${one((lastPP.v / firstPP.v - 1) * 100)}% since FY 2014/15`, tone: lastPP.v >= firstPP.v ? 'up' : 'down', spark: fillBy(perPerson, (p) => p.v) },
  { label: 'Unspent budget, ten years', value: bn(unspentReal), unit: 'KSh bn', delta: `${BASE} prices`, spark: fillBy(unspent, (u) => u.pct) },
];

export default function Analytics() {
  const sp = growthRows[0];
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Analytics" title="Growth, spread and per-person views" sub="Statistics computed from the ten-year Siaya series. Every figure here is derived, so each section says how. Nothing is forecast." path="/analytics/" shareText="Siaya County finances: growth, spread and per-person analytics" />
      <DataStamp period={`FY 2014/15 to FY 2024/25 (ten years); FY 2013/14 shown where available`} checked={shortDate(hist.meta.retrieved)} updated={shortDate(SITE_UPDATED)} completeness={`${spendYears.length} years of spending; FY 2019/20 missing and not interpolated. Per-person values are estimates.`} />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#growth">Growth</a></li><li><a href="#person">Per person</a></li><li><a href="#share">Own revenue share</a></li><li><a href="#spread">Spread</a></li><li><a href="#unspent">Unspent budget</a></li><li><a href="#pending">Pending bills</a></li><li><a href="#limits">Limits</a></li>
      </ul></nav>

      <StatStrip label="Key analytics" items={kpis} />

      <section id="growth" className="card insight" aria-labelledby="gr-h">
        <p className="eyebrow">Growth rates, FY 2014/15 to FY 2024/25</p>
        <h2 id="gr-h">Spending grew {one(sp.nom)} per cent a year in shillings and {one(sp.real)} per cent a year after prices; the population grew {one(popGrowth)} per cent a year</h2>
        <p className="finding">A compound annual growth rate (CAGR) is the steady yearly rate that would take a value from its start to its end. Where real growth is close to zero or below population growth, spending per person is flat or falling.</p>
        <div className="tablewrap">
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
        </div>
        <h3 className="mini">Real spending, change on the previous year, per cent</h3>
        <BarList label="Year-on-year change in real spending" unit="%" format={(v) => one(v)} accent="navy" items={realYoY.map((r) => ({ label: `FY ${r.fy}`, value: Math.abs(r.g), sub: r.g >= 0 ? 'Rise' : 'Fall' }))} />
        <p className="how"><b>How.</b> CAGR = (end ÷ start)^(1 ÷ 10) − 1. Real values use the price index on the Method page. The bars show size of change; the label under each says whether spending rose or fell. FY 2019/20 is missing, so the step into FY 2020/21 is left out.</p>
      </section>

      <section id="person" className="card insight" aria-labelledby="pp-h">
        <p className="eyebrow">Per person</p>
        <h2 id="pp-h">Real spending per person went from KSh {n0(perPerson.find((p) => p.fy === '2014/15').v)} to KSh {n0(perPerson[perPerson.length - 1].v)} a year</h2>
        <p className="finding">Dividing real spending by the estimated population removes the effect of a growing county. On this measure spending per person changed by {one((perPerson[perPerson.length - 1].v / perPerson.find((p) => p.fy === '2014/15').v - 1) * 100)} per cent between FY 2014/15 and FY 2024/25. These are estimates: population between censuses is interpolated from official projections.</p>
        <LineChart labels={SHORT} yFormat="int" unit="KSh" ariaLabel="Real spending per person by fiscal year, KSh" series={[{ name: 'Per person', color: 1, values: fillBy(perPerson, (p) => p.v) }]} />
        <p className="how"><b>How.</b> Spending in {BASE} prices ÷ population at the middle of the fiscal year (1 January of its second calendar year), linearly interpolated between the 2009 and 2019 census counts and county projections for 2012 to 2025. Treat differences under about 5 per cent as noise. Confidence 3 of 5.</p>
      </section>

      <section id="share" className="card" aria-labelledby="sh-h">
        <h2 id="sh-h">Own revenue as a share of spending</h2>
        <p className="lead">How much of each year's spending the county's own revenue would cover. Most spending is funded by the national share, so these are small numbers; the trend matters more than the level. The definition of own revenue widened during the period, so early and late years are not strictly comparable.</p>
        <ColumnChart labels={SHORT} yFormat="one" unit="%" ariaLabel="Own-source revenue as a share of spending, by fiscal year" series={[{ name: 'Own revenue as % of spending', color: 3, values: fillBy(revShare, (r) => r.v) }]} />
      </section>

      <section id="spread" className="card insight" aria-labelledby="sp-h">
        <p className="eyebrow">Spread</p>
        <h2 id="sp-h">Development spending is far more erratic than recurrent spending</h2>
        <p className="finding">The coefficient of variation (spread relative to the average) is {one(spread[0].cv * 100)} per cent for development absorption and {one(spread[1].cv * 100)} per cent for recurrent. The mean and median are shown together; a gap between them signals skew.</p>
        <div className="tablewrap">
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
        </div>
        <p className="how"><b>How.</b> Sample standard deviation. A year is called unusual if it lies more than 1.5 interquartile ranges beyond the quartiles (Tukey's rule). With about a dozen years, this flags years to look at, not proven anomalies.</p>
      </section>

      <section id="unspent" className="card insight" aria-labelledby="un-h">
        <p className="eyebrow">Unspent budget</p>
        <h2 id="un-h">Across {unspent.length} years, about KSh {bn(unspentReal)} billion of approved budget went unspent, in {BASE} prices</h2>
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
        <h2 id="fh-h">Two warning lights: revenue against its target, and unpaid bills against a year of spending</h2>
        <p className="finding">These are separate indicators, not a score, and the county is not ranked against anyone. Revenue realisation asks how much of the own-source revenue target was collected. The pending-bills ratio asks how large the unpaid bills at year end were compared with one year of spending. Higher is better for the first and lower is better for the second.</p>
        <h3 className="chart-title">Own-source revenue as a share of target, and pending bills as a share of annual spending, per cent</h3>
        <LineChart labels={SHORT} yFormat="pct0" unit="%" ariaLabel="Own-source revenue as a share of its target and pending bills as a share of annual spending, by fiscal year" series={[{ name: 'Revenue vs target', color: 1, values: fillBy(years, (y) => (y.osr_m !== undefined && y.osr_target_m ? (y.osr_m / y.osr_target_m) * 100 : null)) }, { name: 'Pending bills vs spending', color: 3, dash: true, values: fillBy(years, (y) => { const p = pendTotal(y); return p !== null && y.spent ? (p / (y.spent * 1000)) * 100 : null; }) }]} />
        <ul className="how">
          <li><b>Revenue vs target</b> = own-source revenue collected divided by the target in the same report, per cent. The definition of own-source revenue changed over the period (for example the inclusion of health facility income from FY 2020/21), the FY 2022/23 figure excludes appropriations-in-aid, and FY 2023/24 has two values from different reports, so compare years with care. FY 2024/25 has no comparable target in our data.</li>
          <li><b>Pending bills vs spending</b> = recurrent plus development pending bills at year end (or the reported total) divided by spending for the year. FY 2023/24 uses the KSh 1,120 million figure from the FY 2024/25 report, which is about 3.7 times the KSh 304 million in the FY 2023/24 report, so that point is the least certain. Years where only part of the pending bills could be read are left blank.</li>
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
