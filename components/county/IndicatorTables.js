// Indicator tables for a county page (lib/county-pages.js indicators()): one table per domain, each value as printed
// with its kind, denominator, comparator, source, publication date, period, unit, confidence and table cell. A value
// in an open conflict links to the side-by-side case; a bound ("<1") keeps the bound. Pure: server components.
import TableWrap from '../TableWrap';
import CountyCite, { ValueFlags } from './Cite';

const KIND_NOTE = {
  'survey estimate': 'Survey estimate',
  'official statistic': 'Official statistic',
  'administrative statistic': 'Administrative statistic',
  'publisher claim': 'Publisher claim (not independently verified)',
  'proposed target': 'Proposed target (not an achievement)',
  'baseline in a target table': 'Baseline printed in a target table',
};

function Value({ r }) {
  if (r.review && r.review.hide) return <span className="muted withheld">{r.review.label}</span>;
  const v = r.value_as_printed != null && r.value_as_printed !== '' ? r.value_as_printed : (r.value == null ? null : String(r.value));
  return v == null ? <span className="muted">Not printed</span> : <b>{v}{r.unit === '%' ? '%' : ''}</b>;
}

export default function IndicatorTables({ domains, conflictBase }) {
  return domains.map((d) => (
    <section key={d.key} className="card" aria-labelledby={`ind-${d.key.replace(/\s+/g, '-')}`}>
      <h2 id={`ind-${d.key.replace(/\s+/g, '-')}`}>{d.title}</h2>
      <TableWrap label={`${d.title}: values as printed`}>
        <table className="data">
          <caption className="sr-only">{d.title}: each value as printed, with its kind, denominator, comparator and source</caption>
          <thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Period</th><th scope="col">Kind and denominator</th><th scope="col">Source and page</th></tr></thead>
          <tbody>
            {d.rows.map((r) => (
              <tr key={r.id} data-obs={r.review.key}>
                <th scope="row">{r.label}{r.area && !/County$/.test(r.area) ? <><br /><small>{r.area}</small></> : null}</th>
                <td>
                  <Value r={r} />{r.unit && r.unit !== '%' ? <small> {r.unit}</small> : null}
                  <ValueFlags label={r.state_label} machine={r.machine} />
                  {r.conflicts.length ? <> <a className="tag warn" href={`${conflictBase}#${r.conflicts[0]}`} data-disputed>Sources differ: both shown</a></> : null}
                  {r.comparator ? <><br /><small>{r.comparator.label}: {r.comparator.value_as_printed ?? r.comparator.value}{r.unit === '%' ? '%' : ''}</small></> : null}
                  {r.standard_error != null ? <><br /><small>Standard error {r.standard_error}</small></> : null}
                </td>
                <td>{r.period}</td>
                <td><small>{KIND_NOTE[r.kind] || r.kind}{r.denominator ? `. ${r.denominator}` : ''}{r.provisional_in_source ? '. Marked provisional by the publisher' : ''}</small></td>
                <td>
                  <CountyCite title={r.src_title} url={r.src_url} published={r.published} period={r.period} unit={r.unit || 'as printed'} confidence={r.confidence} pdf={r.pdf_page} printed={r.printed_page} table={[r.table, r.row && `row ${r.row}`, r.column && `column ${r.column}`].filter(Boolean).join(', ')} />
                  {r.note ? <><br /><small>{r.note}</small></> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </section>
  ));
}
