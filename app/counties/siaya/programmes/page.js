import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import { ColumnChart } from '../../../../components/Charts';
import { Provisional } from '../../../../components/ObsTable';
import { source } from '../../../../lib/siaya-sources';
import g from '../../../../data/siaya-programmes.json';

export const metadata = {
  title: 'NGO and development partner atlas',
  description: 'Development partner, NGO and donor programmes in Siaya since 2016: Siaya-specific programmes with county-booked amounts kept apart from multi-county and national programmes whose pooled amounts are never added to Siaya.',
};

const EVIDENCE = { planned: 'Planned', self_reported: 'Self-reported', independently_evaluated: 'Independently evaluated' };
const EV_DEF = {
  planned: 'A budget, plan or commitment: what was intended, not what happened.',
  self_reported: 'The implementer’s or publisher’s own report, including county administrative records.',
  independently_evaluated: 'An evaluation by a body independent of the implementer; its scope is stated (for World Bank projects the rating covers the whole project, not Siaya).',
};
const SPECIFIC = new Set(['siaya_specific', 'siaya_wards_listed']);
const specific = g.programmes.filter((p) => SPECIFIC.has(p.geography.class));
const pooled = g.programmes.filter((p) => !SPECIFIC.has(p.geography.class));
const n = (v) => (typeof v === 'number' ? v.toLocaleString('en-US') : v);
const Src = ({ s }) => { const r = source(s.source_id); return <small className="cite">{r.url ? <a href={r.url} rel="noopener">{r.title}</a> : r.title}, {typeof s.page === 'number' ? `PDF p. ${s.page}` : s.page}{s.locator ? `; ${s.locator}` : ''}</small>; };
const Badge = ({ t }) => <span className={`tag ${t === 'independently_evaluated' ? 'good' : 'warn'}`}>{EVIDENCE[t]}</span>;
const period = (p) => `${p.period.start || '?'} to ${p.period.end || 'not stated'}`;
const totals = g.summary.siaya_development_partner_grants_kes;
const fys = [...new Set(totals.map((t) => t.period))];

function Programme({ p, isPooled }) {
  return (
    <tr id={p.id}>
      <th scope="row">{p.title}<br /><small><code>{p.id}</code> · {p.sector.replace(/_/g, ' ')}</small></th>
      <td>{p.implementing_organisation}<br /><small>Funder: {p.funder || 'not stated'} ({p.funder_basis})</small></td>
      <td>{period(p)}<br /><Badge t={p.evidence_type} /></td>
      <td>
        {p.amounts.length ? <ul className="inputs">{p.amounts.map((a, i) => (
          <li key={i}>{a.kind}: {a.value === null ? <span className="muted">{a.value_as_printed ? `printed "${a.value_as_printed}"` : 'not printed'} (not zero)</span> : `${a.currency} ${n(a.value)}`} ({a.period}){a.pooled ? <> <span className="tag warn">Pooled total: not a Siaya figure</span></> : null}<br /><Src s={a.source} /></li>
        ))}</ul> : <span className="muted">No amount recorded</span>}
        {isPooled && p.geography.note ? <small>{p.geography.note}</small> : null}
        {!isPooled && p.geography.wards_as_printed && p.geography.wards_as_printed.length ? <small>Places as printed: {p.geography.wards_as_printed.join(', ')}</small> : null}
        <br /><small>Sources: {p.sources.map((s, i) => <span key={i}>{i ? '; ' : ''}<Src s={s} /></span>)}</small>
      </td>
    </tr>
  );
}
const Table = ({ rows, caption, id, isPooled }) => (
  <TableWrap label={caption}>
    <table className="data" id={id}>
      <caption className="sr-only">{caption}</caption>
      <thead><tr><th scope="col">Programme</th><th scope="col">Implementer and funder</th><th scope="col">Period and evidence</th><th scope="col">Amounts and sources</th></tr></thead>
      <tbody>{rows.map((p) => <Programme key={p.id} p={p} isPooled={isPooled} />)}</tbody>
    </table>
  </TableWrap>
);

