// Map of Siaya County's six sub-counties shaded by one measure. Boundaries are real (data/siaya-boundaries.json),
// shading is a single-hue scale (light to dark = low to high) with the value written on each area and in the
// list beside the map, so colour is never the only way to read it.
import geo from '../data/siaya-boundaries.json';
import { fmtNum } from '../lib/format';
import { equalSteps, STEPS } from '../lib/scale';


export default function SiayaMap({ values, unit, title, ariaLabel, format = (v) => fmtNum(v) }) {
  const list = geo.areas.map((a) => ({ ...a, v: values[a.id] }));
  const nums = list.map((a) => a.v).filter((v) => typeof v === 'number');
  const scale = equalSteps(nums);
  const { min, max } = scale;
  const bin = (v) => scale.bin(v) - 1; // 0-based step, drawn as opacity
  const cuts = Array.from({ length: STEPS + 1 }, (_, i) => min + ((max - min) * i) / STEPS);
  const ranked = [...list].sort((a, b) => b.v - a.v);
  const { width, height } = geo.meta;
  return (
    <figure className="sc-map">
      <div className="sc-map-body">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="sc-map-svg">
          <title>{title}</title>
          {list.map((a) => (
            <path key={a.id} d={a.d} className="sc-area" strokeWidth="2" style={{ fill: 'var(--s1)', fillOpacity: 0.16 + 0.17 * bin(a.v) }}>
              <title>{`${a.name}: ${format(a.v)} ${unit}`}</title>
            </path>
          ))}
          {list.map((a) => (
            <text key={`t${a.id}`} x={a.cx} y={a.cy} textAnchor="middle" className="sc-label">
              <tspan x={a.cx} dy="-2">{a.name}</tspan>
              <tspan x={a.cx} dy="16" className="sc-label-v">{format(a.v)}</tspan>
            </text>
          ))}
        </svg>
        <div className="sc-map-side">
          <p className="chart-title" style={{ margin: 0 }}>{title}</p>
          <ol className="sc-rank">
            {ranked.map((a) => (
              <li key={a.id}><span className="sc-chip" style={{ fillOpacity: 0 }}><i style={{ background: 'var(--s1)', opacity: 0.16 + 0.17 * bin(a.v) }} aria-hidden="true" /></span>{a.name}<b>{format(a.v)}</b></li>
            ))}
          </ol>
          <div className="sc-scale" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => <i key={i} style={{ background: 'var(--s1)', opacity: 0.16 + 0.17 * i }} />)}
          </div>
          <div className="sc-scale-l" aria-hidden="true"><span>{format(Math.round(cuts[0]))}</span><span>{unit}</span><span>{format(Math.round(cuts[STEPS]))}</span></div>
        </div>
      </div>
      <figcaption className="how">Boundaries: {geo.meta.source}, {geo.meta.licence}, boundary year {geo.meta.boundary_year}, simplified for display. {geo.meta.note} Shading is not to scale for area.</figcaption>
    </figure>
  );
}
