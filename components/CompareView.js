'use client';
// County comparison: one indicator and year for all 47 counties (ordered list, map, table), and two to four
// counties side by side. Choices live in the address (?i=&y=&sort=&c=), so a view can be shared or saved.
// Values are as printed in the Controller of Budget tables and were read by OCR; a missing value says why.
// When any value of the chosen indicator is a doubtful or not yet verified reading, the list is not ordered by value.
import Link from 'next/link';
import { useId, useState } from 'react';
import KenyaMap from './KenyaMap';
import TableWrap from './TableWrap';
import DownloadView from './DownloadView';
import SaveView from './SaveView';
import PrintButton from './PrintButton';
import useUrlParams from '../lib/use-url-params';
import { cellOf, isDoubt, naText, rawText, caveat, unitText, dlRow as rowFor } from '../lib/compare-rows';

const MAX_SEL = 4;
const GROUPS = { budget: 'Budget and spending', absorption: 'Share of budget spent', osr: 'Own-source revenue', pb: 'Pending bills' };
const DATASET = { budget: 'counties-budget-spending', absorption: 'counties-absorption', osr: 'counties-own-source-revenue', pb: 'counties-pending-bills' };
export const DEFAULT_INDICATOR = 'development_absorption_pct';

const fmtNum = (f, v) => (f.kind === 'pct' ? `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}%` : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export default function CompareView({ data }) {
  const [sp, set] = useUrlParams();
  const uid = useId();
  const [addSlug, setAddSlug] = useState('');
  const [selMsg, setSelMsg] = useState('');
  const keys = data.fields.map((f) => f.key);
  const problems = [];

  const qi = sp.get('i');
  const key = qi && keys.includes(qi) ? qi : DEFAULT_INDICATOR;
  if (qi && !keys.includes(qi)) problems.push(`The link asked for an indicator that is not in this dataset ("${qi.slice(0, 40)}"), so the default is shown.`);
  const qy = sp.get('y');
  const fy = qy && data.years.includes(qy) ? qy : data.years[data.years.length - 1];
  if (qy && !data.years.includes(qy)) problems.push(`The link asked for a year that is not loaded ("${qy.slice(0, 12)}"). Years available: FY ${data.years.join(', FY ')}.`);
  const qs = sp.get('sort');
  const sortWanted = ['high', 'low', 'name'].includes(qs) ? qs : 'high';
  const rawSel = (sp.get('c') || '').split(',').filter(Boolean);
  const validSel = [...new Set(rawSel.filter((s) => data.counties.some((c) => c.slug === s)))];
  if (rawSel.some((s) => !data.counties.some((c) => c.slug === s))) problems.push('Some counties in the link were not recognised and were left out.');
  const sel = validSel.slice(0, MAX_SEL);
  if (validSel.length > MAX_SEL) problems.push(`At most ${MAX_SEL} counties can be compared side by side; the first ${MAX_SEL} in the link are shown.`);

  const f = data.fields.find((x) => x.key === key);
  const src = data.sources[fy];
  const table = src.tables[f.tab];
  const rows = data.counties.map((c, idx) => ({ ...c, ...cellOf(data, fy, key, idx) }));
  const withVal = rows.filter((r) => r.value !== null);
  const doubtful = rows.filter(isDoubt);
  const unverified = rows.filter((r) => r.st === 'unverified');
  const otherDoubt = doubtful.length - unverified.length;
  const blank = rows.filter((r) => r.st === 'blank');
  const absent = rows.filter((r) => r.st === 'not_in_table');
  const canOrder = doubtful.length === 0;
  const sort = canOrder ? sortWanted : 'name';
  const ordered = [...rows].sort((a, b) => {
    if (sort === 'name' || (a.value === null && b.value === null)) return a.name.localeCompare(b.name);
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return sort === 'high' ? b.value - a.value : a.value - b.value;
  });
  const max = withVal.length ? Math.max(...withVal.map((r) => r.value), 0) : 0;
  const total = cellOf(data, fy, key, 'total');
  const pages = [...new Set(rows.map((r) => r.pdf).filter(Boolean))].sort((a, b) => a - b);
  const pageText = `PDF p. ${pages.join(' and ')} (printed p. ${pages.map((p) => p - src.offset).join(' and ')})`;
  const mapValues = Object.fromEntries(rows.map((r) => [r.slug, r.value]));
  const selNames = sel.map((s) => data.counties.find((c) => c.slug === s).name);

  const idxOf = (slug) => data.counties.findIndex((c) => c.slug === slug);
  const listRows = ordered.map((r) => rowFor(data, fy, f, idxOf(r.slug)));
  const sideRows = sel.flatMap((s) => data.fields.map((field) => rowFor(data, fy, field, idxOf(s))));
  // Published values with a caveat (for example a reporting date other than year end) get a numbered marker.
  const notes = [...new Set(rows.map((r) => caveat(r)).filter(Boolean))];
  const mark = (c) => { const n = caveat(c); return n ? notes.indexOf(n) + 1 : 0; };
  const mapNotes = Object.fromEntries([...rows.filter((r) => caveat(r)).map((r) => [r.slug, caveat(r)]), ...unverified.map((r) => [r.slug, naText(r)])]);
  const meta = { title: `${f.label}, FY ${fy}, all 47 counties`, unit: unitText(f), source: src.title, source_url: src.url, table, note: 'Values as printed in the Controller of Budget table, read by OCR. Missing values are left empty with the reason.' };

  const addCounty = () => {
    if (!addSlug) { setSelMsg('Choose a county from the list first.'); return; }
    if (sel.length >= MAX_SEL) { setSelMsg(`You can compare up to ${MAX_SEL} counties. Remove one to add another.`); return; }
    set({ c: [...sel, addSlug] }); setAddSlug(''); setSelMsg(`Added ${data.counties.find((c) => c.slug === addSlug).name}.`);
  };
  const removeCounty = (s) => { set({ c: sel.filter((x) => x !== s) }); setSelMsg(`Removed ${data.counties.find((c) => c.slug === s).name}.`); };

  return (
    <>
      <section className="card" aria-labelledby="pick-h">
        <h2 id="pick-h">Choose what to compare</h2>
        <form className="controls" onSubmit={(e) => e.preventDefault()} aria-describedby={problems.length ? `${uid}-p` : undefined}>
          <div className="field">
            <label htmlFor={`${uid}-i`}>Indicator</label>
            <select id={`${uid}-i`} value={key} onChange={(e) => set({ i: e.target.value })}>
              {Object.entries(GROUPS).map(([g, label]) => (
                <optgroup key={g} label={label}>
                  {data.fields.filter((x) => x.group === g).map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <fieldset className="field">
            <legend>Financial year</legend>
            <div className="radios">
              {data.years.map((y) => <label key={y}><input type="radio" name={`${uid}-y`} value={y} checked={fy === y} onChange={() => set({ y })} /><span>FY {y}</span></label>)}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend>Order of the list</legend>
            <div className="radios">
              {[['high', 'Highest value first'], ['low', 'Lowest value first'], ['name', 'A to Z']].map(([v, l]) => (
                <label key={v}><input type="radio" name={`${uid}-s`} value={v} checked={sort === v} disabled={!canOrder && v !== 'name'} onChange={() => set({ sort: v === 'high' ? null : v })} /><span>{l}</span></label>
              ))}
            </div>
          </fieldset>
        </form>
        {problems.length ? <div id={`${uid}-p`} className="invalid" role="alert">{problems.map((p) => <p key={p} style={{ margin: 0 }}>{p}</p>)}</div> : null}
        <div className="toolbar">
          <SaveView title={() => `Compare: ${f.label}, FY ${fy}${selNames.length ? ` (${selNames.join(', ')})` : ''}`} />
          <PrintButton />
        </div>
      </section>

      <section className="card" aria-labelledby="list-h">
        <h2 id="list-h">{f.label}, FY {fy}</h2>
        <p className="lead">{unitText(f) === 'per cent' ? 'Per cent' : 'KSh million'}. {src.title}, {table}, {pageText}. Every value was read by OCR from a scanned page; check it against the page before relying on it.</p>
        <p className="count" role="status" aria-live="polite">{withVal.length} of {rows.length} counties have a value{rows.length - withVal.length ? `; ${rows.length - withVal.length} not available (${[absent.length ? `${absent.length} not in that year\u2019s table` : '', blank.length ? `${blank.length} blank in the table` : '', unverified.length ? `${unverified.length} not yet verified` : '', otherDoubt ? `${otherDoubt} doubtful OCR reading${otherDoubt > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ')})` : ''}.</p>
        {!canOrder ? <p className="notice">Listed from A to Z, not by value: {doubtful.length} value{doubtful.length > 1 ? 's' : ''} for this indicator and year {doubtful.length > 1 ? 'are' : 'is'} not yet verified ({doubtful.map((d) => d.name).join(', ')}): the two OCR re-readings did not confirm the printed figure, so an order by value could misplace counties.</p> : <p className="notice">{sort === 'name' ? 'Listed from A to Z.' : `Ordered from the ${sort === 'high' ? 'highest' : 'lowest'} to the ${sort === 'high' ? 'lowest' : 'highest'} value.`} The order describes the published figures; it is not a judgement of performance. Counties without a value come last.</p>}
        <p className="muted">Printed total for all 47 counties: {total.value === null ? naText(total) : `${fmtNum(f, total.value)}${f.kind === 'pct' ? '' : ' KSh million'}`}.</p>
        <div className="compare-grid">
          <ul className="rank" aria-label={`${f.label}, FY ${fy}, by county`}>
            {ordered.map((r) => (
              <li key={r.slug} className={sel.includes(r.slug) ? 'sel' : undefined}>
                <span className="r-name"><Link href={`/counties/${r.slug}/`}>{r.name}</Link></span>
                {r.value === null ? <span className="r-na">{naText(r)}</span> : (
                  <>
                    <span className="r-track" aria-hidden="true"><span className="r-fill" style={{ width: `${max > 0 ? (Math.max(r.value, 0) / max) * 100 : 0}%` }} /></span>
                    <span className="r-val">{fmtNum(f, r.value)}{mark(r) ? <sup className="note-mark"><a href={`#${uid.replace(/:/g, '')}-n${mark(r)}`} aria-label={`Note ${mark(r)}: ${caveat(r)}`}>{mark(r)}</a></sup> : null}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <KenyaMap valueNotes={mapNotes} values={mapValues} valueUnit={f.kind === 'pct' ? '%' : 'KSh m'} valueDec={f.kind === 'pct' ? 0 : 0} valueLabel={`${f.label}, FY ${fy}`} ariaLabel={`Map of Kenya's 47 counties shaded by ${f.label.toLowerCase()}, FY ${fy}`} mapId={`${uid.replace(/:/g, '')}map`} />
        </div>
        {notes.length ? <ol className="footnotes" aria-label="Notes on values">{notes.map((n, i) => <li key={n} id={`${uid.replace(/:/g, '')}-n${i + 1}`}>{n}</li>)}</ol> : null}
        <details className="tableview">
          <summary>View as table, with page references</summary>
          <TableWrap label={`${f.label}, FY ${fy}`}>
            <table className="data">
              <caption className="sr-only">{f.label}, FY {fy}, all 47 counties, with the page each value was read from</caption>
              <thead><tr><th scope="col">County</th><th scope="col">Value ({f.kind === 'pct' ? '%' : 'KSh m'})</th><th scope="col">Printed reading</th><th scope="col">Page (PDF, printed)</th><th scope="col">OCR confidence</th><th scope="col">Note</th></tr></thead>
              <tbody>
                {ordered.map((r) => (
                  <tr key={r.slug}>
                    <th scope="row">{r.name}</th>
                    {r.value === null ? <td className="na" data-obs={`counties-cob:${fy}:${r.slug}:${key}`} data-obs-state={r.st === 'withdrawn' ? 'rejected' : undefined}>{naText(r)}</td> : <td className="num" data-obs={`counties-cob:${fy}:${r.slug}:${key}`}>{fmtNum(f, r.value)}</td>}
                    <td>{rawText(r)}</td>
                    <td>{r.pdf}, {r.printed}</td>
                    <td>{r.conf === null || r.conf === undefined ? 'n/a' : r.conf.toFixed(2)}</td>
                    <td>{caveat(r) || (r.value === null ? 'See value' : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </details>
        <div className="toolbar"><DownloadView rows={listRows} name={`takwimu-compare-${key}-${fy.replace('/', '-')}`} meta={meta} label="Download this list" /></div>
        <p className="src">Source: <a href={src.url}>{src.title}</a>, {table}. Read by OCR (RapidOCR) from the scanned report; amounts add up to the printed totals. Full dataset with every field: <Link href={`/datasets/?q=${DATASET[f.group]}`}>datasets catalogue</Link>.</p>
      </section>

      <section className="card" aria-labelledby="side-h">
        <h2 id="side-h">Side by side</h2>
        <p className="lead">Pick two to four counties to see every indicator for FY {fy} in one table.</p>
        <div className="addrow">
          <div className="field">
            <label htmlFor={`${uid}-add`}>Add a county</label>
            <select id={`${uid}-add`} value={addSlug} onChange={(e) => { setAddSlug(e.target.value); setSelMsg(''); }} aria-describedby={`${uid}-selmsg`}>
              <option value="">Choose a county</option>
              {data.counties.filter((c) => !sel.includes(c.slug)).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <button type="button" className="btn-s" onClick={addCounty}>Add</button>
        </div>
        <p id={`${uid}-selmsg`} className={selMsg && /up to|first/.test(selMsg) ? 'invalid' : 'hint'} role="status" aria-live="polite">{selMsg || `${sel.length} of ${MAX_SEL} chosen.${sel.length === 1 ? ' Choose at least one more to compare.' : ''}`}</p>
        {sel.length ? (
          <ul className="chips-sel" aria-label="Chosen counties">
            {sel.map((s, i) => <li key={s}>{selNames[i]}<button type="button" onClick={() => removeCounty(s)} aria-label={`Remove ${selNames[i]}`}>×</button></li>)}
          </ul>
        ) : null}
        {sel.length < 2 ? (
          <p className="empty">{sel.length === 0 ? 'No county chosen yet. Add two to four counties above to compare them side by side.' : `Add at least one more county to compare with ${selNames[0]}.`}</p>
        ) : (
          <>
            <TableWrap label={`Side by side, FY ${fy}`}>
              <table className="data">
                <caption>Every indicator for {selNames.join(', ')}, FY {fy}. Values as printed (OCR); the small text gives the PDF page.</caption>
                <thead><tr><th scope="col">Indicator</th>{selNames.map((n) => <th key={n} scope="col">{n}</th>)}</tr></thead>
                <tbody>
                  {data.fields.map((field) => (
                    <tr key={field.key}>
                      <th scope="row">{field.label} <small>({field.kind === 'pct' ? '%' : 'KSh m'})</small></th>
                      {sel.map((s) => {
                        const c = cellOf(data, fy, field.key, data.counties.findIndex((x) => x.slug === s));
                        return c.value === null ? <td key={s} className="na" data-obs-state={c.st === 'withdrawn' ? 'rejected' : undefined}>{c.st === 'withdrawn' ? c.note : c.st === 'unverified' ? 'Not yet verified' : c.st === 'doubtful' ? 'Doubtful reading' : c.st === 'not_in_table' ? 'Not in this year\u2019s table' : 'Blank in table'}<small>{c.st === 'unverified' && c.note ? `${c.note} ` : ''}p. {c.pdf}</small></td> : <td key={s} className="num">{fmtNum(field, c.value)}<small>p. {c.pdf}{caveat(c) ? `. ${caveat(c)}` : ''}</small></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="toolbar"><DownloadView rows={sideRows} name={`takwimu-side-by-side-${fy.replace('/', '-')}`} meta={{ ...meta, title: `Side by side, FY ${fy}: ${selNames.join(', ')}` }} label="Download this table" /></div>
          </>
        )}
      </section>
    </>
  );
}
