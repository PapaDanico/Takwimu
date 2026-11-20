import PageHead from '../../components/PageHead';
import BarList from '../../components/BarList';
import sc from '../../data/subcounties.json';
import hist from '../../data/history.json';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Siaya sub-counties: population, health and growth',
  description: 'Population, density, growth since 2009, health facilities and health workers for each of Siaya County\'s six sub-counties.',
};

const n = (v) => v.toLocaleString('en-US');
const p09 = hist.population.by_sub_county_2009.values;
const rows = sc.sub_counties.map((s) => {
  const growth = ((s.population['2019'] / p09[s.id]) - 1) * 100;
  const facilities = s.facilities.hospitals + s.facilities.health_centres + s.facilities.dispensaries;
  return { ...s, p09: p09[s.id], growth, publicFacilitiesAndClinics: facilities, perFacility: Math.round(s.population['2019'] / facilities) };
});
const byPop = [...rows].sort((a, b) => b.population['2019'] - a.population['2019']);
const byGrowth = [...rows].sort((a, b) => b.growth - a.growth);
const byDensity = [...rows].sort((a, b) => b.density_per_km2['2019'] - a.density_per_km2['2019']);
const byPerFacility = [...rows].sort((a, b) => b.perFacility - a.perFacility);
const total09 = Object.values(p09).reduce((a, b) => a + b, 0);
const total19 = rows.reduce((a, r) => a + r.population['2019'], 0);
const fastest = byGrowth[0];
const slowest = byGrowth[byGrowth.length - 1];

export default function SubCounties() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Sub-counties" title="Six sub-counties, ten years of change" sub={`Siaya's six sub-counties match its six constituencies. Population grew ${((total19 / total09 - 1) * 100).toFixed(1)} per cent between the 2009 and 2019 censuses, from ${n(total09)} to ${n(total19)} people.`} path="/subcounties/" shareText="Siaya sub-counties: population and health" />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#growth">Growth</a></li><li><a href="#size">Size and density</a></li><li><a href="#health">Health access</a></li><li><a href="#each">Each sub-county</a></li><li><a href="#sources">Sources</a></li>
      </ul></nav>

      <section id="growth" className="card insight" aria-labelledby="g-h">
        <p className="eyebrow">Population change 2009 to 2019</p>
        <h2 id="g-h">{fastest.name} grew fastest at {fastest.growth.toFixed(1)} per cent; {slowest.name} slowest at {slowest.growth.toFixed(1)} per cent</h2>
        <p className="finding">Growth between the two censuses ranges across the county. Faster growth means more demand for classrooms, clinics and water in that sub-county.</p>
        <BarList label="Population growth 2009 to 2019 by sub-county" unit="%" format={(v) => v.toFixed(1)} items={byGrowth.map((r) => ({ label: r.name, value: r.growth, sub: `${n(r.p09)} to ${n(r.population['2019'])}` }))} />
        <p className="how"><b>Note.</b> {hist.population.by_sub_county_2009.note}</p>
      </section>

      <section id="size" className="card" aria-labelledby="s-h">
        <h2 id="s-h">Size and density</h2>
        <p className="lead">People living in each sub-county at the 2019 census, and how crowded the land is.</p>
        <h3 className="mini">Population, 2019 census</h3>
        <BarList label="Population by sub-county" format={n} items={byPop.map((r) => ({ label: r.name, value: r.population['2019'] }))} />
        <h3 className="mini">People per square kilometre, 2019</h3>
        <BarList label="Density by sub-county" format={n} accent="navy" items={byDensity.map((r) => ({ label: r.name, value: r.density_per_km2['2019'], sub: `${n(r.area_km2)} km²` }))} />
      </section>

      <section id="health" className="card" aria-labelledby="h-h">
        <h2 id="h-h">Health access</h2>
        <p className="lead">People for each hospital, health centre or dispensary (2019 population divided by those facilities; private clinics and nursing homes are not counted). The facility counts come from the county plan and carry no reference date, so treat this as a rough comparison.</p>
        <BarList label="People per hospital, health centre or dispensary" format={n} accent="mint" items={byPerFacility.map((r) => ({ label: r.name, value: r.perFacility, sub: `${r.publicFacilitiesAndClinics} facilities` }))} />
      </section>

      <section id="each" aria-labelledby="e-h">
        <h2 id="e-h" style={{ margin: '0 0 12px' }}>Each sub-county</h2>
        <div className="grid-2">
          {rows.map((r) => (
            <article key={r.id} className="scard" id={r.id}>
              <h3>{r.name}</h3>
              <p className="note">{r.headquarters_note || `${r.wards} wards`}</p>
              <ul className="facts">
                <li><span>Population 2009 census</span><span>{n(r.p09)}</span></li>
                <li><span>Population 2019 census</span><span>{n(r.population['2019'])}</span></li>
                <li><span>Projection 2025</span><span>{n(r.population['2025'])}</span></li>
                <li><span>Growth 2009 to 2019</span><span>{r.growth.toFixed(1)}%</span></li>
                <li><span>Area</span><span>{n(r.area_km2)} km²</span></li>
                <li><span>Wards</span><span>{r.wards}</span></li>
                <li><span>Registered voters 2022</span><span>{n(r.eligible_voters_2022)}</span></li>
                <li><span>Hospitals / health centres / dispensaries</span><span>{r.facilities.hospitals} / {r.facilities.health_centres} / {r.facilities.dispensaries}</span></li>
                <li><span>People per doctor</span><span>{n(r.people_per_health_worker.doctor)}</span></li>
                <li><span>People per nurse</span><span>{n(r.people_per_health_worker.nurse)}</span></li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="sources" className="card" aria-labelledby="src-h">
        <h2 id="src-h">Sources and confidence</h2>
        <ul className="steps">
          <li>2019 census, 2022 and later projections, facilities, health workers and voters: {sc.source}. Retrieved {shortDate(sc.retrieved)}. Confidence {sc.confidence} of 5. <a href={sc.source_url}>Document</a>.</li>
          <li>2009 census by constituency: {hist.population.by_sub_county_2009.source}. Confidence {hist.population.by_sub_county_2009.confidence} of 5. These are secondary reproductions of the census; the original 2009 tables were not reachable when we built the site.</li>
          <li>Projections are statistical estimates, not counts.</li>
        </ul>
      </section>
    </main>
  );
}
