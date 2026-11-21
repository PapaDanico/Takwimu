'use client';
// Audit findings for /counties/siaya/audits/: filter by year, entity and category; the column chart counts findings by
// category for the chosen year and entity, with a table view. Choices are held in memory only: nothing is stored or sent.
import { useId, useState } from 'react';
import { ColumnChart } from './Charts';
import Reviewed from './Reviewed';

export default function AuditExplorer({ findings, entities, categories, years }) {
  const uid = useId();
  const [fy, setFy] = useState('');
  const [entity, setEntity] = useState('');
  const [cat, setCat] = useState('');
  const base = findings.filter((f) => (!fy || f.fy === fy) && (!entity || f.entity === entity));
  const shown = base.filter((f) => !cat || f.category === cat);
  const cats = Object.keys(categories).filter((k) => findings.some((f) => f.category === k));
  const counts = cats.map((k) => base.filter((f) => f.category === k).length);
  // A finding withdrawn in editorial review has no title or category (lib/audits.js): listed as withdrawn, never counted.
  const withdrawn = base.filter((f) => f.withdrawn).length;
  const withdrawnNote = withdrawn ? `${withdrawn} finding${withdrawn === 1 ? '' : 's'} withdrawn after review` : '';
  const scope = `${entity ? entities[entity] : 'all entities'}, ${fy ? `FY ${fy}` : 'all years with a report'}`;

  return (
    <section className="card" aria-labelledby="aud-find">
      <h2 id="aud-find">Findings by year, entity and category</h2>
      <div className="controls" role="search" aria-label="Filter the audit findings">
        <div className="field">
          <label htmlFor={`${uid}-fy`}>Year</label>
          <select id={`${uid}-fy`} value={fy} onChange={(e) => setFy(e.target.value)}>
            <option value="">All years</option>
            {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-en`}>Entity</label>
          <select id={`${uid}-en`} value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">All entities</option>
            {Object.entries(entities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-cat`}>Category</label>
          <select id={`${uid}-cat`} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((k) => <option key={k} value={k}>{categories[k]}</option>)}
          </select>
        </div>
      </div>

      <h3 id="aud-chart-h">Number of findings by category: {scope}</h3>
      <ColumnChart labels={cats.map((k) => categories[k])} series={[{ name: 'Findings', color: 1, values: counts }]} yFormat="int" unit="findings"
        ariaLabel={`Number of audit findings by category, ${scope}`} caption={`Audit findings by category, ${scope}`} />
      {withdrawnNote ? <p className="src" id="aud-withdrawn">Not counted: {withdrawnNote}.</p> : null}
      <p className="src">A count shows how the auditor divided the report into paragraphs. A higher count is not by itself a worse year, and counts are not evidence that a given finding recurred.</p>

      <h3 id="aud-list-h">The findings</h3>
      <p className="count" role="status" aria-live="polite" id="aud-count">Showing {shown.length} of {findings.length} findings{withdrawnNote ? ` (${withdrawnNote})` : ''}</p>
      {shown.length ? (
        <ol className="ds-list aud-list">
          {shown.map((f) => (
            <li key={f.id} className="ds" id={`f-${f.id}`}>
              <h4>{f.title}</h4>
              <div className="tags">
                <span className="ds-status">{entities[f.entity]}</span>
                <span className="ds-status">FY {f.fy}</span>
                {f.category ? <span className="ds-status">{categories[f.category]}</span> : null}
              </div>
              <dl>
                <dt>Report</dt><dd><a href={f.url} rel="noopener">{f.doc}</a>, PDF p. {f.page}, paragraph {f.paragraph}</dd>
                <dt>Section</dt><dd>{f.section}{f.heading ? <> (the report&rsquo;s own heading: &ldquo;{f.heading}&rdquo;)</> : null}</dd>
                <dt>Amounts as printed</dt><Reviewed b={f.review} as="dd">{f.amounts.length ? f.amounts.join('; ') : 'None printed'}</Reviewed>
                {f.prior ? <><dt>Earlier year</dt><dd>The report says this dates from an earlier year: {f.prior}</dd></> : null}
                {f.next ? <><dt>Next report</dt><dd>Listed as unresolved in the following year&rsquo;s report</dd></> : null}
                {f.note ? <><dt>Note</dt><dd>{f.note}</dd></> : null}
              </dl>
            </li>
          ))}
        </ol>
      ) : <p>No findings match these choices.</p>}
    </section>
  );
}
