import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import Reviewed from '../../../../components/Reviewed';
import { ColumnChart } from '../../../../components/Charts';
import { Provisional } from '../../../../components/ObsTable';
import { badge } from '../../../../lib/review-status';
import { departments } from '../../../../lib/layers';
import { source, pageRef } from '../../../../lib/siaya-sources';
import { fmtFixed, fmtNum } from '../../../../lib/format';

export const metadata = {
  title: 'Siaya department budgets',
  description: 'Siaya County budgets by department from ten programme-based budgets, and final budget against actual spending by department from seven County Budget Review and Outlook Papers, with the name crosswalk and the printed totals that do not add up.',
};

// Department budgets as the County Treasury printed them (data/siaya-budget-departments.json). Canonical home of the
// department figures and of the name crosswalk; absorption ratios by department are on /counties/siaya/analysis/#an-b4.
const d = departments();
const DS = 'siaya-budget-departments';
const m = (o) => (o && typeof o.value === 'number' ? fmtFixed(o.value / 1e6, 2) : null);
const ksh = (v) => (typeof v === 'number' ? fmtNum(v) : '—');
const V = ({ o }) => (o ? <Reviewed b={badge(DS, o.id)}>{() => <>{m(o)}{d.flaggedIds.has(o.id) ? <> <span className="tag warn">Does not add up</span></> : null}</>}</Reviewed> : <span className="muted">·</span>);
const colLabel = (c) => { const [fy, v, bf] = c.split('|'); return <>{fy}<br /><small>{v}{bf === 'true' ? ', incl. balances b/f' : bf === 'false' ? ', excl. balances b/f' : ''}</small></>; };
const Doc = ({ o }) => { const s = source(o.source_id); return <>{s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}, {o.table}, {pageRef(o.pdf_page, o.printed_page)}</>; };
const latestFy = d.latestPbb.split('|')[0];

