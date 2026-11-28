import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('economy');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/economy/`, { title: `${m.name}: trade and markets`, description: `${m.name} County trade statistics from the KNBS County Statistical Abstract 2024: weights and measures verification and market sheds by sub-county, 2019-2023, as printed with page references.` });
}

export default function CountyEconomy({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="economy" sector="economy" title="Trade and markets"
    sub="Weights and measures verification and market sheds in Kisumu County, 2019 to 2023, as the county statistical abstract prints them."
    notes={['These are counts of county trade services, not measures of the size of the economy. County output (gross county product) is not yet published for Kisumu here; the economy figures held for Kisumu so far are listed on the indicators page.']}
    also={[[`/counties/${slug}/indicators/`, 'indicators (poverty, crops)'], [`/counties/${slug}/ledger/`, 'own-source revenue in the fiscal ledger'], ['/learn/#own-source-revenue', 'own-source revenue explained']]} />;
}
