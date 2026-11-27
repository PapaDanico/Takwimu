import Link from 'next/link';
import TableWrap from '../TableWrap';
import CalcTable from '../CalcTable';
import Reviewed from '../Reviewed';
import { LineChart, ColumnChart } from '../Charts';
import { ReviewCounts } from '../ObsTable';
import { badge } from '../../lib/review-status';
import { fmtFixed } from '../../lib/format';
import { plainDeep } from '../../lib/plain';
import { b1, b2, b3, b4, b5, osrSeries, refBadge, fyOf, LAY, SER } from '../../lib/layers';

// Layers B1 to B5 (data/siaya-analysis-layers.json) and the own-source revenue series of data/siaya-county-series.json.
// Canonical homes: B1, B2, B4 and B5 on /counties/siaya/analysis/; B3 and the series side by side on
// /counties/siaya/ledger/ (the home of own-source revenue). Department budgets as printed are on
// /counties/siaya/departments/. Thresholds are facts about a ratio, not verdicts; the Auditor-General's own ratios are
// shown beside ours, labelled as the auditor's, and never combined with them.
const DS = 'siaya-analysis-layers';
const p2 = (v) => (typeof v === 'number' ? fmtFixed(v, 2) : '—');
const fy = (y) => `FY ${y}`;
const Res = ({ r }) => (!r ? <span className="muted">No record</span> : r.status === 'gap' ? <span className="muted" title={r.gap_reason}>Gap</span>
  : <Reviewed b={badge(DS, r.calc_id)} title={r.calc_id}>{() => <b>{p2(r.result)}%</b>}</Reviewed>);
const Threshold = ({ t }) => (t ? <p className="rule-note"><b>Reference line at {t.value} per cent ({t.kind}).</b> {t.rule}</p> : null);
const Label = () => <span className="tag warn">{LAY.meta.label}</span>;
const records = (rs0) => plainDeep(rs0);

export const LAYERS_TOC = [['an-b1', 'Wage bill'], ['an-b2', 'Development share'], ['an-b4', 'Absorption by department'], ['an-b5', 'Pending bills burden']];

export function WageBill() {
  const d = b1();
  return (
    <section className="card" aria-labelledby="an-b1">
      <h2 id="an-b1">Wage bill as a share of total revenue</h2>
      <p className="lead"><Label /> Compensation of employees divided by total revenue received (equitable share, conditional grants and own-source revenue), all from the Controller of Budget&rsquo;s report for the year. {d.valued} of {d.records.length} years have a value; in {d.above.length} of them the share is above the 35 per cent ceiling. The other years are gaps: the report for that year does not print the wage bill, or prints it in a way that cannot be matched to its revenue.</p>
      <LineChart labels={d.years.map(fy)} unit="% of total revenue" yFormat="one" naText="Gap: no value" refLine={{ value: d.threshold.value, label: `${d.threshold.value}% ceiling` }}
        ariaLabel="Siaya wage bill as a share of total revenue by fiscal year, per cent, with the 35 per cent ceiling" series={d.series} />
      <Threshold t={d.threshold} />
      <TableWrap label="Wage bill share by year, beside the ceiling and the Auditor-General's own ratio">
        <table className="data" id="b1-table">
          <caption className="sr-only">Siaya wage bill as a share of total revenue (Takwimu calculation) beside the 35 per cent ceiling and the Auditor-General&rsquo;s own ratio</caption>
          <thead><tr><th scope="col">Year</th><th scope="col" className="num">Our calculation</th><th scope="col">Against 35%</th><th scope="col">Auditor-General&rsquo;s own ratio (as the auditor reports it)</th></tr></thead>
          <tbody>{d.years.map((y) => { const r = d.records.find((x) => fyOf(x) === y); const o = d.oag.filter((x) => x.fy === y); return (
            <tr key={y}><th scope="row">{fy(y)}</th><td className="num"><Res r={r} /></td><td>{r.status === 'gap' ? <small>{r.gap_reason}</small> : r.flags.above_ceiling ? <span className="tag warn">Above the ceiling</span> : 'At or below'}</td>
              <td>{o.length ? o.map((x) => <span key={x.record}>&ldquo;{x.value}&rdquo; ({x.source_id}, PDF p. {x.pdf_page}; the auditor&rsquo;s denominator)</span>) : <span className="muted">None printed</span>}</td></tr>
          ); })}</tbody>
        </table>
      </TableWrap>
      <p className="how">The two ratios use different denominators: ours is the whole county government&rsquo;s revenue received as the Controller of Budget reports it; the Auditor-General uses the County Executive&rsquo;s own receipts or revenue. They are shown side by side and not compared as one series.</p>
      <details className="tableview"><summary>Every record, with its formula and inputs</summary><CalcTable dataset={DS} caption="Wage bill share: every record with inputs" records={records(d.records)} id="calc-b1" /></details>
    </section>
  );
}

