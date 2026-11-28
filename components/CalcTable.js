// Server-rendered table of Takwimu calculations (data/siaya-analysis.json, or another calculation file via `dataset`): each row shows its calc_id, the result,
// the formula in words, every input with a link to its source and page, values shown beside it, and the caveat.
// A gap row shows its reason and no value. A formula or caveat that is the same for every row is stated once, under the
// table ("Every row: ..."), instead of on each row (duplication sweep 2, 27 Nov 2026).
import TableWrap from './TableWrap';
import { source, pageRef } from '../lib/siaya-sources';
import { badge } from '../lib/review-status';
import Reviewed from './Reviewed';
import { fmtMaybe } from '../lib/format';
import { notesFor } from '../lib/correction-notes';
import CorrectionNote, { CorrectionMark } from './CorrectionNote';

const n = (v) => fmtMaybe(v, { dp: 6 });
const Input = ({ i }) => {
  const s = source(i.source_id);
  return (
    <li>
      {i.role.replace(/_/g, ' ')}: {i.withheld ? <span className="muted withheld">withdrawn after editorial review</span> : <>{n(i.value)} {i.unit === 'label' ? '' : i.unit}</>} ({i.period}) from {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}
      {i.table ? `, ${i.table}` : ''}, {pageRef(i.pdf_page, i.printed_page, i.page_note)}{i.confidence ? `, confidence ${i.confidence} of 5` : ''}; record <code>{i.dataset.replace('data/', '')}</code> {i.record}
    </li>
  );
};

const shared = (records, k) => (records.length > 1 && records[0][k] && records.every((r) => r[k] === records[0][k]) ? records[0][k] : null);

export default function CalcTable({ caption, records, id, tag, dataset = 'siaya-analysis' }) {
  const formula = shared(records, 'formula');
  const caveat = shared(records, 'caveat');
  return (
    <TableWrap label={caption}>
      <table className="data calc" id={id}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">Measure and calc_id</th><th scope="col">Result</th><th scope="col">How it is calculated, and from what</th></tr></thead>
        <tbody>
          {records.map((r) => { const b = badge(dataset, r.calc_id); const notes = notesFor(dataset, r.calc_id); return (
            <tr key={r.calc_id} className={r.status === 'gap' ? 'gap' : undefined}>
              <th scope="row">{r.title}<br /><small><code>{r.calc_id}</code></small>{tag ? <><br /><span className="tag warn">{tag}</span></> : null}</th>
              <td>{r.status === 'gap' ? <span className="muted">Gap: no value</span> : <Reviewed b={b}>{() => <><b>{n(r.result)}</b> {r.unit}<CorrectionMark notes={notes} /></>}</Reviewed>}<br /><small>{r.period}</small><CorrectionNote notes={notes} b={b} /></td>
              <td>
                {formula ? null : <small><b>Formula:</b> {r.formula}</small>}
                {r.status === 'gap' ? <>{formula ? null : <br />}<small><b>Why there is no value:</b> {r.gap_reason}</small></> : null}
                {(r.inputs || []).length ? <details><summary>Inputs ({r.inputs.length})</summary><ul className="inputs">{r.inputs.map((i, k) => <Input key={k} i={i} />)}</ul></details> : null}
                {(r.beside || []).length ? <><br /><small><b>Shown beside (not used in the result):</b></small><ul className="inputs">{r.beside.map((i, k) => <Input key={k} i={i} />)}</ul></> : null}
                {r.caveat && !caveat ? <><small><b>Caveat:</b> {r.caveat}</small></> : null}
              </td>
            </tr>
          ); })}
        </tbody>
        {formula || caveat ? <tfoot><tr><td colSpan={3}><small className="cite">Every row: {formula ? <><b>Formula:</b> {formula}</> : null}{formula && caveat ? ' ' : null}{caveat ? <><b>Caveat:</b> {caveat}</> : null}</small></td></tr></tfoot> : null}
      </table>
    </TableWrap>
  );
}
