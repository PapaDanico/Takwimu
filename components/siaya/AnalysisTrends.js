import Link from 'next/link';
import TableWrap from '../TableWrap';
import BarList from '../BarList';
import { LineChart, ColumnChart } from '../Charts';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';
import siaya from '../../data/siaya.json';
import manifest from '../../data/source-manifest.json';
import ledger from '../../data/siaya-fiscal-ledger.json';
import { insights as pulse } from '../../lib/pulse';
import { mean, median, quantile, sd, cv, cagr, iqrOutliers } from '../../lib/analytics';
import { pendingAt, range } from '../../lib/editorial';
import { fmtFixed, fmtInt } from '../../lib/format';
import { SIAYA_FYS } from '../../lib/siaya-years';

// Ten-year measures whose canonical home is /counties/siaya/analysis/ (owner decision U1, 21 Nov 2026): share of
// budget spent (absorption), pending bills and real growth. Moved here from the old analytics, Fiscal Pulse and
// insights pages and the Siaya hub; those pages now show one summary tile and link here.
const BASE = '2024/25';
const defl = (fy) => (cpi.fiscal_year[fy] ? cpi.fiscal_year[BASE] / cpi.fiscal_year[fy] : null);
const years = [...hist.years].sort((a, b) => a.fy.localeCompare(b.fy));
const by = Object.fromEntries(years.map((y) => [y.fy, y]));
const P25 = pendingAt('2024/25');
const P25R = range(P25);
const FYS = SIAYA_FYS;
const SHORT = FYS.map((f) => f.slice(2));
const label = (fy) => `FY ${fy}`;
const bn = (v) => v.toFixed(2);
const one = (v) => v.toFixed(1);
const n0 = fmtInt;
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const col = (fn) => FYS.map((fy) => (by[fy] ? fin(fn(by[fy])) : null));
const fillBy = (rows, f) => FYS.map((fy) => { const r = rows.find((x) => x.fy === fy); return r ? fin(f(r)) : null; });
const pendOf = (y) => y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined);

const spendYears = years.filter((y) => y.spent !== undefined);
const y0 = spendYears.find((y) => y.fy === '2014/15');
const y1 = spendYears.find((y) => y.fy === BASE);
const growthRows = [
  { label: 'Spending', a: y0.spent, b: y1.spent, unit: 'KSh bn', fmt: bn },
  { label: 'Approved budget', a: y0.approved, b: y1.approved, unit: 'KSh bn', fmt: bn },
].map((r) => ({ ...r, nom: cagr(r.a, r.b, 10), real: cagr(r.a * defl('2014/15'), r.b, 10) }));
const realYoY = spendYears.slice(1).map((y, i) => {
  const prev = spendYears[i];
  return Number(y.fy.slice(0, 4)) - Number(prev.fy.slice(0, 4)) === 1 ? { fy: y.fy, g: ((y.spent * defl(y.fy)) / (prev.spent * defl(prev.fy)) - 1) * 100 } : null;
}).filter(Boolean);

