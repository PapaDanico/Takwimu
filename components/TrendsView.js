'use client';
// Trends: choose an indicator and see how it changed, in shillings of each year (nominal) or after prices (real)
// where a price adjustment applies. Choices live in the address (?i=&basis=).
import Link from 'next/link';
import { useId, useEffect } from 'react';
import { LineChart } from './Charts';
import DownloadView from './DownloadView';
import SaveView from './SaveView';
import PrintButton from './PrintButton';
import useUrlParams from '../lib/use-url-params';

export const DEFAULT_TREND = 'population';
const show = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function TrendsView({ series, baseFy }) {
  const [sp, set] = useUrlParams();
  // Old /trends/ links redirect here without the #trends fragment: bring the chosen trend into view.
  useEffect(() => {
    if (window.location.hash || !new URLSearchParams(window.location.search).get('i')) return;
    const el = document.getElementById('trends');
    if (el) el.scrollIntoView();
  }, []);
  const uid = useId();
  const problems = [];
  const qi = sp.get('i');
  const s = series.find((x) => x.slug === qi) || series.find((x) => x.slug === DEFAULT_TREND);
  if (qi && s.slug !== qi) problems.push(`The link asked for an indicator we do not have ("${qi.slice(0, 40)}"), so ${s.short} is shown.`);
  const qb = sp.get('basis');
  let basis = qb === 'real' ? 'real' : 'nominal';
  if (qb && !['real', 'nominal'].includes(qb)) problems.push('The link asked for a basis other than nominal or real; nominal is shown.');
  if (basis === 'real' && !s.real) { problems.push(`${s.short} is not money, or has no price adjustment here, so it is shown as published.`); basis = 'nominal'; }
  const vals = basis === 'real' ? s.real : s.values;
  const idx = vals.map((v, i) => (v === null ? null : i)).filter((i) => i !== null);
  const first = idx.length ? idx[0] : null; const last = idx.length ? idx[idx.length - 1] : null;
  const change = first !== null && last !== null && last > first ? vals[last] - vals[first] : null;
  const pct = change !== null && vals[first] > 0 && !/^%/.test(s.unit) ? (change / vals[first]) * 100 : null;
  const groups = [...new Set(series.map((x) => x.group))];
  const unitShown = basis === 'real' ? `${s.unit}, FY ${baseFy} prices` : s.unit;
  const rows = s.labels.map((l, i) => ({ indicator: s.short, period: l, value: vals[i], unit: unitShown, basis: basis === 'real' ? `real (FY ${baseFy} prices, approximate)` : 'as published', published_value: s.values[i], status: vals[i] === null ? 'not available' : 'published', note: vals[i] === null ? s.missingNote : '', source: s.source, source_url: s.sourceUrl }));
  const chartSeries = s.real ? [{ name: 'Nominal', color: 1, values: s.values }, { name: `Real (FY ${baseFy} prices)`, color: 2, dash: true, values: s.real }] : [{ name: s.short, color: 1, values: s.values }];

  return (
    <>
      <section className="card" aria-labelledby="pick-h">
        <h2 id="pick-h">Choose an indicator</h2>
        <form className="controls" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor={`${uid}-i`}>Indicator</label>
            <select id={`${uid}-i`} value={s.slug} onChange={(e) => set({ i: e.target.value, basis: null })}>
              {groups.map((g) => <optgroup key={g} label={g}>{series.filter((x) => x.group === g).map((x) => <option key={x.slug} value={x.slug}>{x.short}</option>)}</optgroup>)}
            </select>
          </div>
          <fieldset className="field">
            <legend>Money values</legend>
            <div className="radios">
              <label><input type="radio" name={`${uid}-b`} checked={basis === 'nominal'} onChange={() => set({ basis: null })} /><span>{s.real ? 'Nominal (as published)' : 'As published'}</span></label>
              <label><input type="radio" name={`${uid}-b`} checked={basis === 'real'} disabled={!s.real} onChange={() => set({ basis: 'real' })} /><span>Real (after prices)</span></label>
            </div>
            <p className="hint">{s.real ? `Real values use the consumer price index, at FY ${baseFy} prices.` : s.basis ? s.basis : 'Not a money value, so no price adjustment applies.'}</p>
          </fieldset>
        </form>
        {problems.length ? <div className="invalid" role="alert">{problems.map((p) => <p key={p} style={{ margin: 0 }}>{p}</p>)}</div> : null}
        <div className="toolbar"><SaveView title={() => `Trend: ${s.short}${basis === 'real' ? ' (real)' : ''}`} /><PrintButton /></div>
      </section>

      <section className="card" aria-labelledby="trend-h">
        <h2 id="trend-h">{s.short}</h2>
        <p className="lead">{unitShown}. {s.labels[0]} to {s.labels[s.labels.length - 1]}.{s.missing.length ? ` Not available: ${s.missing.join(', ')}.` : ''}</p>
        {first === null ? <p className="empty">No values to show for this indicator.</p> : (
          <p className="takeaway" role="status" aria-live="polite">
            {last > first
              ? <>From {show(vals[first], s.dec)} in {s.labels[first]} to {show(vals[last], s.dec)} in {s.labels[last]}: a change of {change >= 0 ? '+' : ''}{show(change, s.dec)} {/^%/.test(s.unit) ? 'percentage points' : s.unit}{pct !== null ? ` (${pct >= 0 ? '+' : ''}${show(pct, 1)} per cent)` : ''}{basis === 'real' ? `, in FY ${baseFy} prices` : ''}.</>
              : <>One value only: {show(vals[first], s.dec)} in {s.labels[first]}.</>}
            {idx.length < s.labels.length ? ' Years without a value are left as gaps.' : ''}
          </p>
        )}
        <LineChart labels={s.labels} series={chartSeries} yFormat={s.dec === 0 ? 'int' : 'one'} valueFormat="auto" unit={s.unit} naText="Not available" ariaLabel={`${s.short}, ${s.labels[0]} to ${s.labels[s.labels.length - 1]}, ${s.unit}`} />
        {s.missing.length ? <p className="muted">Not available ({s.missing.join(', ')}): {s.missingNote}.</p> : null}
        <p className="how"><b>About this series.</b> {s.note} {s.basis ? `${s.basis}.` : ''} {s.real ? <>Real values are at FY {baseFy} prices and approximate; <Link href="/method/#prices">how they are worked out</Link>.</> : ''}</p>
        <div className="toolbar"><DownloadView rows={rows} name={`takwimu-trend-${s.slug}${basis === 'real' ? '-real' : ''}`} meta={{ title: `${s.short} (${basis})`, unit: unitShown, source: s.source }} label="Download this series" /></div>
        <p className="src">Source: <a href={s.sourceUrl}>{s.source}</a>. <Link href={`/datasets/?q=${s.dataset}`}>Dataset and downloads</Link>.</p>
      </section>
    </>
  );
}
