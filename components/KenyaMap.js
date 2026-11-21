// Map of Kenya's 47 counties. Each county is a link. Published counties are shaded; the rest are neutral and say
// "in preparation" in their label, so colour is never the only signal. With `focus`, the view zooms to one county.
import Link from 'next/link';
import geo from '../data/kenya-counties-map.json';
import { bySlug } from '../lib/counties';

export default function KenyaMap({ focus, ariaLabel = 'Map of Kenya showing its 47 counties' }) {
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
  return (
    <figure className={`kmap${focus ? ' kmap-focus' : ''}`}>
      <svg viewBox={box} role="group" aria-label={ariaLabel} className="kmap-svg">
        {geo.areas.map((a) => {
          const c = bySlug(a.slug);
          const state = a.slug === focus ? 'focus' : c && c.published ? 'live' : 'soon';
          return (
            <Link key={a.slug} href={`/counties/${a.slug}/`} aria-label={`${a.name}: ${c && c.published ? 'published' : 'in preparation'}`} aria-current={a.slug === focus ? 'page' : undefined}>
              <path d={a.d} className={`kmap-area ${state}`} strokeWidth="1" />
            </Link>
          );
        })}
      </svg>
      <figcaption className="how">
        <span className="kmap-key"><i className="kmap-sw live" /> Published</span>
        <span className="kmap-key"><i className="kmap-sw soon" /> In preparation</span>
        Boundaries: {geo.meta.source}, {geo.meta.licence}, simplified for display. Not for measuring area or distance.
      </figcaption>
    </figure>
  );
}