const stat = (lab, rows, get) => { const xs = rows.map(get); return { label: lab, n: xs.length, mean: mean(xs), median: median(xs), sd: sd(xs), cv: cv(xs), min: Math.min(...xs), max: Math.max(...xs), q1: quantile(xs, 0.25), q3: quantile(xs, 0.75), outliers: iqrOutliers(rows, get).outliers }; };
const devRows = years.filter((y) => y.development_absorption_pct !== undefined);
const spread = [
  stat('Development budget spent (%)', devRows, (y) => y.development_absorption_pct),
  stat('Recurrent budget spent (%)', years.filter((y) => y.recurrent_absorption_pct !== undefined), (y) => y.recurrent_absorption_pct),
];
const devMax = devRows.reduce((a, b) => (b.development_absorption_pct > a.development_absorption_pct ? b : a));
const devMin = devRows.reduce((a, b) => (b.development_absorption_pct < a.development_absorption_pct ? b : a));
const unspent = years.filter((y) => y.approved !== undefined && y.spent !== undefined).map((y) => ({ fy: y.fy, pct: ((y.approved - y.spent) / y.approved) * 100, real: (y.approved - y.spent) * defl(y.fy) }));
const unspentReal = unspent.reduce((s, u) => s + u.real, 0);
const pend = years.map((y) => ({ fy: y.fy, v: pendOf(y) })).filter((p) => p.v !== undefined);
const pendMonths = years.map((y) => (pendOf(y) !== undefined && y.spent !== undefined ? { fy: y.fy, months: pendOf(y) / ((y.spent * 1000) / 12), ratio: (pendOf(y) / (y.spent * 1000)) * 100 } : null)).filter(Boolean);
const PEND_DISPUTED = new Set(ledger.discrepancies.filter((d) => d.indicator_id === 'pending_bills_close' && d.status === 'open').map((d) => d.period.replace('FY ', '')));
const RF = hist.pending_rollforward;
const RF_TERMS = [['opening', 'Opening stock'], ['new_bills', 'New bills'], ['payments', 'Payments'], ['adjustments', 'Write-offs or adjustments'], ['closing', 'Closing stock']];
const DOC = Object.fromEntries(manifest.documents.map((d) => [d.id, d]));
const rfCell = (t) => (typeof t.value === 'number'
  ? <>{fmtFixed(t.value, 2)}<span className="rf-page">PDF p. {t.page}{t.printed_page ? `, printed p. ${t.printed_page}` : ''}{t.note ? `; ${t.note}` : ''}</span></>
  : <span className="rf-np">Not published{t.note ? <span className="rf-page">{t.note}</span> : null}</span>);
const rfComplete = (r) => RF_TERMS.every(([k]) => typeof r[k].value === 'number');

const p = pulse();
const readText = (r) => (r === 'RapidOCR' ? 'read by OCR (RapidOCR)' : `read from the ${r}`);
const pageRef = (f) => `PDF p. ${f.page}${f.printed_page ? ` (printed p. ${f.printed_page})` : ''}`;

export const TREND_TOC = [['latest', 'Latest year'], ['spent', 'Share of budget spent'], ['unspent', 'Unspent budget'], ['pending', 'Pending bills'], ['growth', 'Growth']];

