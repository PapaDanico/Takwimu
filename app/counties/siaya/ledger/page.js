import { Provisional } from '../../../../components/ObsTable';
import Abbrs from '../../../components/Abbrs';
import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import LedgerView from '../../../../components/LedgerView';
import { ledger } from '../../../../lib/ledger';
import { plainDeep } from '../../../../lib/plain';
import OsrLedger, { OSR_TOC } from '../../../../components/siaya/OsrLedger';

export const metadata = {
  title: 'Fiscal reconciliation',
  description: 'Siaya County fiscal figures from the Controller of Budget, the County Government, the Auditor-General and the Senate, side by side by year with page links, FY 2013/14 to FY 2025/26: which values exist, and where the sources differ.',
};

// Reader wording (own-source revenue, share of budget spent) for text from the data file; values unchanged.
const l = plainDeep(ledger());
const sup = (i) => <sup><a href={`#gap-${i + 1}`} aria-label={`reason ${i + 1}`}>{i + 1}</a></sup>;

export default function SiayaLedger() {
  const openByMeasure = l.measures.map((m) => ({ ...m, open: l.cases.filter((c) => c.measure === m.key && c.status === 'open').length }));
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Reconciliation" title="Fiscal reconciliation"
        sub="Siaya County’s budget, revenue, spending, pending bills and wage bill as each official source reports them, side by side, so that you can see where the documents agree and where they differ."
        path="/counties/siaya/ledger/" shareText="Siaya: fiscal figures from every source, side by side" />
      <Abbrs list={['FIF', 'A-i-A']} />

      <section className="card gold" aria-labelledby="led-read">
        <h2 id="led-read">How to read this page</h2>
        <Provisional dataset="siaya-fiscal-ledger">Values were transcribed by Takwimu from the documents and have not yet been checked by a reviewer.</Provisional>
        <p id="why-differ"><b>Why the figures differ.</b> Official documents often give different figures for the same year because they describe different things: an original or a supplementary budget, a full year or part of one, own-source revenue with or without hospital income (FIF) and other appropriations-in-aid (A-i-A), and money counted when it moves (cash) or when it is owed (accrual). A difference is therefore a question to put to the documents, not evidence that any figure is wrong.</p>
        <ul className="how">
          <li id="no-averaging"><b>No averaging and no verdicts.</b> Every value is shown as its source printed it, with the page it was read from. None is averaged, preferred or corrected here, and a missing value is never shown as zero.</li>
          <li>A discrepancy case is any pair of values for the same measure and year that differ by more than {l.threshold} per cent of the smaller one. Every case is open: none has yet been reviewed by a specialist.</li>
          <li>Values are in KSh million unless marked as KSh billion (figures reused from the ten-year series keep the unit of that series).</li>
        </ul>
      </section>

      <nav aria-label="Sections on this page"><ul className="toc">
        {OSR_TOC.map(([id, t]) => <li key={id}><a href={`#${id}`}>Own-source revenue: {t}</a></li>)}
        <li><a href="#led-comp">Completeness</a></li><li><a href="#led-sum">Open cases</a></li><li><a href="#led-cav">Not used</a></li>
      </ul></nav>

      <OsrLedger />

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

      <LedgerView measures={l.measures} kinds={l.kinds} values={l.values} cases={l.cases} initial="osr_total_actual" />

      <section className="card" aria-labelledby="led-sum">
        <h2 id="led-sum">Open discrepancy cases by measure</h2>
        <TableWrap label="Open discrepancy cases by measure">
          <table className="data" id="case-summary">
            <caption className="sr-only">Number of values and open discrepancy cases for each measure</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">Values held</th><th scope="col">Open cases</th></tr></thead>
            <tbody>{openByMeasure.map((m) => <tr key={m.key}><th scope="row">{m.label}</th><td>{m.n}</td><td>{m.open}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">All measures</th><td>{openByMeasure.reduce((s, m) => s + m.n, 0)}</td><td>{openByMeasure.reduce((s, m) => s + m.open, 0)}</td></tr></tfoot>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="led-cav">
        <h2 id="led-cav">Not used, and where to find the data</h2>
        <ul className="how">{l.meta.not_used.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="src">Every value, with its source, pages, reading method and confidence, is in the <Link href="/datasets/?q=siaya-fiscal-ledger">dataset catalogue</Link> and in <a href="/data/siaya-fiscal-ledger.json">siaya-fiscal-ledger.json</a>. Disagreements already on the ten-year series are in the <Link href="/data/#conflicts">conflict register</Link>. See also <Link href="/counties/siaya/audits/">audit findings</Link> and the <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
