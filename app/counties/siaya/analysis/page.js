import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import { LineChart } from '../../../../components/Charts';
import CalcTable from '../../../../components/CalcTable';
import { Provisional, ReviewCounts } from '../../../../components/ObsTable';
import { masked, badge } from '../../../../lib/review-status';
import Reviewed from '../../../../components/Reviewed';

// Masked: a result is withheld (null) when the calculation or any of its inputs was rejected in editorial review.
const a = masked('siaya-analysis');

export const metadata = {
  title: 'Siaya analysis',
  description: 'Measures calculated by Takwimu Kenya from published figures for Siaya: real spending per person, transfer dependency, execution rates beside printed rates, pending bills, audit recurrence, budget beside services, climate finance beside hotspot wards and the make-up of own-source revenue (ordinary revenue and health FIF).',
};

const R = a.records;
const fam = (f, extra = () => true) => R.filter((r) => r.family === f && extra(r));
const fyOf = (r) => (r.period.match(/FY \d{4}\/\d{2}/) || [r.period])[0];
const uniq = (xs) => [...new Set(xs)];
const LABEL = a.meta.label;

// A1: real per-capita spending. Census and projection points are separate series, so they are visibly distinct.
const a1 = fam('A1');
const a1Years = uniq(a1.map(fyOf)).sort();
const a1Series = ['census', 'projection'].map((k, i) => ({
  name: k === 'census' ? 'Population from the 2019 census count' : 'Population from a projection', color: i + 1, dash: k === 'projection',
  values: a1Years.map((y) => { const r = a1.find((x) => x.status === 'value' && fyOf(x) === y && x.flags.population_kind === k); return r ? r.result : null; }),
}));

// A2: transfer dependency, one series per kind of source document; never mixed.
const a2 = fam('A2');
const a2Years = uniq(a2.map(fyOf)).sort();
const A2_SRC = [['Controller of Budget annual reports', (id) => /^cob-report-/.test(id)], ['County quarterly (Q4) reports', (id) => /^GOV-02-/.test(id)], ['County Budget Review and Outlook Paper', (id) => id === 'GOV-03']];
const a2Series = A2_SRC.map(([name, test], i) => ({
  name, color: i + 1, dash: i > 0,
  values: a2Years.map((y) => { const r = a2.find((x) => x.status === 'value' && fyOf(x) === y && test(x.source_ids[0]) && !(/^GOV-02-/.test(x.source_ids[0]) && !x.source_ids[0].includes(y.slice(3).replace('/', '-')))); return r ? r.result : null; }),
}));

// A3: execution rates, recalculated beside printed, Controller of Budget and county documents in separate columns.
const a3 = fam('A3');
const a3Rows = uniq(a3.map((r) => `${fyOf(r)}|${r.calc_id.split('-').slice(-1)[0].replace(/original|supplementary/, 'total')}`)).sort();
const a3Cell = (fy, part, cob) => a3.filter((r) => fyOf(r) === fy && r.calc_id.includes(`-${part}`) && (cob ? /cob-/.test(r.source_ids[0]) : !/cob-/.test(r.source_ids[0])));
const a3Dev = uniq(a3.map(fyOf)).sort();
const a3DevSeries = [['Recalculated, Controller of Budget reports', true], ['Recalculated, county documents', false]].map(([name, cob], i) => ({
  name, color: i + 1, dash: !cob, values: a3Dev.map((y) => { const r = a3Cell(y, 'development', cob).find((x) => x.status === 'value'); return r ? r.result : null; }),
}));
const printedOf = (r) => (r.beside || []).filter((b) => b.role === 'printed_rate').map((b) => b.value);
const Cell = ({ rs }) => (rs.length ? rs.map((r) => (
  <div key={r.calc_id}>
    {r.status === 'gap' ? <span className="muted">Gap</span> : <Reviewed b={badge('siaya-analysis', r.calc_id)}>{() => <b>{r.result}%</b>}</Reviewed>}
    {printedOf(r).length ? <> · printed {uniq(printedOf(r)).join(' and ')}%</> : null}
    <br /><small><code>{r.calc_id}</code></small>
  </div>
)) : <span className="muted">No document</span>);

