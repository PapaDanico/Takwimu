import { fmtNum } from '../lib/format';
// A horizontal bar list: label, bar, value. Plain HTML so it reads well to screen readers and scales
// to any width. Bars start at zero. Pass `compareTo` to draw a thin marker (for example a national average).
export default function BarList({ items, unit, format = (v) => fmtNum(v), label, accent = 'chart' }) {
  const max = Math.max(...items.map((i) => Math.max(i.value, i.compareTo || 0)));
  return (
    <ul className="bl" aria-label={label}>
      {items.map((i) => (
        <li key={i.label} className="bl-row">
          <span className="bl-label">{i.label}{i.sub && <small>{i.sub}</small>}</span>
          <span className="bl-track" aria-hidden="true">
            <span className={`bl-fill ${i.tone || accent}`} style={{ width: `${(i.value / max) * 100}%` }} />
            {i.compareTo != null && <span className="bl-mark" style={{ left: `${(i.compareTo / max) * 100}%` }} />}
          </span>
          <span className="bl-value">{format(i.value)}{unit ? <small>{unit}</small> : null}{i.compareTo != null && <small className="bl-cmp"> vs {format(i.compareTo)}</small>}</span>
        </li>
      ))}
    </ul>
  );
}
