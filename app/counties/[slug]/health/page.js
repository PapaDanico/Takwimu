import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import PageToc from '../../../../components/PageToc';
import CountyNav from '../../../../components/county/CountyNav';
import CountyProvisional from '../../../../components/county/CountyProvisional';
import AbstractTables from '../../../../components/county/AbstractTables';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('health');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/health/`, { title: `${m.name}: health`, description: `${m.name} County health statistics from the KNBS County Statistical Abstract 2024: community health promoters by ward, bed capacity, cancer cases and screening, HIV clients on treatment, malaria cases and deaths and outpatient use by sub-county, 2019-2023, each table as printed with its page.` });
}

export default function CountyHealth({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const tables = cp.abstractTables(slug, cp.sectorTables(slug, 'health'));
  const base = `/counties/${slug}/health/`;
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Health" title="Health"
        sub={`Health services and disease in ${m.name} County, 2019 to 2023, from the county statistical abstract: each table as KNBS and the county printed it, with its page.`}
        path={base} shareText={`${m.name}: health statistics`} />
      <PageToc items={tables.map((t) => [`t-${t.id}`, t.title.replace(/^Table [\d.]+:\s*/, '').replace(/ by Sub County.*| \d{4}-\d{4}$/, '')])} />
      <section className="card gold" aria-labelledby="h-read">
        <h2 id="h-read">How to read this page</h2>
        <CountyProvisional counts={cp.counts(slug)} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Every table is reproduced row by row as printed in the Kisumu County Statistical Abstract 2024 (KNBS with the County Government); the source line under each table names the county department that supplied it. Most figures are administrative records (counts of cases, beds or staff), not survey estimates.</li>
          <li>Rows are KNBS sub-counties or wards as printed, including Kadibo, which has no IEBC constituency. A sub-county total is never shared out to wards, and a cell the abstract does not print is shown as not printed.</li>
          <li>Two tables print each sub-county twice, once per age group (HIV clients on treatment; malaria cases): the age group is part of the row label. In the HIV table, 2023 shows more males than females in every row, the reverse of 2020-2022; the columns may be swapped in print. The values are kept as printed, at confidence 2 of 5.</li>
          <li>Household-survey health indicators (KDHS 2022) are on the <Link href={`/counties/${slug}/indicators/`}>indicators</Link> page.</li>
        </ul>
      </section>
      <AbstractTables tables={tables} />
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={base} />
  </>);
}
