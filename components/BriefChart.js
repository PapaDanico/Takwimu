// Small static line chart for the printable brief (server-rendered SVG, no script, so it prints exactly as shown).
// Gaps (null) break the line and are never bridged. Reference lines are drawn dashed with their label. The brief
// prints the same values in a table beside each chart, which is the chart's table view.
const W = 320;
const H = 170;
const M = { l: 40, r: 8, t: 12, b: 24 };

const niceMax = (v) => { const p = 10 ** Math.floor(Math.log10(v || 1)); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };

export default function BriefChart({ labels, series, refLines = [], unit, ariaLabel, fmt = (v) => String(v) }) {
  const all = series.flatMap((s) => s.values).filter((v) => typeof v === 'number').concat(refLines.map((r) => r.value));
  const max = niceMax(Math.max(...all, 1) * 1.05);
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;
  const x = (i) => M.l + (labels.length < 2 ? pw / 2 : (i * pw) / (labels.length - 1));
  const y = (v) => M.t + ph - (v / max) * ph;
  const ticks = [0, max / 2, max];
  const runs = (vals) => vals.reduce((acc, v, i) => { if (typeof v !== 'number') acc.push([]); else acc[acc.length - 1].push([x(i), y(v)]); return acc; }, [[]]).filter((r) => r.length);
  return (
    <figure className="brief-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="bc-grid" /><text x={M.l - 4} y={y(t) + 3} textAnchor="end" className="bc-axis">{fmt(t)}</text></g>)}
        {labels.map((l, i) => ((labels.length - 1 - i) % 2 === 0 ? <text key={l} x={x(i)} y={H - 6} textAnchor={i === labels.length - 1 ? "end" : "middle"} className="bc-axis">{l}</text> : null))}
        {refLines.map((r, i) => <g key={r.label}><line x1={M.l} x2={W - M.r} y1={y(r.value)} y2={y(r.value)} className="bc-ref" /><text x={i % 2 ? M.l + 3 : W - M.r} y={y(r.value) - 3} textAnchor={i % 2 ? 'start' : 'end'} className="bc-axis">{r.label}</text></g>)}
        {series.map((s) => (
          <g key={s.name} style={{ stroke: `var(--s${s.color})`, fill: `var(--s${s.color})` }}>
            {runs(s.values).map((r, k) => (r.length > 1 ? <polyline key={k} points={r.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="1.8" strokeDasharray={s.dash ? '4 3' : undefined} /> : null))}
            {runs(s.values).flat().map(([cx, cy], k) => <circle key={k} cx={cx} cy={cy} r="2.2" stroke="none" />)}
          </g>
        ))}
      </svg>
      <figcaption className="bc-legend">{unit}. {series.map((s) => <span key={s.name}><i style={{ background: `var(--s${s.color})` }} aria-hidden="true" />{s.name}{s.dash ? ' (dashed)' : ''}</span>)}</figcaption>
    </figure>
  );
}