// Latest year: the three spending findings (formerly the Fiscal Pulse) and the FY 2024/25 budget by category (formerly on the hub).
export function LatestYear() {
  const budget = siaya.budget;
  const spentPct = Math.round((budget.total_spent / budget.approved_total) * 100);
  return (
    <section className="card" id="latest" aria-labelledby="latest-h">
      <h2 id="latest-h">Latest year: what Siaya spent, FY {p.first} to FY {p.latest}</h2>
      <p className="lead">Three findings read from the Controller of Budget annual reports. Nominal shillings; fiscal years run July to June. Each figure names its document and page. They describe what was spent, not a judgement of the county government or of any person.</p>
      <ol className="steps" id="pulse-findings">
        {p.items.map((it) => (
          <li key={it.id} id={`pulse-${it.id}`}>
            <b>{it.title}.</b> {it.text}
            <ul className="how">
              {it.figures.map((f) => (
                <li key={`${f.fy}-${f.key}`}>{f.label}, {f.period}: KSh {f.value.toFixed(2)} billion. Source: <a href={f.pdf_url}>{f.report} (PDF)</a>, chapter &ldquo;{f.section}&rdquo;, {pageRef(f)}, {readText(f.read)}. Confidence {f.confidence} of 5.</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <h3 className="chart-title">Total, recurrent and development spending, KSh billion, nominal</h3>
      <LineChart labels={p.chart.labels} unit="KSh bn" yFormat="one" naText="No figure in the source reports"
        ariaLabel={`Siaya County total, recurrent and development spending, FY ${p.first} to FY ${p.latest}, KSh billion`}
        series={p.chart.series.map((s, i) => ({ name: s.name, color: i + 1, dash: i === 2, values: s.values }))} />
      <h3 className="chart-title">FY {budget.fiscal_year}: budget and spending by part, KSh billion</h3>
      <TableWrap label={`Siaya budget and spending by part, FY ${budget.fiscal_year}`}>
        <table className="data" id="latest-parts">
          <caption className="sr-only">Siaya approved budget, spending and share of budget spent by part, FY {budget.fiscal_year}, KSh billion</caption>
          <thead><tr><th scope="col">Part</th><th scope="col" className="num">Budget</th><th scope="col" className="num">Spent</th><th scope="col" className="num">Share of budget spent (as stated)</th></tr></thead>
          <tbody>
            {budget.categories.map((c) => <tr key={c.label}><th scope="row">{c.label}</th><td className="num">{c.budget}</td><td className="num">{c.spent}</td><td className="num">{c.absorption_pct}%</td></tr>)}
            <tr><th scope="row">Total</th><td className="num">{budget.approved_total}</td><td className="num">{budget.total_spent}</td><td className="num">{spentPct}%</td></tr>
          </tbody>
        </table>
      </TableWrap>
      <p className="src">Source: <a href={budget.source_url}>{budget.source}</a>; confidence {budget.confidence} of 5. {budget.note} Every year&apos;s page is in <a href="/data/history.csv">history.csv</a>.{p.gaps.length ? <> FY {p.gaps.join(' and FY ')}: Controller of Budget report not found, so the series has no figure; county and Senate figures for the year are on the <Link href="/counties/siaya/ledger/">fiscal reconciliation ledger</Link>.</> : ''}</p>
    </section>
  );
}

export function SpentTenYear() {
  return (
    <section className="card" id="spent" aria-labelledby="spent-h">
      <h2 id="spent-h">Share of budget spent, ten years: development ranged from {devMin.development_absorption_pct} to {devMax.development_absorption_pct} per cent</h2>
      <p className="lead">The share of the approved budget actually spent (the absorption rate; <Link href="/learn/#absorption-rate">what this means</Link>). The lowest development year was {label(devMin.fy)} and the highest {label(devMax.fy)}. Recurrent spending (salaries and running costs) usually uses most of its budget. Low spending does not by itself show whether projects were delivered: payments can fall in a later year.</p>
      <LineChart labels={SHORT} yFormat="pct0" unit="%" yMaxFixed={100} refLine={{ value: 100, label: 'Whole budget' }} ariaLabel="Share of the recurrent and development budgets spent, by fiscal year" series={[{ name: 'Development', color: 3, dash: true, values: col((y) => y.development_absorption_pct) }, { name: 'Recurrent', color: 1, values: col((y) => y.recurrent_absorption_pct) }]} />
      <p className="how">These are the percentages stated by the Controller of Budget, checked against our own division of spending by budget (the validator allows a small difference for rounding).</p>
      <h3 id="spread">How much the share varies from year to year</h3>
      <p>The coefficient of variation (spread relative to the average) is {one(spread[0].cv * 100)} per cent for development and {one(spread[1].cv * 100)} per cent for recurrent. The mean and median are shown together; a gap between them signals skew.</p>
      <TableWrap label="Variability of the share of budget spent">
        <table className="data" id="spread-table">
          <caption className="sr-only">Variability of the share of budget spent, development and recurrent</caption>
          <thead><tr><th scope="col">Measure</th><th scope="col">Years</th><th scope="col">Mean</th><th scope="col">Median</th><th scope="col">Std dev</th><th scope="col">Lowest</th><th scope="col">Highest</th><th scope="col">Unusual years</th></tr></thead>
          <tbody>{spread.map((s) => <tr key={s.label}><th scope="row">{s.label}</th><td>{s.n}</td><td>{one(s.mean)}</td><td>{one(s.median)}</td><td>{one(s.sd)}</td><td>{one(s.min)}</td><td>{one(s.max)}</td><td>{s.outliers.length ? s.outliers.map((o) => `FY ${o.fy}`).join(', ') : 'None'}</td></tr>)}</tbody>
        </table>
      </TableWrap>
      <p className="how"><b>How.</b> Sample standard deviation. A year is called unusual if it lies more than 1.5 interquartile ranges beyond the quartiles (Tukey&apos;s rule). With about a dozen years, this flags years to look at, not proven anomalies.</p>
    </section>
  );
}

export function Unspent() {
  return (
    <section className="card" id="unspent" aria-labelledby="unspent-h">
      <h2 id="unspent-h">Unspent budget: about KSh {Math.round(unspentReal)} billion over {unspent.length} years, in FY {BASE} prices</h2>
      <p className="lead">Unspent money is not always lost: some rolls over to the next year as a cash balance, so this total is not money that disappeared. It is approved budget minus spending, year by year, at FY {BASE} prices (KSh {bn(unspentReal)} billion before rounding). It shows how much planned spending was not paid out in the year; it does not show which projects were or were not delivered.</p>
      <ColumnChart labels={SHORT} yFormat="one" unit="%" ariaLabel="Unspent approved budget as a share of the budget, by fiscal year" series={[{ name: 'Unspent, % of approved budget', color: 4, values: fillBy(unspent, (u) => u.pct) }]} />
    </section>
  );
}

export function PendingTenYear() {
  const first = pend[0]; const last = pend[pend.length - 1];
  return (
    <section className="card" id="pending" aria-labelledby="pending-h">
      <h2 id="pending-h">Pending bills, ten years: KSh {n0(first.v)} million ({label(first.fy)}) to KSh {n0(last.v)} million ({label(last.fy)}) at year end</h2>
      <p className="lead">Pending bills are money owed for goods and services already delivered. One rule is used for every year: the closing stock printed in that year&apos;s own Controller of Budget report. Other documents often give a different stock for the same date; {PEND_DISPUTED.size} years have an open discrepancy in the <Link href="/counties/siaya/ledger/">fiscal reconciliation ledger</Link>. The FY 2023/24 figure covers the County Executive only and excludes bills incurred in the year. Read the direction with care rather than each step.</p>
      <ColumnChart labels={SHORT} yFormat="int" unit="KSh m" ariaLabel="Pending bills at the end of each fiscal year, KSh million, as printed in each year's own report" series={[{ name: 'Pending bills', color: 2, values: col(pendOf) }]} />
      <ul className="how" id="pending-disputed">{FYS.filter((fy) => by[fy] && pendOf(by[fy]) !== undefined).map((fy) => <li key={fy}><b>{label(fy)}:</b> KSh {n0(pendOf(by[fy]))} million{PEND_DISPUTED.has(fy) ? <> <span className="tag warn">Sources disagree</span> (open ledger discrepancy)</> : null}</li>)}</ul>
      <h3 className="chart-title">Pending bills in months of spending, and as a share of a year&apos;s spending</h3>
      <p className="chart-sub">Year-end stock ÷ average monthly spending; and the same stock ÷ the year&apos;s spending, per cent. The FY 2024/25 report gives KSh 1,120 million for 30 June 2024, the same date as the KSh 304 million in the FY 2023/24 report, so that point is the least certain.</p>
      <ColumnChart labels={SHORT} yFormat="one" unit="months" ariaLabel="Pending bills in months of spending, by fiscal year" series={[{ name: 'Months of spending', color: 2, values: fillBy(pendMonths, (x) => x.months) }]} />
      <details className="tableview"><summary>Pending bills as a share of a year&apos;s spending, by year</summary>
        <TableWrap label="Pending bills as a share of annual spending">
          <table className="data"><caption className="sr-only">Pending bills at year end as a share of the year&apos;s spending, per cent</caption>
            <thead><tr><th scope="col">Fiscal year</th><th scope="col" className="num">Months of spending</th><th scope="col" className="num">% of annual spending</th></tr></thead>
            <tbody>{pendMonths.map((x) => <tr key={x.fy}><th scope="row">{label(x.fy)}</th><td className="num">{one(x.months)}</td><td className="num">{one(x.ratio)}%</td></tr>)}</tbody>
          </table>
        </TableWrap>
      </details>
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
      <details><summary>Notes for each year</summary><ul className="steps rf-notes">{RF.years.map((r) => <li key={r.fy}><b>{label(r.fy)}.</b> {r.note}</li>)}</ul></details>
      <p className="how"><b>Conflict.</b> At 30 June 2021 the FY 2020/21 report gives KSh 1,061 million, while the FY 2021/22 report gives KSh 602 million for the same date. The FY 2023/24 column (KSh 304 million, County Executive only, excluding bills incurred in the year) is about a quarter of the KSh 1,120 million the FY 2024/25 report gives for the same date; the FY 2022/23 column (KSh 873 million) differs from the KSh 761 million the next report quotes. The <Link href="/data/#conflicts">conflict register</Link> lists these cases. Years without a column (FY 2013/14, FY 2014/15 and FY 2019/20) could not be read or were incomplete; FY 2024/25 has no column because its report gives two different year-end stocks.</p>
      <h3 id="pending-2025-sources">Pending bills at 30 June 2025: sources disagree</h3>
      <p className="how" id="pending-2025-summary">{P25.length} printed values, from KSh {fmtFixed(P25R.min, 2)} million to KSh {fmtFixed(P25R.max, 2)} million. The lowest, KSh {fmtFixed(P25R.min, 2)} million, is the County Executive&apos;s opening stock less payments, with no new bills of FY 2024/25 added; it is printed in the Controller of Budget&apos;s Table 3.457 and in the county&apos;s fourth-quarter report. Every value side by side, with its scope, date and accounting basis: <Link href="/counties/siaya/ledger/#pending-2025">fiscal reconciliation</Link>.</p>
    </section>
  );
}

export function Growth() {
  const sp = growthRows[0];
  return (
    <section className="card" id="growth" aria-labelledby="growth-h">
      <h2 id="growth-h">Growth: spending grew {one(sp.nom)} per cent a year in shillings and {one(sp.real)} per cent a year after prices</h2>
      <p className="lead">A compound annual growth rate (CAGR) is the steady yearly rate that would take a value from its start to its end, FY 2014/15 to FY {BASE}. Own-source revenue growth is on the <Link href="/counties/siaya/ledger/#osr-ten">ledger</Link>; spending per person is below.</p>
      <TableWrap label="Compound annual growth rates over ten years">
        <table className="data" id="growth-table">
          <caption className="sr-only">Compound annual growth rates over ten years</caption>
          <thead><tr><th scope="col">Measure (KSh bn)</th><th scope="col">FY 2014/15</th><th scope="col">FY {BASE}</th><th scope="col">Nominal CAGR</th><th scope="col">Real CAGR</th></tr></thead>
          <tbody>{growthRows.map((r) => <tr key={r.label}><th scope="row">{r.label}</th><td>{r.fmt(r.a)}</td><td>{r.fmt(r.b)}</td><td>{one(r.nom)}%</td><td>{one(r.real)}%</td></tr>)}</tbody>
        </table>
      </TableWrap>
      <h3 className="mini">Real spending, change on the previous year, per cent</h3>
      <BarList label="Year-on-year change in real spending" unit="%" format={(v) => one(v)} accent="navy" items={realYoY.map((r) => ({ label: `FY ${r.fy}`, value: Math.abs(r.g), sub: r.g >= 0 ? 'Rise' : 'Fall' }))} />
      <p className="how"><b>How.</b> CAGR = (end ÷ start)^(1 ÷ 10) − 1. Real values use the price index on the <Link href="/method/#prices">method</Link> page. The bars show size of change; the label under each says whether spending rose or fell. The step into FY 2020/21 is left out because FY 2019/20 has no Controller of Budget report.</p>
    </section>
  );
}

export function Limits() {
  return (
    <section className="card" id="limits" aria-labelledby="limits-h">
      <h2 id="limits-h">What this analysis cannot tell you</h2>
      <ul className="steps">
        <li>With about a dozen annual values, we do not run significance tests or fit forecasts. A pattern across so few years can easily be chance.</li>
        <li>We do not compute correlations between series. Almost every money series rises with prices and population, which would make unrelated series look linked.</li>
        <li>These are county totals from official reports. They do not show which wards or services gained or lost.</li>
        <li>Wage bill, transfer dependence over the full ten years and rolling changes are not shown because we do not yet hold comparable series for them. Gaps are never filled; the list is at <Link href="/method/#known-gaps">known gaps</Link>.</li>
      </ul>
    </section>
  );
}
