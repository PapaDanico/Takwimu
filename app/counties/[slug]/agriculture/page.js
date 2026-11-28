import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('agriculture');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/agriculture/`, { title: `${m.name}: agriculture and fisheries`, description: `${m.name} County agriculture, livestock and fisheries statistics from the KNBS County Statistical Abstract 2024: milk coolers, beehives, irrigation, beach management units, fishing boats, aquaculture, sugar and rice processing and sugarcane acreage by sub-county, 2019-2023, as printed with page references.` });
}

export default function CountyAgriculture({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="agriculture" sector="agriculture/fisheries" title="Agriculture and fisheries"
    sub="Dairy, beekeeping, irrigation, Lake Victoria fisheries, aquaculture and agro-processing in Kisumu County, 2019 to 2023, as the county statistical abstract prints them."
    notes={['Beach management units (Table 2.3.12) and fishing boats (Table 2.3.17) are printed by sub-county only here; their county totals are on the indicators page and are not added up again.', 'These are counts of facilities, groups and acreage reported by county departments, not production or income. Crop and fish production figures held for Kisumu are on the indicators page.']}
    also={[[`/counties/${slug}/indicators/`, 'indicators (crops, fisheries)'], [`/counties/${slug}/wards/`, 'wards and constituencies']]} />;
}
