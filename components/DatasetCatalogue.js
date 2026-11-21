'use client';
// Searchable, filterable dataset catalogue. Search and filters live in the address (?q=&sector=&geo=&year=&source=),
// so a filtered list can be shared or saved.
import Link from 'next/link';
import { useId } from 'react';
import useUrlParams from '../lib/use-url-params';
import DownloadView from './DownloadView';
import SaveView from './SaveView';
import { shortDate } from '../lib/format';

const MAX_Q = 80;
const GEO = { national: 'National (Kenya)', county: 'County', constituency: 'Constituency' };
const when = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? shortDate(s) : /^\d{4}-\d{2}$/.test(s) ? shortDate(`${s}-01`).replace(/^1 /, '') : s);

export default function DatasetCatalogue({ datasets, sectors, sources, years }) {
  const [sp, set] = useUrlParams();
  const uid = useId();
  const problems = [];
  const qRaw = sp.get('q') || '';
  const q = qRaw.slice(0, MAX_Q);
  if (qRaw.length > MAX_Q) problems.push(`Search words are limited to ${MAX_Q} characters; the rest was ignored.`);
  const pick = (k, allowed, label) => {
    const v = sp.get(k);
    if (v && !allowed.includes(v)) { problems.push(`The link asked for a ${label} that does not exist ("${v.slice(0, 30)}"), so that filter is off.`); return ''; }
    return v || '';
  };
  const sector = pick('sector', Object.keys(sectors), 'sector');
  const geo = pick('geo', Object.keys(GEO), 'geography level');
  const source = pick('source', sources, 'source');
  const year = pick('year', years.map(String), 'year');

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const text = (d) => [d.id, d.title, d.description, d.unit, d.source, d.source_detail, d.area, d.sectorLabel, ...(d.tags || [])].join(' ').toLowerCase();
  const shown = datasets.filter((d) => (!sector || d.sector === sector) && (!geo || d.geography === geo) && (!source || d.source === source)
    && (!year || d.years.includes(Number(year))) && words.every((w) => text(d).includes(w)));
  const active = [q, sector, geo, source, year].filter(Boolean).length;
  const rows = shown.map((d) => ({ id: d.id, title: d.title, sector: d.sectorLabel, geography: GEO[d.geography], area: d.area, period: `${d.period.from} to ${d.period.to}`, unit: d.unit, status: d.status, status_reason: d.status_reason, review_approved: d.review ? d.review.approved : '', review_pending: d.review ? d.review.pending : '', review_rejected: d.review ? d.review.rejected : '', version: d.version, source: d.source_detail, source_url: d.source_url, last_updated: d.last_updated, retrieved: d.retrieved, csv: d.files.csv, json: d.files.json }));

  return (
    <>
      <section className="card" aria-labelledby="find-h">
        <h2 id="find-h">Find a dataset</h2>
        <form className="controls" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor={`${uid}-q`}>Search</label>
            <input id={`${uid}-q`} type="search" value={qRaw} maxLength={MAX_Q + 20} onChange={(e) => set({ q: e.target.value })} placeholder="For example: revenue, population, Nairobi" autoComplete="off" aria-describedby={`${uid}-qh`} />
            <p id={`${uid}-qh`} className="hint">Matches titles, descriptions, units and sources.</p>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-s`}>Sector</label>
            <select id={`${uid}-s`} value={sector} onChange={(e) => set({ sector: e.target.value })}>
              <option value="">All sectors</option>
              {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-g`}>Geography</label>
            <select id={`${uid}-g`} value={geo} onChange={(e) => set({ geo: e.target.value })}>
              <option value="">National and county</option>
              {Object.entries(GEO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-y`}>Covers year</label>
            <select id={`${uid}-y`} value={year} onChange={(e) => set({ year: e.target.value })}>
              <option value="">Any year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-src`}>Source</label>
            <select id={`${uid}-src`} value={source} onChange={(e) => set({ source: e.target.value })}>
              <option value="">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </form>
        {problems.length ? <div className="invalid" role="alert">{problems.map((p) => <p key={p} style={{ margin: 0 }}>{p}</p>)}</div> : null}
        <div className="toolbar">
          <SaveView title={() => `Datasets${active ? `: ${[q && `"${q}"`, sector && sectors[sector], geo && GEO[geo], year, source].filter(Boolean).join(', ')}` : ' (all)'}`} />
          {active ? <button type="button" className="btn-s ghost" onClick={() => set({ q: null, sector: null, geo: null, year: null, source: null })}>Clear search and filters</button> : null}
        </div>
      </section>

      <section className="card" aria-labelledby="list-h">
        <h2 id="list-h">Datasets</h2>
        <p className="count" role="status" aria-live="polite">{shown.length} of {datasets.length} datasets{active ? ' match' : ''}</p>
        {shown.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>No dataset matches {q ? <>&ldquo;{q}&rdquo;</> : 'these filters'}{active > 1 ? ' with these filters' : ''}.</p>
            <p style={{ margin: '8px 0 0' }}>Try fewer words, another spelling, or <button type="button" className="btn-s ghost" onClick={() => set({ q: null, sector: null, geo: null, year: null, source: null })}>clear search and filters</button></p>
          </div>
        ) : (
          <ul className="ds-list">
            {shown.map((d) => (
              <li key={d.id} className="ds" id={d.id}>
                <h3>{d.title}</h3>
                <div className="tags"><span className="tag">{d.sectorLabel}</span><span className="tag">{GEO[d.geography]}</span><span className="tag">{d.source}</span></div>
                <p>{d.description}</p>
                <dl>
                  <dt>Status</dt><dd><span className={`ds-status st-${d.status}`}>{d.status}</span> {d.status_reason}</dd>
                  <dt>Review</dt><dd data-review-counts={d.id}>{d.review ? `${d.review.approved.toLocaleString('en-US')} approved, ${d.review.pending.toLocaleString('en-US')} pending, ${d.review.rejected.toLocaleString('en-US')} rejected (of ${d.review.total.toLocaleString('en-US')} values)` : 'Not itemised for editorial review yet.'}</dd>
                  <dt>Unit</dt><dd>{d.unit}</dd>
                  <dt>Coverage</dt><dd>{d.coverage}</dd>
                  <dt>Source</dt><dd><a href={d.source_url}>{d.source_detail}</a></dd>
                  <dt>Method</dt><dd>{d.method}</dd>
                  <dt>Last updated</dt><dd>{when(d.last_updated)} (source); retrieved {when(d.retrieved)}</dd>
                  <dt>Version</dt><dd><code>{d.version}</code> (first 10 characters of the SHA-256 of {d.data_file})</dd>
                </dl>
                <div className="ds-links">
                  {d.files.csv ? <a className="file" href={d.files.csv} download={`${d.download_name}.csv`} aria-label={`${d.title}: download CSV, version ${d.version}`}>CSV</a> : <span className="muted">No download: the publisher&rsquo;s terms are link and cite only</span>}
                  {d.files.json ? <a className="file" href={d.files.json} download={`${d.download_name}.json`} aria-label={`${d.title}: download JSON, version ${d.version}`}>JSON</a> : null}
                  {d.views.map((v) => <Link key={v.href} href={v.href}>{v.label}</Link>)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="toolbar"><DownloadView rows={rows} name="takwimu-datasets" meta={{ title: 'Takwimu Kenya dataset catalogue (filtered as shown)' }} label="Download this list" /></div>
      </section>
    </>
  );
}
