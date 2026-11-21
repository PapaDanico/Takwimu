import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import ObsTable, { Cite, Provisional } from '../../../../components/ObsTable';
import { source } from '../../../../lib/siaya-sources';
import c from '../../../../data/siaya-climate.json';

export const metadata = {
  title: 'Climate, water and resilience',
  description: 'Siaya ward flood and drought hotspots exactly as printed in the PCRA, water and sanitation coverage from KDHS 2022, the CIDP and WASREB with each definition, and climate money with allocation, receipt, transfer and expenditure kept separate.',
};

const obs = c.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const ward = (s) => obs.filter((o) => o.series === s);
const wardRows = [...ward('pcra-ward-flood'), ...ward('pcra-ward-drought')].sort((x, y) => x.ward_register_name.localeCompare(y.ward_register_name) || x.series.localeCompare(y.series));
const present = new Set(wardRows.map((o) => o.ward_register_name));
const noTable = c.ward_register.wards.filter((w) => !present.has(w.name));
const otherHazards = obs.filter((o) => o.kind === 'hazard ranking' && !/^pcra-ward-/.test(o.series));
const KIND = [
  ['allocation', 'Allocations (budget estimates and targets)', 'Money planned in a budget. An allocation is not money received, not spending and not an outcome.'],
  ['receipt', 'Receipts (grant cash received)', 'Money the county received from a grant during the year. A receipt is not spending.'],
  ['transfer', 'Transfers into the county FLLoCA fund', 'Money disbursed into the fund. A transfer is not spending on projects and not an outcome.'],
  ['expenditure', 'Expenditure (actual department spending)', 'Money spent, as reported. Spending says nothing by itself about what was achieved.'],
];
const ksh = (o) => (o.unit === 'KSh' ? { value: o.value, unit: 'KSh' } : { value: o.value, unit: o.unit });
const row = (o, label) => ({ key: o.id, label: label || o.measure, ...ksh(o), value_text: o.value_text, period: o.period, source_id: o.source_id, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, confidence: o.confidence, note: [o.definition, o.note].filter(Boolean).join(' ') });