export default function SiayaProgrammes() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Partners" title="NGO and development partner atlas"
        sub="Programmes run or funded by development partners, NGOs and national agencies in Siaya County since 2016, with who implements them, who pays, and how strong the evidence is. Money booked by the county for Siaya is kept apart from totals for programmes that cover many counties."
        path="/counties/siaya/programmes/" shareText="Siaya development partner and NGO atlas" />

      <section className="card gold" aria-labelledby="pg-read">
        <h2 id="pg-read">How to read this page</h2>
        <Provisional>Records were compiled by Takwimu from county documents, the World Bank projects database and IATI files and have not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li id="pooled-rule"><b>Pooled amounts are never Siaya amounts.</b> A programme that covers several counties or the whole country publishes one total. That total is shown on its own row, marked &ldquo;Pooled total&rdquo;, and is never added to any Siaya figure: how much of it reached Siaya is not published.</li>
          <li><b>Evidence types.</b> {Object.entries(EV_DEF).map(([k, v]) => <span key={k}><Badge t={k} /> {v} </span>)}</li>
          <li><b>Outcomes.</b> A result is attributed to Siaya only where the source reports a Siaya-specific result. Only organisations are named; no individual.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="pg-spec">
        <h2 id="pg-spec">Siaya-specific programmes ({specific.length})</h2>
        <p className="lead">Programmes where Siaya, or places in it, are the only places named. Amounts are as booked in the county&rsquo;s own budget documents.</p>
        <h3>Development-partner grants booked by the county</h3>
        <p className="lead">Only Siaya-specific amounts in KSh from county documents, by fiscal year. Each total equals the county&rsquo;s printed conditional-grants subtotal minus the lines that are not partner-funded. An allocation is a plan; a receipt is cash received.</p>
        <ColumnChart labels={fys} unit="KSh" yFormat="int" ariaLabel="Development-partner grants booked by Siaya County, allocation and receipt by fiscal year, KSh"
          series={['allocation', 'receipt'].map((k, i) => ({ name: k === 'allocation' ? 'Allocation' : 'Receipt', color: i + 1, values: fys.map((f) => { const t = totals.find((x) => x.period === f && x.kind === k); return t ? t.total : null; }) }))} />
        <TableWrap label="How the Siaya totals reconcile with the county's printed subtotals">
          <table className="data" id="pg-recon">
            <caption className="sr-only">Reconciliation of Siaya partner grant totals with the printed county subtotals</caption>
            <thead><tr><th scope="col">Year and kind</th><th scope="col">Printed subtotal</th><th scope="col">Lines left out (not partner-funded)</th><th scope="col">Siaya partner total</th></tr></thead>
            <tbody>
              {g.summary.reconciliation.map((r) => { const t = totals.find((x) => x.period === r.period && x.kind === r.kind); return (
                <tr key={`${r.period}${r.kind}`}>
                  <th scope="row">{r.period}, {r.kind}</th>
                  <td>KSh {n(r.printed_total)}<br /><Src s={r.source} /></td>
                  <td><small>{(r.excluded_lines || []).map((x) => `${x.line} ${n(x.value)}`).join('; ')}</small></td>
                  <td>{t ? `KSh ${n(t.total)}` : 'not reported'}<br /><small>{t ? t.record_ids.join(', ') : ''}</small></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </TableWrap>
        <Table rows={specific} caption="Siaya-specific programmes" id="pg-specific" isPooled={false} />
      </section>

      <section className="card" aria-labelledby="pg-pool">
        <h2 id="pg-pool">Multi-county and national programmes that include Siaya ({pooled.length})</h2>
        <p className="lead">Siaya is one of several counties or sites. Every amount below is a pooled total for the whole programme; none is added to the Siaya totals above.</p>
        <Table rows={pooled} caption="Multi-county and national programmes including Siaya (pooled amounts)" id="pg-pooled" isPooled />
      </section>

      <section className="card" aria-labelledby="pg-screen">
        <h2 id="pg-screen">Reports checked and screened out</h2>
        <p className="lead">Reports suggested as leads that were read and found not to describe work in Siaya.</p>
        <ul className="how" id="screened">{g.screened_out.map((s) => { const r = source(s.source_id); return <li key={s.source_id}><b>{r.url ? <a href={r.url} rel="noopener">{s.title}</a> : s.title}</b> ({s.pages_checked}): {s.finding}</li>; })}</ul>
      </section>

      <section className="card" aria-labelledby="pg-gaps">
        <h2 id="pg-gaps">What is not captured</h2>
        <ul className="how">{g.gaps.map((x) => <li key={x.topic}><b>{x.topic}</b> ({x.status}): {x.detail}</li>)}</ul>
        <p className="src">{g.meta.not_verified} Every record is in the <Link href="/datasets/?q=siaya-programmes">dataset catalogue</Link> and in <a href="/data/siaya-programmes.json">siaya-programmes.json</a>.</p>
      </section>
    </main>
  );
}
