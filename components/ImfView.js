'use client';
// IMF World Economic Outlook for Kenya on /kenya/ (#imf): choose a vintage and an indicator. One vintage is shown at
// a time, so vintages are never mixed. Actual (and estimate) years are a solid line; projection years are a separate
// dashed line labelled "IMF projection", joined at the last non-projection year. The table view lists every year
// with its type. A value withdrawn after editorial review is shown as withdrawn. Choices are held in memory only.
import { useId, useState } from 'react';
import { LineChart } from './Charts';
import TableWrap from './TableWrap';

const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
const TYPE = { actual: 'Actual', estimate: 'IMF estimate', projection: 'IMF projection' };

export default function ImfView({ data }) {
  const uid = useId();
  const [vi, setVi] = useState(0);
  const v = data.vintages[vi];
  const [code, setCode] = useState(v.indicators[0].code);
  const ind = v.indicators.find((i) => i.code === code) || v.indicators[0];
  const pts = ind.points;
  const labels = pts.map((p) => String(p.year));
  const lastObserved = pts.reduce((k, p, i) => (p.type !== 'projection' ? i : k), -1);
  const observed = pts.map((p) => (p.type !== 'projection' && !p.withheld ? p.value : null));
  const projected = pts.map((p, i) => ((p.type === 'projection' || i === lastObserved) && !p.withheld ? p.value : null));
  const negative = pts.some((p) => p.value !== null && p.value < 0);
  return (
    <section className="card" id="imf" aria-labelledby="imf-h">
      <h2 id="imf-h">IMF World Economic Outlook: Kenya</h2>
      <p className="lead">The IMF&rsquo;s own figures and projections for Kenya, one vintage at a time. Years after the IMF&rsquo;s latest actual year are IMF estimates, then <b>{data.projectionLabel}</b> from the edition year: they are forecasts, not observations, and the two vintages are never combined.</p>
      <div className="controls">
        <div className="field">
          <label htmlFor={`${uid}-v`}>Vintage</label>
          <select id={`${uid}-v`} value={vi} onChange={(e) => { const n = Number(e.target.value); setVi(n); if (!data.vintages[n].indicators.some((i) => i.code === code)) setCode(data.vintages[n].indicators[0].code); }}>
            {data.vintages.map((x, i) => <option key={x.vintage} value={i}>{x.vintage} (published {x.published})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-i`}>Indicator</label>
          <select id={`${uid}-i`} value={ind.code} onChange={(e) => setCode(e.target.value)}>
            {v.indicators.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
          </select>
        </div>
      </div>
      <h3 id="imf-chart-h">{ind.name}, {v.vintage} vintage ({ind.unit})</h3>
      {negative ? <p className="src">This indicator has negative values, so it is shown as a table only.</p> : (
        <LineChart labels={labels} unit={ind.unit} yFormat="one" naText="Not in this vintage"
          ariaLabel={`${ind.name}, Kenya, IMF World Economic Outlook ${v.vintage}; projection years shown dashed and labelled IMF projection`}
          series={[{ name: `${v.vintage}: actual and IMF estimate`, color: 1, values: observed }, { name: `${v.vintage}: ${data.projectionLabel}`, color: 2, dash: true, values: projected }]} />
      )}
      {(() => {
        // The full table (every year with its type) is the only view when the chart is withheld; otherwise it is one
        // tap away, closed on load, so the dashboard stays short on a phone.
        const table = (
          <TableWrap label={`${ind.name}, ${v.vintage} vintage, every year with its type`}>
            <table className="data" id="imf-table">
              <caption className="sr-only">{ind.name}, Kenya, IMF World Economic Outlook {v.vintage}: every year with its value and type</caption>
              <thead><tr><th scope="col">Year</th><th scope="col">Value ({ind.unit})</th><th scope="col">Type</th></tr></thead>
              <tbody>
                {pts.map((p) => (
                  <tr key={p.year} className={p.type === 'projection' ? 'imf-proj' : undefined}>
                    <th scope="row">{p.year}</th>
                    {p.withheld ? <td data-obs={p.key} data-obs-state="rejected"><span className="muted withheld">{p.withheld}</span></td> : <td className="num" data-obs={p.key}>{p.value === null ? 'Not published' : fmt(p.value)}</td>}
                    <td>{p.type === 'projection' ? <span className="tag warn">{TYPE[p.type]}</span> : TYPE[p.type] || p.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        );
        return negative ? table : <details className="tableview more"><summary>Every year with its type (table)</summary>{table}</details>;
      })()}
      <p className="src">Source: International Monetary Fund, World Economic Outlook, {v.vintage} (published {v.published}), <a href={ind.sourceUrl} rel="noopener">SDMX series {ind.code}</a>; latest actual year {ind.latestActual}. IMF copyright: link and cite. Where the IMF differs from the CBK beyond definitions, both values are in the <a href="/data/#conflicts">conflict register</a>. IMF values are link and cite only, so none is offered for download: view and cite them here, and get them from the IMF at <a href={ind.sourceUrl} rel="noopener">the SDMX series</a> or <a href="https://www.imf.org/en/Publications/WEO" rel="noopener">imf.org</a> (<a href="/datasets/?q=imf-weo-kenya">catalogue entry</a>). IMF staff documents: {data.documents.map((d, i) => <span key={d.id}>{i ? '; ' : ''}<a href={d.url} rel="noopener">{d.series}</a> ({d.date})</span>)}.</p>
    </section>
  );
}
