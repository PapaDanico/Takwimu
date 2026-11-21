import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import WardMap from '../../../../components/WardMap';
import { Provisional } from '../../../../components/ObsTable';
import g from '../../../../data/siaya-geography.json';
import wgeo from '../../../../data/siaya-wards-geo.json';

export const metadata = {
  title: 'Wards and constituencies',
  description: 'The 6 constituencies and 30 county assembly wards of Siaya County with their IEBC codes, the spelling in each source and known aliases, and a ward map from the 2016 HDX layer (not an official IEBC map).',
};

const SRC = Object.fromEntries(g.sources.map((s) => [s.id, s]));
const SrcLink = ({ id }) => (SRC[id] && SRC[id].url ? <a href={SRC[id].url} rel="noopener">{id}</a> : <>{id}</>);
const layer = g.spatial_layers.find((l) => l.file === 'data/siaya-wards-geo.json');

export default function SiayaWards() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Wards" title="Wards and constituencies"
        sub={`Siaya County (IEBC county code ${g.county.iebc_county_code}) has ${g.constituencies.length} constituencies and ${g.wards.length} county assembly wards. This registry gives each one its IEBC code, the spelling used by each source and the other names it appears under.`}
        path="/counties/siaya/wards/" shareText="Siaya wards and constituencies: codes, spellings and map" />

      <section className="card gold" aria-labelledby="wd-read">
        <h2 id="wd-read">How to read this page</h2>
        <Provisional>The registry was compiled by Takwimu from IEBC documents and the county plan and has not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li><b>Official names and codes.</b> {g.official_name_rule}</li>
          <li><b>Boundaries in force.</b> {g.boundary_vintage}</li>
          <li><b>Constituencies and sub-counties are different systems.</b> {g.note}</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="wd-map">
        <h2 id="wd-map">Ward map</h2>
        <p className="lead" id="ward-layer">The ward outlines come from the 2016 ward layer published on the Humanitarian Data Exchange (HDX) by the American Red Cross ({wgeo.meta.licence_text}), simplified for display. All {wgeo.features.length} wards match this registry one to one. It is not an official IEBC map, and any boundary changes since 2016 are not shown. Use it to find a ward, not to measure area or settle a boundary question.</p>
        <WardMap caption={<>Ward set of the IEBC 2012 delimitation; outlines as of the HDX dataset date (2016-03-31).</>} />
        <p className="src">Layer: <a href={wgeo.meta.dataset_url} rel="noopener">{wgeo.meta.dataset}</a> ({wgeo.meta.publisher} via HDX, {wgeo.meta.licence}; file SHA-256 {layer ? `${layer.source_sha256.slice(0, 12)}…` : 'recorded in the source library'}). HDX caveat: &ldquo;{wgeo.meta.source_caveat.split(' (HDX')[0]}&rdquo; Download the outlines as <a href="/data/siaya-wards-geo.json">siaya-wards-geo.json</a>.</p>
      </section>

      <section className="card" aria-labelledby="wd-con">
        <h2 id="wd-con">Constituencies</h2>
        <TableWrap label="Siaya constituencies with IEBC codes">
          <table className="data" id="constituencies">
            <caption className="sr-only">Siaya constituencies with IEBC codes, wards and aliases</caption>
            <thead><tr><th scope="col">Constituency</th><th scope="col">IEBC code</th><th scope="col">Wards</th><th scope="col">Other names seen</th></tr></thead>
            <tbody>
              {g.constituencies.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.name}</th>
                  <td>{c.iebc_constituency_code}</td>
                  <td>{c.ward_ids.length}</td>
                  <td>{c.aliases.map((a) => `${a.name} (${a.seen_in})`).join('; ') || 'none recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="wd-wards">
        <h2 id="wd-wards">County assembly wards</h2>
        <p className="lead">All {g.wards.length} wards in IEBC code order, with the spelling in each source. The IEBC spelling is the official name; other spellings are kept as aliases.</p>
        <TableWrap label="Siaya county assembly wards with IEBC codes, source spellings and aliases">
          <table className="data" id="wards">
            <caption className="sr-only">Siaya county assembly wards with IEBC codes, source spellings and aliases</caption>
            <thead><tr><th scope="col">Ward</th><th scope="col">IEBC code</th><th scope="col">Constituency</th><th scope="col">Spelling by source</th><th scope="col">Aliases</th></tr></thead>
            <tbody>
              {[...g.wards].sort((x, y) => x.iebc_ward_code.localeCompare(y.iebc_ward_code)).map((w) => (
                <tr key={w.id}>
                  <th scope="row">{w.name}</th>
                  <td>{w.iebc_ward_code}</td>
                  <td>{g.constituencies.find((c) => c.id === w.parent).name} ({w.iebc_constituency_code})</td>
                  <td>{Object.entries(w.source_names).map(([k, v], i) => <span key={k}>{i ? '; ' : ''}<SrcLink id={k} />: {v}</span>)}</td>
                  <td>{w.aliases.map((a) => `${a.name} (${a.seen_in})`).join('; ') || 'none recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="wd-sub">
        <h2 id="wd-sub">Sub-county names used by the county and by KNBS</h2>
        {g.sub_county_systems.map((s) => (
          <div key={s.system}>
            <h3>{s.label}</h3>
            <p className="lead">Source: {s.source}. Equivalence with constituencies: {s.equivalence}.</p>
            <ul className="how">{s.units.map((u) => <li key={u.name}><b>{u.name}</b>{u.wards ? `: ${u.wards} wards` : ''}{u.note ? `. ${u.note}` : ''}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="wd-src">
        <h2 id="wd-src">Sources</h2>
        <ul className="how">
          {g.sources.map((s) => <li key={s.id}><b>{s.id}:</b> {s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}{s.pages ? `, ${s.pages}` : ''}. Used for: {s.used_for}.{s.limitation ? ` ${s.limitation}` : ''}</li>)}
        </ul>
        <p className="src">The registry is in the <Link href="/datasets/?q=siaya-wards">dataset catalogue</Link> and in <a href="/data/siaya-geography.json">siaya-geography.json</a>. See the <Link href="/subcounties/">sub-counties page</Link> and the <Link href="/counties/siaya/climate/">ward climate hazards</Link>.</p>
      </section>
    </main>
  );
}