export function DevShare() {
  const d = b2();
  return (
    <section className="card" aria-labelledby="an-b2">
      <h2 id="an-b2">Development share of the budget and of spending</h2>
      <p className="lead"><Label /> Development budget or spending divided by the total, from one document and one budget version. The 30 per cent floor applies to the budget over the medium term; the share of actual spending is shown for contrast. Each kind of document is its own line: the Controller of Budget, the programme-based budget (original estimates) and the County Treasury&rsquo;s review use different budget versions and are never averaged. {d.budgetBelow.length ? `Budget shares below the floor: ${d.budgetBelow.map(fy).join(', ')}.` : `No budget share held is below the floor (${d.budgetValued.length} years with a budget share).`}</p>
      <LineChart labels={d.years.map(fy)} unit="% of total" yFormat="one" naText="No value from this kind of document" refLine={{ value: d.threshold.value, label: `${d.threshold.value}% floor (budget)` }}
        ariaLabel="Siaya development share of the budget and of actual spending by fiscal year and kind of document, per cent, with the 30 per cent floor" series={d.series} />
      <Threshold t={d.threshold} />
      <TableWrap label="Development share by year and kind of document">
        <table className="data" id="b2-table">
          <caption className="sr-only">Siaya development share by fiscal year and kind of document, per cent (Takwimu calculation); two readings of one document are both shown</caption>
          <thead><tr><th scope="col">Year</th>{d.kinds.map((k) => <th key={k.k} scope="col" className="num">{k.label}</th>)}</tr></thead>
          <tbody>{d.years.map((y) => (
            <tr key={y}><th scope="row">{fy(y)}</th>{d.kinds.map((k) => { const c = d.cell(y, k.k); return <td key={k.k} className="num">{c.length ? c.map((r) => <div key={r.calc_id}><Res r={r} />{/-bf$/.test(r.calc_id) ? <small> incl. balances b/f</small> : /-nobf$/.test(r.calc_id) ? <small> excl. balances b/f</small> : null}</div>) : <span className="muted">·</span>}</td>; })}</tr>
          ))}</tbody>
        </table>
      </TableWrap>
      <details className="tableview"><summary>Every record, with its formula and inputs</summary><CalcTable dataset={DS} caption="Development share: every record with inputs" records={records(d.records)} id="calc-b2" /></details>
    </section>
  );
}

export function DeptAbsorption() {
  const d = b4();
  return (
    <section className="card" aria-labelledby="an-b4">
      <h2 id="an-b4">Absorption by department</h2>
      <p className="lead"><Label /> Actual spending divided by the final budget, for each department, from the same table of the County Treasury&rsquo;s review of the year (CBROP). The budgets and spending themselves, the department name changes and the totals that do not add up are on <Link href="/counties/siaya/departments/">department budgets</Link>. {d.over100.length} department-years are above 100 per cent (spending above the final budget printed beside it).</p>
      <ColumnChart labels={d.latestChart.labels} unit={`% of final development budget, FY ${d.latest}`} yFormat="one" naText="No value"
        ariaLabel={`Siaya share of the final development budget spent by department, FY ${d.latest}, per cent`} series={[{ name: `Development absorption, FY ${d.latest}`, color: 1, values: d.latestChart.values }]} />
      <p className="how">In the FY 2023/24 review (CBROP of September 2024, Table 12) every department except the County Assembly prints the same 95.4 per cent absorption of compensation of employees, so those department figures look allocated in proportion rather than measured. They are kept as printed and the compensation rows are not read as department performance.</p>
      {d.classes.map((cls) => { const ys = d.years.filter((y) => d.depts.some((dep) => d.get(y, dep, cls))); return ys.length ? (
        <details key={cls} className="tableview" open={cls === 'development'}><summary>{cls === 'development' ? 'Development' : cls === 'recurrent' ? 'Recurrent' : cls === 'compensation' ? 'Compensation of employees' : 'Total'}: absorption by department and year</summary>
          <TableWrap label={`Absorption by department, ${cls}`}>
            <table className="data" id={`b4-${cls}`}>
              <caption className="sr-only">Siaya absorption ({cls}) by department and fiscal year, per cent of the final budget (Takwimu calculation from the CBROP tables)</caption>
              <thead><tr><th scope="col">Department</th>{ys.map((y) => <th key={y} scope="col" className="num">{y}</th>)}</tr></thead>
              <tbody>{d.depts.map((dep) => (
                <tr key={dep} className={dep === 'TOTAL' ? 'hl' : undefined}><th scope="row">{d.label(dep)}</th>{ys.map((y) => { const r = d.get(y, dep, cls); return <td key={y} className="num">{r ? <><Res r={r} />{r.flags.above_100 ? <small> above 100</small> : null}</> : <span className="muted">·</span>}</td>; })}</tr>
              ))}</tbody>
            </table>
          </TableWrap>
        </details>
      ) : null; })}
      <p className="src" id="b4-inputs">Each ratio&rsquo;s two inputs are the final budget and the actual printed in the same cell of the table on <Link href="/counties/siaya/departments/#dp-cbrop">department budgets</Link>, with the document, table and page. All {d.records.length} records, with calc_id, formula and inputs, are in the <Link href="/datasets/?q=siaya-analysis-layers">dataset catalogue</Link> and in <a href="/data/siaya-analysis-layers.json">siaya-analysis-layers.json</a>.</p>
    </section>
  );
}

