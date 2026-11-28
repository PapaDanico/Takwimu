// Server-rendered tables for /counties/siaya/ledger/: one table per measure, every source's value by fiscal year with
// the page it was read from. The page renders all of them here and hands them to components/LedgerView.js (client),
// which only chooses which one is visible; the values are therefore in the static HTML once, and the client payload
// carries the rendered tables instead of the ledger data plus a second copy of each table.
import TableWrap from './TableWrap';
import Reviewed from './Reviewed';
import SourceErrorFlag, { MachineTag } from './SourceErrorFlag';
import { fmtNum } from '../lib/format';
import CorrectionNote, { CorrectionMark } from './CorrectionNote';

const num = (v) => fmtNum(v, { dp: 2 });
const amount = (o) => (o.unit === 'KSh billion' ? `KSh ${num(o.value)} billion` : `KSh ${num(o.value)} million`);
const pages = (o) => `PDF p. ${o.pdf_page}${o.printed_page ? ` (printed p. ${o.printed_page})` : ''}`;

// Labels each value carries on a county page from the registry (lib/county-pages.js): the public review label,
// a disputed value's link to the side-by-side case, and a visible "needs page check". Siaya's values do not carry
// state_label, so its tables are unchanged.
export function CountyFlags({ o }) {
  return (
    <small className="county-flags">
      {' '}<span className="tag warn" data-review-label>{o.state_label}</span>
      {o.disputed ? <> <a className="tag warn" href={o.conflictHref} data-disputed>Disputed: both values shown</a></> : null}
      {o.needs_page_check ? <> <span className="tag warn" data-needs-page-check>Needs page check</span></> : null}
    </small>
  );
}

// One value. A value withheld after editorial review takes its correction footnote with it.
function Value({ o }) {
  return (
    <div className="lv">
      <Reviewed b={o.review}>{() => <><b>{amount(o)}</b><CorrectionMark notes={o.cor} /></>}</Reviewed>{o.machine ? <> <MachineTag m={o.machine} /></> : null}
      {o.state_label ? <CountyFlags o={o} /> : null}
      <small className="cite"> <a href={o.url} rel="noopener">{o.source}</a>, {pages(o)}{o.table ? `, ${o.table}` : ''}. {o.read}, confidence {o.confidence}.{o.state_label ? ` Published ${o.published}; period ${o.period}; unit ${o.unit}.` : ''}</small>
      {o.version ? <small> Budget version: {o.version}.</small> : null}
      {o.basis ? <small> Basis: {o.basis}.</small> : null}
      {o.as_at ? <small> Stock at {o.as_at}; scope {o.scope || 'not stated'}; accounting basis {o.accounting_basis}.</small> : null}
      <SourceErrorFlag e={o.source_error} id={o.id} refId={`${o.refDataset || 'siaya-fiscal-ledger'}:${o.id}`} />
      <CorrectionNote notes={o.cor} b={o.review} />
    </div>
  );
}

export const measureRows = (values, key) => values[key].filter((r) => r.byKind.some((k) => k.length));

export function MeasureTable({ measure, values, kinds }) {
  const rows = measureRows(values, measure.key);
  const used = kinds.map((k, i) => ({ ...k, i })).filter((k) => rows.some((r) => r.byKind[k.i].length));
  return (
    <TableWrap label={`${measure.label}: values by source and year`}>
      <table className="data">
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
  );
}

// The fields of a case claim that the client lists (components/LedgerView.js), not the whole observation.
const claim = (o) => ({ review: o.review, value: o.value, unit: o.unit, url: o.url, source: o.source, pdf_page: o.pdf_page, printed_page: o.printed_page, printed: o.printed });

// Props for components/LedgerView.js: every measure's table, keyed by measure; the counts the client states for the
// chosen one; and the cases with only what the client lists.
export function ledgerTables({ measures, kinds, values, cases }) {
  const tables = Object.fromEntries(measures.map((m) => [m.key, <MeasureTable key={m.key} measure={m} values={values} kinds={kinds} />]));
  const stats = Object.fromEntries(measures.map((m) => { const rows = measureRows(values, m.key); return [m.key, { values: rows.reduce((s, r) => s + r.byKind.flat().length, 0), years: rows.length }]; }));
  return { tables, stats, cases: cases.map((c) => ({ ...c, a: claim(c.a), b: claim(c.b) })) };
}
