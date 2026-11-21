'use client';
// Fiscal reconciliation for /counties/siaya/ledger/: for the chosen measure, every source's value by year side by side
// (with a link to the page it was read from), then the open discrepancy cases for that measure. Nothing is averaged or
// chosen. The choice is held in memory only: nothing is stored or sent.
import { useId, useState } from 'react';
import TableWrap from './TableWrap';

const num = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
const amount = (o) => (o.unit === 'KSh billion' ? `KSh ${num(o.value)} billion` : `KSh ${num(o.value)} million`);
const pages = (o) => `PDF p. ${o.pdf_page}${o.printed_page ? ` (printed p. ${o.printed_page})` : ''}`;

function Value({ o }) {
  return (
    <div className="lv">
      <b>{amount(o)}</b>
      <small className="cite"> <a href={o.url} rel="noopener">{o.source}</a>, {pages(o)}{o.table ? `, ${o.table}` : ''}. {o.read}, confidence {o.confidence}.</small>
      {o.version ? <small> Budget version: {o.version}.</small> : null}
      {o.basis ? <small> Basis: {o.basis}.</small> : null}
    </div>
  );
}

export default function LedgerView({ measures, kinds, values, cases, initial }) {
  const uid = useId();
  const [m, setM] = useState(initial);
  const measure = measures.find((x) => x.key === m);
  const rows = values[m].filter((r) => r.byKind.some((k) => k.length));
  const used = kinds.map((k, i) => ({ ...k, i })).filter((k) => rows.some((r) => r.byKind[k.i].length));
  const open = cases.filter((c) => c.measure === m && c.status === 'open');

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
      <p className="count" role="status" aria-live="polite" id="led-count">{measure.label}: {rows.reduce((s, r) => s + r.byKind.flat().length, 0)} values in {rows.length} years; {open.length} open discrepancy cases</p>
      <TableWrap label={`${measure.label}: values by source and year`}>
        <table className="data" id="led-table">
          <caption className="sr-only">{measure.label}: every source&rsquo;s value by fiscal year, as printed, with the page it was read from</caption>
          <thead><tr><th scope="col">Fiscal year</th>{used.map((k) => <th key={k.key} scope="col">{k.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.fy}>
                <th scope="row">FY {r.fy}</th>
                {used.map((k) => <td key={k.key}>{r.byKind[k.i].length ? r.byKind[k.i].map((o) => <Value key={o.id} o={o} />) : <span className="muted">None held</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <h3 id="led-cases">Open discrepancy cases: {measure.label}</h3>
      {open.length ? (
        <ol className="ds-list" id="led-case-list">
          {open.map((c) => (
            <li key={c.id} className="ds" id={c.id}>
              <h4>{c.period}: {num(c.a_m)} against {num(c.b_m)} (KSh million)</h4>
              <dl>
                <dt>Claim A</dt><dd>{amount(c.a)}, <a href={c.a.url} rel="noopener">{c.a.source}</a>, {pages(c.a)}{c.a.printed ? <> (printed: &ldquo;{c.a.printed}&rdquo;)</> : null}</dd>
                <dt>Claim B</dt><dd>{amount(c.b)}, <a href={c.b.url} rel="noopener">{c.b.source}</a>, {pages(c.b)}{c.b.printed ? <> (printed: &ldquo;{c.b.printed}&rdquo;)</> : null}</dd>
                <dt>Difference</dt><dd>KSh {num(c.diff)} million, {num(c.pct)} per cent of the smaller value</dd>
                <dt>Possible basis mismatch</dt><dd><ul className="plain">{c.basis.map((b) => <li key={b}>{b}</li>)}</ul></dd>
                <dt>Status</dt><dd>Open, not yet reviewed. Both values stand.</dd>
              </dl>
            </li>
          ))}
        </ol>
      ) : <p>No open case for this measure: where more than one source gives a value, they agree within the threshold.</p>}
    </section>
  );
}
