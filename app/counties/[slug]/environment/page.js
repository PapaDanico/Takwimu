import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('environment');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/environment/`, { title: `${m.name}: water and environment`, description: `${m.name} County water and environment statistics from the KNBS County Statistical Abstract 2024: rainfall by station and quarter, piped water connections, tree planting, forest cover, solid waste and environmental audits, 2019-2023, as printed with page references.` });
}

export default function CountyEnvironment({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="environment" sector="water/environment" title="Water and environment"
    sub="Rainfall, piped water connections, tree planting, forest cover, solid waste and conservation in Kisumu County, 2019 to 2023, as the county statistical abstract prints them."
    notes={['Piped water connections (Table 3.1.4) are printed by sub-county only here; the county total is on the indicators page and is not added up again.', 'Rainfall is measured at named stations, not averaged over the county. Water service coverage reported by WASREB and KIWASCO is on the indicators page and is not merged with these connection counts.']}
    also={[[`/counties/${slug}/indicators/`, 'indicators (WASREB, KIWASCO)']]} />;
}
