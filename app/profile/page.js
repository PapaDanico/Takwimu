import PageHead from '../../components/PageHead';
import BarList from '../../components/BarList';
import co from '../../data/county.json';
import hist from '../../data/history.json';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Siaya County profile: people, poverty and health',
  description: 'Siaya County population since 2009, age structure, poverty and health survey results from 2014 to 2022.',
};

const n = (v) => v.toLocaleString('en-US');
const pop = hist.population.points;
const p0 = pop[0];
const pc = pop.find((p) => p.year === 2019);
const cagr = (Math.pow(pc.value / p0.value, 1 / 10) - 1) * 100;
const pov = hist.poverty.points;
const age = (co.population.age_groups_2022 || []).filter((g) => !/Youth|Labour/.test(g.label));

export default function Profile() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="County profile" title="Siaya County: people, poverty and health" sub={`Siaya had ${n(pc.value)} people at the 2019 census, up from ${n(p0.value)} in 2009. That is growth of about ${cagr.toFixed(1)} per cent a year.`} path="/profile/" shareText="Siaya County profile: population, poverty and health" />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#people">People</a></li><li><a href="#poverty">Poverty</a></li><li><a href="#health">Health, 2014 to 2022</a></li><li><a href="#hiv">HIV</a></li><li><a href="#sources">Sources</a></li>
      </ul></nav>

      <section id="people" className="card" aria-labelledby="p-h">
        <h2 id="p-h">Population since 2009</h2>
        <p className="lead">Counts come from the 2009 and 2019 censuses. The other years are official projections, marked below, which are estimates and not counts.</p>
        <BarList label="Siaya County population by year" format={n} items={pop.map((p) => ({ label: String(p.year), value: p.value, sub: p.kind === 'census' ? 'Census count' : 'Projection' }))} />
        <ul className="facts">
          <li><span>Households (2019)</span><span>{n(co.population.households)}</span></li>
          <li><span>Average household size</span><span>{co.population.average_household_size}</span></li>
          <li><span>Female-headed households</span><span>{co.population.female_headed_households_pct}% (Kenya {co.population.national_female_headed_households_pct}%)</span></li>
          <li><span>Urban population (2022 projection)</span><span>{n(co.population.urban_2022)} of {n(co.population.projection_2022)}</span></li>
        </ul>
        {pop.some((p) => p.alternate) && <p className="how"><b>Note.</b> The 2012 projection appears as 886,417 in the county plans' constituency table and 885,762 in their text. We show the table value.</p>}
      </section>

      {age.length > 0 && (
        <section className="card" aria-labelledby="a-h">
          <h2 id="a-h">Age structure (2022 projection)</h2>
          <p className="lead">Groups overlap, so they do not add to the county total. Why it matters: school-age groups set demand for classrooms; the labour-force group sets the base for jobs.</p>
          <BarList label="Population by age group" format={n} accent="navy" items={age.map((g) => ({ label: g.label, value: g.population }))} />
        </section>
      )}

      <section id="poverty" className="card insight" aria-labelledby="pv-h">
        <p className="eyebrow">Poverty</p>
        <h2 id="pv-h">About a third of people are poor by income; more than two in three lack several basic needs</h2>
        <p className="finding">{hist.poverty.note}</p>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Poverty in Siaya by measure and year</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Measure</th><th scope="col">Siaya</th><th scope="col">Kenya</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {pov.map((p, i) => (
                <tr key={i}>
                  <th scope="row">{p.year}</th>
                  <td>{p.measure}</td>
                  <td>{p.value}%{p.alternate && <small> (other source: {p.alternate.value}%, {p.alternate.source})</small>}</td>
                  <td>{p.national != null ? `${p.national}%` : 'Not shown'}</td>
                  <td>{p.source}. Confidence {p.confidence} of 5.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="how"><b>Gap.</b> {hist.poverty.gap}</p>
      </section>

      <section id="health" className="card insight" aria-labelledby="hl-h">
        <p className="eyebrow">Health</p>
        <h2 id="hl-h">Safer births and fewer stunted children between 2014 and 2022</h2>
        <p className="finding">{hist.health.note}</p>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Siaya health survey results, 2014 and 2022</caption>
            <thead><tr><th scope="col">Indicator</th><th scope="col">2014</th><th scope="col">2022</th><th scope="col">Change</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {hist.health.indicators.map((h) => {
                const d = h.v2022 - h.v2014;
                const good = (h.better === 'up' && d > 0) || (h.better === 'down' && d < 0);
                return (
                  <tr key={h.id}>
                    <th scope="row">{h.label}{h.note && <small style={{ display: 'block', fontWeight: 400 }}>{h.note}</small>}</th>
                    <td>{h.v2014}%</td>
                    <td>{h.v2022}%</td>
                    <td><span className={`tag ${good ? 'good' : 'warn'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)} points</span></td>
                    <td>{h.confidence} of 5</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="how"><b>Other 2022 indicators from the county plan:</b> antenatal visits (four or more) {co.health_2022.antenatal_4th_visit_pct.siaya}% (Kenya {co.health_2022.antenatal_4th_visit_pct.kenya}%); average distance to a health facility {co.health_2022.average_distance_to_facility_km} km against the 5 km WHO radius; {co.health_2022.icu_beds} intensive-care beds in the county.</p>
      </section>

      <section id="hiv" className="card" aria-labelledby="hiv-h">
        <h2 id="hiv-h">HIV prevalence: read with care</h2>
        <p className="lead">{hist.health.hiv.warning}</p>
        <BarList label="Estimated adult HIV prevalence by estimate year" unit="%" format={(v) => v.toFixed(1)} accent="red" items={hist.health.hiv.points.map((p) => ({ label: String(p.year), value: p.value, compareTo: p.national, sub: p.vintage }))} />
        <p className="how">The marker shows the national estimate from the same source where one is available.</p>
      </section>

      <section id="sources" className="card" aria-labelledby="sr-h">
        <h2 id="sr-h">Sources</h2>
        <ul className="steps">
          <li>2019 census, age structure, households, 2022 poverty and health plan figures: {co.source}. Retrieved {shortDate(co.retrieved)}. Confidence {co.confidence} of 5.</li>
          <li>2009 census and earlier projections: {hist.population.by_sub_county_2009.source}.</li>
          <li>Health survey results: Kenya Demographic and Health Surveys 2014 (<a href="https://dhsprogram.com/pubs/pdf/fr308/fr308.pdf">final report</a>) and 2022 (<a href="https://dhsprogram.com/pubs/pdf/PR143/PR143.pdf">key indicators</a>). County values come from samples.</li>
        </ul>
      </section>
    </main>
  );
}
