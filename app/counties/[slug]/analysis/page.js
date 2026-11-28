import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import CountyNav from '../../../../components/county/CountyNav';
import TableWrap from '../../../../components/TableWrap';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import CountyCite, { ValueFlags, pageRef } from '../../../../components/county/Cite';
import { ColumnChart, LineChart } from '../../../../components/Charts';
import { paramsFor } from '../../../../components/county/params';
import { fmtNum, fmtFixed } from '../../../../lib/format';
import * as cp from '../../../../lib/county-pages';
import * as ca from '../../../../lib/county-analysis';
import { pageMeta } from '../../../../lib/page-meta';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('analysis');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/analysis/`, { title: `${m.name}: analysis`, description: `${m.name} County spending per person in real terms, the share of the budget spent over ten years, and ${m.name} beside Siaya and all 47 counties in the Controller of Budget tables, FY 2021/22 to 2024/25, worked out from published figures with every input cited.` });
}

const gap = (why) => <span className="muted">Gap: {why}</span>;
const pct = (c) => (c ? `${fmtFixed(c.value, 1)}%` : <span className="muted">Not available</span>);

export default function CountyAnalysis({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const pp = ca.perPerson(slug);
  const sy = ca.siayaPerPerson();
  const ab = ca.absorption(slug);
  const ac = ca.amongCounties(slug);
  const base = `/counties/${slug}/analysis/`;
  const ppYears = pp.rows.map((r) => r.fy);
  const syBy = Object.fromEntries(sy.map((r) => [r.fy, r]));
  const ppGaps = pp.rows.filter((r) => r.gap);
  const abGaps = ab.flatMap((r) => [['recurrent', 'Recurrent'], ['development', 'Development']].filter(([k]) => r[k].gap).map(([k, t]) => `${t} absorption, FY ${r.fy}: ${r[k].gap}.`));
  const acGaps = ac.measures.flatMap((x) => x.years.filter((y) => !y.county).map((y) => `${x.title}, FY ${y.fy}: no ${m.name} value in the Controller of Budget table (blank, doubtful or not printed that year).`));
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Analysis" title="Analysis"
        sub={`${m.name} County's spending per person in real terms, the share of its budget spent each year, and ${m.name} beside Siaya and all 47 counties, worked out from figures the reports print. Every input is cited; a year that cannot be worked out is listed as a gap.`}
        path={base} shareText={`${m.name}: analysis`} />
      <PageToc items={[['an-pp', 'Spending per person, real terms'], ['an-abs', 'Share of the budget spent'], ['an-47', `${m.name}, Siaya and all counties`], ['an-gaps', 'Gaps and limits']]} />

      <section className="card gold" aria-labelledby="an-read">
        <h2 id="an-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>These are Takwimu calculations, not figures a publisher printed. Each shows its formula and the printed values it uses, with source, page and confidence; a calculation is never more certain than its least certain input.</li>
          <li>{m.name}&rsquo;s own spending series uses the Controller of Budget only, one publisher for every year, as on the <Link href={`/counties/${slug}/ledger/`}>fiscal reconciliation</Link> page, where other publishers&rsquo; figures are shown beside it. A year with no Controller of Budget figure, or with two that differ, is a gap.</li>
          <li>Comparisons with Siaya and all counties use one Controller of Budget table for each year, read the same way for all 47 counties, so the columns compare like with like. A position counts from the highest value (1 = highest); it ranks the figure, not the county government.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="an-pp">
        <h2 id="an-pp">Spending per person, in FY {pp.cpiBase} prices</h2>
        <p className="lead">Total county spending divided by the number of people, then adjusted for inflation so that years can be compared. Formula: spending (KSh) &divide; population &times; CPI(FY {pp.cpiBase}) &divide; CPI(year).</p>
        <ColumnChart labels={ppYears.map((fy) => `FY ${fy}`)} unit="KSh" yFormat="int" naText="Gap"
          series={[{ name: m.name, color: 1, values: pp.rows.map((r) => (r.gap ? null : r.real)) }, { name: 'Siaya (published Siaya analysis)', color: 2, values: ppYears.map((fy) => (syBy[fy] ? syBy[fy].real : null)) }]}
          ariaLabel={`${m.name} and Siaya: county spending per person at FY ${pp.cpiBase} prices, KSh`}
          caption={`${m.name} and Siaya: spending per person at FY ${pp.cpiBase} prices, KSh`} />
        <TableWrap label={`${m.name}: spending per person`}>
          <table className="data" id="per-person">
            <caption className="sr-only">{m.name} spending per person by fiscal year with each input and its source</caption>
            <thead><tr><th scope="col">Fiscal year</th><th scope="col">Spending (as printed)</th><th scope="col">Population</th><th scope="col">Per person, nominal (KSh)</th><th scope="col">Per person, FY {pp.cpiBase} prices (KSh)</th><th scope="col">Siaya, FY {pp.cpiBase} prices (KSh)</th><th scope="col">Inputs</th></tr></thead>
            <tbody>
              {pp.rows.map((r) => (
                <tr key={r.fy}>
                  <th scope="row">FY {r.fy}</th>
                  <td>{r.gap ? gap(r.gap) : `${r.exp_rec.printed || fmtNum(r.exp_rec.value)} ${r.exp_rec.unit}`}</td>
                  <td>{fmtNum(r.population)} ({r.population_kind === 'census' ? '2019 census count' : `projection for ${r.fy.slice(0, 4)}`})</td>
                  <td>{r.gap ? '' : fmtNum(r.nominal)}</td>
                  <td>{r.gap ? '' : <b>{fmtNum(r.real)}</b>}</td>
                  <td>{syBy[r.fy] ? fmtNum(syBy[r.fy].real) : <span className="muted">No Siaya value</span>}</td>
                  <td>
                    {r.gap ? null : <><ValueFlags label={r.exp_rec.state_label} needsCheck={r.exp_rec.needs_page_check} /><CountyCite title={r.exp_rec.source} url={r.exp_rec.url} published={r.exp_rec.published} period={`FY ${r.fy}`} unit={r.exp_rec.unit} confidence={r.exp_rec.confidence} pdf={r.exp_rec.pdf_page} printed={r.exp_rec.printed_page} table={r.exp_rec.table} read={r.exp_rec.read} /><br /></>}
                    <ValueFlags label={r.population_rec.state_label} /><CountyCite title={r.population_rec.source} url={r.population_rec.url} published={r.population_rec.published} period={r.fy.slice(0, 4)} unit="persons" confidence={r.population_rec.confidence} pdf={r.population_rec.pdf_page} printed={r.population_rec.printed_page} table={r.population_rec.table} read={r.population_rec.read} />
                    {r.gap ? null : <><br /><small>CPI FY {r.fy} = {r.cpi}, FY {pp.cpiBase} = {pp.cpiBaseValue} (<a href={pp.cpiUrl} rel="noopener">World Bank WDI</a>). Confidence of the result: {r.confidence}.</small></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <ul className="how">
          <li>The population of a calendar year is matched to the fiscal year that starts in it. {m.name}&rsquo;s figures after 2019 are KNBS projections as printed in the county statistical abstract; no year is interpolated (see <Link href={`/counties/${slug}/people/`}>population</Link>).</li>
          <li>Inflation: {pp.cpiMethod}</li>
          <li>Siaya&rsquo;s values are its published calculation of the same measure (<Link href="/counties/siaya/analysis/per-person/">Siaya: spending per person</Link>). Its population figures are projections from Siaya&rsquo;s own plans and its FY 2019/20 spending is from the county budget review, so a difference of a few hundred shillings may be the sources, not the counties.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="an-abs">
        <h2 id="an-abs">Share of the budget spent, by year</h2>
        <p className="lead">Absorption as the Controller of Budget prints it: spending as a percentage of the budget, separately for recurrent (salaries and running costs) and development (projects).</p>
        <LineChart labels={ab.map((r) => `FY ${r.fy}`)} unit="%" yFormat="int" valueFormat="one" yMaxFixed={100} naText="No Controller of Budget value"
          series={[{ name: 'Recurrent', color: 1, values: ab.map((r) => r.recurrent.value ?? null) }, { name: 'Development', color: 2, values: ab.map((r) => r.development.value ?? null) }]}
          ariaLabel={`${m.name} County recurrent and development absorption by fiscal year, Controller of Budget, per cent`}
          caption={`${m.name}: absorption by fiscal year, Controller of Budget, %`} />
        <TableWrap label={`${m.name}: absorption by year`}>
          <table className="data" id="absorption">
            <caption className="sr-only">{m.name} recurrent and development absorption by fiscal year, Controller of Budget, with source and page</caption>
            <thead><tr><th scope="col">Fiscal year</th><th scope="col">Recurrent</th><th scope="col">Development</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {ab.map((r) => (
                <tr key={r.fy}>
                  <th scope="row">FY {r.fy}</th>
                  <td>{r.recurrent.gap ? gap(r.recurrent.gap) : `${fmtFixed(r.recurrent.value, 1)}%`}</td>
                  <td>{r.development.gap ? gap(r.development.gap) : `${fmtFixed(r.development.value, 1)}%`}</td>
                  <td>{[r.recurrent, r.development].filter((x) => x.rec).slice(0, 1).map((x) => <span key="c"><ValueFlags label={x.rec.state_label} needsCheck={r.recurrent.rec && r.recurrent.rec.needs_page_check || r.development.rec && r.development.rec.needs_page_check} /><CountyCite title={x.rec.source} url={x.rec.url} published={x.rec.published} period={`FY ${r.fy}`} unit="%" confidence={Math.min(...[r.recurrent, r.development].filter((y) => y.rec).map((y) => y.rec.confidence))} pdf={x.rec.pdf_page} printed={x.rec.printed_page} table={x.rec.table} read={x.rec.read} /></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="an-47">
        <h2 id="an-47">{m.name}, Siaya and all 47 counties</h2>
        <p className="lead">Five measures from the Controller of Budget&rsquo;s all-county tables, FY {ac.years[0]} to {ac.years[ac.years.length - 1]}. &ldquo;All counties&rdquo; is the table&rsquo;s own total row. Two measures are worked out here from the table&rsquo;s amounts; their formula is given.</p>
        {ac.measures.map((x) => (
          <div key={x.key} className="an-measure">
            <h3 id={`m-${x.key}`}>{x.title}</h3>
            {x.derived ? <p className="how">Worked out: {x.formula}, from the same table row.</p> : <p className="how">As printed in the table (a whole number in some years).</p>}
            {x.key === 'osr_performance_pct' ? <p className="how">From FY 2023/24 the reports count hospital revenue (Facility Improvement Financing) in own-source revenue, so years before and after are not on the same basis: <Link href="/learn/#own-source-revenue">own-source revenue explained</Link>.</p> : null}
            <TableWrap label={`${x.title}: ${m.name}, Siaya and all counties`}>
              <table className="data">
                <caption className="sr-only">{x.title}: {m.name}, Siaya and the all-county total by fiscal year, with {m.name}&rsquo;s position among the counties with a value</caption>
                <thead><tr><th scope="col">Fiscal year</th><th scope="col">{m.name}</th><th scope="col">Siaya</th><th scope="col">All counties</th><th scope="col">{m.name}&rsquo;s position (1 = highest)</th><th scope="col">Source</th></tr></thead>
                <tbody>
                  {x.years.map((y) => (
                    <tr key={y.fy}>
                      <th scope="row">FY {y.fy}</th>
                      <td><b>{pct(y.county)}</b></td>
                      <td>{pct(y.siaya)}</td>
                      <td>{pct(y.all)}</td>
                      <td>{y.rank ? `${y.rank} of ${y.ranked}` : <span className="muted">Not ranked</span>}</td>
                      <td><CountyCite title={y.source.title} url={y.source.library_url} published={(y.source.title.match(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/) || ['not stated'])[0]} period={`FY ${y.fy}`} unit="%" confidence={3} pdf={y.county ? y.county.page : null} printed={y.county ? y.county.printed_page || null : null} table={y.county ? y.county.table : null} read="OCR (RapidOCR)" />{x.derived && y.county ? <small> {m.name}: {fmtFixed(y.county.num, 2)} &divide; {fmtFixed(y.county.den, 2)} (KSh million){y.county.den_page !== y.county.page ? `; denominator ${pageRef(y.county.den_page)}, ${y.county.den_table}` : ''}.</small> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        ))}
        <p className="how">Every value in these tables was read by OCR from scanned report pages (confidence 3) and is held for all 47 counties on <Link href="/compare/">compare counties</Link>; a blank or doubtful cell is not used. Absorption printed here can differ by a fraction from the ledger above, which reads each county&rsquo;s own section of the report.</p>
      </section>

      <section className="card" aria-labelledby="an-gaps">
        <h2 id="an-gaps">Gaps and limits</h2>
        <ul className="how">
          {ppGaps.map((r) => <li key={r.fy}>Spending per person, FY {r.fy}: {r.gap}</li>)}
          {abGaps.map((g) => <li key={g}>{g}</li>)}
          {acGaps.map((g) => <li key={g}>{g}</li>)}
          <li>No all-county spending per person is given: the all-county totals start in FY 2021/22, and the only national population held for those years is the World Bank estimate, which is on a different basis from the KNBS projections used for {m.name}; the two are not mixed.</li>
          <li>Pending bills are a stock at the end of the year and spending a flow over it; the share shows scale, not a rate of payment. Own-source revenue and pending bills by publisher are on the <Link href={`/counties/${slug}/ledger/`}>ledger</Link>.</li>
        </ul>
      </section>
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
