'use client';
// Development projects for /counties/siaya/projects/: filter by sector, ward (from the ward registry) and status.
// Each project shows what the county reported beside what the Auditor-General found. Choices are held in memory
// only: nothing is stored or sent. Contractor names are not in the data passed here (withheld pending review).
import { useId, useState } from 'react';
import { ColumnChart } from './Charts';
import Reviewed from './Reviewed';

const n = (v) => (typeof v === 'number' ? v.toLocaleString('en-US') : v);
const Ev = ({ e }) => (
  <li>
    {e.pct !== null ? <b>{e.pct}% complete (as stated). </b> : null}{e.summary}
    <br /><small className="cite">{e.url ? <a href={e.url} rel="noopener">{e.doc}</a> : e.doc}, PDF p. {e.page}{e.as_at ? `, as at ${e.as_at}` : ''}, {e.type}{e.confidence ? `, confidence ${e.confidence} of 5` : ''}{e.finding ? <>; finding <a href={`/counties/siaya/audits/#f-${e.finding}`}>{e.finding}</a></> : null}</small>
  </li>
);

export default function ProjectExplorer({ projects, states, sectors, wards }) {
  const uid = useId();
  const [sector, setSector] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState('');
  const base = projects.filter((p) => (!sector || p.sector === sector) && (!ward || p.wards.some((w) => w.id === ward)));
  const shown = base.filter((p) => !status || p.status === status);
  const usedSectors = Object.keys(sectors).filter((k) => projects.some((p) => p.sector === k));
  const scope = `${sector ? sectors[sector] : 'all sectors'}, ${ward ? `${wards.find((w) => w.id === ward).name} ward` : 'all wards and county-wide'}`;
  return (
    <section className="card" aria-labelledby="pr-find">
      <h2 id="pr-find">Projects by sector, ward and status</h2>
      <div className="controls" role="search" aria-label="Filter the project register">
        <div className="field">
          <label htmlFor={`${uid}-sec`}>Sector</label>
          <select id={`${uid}-sec`} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">All sectors</option>
            {usedSectors.map((k) => <option key={k} value={k}>{sectors[k]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-ward`}>Ward</label>
          <select id={`${uid}-ward`} value={ward} onChange={(e) => setWard(e.target.value)}>
            <option value="">All wards</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.constituency})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-st`}>Status</label>
          <select id={`${uid}-st`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {states.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
          </select>
        </div>
      </div>
      <h3>Projects by status: {scope}</h3>
      <ColumnChart labels={states.map((s) => s.state)} unit="projects" yFormat="int" ariaLabel={`Number of projects by status, ${scope}`} caption={`Projects by status, ${scope}`}
        series={[{ name: 'Projects', color: 1, values: states.map((s) => base.filter((p) => p.status === s.state).length) }]} />
      <p className="count" role="status" aria-live="polite" id="pr-count">Showing {shown.length} of {projects.length} projects</p>
      {ward ? <p className="src">A ward filter shows only projects whose printed place matches a ward name in the registry; projects printed with a town, facility or county-wide location are not included.</p> : null}
      <ol className="ds-list pr-list">
        {shown.map((p) => (
          <li key={p.id} className="ds" id={p.id}>
            <h4>{p.name}</h4>
            <div className="tags">
              <span className="ds-status"><code>{p.id}</code></span>
              {p.review && p.review.hide ? null : <span className={`tag ${p.status === 'completed-independently-verified' ? 'good' : 'warn'}`}>{p.status}</span>}
              <span className="ds-status">{sectors[p.sector]}</span>
              <span className="ds-status">{p.wards.length ? p.wards.map((w) => w.name).join(', ') : p.countywide ? 'County-wide' : `Place as printed: ${p.places.join('; ')}`}</span>
            </div>
            <Reviewed b={p.review} as="div">{() => (<>
            <p className="src">Status from {p.status_source.url ? <a href={p.status_source.url} rel="noopener">{p.status_source.doc}</a> : p.status_source.doc}, PDF p. {p.status_source.page} ({p.status_source.type}). Latest evidence {p.last}.{p.status === 'completed-reported' ? ' Completion is as reported by the county; no independent check is recorded.' : ''}{p.status_note ? ` ${p.status_note}` : ''}</p>
            <div className="side">
              <div><h5>Reported by the county or the Controller of Budget</h5>{p.reported.length ? <ul>{p.reported.map((e, i) => <Ev key={i} e={e} />)}</ul> : <p className="muted">No county report recorded.</p>}</div>
              <div><h5>Found by the Auditor-General</h5>{p.audit.length ? <ul>{p.audit.map((e, i) => <Ev key={i} e={e} />)}</ul> : <p className="muted">No audit evidence recorded.</p>}</div>
            </div>
            {p.conflicts.length ? <><h5>Where the sources differ</h5><ul>{p.conflicts.map((c) => <li key={c}>{c}</li>)}</ul></> : null}
            {p.findings.length ? <p className="src">Audit findings: {p.findings.map((f, i) => <span key={f}>{i ? ', ' : ''}<a href={`/counties/siaya/audits/#f-${f}`}>{f}</a></span>)}</p> : null}
            {p.amounts.length ? (
              <details><summary>Amounts as printed ({p.amounts.length})</summary>
                <ul>{p.amounts.map((a, i) => <li key={i}>{a.kind}: {a.unit} {n(a.value)} (FY {a.fy}; &ldquo;{a.label}&rdquo;) <small className="cite">{a.url ? <a href={a.url} rel="noopener">{a.doc}</a> : a.doc}, PDF p. {a.page}</small></li>)}</ul>
              </details>
            ) : null}
            </>)}</Reviewed>
          </li>
        ))}
      </ol>
    </section>
  );
}
