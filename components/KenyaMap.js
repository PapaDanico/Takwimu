// Map of Kenya's 47 counties. Each county is a link. Published counties are shaded; the rest are neutral and say
// "in preparation" in their label, so colour is never the only signal. With `focus`, the view zooms to one county.
// With `values` ({ slug: number | null }), the map shades each county on a single-hue scale of five equal steps
// between the lowest and highest value, with a legend; counties without a value are hatched and labelled
// "not available". Every value is also in the link's label and in the table beside the map. With `boundaryNote`, the
// boundary source and licence are printed, with `licenceNote` (lib/correction-notes.js) as its correction footnote.
import Link from 'next/link';
import geo from '../data/kenya-counties-map.json';
import { bySlug, COUNTIES } from '../lib/counties';
import { fmtFixed } from '../lib/format';
import { equalSteps, legendItems, STEPS_NOTE } from '../lib/scale';
import CorrectionNote, { CorrectionMark } from './CorrectionNote';

const show = (v, dec) => fmtFixed(v, dec);

export const mapScale = (values) => equalSteps(Object.values(values));

export default function KenyaMap({ focus, ariaLabel = 'Map of Kenya showing its 47 counties', values, valueUnit = '', valueDec = 0, valueLabel, valueNotes = {}, mapId = 'kmap', boundaryNote = false, licenceNote = null }) {
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
  // Design review P2-4/P2-6: the 47 county links are 47 tab stops, so a skip link (shown on focus) jumps past them;
  // the map without values also has a list view (county and status), which is the keyboard and screen-reader route.
  const after = values ? `${mapId}-after` : `${mapId}-list`;
  const byName = [...geo.areas].sort((x, y) => x.name.localeCompare(y.name));
  return (
    <>
    <a className="skip-map" href={`#${after}`}>Skip the map{values ? '' : ': go to the list of counties'}</a>
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
            {scale ? <span className="kmap-legend-note">{STEPS_NOTE}. Each shade stands for the range beside it in this key; no shade means better or worse.</span> : null}
            <span className="kmap-legend-row">
              {legendItems(scale, fmtV).map((k) => <span key={k.step} className="kmap-key"><i className={`kmap-sw q${k.step}`} />{k.text}</span>)}
              <span className="kmap-key"><i className="kmap-sw na" /> Not available</span>
            </span>
          </span>
        ) : (
          <>
            <span className="kmap-key"><i className="kmap-sw live" /> Published</span>
            <span className="kmap-key"><i className="kmap-sw soon" /> In preparation</span>
          </>
        )}
        {boundaryNote ? <span id="boundaries">Boundaries: {geo.meta.source}, {geo.meta.licence}<CorrectionMark notes={licenceNote} />, simplified for display. Not for measuring area or distance.<CorrectionNote notes={licenceNote} /></span>
          : <span className="kmap-src">Boundaries: geoBoundaries gbOpen Kenya ADM1, retrieved {geo.meta.retrieved}, simplified for display. <a className="kmap-blink" href="/counties/#boundaries">Source and licence</a></span>}
      </figcaption>
      {values ? null : (
        <details className="tableview" id={after}>
          <summary>View as list: {COUNTIES.length} counties and their status</summary>
          <div className="tablewrap" tabIndex={0} role="region" aria-label="Counties and their status">
            <table className="data">
              <caption className="sr-only">Kenya&apos;s {COUNTIES.length} counties and whether each is published on Takwimu Kenya</caption>
              <thead><tr><th scope="col">County</th><th scope="col">Status</th></tr></thead>
              <tbody>{byName.map((a) => { const c = bySlug(a.slug); return <tr key={a.slug}><th scope="row"><Link href={`/counties/${a.slug}/`} aria-current={a.slug === focus ? 'page' : undefined}>{a.name}</Link></th><td>{c && c.published ? 'Published' : 'In preparation'}{a.slug === focus ? ' (this county)' : ''}</td></tr>; })}</tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
    {values ? <span id={after} tabIndex={-1} /> : null}
    </>
  );
}