// A4: stocks by date and source; changes and roll-forward residuals.
const a4Stock = fam('A4', (r) => /-stock-/.test(r.calc_id));
const a4Change = fam('A4', (r) => !/-stock-/.test(r.calc_id));
// A5: category counts (matrix) and the other recurrence counts.
const a5Cat = fam('A5', (r) => r.flags.count_kind === 'category' && r.status === 'value');
const a5Cols = uniq(a5Cat.map((r) => `${r.flags.entity}|${r.flags.fy}`)).sort((x, y) => x.split('|')[1].localeCompare(y.split('|')[1]) || x.localeCompare(y));
const a5Cats = uniq(a5Cat.map((r) => r.flags.category)).sort();
const ENT = { county_executive: 'Executive', county_assembly: 'Assembly', county_government: 'County government' };
const gaps = R.filter((r) => r.status === 'gap');

// A8: own-source revenue composition (ordinary OSR and health FIF/A-i-A), Siaya by document, and all 47 counties.
const a8 = fam('A8');
const a8Share = a8.filter((r) => r.status === 'value' && r.calc.op === 'ratio_pct');
const a8In = (r, role) => (r.inputs.concat(r.beside || [])).find((i) => i.role === role);
const a8Diff = (part) => a8.find((r) => r.calc_id === `SIA-A8-2024-25-difference-${part}`);
const a8Rank = a8.filter((r) => r.calc && r.calc.op === 'share_rank');
const COUNTY_ROWS = (r) => {
  const by = {};
  r.inputs.forEach((i) => { by[i.county_code] = by[i.county_code] || { code: i.county_code, county: i.county }; by[i.county_code][i.role] = i.value; });
  return Object.values(by).map((x) => ({ ...x, share: Math.round((10000 * x.fif) / x.total) / 100 })).sort((a, b) => b.share - a.share || a.code - b.code);
};
const m2 = (v) => (typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
const DOC = (id) => (/^cob-report-/.test(id) ? `Controller of Budget annual report ${id.replace('cob-report-', 'FY ').replace(/-(\d\d)$/, '/$1')}` : id === 'GOV-03' ? 'County Budget Review and Outlook Paper (GOV-03)' : /^GOV-02-FY(\d{4})-(\d\d)-Q4$/.test(id) ? `County Q4 budget implementation report FY ${id.replace(/^GOV-02-FY(\d{4})-(\d\d)-Q4$/, '$1/$2')}` : id);

export default function SiayaAnalysis() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Analysis" title="Siaya analysis"
        sub="Measures that no report prints but that can be worked out from figures the reports do print: spending per person in today’s prices, how much the county relies on transfers, how much of its budget it spends, how unpaid bills change, and which audit findings recur."
        path="/counties/siaya/analysis/" shareText="Siaya analysis: calculated from published figures" />

      <section className="card gold" aria-labelledby="an-read">
        <h2 id="an-read">How to read this page</h2>
        <p className="provisional"><span className="tag warn" id="calc-label">{LABEL}</span> <span className="tag warn">Provisional: awaiting editorial review</span> Each value below is arithmetic by Takwimu on published figures; it is not printed in any report and has not yet been checked by a reviewer.<ReviewCounts dataset="siaya-analysis" /></p>
        <ul className="how">
          <li><b>Every value can be traced.</b> Each has a calc_id, the formula in words and its inputs, each linked to the document and page it was read from. Open &ldquo;Inputs&rdquo; under any row.</li>
          <li><b>One source per calculation.</b> A numerator and its denominator come from the same document. Controller of Budget and county figures are kept as separate records and never mixed.</li>
          <li><b>Gaps stay gaps.</b> Where an input is missing or not comparable the record says why and has no value; nothing is filled or averaged. {gaps.length} of {R.length} records are gaps.</li>
          <li><b>No verdicts.</b> Rates and counts describe documents, not the performance of any person.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="an-a1">
        <h2 id="an-a1">Real spending per person</h2>
        <p className="lead">Total county spending divided by population, in KSh per person at FY 2024/25 prices (national CPI). Points using the 2019 census count and points using a population projection are separate lines. Only four years have a value; the others are gaps, listed in the table.</p>
        <LineChart labels={a1Years} unit="KSh per person (FY 2024/25 prices)" yFormat="int" naText="Gap: no value"
          ariaLabel="Siaya real county spending per person, FY 2024/25 prices, by population basis" series={a1Series} />
        <CalcTable caption="Real spending per person: every record" records={a1} id="calc-a1" />
      </section>

      <section className="card" aria-labelledby="an-a2">
        <h2 id="an-a2">Dependence on national transfers</h2>
        <p className="lead">Equitable share and conditional grants received, as a share of those two plus own-source revenue collected, all from one document. One line per kind of document; Controller of Budget and county figures are never combined. The denominator is not total revenue: it leaves out balances brought forward.</p>
        <LineChart labels={a2Years} unit="%" yFormat="one" naText="No value from this kind of document"
          ariaLabel="Siaya transfer dependency by fiscal year, per cent, by kind of source document" series={a2Series} />
        <CalcTable caption="Transfer dependency: every record" records={a2} id="calc-a2" />
      </section>

      <section className="card" aria-labelledby="an-a3">
        <h2 id="an-a3">Budget execution: printed and recalculated, side by side</h2>
        <p className="lead">Spending divided by budget, from the same document and budget version. Each recalculated rate is shown with the rate the report printed. Controller of Budget and county documents are in separate columns; they use different budgets and cut-off dates. No printed rate differs from its recalculation by more than 1 point.</p>
        <LineChart labels={a3Dev} unit="% of development budget" yFormat="one" naText="No value"
          ariaLabel="Siaya development budget execution, recalculated, by kind of source document, per cent" series={a3DevSeries} />
        <TableWrap label="Execution rates: Controller of Budget and county documents side by side">
          <table className="data" id="exec-side">
            <caption className="sr-only">Siaya execution rates, recalculated beside printed, Controller of Budget and county documents side by side</caption>
            <thead><tr><th scope="col">Year and budget</th><th scope="col">Controller of Budget report</th><th scope="col">County document</th></tr></thead>
            <tbody>
              {a3Rows.map((k) => { const [fy, part] = k.split('|'); return (
                <tr key={k}><th scope="row">{fy}, {part}</th><td><Cell rs={a3Cell(fy, part, true)} /></td><td><Cell rs={a3Cell(fy, part, false)} /></td></tr>
              ); })}
            </tbody>
          </table>
        </TableWrap>
        <CalcTable caption="Execution rates: every record with inputs" records={a3} id="calc-a3" />
      </section>

      <section className="card" aria-labelledby="an-a4">
        <h2 id="an-a4">Pending bills: stocks and changes by source</h2>
        <p className="lead">Each reported stock of unpaid bills is kept with its date and source; sources count different things (executive only or whole county, verified or not). Changes are calculated only within one document or one declared series.</p>
        <h3>Reported stocks</h3>
        <CalcTable caption="Pending bills stocks by date and source" records={a4Stock} id="calc-a4-stock" />
        <h3>Changes and roll-forward checks</h3>
        <CalcTable caption="Pending bills changes and roll-forward residuals" records={a4Change} id="calc-a4-change" />
      </section>

      <section className="card" aria-labelledby="an-a5">
        <h2 id="an-a5">Audit findings that recur</h2>
        <p className="lead">Findings by category for each entity and year, as categorised by the Takwimu tracker (not by the auditor). Findings are the auditor&rsquo;s findings, not legal conclusions. Each cell gives the count; the calc_id of every count is in the dataset.</p>
        <TableWrap label="Audit findings by category, entity and year">
          <table className="data" id="audit-matrix">
            <caption className="sr-only">Siaya audit findings by category, entity and year (counts)</caption>
            <thead><tr><th scope="col">Category</th>{a5Cols.map((c) => { const [e, fy] = c.split('|'); return <th key={c} scope="col">{fy}<br /><small>{ENT[e] || e}</small></th>; })}</tr></thead>
            <tbody>
              {a5Cats.map((cat) => (
                <tr key={cat}><th scope="row">{cat.replace(/_/g, ' ')}</th>{a5Cols.map((c) => { const [e, fy] = c.split('|'); const r = a5Cat.find((x) => x.flags.category === cat && x.flags.entity === e && x.flags.fy === fy); return r ? <Reviewed key={c} as="td" title={r.calc_id} b={badge('siaya-analysis', r.calc_id)}>{r.result}</Reviewed> : <td key={c}>·</td>; })}</tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <CalcTable caption="Carried-over, unresolved and repeated findings" records={fam('A5', (r) => r.flags.count_kind !== 'category' || r.status === 'gap')} id="calc-a5" />
        <p className="src">The findings themselves are on <Link href="/counties/siaya/audits/">Audit findings</Link>.</p>
      </section>

      <section className="card" aria-labelledby="an-a6">
        <h2 id="an-a6">Budget beside services: context, not causation</h2>
        <p className="lead" id="context-not-causation">Sector spending shown next to a service indicator from the same period. This is context, not causation: no ratio is calculated, and spending in one year does not by itself explain a service level.</p>
        <CalcTable caption="Budget beside service indicators (context, not causation)" records={fam('A6')} id="calc-a6" tag="Context, not causation" />
      </section>

      <section className="card" aria-labelledby="an-a7">
        <h2 id="an-a7">Climate finance beside hotspot wards</h2>
        <p className="lead">The number of wards whose climate risk assessment table prints a flood or drought hotspot, shown beside the FY 2023/24 FLLoCA allocations. An allocation is not money received or spent, and neither is an outcome. See the wards on the <Link href="/counties/siaya/wards/">ward map</Link> and the hotspots on <Link href="/counties/siaya/climate/">Climate, water and resilience</Link>.</p>
        <CalcTable caption="Climate finance beside PCRA hotspot wards" records={fam('A7')} id="calc-a7" />
      </section>

      <section className="card" aria-labelledby="an-a8" id="osr-composition">
        <h2 id="an-a8">Own-source revenue: ordinary revenue and health facility receipts</h2>
        <p className="lead">Own-source revenue has two parts in the reports: ordinary own-source revenue (rates, fees, licences and levies paid into the County Revenue Fund) and Facility Improvement Financing (FIF) or appropriations-in-aid, money hospitals and health facilities collect and spend at source. FIF is lawful own-source revenue under the Facility Improvement Financing Act, 2023. The share below describes how the total is made up; it does not judge collection. Each document is a separate row and none is averaged.</p>
        <TableWrap label="Siaya own-source revenue by part, document and year">
          <table className="data" id="osr-parts">
            <caption className="sr-only">Siaya own-source revenue: ordinary revenue, FIF/A-i-A, printed total and FIF share, by fiscal year and source document (KSh million)</caption>
            <thead><tr><th scope="col">Year and document</th><th scope="col" className="num">Ordinary OSR</th><th scope="col" className="num">FIF / A-i-A</th><th scope="col" className="num">Total (printed)</th><th scope="col" className="num">FIF share</th></tr></thead>
            <tbody>
              {a8Share.map((r) => { const o = a8In(r, 'ordinary'); const f = a8In(r, 'fif'); const tot = a8In(r, 'printed_total') || a8In(r, 'total'); return (
                <tr key={r.calc_id}><th scope="row">{r.period}<br /><small>{DOC(r.source_ids[0])}, PDF p. {f.pdf_page}</small></th><td className="num">{o ? m2(o.value) : 'Not given'}</td><td className="num">{m2(f.value)}</td><td className="num">{tot ? m2(tot.value) : '—'}</td><td className="num"><Reviewed b={badge('siaya-analysis', r.calc_id)}>{() => <b>{m2(r.result)}%</b>}</Reviewed></td></tr>
              ); })}
            </tbody>
          </table>
        </TableWrap>
        <p className="how">Earlier years are gaps: those reports print one own-source revenue figure and do not give health facility receipts separately. FY 2022/23 gives appropriations-in-aid, not FIF by name. FY 2023/24 uses the printed 388.63 million (Table 3.258 and Table 2.1; see case <a href="/data/#fif-2023-24-reading">fif-2023-24-reading</a>).</p>
        {a8Diff('total') && a8Diff('fif') && a8Diff('ordinary') ? (
          <p className="finding" id="osr-dispute-parts">FY 2024/25: the county&rsquo;s Q4 report gives KSh {m2(a8Diff('total').inputs[0].value)} million and the Controller of Budget KSh {m2(a8Diff('total').inputs[1].value)} million, a difference of KSh {m2(a8Diff('total').result)} million (case <a href="/data/#osr-2024-25-county-statement">osr-2024-25-county-statement</a>). Part by part, the two documents differ by KSh {m2(a8Diff('fif').result)} million in FIF/A-i-A and by KSh {m2(a8Diff('ordinary').result)} million in ordinary own-source revenue (county {m2(a8Diff('ordinary').inputs[0].value)}, Controller of Budget {m2(a8Diff('ordinary').inputs[1].value)}). So the difference sits in the hospital and health facility receipts, not in ordinary revenue. Both figures are kept; neither is chosen.</p>
        ) : null}
        {a8Rank.map((r) => { const rows = COUNTY_ROWS(r); return (
          <div key={r.calc_id}>
            <h3>All counties, {r.period}: FIF/A-i-A share of own-source revenue</h3>
            <p className="lead">Controller of Budget Table 2.1 for {r.period}. Siaya: {m2(r.flags.siaya_share_pct)}%, position {r.result} of {r.flags.n_counties} (1 = highest share); the middle value across counties is {m2(r.flags.median_share_pct)}%. Counties record different things as FIF/A-i-A, so the table compares what each reported.</p>
            <details className="tableview"><summary>View all {rows.length} counties</summary>
              <TableWrap label={`FIF share of own-source revenue by county, ${r.period}`}>
                <table className="data">
                  <caption className="sr-only">FIF/A-i-A and total own-source revenue by county, {r.period}, KSh million, ordered by FIF share</caption>
                  <thead><tr><th scope="col">Position</th><th scope="col">County</th><th scope="col" className="num">FIF / A-i-A</th><th scope="col" className="num">Total OSR</th><th scope="col" className="num">FIF share</th></tr></thead>
                  <tbody>{rows.map((x, i) => <tr key={x.code} className={x.code === 41 ? 'hl' : undefined}><td className="num">{i + 1}</td><th scope="row">{x.code === 41 ? <b>{x.county}</b> : x.county}</th><td className="num">{m2(x.fif)}</td><td className="num">{m2(x.total)}</td><td className="num">{m2(x.share)}%</td></tr>)}</tbody>
                </table>
              </TableWrap>
            </details>
          </div>
        ); })}
        <CalcTable caption="Own-source revenue composition: every record with inputs" records={a8} id="calc-a8" />
      </section>

      <section className="card" aria-labelledby="an-gaps">
        <h2 id="an-gaps">Gaps and their reasons</h2>
        <p className="lead">{gaps.length} records have no value. Each reason is in the tables above; the list below gathers them.</p>
        <ul className="how" id="gap-list">{gaps.map((g) => <li key={g.calc_id}><b>{g.title}</b> (<code>{g.calc_id}</code>): {g.gap_reason}</li>)}</ul>
        <p className="src">{LABEL}. Built by scripts/build-siaya-analysis.js from files already validated in this repository. Every record is in the <Link href="/datasets/?q=siaya-analysis">dataset catalogue</Link> and in <a href="/data/siaya-analysis.json">siaya-analysis.json</a>.</p>
      </section>
    </main>
  );
}