export default function SiayaDepartments() {
  const pbbDocs = d.sources.filter((s) => s.kind === 'PBB').length;
  const cbropDocs = d.sources.filter((s) => s.kind === 'CBROP').length;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Departments" title="Siaya department budgets and spending"
        sub="What each county department was budgeted, and what it spent against its final budget, as the County Treasury’s own documents print it."
        path="/counties/siaya/departments/" shareText="Siaya: budgets and spending by department" />

      <section className="card gold" aria-labelledby="dp-read">
        <h2 id="dp-read">How to read this page</h2>
        <Provisional dataset={DS} />
        <ul className="how">
          <li><b>Two kinds of document.</b> Budgets come from {pbbDocs} programme-based budgets (the estimates the Assembly approves). Final budgets and actual spending come from {cbropDocs} County Budget Review and Outlook Papers (CBROP), each reviewing one year. All values are KSh million, rounded from the whole shillings printed.</li>
          <li><b>Versions stay apart.</b> Original, supplementary and final budgets are different figures, and some include balances brought forward from the year before. Each column says which it is.</li>
          <li><b>Totals as printed.</b> The whole-county row is the document&rsquo;s own Total row. Where it does not equal the sum of the departments, it carries the mark <span className="tag warn">Does not add up</span> and is listed below; nothing is corrected.</li>
          <li><b>Gaps stay gaps.</b> {d.gaps.length} years or documents are missing (for example FY 2017/18 and FY 2022/23); they are listed once in <Link href="/method/#known-gaps">known gaps</Link>. A dot means the document prints no value for that department.</li>
        </ul>
      </section>

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#dp-latest">Latest budget</a></li><li><a href="#dp-pbb">Budgets by year</a></li><li><a href="#dp-cbrop">Budget and actual</a></li><li><a href="#dp-cross">Department names</a></li><li><a href="#dp-flags">Totals that do not add up</a></li>
      </ul></nav>

      <section className="card" aria-labelledby="dp-latest">
        <h2 id="dp-latest">Budget by department, FY {latestFy} (original estimates)</h2>
        <p className="lead">Total budget (recurrent and development) of each department in the programme-based budget for FY {latestFy}, including balances brought forward. The three municipalities appear as their own votes from FY 2024/25.</p>
        <ColumnChart labels={d.latestRows.map((x) => d.label(x.dept).split(/[,/(]/)[0].trim())} unit={`KSh million, FY ${latestFy} original budget`} yFormat="int" naText="Not printed"
          ariaLabel={`Siaya total budget by department, FY ${latestFy}, original estimates, KSh million`} series={[{ name: `Budget, FY ${latestFy}`, color: 1, values: d.latestRows.map((x) => (typeof x.o.value === 'number' ? Math.round(x.o.value / 1e4) / 100 : null)) }]} />
        <p className="src">Source: <Doc o={d.latestRows[0].o} />.</p>
      </section>

      <section className="card" aria-labelledby="dp-pbb">
        <h2 id="dp-pbb">Total budget by department and year (programme-based budgets)</h2>
        <p className="lead">Each column is one budget as printed: its year, its version and whether balances brought forward are in it. Columns are not a time series of one measure; compare a department across years only through the name notes below.</p>
        <TableWrap label="Total budget by department, year and version, KSh million">
          <table className="data" id="dp-pbb-table">
            <caption className="sr-only">Siaya total budget by department and programme-based budget (year, version, balances brought forward), KSh million</caption>
            <thead><tr><th scope="col">Department</th>{d.pbbCols.map((c) => <th key={c} scope="col" className="num">{colLabel(c)}</th>)}</tr></thead>
            <tbody>{d.deptCodes.map((dep) => (
              <tr key={dep} className={dep === 'TOTAL' ? 'hl' : undefined}><th scope="row">{dep === 'TOTAL' ? 'Total (printed)' : d.label(dep)}</th>{d.pbbCols.map((c) => <td key={c} className="num"><V o={d.pbb(c, dep)} /></td>)}</tr>
            ))}</tbody>
          </table>
        </TableWrap>
        <p className="src">Documents: {d.sources.filter((s) => s.kind === 'PBB').map((s, i) => <span key={s.source_id}>{i ? '; ' : ''}{s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}</span>)}. Recurrent, development, compensation and operations budgets by department are in the dataset. Confidence: {d.meta.confidence_scale}.</p>
      </section>

      <section className="card" aria-labelledby="dp-cbrop">
        <h2 id="dp-cbrop">Final budget and actual spending by department (County Treasury reviews)</h2>
        <p className="lead">Each cell gives the final budget (including balances brought forward) and the actual spending of the year, both from the same table of the review paper. Absorption, actual over final budget, is worked out for every cell on <Link href="/counties/siaya/analysis/#an-b4">Siaya analysis</Link>.</p>
        {['total', 'development', 'recurrent'].map((cls) => { const ys = d.cbropYears(cls); return ys.length ? (
          <details key={cls} className="tableview" open={cls === 'total'}><summary>{cls === 'total' ? 'Total' : cls === 'development' ? 'Development' : 'Recurrent'}: final budget and actual, KSh million ({ys.length} years)</summary>
            <TableWrap label={`Final budget and actual by department, ${cls}`}>
              <table className="data" id={`dp-cbrop-${cls}`}>
                <caption className="sr-only">Siaya {cls} final budget and actual spending by department and fiscal year, KSh million (County Budget Review and Outlook Papers)</caption>
                <thead><tr><th scope="col">Department</th>{ys.map((y) => <th key={y} scope="col" className="num">{y}<br /><small>budget / actual</small></th>)}</tr></thead>
                <tbody>{d.deptCodes.filter((dep) => ys.some((y) => d.cbrop(y, dep, cls, 'actual'))).map((dep) => (
                  <tr key={dep} className={dep === 'TOTAL' ? 'hl' : undefined}><th scope="row">{dep === 'TOTAL' ? 'Total (printed)' : d.label(dep)}</th>{ys.map((y) => { const b = d.cbrop(y, dep, cls, 'budget'); const a = d.cbrop(y, dep, cls, 'actual'); return <td key={y} className="num">{b || a ? <><V o={b} /><br /><V o={a} /></> : <span className="muted">·</span>}</td>; })}</tr>
                ))}</tbody>
              </table>
            </TableWrap>
          </details>
        ) : null; })}
        <p className="how">The FY 2023/24 review (CBROP of September 2024) prints the same 95.4 per cent absorption of compensation of employees for every department except the County Assembly, so the department figures for staff costs look allocated in proportion; they are in the dataset as printed and are not read as department performance. FY 2017/18 prints department budgets (original and supplementary) but no department actuals.</p>
      </section>

      <section className="card" aria-labelledby="dp-cross">
        <h2 id="dp-cross">Department names across the years: the crosswalk</h2>
        <p className="lead">Departments are renamed, merged and split between budgets. Each printed name is matched to one code; a name that matched no code, or more than one, would be listed as unmatched and its values left out. Unmatched names: {d.unmatched.length}. The note on each code says what changed, so a figure for one year is compared with another only where the functions match.</p>
        <TableWrap label="Department crosswalk: code, printed names and years">
          <table className="data" id="dp-crosswalk">
            <caption className="sr-only">Siaya department crosswalk: each code with every printed name, the years it appears and what changed</caption>
            <thead><tr><th scope="col">Code and department</th><th scope="col">Printed names (years)</th><th scope="col">What changed</th></tr></thead>
            <tbody>{d.cross.map((c) => (
              <tr key={c.code}><th scope="row">{c.label}<br /><small><code>{c.code}</code></small></th><td><ul className="inputs">{c.names.map((n) => <li key={n.printed_name}>{n.printed_name} ({n.fys.join(', ')})</li>)}</ul></td><td><small>{c.note || 'No change recorded.'}</small></td></tr>
            ))}</tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="dp-flags">
        <h2 id="dp-flags">Printed totals that do not add up</h2>
        <p className="lead">The build compares every printed Total row with the sum of its department rows ({d.sumChecks} checks) and every department&rsquo;s recurrent plus development with its printed total ({d.rowChecks} checks). {d.flaggedSums.length} totals differ ({d.flaggedSums.filter((c) => c.status !== 'does not add').length} of them by KSh 5 or less, which is rounding) and {d.flaggedRows.length} department rows differ. Those that do not add up are flagged in the tables above and shown here as printed; no figure is corrected.</p>
        <TableWrap label="Totals that differ from the sum of their parts">
          <table className="data" id="dp-sum-flags">
            <caption className="sr-only">Printed totals that differ from the sum of the department rows, KSh</caption>
            <thead><tr><th scope="col">Total row and document</th><th scope="col" className="num">Printed total, KSh</th><th scope="col" className="num">Sum of departments, KSh</th><th scope="col" className="num">Difference, KSh</th><th scope="col">Status</th></tr></thead>
            <tbody>{d.flaggedSums.map((c) => (
              <tr key={c.total_id}><th scope="row">FY {c.total.fy}, {c.total.class} {c.total.measure}{c.total.budget_version ? ` (${c.total.budget_version})` : ''}<br /><small className="cite"><Doc o={c.total} /></small></th>
                <td className="num"><Reviewed b={badge(DS, c.total_id)}>{() => ksh(c.printed_total)}</Reviewed></td><td className="num">{ksh(c.sum_of_parts)}</td><td className="num">{ksh(c.difference)}</td><td><span className="tag warn">{c.status}</span></td></tr>
            ))}</tbody>
          </table>
        </TableWrap>
        <TableWrap label="Department rows where recurrent plus development differs from the printed total">
          <table className="data" id="dp-row-flags">
            <caption className="sr-only">Department rows where recurrent plus development differs from the printed total, KSh</caption>
            <thead><tr><th scope="col">Department row and document</th><th scope="col" className="num">Difference, KSh</th><th scope="col">Status</th></tr></thead>
            <tbody>{d.flaggedRows.map((c) => (
              <tr key={c.total_id}><th scope="row">FY {c.total.fy}, {d.label(c.total.dept_code)}, {c.total.measure}{c.total.budget_version ? ` (${c.total.budget_version})` : ''}<br /><small className="cite"><Doc o={c.total} /></small></th>
                <td className="num"><Reviewed b={badge(DS, c.total_id)}>{() => ksh(c.difference)}</Reviewed></td><td><span className="tag warn">{c.status}</span></td></tr>
            ))}</tbody>
          </table>
        </TableWrap>
        <p className="src">Every value, with its document, table, PDF page and confidence, is in the <Link href="/datasets/?q=siaya-budget-departments">dataset catalogue</Link> and in <a href="/data/siaya-budget-departments.json">siaya-budget-departments.json</a>. {d.meta.read_method}</p>
      </section>
    </main>
  );
}
