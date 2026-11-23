import Link from 'next/link';
import OsrNote from '../../components/OsrNote';
import PageHead from '../../components/PageHead';
import TableWrap from '../../components/TableWrap';
import { Provisional } from '../../components/ObsTable';
import { corrections, sourceErrors, registerSourceErrors, corrLog } from '../../lib/editorial';

export const metadata = {
  title: 'Corrections',
  description: 'Every correction Takwimu Kenya has made to a published figure, label or citation, with the original, the corrected figure, the reason, the evidence and the pages affected; and, separately, errors found in the original source documents, which are kept as published.',
};

// Generated from data/conflicts.json (resolved cases that are our corrections, and those that are source errors), the
// data corrections log (data/corrections.json) and every record that carries a source_error field.
// scripts/test-corrections.js checks that each one appears here and that every value changed since the previous
// release has an entry.
const COR = corrections();
const SE = sourceErrors();
const SE_CASES = registerSourceErrors();
const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function Corrections() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Corrections" title="Corrections register" sub="When we get something wrong, we correct it in the open: what the figure was, what it is now, why, and the page of the document that shows it. Errors in the official documents themselves are listed separately; we keep those figures as published." path="/corrections/" shareText="Takwimu Kenya corrections register" />
      <Provisional dataset={['siaya-fiscal-ledger', 'siaya-health', 'history']}>Corrected figures, like every figure on the site, were read by Takwimu and are awaiting checking by an independent reviewer.</Provisional>
      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#ours">Our corrections</a></li><li><a href="#source-errors">Source errors</a></li><li><a href="#how">How corrections work</a></li><li><a href="#log">Data corrections log</a></li>
      </ul></nav>

      <section className="card" id="ours" aria-labelledby="ours-h">
        <h2 id="ours-h">Our corrections ({COR.length})</h2>
        <p className="lead">Each row is a change Takwimu made after finding that our own reading, label or citation was wrong. The original wording is kept in the <Link href="/data/#conflicts">conflict register</Link> case named in the row.</p>
        <TableWrap label="Corrections made by Takwimu">
          <table className="data" id="corrections-table">
            <caption className="sr-only">Corrections made by Takwimu: original and corrected figure, reason, evidence, date and pages affected</caption>
            <thead><tr><th scope="col">What</th><th scope="col">Original</th><th scope="col">Corrected</th><th scope="col">Reason and evidence</th><th scope="col">Date</th><th scope="col">Pages affected</th></tr></thead>
            <tbody>
              {COR.map((c) => (
                <tr key={c.id} id={`cor-${c.id}`}>
                  <th scope="row">{c.measure}{c.case_href ? <><br /><small><a href={c.case_href}>Case {c.id}</a></small></> : <><br /><small>{c.id}</small></>}</th>
                  <td>{c.original}</td>
                  <td>{c.corrected}</td>
                  <td>{c.reason}<br /><small className="cite">Evidence: {c.evidence}</small></td>
                  <td className="mono">{day(c.date)}</td>
                  <td>{c.affected_pages.map((p, i) => <span key={p}>{i ? ', ' : ''}<a href={p}>{p}</a></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" id="source-errors" aria-labelledby="se-h">
        <h2 id="se-h">Source errors in the original documents ({SE.length + SE_CASES.length})</h2>
        <p className="lead">These are errors in the official documents, not ours: an impossible date, or two figures for the same thing that the document does not reconcile. We keep each value exactly as the document publishes it and mark it &ldquo;Source error in original&rdquo; wherever it is shown, quoting the text. We are not correcting the publisher; a reader may wish to ask the publisher about it.</p>
        <TableWrap label="Errors in the original source documents">
          <table className="data" id="source-errors-table">
            <caption className="sr-only">Source-document errors: the record, the value as published, the original text, the page and the issue</caption>
            <thead><tr><th scope="col">Record</th><th scope="col">Value as published</th><th scope="col">Original text</th><th scope="col">Issue</th><th scope="col">Shown on</th></tr></thead>
            <tbody>
              {SE.map((s) => (
                <tr key={`${s.dataset}:${s.record}`} data-source-error={`${s.dataset}:${s.record}`}>
                  <th scope="row">{s.label}<br /><small><code>{s.dataset} {s.record}</code></small></th>
                  <td className="mono">{s.value}</td>
                  <td><span className="tag warn">Source error in original</span> &ldquo;{s.quote}&rdquo;<br /><small className="cite">{s.url ? <a href={s.url} rel="noopener">{s.source}</a> : s.source}, PDF p. {s.page}{s.printed_page ? ` (printed p. ${s.printed_page})` : ''}</small></td>
                  <td>{s.issue}</td>
                  <td>{s.pages.map((p, i) => <span key={p}>{i ? ', ' : ''}<a href={p}>{p}</a></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <h3 className="mini">Register cases settled as source errors</h3>
        <ul className="how">
          {SE_CASES.map((c) => <li key={c.id} id={`se-${c.id}`}><b>{c.measure}.</b> {c.definitions} <a href={`/data/#${c.id}`}>Case {c.id}</a>.</li>)}
        </ul>
      </section>

      <section className="card" id="how" aria-labelledby="how-h">
        <h2 id="how-h">How corrections work</h2>
        <ul className="how">
          <li><b>Nothing is changed silently.</b> Every value in this release is compared by the build with the previous release&apos;s data; a value that changed without an entry here stops the release.</li>
          <li><b>Our errors and theirs are kept apart.</b> When our reading was wrong we correct it and list it above. When the document itself is wrong we keep its figure and say so; we never substitute our own figure for a published one.</li>
          <li><b>Evidence first.</b> Each correction names the document and page that settles it. Where two official sources simply disagree, nothing is corrected: both stay, side by side, in the <Link href="/data/#conflicts">conflict register</Link> and the <Link href="/counties/siaya/ledger/">fiscal reconciliation</Link>.</li>
          <li><b>Spotted something?</b> Use &ldquo;Report an error&rdquo; in the footer. How we check figures is on the <Link href="/method/">method page</Link>.</li>
        </ul>
      </section>

      <section className="card" id="log" aria-labelledby="log-h">
        <h2 id="log-h">Data corrections log</h2>
        <p>{corrLog.entries.length ? `${corrLog.entries.length} entries outside the conflict register are included in the table above.` : 'No correction outside the conflict register has been made since the previous release.'} The log is <a href="/data/corrections.json">corrections.json</a>; the register is <a href="/data/conflicts.json">conflicts.json</a>. Last updated {day(corrLog.meta.updated)}.</p>
      </section>
      <OsrNote />
    </main>
  );
}
