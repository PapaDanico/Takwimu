import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import CountyNav from '../../../../components/county/CountyNav';
import PageToc from '../../../../components/PageToc';
import TableWrap from '../../../../components/TableWrap';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import IndicatorTables from '../../../../components/county/IndicatorTables';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('indicators');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/indicators/`, { title: `${m.name}: social and economic indicators`, description: `${m.name} County poverty, household survey, water utility, agriculture and fisheries indicators as printed by KNBS, WASREB and the county, each with its kind, denominator, source and page; conflicting figures side by side.` });
}

export default function CountyIndicators({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const ind = cp.indicators(slug);
  const base = `/counties/${slug}/indicators/`;
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Indicators" title="Social and economic indicators"
        sub={`Poverty, health and household conditions, water services, agriculture and fisheries in ${m.name} County, each figure as its publisher printed it. Survey estimates, official statistics, publisher claims and proposed targets are kept apart.`}
        path={base} shareText={`${m.name}: social and economic indicators`} />
      <PageToc items={[...ind.domains.map((d) => [`ind-${d.key.replace(/\s+/g, '-')}`, d.title]), ['ind-conflicts', 'Where sources differ'], ['ind-gaps', 'Gaps']]} />
      <section className="card gold" aria-labelledby="ind-read">
        <h2 id="ind-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={[ind.dataset]} />
        <ul className="how">
          <li>Each value is shown as printed, with its kind. A survey estimate has a sampling error and a survey population; an official statistic counts something recorded; a publisher claim is what an organisation says about itself and has not been checked independently; a proposed target is a plan, not a result.</li>
          <li>Each value carries its denominator: persons, households, connections or land area are not interchangeable, and figures with different denominators are not compared here.</li>
          <li>A figure for Lake Victoria or a region is not a county figure; where a value covers more than {m.name}, the area is named under it.</li>
          <li>Where publishers differ, both values are shown side by side with a possible explanation; none is averaged or preferred.</li>
        </ul>
      </section>

      <IndicatorTables domains={ind.domains} conflictBase={base} />

      <section className="card" aria-labelledby="ind-conflicts">
        <h2 id="ind-conflicts">Where sources differ</h2>
        <ol className="ds-list">
          {ind.conflicts.map((c) => (
            <li key={c.id} className="ds" id={c.id}>
              <h3>{c.summary}</h3>
              <TableWrap label={`${c.id}: values by source`}>
                <table className="data">
                  <caption className="sr-only">Each source&rsquo;s value as printed</caption>
                  <thead><tr><th scope="col">Value, as printed</th><th scope="col">Source and page</th></tr></thead>
                  <tbody>{c.values.map((r) => <tr key={r.id}><th scope="row">{r.label}: {r.value_as_printed ?? r.value}{r.unit === '%' ? '%' : r.unit ? ` ${r.unit}` : ''} ({r.period})</th><td><small>{r.src_url ? <a href={r.src_url} rel="noopener">{r.src_title}</a> : r.src_title}, PDF p. {r.pdf_page}</small></td></tr>)}</tbody>
                </table>
              </TableWrap>
              <dl>
                <dt>Possible explanation</dt><dd>{c.hypothesis}</dd>
                <dt>Status</dt><dd>{c.status === 'open' ? 'Open, not yet reviewed. All values stand.' : c.status}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="ind-gaps">
        <h2 id="ind-gaps">Gaps</h2>
        <ul className="how">{ind.gaps.map((g) => <li key={g.id}><b>{g.what}.</b> {g.reason}</li>)}</ul>
        <p className="src">Every document cited here is on the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link> page.</p>
      </section>
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
