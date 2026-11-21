import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import { ColumnChart } from '../../../../components/Charts';
import ObsTable, { Provisional } from '../../../../components/ObsTable';
import { source } from '../../../../lib/siaya-sources';
import { masked } from '../../../../lib/review-status';
const a = masked('siaya-agriculture');

export const metadata = {
  title: 'Agriculture in Siaya',
  description: 'Siaya crops, livestock, fisheries and irrigation as printed by KNBS and the county plan: observed values kept apart from plan targets, unit problems shown side by side, gaps listed.',
};

const obs = a.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const UNIT = { ha: 'ha', tonnes: 'tonnes', bags: 'bags (weight not stated)', number: '', KSh_million: 'KSh million', KSh_thousand: 'KSh thousand', thousand_tonnes: '"000 (MT)" as printed', acres: 'acres', kg: 'kg', KSh: 'KSh' };
const nice = (s) => String(s).replace(/_/g, ' ');
const row = (o) => ({
  key: o.id, label: `${nice(o.indicator)}, ${nice(o.commodity)}`, value: o.value, value_text: o.value === null ? 'withheld as implausible' : null, unit: UNIT[o.unit] ?? nice(o.unit), period: o.period,
  source_id: o.source_id, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, confidence: o.confidence,
  note: [`Printed: "${o.value_as_printed}".`, o.provisional ? 'Marked provisional by the source.' : '', o.note || ''].filter(Boolean).join(' '),
  ...(o.status !== 'observed' ? { tag: o.status === 'target' ? 'Target, not observed' : 'Projection, not observed' } : o.confidence === 1 ? { tag: 'Unit or size unreliable: not charted' } : {}),
});
const observed = obs.filter((o) => o.status === 'observed');
const planned = obs.filter((o) => o.status !== 'observed');
const CROPS = ['maize', 'beans', 'sorghum', 'rice', 'cassava'];
const area = (c, y) => obs.find((o) => o.indicator === 'area_cropped' && o.commodity === c && o.period === y);
const LIVE = ['cattle_beef_zebu', 'goats_meat', 'sheep_hair', 'pigs', 'cattle_dairy', 'donkeys'];
const head = (c, y) => obs.find((o) => o.indicator === 'livestock_population' && o.commodity === c && o.period === y);
const group = (re) => observed.filter((o) => re.test(o.indicator));

export default function SiayaAgriculture() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Agriculture" title="Agriculture in Siaya"
        sub="Crops, livestock, fish and irrigation in Siaya County as printed by the Kenya National Bureau of Statistics and the county development plan. What was counted is kept apart from what the plan aims to reach."
        path="/counties/siaya/agriculture/" shareText="Agriculture in Siaya: observed values and plan targets" />

      <section className="card gold" aria-labelledby="ag-read">
        <h2 id="ag-read">How to read this page</h2>
        <Provisional dataset="siaya-agriculture">Values were transcribed by Takwimu from the KNBS Siaya County Statistical Abstract 2015 and the CIDP 2023-2027 and have not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li id="observed-vs-targets"><b>Observed values and targets are separate.</b> {observed.length} values are reported as counted or achieved; {planned.length} are plan targets. Targets appear only in their own section and are never shown as results.</li>
          <li><b>Some printed units are unreliable.</b> Where a table&rsquo;s unit cannot be right as printed (for example tonnes equal to bag counts), the value is kept with confidence 1 and is not charted.</li>
          <li><b>No yields.</b> Neither source prints a yield, so none is derived. The value of farm output in the county economy is on <Link href="/counties/siaya/economy/">Siaya&rsquo;s economy</Link>.</li>
          <li>The latest county-level crop and livestock counts found are for 2013 and 2014; the 2015-2025 gap is listed below.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="ag-obs">
        <h2 id="ag-obs">Observed: what was counted</h2>
        <h3>Area planted, five main crops, 2013 and 2014</h3>
        <p className="lead">Hectares, KNBS abstract Table 4.2 (data from the county agriculture department; 2014 marked provisional).</p>
        <ColumnChart labels={CROPS.map((c) => c[0].toUpperCase() + c.slice(1))} unit="ha" yFormat="int"
          ariaLabel="Siaya area cropped by crop, 2013 and 2014, hectares"
          series={['2013', '2014'].map((y, i) => ({ name: y === '2014' ? '2014 (provisional)' : y, color: i + 1, values: CROPS.map((c) => (area(c, y) || {}).value ?? null) }))} />
        <h3>Livestock numbers, 2013 and 2014</h3>
        <p className="lead">Head of animals, KNBS abstract Table 5.1. Poultry and beehives are in the table below.</p>
        <ColumnChart labels={LIVE.map((c) => nice(c).replace('cattle beef zebu', 'beef cattle (zebu)').replace('goats meat', 'meat goats').replace('sheep hair', 'hair sheep').replace('cattle dairy', 'dairy cattle'))} unit="head" yFormat="int"
          ariaLabel="Siaya livestock numbers by type, 2013 and 2014"
          series={['2013', '2014'].map((y, i) => ({ name: y, color: i + 1, values: LIVE.map((c) => (head(c, y) || {}).value ?? null) }))} />
        <h3>Crops</h3>
        <ObsTable dataset="siaya-agriculture" caption="Siaya crops, observed values" id="obs-crops" rows={group(/^(area_cropped|production|production_value|mechanised_area)$/).map(row)} />
        <h3>Livestock and bees</h3>
        <ObsTable dataset="siaya-agriculture" caption="Siaya livestock, observed values" rows={group(/^livestock_population$/).map(row)} />
        <h3>Fisheries and irrigation</h3>
        <ObsTable dataset="siaya-agriculture" caption="Siaya fisheries and irrigation, observed values" rows={group(/^(fish|aquaculture|irrigated|jetties)/).map(row)} />
      </section>

      <section className="card" aria-labelledby="ag-tgt">
        <h2 id="ag-tgt">Targets in the county plans (not results)</h2>
        <p className="lead">Targets and cost estimates printed in the CIDP 2023-2027 and its review of 2018-2022. They describe intentions; they are not counts, and none has been checked against a result.</p>
        <ObsTable dataset="siaya-agriculture" caption="Siaya agriculture plan targets (not observed values)" id="targets" rows={planned.map(row)} />
      </section>

      <section className="card" aria-labelledby="ag-conf">
        <h2 id="ag-conf">Unit and value conflicts, side by side</h2>
        <p className="lead">{a.conflicts.length} cases where a source contradicts itself or another source. Every value is kept as printed.</p>
        {a.conflicts.map((c) => (
          <div key={c.id} className="conflict" id={c.id}>
            <h3>{c.topic}</h3>
            <p>{c.note}</p>
            <ObsTable dataset="siaya-agriculture" caption={`${c.topic}: values side by side`} rows={c.values.map((id) => row(byId[id]))} />
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="ag-gaps">
        <h2 id="ag-gaps">What is not published or not yet found</h2>
        <ul className="how">{a.gaps.map((g) => <li key={g.item}><b>{g.item}:</b> {g.reason}</li>)}</ul>
        <p className="src">Sources: {a.sources.map((s, i) => { const r = source(s.source_id); return <span key={s.source_id}>{i ? '; ' : ''}{r.url ? <a href={r.url} rel="noopener">{s.title}</a> : s.title} ({s.licence})</span>; })}. Every value is in the <Link href="/datasets/?q=siaya-agriculture">dataset catalogue</Link> and in <a href="/data/siaya-agriculture.json">siaya-agriculture.json</a>.</p>
      </section>
    </main>
  );
}
