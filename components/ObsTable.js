// Server-rendered table of published values for the Siaya topic pages: every row shows its value, unit, period,
// source (linked), table, page and confidence. Rows are plain objects; `source_id` is resolved with lib/siaya-sources.
import TableWrap from './TableWrap';
import { source, pageRef } from '../lib/siaya-sources';
import { badge, counts, countsSentence, isProvisional } from '../lib/review-status';
import Reviewed from './Reviewed';
import SourceErrorFlag, { MachineTag } from './SourceErrorFlag';
import { machineBadge } from '../lib/machine-badge';

const num = (v) => (typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 3 }) : v);

export function Cite({ id, table, page, printed, pageNote, confidence, bare }) {
  const s = source(id);
  // bare: the table states the source once (owner decision U3), so the row carries only its page and confidence.
  if (bare) return <small className="cite">{table ? `${table}, ` : ''}{pageRef(page, printed, pageNote)}{confidence ? `, confidence ${confidence} of 5` : ''}</small>;
  return (
    <small className="cite">
      {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}
      {table ? `, ${table}` : ''}, {pageRef(page, printed, pageNote)}{confidence ? `, confidence ${confidence} of 5` : ''}
    </small>
  );
}

// Value cell. With `dataset` (a data file stem in lib/review-status.js) and a row key equal to the observation id, a
// review record in force changes what is shown (components/Reviewed.js): approved adds the "Approved" tag (only then),
// rejected hides the value and shows the rationale, disputed links the conflict register. Without a record nothing
// changes. Pages pass rows from masked(dataset), so a rejected value is already null here.
function ValueCell({ r, dataset }) {
  const b = dataset ? badge(dataset, r.key) : null;
  return (
    <Reviewed b={b} as="td">
      {() => (r.value === null || r.value === undefined ? <span className="muted">{r.value_text || 'not printed'}</span> : <>{num(r.value)}{r.unit ? ` ${r.unit}` : ''}{dataset && machineBadge(dataset, r.key) ? <> <MachineTag m={machineBadge(dataset, r.key)} /></> : null}</>)}
    </Reviewed>
  );
}

// rows: [{ key, label, value, value_text, unit, period, source_id, table, pdf_page, printed_page, page_note, confidence, note, tag }]
export default function ObsTable({ caption, rows, id, labelHead = 'Measure', showNote = true, dataset }) {
  // Said once per table, not on every row (owner decision U3): a source, table or note shared by every row.
  const one = (k) => (rows.length > 2 && rows.every((r) => r[k] === rows[0][k]) ? rows[0][k] : undefined);
  const src = one('source_id');
  const tbl = src ? one('table') : undefined;
  const note = showNote ? one('note') : undefined;
  const s = src ? source(src) : null;
  return (
    <TableWrap label={caption}>
      <table className="data obs" id={id}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr><th scope="col">{labelHead}</th><th scope="col">Value</th><th scope="col">Period</th><th scope="col">{src ? 'Page and confidence' : 'Source, page and confidence'}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.label}{r.tag ? <> <span className={`tag ${r.tagTone || 'warn'}`}>{r.tag}</span></> : null}</th>
              <ValueCell r={r} dataset={dataset} />
              <td>{r.period}</td>
              <td>
                <Cite id={r.source_id} table={tbl ? undefined : r.table} page={r.pdf_page} printed={r.printed_page} pageNote={r.page_note} confidence={r.confidence} bare={Boolean(src)} />
                {showNote && r.note && !note ? <><br /><small>{r.note}</small></> : null}
                <SourceErrorFlag e={r.source_error} id={r.key} />
              </td>
            </tr>
          ))}
        </tbody>
        {src ? (
          <tfoot><tr><td colSpan={4}><small className="cite">Source for every row: {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}{tbl ? `, ${tbl}` : ''}.{note ? ` ${note}` : ''}</small></td></tr></tfoot>
        ) : null}
      </table>
    </TableWrap>
  );
}

// Page label. The provisional tag stays until every value is approved (lib/review-status.js isProvisional); with
// `dataset` the review counts follow.
// `dataset` may be one dataset id or a list (a page that shows values from several); a list's counts are summed.
const countsOf = (dataset) => [].concat(dataset).map((d) => counts(d)).reduce((a, c) => Object.fromEntries(Object.keys(c).map((k) => [k, (a[k] || 0) + c[k]])), {});
export function ReviewCounts({ dataset }) {
  const c = countsOf(dataset);
  return <small className="review-counts" data-review-counts={[].concat(dataset).join(' ')}> {countsSentence(c)}</small>;
}
export function Provisional({ children, dataset }) {
  const c = dataset ? countsOf(dataset) : null;
  return (
    <p className="provisional">
      {isProvisional(c) ? <span className="tag warn">Provisional: awaiting editorial review</span> : null} {children}
      {dataset ? <ReviewCounts dataset={dataset} /> : null}
    </p>
  );
}
