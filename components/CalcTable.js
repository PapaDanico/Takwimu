// Server-rendered table of Takwimu calculations (data/siaya-analysis.json): each row shows its calc_id, the result,
// the formula in words, every input with a link to its source and page, values shown beside it, and the caveat.
// A gap row shows its reason and no value.
import TableWrap from './TableWrap';
import { source, pageRef } from '../lib/siaya-sources';

const n = (v) => (typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 6 }) : v);
const Input = ({ i }) => {
  const s = source(i.source_id);
  return (
    <li>
      {i.role.replace(/_/g, ' ')}: {n(i.value)} {i.unit === 'label' ? '' : i.unit} ({i.period}) from {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}
      {i.table ? `, ${i.table}` : ''}, {pageRef(i.pdf_page, i.printed_page, i.page_note)}{i.confidence ? `, confidence ${i.confidence} of 5` : ''}; record <code>{i.dataset.replace('data/', '')}</code> {i.record}
    </li>
  );
};

export default function CalcTable({ caption, records, id, tag }) {
  return (
    <TableWrap label={caption}>
      <table className="data calc" id={id}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">Measure and calc_id</th><th scope="col">Result</th><th scope="col">How it is calculated, and from what</th></tr></thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.calc_id} className={r.status === 'gap' ? 'gap' : undefined}>
              <th scope="row">{r.title}<br /><small><code>{r.calc_id}</code></small>{tag ? <><br /><span className="tag warn">{tag}</span></> : null}</th>
              <td>{r.status === 'gap' ? <span className="muted">Gap: no value</span> : <><b>{n(r.result)}</b> {r.unit}</>}<br /><small>{r.period}</small></td>
              <td>
                <small><b>Formula:</b> {r.formula}</small>
                {r.status === 'gap' ? <><br /><small><b>Why there is no value:</b> {r.gap_reason}</small></> : null}
                {(r.inputs || []).length ? <details><summary>Inputs ({r.inputs.length})</summary><ul className="inputs">{r.inputs.map((i, k) => <Input key={k} i={i} />)}</ul></details> : null}
                {(r.beside || []).length ? <><br /><small><b>Shown beside (not used in the result):</b></small><ul className="inputs">{r.beside.map((i, k) => <Input key={k} i={i} />)}</ul></> : null}
                {r.caveat ? <><small><b>Caveat:</b> {r.caveat}</small></> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