export function PendingBurden() {
  const d = b5();
  return (
    <section className="card" aria-labelledby="an-b5">
      <h2 id="an-b5">Pending bills as a share of total revenue</h2>
      <p className="lead"><Label /> The stock of unpaid bills at 30 June divided by the revenue received in the year, both from the Controller of Budget&rsquo;s report for that year. A report often prints more than one stock for the same date (the county chapter and the cross-county table, Executive only or with the Assembly), so each reading gives its own ratio; none is chosen. The stocks themselves are compared on the <Link href="/counties/siaya/ledger/#pending-2025">fiscal reconciliation</Link> page.</p>
      <LineChart labels={d.years.map(fy)} unit="% of total revenue" yFormat="one" naText="Gap: no value" refLine={{ value: d.threshold.value, label: `${d.threshold.value}% limit (as the auditor applies it)` }}
        ariaLabel="Siaya pending bills as a share of total revenue by fiscal year and reading, per cent, with the 20 per cent limit the Auditor-General applies" series={d.series} />
      <Threshold t={d.threshold} />
      <TableWrap label="Pending bills share by year and reading, beside the Auditor-General's own ratio">
        <table className="data" id="b5-table">
          <caption className="sr-only">Siaya pending bills as a share of total revenue by fiscal year and reading (Takwimu calculation), beside the 20 per cent limit and the Auditor-General&rsquo;s own ratio</caption>
          <thead><tr><th scope="col">Year</th><th scope="col">Reading of the stock</th><th scope="col" className="num">Our calculation</th><th scope="col">Against 20%</th></tr></thead>
          <tbody>{d.records.map((r) => (
            <tr key={r.calc_id}><th scope="row">{r.period}</th><td><small>{r.status === 'gap' ? r.gap_reason : d.basisOf(r) || 'Not stated'}</small></td><td className="num"><Res r={r} /></td><td>{r.status === 'gap' ? '' : r.flags.above_limit ? <span className="tag warn">Above the limit</span> : 'At or below'}</td></tr>
          ))}</tbody>
        </table>
      </TableWrap>
      {d.oag.length ? <p className="how" id="b5-oag"><b>The Auditor-General&rsquo;s own ratio, shown beside ours:</b> {d.oag.map((o) => <span key={o.record}>{fy(o.fy)}: &ldquo;{o.value}&rdquo; ({o.source_id}, PDF p. {o.pdf_page}). </span>)}The auditor counts total liabilities of the County Executive against its own revenue figure; ours counts the pending bills stock the Controller of Budget prints against the whole county&rsquo;s revenue received. They answer different questions and are not combined.</p> : null}
      <details className="tableview"><summary>Every record, with its formula and inputs</summary><CalcTable dataset={DS} caption="Pending bills share: every record with inputs" records={records(d.records)} id="calc-b5" /></details>
    </section>
  );
}

