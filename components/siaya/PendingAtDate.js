// Pending bills at one date, every source side by side (owner item 4, 23 Nov 2026): value, publisher and document,
// publication date, page, entity scope, the date the stock refers to and its accounting basis. Nothing is chosen or
// averaged; the range is the smallest and largest value printed for the date. Server component.
import TableWrap from '../TableWrap';
import SourceErrorFlag from '../SourceErrorFlag';
import Reviewed from '../Reviewed';
import { badge } from '../../lib/review-status';
import { pendingAt, range } from '../../lib/editorial';

const m2 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DATE = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function pendingRange(fy) { const rows = pendingAt(fy); return { rows, ...range(rows) }; }

export default function PendingAtDate({ fy, id, caption, headingLevel = 3, title }) {
  const rows = pendingAt(fy);
  const { min, max } = range(rows);
  const H = `h${headingLevel}`;
  return (
    <div id={id} className="pending-at-date">
      {title ? <H id={`${id}-h`}>{title}</H> : null}
      <p className="chart-sub">{rows.length} values for the stock at the end of FY {fy}, from KSh {m2(min)} million to KSh {m2(max)} million. They differ in scope (County Executive alone or with the Assembly), in whether bills of the year are included, and in date (30 June, or the same stock as the next year&apos;s opening balance on 1 July). Every source states the stock as the county reports it; none states a cash, accrual or verified-eligible basis.</p>
      <TableWrap label={caption}>
        <table className="data" id={`${id}-table`}>
          <caption className="sr-only">{caption}</caption>
          <thead><tr><th scope="col">KSh million</th><th scope="col">Publisher and document</th><th scope="col">Published</th><th scope="col">Page</th><th scope="col">Entity scope</th><th scope="col">Stock at</th><th scope="col">Accounting basis</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-pending-id={r.id}>
                <td className="mono"><Reviewed b={badge('siaya-fiscal-ledger', r.id)}>{() => <b>{m2(r.value)}</b>}</Reviewed><br /><small><code>{r.id}</code></small></td>
                <td>{r.publisher}: <a href={r.url} rel="noopener">{r.title}</a><br /><small>{r.basis}{r.printed ? <> Printed: &ldquo;{r.printed}&rdquo;</> : null}</small><SourceErrorFlag e={r.source_error} id={r.id} /></td>
                <td>{r.published}</td>
                <td>PDF p. {r.pdf_page}{r.printed_page ? ` (printed p. ${r.printed_page})` : ''}</td>
                <td>{r.scope}</td>
                <td>{DATE(r.as_at)}</td>
                <td>{r.accounting_basis === 'as reported' ? 'As reported (basis not stated)' : r.accounting_basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
