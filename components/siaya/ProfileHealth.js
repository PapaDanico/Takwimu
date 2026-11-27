import TableWrap from '../TableWrap';
import SourceErrorFlag from '../SourceErrorFlag';
import BarList from '../BarList';
import { ColumnChart } from '../Charts';
import co from '../../data/county.json';
import hist from '../../data/history.json';

// Health survey results and the ten-year HIV series, moved from the old county profile page to /counties/siaya/health/ (owner decision U2,
// 21 Nov 2026). Values and sources unchanged.
export default function ProfileHealth() {
  return (
    <div id="profile-health">
      <section id="survey-trend" className="card insight" aria-labelledby="hl-h">
        <p className="eyebrow">Health</p>
        <h2 id="hl-h">Safer births and fewer stunted children between 2014 and 2022</h2>
        <p className="finding">{hist.health.note}</p>
        <ColumnChart labels={['Facility births', 'Skilled birth', 'Skilled antenatal', 'Stunting']} yFormat="pct0" unit="%" yMaxFixed={100} ariaLabel="Siaya health indicators in the 2014 and 2022 surveys" series={[{ name: '2014 survey', color: 1, values: hist.health.indicators.map((h) => h.v2014) }, { name: '2022 survey', color: 2, values: hist.health.indicators.map((h) => h.v2022) }]} />
        <TableWrap label="Siaya health survey results, 2014 and 2022">
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
                    <td>confidence {h.confidence} of 5</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <p className="how"><b>Other 2022 indicators from the county plan:</b> antenatal visits (four or more) {co.health_2022.antenatal_4th_visit_pct.siaya}% (Kenya {co.health_2022.antenatal_4th_visit_pct.kenya}%); average distance to a health facility {co.health_2022.average_distance_to_facility_km} km against the 5 km WHO radius; {co.health_2022.icu_beds} intensive-care beds in the county.</p>
      </section>

      <section id="hiv-history" className="card" aria-labelledby="hiv-h">
        <h2 id="hiv-h">HIV prevalence in the ten-year series: read with care</h2>
        <p className="lead">{hist.health.hiv.warning}</p>
        <BarList label="Estimated adult HIV prevalence by estimate year" unit="%" format={(v) => v.toFixed(1)} accent="red" items={hist.health.hiv.points.map((p) => ({ label: String(p.year), value: p.value, compareTo: p.national, sub: p.vintage }))} />
        <p className="how">The marker shows the national estimate from the same source where one is available.{hist.health.hiv.points.filter((p) => p.source_error).map((p) => <span key={p.year}> {p.year}, {p.value}% as published:<SourceErrorFlag e={p.source_error} id={`hiv:${p.year}`} refId={`history:hiv:${p.year}`} /></span>)}</p>
      </section>

      <p className="src">Survey results: Kenya Demographic and Health Surveys (KDHS) 2014 (<a href="https://dhsprogram.com/pubs/pdf/fr308/fr308.pdf">final report</a>) and 2022 (<a href="https://dhsprogram.com/pubs/pdf/PR143/PR143.pdf">key indicators</a>); county values come from samples. Plan figures: {co.source}, confidence {co.confidence} of 5.</p>
    </div>
  );
}
