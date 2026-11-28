// Statistical abstract tables rebuilt as printed (lib/county-pages.js abstractTables()): one table per printed table,
// rows and columns in print order, each cell the value as printed. A cell not printed is shown as such, never as zero.
// Every cell carries data-obs for the release guard; "Needs page check" marks cells read from the text layer only.
import TableWrap from '../TableWrap';
import CountyCite from './Cite';

export default function AbstractTables({ tables, headingLevel = 'h2' }) {
  const H = headingLevel;
  return tables.map((t) => {
    const npc = Object.values(t.cell).filter((c) => c.needs_page_check).length;
    return (
      <section key={t.id} className="card" aria-labelledby={`t-${t.id}`}>
        <H id={`t-${t.id}`}>{t.title.replace(/^Table [\d.]+:\s*/, '')}</H>
        <p className="lead">{t.title.match(/^Table [\d.]+/) ? `${t.title.match(/^Table [\d.]+/)[0]} of the abstract, as printed. ` : ''}{t.n} values; {t.kind}.{npc ? ` ${npc === t.n ? 'All values were' : `${npc} values were`} read from the PDF text layer and are marked "Needs page check" (not yet compared with the page image).` : ''}</p>
        <TableWrap label={t.title}>
          <table className="data">
            <caption className="sr-only">{t.title}, as printed</caption>
            <thead><tr><th scope="col">Row as printed</th>{t.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>{t.rows.map((r) => (
              <tr key={r}><th scope="row">{t.rowLabel[r]}</th>{t.cols.map((c) => {
                const x = t.cell[`${r}\u0000${c}`];
                if (!x) return <td key={c}><span className="muted">Not printed</span></td>;
                if (x.review && x.review.hide) return <td key={c} data-obs={x.review.key}><span className="muted withheld">{x.review.label}</span></td>;
                return <td key={c} data-obs={x.review.key}>{x.v == null ? <span className="muted">Not printed</span> : x.v}{x.needs_page_check ? <span className="sr-only" data-needs-page-check> (needs page check)</span> : null}</td>;
              })}</tr>
            ))}</tbody>
          </table>
        </TableWrap>
        <p className="how"><CountyCite title={t.src_title} url={t.src_url} published={t.published} period={t.cols.length ? `${t.cols[0].split(':')[0]} to ${t.cols[t.cols.length - 1].split(':')[0]}` : 'as printed'} unit={t.unit} confidence={t.confidence} pdf={t.pages.join(', ')} printed={t.printed.join(', ') || null} table={t.title.match(/^Table [\d.]+/) ? t.title.match(/^Table [\d.]+/)[0] : null} read={t.read} />{npc ? <> <span className="tag warn">Needs page check</span></> : null}</p>
        {t.notes.length ? <ul className="how">{t.notes.map((n) => <li key={n}><small>{n}</small></li>)}</ul> : null}
      </section>
    );
  });
}
