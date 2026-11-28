import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import PageToc from '../../../../components/PageToc';
import WardMap from '../../../../components/WardMap';
import CountyNav from '../../../../components/county/CountyNav';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import AbstractTables from '../../../../components/county/AbstractTables';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('education');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/education/`, { title: `${m.name}: education`, description: `${m.name} County education statistics from the KNBS County Statistical Abstract 2024: early childhood (ECDE) centres, enrolment, teachers and facilities by ward; primary, secondary, adult and special needs schools and teachers by sub-county, 2019-2023, each table as printed with its page.` });
}

const short = (t) => t.title.replace(/^Table [\d.]+:\s*/, '').replace(/ by Sub County.*$/, '').replace(/,? \d{4}-\d{4}$/, '');

export default function CountyEducation({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const tables = cp.abstractTables(slug, cp.sectorTables(slug, 'education'));
  const ward = tables.filter((t) => /Ward/.test(t.title));
  const sub = tables.filter((t) => !/Ward/.test(t.title));
  const { wardsGeo } = cp.wards(slug);
  const enr = cp.wardValues(slug, 'csa24-1.3.4', '2023: Total', 'ECDE enrolment, 2023 (all centres)');
  const base = `/counties/${slug}/education/`;
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Education" title="Education"
        sub={`Early childhood centres, schools, learners and teachers in ${m.name} County, 2019 to 2023, from the county statistical abstract: each table as KNBS and the county printed it, with its page.`}
        path={base} shareText={`${m.name}: education statistics`} />
      <PageToc items={[['ed-map', 'ECDE enrolment by ward (map)'], ...ward.map((t) => [`t-${t.id}`, short(t)]), ...sub.map((t) => [`t-${t.id}`, short(t)])]} />
      <section className="card gold" aria-labelledby="ed-read">
        <h2 id="ed-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Early childhood development education (ECDE) is a county function; primary and secondary schools are national. The abstract gives ECDE by ward and the other levels by KNBS sub-county; each table keeps its own level.</li>
          <li>Every table is reproduced row by row as printed in the Kisumu County Statistical Abstract 2024, with the department that supplied it in its source line. A cell the abstract does not print is shown as not printed, never as zero.</li>
          <li>Rows are wards or KNBS sub-counties as printed (including Kadibo, which has no IEBC constituency). Totals are the abstract&rsquo;s own; nothing is added up here.</li>
        </ul>
      </section>

      {enr ? (
        <section className="card" aria-labelledby="ed-map">
          <h2 id="ed-map">ECDE enrolment by ward, 2023</h2>
          <WardMap geo={wardsGeo} countyName={m.name} mapId="edmap" values={enr.values} valueLabel={enr.label} valueUnit="children"
            ariaLabel={`Map of the wards of ${m.name} County shaded by ECDE enrolment in 2023`} caption={`Shading: ${enr.table}, column "2023: Total" (public and private centres).`} />
          <p className="how">Source: <a href={enr.src_url} rel="noopener">{enr.src_title}</a>, {enr.table}, PDF p. {enr.pdf_page}{enr.printed_page ? ` (printed p. ${enr.printed_page})` : ''}; published {enr.published}; confidence {enr.confidence} of 5. The abstract prints Kobura under the KNBS sub-county Kadibo; the ward is the IEBC ward Kobura (Nyando constituency), matched by name. Ward totals are as printed and are not compared with population, because no ward population for 2023 is published.</p>
          {enr.unmatched.length ? <p className="how">Printed but not placed on the map: {enr.unmatched.map((u) => `${u.row} (${u.value})`).join('; ')}.</p> : null}
        </section>
      ) : null}

      <AbstractTables tables={[...ward, ...sub]} />
      <p className="src wrap">See also <Link href={`/counties/${slug}/wards/`}>wards and constituencies</Link> and the <Link href={`/counties/${slug}/sources/`}>{m.name} sources</Link>.</p>
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
