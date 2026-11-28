import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import BarList from '../../../../components/BarList';
import { ColumnChart } from '../../../../components/Charts';
import Donut from '../../../../components/Donut';
import DataStamp from '../../../../components/DataStamp';
import { shortDate, fmtNum } from '../../../../lib/format';
import { SITE_UPDATED } from '../../../../lib/site';
import co from '../../../../data/county.json';
import hist from '../../../../data/history.json';
import { Provisional } from '../../../../components/ObsTable';
import SourceErrorFlag from '../../../../components/SourceErrorFlag';
import { COUNTY_POP_SE } from '../../../../lib/editorial';
import Reviewed from '../../../../components/Reviewed';
import { masked, badge } from '../../../../lib/review-status';

export const metadata = {
  title: 'Siaya people: population, households and poverty',
  description: 'Siaya County population since 2009, men and women, households, age structure and poverty, with sources and confidence.',
  alternates: { canonical: '/counties/siaya/people/' },
};

const n = (v) => fmtNum(v);
const pop = hist.population.points;
const p0 = pop[0];
const pc = pop.find((p) => p.year === 2019);
const cagr = (Math.pow(pc.value / p0.value, 1 / 10) - 1) * 100;
const pov = hist.poverty.points;
// Kenya Poverty Report 2022 (data/indicators.json, read through the review mask): one row per poverty line.
const ind = masked('indicators');
const kpr = ind.sources.find((x) => x.source_id === 'KNBS-KPR-2022');
const kpr22 = ['food', 'overall', 'hardcore'].map((t) => {
  const get = (k) => ind.observations.find((o) => o.id === `kpr22-${t}-${k}-siaya`);
  return { t, rate: get('headcount-rate'), gap: get('poverty-gap'), sev: get('severity'), poor: get('number-poor'), popn: get('population') };
});
const cell = (o, fmt) => (o ? <Reviewed b={badge('indicators', o.id)} as="td">{() => fmt(o)}</Reviewed> : <td>Not shown</td>);
const age = (co.population.age_groups_2022 || []).filter((g) => !/Youth|Labour/.test(g.label));

