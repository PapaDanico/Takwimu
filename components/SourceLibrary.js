'use client';
// Searchable list of the Siaya Source Library. Search and filters are held in memory only: nothing is stored or sent.
import { useId, useState } from 'react';
import { STATUS, COVERAGE } from '../lib/source-library';

const MAX_Q = 80;
function FilterRow({ label, options, value, onChange, counts }) {
  const id = useId();
  return (
    <div className="field" role="group" aria-labelledby={id}>
      <span id={id} className="field-l">{label}</span>
      <div className="filter-row">
        {[['', 'All'], ...Object.entries(options)].map(([k, v]) => (
          <button key={k || 'all'} type="button" className="btn-s ghost" aria-pressed={value === k} onClick={() => onChange(k)}>
            {v}{k ? ` (${counts[k] || 0})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

const short = (h) => `${h.slice(0, 12)}…${h.slice(-6)}`;
const sizeOf = (b) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

export default function SourceLibrary({ documents }) {
  const uid = useId();
  const [qRaw, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cov, setCov] = useState('');
  const q = qRaw.slice(0, MAX_Q);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const text = (d) => [d.document_id, d.title, d.publisher, d.document_type, d.reference_period, d.siaya_relevance, d.research_use, d.licence, d.retrieval_note].join(' ').toLowerCase();
  const matchText = documents.filter((d) => words.every((w) => text(d).includes(w)));
  const shown = matchText.filter((d) => (!status || d.retrieval_status === status) && (!cov || d.geographic_coverage === cov));
  const countBy = (list, k) => list.reduce((o, d) => ({ ...o, [d[k]]: (o[d[k]] || 0) + 1 }), {});

  return (
    <section className="card" aria-labelledby="lib-find">
      <h2 id="lib-find">Find a document</h2>
      <div className="controls" role="search">
        <div className="field">
          <label htmlFor={`${uid}-q`}>Search</label>
          <input id={`${uid}-q`} type="search" value={qRaw} maxLength={MAX_Q} onChange={(e) => setQ(e.target.value)} placeholder="For example: revenue, audit, KNBS, 2024/25" autoComplete="off" aria-describedby={`${uid}-qh`} />
          <p id={`${uid}-qh`} className="hint">Matches titles, publishers, periods, licences and notes.</p>
        </div>
      </div>
      <FilterRow label="Retrieval status" options={Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]))} value={status} onChange={setStatus} counts={countBy(matchText, 'retrieval_status')} />
      <FilterRow label="Coverage" options={COVERAGE} value={cov} onChange={setCov} counts={countBy(matchText, 'geographic_coverage')} />
      <p className="count" role="status" aria-live="polite" id="lib-count">Showing {shown.length} of {documents.length} records</p>
      {shown.length ? (
        <ul className="ds-list lib-list">
          {shown.map((d) => (
            <li key={d.document_id} className="ds lib-item" id={`doc-${d.document_id}`}>
              <h3>{d.title}</h3>
              <div className="tags">
                <span className={`ds-status lib-${d.retrieval_status}`}>{STATUS[d.retrieval_status].label}</span>
                <span className="ds-status">{COVERAGE[d.geographic_coverage]}</span>
                {d.redistribution_allowed ? <span className="ds-status">Reuse allowed with conditions</span> : null}
              </div>
              <dl>
                <dt>Record</dt><dd><code>{d.document_id}</code>{d.parent_id ? <> (from <a href={`#doc-${d.parent_id}`}>{d.parent_id}</a>)</> : null} · {d.origin}</dd>
                <dt>Publisher</dt><dd>{d.publisher}</dd>
                <dt>Type</dt><dd>{d.document_type}</dd>
                <dt>Period</dt><dd>{d.reference_period}</dd>
                <dt>Published</dt><dd>{d.publication_date}</dd>
              </dl>
              <details className="lib-tech"><summary>Relevance, retrieval, licence and technical details</summary>
              <dl>
                <dt>Relevance</dt><dd>{d.siaya_relevance}. {d.research_use}.</dd>
                <dt>Retrieval</dt><dd>{d.retrieval_note} Checked {d.last_checked_at}.</dd>
                {d.sha256 ? <><dt>File</dt><dd>{d.file_type}, {sizeOf(d.bytes)}, SHA-256 <code title={d.sha256}>{short(d.sha256)}</code></dd></> : null}
                <dt>Licence</dt><dd>{d.licence}{d.redistribution_conditions ? ` (${d.redistribution_conditions})` : ''}</dd>
                <dt>Review</dt><dd>{d.review_status}</dd>
                {d.values_review ? <><dt>Values</dt><dd>{d.values_review.total} values on this site cite this document: {d.values_review.approved} approved, {d.values_review.pending} provisional (awaiting editorial review), {d.values_review.rejected} withdrawn{d.values_review.disputed ? `, ${d.values_review.disputed} disputed` : ''}.{d.values_review.withdrawn.map((w) => <span key={w.key} className="withheld" data-obs={w.key} data-obs-state="rejected"> Withdrawn: <code>{w.key}</code> ({w.reason})</span>)}</dd></> : null}
              </dl>
              </details>
              <div className="ds-links">
                <a href={d.source_url} rel="noopener" aria-label={`Original: ${d.title}`}>Original</a>
                {d.file_url ? <a href={d.file_url} rel="noopener" aria-label={`File at the publisher: ${d.title}`}>File at the publisher</a> : null}
                {(d.also_at || []).map((u) => <a key={u} href={u} rel="noopener" aria-label={`Same file, other address: ${d.title}`}>Same file, other address</a>)}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty">No record matches. Try fewer words, or set the filters back to All.</p>}
    </section>
  );
}
