'use client';
// Fiscal reconciliation for /counties/siaya/ledger/: for the chosen measure, every source's value by year side by side
// (with a link to the page it was read from), then the open discrepancy cases for that measure. Nothing is averaged or
// chosen. The choice is held in memory only: nothing is stored or sent.
import { useEffect, useId, useState } from 'react';
import Reviewed from './Reviewed';
import { fmtNum } from '../lib/format';

// Case classes (data/ledger-classes.json): Takwimu's reading of what the documents print, not an editorial decision.
const CLASS_TONE = { definitional: 'good', 'period or version': 'good', 'probable source error': 'warn', 'resolved by source': 'good', unexplained: 'warn' };
const CLASS_LABEL = { definitional: 'Definitional', 'period or version': 'Period or version', 'probable source error': 'Probable source error', 'resolved by source': 'Resolved by source', unexplained: 'Unexplained' };
export function ClassBadge({ cls }) {
  return <span className={`tag ${CLASS_TONE[cls] || 'warn'}`} data-case-class={cls}>{CLASS_LABEL[cls] || cls}</span>;
}

const num = (v) => fmtNum(v, { dp: 2 });
const amount = (o) => (o.unit === 'KSh billion' ? `KSh ${num(o.value)} billion` : `KSh ${num(o.value)} million`);
const pages = (o) => `PDF p. ${o.pdf_page}${o.printed_page ? ` (printed p. ${o.printed_page})` : ''}`;

// tables: every measure's table, rendered on the server (components/LedgerTables.js ledgerTables()); stats: the
// number of values and years each one shows. This component only chooses which table is visible.
export default function LedgerView({ measures, tables, stats, cases, initial }) {
  const uid = useId();
  const [m, setM] = useState(initial);
  const measure = measures.find((x) => x.key === m);
  const open = cases.filter((c) => c.measure === m && c.status === 'open');
  // A link to one case (/counties/siaya/ledger/?case=D-L…#led-cases, e.g. from the conflict register, or #D-L…)
  // opens its measure and scrolls to it.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('case') || decodeURIComponent(window.location.hash.slice(1));
    const hit = cases.find((c) => c.id === id);
    if (!hit) return;
    setM(hit.measure);
    window.requestAnimationFrame(() => { const el = document.getElementById(id); if (el) el.scrollIntoView(); });
  }, [cases]);

  return (
    <section className="card" aria-labelledby="led-side">
      <h2 id="led-side">Every source side by side</h2>
      <div className="controls">
        <div className="field">
          <label htmlFor={`${uid}-m`}>Measure</label>
          <select id={`${uid}-m`} value={m} onChange={(e) => setM(e.target.value)} aria-describedby={`${uid}-def`}>
            {measures.map((x) => <option key={x.key} value={x.key}>{x.label} ({x.n} values)</option>)}
          </select>
          <p id={`${uid}-def`} className="hint">{measure.definition}</p>
        </div>
      </div>
      <p className="count" role="status" aria-live="polite" id="led-count">{measure.label}: {stats[m].values} values in {stats[m].years} years; {open.length} open discrepancy cases</p>
      {/* Every measure is in the page, the others hidden until chosen, so every value, correction footnote and
          source-error flag is in the static HTML (scripts/test-corrections.js). The chosen one is #led-table. */}
      {measures.map((x) => <div key={x.key} id={x.key === m ? 'led-table' : undefined} hidden={x.key !== m} data-measure={x.key}>{tables[x.key]}</div>)}

      <h3 id="led-cases">Open discrepancy cases: {measure.label}</h3>
      {open.length ? (
        <ol className="ds-list" id="led-case-list">
          {open.map((c) => (
            <li key={c.id} className="ds" id={c.id}>
              <h4>{c.period}: {c.withheld ? 'amounts withheld' : <>{num(c.a_m)} against {num(c.b_m)} (KSh million)</>} <ClassBadge cls={c.cls} /></h4>
              <dl>
                <dt>Claim A</dt><dd><Reviewed b={c.a.review}>{() => amount(c.a)}</Reviewed>, <a href={c.a.url} rel="noopener">{c.a.source}</a>, {pages(c.a)}{c.a.printed ? <> (printed: &ldquo;{c.a.printed}&rdquo;)</> : null}</dd>
                <dt>Claim B</dt><dd><Reviewed b={c.b.review}>{() => amount(c.b)}</Reviewed>, <a href={c.b.url} rel="noopener">{c.b.source}</a>, {pages(c.b)}{c.b.printed ? <> (printed: &ldquo;{c.b.printed}&rdquo;)</> : null}</dd>
                <dt>Difference</dt><dd>{c.withheld ? `Withheld: ${c.withheld.reason}` : <>KSh {num(c.diff)} million, {num(c.pct)} per cent of the smaller value</>}</dd>
                <dt>Possible basis mismatch</dt><dd><ul className="plain">{c.basis.map((b) => <li key={b}>{b}</li>)}</ul></dd>
                <dt>Class</dt><dd><ClassBadge cls={c.cls} /> {c.cls_reason} <small className="cite">Evidence: {c.cls_evidence.join('; ')}</small></dd>
                {c.curated && c.curated.length ? <><dt>Curated register</dt><dd>Also explained as {c.curated.map((id, i) => <span key={id}>{i ? ', ' : ''}case <a href={`/data/#${id}`}>{id}</a></span>)} in the conflict register.</dd></> : null}
                <dt>Status</dt><dd>{c.cls === 'resolved by source' ? 'Settled by the printed source; not yet reviewed. Both values stand as printed.' : 'Open, not yet reviewed. Both values stand.'}</dd>
              </dl>
            </li>
          ))}
        </ol>
      ) : <p>No open case for this measure: where more than one source gives a value, they agree within the threshold.</p>}
    </section>
  );
}
