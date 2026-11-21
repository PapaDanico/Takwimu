// Server-rendered table of published values for the Siaya topic pages: every row shows its value, unit, period,
// source (linked), table, page and confidence. Rows are plain objects; `source_id` is resolved with lib/siaya-sources.
import TableWrap from './TableWrap';
import { source, pageRef } from '../lib/siaya-sources';
import { review, counts, countsSentence } from '../lib/review-status';

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

// Value cell. With `dataset` (a data file stem in lib/review-status.js) and a row key equal to the observation id, a
// review record in force changes what is shown: approved adds the "Approved" tag (only then), rejected hides the
// value and shows the rationale, disputed links the conflict register. Without a record nothing changes.
function ValueCell({ r, dataset }) {
  const rv = dataset ? review(dataset, r.key) : null;
  if (rv && rv.fromRecord && rv.hide) return <td data-review="rejected" data-record={`${dataset}:${r.key}`}><span className="muted">{rv.label}: {rv.reason}</span></td>;
  const shown = r.value === null || r.value === undefined ? <span className="muted">{r.value_text || 'not printed'}</span> : <>{num(r.value)}{r.unit ? ` ${r.unit}` : ''}</>;
  if (!rv || !rv.fromRecord) return <td>{shown}</td>;
  if (rv.approved) return <td>{shown} <span className="tag good" data-review="approved" data-record={`${dataset}:${r.key}`}>{rv.label}</span></td>;
  if (rv.href) return <td>{shown} <a className="tag warn" href={rv.href} data-review="disputed" data-record={`${dataset}:${r.key}`}>{rv.label}</a></td>;
  return <td>{shown} <span className="tag warn" data-review={rv.state.toLowerCase()} data-record={`${dataset}:${r.key}`}>{rv.label}</span></td>;
}

// rows: [{ key, label, value, value_text, unit, period, source_id, table, pdf_page, printed_page, page_note, confidence, note, tag }]
export default function ObsTable({ caption, rows, id, labelHead = 'Measure', showNote = true, dataset }) {
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
              <ValueCell r={r} dataset={dataset} />
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

// Page label. The provisional tag stays while any value is pending; with `dataset` the review counts follow.
export function ReviewCounts({ dataset }) {
  const c = counts(dataset);
  return <small className="review-counts" data-review-counts={dataset}> {countsSentence(c)}</small>;
}
export function Provisional({ children, dataset }) {
  const c = dataset ? counts(dataset) : null;
  return (
    <p className="provisional">
      {!c || c.pending > 0 ? <span className="tag warn">Provisional: awaiting editorial review</span> : null} {children}
      {dataset ? <ReviewCounts dataset={dataset} /> : null}
    </p>
  );
}