export default function SiayaClimate() {
  const water = c.comparisons.find((x) => x.id === 'water-access-definitions');
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Climate" title="Climate, water and resilience"
        sub="Where residents of Siaya told the county’s climate risk assessment that floods and drought hit, how many people have safe water and sanitation by each official definition, and what climate money has been planned, received, transferred and spent."
        path="/counties/siaya/climate/" shareText="Siaya climate, water and resilience: by source" />

      <section className="card gold" aria-labelledby="cl-read">
        <h2 id="cl-read">How to read this page</h2>
        <Provisional>Values were transcribed by Takwimu from the source documents and have not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li id="no-ranking"><b>The PCRA prints no ranking of wards.</b> The Participatory Climate Risk Assessment (2023) lists hazards and hotspots ward by ward as participants described them. It does not rank wards by severity, and serial numbers in its tables are not ranks. Hotspots below are copied exactly as printed.</li>
          <li id="money-kinds"><b>Four kinds of money, never mixed.</b> An allocation is a plan, a receipt is cash received, a transfer is money moved into a fund and expenditure is money spent. None of them is an outcome. They are shown in separate tables and never added together.</li>
          <li><b>Water coverage has several definitions.</b> Each figure is shown with its own definition; no single figure is chosen.</li>
          <li>Aggregates only. The PCRA&rsquo;s list of participants contains personal details; it is not used or reproduced here, and the report is linked, not copied.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="cl-haz">
        <h2 id="cl-haz">Flood and drought hotspots by ward, as printed</h2>
        <p className="lead">{present.size} of the 30 wards have a ward table in the PCRA that names a flood or drought hazard. The order below is alphabetical, not a ranking.</p>
        <TableWrap label="Siaya ward flood and drought hotspots as printed in the PCRA">
          <table className="data" id="hotspots">
            <caption className="sr-only">Siaya ward flood and drought hotspots as printed in the PCRA 2023</caption>
            <thead><tr><th scope="col">Ward</th><th scope="col">Hazard as printed</th><th scope="col">Hotspots as printed</th><th scope="col">Ranking</th><th scope="col">Source and page</th></tr></thead>
            <tbody>
              {wardRows.map((o) => (
                <tr key={o.id}>
                  <th scope="row">{o.ward_register_name}<br /><small>{o.sub_county}{o.spelling_note ? `; ${o.spelling_note}` : ''}</small></th>
                  <td>{o.hazard}</td>
                  <td>{o.hotspots_as_printed}</td>
                  <td><small>{o.rank_as_printed}</small></td>
                  <td><Cite id={o.source_id} page={o.pdf_page} printed={o.printed_page} confidence={o.confidence} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <h3 id="no-table">Wards with no ward table in the PCRA ({noTable.length})</h3>
        <ul className="how">{noTable.map((w) => <li key={w.name}>{w.name} ({w.sub_county})</li>)}</ul>
        <p className="src">No hazard is recorded for these wards: the report prints no ward table for them, and some appear only in its annex. That is a gap, not an absence of risk. Find any ward on the <Link href="/counties/siaya/wards/">ward map</Link>.</p>
        <h3>County and sub-county hazard statements</h3>
        <p className="lead">The PCRA&rsquo;s county hazard list and the only ranking words it uses, quoted as printed.</p>
        <ObsTable caption="PCRA county and sub-county hazard statements as printed" rows={otherHazards.map((o) => ({ ...row(o, `${o.measure}: ${o.hazard || ''}`), value: null, value_text: o.rank_as_printed }))} />
      </section>

      <section className="card" aria-labelledby="cl-water">
        <h2 id="cl-water">Water and sanitation coverage, by definition</h2>
        <p className="lead">{water.note}</p>
        <TableWrap label="Siaya water access: four figures side by side with their definitions">
          <table className="data" id="water-side">
            <caption className="sr-only">Siaya water access: figures side by side with their definitions</caption>
            <thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">Definition as given</th><th scope="col">Source and page</th></tr></thead>
            <tbody>
              {water.observation_ids.map((id) => { const o = byId[id]; return (
                <tr key={id}>
                  <th scope="row">{o.measure}<br /><small>{o.period}; {o.area_as_printed}</small></th>
                  <td>{o.value === null ? o.value_text : `${o.value.toLocaleString('en-US')} ${o.unit}`}</td>
                  <td><small>{o.definition}</small></td>
                  <td><Cite id={o.source_id} table={o.table} page={o.pdf_page} printed={o.printed_page} confidence={o.confidence} /></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </TableWrap>
        <h3>Every coverage value</h3>
        <ObsTable caption="Siaya water and sanitation coverage values, all sources" rows={obs.filter((o) => o.kind === 'coverage').map((o) => row(o))} />
      </section>

      <section className="card" aria-labelledby="cl-money">
        <h2 id="cl-money">Climate and water money, by kind</h2>
        <p className="lead">&ldquo;Climate-specific&rdquo; here means the Financing Locally-Led Climate Action (FLLoCA) grant lines only. Water and environment department totals are sector budgets, not climate tags. No FLLoCA project spending or adaptation outcome is published in the documents read.</p>
        {KIND.map(([k, title, def]) => (
          <div key={k} id={`money-${k}`}>
            <h3>{title}</h3>
            <p className="lead">{def}</p>
            <ObsTable caption={`Siaya climate and water money: ${k}`} rows={obs.filter((o) => o.kind === k).map((o) => row(o))} />
          </div>
        ))}
        {c.comparisons.filter((x) => x.id !== 'water-access-definitions').map((x) => <p key={x.id} className="src"><b>{x.topic}.</b> {x.note}</p>)}
      </section>

      <section className="card" aria-labelledby="cl-gaps">
        <h2 id="cl-gaps">What is not published or not yet found</h2>
        <ul className="how" id="gaps">{c.gaps.map((g) => <li key={g.topic}><b>{g.topic}:</b> {g.reason}</li>)}</ul>
        <p className="src">Sources: {c.sources.map((s, i) => { const r = source(s.id); return <span key={s.id}>{i ? '; ' : ''}{r.url ? <a href={r.url} rel="noopener">{s.title}</a> : s.title}</span>; })}. The PCRA is linked from the Council of Governors copy; the register address fails certificate checks. Every value is in the <Link href="/datasets/?q=siaya-climate">dataset catalogue</Link> and in <a href="/data/siaya-climate.json">siaya-climate.json</a>.</p>
      </section>
    </main>
  );
}
