// A row of headline numbers, each with a small trend line. Sparklines are decoration for the number beside
// them (aria-hidden); the exact values live in the charts and tables below.
function Spark({ values }) {
  const pts = values.filter((v) => v != null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const W = 96;
  const H = 30;
  const x = (i) => (i / (values.length - 1)) * (W - 6) + 3;
  const y = (v) => H - 4 - ((v - min) / (max - min || 1)) * (H - 8);
  // Split at missing years so a gap is shown as a gap, never joined.
  const segs = [];
  let cur = [];
  values.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(`${x(i)},${y(v)}`); });
  if (cur.length) segs.push(cur);
  const lastI = values.reduce((a, v, i) => (v != null ? i : a), 0);
  return (
    <svg className="spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {segs.map((seg, k) => (seg.length > 1
        ? <polyline key={k} points={seg.join(' ')} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--s1)' }} />
        : null))}
      <circle cx={x(lastI)} cy={y(values[lastI])} r="3" strokeWidth="2" style={{ fill: 'var(--s1)', stroke: 'var(--surface)' }} />
    </svg>
  );
}

export default function StatStrip({ items, label }) {
  return (
    <ul className="statstrip" aria-label={label}>
      {items.map((it) => (
        <li key={it.label} className="stat">
          <span className="stat-l">{it.label}</span>
          <span className="stat-v">{it.value}{it.unit ? <small> {it.unit}</small> : null}</span>
          {it.delta ? <span className={`stat-d ${it.tone || ''}`}>{it.delta}</span> : null}
          {it.note ? <span className="stat-n">{it.note}</span> : null}
          {it.href ? <a className="stat-n" href={it.href}>{it.link || 'Details'}</a> : null}
          {it.spark ? <Spark values={it.spark} /> : null}
        </li>
      ))}
    </ul>
  );
}