export default function SiayaPeople() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="People" title="Siaya people: population, households and poverty" sub={`Siaya had ${n(pc.value)} people at the 2019 census, up from ${n(p0.value)} in 2009. That is growth of about ${cagr.toFixed(1)} per cent a year.`} path="/counties/siaya/people/" shareText="Siaya County profile: population, poverty and health" />
      <DataStamp period="Census 2009 and 2019; surveys 2014 and 2022; poverty 2005/06 and 2015/16" updated={shortDate(SITE_UPDATED)} completeness="Census and survey years only: no annual poverty series is available. Health survey results are on the health page." />
      <Provisional dataset={'history'} />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#people">Population</a></li><li><a href="#a-h">Age structure</a></li><li><a href="#poverty">Poverty</a></li><li><a href="#sources">Sources</a></li><li><a href="/counties/siaya/health/#profile-health">Health, 2014 to 2022</a></li>
      </ul></nav>

      <section id="people" className="card" aria-labelledby="p-h">
        <h2 id="p-h">Population since 2009</h2>
        <p className="lead">Counts come from the 2009 and 2019 censuses. The other years are official projections, marked below, which are estimates and not counts.</p>
        <ColumnChart labels={pop.map((p) => String(p.year))} yFormat="int" unit="people" ariaLabel="Siaya County population by year, census counts and projections" series={[{ name: 'Population (2009 and 2019 are census counts; other years are projections)', color: 1, values: pop.map((p) => p.value) }]} />
        <div className="chartgrid two">
          <div>
            <h3 className="chart-title">Men and women, 2019 census</h3>
            <Donut ariaLabel="Siaya County population by sex, 2019 census" centerValue={n(co.population.census_2019)} centerLabel="people" items={[{ label: 'Women', value: co.population.female_2019, color: 2 }, { label: 'Men', value: co.population.male_2019, color: 1 }]} />
          </div>
          <div>
            <h3 className="chart-title">Poverty: Siaya and Kenya, per cent</h3>
            <p className="chart-sub">Comprehensive Poverty Report 2020.</p>
            <ColumnChart labels={['Income poor', 'Several needs']} yFormat="pct0" unit="%" yMaxFixed={100} ariaLabel="Poverty rates for Siaya and Kenya, monetary and multidimensional" series={[{ name: 'Siaya', color: 1, values: [co.poverty_2020.monetary_poverty_pct.siaya, co.poverty_2020.multidimensional_poverty_pct.siaya] }, { name: 'Kenya', color: 3, values: [co.poverty_2020.monetary_poverty_pct.kenya, co.poverty_2020.multidimensional_poverty_pct.kenya] }]} />
          </div>
        </div>
        <ul className="facts">
          <li><span>Households (2019)</span><span>{n(co.population.households)}</span></li>
          <li><span>Average household size</span><span>{co.population.average_household_size}</span></li>
          <li><span>Female-headed households</span><span>{co.population.female_headed_households_pct}% (Kenya {co.population.national_female_headed_households_pct}%)</span></li>
          <li><span>Urban population (2022 projection)</span><span>{n(co.population.urban_2022)} of {n(co.population.projection_2022)}</span></li>
        </ul>
        <p className="how"><b>Urban and rural.</b> {co.population.urban_rural_note}<SourceErrorFlag e={co.population.source_error} id="county:population" refId={`county:${COUNTY_POP_SE}`} /></p>
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
        <h2 id="pv-h">About a third of residents live below the income poverty line; more than two in three lack several basic needs</h2>
        <p className="finding">{hist.poverty.note}</p>
        <TableWrap label="Poverty in Siaya by measure and year">
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
        </TableWrap>
        <h3 id="pv22-h">2022 county estimates (KNBS Kenya Poverty Report 2022)</h3>
        <TableWrap label="Siaya poverty in 2022 by poverty line">
          <table className="data">
            <caption className="sr-only">Siaya poverty in 2022 by poverty line: headcount, gap, severity and number of poor, with Kenya beside</caption>
            <thead><tr><th scope="col">Poverty line</th><th scope="col">Headcount (Siaya)</th><th scope="col">Kenya</th><th scope="col">Poverty gap</th><th scope="col">Severity</th><th scope="col">Number of poor</th></tr></thead>
            <tbody>
              {kpr22.map((r) => (
                <tr key={r.t}>
                  <th scope="row">{r.t[0].toUpperCase() + r.t.slice(1)}</th>
                  {cell(r.rate, (o) => `${o.value_as_printed}%${o.standard_error ? ` (standard error ${o.standard_error})` : ''}`)}
                  {cell(r.rate, (o) => (o.comparator ? `${o.comparator.value_as_printed}%` : 'Not shown'))}
                  {cell(r.gap, (o) => `${o.value_as_printed}%`)}
                  {cell(r.sev, (o) => `${o.value_as_printed}%`)}
                  {cell(r.poor, (o) => `${o.value_as_printed} thousand`)}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="how">Individuals, from the Kenya Continuous Household Survey 2022: {kpr ? <a href={kpr.url} rel="noopener">{kpr.title}</a> : 'KNBS Kenya Poverty Report 2022'}, Tables 4.3 to 4.5 (PDF pages 46, 50 and 55) and Annex Table A1 (standard errors). Food and hardcore poverty use different poverty lines from overall poverty. Counts are printed in thousands and rounded separately from the rates. Survey estimates with sampling error (standard errors as printed in Annex A1 for overall poverty); no test of a difference from Kenya is made here. All values, with the survey population: <Link href="/datasets/">Siaya indicators dataset</Link>.</p>
      </section>

      <section id="sources" className="card" aria-labelledby="sr-h">
        <h2 id="sr-h">Sources</h2>
        <ul className="steps">
          <li>2019 census, age structure, households, 2022 poverty and health plan figures: {co.source}. Confidence {co.confidence} of 5.</li>
          <li>2009 census and earlier projections: {hist.population.by_sub_county_2009.source}.</li>
          <li>Health survey results (KDHS 2014 and 2022) and the older HIV estimates are on <a href="/counties/siaya/health/#profile-health">Siaya health</a>.</li>
        </ul>
      </section>
    </main>
  );
}
