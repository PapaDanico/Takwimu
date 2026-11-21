// Static SVG chart for the print reports (server component, no client script). One tab stop per chart: the figure
// itself is focusable and carries a text summary; the marks inside are not focusable (UX sweep U7). The values are
// always in the table that follows the chart (Report.js), which is the accessible and citable form.
const W = 680;
const M = { t: 12, r: 12, l: 64 };

function niceScale(max) {
  if (!(max > 0)) return { yMax: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  const n = Math.max(Math.ceil(max / step - 1e-9), 1);
  return { yMax: step * n, ticks: Array.from({ length: n + 1 }, (_, i) => step * i) };
}
const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 1 : 0 });

export default function ReportChart({ kind, title, labels, series, unit }) {
  const all = series.flatMap((s) => s.values).filter((v) => v != null);
  const { yMax, ticks } = niceScale(Math.max(0, ...all));
  const slot = (W - M.l - M.r) / labels.length;
  const longest = Math.max(...labels.map((l) => String(l).length));
  const rotate = longest * 5.6 > slot;
  const bottom = rotate ? Math.min(150, 18 + longest * 4.2) : 30;
  const plotH = 190;
  const H = M.t + plotH + bottom;
  const plotW = W - M.l - M.r;
  const yAt = (v) => M.t + plotH - (v / yMax) * plotH;
  const xMid = (i) => M.l + slot * i + slot / 2;
  const groupW = Math.min(slot * 0.78, 40 * series.length);
  const barW = groupW / series.length - 2;
  const held = series.map((s) => s.values.filter((v) => v != null).length);
  const summary = `${title}. Chart of ${series.map((s, k) => `${s.name} (${held[k]} of ${labels.length} periods with a value)`).join('; ')}, ${labels[0]} to ${labels[labels.length - 1]}. Every value, with its source, is in the table below.`;
  return (
    <figure className="rp-chart" tabIndex={0} role="img" aria-label={summary}>
      <figcaption className="rp-cap">{title}</figcaption>
      <ul className="rp-legend" aria-hidden="true">
        {series.map((s, k) => <li key={s.name}><span className={`sw ${kind}`} style={{ background: `var(--s${k + 1})` }} />{s.name}</li>)}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true" focusable="false">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={M.l + plotW} y1={yAt(t)} y2={yAt(t)} stroke="#D6DAE0" strokeWidth="0.8" />
            <text x={M.l - 6} y={yAt(t) + 3.5} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        <text x={4} y={M.t + 2} textAnchor="start" className="unit">{unit}</text>
        {labels.map((l, i) => {
          const x = xMid(i);
          const y = M.t + plotH + 14;
          return rotate
            ? <text key={l} x={x} y={y} textAnchor="end" transform={`rotate(-35 ${x} ${y})`}>{l}</text>
            : <text key={l} x={x} y={y} textAnchor="middle">{l}</text>;
        })}
        {kind === 'column'
          ? labels.map((l, i) => series.map((s, k) => {
            const v = s.values[i];
            if (v == null) return null;
            const x = xMid(i) - groupW / 2 + k * (groupW / series.length) + 1;
            return <rect key={`${l}-${s.name}`} x={x} y={yAt(v)} width={Math.max(barW, 1)} height={Math.max(M.t + plotH - yAt(v), 0)} fill={`var(--s${k + 1})`} />;
          }))
          : series.map((s, k) => {
            const segs = [];
            let cur = [];
            s.values.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([xMid(i), yAt(v)]); });
            if (cur.length) segs.push(cur);
            return (
              <g key={s.name}>
                {segs.map((seg, j) => (seg.length > 1 ? <polyline key={j} points={seg.map((p) => p.join(',')).join(' ')} fill="none" stroke={`var(--s${k + 1})`} strokeWidth="2" /> : null))}
                {s.values.map((v, i) => (v == null ? null : <circle key={i} cx={xMid(i)} cy={yAt(v)} r="3.2" fill={`var(--s${k + 1})`} />))}
              </g>
            );
          })}
        <line x1={M.l} x2={M.l + plotW} y1={M.t + plotH} y2={M.t + plotH} stroke="#31445F" strokeWidth="1" />
      </svg>
    </figure>
  );
}
