// Map of Kenya's 47 counties. Each county is a link. Published counties are shaded; the rest are neutral and say
// "in preparation" in their label, so colour is never the only signal. With `focus`, the view zooms to one county.
// With `values` ({ slug: number | null }), the map shades each county on a single-hue scale of five equal steps
// between the lowest and highest value, with a legend; counties without a value are hatched and labelled
// "not available". Every value is also in the link's label and in the table beside the map.
import Link from 'next/link';
import geo from '../data/kenya-counties-map.json';
import { bySlug } from '../lib/counties';

const STEPS = 5;
const show = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function mapScale(values) {
  const xs = Object.values(values).filter((v) => typeof v === 'number');
  if (!xs.length) return null;
  const min = Math.min(...xs); const max = Math.max(...xs);
  const step = (max - min) / STEPS;
  const bin = (v) => (typeof v !== 'number' ? null : step === 0 ? STEPS : Math.min(STEPS, Math.floor((v - min) / step) + 1));
  return { min, max, step, bin, bins: Array.from({ length: STEPS }, (_, i) => [min + step * i, i === STEPS - 1 ? max : min + step * (i + 1)]) };
}

export default function KenyaMap({ focus, ariaLabel = 'Map of Kenya showing its 47 counties', values, valueUnit = '', valueDec = 0, valueLabel, valueNotes = {}, mapId = 'kmap', boundaryNote = false }) {
  const { width, height } = geo.meta;
  let box = `0 0 ${width} ${height}`;
  if (focus) {
    const a = geo.areas.find((x) => x.slug === focus);
    if (a) {
      const [x0, y0, x1, y1] = a.bbox;
      const m = Math.max(x1 - x0, y1 - y0) * 0.9 + 24;
      const cx = (x0 + x1) / 2; const cy = (y0 + y1) / 2;
      box = `${(cx - m).toFixed(1)} ${(cy - m).toFixed(1)} ${(2 * m).toFixed(1)} ${(2 * m).toFixed(1)}`;
    }
  }
  const scale = values ? mapScale(values) : null;
  const fmtV = (v) => `${show(v, valueDec)}${valueUnit === '%' ? '%' : valueUnit ? ` ${valueUnit}` : ''}`;
  return (
    <figure className={`kmap${focus ? ' kmap-focus' : ''}${values ? ' kmap-values' : ''}`}>
      <svg viewBox={box} role="group" aria-label={ariaLabel} className="kmap-svg">
        {values ? (
          <defs>
            <pattern id={`${mapId}-na`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" className="kmap-na-bg" />
              <line x1="0" y1="0" x2="0" y2="6" className="kmap-na-line" strokeWidth="2" />
            </pattern>
          </defs>
        ) : null}
        {geo.areas.map((a) => {
          const c = bySlug(a.slug);
          if (values) {
            const v = values[a.slug];
            const b = scale ? scale.bin(v) : null;
            return (
              <Link key={a.slug} href={`/counties/${a.slug}/`} aria-label={`${a.name}: ${typeof v === 'number' ? fmtV(v) : 'not available'}${valueNotes[a.slug] ? `. Note: ${valueNotes[a.slug]}` : ''}`}>
                <path d={a.d} className={`kmap-area ${b ? `q${b}` : 'na'}`} style={b ? undefined : { fill: `url(#${mapId}-na)` }} strokeWidth="1"><title>{`${a.name}: ${typeof v === 'number' ? fmtV(v) : 'not available'}${valueNotes[a.slug] ? ` (${valueNotes[a.slug]})` : ''}`}</title></path>
              </Link>
            );
          }
          const state = a.slug === focus ? 'focus' : c && c.published ? 'live' : 'soon';
          return (
            <Link key={a.slug} href={`/counties/${a.slug}/`} aria-label={`${a.name}: ${c && c.published ? 'published' : 'in preparation'}`} aria-current={a.slug === focus ? 'page' : undefined}>
              <path d={a.d} className={`kmap-area ${state}`} strokeWidth="1" />
            </Link>
          );
        })}
      </svg>
      <figcaption className="how">
        {values ? (
          <span className="kmap-legend">
            <b>{valueLabel}</b>
            {scale ? <span className="kmap-legend-note">Five equal steps from the lowest to the highest value. Each shade stands for the range beside it in this key; no shade means better or worse.</span> : null}
            <span className="kmap-legend-row">
              {scale ? scale.bins.map(([lo, hi], i) => <span key={i} className="kmap-key"><i className={`kmap-sw q${i + 1}`} />{fmtV(lo)} to {fmtV(hi)}</span>) : null}
              <span className="kmap-key"><i className="kmap-sw na" /> Not available</span>
            </span>
          </span>
        ) : (
          <>
            <span className="kmap-key"><i className="kmap-sw live" /> Published</span>
            <span className="kmap-key"><i className="kmap-sw soon" /> In preparation</span>
          </>
        )}
        {boundaryNote ? <span id="boundaries">Boundaries: {geo.meta.source}, {geo.meta.licence}, simplified for display. Not for measuring area or distance.</span> : <a href="/counties/#boundaries">About the map boundaries</a>}
      </figcaption>
    </figure>
  );
}
