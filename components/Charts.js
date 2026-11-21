'use client';
// SVG line and column charts. Sized to their container so text stays readable on a phone.
// Props are plain data (no functions) so server pages can pass them. Every chart ships a table view,
// keyboard-focusable hit areas and a tooltip, and never relies on colour alone: series are also told
// apart by direct labels (wide screens), a legend, and line dash or marker style.
import { useEffect, useRef, useState } from 'react';

const FORMATS = {
  int: (v) => Math.round(v).toLocaleString('en-US'),
  one: (v) => v.toFixed(1),
  two: (v) => v.toFixed(2),
  pct0: (v) => `${Math.round(v)}%`,
  pct1: (v) => `${v.toFixed(1)}%`,
};
const fmt = (kind, v) => (FORMATS[kind] || FORMATS.int)(v);

const niceMax = (max) => {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const f = max / pow;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * pow;
};

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const set = () => setW(Math.max(260, Math.floor(el.getBoundingClientRect().width)));
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function Legend({ series }) {
  if (series.length < 2) return null;
  return (
    <ul className="legend" aria-label="Legend">
      {series.map((s) => (
        <li key={s.name}>
          <svg width="22" height="10" aria-hidden="true">
            {s.kind === 'column'
              ? <rect x="0" y="1" width="22" height="8" rx="2" style={{ fill: `var(--s${s.color})` }} />
              : <line x1="0" y1="5" x2="22" y2="5" strokeWidth="2.5" strokeDasharray={s.dash ? '5 3' : undefined} style={{ stroke: `var(--s${s.color})` }} />}
          </svg>
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function TableView({ labels, series, yFormat, unit, caption }) {
  return (
    <details className="tableview">
      <summary>View as table</summary>
      <div className="tablewrap">
        <table className="data">
          <caption className="sr-only">{caption}</caption>
          <thead><tr><th scope="col">Period</th>{series.map((s) => <th key={s.name} scope="col">{s.name}{unit ? ` (${unit})` : ''}</th>)}</tr></thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={l}>
                <th scope="row">{l}</th>
                {series.map((s) => (
                  <td key={s.name}>
                    {s.values[i] == null ? 'No data' : fmt(yFormat, s.values[i])}
                    {s.alt && s.alt[i] != null ? <small> (other report: {fmt(yFormat, s.alt[i])})</small> : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Tooltip({ at, width, labels, series, yFormat, unit }) {
  if (at == null) return null;
  const left = Math.min(Math.max(at.x, 90), width - 90);
  return (
    <div className="ctip" style={{ left, top: 4 }} role="status">
      <b>{labels[at.i]}</b>
      {series.map((s) => (
        <span key={s.name}>
          <i style={{ background: `var(--s${s.color})` }} aria-hidden="true" />
          {s.name}: <strong>{s.values[at.i] == null ? 'No data' : `${fmt(yFormat, s.values[at.i])}${unit ? ` ${unit}` : ''}`}</strong>
          {s.alt && s.alt[at.i] != null ? <em> (other report: {fmt(yFormat, s.alt[at.i])})</em> : null}
        </span>
      ))}
    </div>
  );
}

const M = { l: 48, t: 14, b: 34 };

const CHAR = 6.4; // approximate width of one axis character at 11px
function layout(width, labels, columns) {
  const wide = width >= 560;
  const right = wide ? 96 : 14;
  const h = width < 420 ? 250 : 310;
  const plotW = width - M.l - right;
  const slot = plotW / Math.max(columns ? labels.length : labels.length - 1, 1);
  const longest = Math.max(...labels.map((l) => l.length));
  const longestWord = Math.max(...labels.map((l) => Math.max(...l.split(' ').map((w) => w.length))));
  let mode = 'flat';
  let every = 1;
  if (longest * CHAR > slot * 0.92) {
    if (longest <= 6) every = Math.ceil((longest * CHAR * 1.2) / slot); // short labels: show every nth
    else if (longestWord * CHAR <= slot * 0.92 && labels.some((l) => l.includes(' '))) mode = 'wrap';
    else mode = 'rotate';
  }
  const bottom = mode === 'rotate' ? 20 + longest * CHAR * 0.64 : mode === 'wrap' ? 46 : 34;
  const plotH = h - M.t - bottom;
  return { wide, right, h, plotW, plotH, mode, bottom, every };
}

function Axes({ L, ticks, yMax, yFormat, labels, xAt }) {
  const every = L.every;
  return (
    <g>
      {ticks.map((t) => {
        const y = M.t + L.plotH - (t / yMax) * L.plotH;
        return (
          <g key={t}>
            <line x1={M.l} x2={M.l + L.plotW} y1={y} y2={y} strokeWidth="1" style={{ stroke: t === 0 ? 'var(--sand-400)' : 'var(--rule)' }} />
            <text x={M.l - 8} y={y + 4} textAnchor="end">{fmt(yFormat, t)}</text>
          </g>
        );
      })}
      {labels.map((l, i) => {
        if (i % every !== 0) return null;
        const x = xAt(i);
        const y = M.t + L.plotH + 18;
        if (L.mode === 'rotate') return <text key={l} x={x + 4} y={y} textAnchor="end" transform={`rotate(-40 ${x + 4} ${y})`}>{l}</text>;
        if (L.mode === 'wrap' && l.includes(' ')) {
          const mid = l.lastIndexOf(' ');
          return <text key={l} x={x} y={y} textAnchor="middle"><tspan x={x}>{l.slice(0, mid)}</tspan><tspan x={x} dy="13">{l.slice(mid + 1)}</tspan></text>;
        }
        return <text key={l} x={x} y={y} textAnchor="middle">{l}</text>;
      })}
    </g>
  );
}

export function LineChart({ labels, series, yFormat = 'int', unit = '', ariaLabel, caption, yMaxFixed, refLine }) {
  const [ref, width] = useWidth();
  const [at, setAt] = useState(null);
  const L = layout(width, labels, false);
  const all = series.flatMap((s) => [...s.values, ...(s.alt || [])]).filter((v) => v != null);
  const yMax = yMaxFixed || niceMax(Math.max(...all, refLine ? refLine.value : 0));
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
  const xAt = (i) => M.l + (labels.length === 1 ? L.plotW / 2 : (i / (labels.length - 1)) * L.plotW);
  const yAt = (v) => M.t + L.plotH - (v / yMax) * L.plotH;
  const slot = L.plotW / Math.max(labels.length - 1, 1);

  // Direct labels sit at each line's last point; nudge them apart so they never overlap.
  const ends = series.map((s) => {
    const idx = s.values.reduce((a, v, i) => (v != null ? i : a), -1);
    return idx >= 0 ? { name: s.name, x: xAt(idx), y: yAt(s.values[idx]) + 4 } : null;
  }).filter(Boolean).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i += 1) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;

  return (
    <figure className="chart" ref={ref}>
      <Legend series={series.map((s) => ({ ...s, kind: 'line' }))} />
      <div className="chart-frame" onMouseLeave={() => setAt(null)}>
        <svg width={width} height={L.h} role="group" aria-label={ariaLabel}>
          <Axes L={L} ticks={ticks} yMax={yMax} yFormat={yFormat} labels={labels} xAt={xAt} />
          {refLine && (
            <g>
              <line x1={M.l} x2={M.l + L.plotW} y1={yAt(refLine.value)} y2={yAt(refLine.value)} strokeWidth="1.5" strokeDasharray="2 4" style={{ stroke: 'var(--ink-muted)' }} />
              <text x={M.l + L.plotW} y={yAt(refLine.value) - 5} textAnchor="end">{refLine.label}</text>
            </g>
          )}
          {at && <line x1={xAt(at.i)} x2={xAt(at.i)} y1={M.t} y2={M.t + L.plotH} strokeWidth="1" style={{ stroke: 'var(--ink-faint)' }} />}
          {series.map((s) => {
            const segs = [];
            let cur = [];
            s.values.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([xAt(i), yAt(v)]); });
            if (cur.length) segs.push(cur);
            return (
              <g key={s.name}>
                {segs.map((seg, k) => (seg.length > 1 ? <polyline key={k} points={seg.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash ? '6 4' : undefined} style={{ stroke: `var(--s${s.color})` }} /> : null))}
                {s.values.map((v, i) => (v == null ? null : <circle key={i} cx={xAt(i)} cy={yAt(v)} r={at && at.i === i ? 5 : 3.5} strokeWidth="2" style={{ fill: s.hollowAt && s.hollowAt.includes(i) ? 'var(--surface)' : `var(--s${s.color})`, stroke: s.hollowAt && s.hollowAt.includes(i) ? `var(--s${s.color})` : 'var(--surface)' }} />))}
                {(s.alt || []).map((v, i) => (v == null ? null : <circle key={`a${i}`} cx={xAt(i)} cy={yAt(v)} r="4" strokeWidth="2" style={{ fill: 'var(--surface)', stroke: `var(--s${s.color})` }} />))}
              </g>
            );
          })}
          {L.wide && ends.map((e) => <text key={e.name} x={e.x + 10} y={e.y} style={{ fill: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--sans)' }}>{e.name}</text>)}
          {labels.map((l, i) => (
            <rect key={l} x={xAt(i) - slot / 2} y={M.t} width={slot} height={L.plotH} fill="transparent" tabIndex={0} role="img"
              aria-label={`${l}: ${series.map((s) => `${s.name} ${s.values[i] == null ? 'no data' : fmt(yFormat, s.values[i])}`).join(', ')}`}
              onMouseEnter={() => setAt({ i, x: xAt(i) })} onFocus={() => setAt({ i, x: xAt(i) })} onBlur={() => setAt(null)} />
          ))}
        </svg>
        <Tooltip at={at} width={width} labels={labels} series={series} yFormat={yFormat} unit={unit} />
      </div>
      <TableView labels={labels} series={series} yFormat={yFormat} unit={unit} caption={caption || ariaLabel} />
    </figure>
  );
}

export function ColumnChart({ labels, series, yFormat = 'int', unit = '', ariaLabel, caption, yMaxFixed, refLine }) {
  const [ref, width] = useWidth();
  const [at, setAt] = useState(null);
  const L = layout(width, labels, true);
  const all = series.flatMap((s) => s.values).filter((v) => v != null);
  const yMax = yMaxFixed || niceMax(Math.max(...all, refLine ? refLine.value : 0));
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
  const slotW = L.plotW / labels.length;
  const xCenter = (i) => M.l + slotW * i + slotW / 2;
  const groupW = Math.min(slotW * 0.78, 56 * series.length);
  const barW = groupW / series.length - 2;
  const yAt = (v) => M.t + L.plotH - (v / yMax) * L.plotH;
  const base = M.t + L.plotH;
  const bar = (x, w, top) => {
    const r = Math.min(4, w / 2, base - top);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
  };

  return (
    <figure className="chart" ref={ref}>
      <Legend series={series.map((s) => ({ ...s, kind: 'column' }))} />
      <div className="chart-frame" onMouseLeave={() => setAt(null)}>
        <svg width={width} height={L.h} role="group" aria-label={ariaLabel}>
          <Axes L={L} ticks={ticks} yMax={yMax} yFormat={yFormat} labels={labels} xAt={xCenter} />
          {refLine && (
            <g>
              <line x1={M.l} x2={M.l + L.plotW} y1={yAt(refLine.value)} y2={yAt(refLine.value)} strokeWidth="1.5" strokeDasharray="2 4" style={{ stroke: 'var(--ink-muted)' }} />
              <text x={M.l + L.plotW} y={yAt(refLine.value) - 5} textAnchor="end">{refLine.label}</text>
            </g>
          )}
          {at && <rect x={M.l + slotW * at.i} y={M.t} width={slotW} height={L.plotH} style={{ fill: 'var(--sand-200)', opacity: 0.55 }} />}
          {labels.map((l, i) => series.map((s, k) => {
            const v = s.values[i];
            if (v == null) return null;
            const x = xCenter(i) - groupW / 2 + k * (groupW / series.length) + 1;
            return <path key={`${l}${s.name}`} d={bar(x, barW, yAt(v))} style={{ fill: `var(--s${s.color})` }} />;
          }))}
          {labels.map((l, i) => (
            <rect key={`h${l}`} x={M.l + slotW * i} y={M.t} width={slotW} height={L.plotH} fill="transparent" tabIndex={0} role="img"
              aria-label={`${l}: ${series.map((s) => `${s.name} ${s.values[i] == null ? 'no data' : fmt(yFormat, s.values[i])}`).join(', ')}`}
              onMouseEnter={() => setAt({ i, x: xCenter(i) })} onFocus={() => setAt({ i, x: xCenter(i) })} onBlur={() => setAt(null)} />
          ))}
        </svg>
        <Tooltip at={at} width={width} labels={labels} series={series} yFormat={yFormat} unit={unit} />
      </div>
      <TableView labels={labels} series={series} yFormat={yFormat} unit={unit} caption={caption || ariaLabel} />
    </figure>
  );
}
