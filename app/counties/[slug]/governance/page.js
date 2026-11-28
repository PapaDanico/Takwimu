import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('governance');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/governance/`, { title: `${m.name}: governance and public services`, description: `${m.name} County governance statistics from the KNBS County Statistical Abstract 2024: Huduma Centre customer flow by month, 2019-2023, as printed; registered voters by ward are on the wards page.` });
}

export default function CountyGovernance({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="governance" sector="governance" title="Governance and public services" exclude={['csa24-1.7.1']}
    sub="Use of the Huduma Centre in Kisumu County, month by month, 2019 to 2023, as the county statistical abstract prints it."
    notes={['Customer flow counts visits to the Huduma Centre, not distinct people. Audit opinions on the county accounts are on the audit page; registered voters by ward (abstract Table 1.7.1) are on the wards page.']}
    also={[[`/counties/${slug}/audits/`, 'audit opinions'], [`/counties/${slug}/wards/`, 'registered voters by ward']]} />;
}