// ---- Ledger: own-source revenue from four publishers side by side, and B3 on each basis ----
export const OSR_SERIES_TOC = [['osr-series', 'Four publishers'], ['osr-b3', 'Against target and in real terms']];
export function OsrSeries() {
  const s = osrSeries();
  const t = b3();
  const perfYears = t.years;
  const capita = t.records.filter((r) => t.parse(r).kind === 'capita');
  return (
    <>
      <section className="card" id="osr-series" aria-labelledby="osr-series-h">
        <h2 id="osr-series-h">Own-source revenue by publisher, FY 2013/14 to FY 2024/25: never blended</h2>
        <p className="lead">The same revenue as four publishers print it, each on its own basis. The Controller of Budget reports what the county declared; the County Treasury&rsquo;s review (CBROP) is the county&rsquo;s own account and is not audited; the County Treasury tables printed inside the Auditor-General&rsquo;s reports are outside the audit opinion; only the Receiver of Revenue statements are audited. Values are KSh million.<ReviewCounts dataset="siaya-county-series" /></p>
        <ul className="how" id="osr-bases">{Object.entries(s.bases).map(([k, v]) => <li key={k}><b>{k.replace(/_/g, ' ')}:</b> {v}</li>)}</ul>
        <LineChart labels={s.years.map(fy)} unit="KSh million" yFormat="int" naText="Not printed by this publisher"
          ariaLabel="Siaya own-source revenue by fiscal year as four publishers print it, KSh million" series={s.series} />
        <TableWrap label="Own-source revenue by publisher and year">
          <table className="data" id="osr-series-table">
            <caption className="sr-only">Siaya own-source revenue by fiscal year and publisher, KSh million, with the spread between the smallest and largest value</caption>
            <thead><tr><th scope="col">Year</th>{s.cols.map((c) => <th key={c} scope="col" className="num">{s.label(c)}</th>)}<th scope="col" className="num">Spread, % of the smallest</th></tr></thead>
            <tbody>{s.rows.map((c) => (
              <tr key={c.fy}><th scope="row">{fy(c.fy)}</th>{s.cols.map((col) => { const vs = c.values.filter((v) => v.series === col); return <td key={col} className="num">{vs.length ? vs.map((v, i) => <div key={i}><Reviewed b={refBadge(v.ref)}>{() => p2(v.value_ksh_m)}</Reviewed> <small>({v.source_id})</small></div>) : <span className="muted">·</span>}</td>; })}
                <td className="num">{typeof c.spread_pct_of_smallest === 'number' ? `${p2(c.spread_pct_of_smallest)}%` : '—'}</td></tr>
            ))}</tbody>
          </table>
        </TableWrap>
        <p className="how" id="osr-series-wide">Spreads above 10 per cent: {s.wide.map((c) => fy(c.fy)).join(', ')}. FY 2019/20 is conflict case <a href="/data/#osr-2019-20-audited-table">osr-2019-20-audited-table</a>; FY 2024/25 is mostly basis (the audited statement counts hospital fees received in cash; the accrual total is higher still). Hospital receipts (FIF) are <Link href="/learn/#own-source-revenue">explained on Learn</Link>.</p>
        <p className="src">Gaps in these series are listed once in <Link href="/method/#known-gaps">known gaps</Link>. Every value, with its table, page and OCR readings, is in the <Link href="/datasets/?q=siaya-county-series">dataset catalogue</Link> and in <a href="/data/siaya-county-series.json">siaya-county-series.json</a>.</p>
      </section>

      <section className="card" id="osr-b3" aria-labelledby="osr-b3-h">
        <h2 id="osr-b3-h">Own-source revenue against target, in real terms and per person</h2>
        <p className="lead"><Label /> Each ratio uses one publisher&rsquo;s actual and target from the same document; real terms use national CPI at FY 2024/25 prices; per person uses only years with a population figure for the calendar year the fiscal year starts (none is interpolated). One line per publisher.</p>
        <LineChart labels={perfYears.map(fy)} unit="% of the annual target" yFormat="one" naText="No value from this publisher"
          ariaLabel="Siaya own-source revenue as a share of the annual target by fiscal year and publisher, per cent" series={t.perfSeries} />
        <LineChart labels={perfYears.map(fy)} unit="KSh million at FY 2024/25 prices" yFormat="int" naText="No value from this publisher"
          ariaLabel="Siaya own-source revenue in real terms (FY 2024/25 prices) by fiscal year and publisher, KSh million" series={t.realSeries} />
        <TableWrap label="Own-source revenue per person by year and publisher">
          <table className="data" id="osr-capita">
            <caption className="sr-only">Siaya own-source revenue per person, KSh at current prices, by fiscal year and publisher (Takwimu calculation)</caption>
            <thead><tr><th scope="col">Year and publisher</th><th scope="col" className="num">KSh per person</th></tr></thead>
            <tbody>{capita.map((r) => <tr key={r.calc_id}><th scope="row">{r.title}</th><td className="num">{r.status === 'gap' ? <span className="muted" title={r.gap_reason}>Gap</span> : <Reviewed b={badge(DS, r.calc_id)}>{() => <b>{r.result}</b>}</Reviewed>}</td></tr>)}</tbody>
          </table>
        </TableWrap>
        <details className="tableview"><summary>Every record ({t.records.length}), with its formula, inputs and gap reasons</summary><CalcTable dataset={DS} caption="Own-source revenue against target, real and per person: every record with inputs" records={records(t.records)} id="calc-b3" /></details>
      </section>
    </>
  );
}

export { SER };
