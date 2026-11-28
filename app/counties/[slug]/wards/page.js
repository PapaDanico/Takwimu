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
  return pageMeta(`/counties/${params.slug}/wards/`, { title: `${m.name}: wards and sub-counties`, description: `${m.name} County's ${g.constituencies.length} sub-counties (IEBC constituencies) and ${g.wards.length} county assembly wards on a map, with IEBC codes, census population and registered voters by sub-county, and the boundary checks.` });
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
      <PageHead county={{ slug, name: m.name }} eyebrow="Geography" title="Wards and sub-counties"
        sub={`${m.name} County's ${g.constituencies.length} sub-counties (the IEBC constituencies) and ${g.wards.length} county assembly wards, with the figures sources publish for each. Nothing reported for the county as a whole is shared out to wards.`}
        path={base} shareText={`${m.name}: wards and sub-counties`} />
      <PageToc items={[['geo-sub', 'Sub-counties'], ['geo-wards', 'Wards'], ['geo-reg', 'IEBC ward register'], ['geo-checks', 'Boundary checks'], ['geo-scope', 'What these boundaries are']]} />
      <section className="card gold" aria-labelledby="geo-read">
        <h2 id="geo-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Sub-county here means the IEBC constituency; each carries the same name as the KNBS 2019 census sub-county. The City of Kisumu is a different area and is not drawn.</li>
          <li>A value appears on a map only where a source reports it for that unit. No ward-level figure is published here yet; ward values will be added only from sources that report them by ward.</li>
          <li>The boundaries are simplified for display and are not for measuring area or distance; the areas below are computed on the original polygons.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="geo-sub">
        <h2 id="geo-sub">Sub-counties</h2>
        {census ? <WardMap geo={consGeo} countyName={m.name} unit="sub-county" mapId="smap" values={census.values} valueLabel={census.label} valueUnit={census.unit}
          ariaLabel={`Map of the ${g.constituencies.length} sub-counties of ${m.name} County, shaded by ${census.label.toLowerCase()}`} caption={`Shading: ${census.label.toLowerCase()} (KNBS, as printed in the county statistical abstract).`} /> : null}
        <TableWrap label={`${m.name}: figures by sub-county`}>
          <table className="data" id="sub-county-figures">
            <caption className="sr-only">Each sub-county of {m.name}: IEBC code, wards, census population and registered voters, as printed</caption>
            <thead><tr><th scope="col">Sub-county (constituency)</th><th scope="col">IEBC code</th><th scope="col">Wards</th>{census ? <th scope="col">{census.label}</th> : null}<th scope="col">{voters.label}</th></tr></thead>
            <tbody>{g.constituencies.map((c) => (
              <tr key={c.id}><th scope="row">{c.name}</th><td>{c.iebc_constituency_code}</td><td>{c.ward_ids.length}</td>{census ? <td>{census.values[c.id] == null ? 'Not available' : fmtNum(census.values[c.id])}</td> : null}<td>{fmtNum(c.registered_voters_2022.value)}</td></tr>
            ))}</tbody>
            <tfoot><tr><th scope="row">Sum of the sub-counties</th><td /><td>{g.wards.length}</td>{census ? <td>{fmtNum(Object.values(census.values).reduce((s, v) => s + (v || 0), 0))}</td> : null}<td>{fmtNum(g.constituencies.reduce((s, c) => s + c.registered_voters_2022.value, 0))}</td></tr></tfoot>
          </table>
        </TableWrap>
        <ul className="how">
          {census ? <li><b>{census.label}:</b> <a href={census.source.url} rel="noopener">{census.source.title}</a>, {census.ref.table}, PDF p. {census.ref.pdf_page}{census.ref.printed_page ? ` (printed p. ${census.ref.printed_page})` : ''}; published {census.source.publication_date}; unit persons; confidence 4 of 5. {census.note}</li> : null}
          <li><b>{voters.label}:</b> <a href={voters.source.url} rel="noopener">{voters.source.title}</a>, {voters.source.pages}; published {voters.source.published}; unit persons (registered voters); confidence 4 of 5; read from the PDF text layer. Registered voters are adults who registered, not the population.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="geo-wards">
        <h2 id="geo-wards">Wards</h2>
        <p className="lead">The {g.wards.length} county assembly wards. Select a ward for its sub-county and IEBC code; the table view lists every ward.</p>
        <WardMap geo={wardsGeo} countyName={m.name} mapId="wmap" ariaLabel={`Map of the ${g.wards.length} county assembly wards of ${m.name} County`} />
      </section>

      <section className="card" aria-labelledby="geo-reg">
        <h2 id="geo-reg">IEBC ward register and name crosswalk</h2>
        <p className="lead">Names and codes as gazetted by the IEBC, with the name the boundary file uses where it differs.</p>
        <TableWrap label={`${m.name}: IEBC ward register`}>
          <table className="data" id="ward-register">
            <caption className="sr-only">Each ward: IEBC code, gazetted name, sub-county, gazette pages and the boundary file&rsquo;s name</caption>
            <thead><tr><th scope="col">IEBC code</th><th scope="col">Ward (gazetted name)</th><th scope="col">Sub-county</th><th scope="col">Gazette PDF pages</th><th scope="col">Name in the boundary file</th></tr></thead>
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
          <li>Each sub-county on the map is the union of its own wards, so the two layers share every edge. The geoBoundaries constituency layer, derived from the IEBC, was used only as a check: it covers {fmtNum(ck.geoboundaries_constituency_area_km2, { dp: 0 })} km² because it extends over Lake Victoria water and differs from the ward edges inland (table below).</li>
          <li>{ck.area_method}</li>
        </ul>
        <TableWrap label="Sub-county areas: wards against the geoBoundaries layer">
          <table className="data">
            <caption className="sr-only">For each sub-county, the area of its wards and of the geoBoundaries constituency polygon, in square kilometres</caption>
            <thead><tr><th scope="col">Sub-county</th><th scope="col">Area of its wards (km²)</th><th scope="col">geoBoundaries polygon (km²)</th><th scope="col">geoBoundaries area outside the wards (km²)</th><th scope="col">Ward area outside geoBoundaries (km²)</th></tr></thead>
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
