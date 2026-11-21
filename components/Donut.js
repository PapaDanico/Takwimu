// Donut chart for a small number of parts of one whole (six at most). Segments are separated by a 2 px gap,
// every segment is labelled in the legend with its value and share, and the same numbers are in the list,
// so colour is never the only way to tell parts apart.
const R = 72;
const C = 2 * Math.PI * R;

export default function Donut({ items, centerValue, centerLabel, format = (v) => v.toLocaleString('en-US'), unit = '', ariaLabel }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const gap = items.length > 1 ? 2.2 : 0;
  let offset = 0;
  return (
    <figure className="donut">
      <svg viewBox="0 0 200 200" role="img" aria-label={ariaLabel} width="200" height="200">
        <g transform="rotate(-90 100 100)">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="30" style={{ stroke: 'var(--track)', opacity: 0.35 }} />
          {items.map((it, k) => {
            const len = Math.max((it.value / total) * C - gap, 0.5);
            const el = (
              <circle key={it.label} cx="100" cy="100" r={R} fill="none" strokeWidth="30" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} style={{ stroke: `var(--s${it.color || k + 1})` }}>
                <title>{`${it.label}: ${format(it.value)}${unit} (${((it.value / total) * 100).toFixed(1)}%)`}</title>
              </circle>
            );
            offset += (it.value / total) * C;
            return el;
          })}
        </g>
        {centerValue && <text x="100" y="98" textAnchor="middle" className="donut-v">{centerValue}</text>}
        {centerLabel && <text x="100" y="118" textAnchor="middle" className="donut-l">{centerLabel}</text>}
      </svg>
      <figcaption>
        <ul className="donut-legend">
          {items.map((it, k) => (
            <li key={it.label}>
              <i style={{ background: `var(--s${it.color || k + 1})` }} aria-hidden="true" />
              <span className="dl-name">{it.label}</span>
              <span className="dl-val">{format(it.value)}{unit}<small>{((it.value / total) * 100).toFixed(1)}%</small></span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
