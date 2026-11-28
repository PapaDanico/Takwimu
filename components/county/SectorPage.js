import Link from 'next/link';
import PageHead from '../PageHead';
import PageToc from '../PageToc';
import CountyNav from './CountyNav';
import CountyProvisional from './CountyProvisional';
import AbstractTables from './AbstractTables';
import * as cp from '../../lib/county-pages';

// A sector page built only from the county statistical abstract tables the registry makes public for that sector
// (lib/county-registry.js public_tables). Each table is shown as printed; `extra` adds sector-specific notes, `also`
// links pages where related figures are already shown.
const short = (t) => t.title.replace(/^Table [\d.]+:\s*/, '').replace(/ by Sub County.*$/, '').replace(/,? \d{4}(-\d{4}| and \d{4})?$/, '');

export default function SectorPage({ slug, page, sector, title, sub, notes = [], also = [], exclude = [] }) {
  const m = cp.meta(slug);
  const tables = cp.abstractTables(slug, cp.sectorTables(slug, sector).filter((t) => !exclude.includes(t)));
  const base = `/counties/${slug}/${page}/`;
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow={title} title={title} sub={sub} path={base} shareText={`${m.name}: ${title.toLowerCase()}`} />
      <PageToc items={tables.map((t) => [`t-${t.id}`, short(t)])} />
      <section className="card gold" aria-labelledby="s-read">
        <h2 id="s-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Every table is reproduced row by row as printed in the Kisumu County Statistical Abstract 2024 (KNBS with the County Government), with the office that supplied it in its source line. A cell the abstract does not print is shown as not printed, never as zero, and totals are the abstract&rsquo;s own.</li>
          <li>Rows are KNBS sub-counties (including Kadibo, which has no IEBC constituency), categories or groups as printed.</li>
          {notes.map((n) => <li key={n}>{n}</li>)}
          {also.length ? <li>Related figures: {also.map(([h, t], i) => <span key={h}>{i ? '; ' : ''}<Link href={h}>{t}</Link></span>)}.</li> : null}
        </ul>
      </section>
      <AbstractTables tables={tables} />
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
