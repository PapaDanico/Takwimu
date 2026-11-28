import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import CountyCite, { ValueFlags } from '../../../../components/county/Cite';
import { paramsFor } from '../../../../components/county/params';
import { fmtNum } from '../../../../lib/format';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('people');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return { title: `${m.name}: population`, description: `${m.name} County population: the 2019 census count by sex and sub-county and the KNBS projections for later years, each labelled count or projection, with source and page.` };
}

const nameOf = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const n = (v) => (v == null ? <span className="muted">Not printed</span> : fmtNum(v));

export default function CountyPeople({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const p = cp.people(slug);
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="People" title="Population"
        sub={`How many people live in ${m.name} County: the 2019 census count and the Kenya National Bureau of Statistics projections for the years after it. A projection is never shown as a count.`}
        path={`/counties/${slug}/people/`} shareText={`${m.name}: population`} />

      <PageToc items={[['pop-pts', 'Census count and projections'], ...(p.sub ? [['pop-sub', 'By sub-county']] : []), ...(p.print_differences.length ? [['pop-diff', 'Where printed figures differ']] : []), ['pop-gaps', 'Gaps']]} />
      <section className="card gold" aria-labelledby="pop-read">
        <h2 id="pop-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={[p.dataset]} />
        <p>{p.meta.rule}</p>
      </section>

      <section className="card" aria-labelledby="pop-pts">
        <h2 id="pop-pts">Census count and projections</h2>
        <TableWrap label={`${m.name}: population by year`}>
          <table className="data" id="population">
            <caption className="sr-only">Population of {m.name} County by year, count or projection, with sex where printed, source and page</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Kind</th><th scope="col">Total (persons)</th><th scope="col">Male</th><th scope="col">Female</th><th scope="col">Intersex</th><th scope="col">Source, page and review</th></tr></thead>
            <tbody>
              {p.points.map((x) => (
                <tr key={x.id} data-obs={x.review.key}>
                  <th scope="row">{x.year}</th>
                  <td>{x.kind === 'census' ? 'Census count' : 'Projection'}</td>
                  <td>{x.review.hide ? <span className="muted withheld">{x.review.label}</span> : <b>{fmtNum(x.value)}</b>}</td>
                  <td>{n(x.male)}</td><td>{n(x.female)}</td><td>{n(x.intersex)}</td>
                  <td>
                    <ValueFlags label={x.state_label} machine={x.machine} />
                    <br /><CountyCite title={x.src_title} url={x.src_url} published={x.published} period={String(x.year)} unit="persons" confidence={x.confidence} pdf={x.source.pdf_page} printed={x.source.printed_page} table={x.source.table} read={x.read} />
                    {x.projection_by ? <><br /><small>Projection by {x.projection_by}.</small></> : null}
                    {x.note ? <><br /><small>{x.note}</small></> : null}
                    {x.also.length ? <><br /><small>Also printed in: {x.also.map((y, i) => <span key={y.source_id}>{i ? '; ' : ''}{y.url ? <a href={y.url} rel="noopener">{y.title}</a> : y.title}, PDF p. {y.pdf_page}</span>)}.</small></> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      {p.sub ? (
        <section className="card" aria-labelledby="pop-sub">
          <h2 id="pop-sub">By sub-county, {p.sub.year} census</h2>
          <TableWrap label={`${m.name}: population by sub-county, ${p.sub.year}`}>
            <table className="data" id="sub-counties">
              <caption className="sr-only">Population of each sub-county of {m.name}, {p.sub.year} census, as printed</caption>
              <thead><tr><th scope="col">Sub-county</th><th scope="col">Persons</th></tr></thead>
              <tbody>{Object.entries(p.sub.values).map(([k, v]) => <tr key={k}><th scope="row">{nameOf(k)}</th><td>{fmtNum(v)}</td></tr>)}</tbody>
              <tfoot><tr><th scope="row">Sum of the sub-counties</th><td>{fmtNum(Object.values(p.sub.values).reduce((s, v) => s + v, 0))}</td></tr></tfoot>
            </table>
          </TableWrap>
          <CountyCite title={p.sub.src_title} url={p.sub.src_url} published={p.sub.published} period={String(p.sub.year)} unit="persons" pdf={p.sub.source.pdf_page} printed={p.sub.source.printed_page} table={p.sub.source.table} />
          {p.sub.note ? <p className="how">{p.sub.note}</p> : null}
        </section>
      ) : null}

      {p.print_differences.length ? (
        <section className="card" aria-labelledby="pop-diff">
          <h2 id="pop-diff">Where the printed figures differ</h2>
          <ul className="how">{p.print_differences.map((d) => <li key={d.point + d.as_printed}>{d.table}, PDF p. {d.pdf_page}: printed {fmtNum(d.as_printed)}. {d.explanation}</li>)}</ul>
        </section>
      ) : null}

      <section className="card" aria-labelledby="pop-gaps">
        <h2 id="pop-gaps">Gaps</h2>
        <ul className="how">{p.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        {p.denominator ? <p className="how"><b>Per-person figures.</b> {p.denominator.rule}</p> : null}
        <p className="src">See also the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link> and the <Link href={`/counties/${slug}/`}>{m.name} County hub</Link>.</p>
      </section>
    </main>
  );
}
