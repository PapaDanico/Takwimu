import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import LedgerView from '../../../../components/LedgerView';
import { ledgerTables } from '../../../../components/LedgerTables';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import { paramsFor } from '../../../../components/county/params';
import { fmtNum } from '../../../../lib/format';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('ledger');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  const l = cp.ledger(params.slug);
  return { title: `${m.name}: fiscal reconciliation`, description: `${m.name} County fiscal figures from the Controller of Budget, the County Treasury and the Auditor-General, side by side by year with page links, FY ${l.years[0]} to FY ${l.years[l.years.length - 1]}: which values exist, and where the sources differ.` };
}

const sup = (i) => <sup><a href={`#gap-${i + 1}`} aria-label={`reason ${i + 1}`}>{i + 1}</a></sup>;

export default function CountyLedger({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const l = cp.ledger(slug);
  const reg = cp.conflicts(slug);
  const openByMeasure = l.measures.map((x) => ({ ...x, open: l.cases.filter((c) => c.measure === x.key && c.status === 'open').length }));
  const initial = l.measures.find((x) => x.key === 'osr_total_actual') ? 'osr_total_actual' : l.measures[0].key;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Reconciliation" title="Fiscal reconciliation"
        sub={`${m.name} County's budget, revenue, spending, pending bills and wage bill as each official source reports them, side by side, so that you can see where the documents agree and where they differ.`}
        path={`/counties/${slug}/ledger/`} shareText={`${m.name}: fiscal figures from every source, side by side`} />

      <section className="card gold" aria-labelledby="led-read">
        <h2 id="led-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={[l.dataset]} />
        <p><b>Why the figures differ.</b> Official documents often give different figures for the same year because they describe different things: an original or a supplementary budget, a full year or part of one, own-source revenue with or without hospital income (Facility Improvement Financing, FIF) and other appropriations-in-aid, and money counted when it moves (cash) or when it is owed (accrual). A difference is a question to put to the documents, not evidence that any figure is wrong.</p>
        <ul className="how">
          <li><b>No averaging and no verdicts.</b> Every value is shown as its source printed it, with the page it was read from. None is averaged, preferred or corrected here, and a missing value is never shown as zero.</li>
          <li>A discrepancy case is any pair of values for the same measure and year that differ by more than {l.threshold} per cent of the smaller one. Every case stays open until a specialist reviews it.</li>
          <li>Each value is labelled with its review state, and &ldquo;Needs page check&rdquo; where it was read by machine from a scan and not yet compared with the page image. &ldquo;Machine cross-checked&rdquo; means a second machine reading found the same figure on the page; it is not editorial review.</li>
          <li>Own-source revenue, FIF and appropriations-in-aid are counted differently by each publisher: see <Link href="/learn/#own-source-revenue">own-source revenue, FIF and A-i-A explained</Link>.</li>
          <li>Values are in KSh million unless marked as KSh billion.</li>
        </ul>
      </section>

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#led-comp">Completeness</a></li><li><a href="#led-side">Every source side by side</a></li><li><a href="#conflicts">Explained conflicts</a></li><li><a href="#led-sum">Open cases</a></li><li><a href="#led-cav">Not used</a></li>
      </ul></nav>

      <section className="card" aria-labelledby="led-comp">
        <h2 id="led-comp">Which values exist: completeness by measure and year</h2>
        <p className="lead">Each cell gives the number of values held and, in brackets, the number of documents they come from. A dash means no value is held; the number beside it gives the reason, listed under the table.</p>
        <TableWrap label="Completeness matrix: values held by measure and year">
          <table className="data cm" id="completeness">
            <caption className="sr-only">Number of values held (and number of source documents) for each measure and fiscal year; a dash marks a gap</caption>
            <thead><tr><th scope="col">Measure</th>{l.years.map((fy) => <th key={fy} scope="col">{fy}</th>)}</tr></thead>
            <tbody>
              {l.completeness.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.label}</th>
                  {r.cells.map((c) => <td key={c.fy}>{c.missing ? <><span aria-label="no value">–</span>{sup(c.reason)}</> : `${c.n} (${c.sources})`}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <h3 id="gap-reasons">Why values are missing</h3>
        <ol className="how">{l.reasons.map((r, i) => <li key={r} id={`gap-${i + 1}`}>{r}</li>)}</ol>
      </section>

      <LedgerView measures={l.measures} {...ledgerTables(l)} initial={initial} curatedBase={`/counties/${slug}/ledger/#`} unclassed />

      <section className="card" aria-labelledby="conflicts-h" id="conflicts">
        <h2 id="conflicts-h">Explained conflicts: both values side by side</h2>
        <p className="lead">{reg.length} cases where an editor has set out what each document measures and a possible explanation. The explanation is a hypothesis to test against the documents, not a finding; both values stand.</p>
        <ol className="ds-list">
          {reg.map((c) => (
            <li key={c.id} className="ds" id={c.id}>
              <h3>{c.measure}</h3>
              <TableWrap label={`${c.measure}: values by source`}>
                <table className="data">
                  <caption className="sr-only">{c.measure}: each source&rsquo;s value as printed</caption>
                  <thead><tr><th scope="col">Source and page</th><th scope="col">Value ({c.unit})</th></tr></thead>
                  <tbody>{c.values.map((v) => <tr key={v.label}><th scope="row">{v.url ? <a href={v.url} rel="noopener">{v.label}</a> : v.label}</th><td>{v.value == null ? <span className="muted">Not printed</span> : fmtNum(v.value, { dp: 2 })}</td></tr>)}</tbody>
                </table>
              </TableWrap>
              <dl>
                <dt>What each measures</dt><dd>{c.definitions}</dd>
                <dt>Possible explanation</dt><dd>{c.hypothesis}</dd>
                <dt>Status</dt><dd>{c.status === 'open' ? 'Open, not yet reviewed. Both values stand.' : c.status}{c.page_image_checked ? '' : ' Page images not yet checked.'}{c.ledger_cases.length ? <> Ledger case{c.ledger_cases.length > 1 ? 's' : ''}: {c.ledger_cases.join(', ')}.</> : null}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="led-sum">
        <h2 id="led-sum">Open discrepancy cases by measure</h2>
        <TableWrap label="Open discrepancy cases by measure">
          <table className="data" id="case-summary">
            <caption className="sr-only">Number of values and open discrepancy cases for each measure</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">Values held</th><th scope="col">Open cases</th></tr></thead>
            <tbody>{openByMeasure.map((x) => <tr key={x.key}><th scope="row">{x.label}</th><td>{x.n}</td><td>{x.open}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">All measures</th><td>{openByMeasure.reduce((s, x) => s + x.n, 0)}</td><td>{openByMeasure.reduce((s, x) => s + x.open, 0)}</td></tr></tfoot>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="led-cav">
        <h2 id="led-cav">Not used</h2>
        <ul className="how">{l.meta.not_used.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="src">Every document cited here, with its link and hash, is on the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link> page. See also <Link href={`/counties/${slug}/audits/`}>audit opinions</Link> and the <Link href={`/counties/${slug}/`}>{m.name} County hub</Link>.</p>
      </section>
    </main>
  );
}
