import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import PageToc from '../../../../components/PageToc';
import TableWrap from '../../../../components/TableWrap';
import WardMap from '../../../../components/WardMap';
import CountyNav from '../../../../components/county/CountyNav';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import { fmtNum } from '../../../../lib/format';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('wards');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  const { g } = cp.wards(params.slug);
  return pageMeta(`/counties/${params.slug}/wards/`, { title: `${m.name}: wards and constituencies`, description: `${m.name} County's ${g.constituencies.length} IEBC constituencies and ${g.wards.length} county assembly wards on a map, with IEBC codes and registered voters, the KNBS sub-counties and their census population, and the boundary checks.` });
}

export default function CountyWards({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const { g, wardsGeo, consGeo, census, voters } = cp.wards(slug);
  const base = `/counties/${slug}/wards/`;
  const conName = Object.fromEntries(g.constituencies.map((c) => [c.id, c.name]));
  const ck = g.checks;
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Geography" title="Wards and constituencies"
        sub={`${m.name} County's ${g.constituencies.length} IEBC constituencies and ${g.wards.length} county assembly wards, and the KNBS sub-counties, with the figures sources publish for each. Nothing reported for the county as a whole is shared out to wards.`}
        path={base} shareText={`${m.name}: wards and constituencies`} />
      <PageToc items={[['geo-sub', 'Constituencies'], ['geo-knbs', 'KNBS sub-counties'], ['geo-wards', 'Wards'], ['geo-reg', 'IEBC ward register'], ['geo-checks', 'Boundary checks'], ['geo-scope', 'What these boundaries are']]} />
      <section className="card gold" aria-labelledby="geo-read">
        <h2 id="geo-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Two hierarchies are kept apart. The IEBC divides the county into {g.constituencies.length} constituencies and {g.wards.length} wards; those are the boundaries drawn here. KNBS reports some statistics by administrative sub-county ({g.knbs_sub_counties.length}, including Kadibo, which has no constituency). Figures are joined only to the hierarchy their source uses. The City of Kisumu is a different area and is not drawn.</li>
          <li>A value appears on a map only where a source reports it for that unit and hierarchy. No ward-level figure is published here yet; ward values will be added only from sources that report them by ward.</li>
          <li>The boundaries are simplified for display and are not for measuring area or distance; the areas below are computed on the original polygons.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="geo-sub">
        <h2 id="geo-sub">Constituencies (IEBC)</h2>
        <WardMap geo={consGeo} countyName={m.name} unit="constituency" mapId="smap" values={voters.values} valueLabel={voters.label} valueUnit={voters.unit}
          ariaLabel={`Map of the ${g.constituencies.length} constituencies of ${m.name} County, shaded by registered voters in 2022`} caption="Shading: registered voters, 2022 (IEBC)." />
        <TableWrap label={`${m.name}: figures by constituency`}>
          <table className="data" id="constituency-figures">
            <caption className="sr-only">Each constituency of {m.name}: IEBC code, wards and registered voters, as printed</caption>
            <thead><tr><th scope="col">Constituency</th><th scope="col">IEBC code</th><th scope="col">Wards</th><th scope="col">{voters.label}</th></tr></thead>
            <tbody>{g.constituencies.map((c) => (
              <tr key={c.id}><th scope="row">{c.name}</th><td>{c.iebc_constituency_code}</td><td>{c.ward_ids.length}</td><td>{fmtNum(c.registered_voters_2022.value)}</td></tr>
            ))}</tbody>
            <tfoot><tr><th scope="row">Sum of the constituencies</th><td /><td>{g.wards.length}</td><td>{fmtNum(g.constituencies.reduce((s, c) => s + c.registered_voters_2022.value, 0))}</td></tr></tfoot>
          </table>
        </TableWrap>
        <p className="how"><b>{voters.label}:</b> <a href={voters.source.url} rel="noopener">{voters.source.title}</a>, {voters.source.pages}; published {voters.source.published}; unit persons (registered voters); confidence 4 of 5; read from the PDF text layer. Registered voters are adults who registered, not the population.</p>
      </section>

      {census ? (
        <section className="card" aria-labelledby="geo-knbs">
          <h2 id="geo-knbs">KNBS sub-counties: 2019 census</h2>
          <p className="lead">KNBS reports the 2019 census by administrative sub-county. Seven carry the names of constituencies, but that they cover the same areas is not assumed, so these figures are not drawn on the constituency map.</p>
          <TableWrap label={`${m.name}: population by KNBS sub-county, ${census.label}`}>
            <table className="data" id="knbs-sub-counties">
              <caption className="sr-only">Population of each KNBS sub-county of {m.name}, 2019 census, as printed</caption>
              <thead><tr><th scope="col">KNBS sub-county</th><th scope="col">{census.label}</th><th scope="col">Relation to the IEBC constituencies</th></tr></thead>
              <tbody>{census.rows.map((r) => <tr key={r.slug}><th scope="row">{r.name}</th><td>{r.value == null ? 'Not printed' : fmtNum(r.value)}</td><td><small>{r.rule}</small></td></tr>)}</tbody>
              <tfoot><tr><th scope="row">Sum of the printed sub-counties</th><td>{fmtNum(census.rows.reduce((s, r) => s + (r.value || 0), 0))}</td><td /></tr></tfoot>
            </table>
          </TableWrap>
          <p className="how"><b>Source:</b> <a href={census.source.url} rel="noopener">{census.source.title}</a>, {census.ref.table}, PDF p. {census.ref.pdf_page}{census.ref.printed_page ? ` (printed p. ${census.ref.printed_page})` : ''}; published {census.source.publication_date}; unit persons; confidence 4 of 5. {census.note}</p>
        </section>
      ) : null}

      <section className="card" aria-labelledby="geo-wards">
        <h2 id="geo-wards">Wards</h2>
        <p className="lead">The {g.wards.length} county assembly wards. Select a ward for its constituency and IEBC code; the table view lists every ward.</p>
        <WardMap geo={wardsGeo} countyName={m.name} mapId="wmap" ariaLabel={`Map of the ${g.wards.length} county assembly wards of ${m.name} County`} />
      </section>

      <section className="card" aria-labelledby="geo-reg">
        <h2 id="geo-reg">IEBC ward register and name crosswalk</h2>
        <p className="lead">Names and codes as gazetted by the IEBC, with the name the boundary file uses where it differs.</p>
        <TableWrap label={`${m.name}: IEBC ward register`}>
          <table className="data" id="ward-register">
            <caption className="sr-only">Each ward: IEBC code, gazetted name, constituency, gazette pages and the boundary file&rsquo;s name</caption>
            <thead><tr><th scope="col">IEBC code</th><th scope="col">Ward (gazetted name)</th><th scope="col">Constituency</th><th scope="col">Gazette PDF pages</th><th scope="col">Name in the boundary file</th></tr></thead>
            <tbody>{g.wards.map((w) => { const x = g.crosswalk.find((c) => c.iebc_code === w.iebc_ward_code); return (
              <tr key={w.id}><td>{w.iebc_ward_code}</td><th scope="row">{w.name}</th><td>{conName[w.parent]}</td><td>{w.gazette_pages.join(', ')}</td><td>{x.polygon_name}{x.rule === 'alias' ? ' (recorded alias)' : ''}</td></tr>
            ); })}</tbody>
          </table>
        </TableWrap>
        <p className="src">Source: <a href={g.sources[0].url} rel="noopener">{g.sources[0].title}</a>, {g.sources[0].publisher}, {g.sources[0].published}; {g.sources[0].pages}; SHA-256 <code className="hash">{g.sources[0].sha256}</code>.</p>
      </section>

      <section className="card" aria-labelledby="geo-checks">
        <h2 id="geo-checks">Boundary checks</h2>
        <ul className="how">
          <li>The {ck.wards} ward polygons form a valid coverage with no overlaps. Their area is {fmtNum(ck.ward_area_km2, { dp: 1 })} km², against the official land area of {fmtNum(ck.official_land_area_km2)} km² (KNBS 2019 census Volume II): a difference of {fmtNum(ck.ward_area_vs_official_pct, { dp: 2 })} per cent.</li>
          <li>Each constituency on the map is the union of its own wards, so the two layers share every edge. The geoBoundaries constituency layer, derived from the IEBC, was used only as a check: it covers {fmtNum(ck.geoboundaries_constituency_area_km2, { dp: 0 })} km² because it extends over Lake Victoria water and differs from the ward edges inland (table below).</li>
          <li>{ck.area_method}</li>
        </ul>
        <TableWrap label="Constituency areas: wards against the geoBoundaries layer">
          <table className="data">
            <caption className="sr-only">For each constituency, the area of its wards and of the geoBoundaries constituency polygon, in square kilometres</caption>
            <thead><tr><th scope="col">Constituency</th><th scope="col">Area of its wards (km²)</th><th scope="col">geoBoundaries polygon (km²)</th><th scope="col">geoBoundaries area outside the wards (km²)</th><th scope="col">Ward area outside geoBoundaries (km²)</th></tr></thead>
            <tbody>{ck.constituency_vs_wards.map((r) => <tr key={r.iebc_code}><th scope="row">{r.name}</th><td>{fmtNum(r.wards_area_km2, { dp: 1 })}</td><td>{fmtNum(r.geoboundaries_area_km2, { dp: 1 })}</td><td>{fmtNum(r.geoboundaries_outside_wards_km2, { dp: 1 })}</td><td>{fmtNum(r.wards_outside_geoboundaries_km2, { dp: 1 })}</td></tr>)}</tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="geo-scope">
        <h2 id="geo-scope">What these boundaries are</h2>
        <ul className="how">
          <li>{g.meta.scope}</li>
          <li>{g.meta.lake_rule}</li>
          <li>{g.meta.boundary_vintage}</li>
          <li>Ward boundaries: {wardsGeo.meta.publisher} via {wardsGeo.meta.distributor}, <a href={wardsGeo.meta.dataset_url} rel="noopener">{wardsGeo.meta.dataset}</a>, licence {wardsGeo.meta.licence}, {wardsGeo.meta.vintage} File SHA-256 <code className="hash">{wardsGeo.meta.resource_sha256}</code>.</li>
        </ul>
        <p className="src">See also <Link href={`/counties/${slug}/people/`}>population</Link> and the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link>.</p>
      </section>
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
