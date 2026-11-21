// Server-rendered table of published values for the Siaya topic pages: every row shows its value, unit, period,
// source (linked), table, page and confidence. Rows are plain objects; `source_id` is resolved with lib/siaya-sources.
import TableWrap from './TableWrap';
import { source, pageRef } from '../lib/siaya-sources';

const num = (v) => (typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 3 }) : v);

export function Cite({ id, table, page, printed, pageNote, confidence }) {
  const s = source(id);
  return (
    <small className="cite">
      {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}
      {table ? `, ${table}` : ''}, {pageRef(page, printed, pageNote)}{confidence ? `, confidence ${confidence} of 5` : ''}
    </small>
  );
}

// rows: [{ key, label, value, value_text, unit, period, source_id, table, pdf_page, printed_page, page_note, confidence, note, tag }]
export default function ObsTable({ caption, rows, id, labelHead = 'Measure', showNote = true }) {
  return (
    <TableWrap label={caption}>
      <table className="data obs" id={id}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr><th scope="col">{labelHead}</th><th scope="col">Value</th><th scope="col">Period</th><th scope="col">Source, page and confidence</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.label}{r.tag ? <> <span className={`tag ${r.tagTone || 'warn'}`}>{r.tag}</span></> : null}</th>
              <td>{r.value === null || r.value === undefined ? <span className="muted">{r.value_text || 'not printed'}</span> : <>{num(r.value)}{r.unit ? ` ${r.unit}` : ''}</>}</td>
              <td>{r.period}</td>
              <td>
                <Cite id={r.source_id} table={r.table} page={r.pdf_page} printed={r.printed_page} pageNote={r.page_note} confidence={r.confidence} />
                {showNote && r.note ? <><br /><small>{r.note}</small></> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function Provisional({ children }) {
  return <p className="provisional"><span className="tag warn">Provisional: awaiting editorial review</span> {children}</p>;
}
