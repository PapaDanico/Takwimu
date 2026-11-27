import BarList from '../BarList';
import { ColumnChart } from '../Charts';
import Donut from '../Donut';
import SiayaMap from '../SiayaMap';
import { shortDate, fmtNum } from '../../lib/format';
import sc from '../../data/subcounties.json';
import hist from '../../data/history.json';
import { notesFor } from '../../lib/correction-notes';
import CorrectionNote, { CorrectionMark } from '../CorrectionNote';

const n = (v) => fmtNum(v);
const VOTERS_NOTE = notesFor('subcounties', 'registered_voters_2022');
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

// Siaya's six sub-counties, moved from the old sub-counties page into /counties/siaya/wards/#subcounties (owner decision U2, 21 Nov 2026).
export default function SubCounties() {
  return (
    <section className="card" id="subcounties" aria-labelledby="subcounties-h">
      <h2 id="subcounties-h">Sub-counties: population, size and health access</h2>
      <p className="lead">Siaya&apos;s six sub-counties match its six constituencies. Population grew {((total19 / total09 - 1) * 100).toFixed(1)} per cent between the 2009 and 2019 censuses, from {n(total09)} to {n(total19)} people. Censuses of 2009 and 2019, projections to 2027. Facility and staff counts carry no reference date.</p>
      <div id="sc-growth">
                <h3 id="sc-g-h">{fastest.name} grew fastest at {fastest.growth.toFixed(1)} per cent; {slowest.name} slowest at {slowest.growth.toFixed(1)} per cent</h3>
        <p className="finding">Growth between the two censuses ranges across the county. Faster growth means more demand for classrooms, clinics and water in that sub-county.</p>
        <BarList label="Population growth 2009 to 2019 by sub-county" unit="%" format={(v) => v.toFixed(1)} items={byGrowth.map((r) => ({ label: r.name, value: r.growth, sub: `${n(r.p09)} to ${n(r.population['2019'])}` }))} />
        <p className="how"><b>Note.</b> {hist.population.by_sub_county_2009.note}</p>
      </div>

      <div id="sc-map">
        <h3 id="sc-map-h">Map of Siaya County</h3>
        <p className="lead">The six sub-counties shaded by how many people live on each square kilometre at the 2019 census. Darker means more crowded. Bondo and Rarieda include shoreline on Lake Victoria; the lake itself is not drawn.</p>
        <SiayaMap title="People per square kilometre, 2019" unit="per km²" ariaLabel="Map of Siaya County showing 2019 population density by sub-county" values={Object.fromEntries(sc.sub_counties.map((r) => [r.id, r.density_per_km2['2019']]))} />
      </div>

      <div id="sc-size">
        <h3 id="sc-s-h">Size and density</h3>
        <p className="lead">People living in each sub-county at the 2019 census, and how crowded the land is.</p>
        <div className="chartgrid two">
          <div>
            <h4 className="chart-title">Share of the county population, 2019 census</h4>
            <Donut ariaLabel="Share of Siaya County population by sub-county, 2019 census" centerValue={n(total19)} centerLabel="people in 2019" items={byPop.map((r, k) => ({ label: r.name, value: r.population['2019'], color: k + 1 }))} />
          </div>
          <div>
            <h4 className="chart-title">Population in 2009 and 2019</h4>
            <p className="chart-sub">Every sub-county grew; compare the pair of columns for each.</p>
            <ColumnChart labels={byPop.map((r) => r.name.split(' ')[0])} yFormat="int" ariaLabel="Population by sub-county at the 2009 and 2019 censuses" series={[{ name: '2009 census', color: 1, values: byPop.map((r) => r.p09) }, { name: '2019 census', color: 2, values: byPop.map((r) => r.population['2019']) }]} />
          </div>
        </div>
        <h4 className="mini">People per square kilometre, 2019</h4>
        <BarList label="Density by sub-county" format={n} accent="navy" items={byDensity.map((r) => ({ label: r.name, value: r.density_per_km2['2019'], sub: `${n(r.area_km2)} km²` }))} />
      </div>

      <div id="sc-health">
        <h3 id="sc-h-h">Health access</h3>
        <p className="lead">People for each hospital, health centre or dispensary (2019 population divided by those facilities; private clinics and nursing homes are not counted). The facility counts come from the county plan and carry no reference date, so treat this as a rough comparison.</p>
        <BarList label="People per hospital, health centre or dispensary" format={n} accent="mint" items={byPerFacility.map((r) => ({ label: r.name, value: r.perFacility, sub: `${r.publicFacilitiesAndClinics} facilities` }))} />
      </div>

      <div id="sc-each">
        <h3 id="sc-e-h">Each sub-county</h3>
        <div className="grid-2">
          {rows.map((r) => (
            <article key={r.id} className="scard" id={r.id}>
              <h4>{r.name}</h4>
              <p className="note">{r.headquarters_note || `${r.wards} wards`}</p>
              <ul className="facts">
                <li><span>Population 2009 census</span><span>{n(r.p09)}</span></li>
                <li><span>Population 2019 census</span><span>{n(r.population['2019'])}</span></li>
                <li><span>Projection 2025</span><span>{n(r.population['2025'])}</span></li>
                <li><span>Growth 2009 to 2019</span><span>{r.growth.toFixed(1)}%</span></li>
                <li><span>Area</span><span>{n(r.area_km2)} km²</span></li>
                <li><span>Wards</span><span>{r.wards}</span></li>
                <li><span>Registered voters 2022<CorrectionMark notes={VOTERS_NOTE} /></span><span>{n(r.registered_voters_2022)}</span></li>
                <li><span>Hospitals / health centres / dispensaries</span><span>{r.facilities.hospitals} / {r.facilities.health_centres} / {r.facilities.dispensaries}</span></li>
                <li><span>People per doctor</span><span>{n(r.people_per_health_worker.doctor)}</span></li>
                <li><span>People per nurse</span><span>{n(r.people_per_health_worker.nurse)}</span></li>
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div id="sc-sources">
        <h3 id="sc-src-h">Sources and confidence</h3>
        <ul className="steps">
          <li>2019 census, 2022 and later projections, facilities, health workers and voters: {sc.source}. Confidence {sc.confidence} of 5. <a href={sc.source_url}>Document</a>.<CorrectionNote notes={VOTERS_NOTE} /></li>
          <li>2009 census by constituency: {hist.population.by_sub_county_2009.source}. Confidence {hist.population.by_sub_county_2009.confidence} of 5. These are secondary reproductions of the census; the original 2009 tables were not reachable when we built the site.</li>
          <li>Projections are statistical estimates, not counts.</li>
          <li>People per doctor, nurse or clinical officer come from the county plan, which does not give the staffing date or whether staff serve people from outside the sub-county. Treat them as rough comparisons, not as measures of need or quality.</li>
          <li>Facility counts have no reference date, so people-per-facility figures mix 2019 census population with counts of unknown date.</li>
        </ul>
      </div>
    </section>
  );
}
