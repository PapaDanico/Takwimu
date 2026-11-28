import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import CountyCite, { ValueFlags } from '../../../../components/county/Cite';
import { paramsFor } from '../../../../components/county/params';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('audits');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return { title: `${m.name}: audit opinions`, description: `Auditor-General opinions on the accounts of ${m.name} County's executive, assembly and separately audited bodies, by year, each quoted as printed with the report and page; years with no primary report listed.` };
}

function Opinion({ o }) {
  if (o.review && o.review.hide) return <span className="muted withheld" data-obs={o.review.key}>{o.review.label}</span>;
  return (
    <div className="lv" data-obs={o.review.key}>
      <b>{o.opinion}</b><ValueFlags label={o.state_label} needsCheck={o.needs_page_check} machine={o.machine} tier={o.tier} />
      {o.quote ? <><br /><small>Printed: &ldquo;{o.quote}&rdquo;</small></> : null}
      <br /><CountyCite title={o.doc} url={o.url} published={o.report_date || 'not transcribed (see the date note)'} period={o.period} unit="opinion (text)" confidence={o.confidence} pdf={o.page} read={o.read} />
      {!o.report_date && o.date_note ? <><br /><small>Publication date: {o.date_note}</small></> : null}
      {o.note ? <><br /><small>{o.note}</small></> : null}
    </div>
  );
}

export default function CountyAudits({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const a = cp.audits(slug);
  const cell = (fy, entity) => a.opinions.filter((o) => o.fy === fy && o.entity === entity);
  const gap = (fy, entity) => a.gaps.find((g) => g.fy === fy && g.entity === entity);
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Audit" title="Audit opinions"
        sub={`What the Auditor-General concluded about the financial statements of ${m.name} County's executive, assembly and separately audited bodies, year by year, quoted as printed.`}
        path={`/counties/${slug}/audits/`} shareText={`${m.name}: Auditor-General audit opinions`} />

      <PageToc items={[['aud-op', 'Opinions by year'], ['aud-gaps', 'Reports not held'], ['aud-cav', 'Caveats']]} />
      <section className="card gold" aria-labelledby="aud-read">
        <h2 id="aud-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={[a.dataset]} />
        <ul className="how">
          <li><b>An opinion is a finding about financial statements, not a verdict on any person.</b> No individual is named on this page.</li>
          <li>An unqualified opinion means the accounts give a fair view. A qualified opinion means they do, except for the matters listed. An adverse opinion means they do not. A disclaimer means the auditor could not obtain enough evidence to form an opinion.</li>
          <li>Where the Auditor-General&rsquo;s own report is not held, an opinion reproduced by an official compilation or a civil-society summary is shown with the label &ldquo;Secondary source&rdquo;. It is never promoted to a primary reading.</li>
          <li>Each body is audited separately and shown separately; the statements of own-source revenue collected are audited on their own (see <Link href="/learn/#own-source-revenue">own-source revenue explained</Link>). Audit findings and amounts are not yet coded for {m.name}; only opinions are shown.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="aud-op">
        <h2 id="aud-op">Audit opinion by year</h2>
        <TableWrap label={`Audit opinion by year, ${m.name}`}>
          <table className="data" id="opinions">
            <caption className="sr-only">Auditor-General opinion by fiscal year for each audited body of {m.name} County, as printed; a gap gives its reason</caption>
            <thead><tr><th scope="col">Fiscal year</th>{a.entities.map((e) => <th key={e.key} scope="col">{e.label}</th>)}</tr></thead>
            <tbody>
              {a.years.map((fy) => (
                <tr key={fy}>
                  <th scope="row">FY {fy}</th>
                  {a.entities.map((e) => {
                    const os = cell(fy, e.key);
                    const g = gap(fy, e.key);
                    return <td key={e.key}>{os.map((o) => <Opinion key={o.id + o.doc} o={o} />)}{g && !os.length ? <span className="muted">No report held{g.reason ? <><br /><small>{g.reason}</small></> : null}</span> : null}{g && os.length ? <small><br />{g.reason}</small> : null}{!g && !os.length ? <span className="muted">No report held</span> : null}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="aud-gaps">
        <h2 id="aud-gaps">Reports not held</h2>
        <ul className="how">{a.gaps.map((g) => <li key={`${g.entity}-${g.fy}`}><b>{(a.entities.find((e) => e.key === g.entity) || { label: g.entity }).label}, FY {g.fy}:</b> {g.reason}</li>)}</ul>
      </section>

      <section className="card" aria-labelledby="aud-cav">
        <h2 id="aud-cav">Caveats</h2>
        <ul className="how">{a.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="src">Every report cited here is on the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link> page. See also the <Link href={`/counties/${slug}/ledger/`}>fiscal reconciliation</Link>.</p>
      </section>
    </main>
  );
}
